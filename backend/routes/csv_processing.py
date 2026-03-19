"""CSV Processing routes"""

from fastapi import APIRouter, UploadFile, File
import uuid

from schemas.csv_processing import CSVProcessStatus

router = APIRouter(prefix="/csv", tags=["CSV Processing"])


@router.post("/process")
async def process_csv(file: UploadFile = File(...)):
    """Start processing a CSV file"""
    # This would integrate with CSVProcessorService
    return {"message": "CSV processing started", "file_id": str(uuid.uuid4())}


@router.get("/process/{process_id}/status", response_model=CSVProcessStatus)
async def get_csv_process_status(process_id: str):
    """Get CSV processing status"""
    # This would check the status from CSVProcessorService
    return CSVProcessStatus(
        processing=True,
        processedRows=10,
        totalRows=100,
        anomaliesDetected=2,
        averageAnomalyScore=0.65,
        processingRate=1.0
    )

