import os
import sys

# Add the backend directory to the Python path so that all imports inside backend resolve correctly
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI app from backend/server.py
from backend.server import app
