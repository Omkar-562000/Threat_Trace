# ThreatTrace - Modules & Features Documentation

## 📋 Project Overview
**ThreatTrace** is a comprehensive cybersecurity monitoring and threat detection platform with real-time alerting, audit logging, ransomware scanning, and system log analysis capabilities.

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React (Vite), React Router v6, Axios, Socket.IO Client
- **Backend**: Flask, Flask-SocketIO, APScheduler, Flask-JWT-Extended
- **Database**: MongoDB
- **Real-time**: Socket.IO (WebSocket)
- **Email**: Flask-Mail (SMTP)
- **Authentication**: JWT + Bcrypt

---

## 📦 Backend Modules

### 1. **Authentication & Authorization Module**
**File**: `backend/routes/auth_routes.py`

**Features**:
- ✅ User Registration (with role-based signup: personal, corporate, technical)
- ✅ User Login with JWT token generation
- ✅ Password hashing using Bcrypt
- ✅ Forgot Password functionality
- ✅ Password Reset via email token
- ✅ Token-based authentication (12-hour JWT expiry)
- ✅ Role-based access control (RBAC)

**Endpoints**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

---

### 2. **Ransomware Detection Module**
**Files**: 
- `backend/routes/ransomware_routes.py`
- `backend/utils/ransomware_scanner.py`

**Features**:
- ✅ File upload and scan for ransomware signatures
- ✅ Path-based file scanning
- ✅ **Entropy analysis** (Shannon entropy calculation to detect encryption)
- ✅ Suspicious file extension detection (.lock, .enc, .crypt, .ransom, .encrypted)
- ✅ Known ransomware hash signature matching (WannaCry, Locky, CryptoLocker)
- ✅ Real-time alerts via WebSocket on suspicious file detection
- ✅ Email notifications for critical threats
- ✅ Scan history logging to MongoDB
- ✅ File size validation (50MB limit)

**Endpoints**:
- `POST /api/ransomware/scan` - Scan file by path
- `POST /api/ransomware/upload` - Upload and scan file
- `GET /api/ransomware/logs` - Get scan history
- `GET /api/ransomware/stats` - Get detection statistics

**Detection Methods**:
- High entropy detection (threshold: 7.5/8.0)
- Extension-based flagging
- SHA256 hash matching against known threats

---

### 3. **Audit & File Integrity Module**
**Files**:
- `backend/routes/audit_routes.py`
- `backend/utils/audit_service.py`
- `backend/scheduler.py`

**Features**:
- ✅ File integrity verification using SHA256 hashing
- ✅ File content snapshot storage
- ✅ Line-by-line diff generation on tampering detection
- ✅ Upload and verify log files
- ✅ Path-based verification
- ✅ **Scheduled periodic integrity checks** (APScheduler - every 5 minutes default)
- ✅ Real-time tamper alerts via WebSocket
- ✅ Email alerts on file tampering
- ✅ Role-based access control for audit features
- ✅ CSV export of audit logs
- ✅ Multi-threaded scanning with file locks
- ✅ Optimized for large files (chunked hash reading - 4MB chunks)

**Endpoints**:
- `POST /api/audit/verify-path` - Verify file by server path
- `POST /api/audit/upload-verify` - Upload and verify file
- `GET /api/audit/logs` - Get audit history
- `POST /api/audit/export` - Export audit logs as CSV
- `POST /api/audit/re-verify/:id` - Re-verify specific audit entry

**Integrity Check Process**:
1. Calculate SHA256 hash of file
2. Compare with stored hash in database
3. Generate line-by-line diff if tampered
4. Send alerts (WebSocket + Email)
5. Store new snapshot with timestamp

---

### 4. **System Logs Management Module**
**Files**:
- `backend/routes/logs_routes.py`
- `backend/routes/system_logs_routes.py`
- `backend/utils/log_streamer.py`
- `backend/system_monitor.py`

**Features**:
- ✅ Real-time log ingestion via REST API
- ✅ Log streaming via WebSocket
- ✅ Log filtering (by level, source, date range, keyword search)
- ✅ Pagination support
- ✅ **Standalone file tail monitor** (system_monitor.py)
- ✅ Log level categorization (INFO, WARN, ERROR, CRITICAL, DEBUG)
- ✅ Source tracking (system, application, network, security)
- ✅ CSV/JSON export functionality
- ✅ Timeline visualization data generation
- ✅ Log statistics and analytics

**Endpoints**:
- `POST /api/logs/ingest` - Ingest new log entry
- `GET /api/logs` - Get logs with filters
- `GET /api/logs/levels` - Get available log levels
- `POST /api/logs/export` - Export logs

