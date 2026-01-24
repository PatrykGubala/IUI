import math

def cosine(a, b):
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(y*y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)

def build_tag_vector(tags, vocab):
    s = set(tags or [])
    return [1 if t in s else 0 for t in vocab]
