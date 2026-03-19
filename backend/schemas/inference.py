"""Model Inference schemas"""

from pydantic import BaseModel
from typing import List, Optional


class InferenceRequest(BaseModel):
    features: List[List[float]]  # Sequence: [timesteps, features]
    model_id: Optional[str] = None


class InferenceResponse(BaseModel):
    anomalyScore: float
    isAnomaly: bool
    reconstructionError: Optional[float] = None
    confidence: Optional[float] = None

