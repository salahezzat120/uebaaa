"""In-memory data store (replace with database in production)"""

from typing import List
from schemas.data_sources import DataSource
from schemas.alerts import Alert
from schemas.users import UserEntity
from schemas.models import Model
from schemas.activity import ActivityLog
from schemas.reports import Report
from schemas.settings import Settings

# In-memory data stores
# TODO: Replace with actual database (PostgreSQL, MongoDB, etc.)
data_sources_db: List[DataSource] = []
alerts_db: List[Alert] = []
users_db: List[UserEntity] = []
models_db: List[Model] = []
activity_logs_db: List[ActivityLog] = []
reports_db: List[Report] = []

settings_db: Settings = Settings(
    alertThresholds={"critical": 90, "high": 70, "medium": 50, "low": 30},
    modelWeights={"default": 1.0},
    dataRetentionDays=90,
    notificationSettings={"email": True, "sms": False},
    apiKeys={}
)

