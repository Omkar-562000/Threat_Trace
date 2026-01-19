# ThreatTrace Test Data Generator
# =================================
# Quick script to generate test data

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ThreatTrace Test Data Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "  1. Generate test suite (files)" -ForegroundColor White
Write-Host "  2. Generate continuous real-time logs (5 min)" -ForegroundColor White
Write-Host "  3. Generate continuous real-time logs (30 min)" -ForegroundColor White
Write-Host "  4. Ingest existing log file" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

cd ThreatTrace/backend

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📁 Generating test file suite..." -ForegroundColor Green
        python test_data_generator.py --mode suite
    }
    "2" {
        Write-Host ""
        Write-Host "🔄 Generating real-time logs for 5 minutes..." -ForegroundColor Green
        python test_data_generator.py --mode continuous --duration 5 --interval 5
    }
    "3" {
        Write-Host ""
        Write-Host "🔄 Generating real-time logs for 30 minutes..." -ForegroundColor Green
        python test_data_generator.py --mode continuous --duration 30 --interval 5
    }
    "4" {
        Write-Host ""
        $file = Read-Host "Enter log file path (e.g., test_files/realistic_mix.log)"
        Write-Host "📤 Ingesting logs from $file..." -ForegroundColor Green
        python test_data_generator.py --mode ingest --file $file
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
