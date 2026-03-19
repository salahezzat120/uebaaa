"""Reports routes"""

from fastapi import APIRouter
from typing import List
from datetime import datetime
import uuid

from schemas.reports import Report, ReportGenerateRequest
from models.data_store import reports_db

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[Report])
async def get_reports():
    """Get all reports"""
    return reports_db


@router.post("/generate", response_model=Report)
async def generate_report(request: ReportGenerateRequest):
    """Generate a new report"""
    new_report = Report(
        id=str(uuid.uuid4()),
        name=request.name,
        type=request.type,
        generatedAt=datetime.now().isoformat(),
        period=f"{request.startDate} to {request.endDate}",
        status="generating"
    )
    reports_db.append(new_report)
    
    # In production, this would trigger async report generation
    # For now, mark as completed
    new_report.status = "completed"
    new_report.downloadUrl = f"/api/reports/{new_report.id}/download"
    
    return new_report

