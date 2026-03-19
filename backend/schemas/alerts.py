"""Alerts schemas"""

from pydantic import BaseModel
from typing import Optional


class AlertBase(BaseModel):
    type: str
    severity: str  # "critical" | "high" | "medium" | "low"
    status: str  # "open" | "investigating" | "resolved" | "dismissed"
    user: str
    entity: Optional[str] = None
    riskScore: int
    description: str
    model: str


class Alert(AlertBase):
    id: str
    timestamp: str


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None


class AlertStats(BaseModel):
    openAlerts: int
    investigating: int
    resolvedToday: int
    avgResponseTime: float

