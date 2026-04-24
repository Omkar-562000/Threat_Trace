# ThreatTrace Automation - Files Summary

## 📦 New Files Created

### **Core Automation Components**

| File | Purpose |
|------|---------|
| `backend/automation_config.py` | **Central configuration** - Edit this to customize what gets monitored |
| `backend/auto_ransomware_scanner.py` | **Ransomware scanner** - Automatically scans directories for threats |
| `backend/auto_windows_eventlog.py` | **Event log collector** - Collects Windows Event Logs in real-time |
| `backend/auto_file_registration.py` | **File registration** - One-time setup to register files for monitoring |
| `backend/automation_runner.py` | **Master runner** - Runs all automation components together |

### **Setup & Documentation**

| File | Purpose |
|------|---------|
| `backend/requirements_automation.txt` | Additional Python dependencies for automation |
| `start_automation.ps1` | **PowerShell script** - Easy setup and start |
| `AUTOMATION_SETUP_GUIDE.md` | **Complete guide** - Detailed setup instructions (40+ pages) |
| `QUICK_START_AUTOMATION.md` | **Quick reference** - Get started in 5 minutes |
| `AUTOMATION_FILES_SUMMARY.md` | This file - Overview of all automation files |

### **Project Documentation** (Already Created)

| File | Purpose |
|------|---------|
| `MODULES_AND_FEATURES.md` | Complete list of all modules and features (21+ modules, 90+ features) |
| `WORKFLOW_ANALYSIS.md` | Explains current manual vs automated workflow |

---

## 🎯 What Each Component Does

### **1. automation_config.py** (Configuration File)
**What it is**: Central configuration file  
**What you do**: Edit this to configure:
- Which directories to scan for ransomware
- Which files to monitor for tampering
- Which Windows Event Logs to collect
- Scan intervals and performance settings

**Example**:
```python
RANSOMWARE_WATCH_DIRS = [
    "C:\\Users\\YourName\\Downloads",
    "C:\\Users\\YourName\\Documents"
]
```

---

### **2. auto_ransomware_scanner.py** (Automatic Ransomware Detection)
**What it does**:
- Scans configured directories recursively
- Checks file entropy (detects encryption)
- Flags suspicious extensions (.lock, .enc, etc.)
- Sends alerts for suspicious files
- Runs every 5 minutes (configurable)

**How to run**:
```powershell
python auto_ransomware_scanner.py
```

**Output**:
```
📂 Scanning directory: C:\Users\You\Downloads
  📊 Found 45 files to scan
  ✅ Scanned 45 files successfully
🚨 SUSPICIOUS: secret.enc | Entropy: 7.89 | High entropy
```

---

### **3. auto_windows_eventlog.py** (Windows Event Log Collection)
**What it does**:
- Polls Windows Event Logs (System, Application, Security)
- Extracts new events every 10 seconds
- Sends events to backend API
- Streams to dashboard via WebSocket

**Requirements**: `pip install pywin32`

**How to run**:
```powershell
python auto_windows_eventlog.py
```

**Output**:
```
📋 Monitoring 2 event log sources
📥 Read 12 new events from 'System'
  📤 Sent 12 events to backend
```

---

### **4. auto_file_registration.py** (One-Time File Setup)
**What it does**:
- Registers files from `automation_config.py` with the audit system
- Calculates initial SHA256 hashes
- Stores baseline snapshots
- Only needs to run ONCE (or when adding new files)

**How to run**:
```powershell
python auto_file_registration.py
```

**Output**:
```
✅ REGISTERED: hosts
✅ REGISTERED: config.ini
✅ Successfully registered: 5 files
   The backend scheduler will now automatically check these files
```

---

### **5. automation_runner.py** (Master Controller)
**What it does**:
- Runs ransomware scanner + event log collector simultaneously
- Manages threads for each component
- Provides unified start/stop control

**How to run**:
```powershell
python automation_runner.py

# Or run specific components:
python automation_runner.py --ransomware-only
python automation_runner.py --eventlog-only
```

**Output**:
```
🦠 Starting Ransomware Auto-Scanner...
📋 Starting Windows Event Log Collector...
✅ 2 automation component(s) running
   Press Ctrl+C to stop all components
```

---

## 🚀 Quick Start Commands

### **PowerShell Helper Script** (Recommended)

