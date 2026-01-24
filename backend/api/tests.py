from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

from .models import CustomUser, Swipe
from .utils import build_tag_vector, cosine


class UtilsTests(TestCase):

    def test_build_tag_vector_basic(self):
        tags = ["python", "fitness"]
        vocab = ["fitness", "netflix", "python", "travel"]
        self.assertEqual(build_tag_vector(tags, vocab), [1, 0, 1, 0])

    def test_build_tag_vector_empty_tags(self):
        tags = []
        vocab = ["a", "b", "c"]
        self.assertEqual(build_tag_vector(tags, vocab), [0, 0, 0])


    def test_build_tag_vector_empty_vocab(self):
        tags = ["python"]
        vocab = []
        self.assertEqual(build_tag_vector(tags, vocab), [])

    def test_build_tag_vector_ignores_tags_not_in_vocab(self):
        tags = ["python", "not_in_vocab"]
        vocab = ["python"]
        self.assertEqual(build_tag_vector(tags, vocab), [1])

    # --- cosine ---

    def test_cosine_basic(self):
        a = [1, 0, 1, 0]
        b = [1, 0, 0, 1]
        self.assertAlmostEqual(cosine(a, b), 0.5, places=6)

    def test_cosine_identical_vectors_is_one(self):
        a = [1, 0, 1, 0]
        b = [1, 0, 1, 0]
        self.assertAlmostEqual(cosine(a, b), 1.0, places=6)

    def test_cosine_no_overlap_is_zero(self):
        a = [1, 0, 0, 0]
        b = [0, 1, 0, 0]
        self.assertAlmostEqual(cosine(a, b), 0.0, places=6)

    def test_cosine_superset_case(self):
        a = [1, 1, 0]
        b = [1, 1, 1]
        self.assertAlmostEqual(cosine(a, b), 0.81649658, places=6)

    def test_cosine_zero_vector(self):
        self.assertEqual(cosine([0, 0], [1, 0]), 0.0)
        self.assertEqual(cosine([1, 0], [0, 0]), 0.0)

    def test_cosine_symmetry(self):
        a = [1, 2, 0]
        b = [2, 1, 0]
        self.assertAlmostEqual(cosine(a, b), cosine(b, a), places=12)



class FeedDebugTests(APITestCase):
    def setUp(self):
        self.me = CustomUser.objects.create_user(
            username="me",
            email="me@test.com",
            password="pass12345"
        )
        self.me.tags = ["python", "fitness"]
        self.me.save()

        self.u1 = CustomUser.objects.create_user(
            username="u1",
            email="u1@test.com",
            password="pass12345"
        )
        self.u1.tags = ["python", "netflix"]  # 1 similar tag
        self.u1.save()



        self.u2 = CustomUser.objects.create_user(
            username="u2",
            email="u2@test.com",
            password="pass12345"
        )
        self.u2.tags = ["travel"]  # no tags
        self.u2.save()

        self.u3 = CustomUser.objects.create_user(
            username="u3",
            email="u3@test.com",
            password="pass12345"
        )
        self.u3.tags = ["python", "fitness", "netflix"]  # 2 similar tag
        self.u3.save()

        self.client.force_authenticate(user=self.me)

    def test_feed_requires_auth(self):
        self.client.force_authenticate(user=None)
        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_feed_excludes_self_and_admin_and_swiped(self):
        # admin
        admin = CustomUser.objects.create_user(
            username="admin1",
            email="admin1@test.com",
            password="pass12345"
        )
        admin.role = "admin"
        admin.save()

        # oznacz u2 jako już swipnięty
        Swipe.objects.create(actor=self.me, target=self.u2, action=Swipe.PASS)

        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # w wersji debug: lista dictów, gdzie "user" trzyma dane usera
        returned_ids = [item["user"]["id"] for item in res.data]

        self.assertNotIn(self.me.id, returned_ids)     # nie pokazuj mnie
        self.assertNotIn(admin.id, returned_ids)       # nie pokazuj admina
        self.assertNotIn(self.u2.id, returned_ids)     # nie pokazuj swipniętego

    def test_feed_debug_payload_and_sorted(self):
        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)
        self.assertGreaterEqual(len(res.data), 1)

        first = res.data[0]
        self.assertIn("score", first)
        self.assertIn("common", first)
        self.assertIn("cosine", first)
        self.assertIn("user", first)

        # posortowane malejąco po score
        scores = [item["score"] for item in res.data]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_feed_prefers_more_similar_user(self):
        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        returned_ids = [item["user"]["id"] for item in res.data]

        # u3 ma python+fitness (czyli dokładnie Twoje) + netflix, powinien być najwyżej
        self.assertTrue(returned_ids.index(self.u3.id) < returned_ids.index(self.u1.id))
        self.assertTrue(returned_ids.index(self.u1.id) < returned_ids.index(self.u2.id))
