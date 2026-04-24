# ThreatTrace - Current Workflow Analysis

## 🎯 Your Question: "Are we manually carrying out the log files and inserting them?"

**Short Answer**: Yes, you're partially correct. The current system has a **mix of manual and automated workflows**, but leans heavily toward **manual operations** for demonstration purposes.

---

## 📊 Current Workflow Breakdown

### 1. **Ransomware Detection** 🦠
**Status**: ⚠️ **FULLY MANUAL**

#### Current Process:
1. User manually selects/uploads a file through the UI
2. File is sent to backend
3. Backend performs entropy analysis and signature matching
4. Results displayed on dashboard

#### What This Means:
- ❌ No automatic scanning of directories
- ❌ No real-time file system monitoring
- ❌ No scheduled scans of critical folders
- ✅ On-demand scanning only

#### Example Usage:
```
User → Opens Ransomware page → Clicks "Choose File" → Uploads file → Clicks "Scan"
```

---

### 2. **File Integrity Monitoring (Audit)** 🔒
**Status**: ⚙️ **HYBRID (Manual + Automated)**

#### Current Process:

**Manual Part**:
1. User uploads a log file via UI
2. OR user provides a server file path
3. Backend calculates SHA256 hash and stores snapshot
4. First-time registration in database

**Automated Part**:
1. APScheduler runs every 5 minutes (configurable)
2. Automatically re-verifies ALL registered files
3. Detects changes automatically
4. Sends real-time alerts if tampering detected

#### What This Means:
- ❌ Initial file registration is manual
- ✅ Once registered, monitoring is automatic
- ✅ Scheduled integrity checks run in background
- ✅ Automatic alerts on tampering

#### Example Flow:
```
Day 1: User uploads "critical.log" → System stores hash
Day 2-∞: Scheduler checks file every 5 min → Alerts if changed
```

---

### 3. **System Logs Monitoring** 📝
**Status**: ⚙️ **HYBRID (Manual + Semi-Automated)**

#### Current Process:

