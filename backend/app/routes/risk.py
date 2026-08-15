from fastapi import APIRouter, Body
from typing import Dict, Any

router = APIRouter()

@router.post("")
async def assess_risk(data: Dict[str, Any] = Body(...)):
    rainfall = data.get("rainfall", 0)
    soil_moisture = data.get("soilMoisture", 0.5)
    
    flood_risk = "Low"
    drought_risk = "Low"
    overall_score = 15
    
    if rainfall > 100:
        flood_risk = "High"
        overall_score += 40
    elif rainfall > 50:
        flood_risk = "Medium"
        overall_score += 20
        
    if soil_moisture < 0.2:
        drought_risk = "High"
        overall_score += 40
    elif soil_moisture < 0.4:
        drought_risk = "Medium"
        overall_score += 20
        
    return {
        "floodRisk": flood_risk,
        "droughtRisk": drought_risk,
        "overallScore": min(100, overall_score)
    }
