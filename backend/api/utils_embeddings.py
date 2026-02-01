import requests, math
from collections.abc import Sequence
import threading
from django.db import close_old_connections
OLLAMA_URL = "http://localhost:11434//api/embed"
EMBED_MODEL = "nomic-embed-text"



def l2_normalize(vec: Sequence[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return list(vec)
    return [x / norm for x in vec]

def dot(a: Sequence[float], b: Sequence[float]) -> float:
    return sum(x * y for x, y in zip(a, b))

def refresh_profile_embedding_async(user_id: int) -> None:
    def _job():
        close_old_connections()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(pk=user_id)
        refresh_profile_embedding(user)

    t = threading.Thread(target=_job, daemon=True)
    t.start()

def refresh_profile_embedding(user):
    text = build_profile_text(user)
    if not text:
        user.profile_embedding = None
        user.save(update_fields=["profile_embedding"])
        return

    user.profile_embedding = get_embedding(text)
    user.save(update_fields=["profile_embedding"])

def build_profile_text(user: "CustomUser") -> str:
    return (user.bio or "").strip()


def get_embedding(text: str) -> list[float]:
    r = requests.post(
        OLLAMA_URL,
        json={"model": EMBED_MODEL, "input": text},
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()

    if "embeddings" in data:
        return data["embeddings"][0]

    if "embedding" in data:
        return data["embedding"]

    raise KeyError(f"Unexpected Ollama response keys: {list(data.keys())}")



