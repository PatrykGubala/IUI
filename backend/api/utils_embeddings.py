import requests

OLLAMA_URL = "http://localhost:11434//api/embed"
EMBED_MODEL = "nomic-embed-text"

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

    # /api/embed zwraca embeddings (lista); przy input string zwykle 1 element
    if "embeddings" in data:
        return data["embeddings"][0]

    # opcjonalny fallback, gdybyś jednak uderzał w starszy endpoint /api/embeddings
    if "embedding" in data:
        return data["embedding"]

    raise KeyError(f"Unexpected Ollama response keys: {list(data.keys())}")