**Option A - Manual (What you're probably doing now)**:
1. User generates test logs using `generate_test_data.ps1`
2. Script posts logs to backend API
3. Frontend displays logs in real-time

**Option B - Semi-Automated (Available but maybe not used)**:
1. Run `system_monitor.py` as a background process
2. It "tails" (follows) a real log file continuously
3. Automatically POSTs new lines to backend as they appear
4. Frontend receives real-time updates via WebSocket

#### What This Means:
- ❌ No built-in system log collector (like Fluentd/Logstash)
- ❌ Requires manual setup of `system_monitor.py` for each log file
- ✅ Once setup, it continuously monitors the file
- ⚠️ You're probably using test data generators instead of real logs

#### Example Usage (Semi-Automated):
```powershell
# In one terminal - keep this running
cd ThreatTrace/backend
python system_monitor.py --file "C:/Windows/System32/winevt/Logs/Security.evtx" --source "windows_security"

# This will continuously stream new log entries to your dashboard
```

---

## 🔍 Why Is It Mostly Manual?

Your system was built as a **proof-of-concept / demonstration tool**, not a production-grade autonomous monitoring system. Here's why:

### Design Decisions:
1. **Controlled Environment**: Manual uploads give you full control for testing
2. **Educational Purpose**: Shows how each feature works step-by-step
3. **Demo-Friendly**: Easy to demonstrate to stakeholders
4. **No System Integration**: Doesn't require deep OS permissions or daemon setup
5. **Platform Independent**: Works on any OS without complex setup

---

## 🚀 How to Make It More Automated

### **Option 1: Use Existing Semi-Automated Tools**

#### For System Logs (Already Built):
```powershell
# Start monitoring Windows Event Log
cd ThreatTrace\backend
python system_monitor.py --file "C:\Windows\System32\winevt\Logs\System.evtx" --source "windows_system"

# Or monitor application logs
python system_monitor.py --file "C:\app\logs\application.log" --source "myapp"
```

**Pro**: No code changes needed, already exists  
**Con**: Manual setup per log file, requires keeping Python script running

---

#### For File Integrity (Already Built):
The scheduler already runs automatically! Just register files once:

```bash
# Via API (one-time registration)
POST /api/audit/upload-verify
# Or
POST /api/audit/verify-path
Body: { "log_path": "C:/critical/data.txt" }

# After registration, scheduler checks it every 5 minutes automatically
```

**Pro**: Already working, fully automated after initial setup  
**Con**: Initial registration is manual

---

### **Option 2: Build Full Automation** (Requires New Development)

Here's what you'd need to add:

#### A. **Auto-Discovery Ransomware Scanner**
```python
# New feature: Scheduled directory scanner
# Automatically scans specific folders every hour

Features to add:
- Configure watched directories (e.g., Downloads, Documents)
- Scheduled recursive file scanning
- Whitelist known-safe files
- Quarantine suspicious files automatically
```

#### B. **System Log Agent** (Like Filebeat/Fluentd)
```python
# New feature: Background service that automatically collects logs

Features to add:
- Windows Event Log integration (using `win32evtlog`)
- Linux syslog integration (tail `/var/log/*`)
- Auto-detect new log files
- Run as Windows Service / Linux systemd daemon
```

#### C. **File Integrity Auto-Registration**
```python
# New feature: Auto-register important system files

Features to add:
- Predefined critical file paths
- Auto-discover configuration files
- Registry monitoring (Windows)
- System file protection monitoring
```

---

## 📋 What You're Currently Doing (Best Guess)

Based on your project structure, I believe your current workflow is:

### Testing/Demo Workflow:
```
1. Start Backend:
   cd ThreatTrace/backend
   python app.py

2. Start Frontend:
   cd ThreatTrace/frontend  
   npm run dev

3. Generate Test Data:
   Run: generate_test_data.ps1
   Choose option to generate logs

4. Manually Test Features:
   - Upload files for ransomware scan
   - Upload files for integrity check
   - View generated logs in UI
   - Observe real-time alerts

5. Scheduler runs in background (automatic)
   - Checks registered files every 5 min
```

### What's Automatic:
- ✅ File integrity re-verification (after initial registration)
- ✅ WebSocket real-time updates
- ✅ Alert broadcasting
- ✅ Email notifications

### What's Manual:
- ❌ File uploads for ransomware scanning
- ❌ Initial file registration for audit
- ❌ Log generation/ingestion (using test script)

---

## 🎯 Recommendations

### For Current Use (No Code Changes):

1. **Use system_monitor.py for Real Logs**:
   ```powershell
   # Monitor real Windows logs
   python system_monitor.py --file "C:\Windows\Logs\CBS\CBS.log" --source "windows_cbs"
   ```

2. **Register Critical Files Once**:
   ```bash
   # Use the API to register files you want to monitor
   # The scheduler will automatically check them
   ```

3. **Keep Test Data Generator for Demos**:
   - It's perfect for demonstrations
   - Generates realistic-looking data

---

### For Production Deployment (Requires Development):

Would you like me to build any of these enhancements?

1. **Auto-Discovery Scanner** - Automatically scan folders for ransomware
2. **Windows Service Wrapper** - Run system_monitor as a Windows service
3. **Auto-Registration Module** - Auto-register critical system files
4. **Directory Watcher** - Monitor folders for new files automatically
5. **Integration with Real Logging Systems** - Connect to Windows Event Log, Syslog, etc.

---

## 💡 Summary

**Your Understanding is Correct**: Yes, the system currently requires significant manual work to upload files and generate logs.

**Why**: It was designed as a **demonstration/POC platform** rather than a production monitoring agent.

**What's Already Automated**:
- File integrity re-checks (every 5 min after registration)
- Real-time alerts
- Email notifications

**What Could Be Automated** (with additional development):
- Automatic directory scanning for ransomware
- Automatic system log collection
- Automatic file registration for integrity monitoring
- Background service/daemon operation

---

## 🤔 Next Steps - What Would You Like?

1. **Keep it as-is** - Perfect for demos, presentations, and controlled testing
2. **Use existing automation better** - I can show you how to use `system_monitor.py` effectively
3. **Build full automation** - I can develop auto-discovery and background service features

Let me know which direction you want to go! 🚀
