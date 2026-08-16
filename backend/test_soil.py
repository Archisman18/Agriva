import asyncio
import httpx

async def test_soil():
    lat = 30.0444
    lng = 31.2357
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lat": lat,
        "lon": lng,
        "property": ["phh2o", "nitrogen", "sand", "silt", "clay"],
        "depth": "0-5cm"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            data = response.json()
            print(data)
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(test_soil())
