"""CSV Processing schemas"""

from pydantic import BaseModel
from typing import Optional


class CSVProcessRequest(BaseModel):
    rowsPerSecond: Optional[float] = 1.0


class CSVProcessStatus(BaseModel):
    processing: bool
    processedRows: int
    totalRows: int
    anomaliesDetected: int
    averageAnomalyScore: float
    processingRate: float

