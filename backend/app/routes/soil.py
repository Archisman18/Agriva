from fastapi import APIRouter, HTTPException, Query
import httpx
import random

router = APIRouter()

@router.get("")
async def get_soil(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude")
):
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lat": lat,
        "lon": lng,
        "property": ["phh2o", "nitrogen", "sand", "silt", "clay"],
        "depth": "0-5cm",
        "value": "mean"
    }
    
    # Defaults in case of missing data (e.g. over ocean)
    soil_data = {
        "soilType": "Unknown",
        "ph": 7.0,
        "nitrogen": 20.0,
        "phosphorus": 15.0, # Not reliably in soilgrids default, keep mock
        "potassium": 100.0  # Not reliably in soilgrids default, keep mock
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                url,
                params=params,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "AgrivaPrecisionFarmingApp/2.1",
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                layers = data.get("properties", {}).get("layers", [])
                
                extracted = {}
                for layer in layers:
                    name = layer.get("name")
                    depths = layer.get("depths", [])
                    if depths and len(depths) > 0:
                        val = depths[0].get("values", {}).get("mean")
                        if val is not None:
                            extracted[name] = val
                
                # Convert phh2o (pH * 10) to actual pH
                if "phh2o" in extracted:
                    soil_data["ph"] = round(extracted["phh2o"] / 10.0, 1)
                
                if "nitrogen" in extracted:
                    # cg/kg to reasonable range
                    soil_data["nitrogen"] = round(extracted["nitrogen"] / 10.0, 1)
                    
                # Determine texture class based on sand/silt/clay
                sand = extracted.get("sand", 0)
                silt = extracted.get("silt", 0)
                clay = extracted.get("clay", 0)
                
                total = sand + silt + clay
                if total > 0:
                    sand_pct = sand / total
                    clay_pct = clay / total
                    
                    if clay_pct > 0.4:
                        soil_data["soilType"] = "Clayey"
                    elif sand_pct > 0.5:
                        soil_data["soilType"] = "Sandy"
                    elif clay_pct > 0.2 and sand_pct > 0.2:
                        soil_data["soilType"] = "Loamy"
                    else:
                        soil_data["soilType"] = "Silty"
                
    except Exception as e:
        print(f"SoilGrids API Error: {e}")
        # Return defaults on error rather than crashing the flow
        pass
        
    return soil_data
