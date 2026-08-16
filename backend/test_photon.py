import httpx
import asyncio
import json

async def test():
    url = "https://photon.komoot.io/api/"
    params = {"q": "Nile", "limit": 5, "lang": "en"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            print(resp.status_code)
            with open("test_photon.json", "w", encoding="utf-8") as f:
                f.write(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
