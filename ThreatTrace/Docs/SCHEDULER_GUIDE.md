# ThreatTrace Scheduler Guide

## 🔧 What is the Scheduler?

The **Audit Scheduler** is an automated background service that runs file integrity checks on a regular schedule. Instead of manually verifying files one by one, the scheduler does it automatically for you.

---

## 🎯 How It Works

### **The Process:**

1. **Register Files**: When you verify a file (either by path or upload), it gets registered in the system
2. **Scheduler Runs**: At set intervals, the scheduler automatically re-checks all registered files
3. **Detect Changes**: If a file has been modified (tampered), you get an alert
4. **Real-time Notifications**: Tampering alerts appear via WebSocket in real-time

---

## 🚀 How to Use

### **Requirements:**
- ✅ **Role**: Technical (only Technical users can control the scheduler)
- ✅ **Location**: Navigate to **Audit** page → Scheduler Controls section

### **Controls Explained:**

#### **1. Interval (seconds)**
- Sets how often the scheduler runs checks
- Range: 30 - 3600 seconds
- Examples:
  - `60` = Check every minute
  - `300` = Check every 5 minutes (default)
  - `600` = Check every 10 minutes
  - `3600` = Check every hour

#### **2. Start Button** (▶)
- Begins the automated scanning process
- Uses the interval you set
- Status changes to "⚡ Running"
- Disabled when scheduler is already running

**When to use:**
- After setting your desired interval
- When you want continuous monitoring

#### **3. Stop Button** (⏹)
- Pauses the automated scanning
- Status changes to "⏸️ Stopped"
- Disabled when scheduler is not running

**When to use:**
- During maintenance
- When you need to pause monitoring temporarily

#### **4. Run Now Button** (⚡)
- Triggers an immediate scan of all files
- Works whether scheduler is running or stopped
- Useful for on-demand checks

**When to use:**
- After making changes to files
- When you want an immediate integrity check
- Testing the system

---

## 📋 Step-by-Step Usage

### **First Time Setup:**

1. **Go to Audit page**
2. **Verify some files first**:
   - Use "Verify Path" to add files from your system
   - Or use "Upload & Scan" to upload test files
   - These files will be registered for scheduled checks

3. **Set the interval**:
   - Type a number in the "Interval (seconds)" field
   - Recommended: Start with `300` (5 minutes)

4. **Click "Start"**:
   - The scheduler will begin running
   - Status shows "⚡ Running"
   - Every 5 minutes (or your interval), all registered files are checked

5. **Monitor results**:
   - Check the "Audit History" table below
   - Watch for tamper alerts (red notifications)
   - Real-time alerts appear via WebSocket

### **Triggering Manual Check:**

1. **Click "Run Now"** button
2. Wait a few seconds
3. Check "Audit History" for new entries
4. Success message appears if scan completes

### **Stopping the Scheduler:**

1. **Click "Stop"** button
2. Status changes to "⏸️ Stopped"
3. Automated checks pause
4. You can still use "Run Now" for manual checks

---

## ❓ Common Questions

### **Q: What files does the scheduler check?**
A: All files that have been verified at least once (via "Verify Path" or "Upload & Scan")

### **Q: What happens if a file is tampered?**
A: 
- Alert appears in the Audit History table
- Red "Tampered" badge shown
- Real-time WebSocket notification
- Email alert sent (if configured)

### **Q: Can I change the interval while it's running?**
A: Yes, but you need to:
1. Stop the scheduler
2. Change the interval
3. Start again

### **Q: Does "Run Now" work when scheduler is stopped?**
A: Yes! "Run Now" works independently of the scheduler state

### **Q: I don't see the Scheduler Controls**
A: You need the **Technical** role. Other roles (Personal, Corporate) will see a locked message with explanation.

### **Q: What's a good interval?**
A: Depends on your needs:
- **High security files**: 60-300 seconds (1-5 minutes)
- **Normal monitoring**: 300-600 seconds (5-10 minutes)
- **Low priority**: 1800-3600 seconds (30-60 minutes)

---

## 🎨 Visual Guide

### **When Scheduler is Stopped:**
```
Status: ⏸️ Stopped
Available Actions:
- ✅ Set Interval
- ✅ Click "Start"
- ✅ Click "Run Now"
- ❌ "Stop" is disabled
```

### **When Scheduler is Running:**
```
Status: ⚡ Running
Available Actions:
- ❌ Interval is locked (stop first to change)
- ❌ "Start" is disabled
- ✅ Click "Stop"
- ✅ Click "Run Now" (anytime)
```

---

## 🔍 Behind the Scenes

### **What the Scheduler Does:**

1. **Fetches all registered files** from the database
2. **Calculates current hash** for each file
3. **Compares with stored hash** from last check
4. **Updates database** with results
5. **Sends alerts** if tampering detected
6. **Waits** for the interval duration
7. **Repeats** the process

### **Technology:**
- Backend: Python APScheduler
- Runs in background thread
- Non-blocking (doesn't affect other operations)
- Configurable intervals

---

## ⚠️ Important Notes

1. **Server restart** stops the scheduler (you'll need to start it again)
2. **Long intervals** mean delayed tamper detection
3. **Short intervals** increase server load
4. **Technical role required** to control the scheduler
5. **Files must be verified first** before scheduler can check them

---

## 🛠️ Troubleshooting

### **Issue: Scheduler won't start**
**Solutions:**
- Check you have Technical role
- Verify interval is between 30-3600
- Check backend server is running
- Look for error messages in toast notifications

### **Issue: No files being scanned**
**Solutions:**
- Verify at least one file first
- Click "Run Now" to test
- Check Audit History for entries

### **Issue: Status not updating**
**Solutions:**
- Refresh the page
- Click "Run Now" to trigger manual check
- Check browser console for errors

---

## 📊 Example Workflow

### **Scenario: Monitor critical system logs**

1. **Add your files**:
   - Verify `C:/Windows/System32/config/system.log`
   - Verify `C:/logs/security.log`
   - Verify `C:/logs/application.log`

2. **Configure scheduler**:
   - Set interval to `300` (5 minutes)
   - Click "Start"

3. **Result**:
   - Every 5 minutes, all 3 logs are checked
   - If any file changes, you get instant alert
   - History table shows all checks

4. **When tampering detected**:
   - Red toast notification appears
   - Entry in history marked "Tampered"
   - Email alert sent (if configured)
   - WebSocket alert sent to connected clients

---

**Happy Monitoring! 🚀**

For more help, check the main documentation or contact support.
