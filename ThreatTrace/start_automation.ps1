# ThreatTrace Automation Quick Start Script
# ==========================================
# This script helps you start all automation components easily

param(
    [switch]$Setup,
    [switch]$Start,
    [switch]$Register,
    [switch]$Status
)

$BackendPath = ".\backend"
$FrontendPath = ".\frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ThreatTrace Automation Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# SETUP MODE
# ============================================
if ($Setup) {
    Write-Host "Installing automation dependencies..." -ForegroundColor Green
    Write-Host ""
    
    cd $BackendPath
    
    Write-Host "Installing pywin32 for Windows Event Log support..." -ForegroundColor Yellow
    pip install -r requirements_automation.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Dependencies installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Edit automation_config.py to configure what to monitor" -ForegroundColor White
        Write-Host "  2. Run: .\start_automation.ps1 -Register" -ForegroundColor White
        Write-Host "  3. Run: .\start_automation.ps1 -Start" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "Installation failed!" -ForegroundColor Red
        Write-Host "Check the errors above and try again." -ForegroundColor Yellow
    }
    
    cd ..\..
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# ============================================
# REGISTER MODE (One-time file registration)
# ============================================
if ($Register) {
    Write-Host "Registering files for integrity monitoring..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Make sure the backend is running first!" -ForegroundColor Yellow
    Write-Host "    (Open another terminal and run: python app.py)" -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Is the backend running? (y/n)"
    
    if ($continue -eq "y") {
        cd $BackendPath
        python auto_file_registration.py
        cd ..\..
    } else {
        Write-Host ""
        Write-Host "Cancelled. Start the backend first, then try again." -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# ============================================
# STATUS MODE
# ============================================
if ($Status) {
    Write-Host "Checking automation configuration..." -ForegroundColor Green
    Write-Host ""
    
    cd $BackendPath
    python -c "import automation_config"
    cd ..\..
    
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# ============================================
# START MODE (Default)
# ============================================
if ($Start -or $true) {
    Write-Host "Starting ThreatTrace Automation" -ForegroundColor Green
    Write-Host ""
    Write-Host "This will start:" -ForegroundColor Yellow
    Write-Host "  ✓ Auto-Discovery Ransomware Scanner" -ForegroundColor White
    Write-Host "  ✓ Windows Event Log Collector" -ForegroundColor White
    Write-Host ""
    Write-Host "Requirements:" -ForegroundColor Yellow
    Write-Host "  1. Backend must be running (python app.py)" -ForegroundColor White
    Write-Host "  2. Files should be registered (run with -Register first)" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Continue? (y/n)"
    
    if ($continue -ne "y") {
        Write-Host ""
        Write-Host "Cancelled." -ForegroundColor Red
        Write-Host ""
        exit
    }
    
    Write-Host ""
    Write-Host "Starting automation components..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop all components" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    cd $BackendPath
    python automation_runner.py
    cd ..\..
    
    Write-Host ""
    Write-Host "Automation stopped." -ForegroundColor Green
    Write-Host ""
}

# ============================================
# HELP (No parameters)
# ============================================
if (-not $Setup -and -not $Start -and -not $Register -and -not $Status) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  .\start_automation.ps1 -Setup" -ForegroundColor White
    Write-Host "    Install automation dependencies (run once)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  .\start_automation.ps1 -Register" -ForegroundColor White
    Write-Host "    Register files for integrity monitoring (run once)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  .\start_automation.ps1 -Start" -ForegroundColor White
    Write-Host "    Start all automation components" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  .\start_automation.ps1 -Status" -ForegroundColor White
    Write-Host "    Check automation configuration" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Quick Start:" -ForegroundColor Yellow
    Write-Host "  1. .\start_automation.ps1 -Setup" -ForegroundColor White
    Write-Host "  2. Edit ThreatTrace\backend\automation_config.py" -ForegroundColor White
    Write-Host "  3. Start backend: cd ThreatTrace\backend ; python app.py" -ForegroundColor White
    Write-Host "  4. .\start_automation.ps1 -Register" -ForegroundColor White
    Write-Host "  5. .\start_automation.ps1 -Start" -ForegroundColor White
    Write-Host ""
    Write-Host "Full guide: See AUTOMATION_SETUP_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
}