```powershell
# One-time setup
.\start_automation.ps1 -Setup

# Check configuration
.\start_automation.ps1 -Status

# Register files (one-time, after configuring)
.\start_automation.ps1 -Register

# Start all automation
.\start_automation.ps1 -Start
```

### **Manual Commands** (Alternative)

```powershell
# Install dependencies
cd ThreatTrace\backend
pip install -r requirements_automation.txt

# Configure (edit file)
notepad automation_config.py

# Register files (one-time)
python auto_file_registration.py

# Start automation
python automation_runner.py

# Or run components separately:
python auto_ransomware_scanner.py
python auto_windows_eventlog.py
```

---

## 📊 Automation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ThreatTrace Backend                      │
│                    (python app.py)                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  APScheduler (Built-in)                               │  │
│  │  └─ File Integrity Verification (every 5 min)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ REST API + WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│              automation_runner.py                            │
│                                                              │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │ Ransomware Scanner     │  │ Event Log Collector      │  │
│  │ (Thread 1)             │  │ (Thread 2)               │  │
│  │                        │  │                          │  │
│  │ • Scans directories    │  │ • Polls Windows logs     │  │
│  │ • Calculates entropy   │  │ • Extracts events        │  │
│  │ • Sends alerts         │  │ • Sends to API           │  │
│  │ • Every 5 min          │  │ • Every 10 sec           │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    MongoDB (Persistence)
                            │
                            ▼
                  Frontend (Real-time Display)
```

---

## 🔧 Configuration Quick Reference

### **Most Important Settings** in `automation_config.py`:

```python
# What directories to scan for ransomware
RANSOMWARE_WATCH_DIRS = [
    str(Path.home() / "Downloads"),
    str(Path.home() / "Documents"),
]

# How often to scan (seconds)
RANSOMWARE_SCAN_INTERVAL = 300  # 5 minutes

# Critical files to monitor for tampering
AUTO_REGISTER_FILES = [
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
]

# Windows Event Logs to collect
WINDOWS_EVENTLOG_SOURCES = [
    "System",
    "Application",
]

# Event log polling interval (seconds)
WINDOWS_EVENTLOG_POLL_INTERVAL = 10
```

---

## 📈 What Gets Automated

| Feature | Before (Manual) | After (Automated) |
|---------|-----------------|-------------------|
| **Ransomware Detection** | User uploads files | Scans directories every 5 min |
| **File Integrity** | User uploads files | Auto-verifies registered files every 5 min |
| **System Logs** | User generates test data | Collects real Windows logs every 10 sec |
| **Alerts** | Manual viewing | Real-time WebSocket + Email |

---

## 🎯 Daily Usage

### **First Time Setup** (Do Once):
1. `.\start_automation.ps1 -Setup`
2. Edit `automation_config.py`
3. `.\start_automation.ps1 -Register`

### **Every Day** (3 Terminals):
```powershell
# Terminal 1: Backend
cd ThreatTrace\backend ; python app.py

# Terminal 2: Automation
.\start_automation.ps1 -Start

# Terminal 3: Frontend
cd ThreatTrace\frontend ; npm run dev
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Make sure `python app.py` is running |
| "pywin32 not installed" | Run: `pip install pywin32` |
| "No valid directories" | Edit paths in `automation_config.py` |
| "Permission denied" | Run PowerShell as Administrator |
| Files not being verified | Run `auto_file_registration.py` first |

---

## 📚 Documentation Hierarchy

**For Complete Beginners**: Start with [QUICK_START_AUTOMATION.md](./QUICK_START_AUTOMATION.md)  
**For Detailed Setup**: Read [AUTOMATION_SETUP_GUIDE.md](./AUTOMATION_SETUP_GUIDE.md)  
**For Architecture**: See [MODULES_AND_FEATURES.md](./MODULES_AND_FEATURES.md)  
**For Workflow**: See [WORKFLOW_ANALYSIS.md](./WORKFLOW_ANALYSIS.md)

---

## 🎉 Summary

You now have **9 new files** that transform ThreatTrace from a manual demo tool into a **fully automated security monitoring system**!

**5 Python modules** + **4 documentation files** = Complete automation solution

Just follow [QUICK_START_AUTOMATION.md](./QUICK_START_AUTOMATION.md) and you'll be up and running in 5 minutes! 🚀
