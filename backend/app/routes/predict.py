from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json

router = APIRouter()

class PredictionRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    ph: float
    n: float
    p: float
    k: float
    budget: float

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml")
MODEL_PATH = os.path.join(MODEL_DIR, "crop_model.json")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.json")

# Try importing xgboost and loading the model globally
xgb_model = None
labels_dict = None

try:
    import xgboost as xgb
    import numpy as np
    
    if os.path.exists(MODEL_PATH) and os.path.exists(LABEL_ENCODER_PATH):
        xgb_model = xgb.XGBClassifier()
        xgb_model.load_model(MODEL_PATH)
        with open(LABEL_ENCODER_PATH, 'r') as f:
            labels_dict = json.load(f)
        print("✅ XGBoost Model successfully loaded for predictions.")
    else:
        print("⚠️ Model files not found. Falling back to rule-based predictions.")
except ImportError:
    print("⚠️ XGBoost is not installed in this environment. Falling back to rule-based predictions.")


def mock_prediction(data: PredictionRequest):
    # Fallback rule-based logic
    if data.rainfall > 150 and data.budget > 10000:
        crop = "Sugarcane"
        conf = 88.0
    elif data.rainfall > 100 and data.temperature > 25:
        crop = "Rice"
        conf = 92.0
    elif data.n > 40 and data.budget > 5000:
        crop = "Wheat"
        conf = 85.0
    else:
        crop = "Corn"
        conf = 75.0
        
    return {
        "recommendedCrop": crop,
        "confidence": conf,
        "reasons": ["(Fallback) Based on rule-based heuristics due to missing XGBoost model."],
        "featureImportance": {"rainfall": 0.4, "temperature": 0.3, "budget": 0.3}
    }


@router.post("")
async def predict_crop(data: PredictionRequest):
    # Try real ML prediction first
    if xgb_model is not None and labels_dict is not None:
        try:
            # Prepare feature array in the exact order the model expects
            features = np.array([[
                data.temperature, data.humidity, data.rainfall, 
                data.ph, data.n, data.p, data.k, data.budget
            ]])
            
            # Predict
            pred_idx = xgb_model.predict(features)[0]
            probabilities = xgb_model.predict_proba(features)[0]
            confidence = float(probabilities[pred_idx]) * 100  # Convert to percentage
            
            # Decode label
            crop_name = labels_dict.get(str(pred_idx), "Unknown")
            
            return {
                "recommendedCrop": crop_name,
                "confidence": confidence,
                "reasons": [
                    f"XGBoost model predicted {crop_name} with {confidence:.1f}% confidence.",
                    "Analyzed 8 soil, weather, and financial features."
                ],
                "featureImportance": {
                    "temperature": 0.25,
                    "rainfall": 0.25,
                    "n": 0.2,
                    "budget": 0.3
                }
            }
        except Exception as e:
            print(f"ML Prediction failed: {e}. Using fallback.")
            
    # Fallback to rules
    return mock_prediction(data)
