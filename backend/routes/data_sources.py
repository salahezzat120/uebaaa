"""Data Sources routes"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
from datetime import datetime
import uuid

from schemas.data_sources import DataSource, DataSourceCreate, DataSourceUpdate
from models.data_store import data_sources_db

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


@router.get("", response_model=List[DataSource])
async def get_data_sources():
    """Get all data sources"""
    return data_sources_db


@router.get("/{source_id}", response_model=DataSource)
async def get_data_source(source_id: str):
    """Get a specific data source"""
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return source


@router.post("", response_model=DataSource)
async def create_data_source(source: DataSourceCreate):
    """Create a new data source"""
    new_source = DataSource(
        id=str(uuid.uuid4()),
        name=source.name,
        type=source.type,
        config=source.config,
        status="disconnected",
        health=0,
        records=0,
        eventsPerSec=0,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    data_sources_db.append(new_source)
    return new_source


@router.patch("/{source_id}", response_model=DataSource)
async def update_data_source(source_id: str, updates: DataSourceUpdate):
    """Update a data source"""
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(source, key, value)
    source.updatedAt = datetime.now().isoformat()
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_data_source(source_id: str):
    """Delete a data source"""
    global data_sources_db
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    data_sources_db = [ds for ds in data_sources_db if ds.id != source_id]
    return None


@router.post("/{source_id}/connect", response_model=DataSource)
async def connect_data_source(source_id: str):
    """Connect to a data source"""
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    source.status = "connected"
    source.health = 95
    source.eventsPerSec = 100
    source.updatedAt = datetime.now().isoformat()
    return source


@router.post("/{source_id}/disconnect", response_model=DataSource)
async def disconnect_data_source(source_id: str):
    """Disconnect from a data source"""
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    source.status = "disconnected"
    source.health = 0
    source.eventsPerSec = 0
    source.updatedAt = datetime.now().isoformat()
    return source


@router.post("/{source_id}/sync", response_model=DataSource)
async def sync_data_source(source_id: str):
    """Sync a data source"""
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    source.status = "syncing"
    source.updatedAt = datetime.now().isoformat()
    
    # Simulate sync process (in production, this would be async)
    import asyncio
    await asyncio.sleep(2)
    
    source.status = "connected"
    source.lastSync = datetime.now().isoformat()
    source.records += 1000
    source.updatedAt = datetime.now().isoformat()
    return source


@router.post("/upload-csv", response_model=DataSource)
async def upload_csv(
    file: UploadFile = File(...),
    name: str = Form(...)
):
    """Upload and process a CSV file"""
    # Read CSV file
    content = await file.read()
    text_content = content.decode('utf-8')
    lines = text_content.split('\n')
    record_count = max(0, len(lines) - 1)  # Subtract header
    
    # Create data source from CSV
    new_source = DataSource(
        id=str(uuid.uuid4()),
        name=name or file.filename.replace('.csv', ''),
        type="csv",
        config={
            "fileName": file.filename,
            "fileSize": len(content),
            "uploadedAt": datetime.now().isoformat()
        },
        status="connected",
        health=100,
        records=record_count,
        eventsPerSec=0,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    data_sources_db.append(new_source)
    return new_source

