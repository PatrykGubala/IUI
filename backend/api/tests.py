from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
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
            username="me", email="me@test.com", password="pass12345"
        )
        self.me.gender = "M"
        self.me.interested_in = ["F"]
        self.me.tags = ["python", "fitness"]
        self.me.max_distance = 20
        self.me.save()

        self.u1 = CustomUser.objects.create_user(
            username="u1", email="u1@test.com", password="pass12345"
        )
        self.u1.gender = "F"
        self.u1.interested_in = ["M"]
        self.u1.tags = ["python", "netflix"]
        self.u1.save()

        self.u2 = CustomUser.objects.create_user(
            username="u2", email="u2@test.com", password="pass12345"
        )
        self.u2.gender = "F"
        self.u2.interested_in = ["M"]
        self.u2.tags = ["travel"]
        self.u2.save()

        self.u3 = CustomUser.objects.create_user(
            username="u3", email="u3@test.com", password="pass12345"
        )
        self.u3.gender = "F"
        self.u3.interested_in = ["M"]
        self.u3.tags = ["python", "fitness", "netflix"]
        self.u3.save()

        self.client.force_authenticate(user=self.me)

    def test_feed_requires_auth(self):
        self.client.force_authenticate(user=None)
        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


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

        scores = [item["score"] for item in res.data]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_feed_prefers_more_similar_user(self):
        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        returned_ids = [item["user"]["id"] for item in res.data]

        self.assertTrue(returned_ids.index(self.u3.id) < returned_ids.index(self.u1.id))
        self.assertTrue(returned_ids.index(self.u1.id) < returned_ids.index(self.u2.id))

    def test_feed_filters_by_mutual_interest(self):
        u4 = CustomUser.objects.create_user(username="u4", email="u4@test.com", password="pass12345")
        u4.gender = "M"
        u4.interested_in = ["M"]
        u4.save()

        u5 = CustomUser.objects.create_user(username="u5", email="u5@test.com", password="pass12345")
        u5.gender = "F"
        u5.interested_in = ["F"]
        u5.save()

        url = reverse("potential_matches")
        res = self.client.get(url)
        returned_ids = [item["user"]["id"] for item in res.data]

        self.assertNotIn(u4.id, returned_ids)
        self.assertNotIn(u5.id, returned_ids)

    def test_feed_filters_by_distance_20km(self):
        self.me.latitude = 50.883333
        self.me.longitude = 20.616667
        self.me.save()

        self.u1.latitude = 50.87033
        self.u1.longitude = 20.62752
        self.u1.save()

        self.u2.latitude = 52.2297
        self.u2.longitude = 21.0122
        self.u2.save()

        self.u3.latitude = 50.90
        self.u3.longitude = 20.60
        self.u3.save()

        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        returned_ids = [item["user"]["id"] for item in res.data]

        self.assertIn(self.u1.id, returned_ids)
        self.assertIn(self.u3.id, returned_ids)
        self.assertNotIn(self.u2.id, returned_ids)

    def test_feed_filters_by_age_range(self):
        self.me.age = 25
        self.me.max_age_diff = 2
        self.me.save()

        self.u1.age = 23
        self.u1.save()

        self.u2.age = 28
        self.u2.save()

        self.u3.age = 27
        self.u3.save()

        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        returned_ids = [item["user"]["id"] for item in res.data]
        self.assertIn(self.u1.id, returned_ids)
        self.assertIn(self.u3.id, returned_ids)
        self.assertNotIn(self.u2.id, returned_ids)

    def test_feed_excludes_candidates_without_age_when_filtering(self):
        self.me.age = 25
        self.me.max_age_diff = 10
        self.me.save()

        self.u1.age = None
        self.u1.save()

        url = reverse("potential_matches")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        returned_ids = [item["user"]["id"] for item in res.data]
        self.assertNotIn(self.u1.id, returned_ids)

