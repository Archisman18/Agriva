from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from app.database import get_mongo_db

router = APIRouter()

@router.post("")
async def save_field_data(data: Dict[str, Any] = Body(...)):
    db = get_mongo_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    referral_id = data.get("referralId")
    if not referral_id:
        raise HTTPException(status_code=400, detail="Missing referralId")

    collection = db["field_records"]
    # Upsert the document based on referralId
    result = await collection.update_one(
        {"referralId": referral_id},
        {"$set": data},
        upsert=True
    )
    
    return {"referralId": referral_id, "status": "success"}

@router.get("/{referral_id}")
async def get_field_data(referral_id: str):
    db = get_mongo_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    collection = db["field_records"]
    document = await collection.find_one({"referralId": referral_id}, {"_id": 0})
    
    if not document:
        raise HTTPException(status_code=404, detail="Field data not found")
        
    return document
