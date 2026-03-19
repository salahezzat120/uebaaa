"""Settings schemas"""

from pydantic import BaseModel
from typing import Dict


class Settings(BaseModel):
    alertThresholds: Dict[str, int]
    modelWeights: Dict[str, float]
    dataRetentionDays: int
    notificationSettings: Dict[str, bool]
    apiKeys: Dict[str, str]

