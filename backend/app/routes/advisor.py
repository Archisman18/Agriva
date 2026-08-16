from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, List
import httpx
from app.config import settings

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

@router.post("/chat")
async def chat_with_advisor(data: Dict[str, Any] = Body(...)):
    message = data.get("message")
    context = data.get("context", {})
    history = data.get("history", [])
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
        
    if not settings.groq_api_key:
        return {"reply": "The AI API key is not configured. Please set the GROQ_API_KEY environment variable in your .env file."}
        
    try:
        # Construct system prompt from context
        system_prompt = "You are an expert agricultural field advisor for Agriva. You are assisting a farmer with their field analysis.\n"
        if context:
            system_prompt += "Here is the context of the farmer's field:\n"
            if context.get("soilType"): system_prompt += f"- Soil Type: {context['soilType']}\n"
            if context.get("budget"): system_prompt += f"- Budget: ${context['budget']}\n"
            if context.get("desiredCrop"): system_prompt += f"- Desired Crop: {context['desiredCrop']}\n"
            if context.get("climateRisks"):
                risks = context['climateRisks']
                system_prompt += f"- Climate Risks: Flood Risk - {risks.get('floodRisk')}, Drought Risk - {risks.get('droughtRisk')}\n"
        
        system_prompt += "\nAnswer the user's questions clearly, concisely, and based on best agricultural practices. If asked about something outside agriculture, politely decline."
        
        # Build messages array (OpenAI-compatible format)
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in history:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})
        
        # Add the current user message
        messages.append({"role": "user", "content": message})
        
        # Call Groq API
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
                    "temperature": 0.7,
                    "max_tokens": 1024,
                }
            )
        
        if response.status_code != 200:
            print(f"Groq API Error: {response.status_code} {response.text}")
            raise Exception(f"Groq returned {response.status_code}")
        
        result = response.json()
        reply = result["choices"][0]["message"]["content"]
        print(f"✅ AI Advisor responded via Groq (llama-3.3-70b-versatile)")
        
        return {"reply": reply}
        
    except Exception as e:
        print(f"AI Advisor Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI Advisor")
