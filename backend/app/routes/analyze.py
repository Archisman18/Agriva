from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any
import httpx
from app.config import settings
import json

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

@router.post("")
async def analyze_field(data: Dict[str, Any] = Body(...)):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")
        
    system_prompt = """
You are an expert agricultural AI. Analyze the provided field data and return a JSON object with your recommendations.
You MUST return ONLY valid JSON.
The JSON object must have exactly the following structure:
{
  "cropSuitability": {
    "suitability": "string (e.g. Highly Suitable, Moderately Suitable, Not Recommended)",
    "reasons": ["string", "string"]
  },
  "bestCropRecommendation": {
    "recommendedCrop": "string",
    "reasons": ["string", "string"]
  },
  "climateRisks": {
    "floodRisk": "string (Low, Medium, High)",
    "droughtRisk": "string (Low, Medium, High)"
  },
  "cropRotationPlanner": {
    "rotationStrategy": "string",
    "recommendedCrops": ["string", "string"],
    "benefits": ["string", "string"]
  },
  "recommendations": {
    "idealSoil": "string",
    "idealWater": "string",
    "idealTemperature": "string",
    "growingSeason": "string",
    "expectedYield": "string",
    "requiredInputs": "string"
  }
}
"""

    user_prompt = f"Field Data:\n{json.dumps(data, indent=2)}\nPlease provide the analysis in the requested JSON format."
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                    "max_tokens": 2048,
                }
            )
        
        if response.status_code != 200:
            print(f"Groq API Error: {response.status_code} {response.text}")
            raise Exception(f"Groq returned {response.status_code}")
            
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Parse JSON
        parsed_content = json.loads(content)
        return parsed_content
        
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to run AI analysis")
