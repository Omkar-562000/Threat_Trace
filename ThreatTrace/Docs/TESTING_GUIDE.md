# 🧪 ThreatTrace Testing Guide

Complete guide for manual and automated testing of ThreatTrace security monitoring platform.

---

## 📋 Table of Contents

1. [Manual Testing](#manual-testing)
2. [Automated Testing](#automated-testing)
3. [Test Data Generation](#test-data-generation)
4. [Role-Based Testing](#role-based-testing)
5. [Performance Testing](#performance-testing)
6. [Continuous Integration](#continuous-integration)

---

## 🔧 Manual Testing

### Prerequisites

1. **Both servers running:**
   ```powershell
   # Terminal 1 - Backend
   cd ThreatTrace/backend
   python app.py
   
   # Terminal 2 - Frontend
   cd ThreatTrace/frontend
   npm run dev
   ```

2. **MongoDB Atlas connected** (check backend logs for ✅)

3. **Create test accounts** with different roles (Personal, Corporate, Technical)

---

### Test Scenario 1: File Integrity Monitoring

**Objective:** Verify that ThreatTrace can detect file tampering

**Steps:**

1. **Generate test files:**
   ```powershell
   cd ThreatTrace/backend
   python test_data_generator.py --mode suite
   ```

2. **Upload clean log:**
   - Go to **Audit** page
   - Upload `test_files/clean_system.log`
   - System calculates hash and stores baseline

3. **Upload tampered log:**
   - Upload `test_files/clean_system_tampered.log`
   - ✅ **Expected:** System detects tampering
   - ✅ **Expected:** Red alert shows "TAMPERED"
   - ✅ **Expected:** Email alert sent (if configured)

4. **Check audit history:**
   - View history of all scans
   - See tamper status for each file

5. **Test export (Corporate/Technical only):**
   - Click "Export Latest CSV"
   - ✅ **Expected:** CSV file downloads
   - ✅ **Expected:** Personal users see 🔒 locked message

---

### Test Scenario 2: Real-Time Log Monitoring

**Objective:** Test real-time log ingestion and alerts

**Steps:**

1. **Start continuous log generation:**
   ```powershell
   cd ThreatTrace/backend
   python test_data_generator.py --mode continuous --duration 5 --interval 3
   ```

2. **Monitor System Logs page:**
   - Go to **System Logs** page
   - ✅ **Expected:** Logs appear in real-time
   - ✅ **Expected:** Timeline chart updates
   - ✅ **Expected:** Toast notifications for new logs

3. **Test filters:**
   - Filter by level (INFO, WARNING, ERROR)
   - Search for specific keywords
   - Filter by date range
   - ✅ **Expected:** Filters work correctly

4. **Test exports (Corporate/Technical only):**
   - Click "Export CSV"
   - Click "Export PDF"
   - ✅ **Expected:** Files download
   - ✅ **Expected:** Personal users see locked message

---

### Test Scenario 3: Role-Based Access Control

**Objective:** Verify role restrictions work correctly

**Steps:**

1. **Test as Personal user:**
   - Login with Personal account
   - Try to export audit CSV → 🔒 Locked
   - Try to export logs → 🔒 Locked
   - Try to access scheduler → 🔒 Locked
   - ✅ **Expected:** All premium features locked

2. **Test as Corporate user:**
   - Login with Corporate account
   - Export audit CSV → ✅ Works
   - Export logs CSV/PDF → ✅ Works
   - Try to access scheduler → 🔒 Locked
   - ✅ **Expected:** Exports work, scheduler locked

3. **Test as Technical user:**
   - Login with Technical account
   - Export audit CSV → ✅ Works
   - Export logs → ✅ Works
   - Access scheduler controls → ✅ Works
   - ✅ **Expected:** All features unlocked

---

### Test Scenario 4: Ransomware Detection

**Objective:** Test file upload and scanning

**Steps:**

1. Go to **Ransomware** page

2. **Upload clean file:**
   - Upload `test_files/clean_system.log`
   - ✅ **Expected:** Low threat score
   - ✅ **Expected:** Green status

3. **Upload suspicious file:**
   - Upload `test_files/suspicious_activity.log`
   - ✅ **Expected:** Medium threat score
   - ✅ **Expected:** Yellow warning

4. **Upload critical file:**
   - Upload `test_files/critical_alerts.log`
   - ✅ **Expected:** High threat score
   - ✅ **Expected:** Red alert

---

### Test Scenario 5: Authentication & Navigation

**Objective:** Test user flows and navigation

**Steps:**

1. **Signup flow:**
   - Click "Sign Up" from login
   - Fill in details
   - Select role
   - ✅ **Expected:** Redirects to login

2. **Login flow:**
   - Enter credentials
   - ✅ **Expected:** Redirects to dashboard

3. **Forgot password:**
   - Click "Forgot Password?"
   - Enter email
   - ✅ **Expected:** Success message
   - Check email for reset link (if email configured)

4. **Settings page:**
   - Go to Settings
   - ✅ **Expected:** See role badge
   - ✅ **Expected:** See feature list

---

## 🤖 Automated Testing

### Setup Automated Test Scheduler

The automated scheduler continuously generates test data and simulates real-world scenarios.

**1. Install dependencies:**
```powershell
cd ThreatTrace/backend
pip install schedule  # If not already installed
```

**2. Start automated scheduler:**
```powershell
cd ThreatTrace/backend
python automated_test_scheduler.py
```

**What it does:**
- ✅ Generates logs every 5 minutes
- ✅ Creates security events every 10 minutes
- ✅ Performs hourly log generation
- ✅ Simulates file tampering every 2 hours
- ✅ Triggers audit scans every 30 minutes
- ✅ Health checks every 15 minutes
- ✅ Daily cleanup of old files

**Expected output:**
```
🤖 ThreatTrace Automated Test Scheduler
======================================================================

Scheduled Tasks:
  • Real-time events: Every 5 minutes
  • Security events: Every 10 minutes
  • Hourly log generation: Every hour
  • Audit scan: Every 30 minutes
  • Tamper simulation: Every 2 hours
  • Health check: Every 15 minutes
  • Cleanup: Daily at midnight

Press Ctrl+C to stop
```

---

## 📊 Test Data Generation

### Quick Commands

**Generate complete test suite:**
```powershell
python test_data_generator.py --mode suite
```

Creates:
- `clean_system.log` - 200 clean entries
- `suspicious_activity.log` - 150 suspicious entries
- `critical_alerts.log` - 100 critical entries
- `realistic_mix.log` - 500 mixed entries
- `clean_system_tampered.log` - Tampered version
- `large_system.log` - 5000 entries for performance testing

**Ingest logs to system:**
```powershell
python test_data_generator.py --mode ingest --file test_files/realistic_mix.log
```

**Continuous real-time generation:**
```powershell
python test_data_generator.py --mode continuous --duration 10 --interval 5
```
- Runs for 10 minutes
- Generates log every 5 seconds

---

## 🎭 Role-Based Testing Matrix

| Test | Personal | Corporate | Technical |
|------|----------|-----------|-----------|
| **Dashboard** |
| View analytics | ✅ Pass | ✅ Pass | ✅ Pass |
| **Audit** |
| Upload & verify | ✅ Pass | ✅ Pass | ✅ Pass |
| Export CSV | ❌ Locked | ✅ Pass | ✅ Pass |
| View history | ✅ Pass | ✅ Pass | ✅ Pass |
| Scheduler controls | ❌ Locked | ❌ Locked | ✅ Pass |
| **System Logs** |
| View logs | ✅ Pass | ✅ Pass | ✅ Pass |
| Search & filter | ✅ Pass | ✅ Pass | ✅ Pass |
| Export CSV | ❌ Locked | ✅ Pass | ✅ Pass |
| Export PDF | ❌ Locked | ✅ Pass | ✅ Pass |
| **Ransomware** |
| Upload & scan | ✅ Pass | ✅ Pass | ✅ Pass |
| View reports | ✅ Pass | ✅ Pass | ✅ Pass |

---

## ⚡ Performance Testing

### Test Large Log Files

**Generate large dataset:**
```python
from test_data_generator import create_test_log_file

# 10,000 entries
create_test_log_file("test_files/perf_10k.log", 10000)

# 50,000 entries
create_test_log_file("test_files/perf_50k.log", 50000)

# 100,000 entries
create_test_log_file("test_files/perf_100k.log", 100000)
```

**Performance benchmarks to measure:**
- File upload time
- Hash calculation time
- Database query response time
- Real-time log rendering
- Export generation time

---

## 🔄 Continuous Integration

### Daily Test Schedule (Windows Task Scheduler)

**1. Create PowerShell script:** `run_daily_tests.ps1`
```powershell
cd E:\ThreatTrace\ThreatTrace\backend

# Generate fresh test data
python test_data_generator.py --mode suite

# Run for 1 hour with 1-minute intervals
python test_data_generator.py --mode continuous --duration 60 --interval 60

Write-Host "Daily tests completed"
```

**2. Schedule task:**
- Open Task Scheduler
- Create Basic Task
- Name: "ThreatTrace Daily Tests"
- Trigger: Daily at 2:00 AM
- Action: Start a program
- Program: `powershell.exe`
- Arguments: `-ExecutionPolicy Bypass -File "E:\ThreatTrace\run_daily_tests.ps1"`

---

## 📝 Test Checklists

### ✅ Pre-Release Checklist

- [ ] All three roles (Personal, Corporate, Technical) tested
- [ ] File integrity detection works correctly
- [ ] Tampered files detected
- [ ] Real-time logs streaming
- [ ] Exports work for Corporate/Technical users
- [ ] Exports blocked for Personal users
- [ ] Scheduler works for Technical users only
- [ ] Authentication flows work
- [ ] Password reset functional
- [ ] MongoDB connection stable
- [ ] No console errors in browser
- [ ] No Python errors in backend

### ✅ Automated Test Checklist

- [ ] Automated scheduler running
- [ ] Logs generating every 5 minutes
- [ ] Security events triggering
- [ ] Health checks passing
- [ ] No memory leaks over 24 hours
- [ ] Old files cleaning up properly

---

## 🐛 Troubleshooting Tests

### Test files not generating
```powershell
# Check if test_files directory exists
ls test_files

# If not, create it
mkdir test_files

# Run generator again
python test_data_generator.py --mode suite
```

### Logs not appearing in real-time
- Check if Socket.IO is connected (check browser console)
- Verify backend is running
- Check if auto-refresh is enabled in System Logs page

### Export not working
- Verify you're logged in with Corporate or Technical role
- Check browser console for errors
- Verify JWT token is being sent (Network tab)

### Scheduler not starting
```powershell
# Install schedule library
pip install schedule

# Check if backend is running
curl http://127.0.0.1:5000

# Run scheduler
python automated_test_scheduler.py
```

---

## 🎯 Testing Goals

### Functional Testing
- ✅ All features work as documented
- ✅ Role-based access enforced
- ✅ Real-time updates functioning

### Security Testing
- ✅ Tamper detection accurate
- ✅ Role restrictions can't be bypassed
- ✅ JWT tokens validated

### Performance Testing
- ✅ Handle 10,000+ logs without lag
- ✅ Real-time updates under 1 second
- ✅ Export large datasets (100MB+)

### Usability Testing
- ✅ Clear visual indicators
- ✅ Intuitive navigation
- ✅ Helpful error messages

---

## 📞 Support

If tests fail or you encounter issues:

1. Check backend terminal for errors
2. Check browser console (F12)
3. Verify MongoDB connection
4. Check server status at http://127.0.0.1:5000
5. Review logs in System Logs page

---

## 🎉 Success Criteria

Your testing is successful when:
- ✅ All manual test scenarios pass
- ✅ Automated scheduler runs for 24+ hours without errors
- ✅ Role-based access works correctly
- ✅ Real-time features responsive
- ✅ No data loss or corruption
- ✅ Export files are accurate

Happy Testing! 🚀🔐