**System Monitor** (Standalone Tool):
- Tails a log file and POSTs new lines to backend
- Usage: `python system_monitor.py --file "path/to/log" --url "http://127.0.0.1:5000/api/logs/ingest"`

---

### 5. **Unified Alert Management Module**
**Files**:
- `backend/routes/alerts_routes.py`
- `backend/utils/alert_manager.py`
- `backend/utils/email_alerts.py`

**Features**:
- ✅ **Unified alert pipeline** (WebSocket + Email + MongoDB)
- ✅ Real-time WebSocket broadcasting to all connected clients
- ✅ Email notifications for high-severity alerts
- ✅ Persistent alert storage in MongoDB
- ✅ Alert categorization by severity (info, warning, critical, ransomware, tamper)
- ✅ Source tracking (system, ransomware, audit, logs, ML)
- ✅ Automatic email sending for critical alerts
- ✅ Toast notifications on frontend

**Alert Flow**:
1. **WebSocket** → Real-time frontend notifications
2. **Email** → Admin mailbox (critical alerts only)
3. **MongoDB** → Persistent storage for dashboard

**Alert Sources**:
- Ransomware detection
- File integrity tampering
- System log anomalies
- Future ML threat detection (planned)

---

### 6. **Reports Module**
**File**: `backend/routes/reports_routes.py`

**Features**:
- ✅ Generate comprehensive security reports
- ✅ Aggregated statistics from all modules
- ✅ Export reports in multiple formats
- ✅ Time-range filtering
- ✅ Role-based access to reports

---

### 7. **Dashboard Analytics Module**
**File**: `backend/routes/dashboard_routes.py`

**Features**:
- ✅ Centralized dashboard statistics API
- ✅ Real-time metrics aggregation
- ✅ Cross-module data synthesis
- ✅ Chart-ready data formatting

---

### 8. **Scheduler Module**
**Files**:
- `backend/scheduler.py`
- `backend/routes/scheduler_routes.py`

**Features**:
- ✅ APScheduler background job management
- ✅ Periodic file integrity checks (configurable interval, default 300s)
- ✅ Start/Stop scheduler controls
- ✅ Run integrity check on-demand
- ✅ Scheduler status monitoring
- ✅ Graceful shutdown handling

**Endpoints**:
- `POST /api/scheduler/start` - Start scheduler
- `POST /api/scheduler/stop` - Stop scheduler
- `POST /api/scheduler/run-now` - Trigger immediate check
- `GET /api/scheduler/status` - Get scheduler status

---

### 9. **Database Layer**
**Files**:
- `backend/database/db_config.py`
- `backend/database/models.py`

**Features**:
- ✅ MongoDB connection management
- ✅ Database initialization
- ✅ User model and serialization
- ✅ Collections management (users, audit_logs, ransomware_scans, system_logs, alerts)

---

### 10. **Utility Services**

#### Email Utilities (`utils/email_utils.py`)
- ✅ Password reset email sender
- ✅ Security alert emails

#### Email Alerts (`utils/email_alerts.py`)
- ✅ Tamper detection email notifications
- ✅ Critical security alerts

#### Token Utilities (`utils/token_utils.py`)
- ✅ Password reset token generation
- ✅ Token validation

#### Role Guard (`utils/role_guard.py`)
- ✅ Decorator-based role access control
- ✅ JWT identity extraction
- ✅ Permission validation

---

## 🎨 Frontend Modules

### 1. **Authentication Pages**

