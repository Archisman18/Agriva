from fastapi import APIRouter, Body
from typing import Dict, Any, List

router = APIRouter()

@router.post("")
async def predict_crop(data: Dict[str, Any] = Body(...)):
    # This is a placeholder for the XGBoost model prediction.
    # We would load the model from app.ml.crop_model and call predict(data)
    
    soil_type = data.get("soilType", "Unknown")
    temperature = data.get("temperature", 25)
    budget = float(data.get("budget", 0) or 0)
    
    recommended_crop = "Corn"
    reasons = [
        "Moderate temperature is suitable for corn.",
        "Versatile crop that adapts to various soil conditions."
    ]
    
    if soil_type == "Loamy" and temperature > 20:
        recommended_crop = "Wheat"
        reasons = ["Loamy soil and warm temperatures are ideal for wheat cultivation."]
    elif budget > 5000:
        recommended_crop = "Tomatoes"
        reasons = ["Higher budget allows for necessary irrigation and pest control for tomatoes."]
        
    feature_importance = {
        "temperature": 0.35,
        "soilType": 0.25,
        "rainfall": 0.20,
        "ph": 0.10,
        "budget": 0.10
    }
    
    return {
        "recommendedCrop": recommended_crop,
        "confidence": 85.5,
        "reasons": reasons,
        "featureImportance": feature_importance
    }
