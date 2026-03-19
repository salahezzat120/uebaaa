"""Activity Logs routes"""

from fastapi import APIRouter
from typing import List

from schemas.activity import ActivityLog
from models.data_store import activity_logs_db

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("", response_model=List[ActivityLog])
async def get_activity_logs(limit: int = 100):
    """Get activity logs"""
    return activity_logs_db[-limit:] if activity_logs_db else []

