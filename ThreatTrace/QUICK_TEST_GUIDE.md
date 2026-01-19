# 🚀 Quick Testing Guide

**Get started testing ThreatTrace in 5 minutes!**

---

## ✅ Prerequisites

Make sure both servers are running:

**Terminal 1 - Backend:**
```powershell
cd ThreatTrace/backend
python app.py
```

**Terminal 2 - Frontend:**
```powershell
cd ThreatTrace/frontend
npm run dev
```

**Browser:**
Open http://localhost:5173

---

## 🎯 Quick Test Scenarios

### 1️⃣ Test File Integrity Detection (2 minutes)

**Goal:** See tamper detection in action

```powershell
# Already done! Test files were created when you ran the generator
```

**Manual Steps:**
1. Go to http://localhost:5173 and login
2. Navigate to **Audit** page
3. Click "Choose File" and upload: `ThreatTrace/backend/test_files/clean_system.log`
4. Click "Upload & Scan"
5. ✅ **Result:** Green checkmark - File is clean
6. Now upload: `ThreatTrace/backend/test_files/clean_system_tampered.log`
7. ✅ **Result:** Red alert - Tampering detected! 🚨

---

### 2️⃣ Test Real-Time Log Streaming (3 minutes)

**Goal:** See live logs appearing

**Option A - Using PowerShell Script:**
```powershell
# Run from project root
.\generate_test_data.ps1
# Choose option 2 (5 minute continuous generation)
```

**Option B - Using Python directly:**
```powershell
cd ThreatTrace/backend
python test_data_generator.py --mode continuous --duration 5 --interval 3
```

**Watch it work:**
1. Open **System Logs** page in browser
2. ✅ **Result:** New logs appear every 3-5 seconds
3. ✅ **Result:** Timeline chart updates in real-time
4. ✅ **Result:** Toast notifications pop up

---

### 3️⃣ Test Role-Based Access (5 minutes)

**Goal:** Verify different roles have different access

**Create 3 accounts:**

1. **Personal User:**
   - Signup → Select "Personal - Individual User"
   - Login → Try to export → 🔒 **Locked**

2. **Corporate User:**
   - Signup → Select "Corporate - Big Firm/Enterprise"
   - Login → Try to export → ✅ **Works!**
   - Try scheduler → 🔒 **Locked**

3. **Technical User:**
   - Signup → Select "Technical - IT/Security Professional"
   - Login → Everything works → ✅ **Full access!**

---

### 4️⃣ Test Automated Scheduler (Runs in background)

**Goal:** Set up continuous testing

**Using PowerShell Script:**
```powershell
# Run from project root
.\start_automated_tests.ps1
```

**Or using Python directly:**
```powershell
cd ThreatTrace/backend
python automated_test_scheduler.py
```

**What it does:**
- 🕐 Generates logs every 5 minutes
- 🛡️ Creates security events every 10 minutes
- 📊 Runs hourly log generation
- 🔍 Simulates tamper detection every 2 hours
- 💚 Health checks every 15 minutes

**Leave it running** and your ThreatTrace will have continuous test data!

---

## 📁 Available Test Files

Located in `ThreatTrace/backend/test_files/`:

| File | Purpose | Size |
|------|---------|------|
| `clean_system.log` | Baseline clean logs | 200 entries |
| `clean_system_tampered.log` | **Tampered version** | 200 entries |
| `suspicious_activity.log` | Suspicious patterns | 150 entries |
| `critical_alerts.log` | Critical security events | 100 entries |
| `realistic_mix.log` | Realistic mix | 500 entries |
| `large_system.log` | Performance testing | 5000 entries |

---

## 🎮 Interactive Testing Commands

### Generate Fresh Test Data
```powershell
cd ThreatTrace/backend
python test_data_generator.py --mode suite
```

### Send Logs to System (Real-time)
```powershell
python test_data_generator.py --mode ingest --file test_files/realistic_mix.log
```

### Continuous Generation (Custom)
```powershell
# 10 minutes, every 5 seconds
python test_data_generator.py --mode continuous --duration 10 --interval 5

# 1 hour, every 30 seconds
python test_data_generator.py --mode continuous --duration 60 --interval 30
```

---

## ✅ Quick Checklist

**Manual Testing:**
- [ ] File integrity detection works
- [ ] Tampered files detected
- [ ] Real-time logs streaming
- [ ] Role-based exports working
- [ ] Personal users locked out properly
- [ ] Corporate users can export
- [ ] Technical users have full access

**Automated Testing:**
- [ ] Automated scheduler running
- [ ] Logs generating automatically
- [ ] No errors in backend console
- [ ] MongoDB storing data
- [ ] Frontend updating in real-time

---

## 🎯 Success Indicators

You'll know testing is successful when:

✅ **File Integrity:**
- Clean logs show green checkmark
- Tampered logs show red alert
- History shows both scans

✅ **Real-Time Logs:**
- New logs appear without refresh
- Timeline chart animates
- Filters work correctly

✅ **Role-Based Access:**
- Personal: Sees locked icons 🔒
- Corporate: Can export CSV/PDF
- Technical: Can control scheduler

✅ **Automated Tests:**
- Scheduler runs without crashes
- New data appears every few minutes
- Health checks pass

---

## 🆘 Quick Troubleshooting

**Problem:** Test files not found
```powershell
# Regenerate them
cd ThreatTrace/backend
python test_data_generator.py --mode suite
```

**Problem:** Logs not appearing real-time
- Check if Socket.IO connected (browser console)
- Verify backend running
- Enable auto-refresh in System Logs page

**Problem:** Exports not working
- Check your role (Settings page)
- Try logging in as Corporate or Technical
- Check browser console for errors

**Problem:** Automated scheduler won't start
```powershell
# Install schedule library
pip install schedule

# Verify backend is running
curl http://127.0.0.1:5000

# Start scheduler
python automated_test_scheduler.py
```

---

## 📚 Next Steps

1. ✅ Complete all quick tests above
2. 📖 Read [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed scenarios
3. 🔄 Set up automated scheduler for continuous testing
4. 📊 Monitor for 24 hours to ensure stability
5. 🚀 Deploy to production with confidence!

---

## 🎉 You're All Set!

ThreatTrace is now ready for comprehensive testing. Run the automated scheduler in the background and perform manual tests as needed.

**Happy Testing!** 🔐🚀