**Files**:
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Signup.jsx`
- `frontend/src/pages/ForgotPassword.jsx`
- `frontend/src/pages/ResetPassword.jsx`

**Features**:
- ✅ Login form with JWT token storage
- ✅ Signup with role selection (personal, corporate, technical)
- ✅ Forgot password email request
- ✅ Password reset with token validation
- ✅ Form validation
- ✅ Error handling and user feedback

---

### 2. **Dashboard Pages**

#### Main Dashboard (`pages/Dashboard.jsx`, `pages/EnhancedDashboard.jsx`)
**Features**:
- ✅ Security metrics overview
- ✅ Real-time alert display
- ✅ Quick ransomware scan
- ✅ Quick audit check
- ✅ System health statistics
- ✅ WebSocket-based live updates
- ✅ Toast notifications

#### Ransomware Detection Page (`pages/Ransomware.jsx`)
**Features**:
- ✅ File upload interface
- ✅ Drag-and-drop support
- ✅ Scan results display with entropy visualization
- ✅ Scan history table
- ✅ Real-time threat alerts
- ✅ Suspicious file indicators
- ✅ Timestamp tracking

#### Audit Page (`pages/Audit.jsx`)
**Features**:
- ✅ File integrity verification interface
- ✅ Upload and verify functionality
- ✅ Path-based verification
- ✅ Audit log history
- ✅ Tamper detection visual indicators
- ✅ Diff viewer for changed files
- ✅ CSV export functionality
- ✅ Re-verification capability

#### System Logs Page (`pages/SystemLogs.jsx`)
**Features**:
- ✅ Real-time log streaming via WebSocket
- ✅ Advanced filtering (level, source, keyword, date range)
- ✅ Pagination (50 logs per page)
- ✅ Auto-refresh toggle
- ✅ Timeline chart visualization
- ✅ Log buffering to prevent render storms
- ✅ Export logs (CSV/JSON)
- ✅ Color-coded log levels
- ✅ Search functionality
- ✅ Role-based access to exports

#### Alerts Page (`pages/Alerts.jsx`)
**Features**:
- ✅ Unified alerts dashboard
- ✅ Alert severity indicators
- ✅ Alert source tracking
- ✅ Real-time alert feed
- ✅ Alert history browsing
- ✅ Timestamp display

#### Reports Page (`pages/Reports.jsx`)
**Features**:
- ✅ Generate security reports
- ✅ Report download functionality
- ✅ Time-range selection
- ✅ Multi-module data aggregation

#### Settings Page (`pages/Settings.jsx`)
**Features**:
- ✅ User profile management
- ✅ Password change
- ✅ Notification preferences
- ✅ System configuration

---

### 3. **UI Components**

#### Layout Components
- `layouts/DashboardLayout.jsx` - Main dashboard wrapper with sidebar and navbar
- `components/ui/Sidebar.jsx` - Navigation sidebar with role-based menu items
- `components/ui/TopNavbar.jsx` - Top navigation bar with user menu

#### Utility Components
- `components/ui/Toast.jsx` - Toast notification system
- `components/StatCard.jsx` - Dashboard statistics cards
- `components/TimelineChart.jsx` - Log timeline visualization

---

### 4. **Frontend Utilities**

**Files**:
- `utils/socket.js` - WebSocket client configuration
- `utils/role.js` - Role-based UI access control
- `utils/theme.js` - Theme management
- `utils/ProtectedRoute.jsx` - Route authentication guard

**Features**:
- ✅ Socket.IO client initialization
- ✅ JWT token management in localStorage
- ✅ Role-based UI rendering
- ✅ Protected route wrapper
- ✅ Axios interceptors for auth headers

---

### 5. **Services Layer**

**File**: `services/systemLogsService.js`

**Features**:
- ✅ Centralized API calls for system logs
- ✅ Export service functions
- ✅ Error handling

---

## 🔄 Real-time Features (WebSocket Events)

### Socket Events:
1. **`new_alert`** - General security alerts
2. **`ransomware_alert`** - Ransomware detection alerts
3. **`tamper_alert`** - File integrity tampering alerts
4. **`system_log`** - Real-time log streaming

### Frontend Listeners:
- Dashboard: Listens to all alert types
- Ransomware page: Listens to ransomware alerts
- Audit page: Listens to tamper alerts
- System Logs: Listens to system_log events

---

## 🔐 Security Features

1. **Authentication**:
   - JWT-based authentication (12-hour expiry)
   - Bcrypt password hashing
   - Token refresh mechanism
   - Password reset via email

2. **Authorization**:
   - Role-based access control (personal, corporate, technical)
   - Protected routes on frontend
   - Backend route guards with decorators

3. **Data Security**:
   - File integrity monitoring (SHA256)
   - Ransomware detection (entropy + signatures)
   - Input validation and sanitization
   - File size limits
   - Secure file uploads

4. **Monitoring**:
   - Real-time threat detection
   - Automated periodic integrity scans
   - Comprehensive audit logging
   - Email alerts for critical events

---

## 📊 Data Models (MongoDB Collections)

### 1. **users**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  role: String (personal/corporate/technical),
  created_at: DateTime
}
```

### 2. **audit_logs**
```javascript
{
  _id: ObjectId,
  file_path: String,
  hash: String (SHA256),
  snapshot: Array[String] (file lines),
  tampered: Boolean,
  diff: Array[String] (line-by-line changes),
  timestamp: DateTime,
  last_verified: DateTime
}
```

### 3. **ransomware_scans**
```javascript
{
  _id: ObjectId,
  file_path: String,
  entropy: Float,
  suspicious: Boolean,
  reason: Array[String],
  hash: String (SHA256),
  timestamp: DateTime
}
```

### 4. **system_logs**
```javascript
{
  _id: ObjectId,
  timestamp: DateTime,
  level: String (INFO/WARN/ERROR/CRITICAL/DEBUG),
  source: String,
  message: String
}
```

