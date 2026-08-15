from fastapi import APIRouter, HTTPException, Query
import httpx
import random

router = APIRouter()

@router.get("")
async def get_soil(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude")
):
    # In a real scenario, this would proxy to SoilGrids API.
    # ISRIC SoilGrids REST API can be complex to integrate for simple lat/lng to soil type quickly.
    # We'll simulate a realistic response based on coordinates to represent the integration.
    
    # Simple hash of lat/lng to keep results consistent for the same location
    seed = int(abs(lat) * 100 + abs(lng) * 100)
    random.seed(seed)
    
    soil_types = ['Loamy', 'Sandy', 'Clayey', 'Silty', 'Peaty', 'Chalky']
    
    return {
        "soilType": random.choice(soil_types),
        "ph": round(random.uniform(5.5, 8.5), 1),
        "nitrogen": round(random.uniform(10, 50), 1),
        "phosphorus": round(random.uniform(5, 30), 1),
        "potassium": round(random.uniform(50, 200), 1)
    }
