from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("")
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude")
):
    # Free Open-Meteo API for real weather data
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation"],
        "timezone": "auto"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            current = data.get("current", {})
            return {
                "temperature": current.get("temperature_2m", 0),
                "humidity": current.get("relative_humidity_2m", 0),
                "rainfall": current.get("precipitation", 0),
                "description": "Clear" # Open-Meteo current doesn't give text description directly without WMO codes
            }
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach weather service: {str(e)}")
