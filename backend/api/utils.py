import math, requests
from math import radians, cos, sin, asin, sqrt

def reverse_geocode_city(lat: float, lon: float):
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"lat": lat, "lon": lon, "format": "jsonv2"}
    headers = {"User-Agent": "your-app-name"}  # ważne dla Nominatim [web:340]

    r = requests.get(url, params=params, headers=headers, timeout=10)
    r.raise_for_status()
    data = r.json()

    address = data.get("address", {})
    city = address.get("city") or address.get("town") or address.get("village") or ""
    country = address.get("country") or ""
    return city, country

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

def distance_km(lat1, lon1, lat2, lon2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return 6371 * c