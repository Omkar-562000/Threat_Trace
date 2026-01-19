# 🚀 ThreatTrace Setup & Runtime Guide

## Prerequisites

- ✅ Python 3.10+ (You have Python 3.14)
- ✅ Node.js 16+ & npm (You have npm 11.4.2)
- ⚠️ **MongoDB** (Required - See setup below)

---

## 🗄️ MongoDB Setup (CRITICAL)

### Option A: MongoDB Atlas (Cloud - Recommended for Quick Start)

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. **Create Free Cluster**: 
   - Choose M0 Free Tier
   - Select your region
   - Wait for cluster to deploy (~3-5 minutes)

3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose username & password (save these!)
   - Grant "Read and Write to Any Database"

4. **Whitelist IP**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Either add your current IP or use `0.0.0.0/0` (allows from anywhere - for testing only)

5. **Get Connection String**:
   - Go to your cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add `/threattrace` at the end before the query string

   **Example:**
   ```
   mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/threattrace?retryWrites=true&w=majority
   ```

6. **Update .env file**:
   - Open `ThreatTrace/backend/.env`
   - Replace the `MONGO_URI` line with your connection string

### Option B: Local MongoDB Installation

1. **Download MongoDB Community Server**:
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Download and install for Windows
   - During installation, choose "Install MongoDB as a Service"

2. **Verify Installation**:
   ```powershell
   mongod --version
   ```

3. **Start MongoDB Service**:
   ```powershell
   net start MongoDB
   ```

4. **Your .env is already configured** for local MongoDB:
   ```
   MONGO_URI=mongodb://localhost:27017/threattrace
   ```

---

## 📧 Email Configuration (Optional)

For password reset and alert emails to work:

1. **Using Gmail**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Create an app password for "Mail"
   - Update `.env`:
     ```
     MAIL_USERNAME=your.email@gmail.com
     MAIL_PASSWORD=your-16-char-app-password
     ```

2. **Skip for Now**:
   - Leave `MAIL_USERNAME` and `MAIL_PASSWORD` empty
   - You'll see a warning but the app will still work
   - Email features (password reset, alerts) won't function

---

## 🎯 Running ThreatTrace

### 1. Start Backend (Flask API)

```powershell
cd ThreatTrace/backend
python app.py
```

**Expected Output:**
```
✅ MongoDB Connected Successfully → Database: threattrace
✅ Alert system initialized
✅ All API routes registered successfully!
🚀 ThreatTrace backend running at http://127.0.0.1:5000
```

**Leave this terminal running!**

### 2. Start Frontend (React + Vite)

Open a **NEW terminal** and run:

```powershell
cd ThreatTrace/frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**Leave this terminal running too!**

### 3. Access the Application

Open your browser and go to: **http://localhost:5173**

---

## 🧪 Testing the Features

### 1. **User Registration & Role Selection**
   - Go to Signup page
   - Create account with role:
     - **Personal** - Basic features
     - **Corporate** - Advanced features + exports
     - **Technical** - Full access + API + scheduler

### 2. **Login & Dashboard**
   - Login with your credentials
   - Explore the Dashboard

### 3. **File Integrity Monitoring (Audit)**
   - Go to "Audit" page
   - Upload a `.log` or `.txt` file
   - System will calculate hash and store it
   - Modify the file and re-upload to detect tampering

### 4. **Ransomware Detection**
   - Go to "Ransomware" page
   - Upload files for scanning
   - System uses ML to detect potential ransomware patterns

### 5. **System Logs**
   - Go to "Logs" page
   - View real-time system logs
   - Filter by level (INFO, WARNING, ERROR)
   - Search logs
   - Export (Corporate/Technical roles only)

### 6. **Real-time Alerts**
   - Alerts appear via Socket.IO when threats detected
   - Toast notifications show up automatically
   - Check "Alerts" page for history

### 7. **Reports**
   - Go to "Reports" page
   - Generate and download security reports
   - CSV/PDF export (Corporate/Technical only)

### 8. **Settings**
   - View your account type and available features
   - See role-based feature access

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error: MongoDB Connection Failed**
- ✅ Verify MongoDB is running (`net start MongoDB` for local)
- ✅ Check your `.env` file has correct `MONGO_URI`
- ✅ For Atlas: Verify IP whitelist and credentials

**Error: Email credentials missing**
- ⚠️ This is just a warning
- App will work without email features
- Add credentials in `.env` if you need email

### Frontend Won't Start

**Error: Cannot find module**
```powershell
cd ThreatTrace/frontend
npm install
npm run dev
```

### Port Already in Use

**Backend (Port 5000)**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000
# Kill it (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Frontend (Port 5173)**:
```powershell
# Find process using port 5173
netstat -ano | findstr :5173
# Kill it
taskkill /PID <PID> /F
```

---

## 📊 Feature Access by Role

| Feature | Personal | Corporate | Technical |
|---------|----------|-----------|-----------|
| Dashboard | ✅ | ✅ | ✅ |
| File Integrity Audit | ✅ | ✅ | ✅ |
| Ransomware Detection | ✅ | ✅ | ✅ |
| System Logs Viewing | ✅ | ✅ | ✅ |
| Real-time Alerts | ✅ | ✅ | ✅ |
| Export Reports (CSV/PDF) | ❌ | ✅ | ✅ |
| Scheduled Scans | ❌ | ✅ | ✅ |
| Scheduler Control | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

---

## 📁 Project Structure

```
ThreatTrace/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── config.py           # Configuration
│   ├── .env               # Environment variables (YOU CREATE THIS)
│   ├── requirements.txt    # Python dependencies
│   ├── routes/            # API endpoints
│   │   ├── auth_routes.py      # Login, signup, password reset
│   │   ├── audit_routes.py     # File integrity monitoring
│   │   ├── ransomware_routes.py # Ransomware detection
│   │   ├── logs_routes.py      # System logs
│   │   └── ...
│   ├── utils/             # Helper modules
│   │   ├── role_guard.py       # Role-based access control
│   │   ├── alert_manager.py    # Real-time alerts
│   │   └── ...
│   └── database/          # MongoDB connection
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Audit.jsx
│   │   │   └── ...
│   │   ├── services/      # API clients
│   │   ├── utils/         # Utilities (role helpers, socket)
│   │   └── App.jsx        # Main app + routing
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
│
└── SETUP_GUIDE.md         # This file!
```

---

## 🎉 You're Ready!

Once MongoDB is configured and both servers are running, you can start testing ThreatTrace's security features!

**Quick Start Checklist:**
- [ ] MongoDB running (Atlas or Local)
- [ ] Backend started (`python app.py`)
- [ ] Frontend started (`npm run dev`)
- [ ] Browser opened to http://localhost:5173
- [ ] User account created with desired role
- [ ] Testing features!

---

## 💡 Tips

1. **Use Corporate or Technical role** to access all features during testing
2. **MongoDB Atlas free tier** is sufficient for development/testing
3. **Email configuration is optional** - skip it if you just want to test core features
4. **Create test log files** in `ThreatTrace/test_files/` directory for audit testing
5. **Check browser console** (F12) for any frontend errors
6. **Check backend terminal** for API errors and logs

Need help? Check the error messages carefully - they usually tell you exactly what's wrong!
