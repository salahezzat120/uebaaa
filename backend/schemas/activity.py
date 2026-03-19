"""Activity Logs schemas"""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class ActivityLog(BaseModel):
    id: str
    type: str
    user: str
    action: str
    resource: str
    timestamp: str
    status: str
    details: Optional[Dict[str, Any]] = None

