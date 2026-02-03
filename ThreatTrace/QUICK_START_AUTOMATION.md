# 🚀 ThreatTrace Automation - Quick Start

## One-Time Setup (5 Minutes)

### **Step 1: Install Dependencies**
```powershell
.\start_automation.ps1 -Setup
```

### **Step 2: Configure Monitoring**
Edit `ThreatTrace\backend\automation_config.py`:
- Set directories to scan for ransomware
- Set critical files to monitor for tampering
- Configure which Windows Event Logs to collect

### **Step 3: Start Backend**
```powershell
cd ThreatTrace\backend
python app.py
```
**Keep this terminal running!**

### **Step 4: Register Files (One-Time)**
Open a NEW terminal:
```powershell
.\start_automation.ps1 -Register
```

### **Step 5: Start Automation**
Open ANOTHER new terminal:
```powershell
.\start_automation.ps1 -Start
```
**Keep this terminal running!**

---

## ✅ That's It!

Your system is now:
- ✅ Scanning directories for ransomware every 5 minutes
- ✅ Collecting Windows Event Logs in real-time
- ✅ Monitoring files for tampering every 5 minutes
- ✅ Sending alerts to your dashboard

---

## 📊 View Results

1. Start frontend (if not running):
   ```powershell
   cd ThreatTrace\frontend
   npm run dev
   ```

2. Open browser: `http://localhost:5173`

3. Check:
   - **Dashboard** → Real-time security metrics
   - **System Logs** → Windows events streaming in
   - **Ransomware** → Auto-scan results (wait 5 min)
   - **Audit** → File integrity checks

---

## 🛑 Stopping Everything

Press **Ctrl+C** in each terminal:
1. Automation terminal
2. Backend terminal
3. Frontend terminal (optional)

---

## 📖 Full Documentation

See [AUTOMATION_SETUP_GUIDE.md](./AUTOMATION_SETUP_GUIDE.md) for:
- Detailed configuration options
- Troubleshooting
- Advanced usage
- Running as Windows service

---

## 🔧 Common Commands

```powershell
# Check configuration
.\start_automation.ps1 -Status

# Re-register files after config changes
.\start_automation.ps1 -Register

# Start automation
.\start_automation.ps1 -Start
```

---

## ⚡ Daily Workflow

After initial setup, to start everything:

**Terminal 1:**
```powershell
cd ThreatTrace\backend ; python app.py
```

**Terminal 2:**
```powershell
.\start_automation.ps1 -Start
```

**Terminal 3:**
```powershell
cd ThreatTrace\frontend ; npm run dev
```

That's it! Everything runs automatically. 🎉
