"""AI Models routes"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from schemas.models import Model, ModelCreate, ModelUpdate, ModelTrainRequest
from models.data_store import models_db

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", response_model=List[Model])
async def get_models():
    """Get all AI models"""
    return models_db


@router.get("/{model_id}", response_model=Model)
async def get_model(model_id: str):
    """Get a specific model"""
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("", response_model=Model)
async def create_model(model: ModelCreate):
    """Create a new model"""
    new_model = Model(
        id=str(uuid.uuid4()),
        name=model.name,
        type=model.type,
        framework=model.framework,
        status="inactive",
        accuracy=0.0,
        precision=0.0,
        recall=0.0,
        f1Score=0.0,
        lastTrained="Never",
        predictions=0,
        weight=0.0,
        enabled=False
    )
    models_db.append(new_model)
    return new_model


@router.patch("/{model_id}", response_model=Model)
async def update_model(model_id: str, updates: ModelUpdate):
    """Update a model"""
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(model, key, value)
    
    return model


@router.post("/{model_id}/train", response_model=Model)
async def train_model(model_id: str, request: ModelTrainRequest):
    """Train a model"""
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    model.status = "training"
    # In production, this would trigger async training
    # For now, simulate training completion
    import asyncio
    await asyncio.sleep(2)
    
    model.status = "active"
    model.lastTrained = datetime.now().isoformat()
    model.accuracy = 92.5
    model.precision = 91.0
    model.recall = 94.0
    model.f1Score = 92.5
    
    return model


@router.delete("/{model_id}", status_code=204)
async def delete_model(model_id: str):
    """Delete a model"""
    global models_db
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    models_db = [m for m in models_db if m.id != model_id]
    return None