### 5. **alerts**
```javascript
{
  _id: ObjectId,
  title: String,
  message: String,
  severity: String (info/warning/critical/ransomware/tamper),
  source: String,
  timestamp: DateTime
}
```

---

## 🧪 Testing & Development Tools

### 1. **Test Data Generator**
**File**: `backend/test_data_generator.py`
- Generate sample log files for testing
- Create test ransomware files
- Populate database with test data

### 2. **System Monitor** (Standalone)
**File**: `backend/system_monitor.py`
- Tail log files and stream to backend
- Command-line tool for production monitoring

### 3. **Frontend Testing**
**Files**: 
- `frontend/jest.config.js`
- `frontend/babel.config.js`
- `frontend/src/pages/SystemLogs.test.jsx`

---

## 📈 Statistics & Analytics

### Dashboard Metrics:
- Total ransomware scans
- Suspicious files detected
- File integrity checks performed
- Tampered files count
- System logs ingested
- Critical alerts count

### Reports Include:
- Time-based trend analysis
- Threat severity distribution
- Source-wise alert breakdown
- Log level statistics

---

## 🚀 Deployment Features

1. **CORS Configuration**: Multi-origin support (localhost + LAN)
2. **Environment Variables**: `.env` based configuration
3. **Graceful Shutdown**: Signal handling for clean exit
4. **Health Check Endpoint**: `GET /` returns service status
5. **Error Handling**: Centralized exception management
6. **Logging**: Comprehensive console logging

---

## 📝 Configuration Files

### Backend:
- `backend/config.py` - Environment-based configuration
- `backend/requirements.txt` - Python dependencies
- `backend/.env` - Secret keys, MongoDB URI, email credentials

### Frontend:
- `frontend/vite.config.js` - Vite bundler configuration
- `frontend/package.json` - NPM dependencies
- `frontend/.env` - API base URL

---

## 🔧 Key Dependencies

### Backend:
- Flask (web framework)
- Flask-SocketIO (WebSocket)
- Flask-JWT-Extended (authentication)
- Flask-Mail (email)
- Flask-CORS (cross-origin)
- Flask-Bcrypt (password hashing)
- PyMongo (MongoDB driver)
- APScheduler (background jobs)
- python-dotenv (environment variables)

### Frontend:
- React 18+
- React Router v6 (navigation)
- Axios (HTTP client)
- Socket.IO Client (WebSocket)
- Chart.js (data visualization)
- react-chartjs-2 (React wrapper for Chart.js)

---

## 🎯 Feature Summary

### ✅ **Completed Features** (21 Major Modules)

1. ✅ User Authentication & Authorization
2. ✅ Ransomware Detection (Entropy + Signature)
3. ✅ File Integrity Monitoring (SHA256)
4. ✅ Scheduled Integrity Checks
5. ✅ Real-time System Log Streaming
6. ✅ Unified Alert Management (WebSocket + Email + DB)
7. ✅ Dashboard with Live Statistics
8. ✅ Advanced Log Filtering & Search
9. ✅ CSV/JSON Export Functionality
10. ✅ Email Notifications (Alerts + Password Reset)
11. ✅ Role-Based Access Control
12. ✅ Toast Notification System
13. ✅ Timeline Visualization
14. ✅ Drag-and-Drop File Upload
15. ✅ Diff Viewer for File Changes
16. ✅ System Monitor (Standalone Tool)
17. ✅ Health Check Endpoints
18. ✅ Report Generation
19. ✅ Settings Management
20. ✅ Protected Routes (Frontend & Backend)
21. ✅ Graceful Shutdown Handling

---

## 📌 Future Enhancement Opportunities

1. 🔮 Machine Learning threat detection
2. 🔮 Advanced analytics dashboard with trend prediction
3. 🔮 Mobile app (React Native)
4. 🔮 Multi-tenant support
5. 🔮 API rate limiting
6. 🔮 2FA authentication
7. 🔮 Webhook integrations
8. 🔮 Slack/Discord alert notifications
9. 🔮 Advanced search with Elasticsearch
10. 🔮 Docker containerization
11. 🔮 Kubernetes deployment
12. 🔮 Automated threat response (quarantine suspicious files)

---

## 📚 Documentation Files

- `README.md` - Project setup and usage guide
- `PROJECT_DOCUMENTATION.md` - Detailed project documentation
- `QA_Report.md` - Quality assurance and testing report
- `MODULES_AND_FEATURES.md` - **(This file)** Complete feature list

---

**Last Updated**: 2026-02-03  
**Project Status**: ✅ Production-Ready  
**Total Modules**: 21+  
**Total Features**: 90+  
**Lines of Code**: ~10,000+
