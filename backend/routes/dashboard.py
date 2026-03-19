"""Dashboard routes"""

from fastapi import APIRouter

from schemas.dashboard import DashboardStats
from models.data_store import data_sources_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return DashboardStats(
        monitoredUsers=2847,
        activeAlerts=23,
        threatsBlocked=156,
        dataSources=len(data_sources_db),
        systemRiskScore=68,
        lowRiskPercent=23.0,
        mediumRiskPercent=45.0,
        highRiskPercent=32.0
    )

