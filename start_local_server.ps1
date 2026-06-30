Write-Host "=========================================="
Write-Host "  HELIO AI - Local Backend Initialization  "
Write-Host "=========================================="

Write-Host "Installing dependencies... This may take a few minutes for the initial EasyOCR download."
pip install fastapi uvicorn python-multipart easyocr

Write-Host "Starting Local Python Fast API Server on http://localhost:8000"
cd backend
$env:PYTHONIOENCODING="utf-8"
python -m uvicorn server:app --host 0.0.0.0 --port 8000
