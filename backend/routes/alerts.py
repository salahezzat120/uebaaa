"""Alerts routes"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional

from schemas.alerts import Alert, AlertUpdate, AlertStats
from models.data_store import alerts_db

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[Alert])
async def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    search: Optional[str] = None
):
    """Get alerts with optional filtering"""
    alerts = alerts_db.copy()
    
    if severity and severity != "all":
        alerts = [a for a in alerts if a.severity == severity]
    if status and status != "all":
        alerts = [a for a in alerts if a.status == status]
    if alert_type and alert_type != "all":
        alerts = [a for a in alerts if a.type.lower().replace(" ", "_") == alert_type]
    if search:
        search_lower = search.lower()
        alerts = [
            a for a in alerts
            if search_lower in a.description.lower() or
            search_lower in a.user.lower() or
            search_lower in a.id.lower()
        ]
    
    return alerts


@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str):
    """Get a specific alert"""
    alert = next((a for a in alerts_db if a.id == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, updates: AlertUpdate):
    """Update an alert (e.g., change status)"""
    alert = next((a for a in alerts_db if a.id == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(alert, key, value)
    
    return alert


@router.get("/stats", response_model=AlertStats)
async def get_alert_stats():
    """Get alert statistics"""
    open_count = len([a for a in alerts_db if a.status == "open"])
    investigating_count = len([a for a in alerts_db if a.status == "investigating"])
    resolved_today = len([a for a in alerts_db if a.status == "resolved"])
    
    return AlertStats(
        openAlerts=open_count,
        investigating=investigating_count,
        resolvedToday=resolved_today,
        avgResponseTime=4.2  # minutes
    )

