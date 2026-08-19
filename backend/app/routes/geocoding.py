from fastapi import APIRouter, Query
import httpx
import asyncio
from typing import List, Dict, Any

router = APIRouter()

# In-memory cache for instant responses on repeated or common queries
SEARCH_CACHE: Dict[str, List[Dict[str, Any]]] = {}

async def fetch_photon(client: httpx.AsyncClient, query: str) -> List[Dict[str, Any]]:
    try:
        url = "https://photon.komoot.io/api/"
        resp = await client.get(url, params={"q": query, "limit": 6}, timeout=1.8)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for feat in data.get("features", []):
                coords = feat.get("geometry", {}).get("coordinates", [])
                props = feat.get("properties", {})
                name = props.get("name", "")
                country = props.get("country", "")
                state = props.get("state", "")
                city = props.get("city", "")
                district = props.get("district", "")
                parts = [p for p in [name, district, city, state, country] if p]
                # Deduplicate consecutive terms
                deduped = []
                for p in parts:
                    if not deduped or p.lower() != deduped[-1].lower():
                        deduped.append(p)
                if len(coords) >= 2:
                    results.append({
                        "lat": float(coords[1]),
                        "lon": float(coords[0]),
                        "display_name": ", ".join(deduped) if deduped else name
                    })
            return results
    except Exception:
        pass
    return []

async def fetch_open_meteo(client: httpx.AsyncClient, query: str) -> List[Dict[str, Any]]:
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": query, "count": 6, "language": "en", "format": "json"}
        resp = await client.get(url, params=params, timeout=1.8)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for item in data.get("results", []):
                name = item.get("name", "")
                admin1 = item.get("admin1", "")
                country = item.get("country", "")
                parts = [p for p in [name, admin1, country] if p]
                lat = float(item.get("latitude", 0))
                lon = float(item.get("longitude", 0))
                if lat != 0 and lon != 0:
                    results.append({
                        "lat": lat,
                        "lon": lon,
                        "display_name": ", ".join(parts) if parts else name
                    })
            return results
    except Exception:
        pass
    return []

async def fetch_nominatim(client: httpx.AsyncClient, query: str) -> List[Dict[str, Any]]:
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "AgrivaPrecisionApp/3.0 (agriva@agricultural-planner.ai)",
            "Accept-Language": "en-US,en;q=0.9"
        }
        params = {
            "q": query,
            "format": "jsonv2",
            "addressdetails": "1",
            "limit": "6"
        }
        resp = await client.get(url, params=params, headers=headers, timeout=2.0)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                results = []
                for item in data:
                    lat = float(item.get("lat", 0))
                    lon = float(item.get("lon", 0))
                    name = item.get("display_name", "")
                    if lat != 0 and lon != 0 and name:
                        results.append({"lat": lat, "lon": lon, "display_name": name})
                return results
    except Exception:
        pass
    return []

@router.get("/search")
async def search_location(q: str = Query(..., description="Location to search")):
    q_clean = q.strip().lower()
    if not q_clean or len(q_clean) < 2:
        return []

    # Instant cache lookup
    if q_clean in SEARCH_CACHE:
        return SEARCH_CACHE[q_clean]

    async with httpx.AsyncClient() as client:
        # Run fast engines concurrently (Photon and Open-Meteo take ~50-150ms)
        results = await asyncio.gather(
            fetch_photon(client, q_clean),
            fetch_open_meteo(client, q_clean),
            fetch_nominatim(client, q_clean),
            return_exceptions=True
        )

        merged: List[Dict[str, Any]] = []
        seen_coords = set()

        for res in results:
            if isinstance(res, list) and res:
                for item in res:
                    key = (round(item["lat"], 3), round(item["lon"], 3))
                    if key not in seen_coords:
                        seen_coords.add(key)
                        merged.append(item)

        if merged:
            # Store in cache (cap cache size at 500)
            if len(SEARCH_CACHE) > 500:
                SEARCH_CACHE.clear()
            SEARCH_CACHE[q_clean] = merged[:8]
            return merged[:8]

    return []
