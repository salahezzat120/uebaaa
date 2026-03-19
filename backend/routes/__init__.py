"""API Routes"""

from fastapi import APIRouter
from . import data_sources, alerts, users, models, inference, dashboard, csv_processing, activity, reports, settings

# Create main router
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(data_sources.router, tags=["Data Sources"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(users.router, tags=["Users"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(inference.router, tags=["Inference"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(csv_processing.router, tags=["CSV Processing"])
api_router.include_router(activity.router, tags=["Activity"])
api_router.include_router(reports.router, tags=["Reports"])
api_router.include_router(settings.router, tags=["Settings"])

