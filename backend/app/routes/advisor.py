from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, List
import google.generativeai as genai
from app.config import settings

router = APIRouter()

# Initialize Gemini if API key is present
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

@router.post("/chat")
async def chat_with_advisor(data: Dict[str, Any] = Body(...)):
    message = data.get("message")
    context = data.get("context", {})
    history = data.get("history", [])
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
        
    if not settings.gemini_api_key:
        return {"reply": "The Gemini API key is not configured. This is a placeholder response. To enable AI responses, please set the GEMINI_API_KEY environment variable."}
        
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        
        # Construct system prompt from context
        system_prompt = f"You are an expert agricultural field advisor for Agriva. You are assisting a farmer with their field analysis.\n"
        if context:
            system_prompt += f"Here is the context of the farmer's field:\n"
            if context.get("soilType"): system_prompt += f"- Soil Type: {context['soilType']}\n"
            if context.get("budget"): system_prompt += f"- Budget: ${context['budget']}\n"
            if context.get("desiredCrop"): system_prompt += f"- Desired Crop: {context['desiredCrop']}\n"
            if context.get("climateRisks"):
                risks = context['climateRisks']
                system_prompt += f"- Climate Risks: Flood Risk - {risks.get('floodRisk')}, Drought Risk - {risks.get('droughtRisk')}\n"
        
        system_prompt += "\nAnswer the user's questions clearly, concisely, and based on best agricultural practices. If asked about something outside agriculture, politely decline."
        
        # Format history for Gemini
        formatted_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            formatted_history.append({"role": role, "parts": [msg["content"]]})
            
        chat = model.start_chat(history=formatted_history)
        
        # Send message with system prompt prepended (if this is the first message or if we want to enforce context)
        # For simplicity, we just send the message. Ideally, system instructions are set during model initialization in newer API versions.
        full_message = f"System Context: {system_prompt}\n\nUser Question: {message}"
        
        response = chat.send_message(full_message)
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI Advisor")
