from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("/search")
async def search_location(q: str = Query(..., description="Location to search")):
    # Use Photon API (Komoot) which is much faster and designed specifically for autocomplete/typeahead compared to Nominatim
    url = "https://photon.komoot.io/api/"
    params = {
        "q": q,
        "limit": 5,
        "lang": "en"
    }
    headers = {
        "User-Agent": "Agriva/1.0 (contact: your-email@example.com)"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            features = data.get("features", [])
            if not features:
                return []
                
            results = []
            for feature in features:
                coords = feature.get("geometry", {}).get("coordinates", [0, 0])
                props = feature.get("properties", {})
                
                # Format a nice display name
                name = props.get("name", "")
                state = props.get("state", "")
                country = props.get("country", "")
                
                parts = [p for p in [name, state, country] if p]
                display_name = ", ".join(parts) if parts else "Unknown Location"
                
                # Photon returns [lon, lat]
                results.append({
                    "lat": float(coords[1]),
                    "lon": float(coords[0]),
                    "display_name": display_name
                })
                
            return results
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach geocoding service: {str(e)}")
