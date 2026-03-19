"""
FastAPI Backend for S-UEBA Behavior Analytics
Main entry point - uses structured app.py
"""

from app import app
from config import HOST, PORT
import uvicorn


# ==================== Run Server ====================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        reload=True,
        log_level="info"
    )

