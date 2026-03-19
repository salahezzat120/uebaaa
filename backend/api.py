"""
FastAPI Backend REST API for S-UEBA Behavior Analytics
Provides all API endpoints for frontend integration
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
import uuid

# Import services
from services.model_inference import ModelInferenceService
from services.csv_processor import CSVProcessorService
from services.risk_scoring import RiskScoringEngine

# Initialize FastAPI app
app = FastAPI(
    title="S-UEBA Behavior Analytics API",
    description="REST API for Security User and Entity Behavior Analytics",
    version="1.0.0"
)

# CORS middleware - allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
model_inference_service = ModelInferenceService()
csv_processor_service = CSVProcessorService()
risk_scoring_engine = RiskScoringEngine()

# ============================================================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================================================

# Data Sources
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

# Alerts
class AlertBase(BaseModel):
    type: str
    severity: str  # "critical" | "high" | "medium" | "low"
    status: str  # "open" | "investigating" | "resolved" | "dismissed"
    user: str
    entity: Optional[str] = None
    riskScore: int
    description: str
    model: str

class Alert(AlertBase):
    id: str
    timestamp: str

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None

class AlertStats(BaseModel):
    openAlerts: int
    investigating: int
    resolvedToday: int
    avgResponseTime: float

# Users/Entities
class UserEntityBase(BaseModel):
    name: str
    email: str
    department: str
    role: str

class UserEntity(UserEntityBase):
    id: str
    riskScore: int
    riskTrend: int
    status: str  # "active" | "suspended" | "under_review"
    lastActivity: str
    alertCount: int
    riskFactors: List[str]

class UserEntityUpdate(BaseModel):
    status: Optional[str] = None
    riskScore: Optional[int] = None

# Models
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

# Dashboard
class DashboardStats(BaseModel):
    monitoredUsers: int
    activeAlerts: int
    threatsBlocked: int
    dataSources: int
    systemRiskScore: int
    lowRiskPercent: float
    mediumRiskPercent: float
    highRiskPercent: float

# CSV Processing
class CSVProcessRequest(BaseModel):
    rowsPerSecond: Optional[float] = 1.0

class CSVProcessStatus(BaseModel):
    processing: bool
    processedRows: int
    totalRows: int
    anomaliesDetected: int
    averageAnomalyScore: float
    processingRate: float

# Model Inference
class InferenceRequest(BaseModel):
    features: List[List[float]]  # Sequence: [timesteps, features]
    model_id: Optional[str] = None

class InferenceResponse(BaseModel):
    anomalyScore: float
    isAnomaly: bool
    reconstructionError: Optional[float] = None
    confidence: Optional[float] = None

# Risk Scoring
class RiskScoreRequest(BaseModel):
    anomalyScores: Dict[str, float]  # model_name -> anomaly_score (0-1)
    userId: str
    timestamp: Optional[str] = None
    context: Optional[Dict[str, Any]] = None  # IP, action, resource, status, etc.

class RiskScoreResponse(BaseModel):
    riskScore: float  # 0-100
    severity: str  # "critical" | "high" | "medium" | "low" | "normal"
    confidence: float  # 0-1
    components: Dict[str, float]  # Breakdown of risk components
    riskFactors: List[str]  # List of identified risk factors
    timestamp: str

# Activity Log
class ActivityLog(BaseModel):
    id: str
    type: str
    user: str
    action: str
    resource: str
    timestamp: str
    status: str
    details: Optional[Dict[str, Any]] = None

# Report
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

# Settings
class Settings(BaseModel):
    alertThresholds: Dict[str, int]
    modelWeights: Dict[str, float]
    dataRetentionDays: int
    notificationSettings: Dict[str, bool]
    apiKeys: Dict[str, str]

# ============================================================================
# IN-MEMORY DATA STORES (Replace with actual database in production)
# ============================================================================

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

# ============================================================================
# DATA SOURCES API
# ============================================================================

@app.get("/api/data-sources", response_model=List[DataSource])
async def get_data_sources():
    """Get all data sources"""
    return data_sources_db

@app.get("/api/data-sources/{source_id}", response_model=DataSource)
async def get_data_source(source_id: str):
    """Get a specific data source"""
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return source

@app.post("/api/data-sources", response_model=DataSource)
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

@app.patch("/api/data-sources/{source_id}", response_model=DataSource)
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

@app.delete("/api/data-sources/{source_id}", status_code=204)
async def delete_data_source(source_id: str):
    """Delete a data source"""
    global data_sources_db
    source = next((ds for ds in data_sources_db if ds.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    data_sources_db = [ds for ds in data_sources_db if ds.id != source_id]
    return None

@app.post("/api/data-sources/{source_id}/connect", response_model=DataSource)
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

@app.post("/api/data-sources/{source_id}/disconnect", response_model=DataSource)
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

@app.post("/api/data-sources/{source_id}/sync", response_model=DataSource)
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

@app.post("/api/data-sources/upload-csv", response_model=DataSource)
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

# ============================================================================
# ALERTS API
# ============================================================================

@app.get("/api/alerts", response_model=List[Alert])
async def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    search: Optional[str] = None
):
    """Get alerts with optional filtering"""
    alerts = alerts_db.copy()
    
    if severity and severity != "all":
        alerts = [a for a in alerts if a.severity == severity]
    if status and status != "all":
        alerts = [a for a in alerts if a.status == status]
    if alert_type and alert_type != "all":
        alerts = [a for a in alerts if a.type.lower().replace(" ", "_") == alert_type]
    if search:
        search_lower = search.lower()
        alerts = [
            a for a in alerts
            if search_lower in a.description.lower() or
            search_lower in a.user.lower() or
            search_lower in a.id.lower()
        ]
    
    return alerts

@app.get("/api/alerts/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str):
    """Get a specific alert"""
    alert = next((a for a in alerts_db if a.id == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@app.patch("/api/alerts/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, updates: AlertUpdate):
    """Update an alert (e.g., change status)"""
    alert = next((a for a in alerts_db if a.id == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(alert, key, value)
    
    return alert

@app.get("/api/alerts/stats", response_model=AlertStats)
async def get_alert_stats():
    """Get alert statistics"""
    open_count = len([a for a in alerts_db if a.status == "open"])
    investigating_count = len([a for a in alerts_db if a.status == "investigating"])
    resolved_today = len([a for a in alerts_db if a.status == "resolved"])
    
    return AlertStats(
        openAlerts=open_count,
        investigating=investigating_count,
        resolvedToday=resolved_today,
        avgResponseTime=4.2  # minutes
    )

# ============================================================================
# USERS/ENTITIES API
# ============================================================================

@app.get("/api/users", response_model=List[UserEntity])
async def get_users(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None
):
    """Get users/entities with optional filtering"""
    users = users_db.copy()
    
    if search:
        search_lower = search.lower()
        users = [
            u for u in users
            if search_lower in u.name.lower() or
            search_lower in u.email.lower()
        ]
    if department:
        users = [u for u in users if u.department == department]
    if status:
        users = [u for u in users if u.status == status]
    
    return users

@app.get("/api/users/{user_id}", response_model=UserEntity)
async def get_user(user_id: str):
    """Get a specific user/entity"""
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/api/users/{user_id}", response_model=UserEntity)
async def update_user(user_id: str, updates: UserEntityUpdate):
    """Update a user/entity"""
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    
    return user

# ============================================================================
# MODELS API
# ============================================================================

@app.get("/api/models", response_model=List[Model])
async def get_models():
    """Get all AI models"""
    return models_db

@app.get("/api/models/{model_id}", response_model=Model)
async def get_model(model_id: str):
    """Get a specific model"""
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@app.post("/api/models", response_model=Model)
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

@app.patch("/api/models/{model_id}", response_model=Model)
async def update_model(model_id: str, updates: ModelUpdate):
    """Update a model"""
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(model, key, value)
    
    return model

@app.post("/api/models/{model_id}/train", response_model=Model)
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

@app.delete("/api/models/{model_id}", status_code=204)
async def delete_model(model_id: str):
    """Delete a model"""
    global models_db
    model = next((m for m in models_db if m.id == model_id), None)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    models_db = [m for m in models_db if m.id != model_id]
    return None

# ============================================================================
# DASHBOARD API
# ============================================================================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return DashboardStats(
        monitoredUsers=2847,
        activeAlerts=23,
        threatsBlocked=156,
        dataSources=len(data_sources_db),
        systemRiskScore=68,
        lowRiskPercent=23.0,
        mediumRiskPercent=45.0,
        highRiskPercent=32.0
    )

# ============================================================================
# MODEL INFERENCE API
# ============================================================================

@app.post("/api/inference/predict", response_model=InferenceResponse)
async def predict(request: InferenceRequest):
    """Run model inference for anomaly detection"""
    try:
        # Convert features to the format expected by model service
        # Model expects sequences: List[List[float]] = [timesteps, features]
        features = request.features
        if features and not isinstance(features[0], list):
            # Single feature vector - wrap it as a sequence
            features = [features]
        
        # Ensure we have 7 timesteps (pad if needed)
        if len(features) < 7:
            padding = [features[0]] * (7 - len(features))
            features = padding + features
        
        # Call model inference service
        result = await model_inference_service.predict(features)
        
        return InferenceResponse(
            anomalyScore=result.get("anomalyScore", 0.5),
            isAnomaly=result.get("isAnomaly", False),
            reconstructionError=result.get("reconstructionError"),
            confidence=result.get("confidence")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

# ============================================================================
# RISK SCORING API
# ============================================================================

@app.post("/api/risk/calculate", response_model=RiskScoreResponse)
async def calculate_risk_score(request: RiskScoreRequest):
    """Calculate comprehensive risk score"""
    try:
        # Parse timestamp
        if request.timestamp:
            event_timestamp = datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
        else:
            event_timestamp = datetime.now()
        
        # Calculate risk score
        result = risk_scoring_engine.calculate_risk_score(
            anomaly_scores=request.anomalyScores,
            user_id=request.userId,
            timestamp=event_timestamp,
            context=request.context or {}
        )
        
        return RiskScoreResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk scoring error: {str(e)}")

@app.get("/api/risk/user/{user_id}")
async def get_user_risk_score(user_id: str):
    """Get overall risk score for a user"""
    try:
        result = risk_scoring_engine.calculate_user_risk_score(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating user risk: {str(e)}")

@app.post("/api/risk/settings/thresholds")
async def update_risk_thresholds(thresholds: Dict[str, int]):
    """Update risk score thresholds"""
    try:
        risk_scoring_engine.update_thresholds(thresholds)
        return {"message": "Thresholds updated successfully", "thresholds": thresholds}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating thresholds: {str(e)}")

@app.post("/api/risk/settings/model-weights")
async def update_model_weights(weights: Dict[str, float]):
    """Update model weights for risk fusion"""
    try:
        risk_scoring_engine.update_model_weights(weights)
        return {"message": "Model weights updated successfully", "weights": weights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating weights: {str(e)}")

# ============================================================================
# CSV PROCESSING API
# ============================================================================

@app.post("/api/csv/process")
async def process_csv(file: UploadFile = File(...)):
    """Start processing a CSV file"""
    # This would integrate with CSVProcessorService
    return {"message": "CSV processing started", "file_id": str(uuid.uuid4())}

@app.get("/api/csv/process/{process_id}/status", response_model=CSVProcessStatus)
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

# ============================================================================
# ACTIVITY LOGS API
# ============================================================================

@app.get("/api/activity", response_model=List[ActivityLog])
async def get_activity_logs(limit: int = 100):
    """Get activity logs"""
    return activity_logs_db[-limit:] if activity_logs_db else []

# ============================================================================
# REPORTS API
# ============================================================================

@app.get("/api/reports", response_model=List[Report])
async def get_reports():
    """Get all reports"""
    return reports_db

@app.post("/api/reports/generate", response_model=Report)
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

# ============================================================================
# SETTINGS API
# ============================================================================

@app.get("/api/settings", response_model=Settings)
async def get_settings():
    """Get application settings"""
    return settings_db

@app.patch("/api/settings", response_model=Settings)
async def update_settings(updates: Dict[str, Any]):
    """Update application settings"""
    global settings_db
    update_dict = settings_db.dict()
    update_dict.update(updates)
    settings_db = Settings(**update_dict)
    return settings_db

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

