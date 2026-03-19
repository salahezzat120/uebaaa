"""Settings routes"""

from fastapi import APIRouter
from typing import Dict, Any

from schemas.settings import Settings
from models.data_store import settings_db

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=Settings)
async def get_settings():
    """Get application settings"""
    return settings_db


@router.patch("", response_model=Settings)
async def update_settings(updates: Dict[str, Any]):
    """Update application settings"""
    global settings_db
    update_dict = settings_db.dict()
    update_dict.update(updates)
    settings_db = Settings(**update_dict)
    return settings_db

