# ThreatTrace — Automation Setup Guide

## 🎯 Overview

This guide will help you set up **fully automated monitoring** for ThreatTrace, transforming it from a manual demonstration tool into an autonomous security monitoring system.

---

## 📦 What You Get

After setup, your system will automatically:

1. ✅ **Scan directories for ransomware** (every 5 minutes)
2. ✅ **Collect Windows Event Logs** in real-time
3. ✅ **Monitor critical files for tampering** (every 5 minutes)
4. ✅ **Send real-time alerts** via WebSocket + Email
5. ✅ **Display everything** in the dashboard

**No more manual uploads!**

---

## 🚀 Quick Start (5 Steps)

### **Step 1: Install Additional Dependencies**

```powershell
cd ThreatTrace\backend

# Install Windows Event Log support
pip install -r requirements_automation.txt
```

---

### **Step 2: Configure What to Monitor**

Edit `ThreatTrace/backend/automation_config.py`:

```python
# What directories to scan for ransomware
RANSOMWARE_WATCH_DIRS = [
    "C:\\Users\\YourName\\Downloads",     # Your downloads
    "C:\\Users\\YourName\\Documents",     # Your documents
    "C:\\temp",                            # Temp folder
]

# Critical files to monitor for tampering
AUTO_REGISTER_FILES = [
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
    "C:\\MyApp\\config.ini",
]

# Windows Event Logs to collect
WINDOWS_EVENTLOG_SOURCES = [
    "System",
    "Application",
    # "Security",  # Uncomment if running as admin
]
```

**💡 Tip**: Start with defaults, then customize based on your needs!

---

### **Step 3: Start the Backend**

```powershell
cd ThreatTrace\backend

# Start backend (keep this running)
python app.py
```

Leave this terminal **open and running**.

---

### **Step 4: Register Files for Integrity Monitoring (One-Time)**

Open a **NEW terminal**:

```powershell
cd ThreatTrace\backend

# Register critical files (one-time setup)
python auto_file_registration.py
```

You should see:
```
✅ Successfully registered: 5 files
   The backend scheduler will now automatically check these files
```

This only needs to run **once**. The backend scheduler will automatically verify these files every 5 minutes.

---

### **Step 5: Start Automation Components**

Open **ANOTHER new terminal**:

```powershell
cd ThreatTrace\backend

# Start ALL automation (ransomware scanner + event logs)
python automation_runner.py
```

**Keep this terminal open!** It will continuously run in the background.

You should see:
```
🦠 Starting Ransomware Auto-Scanner...
📋 Starting Windows Event Log Collector...
✅ 2 automation component(s) running
```

---

## ✅ Verification

### **Check the Frontend**

1. Start frontend (if not running):
   ```powershell
   cd ThreatTrace\frontend
   npm run dev
   ```

2. Open browser: `http://localhost:5173`

3. Login and check:
   - **Dashboard** → Should show real-time stats
   - **System Logs** → Should show Windows Event Logs streaming in
   - **Ransomware** → Should show automatic scans (wait 5 minutes)
   - **Audit** → Should show registered files being verified

### **Check Console Outputs**

You should see activity in the automation terminal:

```
🔍 Starting Scan Cycle #1
📂 Scanning directory: C:\Users\You\Downloads
  📊 Found 45 files to scan
  ✅ Scanned 45 files successfully
✅ No suspicious files detected

📥 Read 12 new events from 'System'
  📤 Sent 12 events to backend
```

---

## 🛠️ Advanced Usage

### **Run Components Separately**

```powershell
# Run ONLY ransomware scanner
python automation_runner.py --ransomware-only

# Run ONLY event log collector  
python automation_runner.py --eventlog-only

# Or run individual scripts directly
python auto_ransomware_scanner.py
python auto_windows_eventlog.py
```

---

### **Customize Scan Intervals**

Edit `automation_config.py`:

```python
# Scan for ransomware every 10 minutes instead of 5
RANSOMWARE_SCAN_INTERVAL = 600  # seconds

# Poll Windows events every 30 seconds
WINDOWS_EVENTLOG_POLL_INTERVAL = 30

# (No need to change file integrity - backend scheduler handles it)
```

---

### **Add More Directories to Scan**

Edit `automation_config.py`:

