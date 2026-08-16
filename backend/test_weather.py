import asyncio
import httpx

async def test_weather():
    lat = 30.0444
    lng = 31.2357
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation"],
        "hourly": ["soil_moisture_0_to_7cm"],
        "timezone": "auto"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        print("Elevation:", data.get("elevation"))
        print("Current:", data.get("current"))
        if "hourly" in data:
            print("Soil moisture (first):", data["hourly"]["soil_moisture_0_to_7cm"][0])
        else:
            print("No hourly data")

asyncio.run(test_weather())
