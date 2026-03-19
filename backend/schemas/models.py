"""AI Models schemas"""

from pydantic import BaseModel
from typing import Optional


class ModelBase(BaseModel):
    name: str
    type: str  # "account_compromise" | "insider_threat" | "anomaly_detection" | "risk_fusion"
    framework: str


class Model(ModelBase):
    id: str
    status: str  # "active" | "training" | "inactive" | "error"
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    lastTrained: str
    predictions: int
    weight: float
    enabled: bool


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    weight: Optional[float] = None


class ModelTrainRequest(BaseModel):
    dataset_path: Optional[str] = None
    epochs: Optional[int] = 10