```python
RANSOMWARE_WATCH_DIRS = [
    str(Path.home() / "Downloads"),
    str(Path.home() / "Documents"),
    "C:\\Users\\Public",
    "C:\\temp",
    "D:\\Projects",  # Add your custom paths
]
```

---

### **Monitor Specific Log Files**

If you have application logs (not Windows Event Logs):

```powershell
# Open another terminal
cd ThreatTrace\backend

# Tail a specific log file
python system_monitor.py --file "C:\MyApp\logs\app.log" --source "myapp"
```

This will continuously stream that log file to your dashboard.

---

## 🔧 Troubleshooting

### **"Cannot connect to backend"**

**Problem**: Automation can't reach the backend API

**Solution**:
1. Make sure `python app.py` is running
2. Check `automation_config.py` → `BACKEND_API_URL` is correct
3. Default should be: `http://127.0.0.1:5000`

---

### **"Permission denied" errors**

**Problem**: Can't access certain directories or files

**Solutions**:
- **Windows Event Logs (Security)**: Run PowerShell **as Administrator**
- **System folders**: You need admin privileges
- **Or**: Remove problematic paths from `automation_config.py`

---

### **"No valid directories to watch"**

**Problem**: All configured directories don't exist

**Solution**:
1. Open `automation_config.py`
2. Check paths in `RANSOMWARE_WATCH_DIRS`
3. Make sure they exist on your system
4. Use valid Windows paths: `C:\\Users\\...` (double backslashes)

---

### **"pywin32 not installed"**

**Problem**: Windows Event Log support missing

**Solution**:
```powershell
pip install pywin32
```

If that fails:
```powershell
pip install --upgrade pywin32
python C:\Python3X\Scripts\pywin32_postinstall.py -install
```

---

### **Backend scheduler not working**

**Problem**: Files aren't being re-verified

**Check**:
1. Backend is running (`python app.py`)
2. Files were registered (`python auto_file_registration.py`)
3. Look for scheduler messages in backend console:
   ```
   ⚙️ Scheduler started: integrity checks every 300 seconds
   ```

---

## 📋 What's Running - Summary

After full setup, you should have **3 terminals running**:

### **Terminal 1 - Backend**
```powershell
cd ThreatTrace\backend
python app.py
```
- Flask API server
- MongoDB connection
- WebSocket server
- **Background scheduler** (auto-verifies files every 5 min)

### **Terminal 2 - Automation**
```powershell
cd ThreatTrace\backend
python automation_runner.py
```
- Ransomware scanner (scans directories every 5 min)
- Windows Event Log collector (polls every 10 sec)

### **Terminal 3 - Frontend**
```powershell
cd ThreatTrace\frontend
npm run dev
```
- React web interface
- Real-time WebSocket connection

---

## 🎛️ Configuration Reference

### **automation_config.py** - Key Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `RANSOMWARE_WATCH_DIRS` | Directories to scan | Downloads, Documents |
| `RANSOMWARE_SCAN_INTERVAL` | How often to scan (seconds) | 300 (5 min) |
| `AUTO_REGISTER_FILES` | Files to monitor for tampering | hosts file only |
| `WINDOWS_EVENTLOG_SOURCES` | Which event logs to collect | System, Application |
| `WINDOWS_EVENTLOG_POLL_INTERVAL` | Event log polling (seconds) | 10 |
| `BACKEND_API_URL` | Where automation connects | http://127.0.0.1:5000 |

---

## 🔄 Daily Workflow

### **Starting Everything** (After System Reboot)

```powershell
# Terminal 1: Start Backend
cd ThreatTrace\backend ; python app.py

# Terminal 2: Start Frontend  
cd ThreatTrace\frontend ; npm run dev

# Terminal 3: Start Automation
cd ThreatTrace\backend ; python automation_runner.py
```

### **Stopping Everything**

Press **Ctrl+C** in each terminal, in this order:
1. Automation (Terminal 3)
2. Frontend (Terminal 2)
3. Backend (Terminal 1)

---

## 🚀 Next Level - Run as Windows Service

Want automation to run **even when you're not logged in**?

### **Option 1: Use Task Scheduler** (Easier)

