"""Reports schemas"""

from pydantic import BaseModel
from typing import Optional


class Report(BaseModel):
    id: str
    name: str
    type: str
    generatedAt: str
    period: str
    status: str  # "pending" | "generating" | "completed" | "failed"
    downloadUrl: Optional[str] = None


class ReportGenerateRequest(BaseModel):
    name: str
    type: str
    startDate: str
    endDate: str
    includeCharts: bool = True

