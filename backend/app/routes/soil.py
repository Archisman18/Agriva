from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

REGIONAL_SOIL_TEXTURES = {
    "jammu": "Gravelly sandy loam to silt loam",
    "kashmir": "Gravelly sandy loam to silt loam",
    "ladakh": "Gravelly sandy loam to silt loam",
    "himachal": "Loam and silt loam in valleys; gravelly clay on slopes",
    "uttarakhand": "Stony coarse sandy loam to fertile clay loam",
    "punjab": "Deep sandy loam, loam, and silt loam",
    "haryana": "Sandy loam to clay loam",
    "delhi": "Sandy loam to silt loam on the Indo-Gangetic alluvial plain",
    "rajasthan": "Coarse sand, loamy sand, and sandy loam",
    "gujarat": "Sandy clay loam to heavy clayey black soil",
    "madhya pradesh": "Deep fine clayey black soil with sandy loam",
    "chhattisgarh": "Gravelly sandy loam to heavy clayey soil",
    "uttar pradesh": "Silt loam, sandy loam, and heavy clay loam",
    "bihar": "Fertile silt loam and sandy clay loam",
    "west bengal": "Alluvial loam and deltaic silt clay to lateritic loam",
    "jharkhand": "Gravelly sandy clay loam and red loam",
    "odisha": "Red sandy loam to heavy deltaic clay",
    "assam": "Acidic silty loam and rich alluvial loam",
    "meghalaya": "Fine silty loam to acidic lateritic clayey loam",
    "nagaland": "Fine silty loam to acidic lateritic clayey loam",
    "manipur": "Fine silty loam to acidic lateritic clayey loam",
    "mizoram": "Fine silty loam to acidic lateritic clayey loam",
    "tripura": "Fine silty loam to acidic lateritic clayey loam",
    "arunachal": "Fine silty loam to acidic lateritic clayey loam",
    "sikkim": "Fine silty loam to acidic lateritic clayey loam",
    "maharashtra": "Deep fine clayey black soil; gravelly lateritic loam in Konkan",
    "karnataka": "Red sandy loam to deep clayey and lateritic clay",
    "andhra pradesh": "Light red sandy loam to deep deltaic black clay",
    "telangana": "Light red sandy loam to deep deltaic black clay",
    "tamil nadu": "Red loam, black clayey soil, and coastal sand",
    "kerala": "Acidic lateritic gravelly clay to coastal peaty clay",
}

def regional_texture(location: str | None) -> str | None:
    if not location:
        return None
    normalized = location.lower().replace("&amp;", "&")
    for region, texture in REGIONAL_SOIL_TEXTURES.items():
        if region in normalized:
            return texture
    return None

@router.get("")
async def get_soil(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    location: str | None = Query(None, description="Selected city or region")
):
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lat": lat,
        "lon": lng,
        "property": ["phh2o", "nitrogen", "sand", "silt", "clay"],
        "depth": "0-5cm",
        "value": "mean"
    }
    
    # Keep the response explicit when SoilGrids has no coverage at a coordinate.
    soil_data = {
        "soilType": "Soil data unavailable",
        "ph": None,
        "nitrogen": None,
        "phosphorus": 15.0, # Not reliably in soilgrids default, keep mock
        "potassium": 100.0,  # Not reliably in soilgrids default, keep mock
        "soilMoisture": None,
        "source": "SoilGrids returned no measurements for these coordinates"
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

                if extracted:
                    soil_data["source"] = "ISRIC SoilGrids"
                
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

    supplied_texture = regional_texture(location)
    if supplied_texture:
        soil_data["soilType"] = supplied_texture
        soil_data["source"] = f"Agriva regional soil dataset ({location})"

    if soil_data["soilType"] == "Soil data unavailable":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                moisture_response = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lng,
                        "hourly": "soil_moisture_0_to_7cm",
                        "forecast_days": 1,
                        "timezone": "auto",
                    },
                    headers={"User-Agent": "AgrivaPrecisionFarmingApp/2.1"},
                )
                moisture_response.raise_for_status()
                hourly = moisture_response.json().get("hourly", {})
                values = hourly.get("soil_moisture_0_to_7cm", [])
                if values and values[0] is not None:
                    soil_data["soilMoisture"] = values[0]
                    soil_data["source"] = "Open-Meteo soil moisture; soil texture unavailable"
        except Exception as e:
            print(f"Open-Meteo soil moisture fallback error: {e}")
        
    return soil_data
