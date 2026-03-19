"""Data Sources schemas"""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class DataSourceBase(BaseModel):
    name: str
    type: str  # "csv" | "logstash" | "api" | "database"
    config: Optional[Dict[str, Any]] = {}


class DataSourceCreate(DataSourceBase):
    pass


class DataSource(DataSourceBase):
    id: str
    status: str  # "connected" | "disconnected" | "syncing" | "error"
    health: int  # 0-100
    records: int
    eventsPerSec: int
    lastSync: Optional[str] = None
    createdAt: str
    updatedAt: str


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

