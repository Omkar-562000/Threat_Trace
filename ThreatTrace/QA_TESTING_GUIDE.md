# 🧪 ThreatTrace - Comprehensive QA Testing Guide
## Role-Based Testing with Sample Data

**Last Updated:** 2026-01-19  
**Version:** 1.0  
**Purpose:** Complete testing guide for all user roles using generated test data

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Test Data Overview](#test-data-overview)
3. [Role 1: Personal User Testing](#role-1-personal-user-testing)
4. [Role 2: Corporate User Testing](#role-2-corporate-user-testing)
5. [Role 3: Technical User Testing](#role-3-technical-user-testing)
6. [Cross-Role Comparison](#cross-role-comparison)
7. [Expected Results Reference](#expected-results-reference)
8. [Bug Reporting Template](#bug-reporting-template)

---

## 🚀 Pre-Testing Setup

### Step 1: Ensure Both Servers Are Running

```powershell
# Terminal 1 - Backend
cd ThreatTrace/backend
python app.py
# Should see: "Running on http://127.0.0.1:5000"

# Terminal 2 - Frontend
cd ThreatTrace/frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

### Step 2: Verify Test Data Files Exist

Check `ThreatTrace/backend/test_files/` contains:
- ✅ `clean_system.log` (200 entries)
- ✅ `clean_system_tampered.log` (200 entries)
- ✅ `suspicious_activity.log` (150 entries)
- ✅ `critical_alerts.log` (100 entries)
- ✅ `realistic_mix.log` (500 entries)
- ✅ `large_system.log` (5000 entries)

If missing, regenerate:
```powershell
cd ThreatTrace/backend
python test_data_generator.py --mode suite
```

### Step 3: Open Application

Navigate to: **http://localhost:5173**

---

## 📊 Test Data Overview

| File Name | Entries | Purpose | Expected Result |
|-----------|---------|---------|-----------------|
| `clean_system.log` | 200 | Baseline clean logs | ✅ No threats detected |
| `clean_system_tampered.log` | 200 | Modified version | 🚨 Hash mismatch detected |
| `suspicious_activity.log` | 150 | Multiple failed logins, privilege escalation | ⚠️ Medium-High threat |
| `critical_alerts.log` | 100 | Ransomware patterns, unauthorized access | 🔴 Critical threats |
| `realistic_mix.log` | 500 | Mixed normal + suspicious | ⚠️ Some threats detected |
| `large_system.log` | 5000 | Performance testing | ✅ System handles large data |

---

## 👤 Role 1: Personal User Testing

**Account Type:** Personal - Individual User  
**Expected Features:** Basic monitoring, file integrity, alerts  
**Restricted Features:** Exports (CSV/PDF), Scheduler controls

### Create Personal Test Account

1. Go to http://localhost:5173
2. Click **"Sign Up"** (bottom of login page)
3. Fill in:
   - **Username:** `personal_tester`
   - **Email:** `personal@test.com`
   - **Password:** `Test123!`
   - **Account Type:** Select **"Personal - Individual User"**
4. Click **"Register"**
5. Login with credentials

---

### Test Case 1.1: Dashboard Access ✅

**Steps:**
1. After login, you should land on Dashboard
2. Verify you can see:
   - Recent alerts count
   - System health status
   - Quick stats

**Expected Result:**
- ✅ Dashboard loads successfully
- ✅ No error messages
- ✅ Charts/graphs visible

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.2: File Integrity - Clean File ✅

**Steps:**
1. Navigate to **Audit** page (sidebar)
2. Click **"Upload File"**
3. Select: `ThreatTrace/backend/test_files/clean_system.log`
4. Click **Upload**

**Expected Result:**
- ✅ File uploads successfully
- ✅ Hash is calculated and displayed
- ✅ Status shows: **"Clean"** or **"No threats detected"**
- ✅ File appears in audit history table

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.3: File Integrity - Tampered File 🚨

**Steps:**
1. Stay on **Audit** page
2. Click **"Upload File"** again
3. Select: `ThreatTrace/backend/test_files/clean_system_tampered.log`
4. Click **Upload**

**Expected Result:**
- ✅ File uploads successfully
- 🚨 Hash mismatch detected
- ✅ Status shows: **"Tampered"** or **"File modified"**
- ✅ Alert is triggered
- ✅ File appears in audit history with tamper indicator

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.4: Export Audit - LOCKED 🔒

**Steps:**
1. Stay on **Audit** page
2. Look for **"Export CSV"** or **"Export"** button

**Expected Result:**
- 🔒 Export button should be **disabled** or show lock icon
- 🔒 Yellow warning box appears:
  - "Export features are available for Corporate and Technical users"
  - Shows upgrade prompt
- ❌ Clicking export should NOT work

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.5: Ransomware Detection ✅

**Steps:**
1. Navigate to **Ransomware** page
2. Click **"Upload File for Scanning"**
3. Select: `ThreatTrace/backend/test_files/suspicious_activity.log`
4. Click **Scan**

**Expected Result:**
- ✅ File scans successfully
- ✅ Threat score is displayed (0-100)
- ✅ Risk level shown (Low/Medium/High/Critical)
- ✅ Scan history appears

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.6: System Logs Viewing ✅

**Steps:**
1. Navigate to **System Logs** page
2. Verify logs are visible

**Expected Result:**
- ✅ Logs load in table format
- ✅ Can see: Timestamp, Level, Message, Source
- ✅ Filter by level works (INFO, WARNING, ERROR)
- ✅ Search box works
- ✅ Pagination works (if many logs)

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.7: System Logs Export - LOCKED 🔒

**Steps:**
1. Stay on **System Logs** page
2. Look for **"Export CSV"** or **"Export PDF"** buttons

**Expected Result:**
- 🔒 Export section should show **locked panel**:
  - Yellow warning box with lock icon
  - Message: "Export features available for Corporate and Technical users"
  - Shows upgrade prompt
- ❌ Export buttons should be disabled or hidden

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.8: Scheduler - LOCKED 🔒

**Steps:**
1. Go to **Audit** page
2. Look for **"Scheduler"** or **"Automated Scans"** section

**Expected Result:**
- 🔒 Scheduler controls should show **locked message**:
  - "Automated scanning available for Corporate and Technical users"
  - Upgrade prompt
- ❌ Cannot start/stop scheduler

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.9: Settings Page ✅

**Steps:**
1. Navigate to **Settings** page
2. Check your role badge

**Expected Result:**
- ✅ Role badge shows: **"Personal"** (blue color)
- ✅ Features list shows:
  - ✅ Dashboard analytics
  - ✅ File integrity monitoring
  - ✅ Ransomware detection
  - ✅ System logs viewing
  - ✅ Real-time alerts
- ✅ Missing features clearly indicated

**Status:** [ ] Pass [ ] Fail

---

### Test Case 1.10: Real-Time Alerts ✅

**Steps:**
1. Keep browser open
2. In a new terminal, generate real-time logs:
   ```powershell
   cd ThreatTrace/backend
   python test_data_generator.py --mode continuous --duration 2 --interval 3
   ```
3. Watch for toast notifications

**Expected Result:**
- ✅ Toast notifications appear when new threats detected
- ✅ Alert counter updates
- ✅ Can navigate to Alerts page to see history
- ✅ Real-time updates work via WebSocket

**Status:** [ ] Pass [ ] Fail

---

### Personal User Summary Checklist

- [ ] Can login successfully
- [ ] Dashboard accessible
- [ ] File integrity monitoring works
- [ ] Tamper detection works
- [ ] Ransomware scanning works
- [ ] System logs viewing works
- [ ] Real-time alerts work
- [ ] **LOCKED:** Export features (CSV/PDF)
- [ ] **LOCKED:** Scheduler controls
- [ ] Settings shows correct role badge

---

## 🏢 Role 2: Corporate User Testing

**Account Type:** Corporate - Big Firm/Enterprise  
**Expected Features:** All Personal + Exports (CSV/PDF), Scheduled Scans  
**Restricted Features:** Scheduler controls (Technical only)

### Create Corporate Test Account

1. **Logout** from Personal account (if logged in)
2. Click **"Sign Up"**
3. Fill in:
   - **Username:** `corporate_tester`
   - **Email:** `corporate@test.com`
   - **Password:** `Test123!`
   - **Account Type:** Select **"Corporate - Big Firm/Enterprise"**
4. Click **"Register"**
5. Login with credentials

---

### Test Case 2.1: All Personal Features ✅

**Steps:**
Repeat all Personal user test cases (1.1 - 1.10) except locked features

**Expected Result:**
- ✅ All features that worked for Personal should work for Corporate
- ✅ Dashboard, Audit, Ransomware, System Logs all accessible

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2.2: Export Audit CSV - UNLOCKED ✅

**Steps:**
1. Navigate to **Audit** page
2. Upload a few test files (if audit history is empty):
   - `clean_system.log`
   - `suspicious_activity.log`
3. Look for **"Export CSV"** button
4. Click **"Export CSV"**

**Expected Result:**
- ✅ Export button is **enabled** (no lock icon)
- ✅ CSV file downloads successfully
- ✅ File name: `audit_report_YYYY-MM-DD.csv`
- ✅ Open CSV - verify it contains:
  - File names
  - Upload dates
  - Hash values
  - Status (Clean/Tampered)

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2.3: Export System Logs CSV - UNLOCKED ✅

**Steps:**
1. Navigate to **System Logs** page
2. Verify logs are present
3. Click **"Export CSV"** button

**Expected Result:**
- ✅ Export CSV button is **enabled**
- ✅ CSV file downloads: `system_logs_YYYY-MM-DD.csv`
- ✅ Open CSV - verify it contains:
  - Timestamps
  - Log levels
  - Messages
  - Sources

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2.4: Export System Logs PDF - UNLOCKED ✅

**Steps:**
1. Stay on **System Logs** page
2. Click **"Export PDF"** button

**Expected Result:**
- ✅ Export PDF button is **enabled**
- ✅ PDF file downloads: `system_logs_YYYY-MM-DD.pdf`
- ✅ Open PDF - verify it contains:
  - Formatted table with logs
  - ThreatTrace branding/header
  - Readable formatting

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2.5: Scheduler - STILL LOCKED 🔒

**Steps:**
1. Go to **Audit** page
2. Look for **"Scheduler"** section

**Expected Result:**
- 🔒 Scheduler controls should still be **locked**:
  - "Automated scanning available for Technical users only"
  - Upgrade to Technical prompt
- ❌ Cannot start/stop scheduler
- ❌ Corporate does NOT have scheduler access

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2.6: Settings Page Role Badge ✅

**Steps:**
1. Navigate to **Settings** page
2. Check role badge

**Expected Result:**
- ✅ Role badge shows: **"Corporate"** (purple color)
- ✅ Features list shows:
  - ✅ All Personal features
  - ✅ Export audit reports (CSV)
  - ✅ Export system logs (CSV/PDF)
  - ✅ Advanced analytics
  - ❌ Scheduler control (locked)

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2.7: Performance Test with Large File ✅

**Steps:**
1. Navigate to **System Logs** page
2. In terminal, ingest large file:
   ```powershell
   cd ThreatTrace/backend
   python test_data_generator.py --mode ingest --file test_files/large_system.log
   ```
3. Refresh **System Logs** page
4. Try to export CSV/PDF

**Expected Result:**
- ✅ Large file (5000 entries) loads successfully
- ✅ Pagination works smoothly
- ✅ Export handles large data (may take a few seconds)
- ✅ CSV/PDF generated successfully with all 5000 entries

**Status:** [ ] Pass [ ] Fail

---

### Corporate User Summary Checklist

- [ ] All Personal features work
- [ ] **UNLOCKED:** Export Audit CSV
- [ ] **UNLOCKED:** Export System Logs CSV
- [ ] **UNLOCKED:** Export System Logs PDF
- [ ] **STILL LOCKED:** Scheduler controls
- [ ] Settings shows "Corporate" role badge
- [ ] Performance handles large datasets

---

## 🔧 Role 3: Technical User Testing

**Account Type:** Technical - IT/Security Professional  
**Expected Features:** All Corporate + Scheduler Controls, Full API Access  
**Restricted Features:** None (Full Access)

### Create Technical Test Account

1. **Logout** from Corporate account
2. Click **"Sign Up"**
3. Fill in:
   - **Username:** `technical_tester`
   - **Email:** `technical@test.com`
   - **Password:** `Test123!`
   - **Account Type:** Select **"Technical - IT/Security Professional"**
4. Click **"Register"**
5. Login with credentials

---

### Test Case 3.1: All Corporate Features ✅

**Steps:**
Repeat all Corporate user test cases (2.1 - 2.7)

**Expected Result:**
- ✅ All features that worked for Corporate should work for Technical
- ✅ All exports work (CSV/PDF)

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3.2: Scheduler - Start Scheduler ✅

**Steps:**
1. Navigate to **Audit** page
2. Find **"Scheduler"** or **"Automated Scans"** section
3. Click **"Start Scheduler"** button

**Expected Result:**
- ✅ Scheduler controls are **fully unlocked** (no lock icon)
- ✅ "Start Scheduler" button works
- ✅ Success message appears: "Scheduler started successfully"
- ✅ Button changes to "Stop Scheduler"
- ✅ Status shows: "Running" or "Active"

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3.3: Scheduler - Stop Scheduler ✅

**Steps:**
1. Stay on **Audit** page (scheduler should be running)
2. Click **"Stop Scheduler"** button

**Expected Result:**
- ✅ "Stop Scheduler" button works
- ✅ Success message: "Scheduler stopped successfully"
- ✅ Button changes back to "Start Scheduler"
- ✅ Status shows: "Stopped" or "Inactive"

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3.4: Scheduler - Trigger Manual Scan ✅

**Steps:**
1. Stay on **Audit** page
2. Click **"Trigger Scan Now"** or **"Run Now"** button

**Expected Result:**
- ✅ Manual trigger button works
- ✅ Success message: "Scan triggered successfully"
- ✅ New audit entry appears (if configured)
- ✅ Scan executes immediately

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3.5: Settings Page Role Badge ✅

**Steps:**
1. Navigate to **Settings** page
2. Check role badge

**Expected Result:**
- ✅ Role badge shows: **"Technical"** (green color)
- ✅ Features list shows:
  - ✅ All Corporate features
  - ✅ Scheduler controls
  - ✅ Automated scans
  - ✅ Full API access
  - ✅ Complete feature set
- ✅ No locked features

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3.6: API Access Test (Advanced) ✅

**Steps:**
1. Get your JWT token from browser localStorage:
   - Open browser DevTools (F12)
   - Go to **Application** > **Local Storage**
   - Find `token` value, copy it
2. Test API with curl or Postman:
   ```powershell
   # Example: Get audit logs via API
   curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/audit
   ```

**Expected Result:**
- ✅ API responds successfully with JSON data
- ✅ No 403 Forbidden errors
- ✅ Technical role has full API access

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3.7: Automated Background Testing ✅

**Steps:**
1. Start the automated test scheduler:
   ```powershell
   cd ThreatTrace/backend
   python automated_test_scheduler.py
   ```
2. Let it run for 10-15 minutes
3. Monitor the application:
   - Check System Logs page
   - Check Audit page
   - Check Alerts page

**Expected Result:**
- ✅ Automated scheduler runs without errors
- ✅ New logs appear every 5 minutes
- ✅ Security events trigger every 10 minutes
- ✅ Alerts are created
- ✅ Dashboard updates automatically
- ✅ System remains stable

**Status:** [ ] Pass [ ] Fail

---

### Technical User Summary Checklist

- [ ] All Corporate features work
- [ ] All Personal features work
- [ ] **UNLOCKED:** Start/Stop Scheduler
- [ ] **UNLOCKED:** Trigger manual scans
- [ ] **UNLOCKED:** Full API access
- [ ] Settings shows "Technical" role badge (green)
- [ ] Automated testing runs successfully
- [ ] No feature restrictions

---

## 🔀 Cross-Role Comparison

### Feature Access Matrix

| Feature | Personal 🔵 | Corporate 🟣 | Technical 🟢 |
|---------|------------|-------------|-------------|
| Dashboard | ✅ | ✅ | ✅ |
| File Integrity Monitoring | ✅ | ✅ | ✅ |
| Tamper Detection | ✅ | ✅ | ✅ |
| Ransomware Scanning | ✅ | ✅ | ✅ |
| System Logs Viewing | ✅ | ✅ | ✅ |
| Real-time Alerts | ✅ | ✅ | ✅ |
| Search & Filters | ✅ | ✅ | ✅ |
| **Export Audit CSV** | 🔒 | ✅ | ✅ |
| **Export Logs CSV** | 🔒 | ✅ | ✅ |
| **Export Logs PDF** | 🔒 | ✅ | ✅ |
| **Scheduler Controls** | 🔒 | 🔒 | ✅ |
| **Automated Scans** | 🔒 | 🔒 | ✅ |
| **Full API Access** | ❌ | ❌ | ✅ |

### Expected Lock Behavior

**Personal User sees:**
- 🔒 Lock icons on export buttons
- 🔒 Yellow warning boxes with upgrade prompts
- 🔒 "Upgrade to Corporate" messages for exports
- 🔒 "Upgrade to Technical" messages for scheduler

**Corporate User sees:**
- ✅ Enabled export buttons (CSV/PDF)
- 🔒 Lock only on scheduler controls
- 🔒 "Upgrade to Technical" messages for scheduler

**Technical User sees:**
- ✅ All features enabled
- ✅ No lock icons
- ✅ Full access to everything

---

## 📈 Expected Results Reference

### File Upload Expected Behaviors

| File | Hash Match | Threat Level | Alert? | Status |
|------|-----------|--------------|--------|--------|
| `clean_system.log` | ✅ | None | No | Clean |
| `clean_system_tampered.log` | ❌ | High | Yes | Tampered |
| `suspicious_activity.log` | N/A | Medium-High | Yes | Suspicious |
| `critical_alerts.log` | N/A | Critical | Yes | Critical |
| `realistic_mix.log` | N/A | Medium | Maybe | Mixed |

### Performance Benchmarks

| Action | Expected Time | Acceptable Range |
|--------|---------------|------------------|
| Login | < 1 second | 0.5 - 2 seconds |
| Upload small file (200 entries) | < 2 seconds | 1 - 5 seconds |
| Upload large file (5000 entries) | < 10 seconds | 5 - 20 seconds |
| Export CSV | < 3 seconds | 1 - 8 seconds |
| Export PDF | < 5 seconds | 2 - 10 seconds |
| Dashboard load | < 2 seconds | 1 - 5 seconds |
| Real-time log update | Instant | < 2 seconds |

### API Response Codes

| Scenario | Expected Code | Response |
|----------|---------------|----------|
| Successful request | 200 | JSON data |
| Login success | 200 | JWT token |
| Invalid credentials | 401 | "Invalid credentials" |
| Personal tries export | 403 | "Forbidden: Requires corporate or technical role" |
| Corporate tries scheduler | 403 | "Forbidden: Requires technical role" |
| Invalid token | 401 | "Unauthorized" |
| Server error | 500 | Error message |

---

## 🐛 Bug Reporting Template

If you find any issues during testing, use this template:

```markdown
### Bug Report #[NUMBER]

**Reporter:** [Your Name]
**Date:** [Date]
**Role Tested:** [ ] Personal [ ] Corporate [ ] Technical

**Test Case:** [e.g., Test Case 2.2: Export Audit CSV]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Steps to Reproduce:**
1. 
2. 
3. 

**Screenshots/Error Messages:**
[Attach or paste here]

**Browser/Environment:**
- Browser: [Chrome/Firefox/Edge]
- OS: [Windows 10/11]
- Screen Resolution: [1920x1080]

**Severity:**
[ ] Critical - Feature completely broken
[ ] High - Major functionality affected
[ ] Medium - Workaround available
[ ] Low - Minor visual/text issue

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ Final QA Sign-Off Checklist

### Personal User Testing
- [ ] All 10 test cases passed
- [ ] Lock behavior verified (exports locked)
- [ ] No errors in browser console
- [ ] Performance acceptable

### Corporate User Testing
- [ ] All 7 test cases passed
- [ ] Exports work (CSV/PDF)
- [ ] Scheduler still locked (correct behavior)
- [ ] Performance with large datasets acceptable

### Technical User Testing
- [ ] All 7 test cases passed
- [ ] Scheduler controls work
- [ ] API access works
- [ ] Automated testing runs successfully

### Cross-Functional Testing
- [ ] Role comparison matrix verified
- [ ] Expected behaviors match actual
- [ ] Performance benchmarks met
- [ ] No critical bugs found

### Documentation
- [ ] All test results documented
- [ ] Bugs reported (if any)
- [ ] Screenshots captured
- [ ] QA report completed

---

## 🎯 Testing Completion Criteria

**ThreatTrace is ready for deployment when:**

✅ All three roles tested completely (30+ test cases)
✅ Feature restrictions work as expected (lock behavior verified)
✅ All exports generate correctly (CSV/PDF)
✅ Scheduler controls work for Technical users only
✅ File integrity detection works (tamper detection)
✅ Ransomware scanning works
✅ Real-time alerts functioning
✅ Performance benchmarks met
✅ No critical or high-severity bugs
✅ MongoDB Atlas connection stable
✅ Automated testing runs for 24 hours without errors

---

## 📞 Support & Resources

- **Setup Guide:** `SETUP_GUIDE.md`
- **Role Implementation:** `ROLE_FEATURES_IMPLEMENTED.md`
- **Developer Guide:** `ROLE_BASED_ACCESS_GUIDE.md`
- **Quick Testing:** `QUICK_TEST_GUIDE.md`
- **Automated Tests:** `automated_test_scheduler.py`
- **Test Data Generator:** `test_data_generator.py`

---

**Happy Testing! 🚀🔐**

*ThreatTrace - AI-Powered Security Monitoring Platform*
