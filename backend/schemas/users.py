"""Users/Entities schemas"""

from pydantic import BaseModel
from typing import List, Optional


class UserEntityBase(BaseModel):
    name: str
    email: str
    department: str
    role: str


class UserEntity(UserEntityBase):
    id: str
    riskScore: int
    riskTrend: int
    status: str  # "active" | "suspended" | "under_review"
    lastActivity: str
    alertCount: int
    riskFactors: List[str]


class UserEntityUpdate(BaseModel):
    status: Optional[str] = None
    riskScore: Optional[int] = None

