"""Dashboard schemas"""

from pydantic import BaseModel


class DashboardStats(BaseModel):
    monitoredUsers: int
    activeAlerts: int
    threatsBlocked: int
    dataSources: int
    systemRiskScore: int
    lowRiskPercent: float
    mediumRiskPercent: float
    highRiskPercent: float

