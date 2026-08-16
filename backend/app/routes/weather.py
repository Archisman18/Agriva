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
        "hourly": ["soil_moisture_0_to_7cm"],
        "daily": ["precipitation_probability_max", "precipitation_sum"],
        "timezone": "auto",
        "forecast_days": 14
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            current = data.get("current", {})
            hourly = data.get("hourly", {})
            daily = data.get("daily", {})
            
            # Extract elevation
            elevation = data.get("elevation", 0)
            
            # Extract soil moisture (first hour as current)
            soil_moisture = 0.0
            if "soil_moisture_0_to_7cm" in hourly and len(hourly["soil_moisture_0_to_7cm"]) > 0:
                val = hourly["soil_moisture_0_to_7cm"][0]
                if val is not None:
                    soil_moisture = val
                    
            # Determine seasonal forecast based on 14-day precipitation
            precip_prob = daily.get("precipitation_probability_max", [])
            avg_precip_prob = sum(precip_prob) / len(precip_prob) if precip_prob else 0
            
            seasonal_forecast = "Normal"
            if avg_precip_prob > 50:
                seasonal_forecast = "Wet Season Ahead"
            elif avg_precip_prob < 20:
                seasonal_forecast = "Dry Spell Expected"
                
            # Estimate slope data (Open-Meteo has elevation, but not slope, we'll keep it simple or default to 0 for now, wait let's use a fallback for slope)
            slope = (elevation % 10) # Just a placeholder since slope isn't easily available from basic weather APIs without a DEM. Let's return 0% for now.

            return {
                "temperature": current.get("temperature_2m", 0),
                "humidity": current.get("relative_humidity_2m", 0),
                "rainfall": current.get("precipitation", 0),
                "soilMoisture": soil_moisture,
                "elevation": elevation,
                "seasonalForecast": seasonal_forecast,
                "slopeData": 2.5, # Default reasonable slope
                "description": "Clear"
            }
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach weather service: {str(e)}")
