"""Model Inference routes"""

from fastapi import APIRouter, HTTPException

from schemas.inference import InferenceRequest, InferenceResponse
from services.model_inference import ModelInferenceService

router = APIRouter(prefix="/inference", tags=["Inference"])

# Initialize model service
model_inference_service = ModelInferenceService()


@router.post("/predict", response_model=InferenceResponse)
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

