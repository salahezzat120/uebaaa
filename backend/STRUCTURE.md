# Backend Structure

This document describes the organized structure of the S-UEBA backend API.

## Directory Structure

```
backend/
├── app.py                 # Main FastAPI application
├── main.py                # Entry point (runs the server)
├── config/                # Configuration settings
│   └── __init__.py       # API config, CORS, model paths
├── schemas/               # Pydantic request/response models
│   ├── __init__.py       # Schema exports
│   ├── data_sources.py   # Data source schemas
│   ├── alerts.py         # Alert schemas
│   ├── users.py          # User/Entity schemas
│   ├── models.py         # AI Model schemas
│   ├── inference.py      # Inference schemas
│   ├── dashboard.py      # Dashboard schemas
│   ├── csv_processing.py # CSV processing schemas
│   ├── activity.py       # Activity log schemas
│   ├── reports.py        # Report schemas
│   └── settings.py       # Settings schemas
├── routes/                # API route handlers
│   ├── __init__.py       # Router aggregation
│   ├── data_sources.py   # Data source endpoints
│   ├── alerts.py         # Alert endpoints
│   ├── users.py          # User endpoints
│   ├── models.py         # Model endpoints
│   ├── inference.py      # Inference endpoints
│   ├── dashboard.py      # Dashboard endpoints
│   ├── csv_processing.py  # CSV processing endpoints
│   ├── activity.py       # Activity endpoints
│   ├── reports.py        # Report endpoints
│   └── settings.py       # Settings endpoints
├── models/                # Data models and storage
│   ├── __init__.py       # Model exports
│   └── data_store.py     # In-memory data stores
└── services/              # Business logic services
    ├── __init__.py
    ├── model_inference.py # ML model inference
    └── csv_processor.py   # CSV processing logic
```

## Architecture

### Separation of Concerns

1. **Schemas** (`schemas/`): Pydantic models for request/response validation
2. **Routes** (`routes/`): API endpoint handlers (HTTP layer)
3. **Models** (`models/`): Data layer (currently in-memory, ready for database)
4. **Services** (`services/`): Business logic (ML inference, CSV processing)
5. **Config** (`config/`): Configuration and settings

### Benefits

✅ **Modular**: Each feature in its own file  
✅ **Maintainable**: Easy to find and update code  
✅ **Scalable**: Easy to add new features  
✅ **Testable**: Each component can be tested independently  
✅ **Database Ready**: Models layer can be swapped for real database  

## Adding New Features

1. **Add Schema**: Create schema in `schemas/your_feature.py`
2. **Add Route**: Create route in `routes/your_feature.py`
3. **Add Model**: Add data model in `models/data_store.py` (or database)
4. **Register Route**: Import and include in `routes/__init__.py`

## Migration to Database

When ready to use a real database:

1. Replace `models/data_store.py` with database models (SQLAlchemy, etc.)
2. Update routes to use database session
3. Keep schemas unchanged (they work with any data source)

## Example: Adding a New Endpoint

```python
# 1. Add schema (schemas/notifications.py)
class Notification(BaseModel):
    id: str
    message: str
    # ...

# 2. Add route (routes/notifications.py)
router = APIRouter(prefix="/notifications")
@router.get("")
async def get_notifications():
    return notifications_db

# 3. Register in routes/__init__.py
api_router.include_router(notifications.router, tags=["Notifications"])
```

That's it! The endpoint is now available at `/api/notifications`.