1. Open **Task Scheduler**
2. Create new task:
   - **Trigger**: At system startup
   - **Action**: Run `python.exe`
   - **Arguments**: `C:\path\to\ThreatTrace\backend\automation_runner.py`
   - **Start in**: `C:\path\to\ThreatTrace\backend`
3. Set to run whether user is logged on or not

### **Option 2: Use NSSM** (Windows Service)

```powershell
# Download NSSM (Non-Sucking Service Manager)
# https://nssm.cc/download

# Install automation as Windows service
nssm install ThreatTraceAutomation "C:\Python3X\python.exe" "C:\path\to\automation_runner.py"
nssm set ThreatTraceAutomation AppDirectory "C:\path\to\ThreatTrace\backend"
nssm start ThreatTraceAutomation
```

Now automation runs automatically on boot!

---

## 📊 Performance Tips

### **Reduce CPU Usage**

If automation is using too much CPU:

```python
# In automation_config.py

# Scan less frequently
RANSOMWARE_SCAN_INTERVAL = 600  # 10 minutes

# Scan fewer files per cycle
MAX_FILES_PER_SCAN = 500

# Reduce concurrent workers
MAX_CONCURRENT_WORKERS = 2
```

### **Reduce Memory Usage**

```python
# Poll Windows events less frequently
WINDOWS_EVENTLOG_POLL_INTERVAL = 30  # 30 seconds

# Fetch fewer events per poll
WINDOWS_EVENTLOG_MAX_EVENTS = 50
```

---

## 🎯 Testing the Automation

### **Test Ransomware Detection**

1. Create a test file:
   ```powershell
   # Create encrypted-looking file in Downloads
   $random = Get-Random -Minimum 0 -Maximum 255 -Count 10000
   $random | Out-File "$env:USERPROFILE\Downloads\test.enc" -Encoding Byte
   ```

2. Wait up to 5 minutes
3. Check Dashboard → Should see alert
4. Check Ransomware page → Should show detection

### **Test File Integrity**

1. Register a test file:
   ```powershell
   echo "original content" > C:\temp\test.txt
   ```

2. Add to `automation_config.py`:
   ```python
   AUTO_REGISTER_FILES = [
       "C:\\temp\\test.txt"
   ]
   ```

3. Re-run registration:
   ```powershell
   python auto_file_registration.py
   ```

4. Modify the file:
   ```powershell
   echo "TAMPERED!" >> C:\temp\test.txt
   ```

5. Wait up to 5 minutes
6. Check Dashboard → Should see tamper alert
7. Check Audit page → Should show file was modified with diff

### **Test Windows Event Logs**

1. Make sure automation is running
2. Trigger a system event:
   ```powershell
   # Restart a Windows service (creates event log)
   Restart-Service Spooler
   ```

3. Within 10-30 seconds, check System Logs page
4. Should see new event appear in real-time

---

## 📝 Summary

### **What's Automated Now**:

✅ **Ransomware Scanning**
- Automatically scans Downloads, Documents (configurable)
- Every 5 minutes (configurable)
- Sends alerts on suspicious files

✅ **Windows Event Log Collection**  
- Automatically collects System + Application logs
- Every 10 seconds (configurable)
- Streams to dashboard in real-time

✅ **File Integrity Monitoring**
- Automatically verifies registered files
- Every 5 minutes (handled by backend scheduler)
- Sends alerts on tampering with line-by-line diff

### **What's Still Manual**:

❌ Initial file registration (one-time setup)
❌ Configuration changes (edit automation_config.py)
❌ Starting/stopping the automation runner

---

## 🤝 Need Help?

1. **Enable debug mode**:
   ```python
   # In automation_config.py
   AUTOMATION_DEBUG = True
   ```

2. **Check terminal outputs** for detailed logs

3. **Verify backend is running**: Visit `http://127.0.0.1:5000`

4. **Check MongoDB**: Make sure it's running and accessible

---

## 🎉 Congratulations!

You now have a **fully automated cybersecurity monitoring system**!

Your ThreatTrace instance is now:
- 🔍 Continuously scanning for threats
- 📋 Collecting system events in real-time
- 🔒 Monitoring file integrity automatically
- 🚨 Sending instant alerts
- 📊 Displaying everything on your dashboard

**No more manual work required!** 🚀
