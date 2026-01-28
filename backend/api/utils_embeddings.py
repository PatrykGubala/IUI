import requests

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

def build_profile_text(user: "CustomUser") -> str:
    tags = ", ".join(user.tags or [])
    return "\n".join([
        user.bio or "",
        f"occupation: {user.occupation or ''}",
        f"university: {user.university or ''}",
        f"city: {user.city or ''}",
        f"country: {user.country or ''}",
        f"tags: {tags}",
    ]).strip()

def get_embedding(text: str) -> list[float]:
    r = requests.post(OLLAMA_URL, json={"model": EMBED_MODEL, "prompt": text}, timeout=30)
    r.raise_for_status()
    return r.json()["embedding"]
