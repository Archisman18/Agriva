from fastapi import APIRouter, Body
from typing import Dict, Any

router = APIRouter()

@router.post("")
async def crop_rotation(data: Dict[str, Any] = Body(...)):
    current_crop = data.get("currentCrop", "").lower()
    
    if "wheat" in current_crop:
        return {
            "rotationStrategy": "Wheat-Legume-Fallow Rotation",
            "recommendedCrops": ["Alfalfa (Legume)", "Corn"],
            "benefits": [
                "Nitrogen fixation by legumes improves soil fertility.",
                "Disrupts pest and disease cycles specific to wheat."
            ]
        }
    elif "corn" in current_crop:
        return {
            "rotationStrategy": "Corn-Soybean-Wheat Rotation",
            "recommendedCrops": ["Soybean", "Wheat"],
            "benefits": [
                "Soybeans fix nitrogen, reducing fertilizer needs for corn.",
                "Diversifies root systems, improving soil aggregation."
            ]
        }
    
    return {
        "rotationStrategy": "General Diversified Rotation",
        "recommendedCrops": ["Legumes", "Root Vegetables", "Leafy Greens"],
        "benefits": [
            "Maintains soil fertility through diverse nutrient demands.",
            "Promotes a healthy soil microbiome."
        ]
    }
