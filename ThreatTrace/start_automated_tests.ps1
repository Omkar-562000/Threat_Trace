# ThreatTrace Automated Test Starter
# ===================================
# This script starts the automated test scheduler

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ThreatTrace Automated Test Scheduler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "🔍 Checking if ThreatTrace backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running!" -ForegroundColor Red
    Write-Host "   Please start the backend first:" -ForegroundColor Yellow
    Write-Host "   cd ThreatTrace/backend" -ForegroundColor White
    Write-Host "   python app.py" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "🚀 Starting automated test scheduler..." -ForegroundColor Green
Write-Host ""

cd ThreatTrace/backend
python automated_test_scheduler.py
