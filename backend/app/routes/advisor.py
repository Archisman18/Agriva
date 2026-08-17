from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, List
import httpx
import re
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
        system_prompt = (
            "You are an expert, friendly agricultural field advisor for Agriva. "
            "You are assisting a farmer with their field analysis and crop planning.\n"
            "CRITICAL: Do NOT output internal thoughts, reasoning blocks, `<think>` tags, or self-correction markers. "
            "Directly provide your complete, helpful, polished response.\n"
        )
        if context:
            system_prompt += "\nFarmer's Field Context:\n"
            if context.get("soilType"): system_prompt += f"- Soil Type: {context['soilType']}\n"
            if context.get("budget"): system_prompt += f"- Budget: ₹{context['budget']}\n"
            if context.get("desiredCrop"): system_prompt += f"- Desired Crop: {context['desiredCrop']}\n"
            if context.get("climateRisks"):
                risks = context['climateRisks']
                system_prompt += f"- Climate Risks: Flood - {risks.get('floodRisk')}, Drought - {risks.get('droughtRisk')}\n"
        
        system_prompt += "\nAnswer clearly, concisely, and based on solid agricultural science. If asked about something outside agriculture, politely redirect."
        
        # Build messages array (OpenAI-compatible format)
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in history:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})
        
        # Add the current user message
        messages.append({"role": "user", "content": message})
        
        MODELS_TO_TRY = [
            "llama-3.3-70b-versatile",
            "gemma2-9b-it",
            "deepseek-r1-distill-llama-70b",
            "qwen/qwen3.6-27b"
        ]

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            for model in MODELS_TO_TRY:
                try:
                    response = await http_client.post(
                        GROQ_URL,
                        headers={
                            "Authorization": f"Bearer {settings.groq_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model,
                            "messages": messages,
                            "temperature": 0.6,
                            "max_tokens": 2048,
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        reply = result["choices"][0]["message"]["content"]
                        
                        # Strip any reasoning or think blocks cleanly
                        reply = re.sub(r'<think>[\s\S]*?<\/think>', '', reply, flags=re.DOTALL)
                        reply = re.sub(r'<think>[\s\S]*$', '', reply, flags=re.DOTALL)
                        reply = re.sub(r'^\s*Here\'s a thinking process:[\s\S]*?(?=(?:Based on|Hello|Hi|To answer|For |Here are))/i', '', reply)
                        reply = re.sub(r'^\s*\d+\.\s+Self-Cor.*$', '', reply, flags=re.MULTILINE)
                        reply = reply.strip()
                        
                        print(f"✅ AI Advisor responded via Groq ({model})")
                        return {"reply": reply}
                    else:
                        print(f"Advisor model {model} failed with status {response.status_code}: {response.text}")
                except Exception as e:
                    print(f"Advisor model {model} exception: {e}")
                    continue

        return {"reply": "I am currently analyzing your field parameters. Please ask any specific questions about soil, crops, or irrigation!"}
        
    except Exception as e:
        print(f"AI Advisor Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI Advisor")
