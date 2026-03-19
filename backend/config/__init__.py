"""Configuration settings for the backend"""

import os
from typing import List

# API Configuration
API_TITLE = "S-UEBA Behavior Analytics API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "REST API for Security User and Entity Behavior Analytics"

# CORS Configuration
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
]

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5000"))

# Model Configuration
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "..",
    "models",
    "lstm_ae_cert.h5"
)

# Database Configuration (for future use)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sueba.db")

