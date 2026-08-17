from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("/search")
async def search_location(q: str = Query(..., description="Location to search")):
    q_clean = q.strip()
    if not q_clean or len(q_clean) < 2:
        return []
        
    async with httpx.AsyncClient(timeout=5.0) as client:
        # 1. Primary: High-precision Nominatim OpenStreetMap Search (full POIs, institutions, villages, landmarks)
        try:
            nom_url = "https://nominatim.openstreetmap.org/search"
            headers = {
                "User-Agent": "AgrivaPrecisionFarmingApp/2.1 (contact: team@agriva.ai)",
                "Accept-Language": "en-US,en;q=0.9"
            }
            nom_params = {
                "q": q_clean,
                "format": "jsonv2",
                "addressdetails": "1",
                "limit": "6"
            }
            resp = await client.get(nom_url, params=nom_params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    return [
                        {
                            "lat": float(item["lat"]),
                            "lon": float(item["lon"]),
                            "display_name": item.get("display_name", "")
                        }
                        for item in data
                    ]
        except Exception as e:
            print(f"Nominatim precision search error: {e}")

        # 2. Fast Fallback: Open-Meteo Geocoding
        try:
            open_meteo_url = "https://geocoding-api.open-meteo.com/v1/search"
            params = {
                "name": q_clean,
                "count": 6,
                "language": "en",
                "format": "json"
            }
            resp = await client.get(open_meteo_url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    name = item.get("name", "")
                    admin1 = item.get("admin1", "")
                    country = item.get("country", "")
                    parts = [p for p in [name, admin1, country] if p]
                    results.append({
                        "lat": float(item["latitude"]),
                        "lon": float(item["longitude"]),
                        "display_name": ", ".join(parts) if parts else name
                    })
                if results:
                    return results
        except Exception as e:
            print(f"Open-Meteo fallback error: {e}")

    return []
