from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

@router.post("")
async def save_field_data(data: Dict[str, Any]):
    return {"status": "ok"}

@router.get("/{referral_id}")
async def get_field_data(referral_id: str):
    return {}
