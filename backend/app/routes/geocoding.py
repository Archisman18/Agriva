from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("/search")
async def search_location(q: str = Query(..., description="Location to search")):
    # Proxy to Nominatim OpenStreetMap API
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "Agriva/1.0"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                return []
                
            return [
                {
                    "lat": float(data[0]["lat"]),
                    "lon": float(data[0]["lon"]),
                    "display_name": data[0]["display_name"]
                }
            ]
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach geocoding service: {str(e)}")
