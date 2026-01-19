# 🚀 ThreatTrace - Quick Test Reference Card

**Print this out or keep it on your second monitor while testing!**

---

## 📋 Quick Setup Checklist

```
[ ] Backend running: cd ThreatTrace/backend; python app.py
[ ] Frontend running: cd ThreatTrace/frontend; npm run dev
[ ] MongoDB Atlas connected (check backend logs)
[ ] Test files exist in: ThreatTrace/backend/test_files/
[ ] Browser open: http://localhost:5173
```

---

## 👥 Test Accounts Quick Create

### Account 1: Personal
```
Username: personal_tester
Email: personal@test.com
Password: Test123!
Role: Personal - Individual User
```

### Account 2: Corporate
```
Username: corporate_tester
Email: corporate@test.com
Password: Test123!
Role: Corporate - Big Firm/Enterprise
```

### Account 3: Technical
```
Username: technical_tester
Email: technical@test.com
Password: Test123!
Role: Technical - IT/Security Professional
```

---

## 🎯 10-Minute Quick Test

### Personal User (3 minutes)
1. ✅ Login → Dashboard loads
2. ✅ Audit → Upload `clean_system.log` → Shows "Clean"
3. ✅ Audit → Upload `clean_system_tampered.log` → Shows "Tampered" 🚨
4. 🔒 Audit → Check exports are **LOCKED**
5. 🔒 Audit → Check scheduler is **LOCKED**

### Corporate User (3 minutes)
1. ✅ Logout, Login as Corporate
2. ✅ Audit → Upload file
3. ✅ Audit → Click "Export CSV" → **Works!**
4. ✅ System Logs → Click "Export CSV" → **Works!**
5. 🔒 Scheduler → Still **LOCKED** (correct!)

### Technical User (4 minutes)
1. ✅ Logout, Login as Technical
2. ✅ Scheduler → Click "Start Scheduler" → **Works!**
3. ✅ Scheduler → Click "Stop Scheduler" → **Works!**
4. ✅ Settings → Badge shows "Technical" (green)
5. ✅ All exports work

---

## 📁 Test Files Cheat Sheet

| File | Purpose | What to Expect |
|------|---------|----------------|
| `clean_system.log` | Baseline | ✅ Clean |
| `clean_system_tampered.log` | Tamper test | 🚨 Hash mismatch |
| `suspicious_activity.log` | Threats | ⚠️ Medium-High |
| `critical_alerts.log` | Critical | 🔴 Critical |
| `large_system.log` | Performance | ✅ 5000 entries |

---

## ⚡ Fast Commands

### Generate Test Suite
```powershell
cd ThreatTrace/backend
python test_data_generator.py --mode suite
```

### Real-Time Logs (2 min, every 3 sec)
```powershell
python test_data_generator.py --mode continuous --duration 2 --interval 3
```

### Automated Testing (Background)
```powershell
python automated_test_scheduler.py
```

---

## 🔍 What to Look For

### ✅ PASS Indicators
- Files upload successfully
- Tamper detection works
- Role badges correct colors:
  - Personal = 🔵 Blue
  - Corporate = 🟣 Purple
  - Technical = 🟢 Green
- Locked features show 🔒 lock icons
- Unlocked features work smoothly
- No console errors (F12)

### ❌ FAIL Indicators
- 500 Internal Server Error
- Features don't respect role restrictions
- Personal can export (should be locked!)
- Corporate can use scheduler (should be locked!)
- Exports fail or download corrupt files
- Console shows errors
- Tamper detection doesn't work

---

## 🎨 Role Feature Matrix

```
Feature              | Personal | Corporate | Technical
---------------------|----------|-----------|----------
Dashboard            |    ✅    |     ✅    |    ✅
File Integrity       |    ✅    |     ✅    |    ✅
Ransomware Scan      |    ✅    |     ✅    |    ✅
System Logs          |    ✅    |     ✅    |    ✅
Real-time Alerts     |    ✅    |     ✅    |    ✅
Export Audit CSV     |    🔒    |     ✅    |    ✅
Export Logs CSV/PDF  |    🔒    |     ✅    |    ✅
Scheduler Controls   |    🔒    |     🔒    |    ✅
API Access           |    ❌    |     ❌    |    ✅
```

---

## 🐛 Common Issues & Quick Fixes

### MongoDB Connection Failed
```powershell
# Check .env file line 33
# Make sure <db_password> is replaced with actual password
```

### Port 5000 Already in Use
```powershell
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

### Port 5173 Already in Use
```powershell
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F
```

### Test Files Missing
```powershell
cd ThreatTrace/backend
python test_data_generator.py --mode suite
```

### Login Not Working
- Check backend is running
- Check MongoDB connection
- Clear browser cache
- Try different credentials

---

## 📞 Quick Reference Links

- **Full Testing Guide:** `QA_TESTING_GUIDE.md`
- **Report Template:** `QA_Report.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Role Features:** `ROLE_FEATURES_IMPLEMENTED.md`

---

## ⏱️ Time Estimates

- **Personal User:** 5-10 minutes
- **Corporate User:** 5-10 minutes
- **Technical User:** 10-15 minutes
- **Total Quick Test:** 20-35 minutes
- **Comprehensive Test:** 2-3 hours
- **24hr Stability Test:** Run automated scheduler overnight

---

## ✅ Final Checklist

```
Personal Role:
[ ] Login works
[ ] Can view all pages
[ ] Exports are LOCKED 🔒
[ ] Scheduler is LOCKED 🔒
[ ] Tamper detection works
[ ] Badge is blue 🔵

Corporate Role:
[ ] Login works
[ ] Exports WORK ✅
[ ] CSV exports download
[ ] PDF exports download
[ ] Scheduler still LOCKED 🔒
[ ] Badge is purple 🟣

Technical Role:
[ ] Login works
[ ] All exports work
[ ] Scheduler START works
[ ] Scheduler STOP works
[ ] No locked features
[ ] Badge is green 🟢

Overall:
[ ] No console errors
[ ] Performance acceptable
[ ] MongoDB stable
[ ] Real-time alerts work
[ ] All test files tested
```

---

**🎯 GOAL: All checkboxes ticked = Ready for deployment! ✅**

---

*Keep this card handy for quick reference during testing!*
