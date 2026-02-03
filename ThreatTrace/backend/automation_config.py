# backend/automation_config.py
"""
====================================================================
              ThreatTrace — Automation Configuration
====================================================================

Central configuration for all automation features:
- Auto-Discovery Ransomware Scanner
- Windows Event Log Collector  
- Auto File Integrity Registration
- System Log Monitoring

Edit this file to customize what gets monitored automatically.
"""

import os
from pathlib import Path

# ============================================================
# 1️⃣ RANSOMWARE AUTO-SCANNER CONFIGURATION
# ============================================================

# Directories to automatically scan for ransomware (recursive)
RANSOMWARE_WATCH_DIRS = [
    str(Path.home() / "Downloads"),           # User downloads folder
    str(Path.home() / "Documents"),           # User documents
    # "C:\\temp",                             # Temp folder (uncomment if needed)
    # "C:\\Users\\Public",                    # Public folder
]

# How often to scan these directories (in seconds)
# Default: 300 seconds = 5 minutes
RANSOMWARE_SCAN_INTERVAL = 300

# File extensions to scan (leave empty to scan all files)
RANSOMWARE_SCAN_EXTENSIONS = [
    ".exe", ".dll", ".bin", ".dat", ".txt", ".log", 
    ".lock", ".enc", ".crypt", ".ransom", ".encrypted",
    ".doc", ".docx", ".xls", ".xlsx", ".pdf", ".zip"
]

# Maximum file size to scan (in MB) - prevents scanning huge files
RANSOMWARE_MAX_FILE_SIZE_MB = 100

# Skip files modified in last N seconds (prevents scanning files being written)
RANSOMWARE_SKIP_RECENTLY_MODIFIED = 30


# ============================================================
# 2️⃣ FILE INTEGRITY AUTO-REGISTRATION CONFIGURATION
# ============================================================

# Critical files to automatically monitor for tampering
AUTO_REGISTER_FILES = [
    # System configuration files
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
    
    # Application configs (examples - customize for your needs)
    # "C:\\Program Files\\MyApp\\config.ini",
    # str(Path.home() / ".ssh" / "config"),
    
    # Web server configs (if applicable)
    # "C:\\nginx\\conf\\nginx.conf",
    # "C:\\Apache24\\conf\\httpd.conf",
    
    # Database configs (if applicable)  
    # "C:\\Program Files\\MySQL\\my.ini",
]

# Directories containing critical files (will register all files inside)
AUTO_REGISTER_DIRS = [
    # Example: Monitor entire config directory
    # "C:\\MyApp\\config",
]

# File extensions to auto-register from the directories above
AUTO_REGISTER_EXTENSIONS = [".conf", ".config", ".ini", ".yaml", ".yml", ".json", ".xml"]


# ============================================================
# 3️⃣ WINDOWS EVENT LOG COLLECTOR CONFIGURATION
# ============================================================

# Enable/disable Windows Event Log collection
ENABLE_WINDOWS_EVENTLOG = True

# Which Windows Event Logs to collect
# Common options: "Application", "Security", "System", "Setup"
WINDOWS_EVENTLOG_SOURCES = [
    "System",
    "Application",
    # "Security",  # Requires admin privileges - uncomment if running as admin
]

# How often to poll for new Windows Events (in seconds)
WINDOWS_EVENTLOG_POLL_INTERVAL = 10

# Event types to collect
# Options: "Error", "Warning", "Information", "SuccessAudit", "FailureAudit"
WINDOWS_EVENTLOG_TYPES = ["Error", "Warning", "Information"]

# Maximum number of events to fetch per poll
WINDOWS_EVENTLOG_MAX_EVENTS = 100


# ============================================================
# 4️⃣ SYSTEM LOG FILE MONITORING CONFIGURATION
# ============================================================

# Log files to automatically tail and ingest
AUTO_MONITOR_LOG_FILES = [
    # Windows logs (examples)
    # "C:\\Windows\\Logs\\CBS\\CBS.log",
    # "C:\\ProgramData\\MyApp\\logs\\app.log",
    
    # Linux logs (examples - only if running on Linux)
    # "/var/log/syslog",
    # "/var/log/auth.log",
]

# How to map log files to sources (for categorization)
LOG_FILE_SOURCE_MAP = {
    "CBS.log": "windows_cbs",
    "app.log": "application",
    "syslog": "system",
    "auth.log": "authentication",
}


# ============================================================
# 5️⃣ GENERAL AUTOMATION SETTINGS
# ============================================================

# Backend API URL for automation agents to connect to
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://127.0.0.1:5000")

# Enable detailed logging for debugging
AUTOMATION_DEBUG = True

# Send email alerts for automation errors
ALERT_ON_AUTOMATION_ERRORS = False


# ============================================================
# 6️⃣ PERFORMANCE & RESOURCE LIMITS
# ============================================================

# Maximum number of files to scan per ransomware scan cycle
MAX_FILES_PER_SCAN = 1000

# Maximum concurrent file operations
MAX_CONCURRENT_WORKERS = 4

# Sleep between operations to avoid CPU overload (seconds)
OPERATION_SLEEP_TIME = 0.1


# ============================================================
# VALIDATION & HELPERS
# ============================================================

def get_valid_watch_dirs():
    """Returns only existing directories from RANSOMWARE_WATCH_DIRS"""
    valid = []
    for d in RANSOMWARE_WATCH_DIRS:
        p = Path(d)
        if p.exists() and p.is_dir():
            valid.append(str(p))
        elif AUTOMATION_DEBUG:
            print(f"⚠ Warning: Watch directory does not exist: {d}")
    return valid


def get_valid_auto_register_files():
    """Returns only existing files from AUTO_REGISTER_FILES"""
    valid = []
    for f in AUTO_REGISTER_FILES:
        p = Path(f)
        if p.exists() and p.is_file():
            valid.append(str(p))
        elif AUTOMATION_DEBUG:
            print(f"⚠ Warning: Auto-register file does not exist: {f}")
    return valid


def get_valid_log_files():
    """Returns only existing log files from AUTO_MONITOR_LOG_FILES"""
    valid = []
    for f in AUTO_MONITOR_LOG_FILES:
        p = Path(f)
        if p.exists() and p.is_file():
            valid.append(str(p))
        elif AUTOMATION_DEBUG:
            print(f"⚠ Warning: Log file does not exist: {f}")
    return valid


# ============================================================
# PRINT CONFIGURATION ON IMPORT (for debugging)
# ============================================================

if __name__ == "__main__" or AUTOMATION_DEBUG:
    print("\n" + "="*60)
    print("   ThreatTrace Automation Configuration")
    print("="*60)
    print(f"\n📁 Ransomware Watch Dirs: {len(get_valid_watch_dirs())} valid")
    for d in get_valid_watch_dirs():
        print(f"   - {d}")
    
    print(f"\n🔒 Auto-Register Files: {len(get_valid_auto_register_files())} valid")
    for f in get_valid_auto_register_files():
        print(f"   - {f}")
    
    print(f"\n📝 Windows Event Logs: {'Enabled' if ENABLE_WINDOWS_EVENTLOG else 'Disabled'}")
    if ENABLE_WINDOWS_EVENTLOG:
        for src in WINDOWS_EVENTLOG_SOURCES:
            print(f"   - {src}")
    
    print(f"\n📄 Auto-Monitor Log Files: {len(get_valid_log_files())} valid")
    for f in get_valid_log_files():
        print(f"   - {f}")
    
    print("\n" + "="*60 + "\n")
