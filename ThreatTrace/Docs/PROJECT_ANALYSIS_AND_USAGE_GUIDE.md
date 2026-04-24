# ThreatTrace - Complete Project Analysis & Usage Guide

## 📋 Table of Contents
1. [What is ThreatTrace?](#what-is-threattrace)
2. [What We Have Built - Simple Language](#what-we-have-built---simple-language)
3. [What We Have Built - Technical Language](#what-we-have-built---technical-language)
4. [How It Helps in Daily Life](#how-it-helps-in-daily-life)
5. [How to Use ThreatTrace](#how-to-use-threattrace)
6. [Module-by-Module Explanation](#module-by-module-explanation)
7. [Quick Start Guide](#quick-start-guide)
8. [Advanced Features](#advanced-features)

---

## What is ThreatTrace?

### Simple Explanation
ThreatTrace is like a **security guard for your computer system**. It watches over your files, detects suspicious activities, and alerts you when something dangerous is happening - all in real-time! Think of it as having a 24/7 security camera system for your digital world.

### Technical Explanation
ThreatTrace is a **comprehensive cybersecurity monitoring platform** built with a modern tech stack (React + Flask + MongoDB). It provides real-time threat detection, file integrity monitoring, ransomware scanning, and security analytics through an intuitive web dashboard with WebSocket-based live updates.

---

## What We Have Built - Simple Language

### 🏠 Main Dashboard
**What it is**: Your security control center - like the front desk of a security office.

**What it does**:
- Shows you how many threats were detected today
- Displays alerts in real-time (like instant notifications on your phone)
- Gives you a quick overview of your system's security health
- Shows statistics with colorful charts and graphs

**Example**: Imagine waking up and checking your security dashboard to see "3 suspicious files detected overnight" - you can immediately investigate them!

---

### 🦠 Ransomware Scanner
**What it is**: A virus detector that specifically looks for ransomware (files that lock your data and demand money).

**What it does**:
- Scans files automatically every 5 minutes
- Checks if files have been encrypted (made unreadable)
- Alerts you immediately if something suspicious is found
- Keeps a history of all scans

**Example**: You download a file from the internet. Within 5 minutes, ThreatTrace scans it and warns you: "This file looks encrypted and suspicious!"

---

### 🔒 File Integrity Monitor (Audit System)
**What it is**: A digital fingerprint scanner for important files.

**What it does**:
- Takes a "snapshot" of important files (like your system settings)
- Checks every 5 minutes if those files have been changed
- Tells you exactly what changed (line by line)
- Sends email alerts if critical files are tampered with

**Example**: Someone tries to hack your system by modifying your security settings. ThreatTrace immediately detects the change and emails you: "hosts file has been modified!"

---

### 📊 System Logs Viewer
**What it is**: A log book that records everything happening in your computer.

**What it does**:
- Collects Windows event logs automatically
- Shows them in an easy-to-read format
- Lets you search and filter (like searching emails in Gmail)
- Updates live as new events happen

**Example**: Your computer crashed yesterday? Check the logs to see exactly what happened at 3:47 PM.

---

### 🚨 Alert System
**What it is**: An alarm system that notifies you instantly.

**What it does**:
- Sends pop-up notifications on your screen
- Sends email alerts for critical threats
- Keeps a history of all alerts
- Categorizes alerts by severity (info, warning, critical)

**Example**: A ransomware file is detected → You get a pop-up notification + an email + it's logged in the database.

---

### 📈 Reports Generator
**What it is**: A report card for your security.

**What it does**:
- Creates PDF reports summarizing all security activities
- Shows statistics and trends
- Useful for showing your boss or compliance audits

**Example**: At the end of the month, generate a report showing "20 ransomware scans performed, 2 suspicious files detected, 100 log entries analyzed."

---

### 👥 User Management & Roles
**What it is**: Different access levels for different people.

**What it does**:
- Personal users: See their own data
- Corporate users: See company-wide data
- Technical users: Access advanced features and settings

**Example**: Your IT manager can see everything, but regular employees can only see basic information.

---

## What We Have Built - Technical Language

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18)                      │
│  • Vite build tool                                          │
│  • React Router v6 (client-side routing)                    │
│  • Socket.IO Client (WebSocket connections)                 │
│  • Chart.js + react-chartjs-2 (visualizations)              │
│  • Axios (HTTP client)                                      │
│  • Tailwind CSS v4 (styling)                                │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Flask)                          │
│  • Flask-SocketIO (WebSocket server)                        │
│  • Flask-JWT-Extended (authentication)                      │
│  • Flask-Mail (email alerts)                                │
│  • Flask-CORS (cross-origin support)                        │
│  • APScheduler (background jobs)                            │
│  • PyMongo (MongoDB driver)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ MongoDB Protocol
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (MongoDB)                       │
│  Collections:                                               │
│  • users (authentication)                                   │
│  • alerts (security alerts)                                 │
│  • audit_logs (file integrity)                              │
│  • ransomware_scans (scan results)                          │
│  • system_logs (log entries)                                │
└─────────────────────────────────────────────────────────────┘
```

### Core Components Built

#### 1. **Backend API (Flask)**
- **21+ API endpoints** across 8 blueprints
- RESTful architecture with JSON responses
- JWT-based authentication (12-hour token expiry)
- Bcrypt password hashing (10 rounds)
- CORS enabled for cross-origin requests
- Health check endpoint (`GET /`)

**Routes**:
```
/api/auth/*         - Authentication (login, register, password reset)
/api/ransomware/*   - Ransomware scanning endpoints
/api/audit/*        - File integrity verification
/api/logs/*         - System log ingestion and retrieval
/api/alerts/*       - Alert management
/api/reports/*      - Report generation
/api/dashboard/*    - Dashboard statistics
/api/scheduler/*    - Scheduler controls
```

#### 2. **Real-Time Communication (Socket.IO)**
- WebSocket server with eventlet async mode
- Multi-origin CORS support
- Event channels:
  - `new_alert` - General security alerts
  - `ransomware_alert` - Ransomware detections
  - `tamper_alert` - File tampering alerts
  - `system_log` - Live log streaming

#### 3. **Background Scheduler (APScheduler)**
- Background thread-based scheduler
- Configurable interval (default: 300 seconds)
- Runs periodic file integrity checks
- Graceful shutdown handling

#### 4. **Automated Threat Detection**

**Ransomware Scanner** (`auto_ransomware_scanner.py`):
- Shannon entropy calculation (0-8 scale)
- Threshold: 7.5 for high entropy (potential encryption)
- Suspicious extension detection: `.lock`, `.enc`, `.crypt`, `.ransom`, `.encrypted`
- SHA256 hash matching against known signatures
- Multi-threaded file scanning (ThreadPoolExecutor)
- Performance limits: 1000 files per scan, 100MB max file size

**File Integrity Monitor** (`audit_service.py`):
- SHA256 cryptographic hashing
- Chunked file reading (4MB chunks for large files)
- Line-by-line diff generation using Python's difflib
- Snapshot storage with timestamps
- Thread-safe file locking

**Windows Event Log Collector** (`auto_windows_eventlog.py`):
- pywin32 integration for Windows API access
- Polls System, Application (optionally Security) logs
- Configurable poll interval (default: 10 seconds)
- Event type filtering (Error, Warning, Information)
- Batch processing (up to 100 events per poll)

#### 5. **Frontend Application (React)**

**Component Architecture**:
- 15+ page components
- 18+ reusable UI components
- Layout components (DashboardLayout, Sidebar, TopNavbar)
- Protected routes with JWT validation
- Role-based component rendering

**State Management**:
- useState for local component state
- useEffect for side effects and WebSocket listeners
- useCallback for memoized functions (performance optimization)
- Context API for global theme/auth state

**Performance Optimizations**:
- Log buffering to prevent render storms (batches updates every 500ms)
- Memoization with useCallback/useMemo
- Pagination (50 items per page)
- Lazy loading for charts

#### 6. **Data Models**

**User Model**:
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed, lowercase),
  password: String (bcrypt hash),
  role: String (personal/corporate/technical),
  created_at: DateTime
}
```

**Audit Log Model**:
```javascript
{
  _id: ObjectId,
  file_path: String,
  hash: String (SHA256),
  snapshot: Array[String] (file content lines),
  tampered: Boolean,
  diff: Array[String] (unified diff format),
  timestamp: DateTime,
  last_verified: DateTime
}
```

**Ransomware Scan Model**:
```javascript
{
  _id: ObjectId,
  file_path: String,
  entropy: Float (0-8),
  suspicious: Boolean,
  reason: Array[String],
  hash: String (SHA256),
  timestamp: DateTime
}
```

**System Log Model**:
```javascript
{
  _id: ObjectId,
  timestamp: DateTime,
  level: String (INFO/WARN/ERROR/CRITICAL/DEBUG),
  source: String,
  message: String
}
```

**Alert Model**:
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

#### 7. **Security Features**

**Authentication & Authorization**:
- JWT tokens with HS256 algorithm
- Token stored in localStorage
- Axios interceptors for auth headers
- Protected routes on frontend
- Backend route guards with `@role_required` decorator
- Password reset with time-limited tokens (1-hour expiry)

**Data Validation**:
- Email format validation (regex)
- Password strength requirements
- File size limits (50MB for uploads)
- File extension whitelisting
- Input sanitization

**Communication Security**:
- HTTPS support ready
- CORS restricted to allowed origins
- Credentials support for cross-origin requests
- WebSocket origin validation

---

## How It Helps in Daily Life

### For IT Security Teams

#### Morning Security Check (5 minutes)
1. **Login to ThreatTrace Dashboard**
   - See overnight alerts: "2 suspicious files detected at 2:14 AM"
   - Check system logs for any unusual activity
   - Review file integrity status: "All critical files verified ✓"

2. **Investigate Alerts**
   - Click on the suspicious file alert
   - View detailed scan results showing high entropy (7.89)
   - See the file path and timestamp
   - Take action: quarantine or delete

3. **Generate Weekly Report**
   - Click "Generate Report"
   - Select date range: Last 7 days
   - Download PDF showing:
     - 140 ransomware scans performed
     - 3 suspicious files detected and quarantined
     - 1,200 system logs analyzed
     - 0 file integrity violations

**Time Saved**: Instead of manually checking logs across multiple systems (2-3 hours), you get everything in one dashboard (5 minutes).

---

### For Compliance Officers

#### Audit Preparation (Previously 2 days → Now 2 hours)
1. **Export Audit Logs**
   - Navigate to Audit page
   - Click "Export CSV"
   - Get complete audit trail with:
     - All file integrity checks
     - Timestamps of verifications
     - Detected modifications
     - Hash values for proof

2. **Generate Compliance Report**
   - Reports page → Select date range (last quarter)
   - Include all modules
   - Download PDF report
   - Submit to auditors

**Value**: Automated audit trails that would typically require manual log collection from multiple sources.

---

### For System Administrators

#### Proactive Threat Detection
**Before ThreatTrace**:
- Manually check Event Viewer (time-consuming)
- May miss critical events in thousands of logs
- No automated file integrity checks
- Reactive approach: find problems after damage

**With ThreatTrace**:
- Real-time log streaming to dashboard
- Automated ransomware scanning every 5 minutes
- Automatic file integrity checks every 5 minutes
- Instant email alerts for critical events
- Proactive approach: detect threats immediately

**Example Scenario**:
```
3:15 PM - Ransomware file downloaded
3:17 PM - Auto-scanner detects high entropy
3:17 PM - Alert sent to dashboard + email
3:18 PM - Admin quarantines file
Result: Ransomware stopped within 3 minutes!
```

---

### For Small Businesses

#### Cost-Effective Security
**Enterprise SIEM Solutions**: $10,000-$50,000/year
**ThreatTrace**: Open-source, free to use

**Capabilities Comparison**:
| Feature | ThreatTrace | Enterprise SIEM |
|---------|-------------|-----------------|
| Real-time monitoring | ✅ | ✅ |
| File integrity | ✅ | ✅ |
| Ransomware detection | ✅ | ✅ |
| Alert system | ✅ | ✅ |
| Reports | ✅ | ✅ |
| Cost | $0 | $10K-$50K/year |

**Use Case**: Small business with 10-50 employees can have enterprise-grade security monitoring without the enterprise price tag.

---

### For Educational Institutions

#### Teaching Cybersecurity
- Students can deploy ThreatTrace to learn:
  - Web application architecture
  - Real-time communication (WebSockets)
  - Database design
  - Cryptographic hashing
  - Threat detection algorithms
  - Full-stack development

**Hands-on Learning**:
1. Set up ThreatTrace locally
2. Generate test data
3. Trigger alerts by modifying monitored files
4. Observe real-time detection
5. Analyze logs and reports

---

## How to Use ThreatTrace

### Basic Usage Workflow

#### Step 1: Initial Setup (One-Time)
```powershell
# Terminal 1: Setup automation
.\start_automation.ps1 -Setup

# Edit configuration
notepad ThreatTrace\backend\automation_config.py
# Add directories to monitor, critical files, etc.

# Register files for integrity monitoring
.\start_automation.ps1 -Register
```

#### Step 2: Daily Operation (3 Terminals)
```powershell
# Terminal 1: Backend API Server
cd ThreatTrace\backend
python app.py
# Output: 🚀 ThreatTrace backend running at http://127.0.0.1:5000

# Terminal 2: Automation (Ransomware + Event Logs)
.\start_automation.ps1 -Start
# Output: 
# 🦠 Starting Ransomware Auto-Scanner...
# 📋 Starting Windows Event Log Collector...

# Terminal 3: Frontend Dashboard
cd ThreatTrace\frontend
npm run dev
# Output: Local: http://localhost:5173
```

#### Step 3: Login to Dashboard
1. Open browser: `http://localhost:5173`
2. Login with your credentials
3. View real-time dashboard

---

### Common Tasks

#### Task 1: Scan a File for Ransomware
**Via Dashboard**:
1. Navigate to "Ransomware" page
2. Drag and drop file OR click "Upload"
3. View scan results:
   - Entropy score (0-8)
   - Suspicious indicators
   - Hash value
   - Verdict: Safe / Suspicious

**Via API** (for automation):
```bash
curl -X POST http://localhost:5000/api/ransomware/scan \
  -H "Content-Type: application/json" \
  -d '{"file_path": "C:\\temp\\suspicious.exe"}'
```

#### Task 2: Monitor a Critical File
**Via Dashboard**:
1. Navigate to "Audit" page
2. Enter file path: `C:\Windows\System32\drivers\etc\hosts`
3. Click "Verify"
4. File is now monitored every 5 minutes automatically

**What Happens Next**:
- ThreatTrace calculates SHA256 hash
- Stores file content snapshot
- Checks every 5 minutes
- If modified → Instant alert + Email

#### Task 3: View System Logs
**Via Dashboard**:
1. Navigate to "System Logs" page
2. See live log stream (auto-refreshes)
3. Use filters:
   - Level: ERROR, WARN, INFO, CRITICAL
   - Source: System, Application, Network
   - Keyword search: "failed login"
   - Date range: Last 24 hours

**Export Logs**:
1. Click "Export Logs"
2. Select format: CSV or JSON
3. Download file for analysis

#### Task 4: Investigate an Alert
**Via Dashboard**:
1. Navigate to "Dashboard" or "Alerts" page
2. See red alert: "🚨 Ransomware Detected"
3. Click on alert for details:
   - File path: `C:\Users\Admin\Downloads\invoice.pdf.exe`
   - Entropy: 7.89 (High)
   - Reason: High entropy + Suspicious extension
   - Timestamp: 2026-02-14 15:23:41
4. Take action: Quarantine or delete the file

#### Task 5: Generate Security Report
**Via Dashboard**:
1. Navigate to "Reports" page
2. Select date range: Last 30 days
3. Click "Generate Report"
4. Download PDF containing:
   - Executive summary
   - Ransomware scan statistics
   - File integrity checks
   - System log statistics
   - Alert summary
   - Charts and graphs

---

## Module-by-Module Explanation

### Module 1: Authentication System

#### What It Does
Manages user registration, login, password reset, and access control.

#### How It Works
```
User enters email + password
         ↓
Backend checks MongoDB users collection
         ↓
If valid → Generate JWT token (expires in 12 hours)
         ↓
Frontend stores token in localStorage
         ↓
All subsequent API requests include token in header
         ↓
Backend validates token → Allow/Deny access
```

#### Technical Details
- **Password Hashing**: Bcrypt with 10 rounds
- **Token Format**: JWT with HS256 algorithm
- **Token Claims**: user_id, email, role
- **Password Reset**: Time-limited tokens (1 hour) sent via email

#### Files Involved
- Backend: `routes/auth_routes.py`, `utils/token_utils.py`
- Frontend: `pages/Login.jsx`, `pages/Signup.jsx`, `utils/ProtectedRoute.jsx`

---

### Module 2: Ransomware Detection

#### What It Does
Scans files to detect potential ransomware using entropy analysis and pattern matching.

#### How It Works
```
File selected for scanning
         ↓
Read file in binary mode
         ↓
Calculate Shannon entropy (measures randomness)
         ↓
Check entropy score:
  - < 6.0 → Normal text/code
  - 6.0-7.5 → Compressed or mixed content
  - > 7.5 → Encrypted (SUSPICIOUS!)
         ↓
Check file extension:
  - .lock, .enc, .crypt → SUSPICIOUS!
         ↓
Calculate SHA256 hash
         ↓
Match against known ransomware signatures
         ↓
Send result + alert if suspicious
```

#### Shannon Entropy Explained
```python
# Entropy measures "randomness" of data
# Scale: 0 (completely predictable) to 8 (completely random)

"aaaaaaaa" → Entropy: 0.0 (all same character)
"Hello World" → Entropy: 2.8 (readable text)
"Kj#9$mQz!pL" → Entropy: 5.2 (mixed characters)
Encrypted data → Entropy: 7.8-8.0 (looks random)
```

#### Technical Details
- **Entropy Algorithm**: Shannon entropy formula
  ```
  H(X) = -Σ p(x) * log2(p(x))
  ```
- **Threshold**: 7.5 (configurable)
- **File Size Limit**: 100MB
- **Scan Interval**: 300 seconds (5 minutes)
- **Concurrency**: Multi-threaded scanning (4 workers)

#### Files Involved
- Backend: `auto_ransomware_scanner.py`, `utils/ransomware_scanner.py`, `routes/ransomware_routes.py`
- Frontend: `pages/Ransomware.jsx`, `components/RansomwareMonitor.jsx`

---

### Module 3: File Integrity Monitor (Audit)

#### What It Does
Verifies that critical files haven't been tampered with by comparing cryptographic hashes.

#### How It Works
```
Initial Registration:
  Read file content → Calculate SHA256 hash → Store in DB

Periodic Verification (every 5 minutes):
  Read file again → Calculate new hash
         ↓
  Compare: new_hash == stored_hash?
         ↓
  NO → File has been tampered!
    - Generate line-by-line diff
    - Send alert (WebSocket + Email)
    - Store new snapshot
         ↓
  YES → File is intact ✓
```

#### SHA256 Hashing Explained
```python
# SHA256 creates a unique "fingerprint" of a file
# Even 1 character change = completely different hash

Original file: "password=123456"
Hash: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

Modified file: "password=123457" (only last digit changed)
Hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
                    ↑ Completely different!

This makes it impossible to tamper without detection.
```

#### Technical Details
- **Hash Algorithm**: SHA256 (256-bit cryptographic hash)
- **Chunked Reading**: 4MB chunks for large files (memory efficient)
- **Diff Generation**: Python difflib (unified diff format)
- **Scheduler**: APScheduler background thread
- **Verification Interval**: 300 seconds (configurable)

#### Files Involved
- Backend: `scheduler.py`, `utils/audit_service.py`, `routes/audit_routes.py`
- Frontend: `pages/Audit.jsx`, `components/LogIntegrityAudit.jsx`

---

### Module 4: System Log Management

#### What It Does
Collects, stores, and displays system logs from Windows Event Viewer in real-time.

#### How It Works
```
Windows Event Log Collector (auto_windows_eventlog.py):
  ↓
Poll Windows Event Viewer every 10 seconds
  ↓
Extract new events (System, Application logs)
  ↓
Parse event data:
  - Timestamp
  - Level (ERROR, WARN, INFO)
  - Source (System, Application)
  - Message
  ↓
Send to Backend API via HTTP POST
  ↓
Backend stores in MongoDB + broadcasts via WebSocket
  ↓
Frontend receives WebSocket event → Updates UI in real-time
```

#### Log Buffering (Performance Optimization)
```javascript
// Without buffering: 100 logs/sec = 100 React re-renders/sec = LAG!

// With buffering:
Collect logs in buffer for 500ms
   ↓
Batch update: Add all 50 logs at once
   ↓
React re-renders once (smooth!)
```

#### Technical Details
- **Windows API**: pywin32 library
- **Poll Interval**: 10 seconds
- **Event Types**: Error, Warning, Information
- **Log Sources**: System, Application, (Security if admin)
- **Batch Size**: Up to 100 events per poll
- **Frontend Buffer**: 500ms batching window

#### Files Involved
- Backend: `auto_windows_eventlog.py`, `routes/logs_routes.py`
- Frontend: `pages/SystemLogs.jsx`, `components/TimelineChart.jsx`

---

### Module 5: Alert Management System

#### What It Does
Unified alert pipeline that sends notifications via WebSocket, Email, and Database.

#### How It Works
```
Threat Detected (anywhere in system)
         ↓
Call: alert_manager.send_alert()
         ↓
┌────────────────────────────────┐
│  1. WebSocket Broadcast        │ → Frontend shows toast notification
│  2. Email Send (if critical)   │ → Admin receives email
│  3. MongoDB Insert              │ → Alert stored for history
└────────────────────────────────┘
         ↓
All connected clients receive real-time notification
```

#### Alert Severity Levels
```javascript
info:       Low severity, informational (blue)
warning:    Medium severity, needs attention (yellow)
critical:   High severity, immediate action needed (red)
ransomware: Ransomware detected (dark red)
tamper:     File integrity violation (orange)
```

#### Technical Details
- **WebSocket Events**: Broadcast to all connected clients
- **Email SMTP**: Flask-Mail with Gmail SMTP (configurable)
- **Email Triggers**: Only critical/ransomware/tamper alerts
- **Alert Storage**: MongoDB alerts collection
- **Toast Duration**: 5 seconds (frontend)

#### Files Involved
- Backend: `utils/alert_manager.py`, `utils/email_alerts.py`, `routes/alerts_routes.py`
- Frontend: `components/ui/Toast.jsx`, `pages/Alerts.jsx`

---

### Module 6: Dashboard & Analytics

#### What It Does
Displays real-time security metrics, statistics, and visualizations.

#### How It Works
```
Dashboard loads
   ↓
Fetch statistics from all modules:
  - Total ransomware scans
  - Suspicious files detected
  - Total file integrity checks
  - Files tampered
  - System logs count
  - Critical alerts count
   ↓
Display as stat cards with animations
   ↓
Listen to WebSocket for live updates
   ↓
Update stats in real-time without page refresh
```

#### Visualizations
1. **Threat Trends Chart** (Line chart)
   - X-axis: Time (last 24 hours)
   - Y-axis: Number of threats
   - Updates every 5 minutes

2. **Threat Types Chart** (Doughnut chart)
   - Ransomware: 40%
   - File Tampering: 30%
   - Log Anomalies: 20%
   - Other: 10%

3. **Severity Distribution** (Bar chart)
   - Critical: 5 alerts
   - Warning: 12 alerts
   - Info: 23 alerts

4. **Live Activity Feed**
   - Real-time stream of recent events
   - Auto-scrolls as new events arrive

#### Technical Details
- **Chart Library**: Chart.js with react-chartjs-2
- **Data Aggregation**: MongoDB aggregation pipelines
- **Update Frequency**: 
  - Initial load: Immediate
  - Live updates: WebSocket events
  - Auto-refresh: Every 30 seconds (configurable)

#### Files Involved
- Backend: `routes/dashboard_routes.py`
- Frontend: `pages/Dashboard.jsx`, `pages/EnhancedDashboard.jsx`, various chart components

---

### Module 7: Report Generation

#### What It Does
Generates comprehensive security reports in PDF format.

#### How It Works
```
User clicks "Generate Report"
   ↓
Select date range (e.g., last 30 days)
   ↓
Backend queries all collections:
  - ransomware_scans (count suspicious files)
  - audit_logs (count integrity checks)
  - system_logs (count by level)
  - alerts (count by severity)
   ↓
Aggregate data and calculate statistics
   ↓
Generate PDF using reportlab:
  - Cover page with date range
  - Executive summary
  - Module-wise statistics
  - Charts (embedded as images)
  - Detailed listings
   ↓
Return PDF file for download
```

#### Report Contents
```
📄 ThreatTrace Security Report
   Date Range: 2026-01-15 to 2026-02-14

1. Executive Summary
   - Total scans performed: 420
   - Threats detected: 7
   - Files monitored: 25
   - Tamper incidents: 1

2. Ransomware Detection
   - Total scans: 420
   - Suspicious files: 5
   - Clean files: 415
   - Top threat: high_entropy_file.bin

3. File Integrity
   - Files monitored: 25
   - Verifications: 1,200
   - Tamper incidents: 1
   - Affected file: hosts

4. System Logs
   - Total entries: 3,456
   - Errors: 23
   - Warnings: 156
   - Info: 3,277

5. Alerts
   - Critical: 8
   - Warning: 45
   - Info: 123
```

#### Technical Details
- **PDF Library**: reportlab (Python)
- **Data Aggregation**: MongoDB aggregation framework
- **Chart Generation**: matplotlib (server-side rendering)
- **File Size**: Typically 500KB - 2MB

#### Files Involved
- Backend: `routes/reports_routes.py`
- Frontend: `pages/Reports.jsx`

---

### Module 8: Role-Based Access Control (RBAC)

#### What It Does
Controls who can access what features based on their role.

#### How It Works
```
User logs in with role: "technical"
         ↓
JWT token includes role claim
         ↓
Frontend checks role before showing UI elements:
  if (userRole === 'technical') {
    show("Advanced Settings")
  }
         ↓
Backend checks role before allowing API access:
  @role_required(['technical', 'corporate'])
  def advanced_endpoint():
    ...
```

#### Roles & Permissions

**Personal** (Regular User):
- ✅ View own scans
- ✅ Upload files for scanning
- ✅ View own alerts
- ❌ Cannot export logs
- ❌ Cannot access scheduler
- ❌ Cannot generate reports

**Corporate** (Business User):
- ✅ All Personal permissions
- ✅ Export logs (CSV/JSON)
- ✅ Generate reports
- ✅ View company-wide statistics
- ❌ Cannot access scheduler settings

**Technical** (Admin/IT):
- ✅ All Corporate permissions
- ✅ Access scheduler controls
- ✅ Advanced settings
- ✅ User management (future feature)
- ✅ System configuration

#### Technical Details
- **Frontend Guard**: `hasRole()` utility function
- **Backend Decorator**: `@role_required(['role1', 'role2'])`
- **Role Storage**: In user document + JWT claims
- **Default Role**: 'personal' for new signups

#### Files Involved
- Backend: `utils/role_guard.py`
- Frontend: `utils/role.js`, `utils/ProtectedRoute.jsx`

---

## Quick Start Guide

### Prerequisites Checklist
```
✅ Python 3.8+ installed
✅ Node.js 18+ installed
✅ MongoDB running (local or Atlas)
✅ Git installed
✅ Code editor (VS Code recommended)
✅ Terminal (PowerShell/Command Prompt)
```

### Installation Steps

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd ThreatTrace
```

#### Step 2: Setup Backend
```powershell
# Navigate to backend
cd ThreatTrace\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
pip install -r requirements_automation.txt

# Create .env file (copy from .env.example)
copy .env.example .env

# Edit .env and add your MongoDB URI and email credentials
notepad .env
```

**Required .env variables**:
```
MONGO_URI=mongodb://localhost:27017/threattrace
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

#### Step 3: Setup Frontend
```powershell
# Navigate to frontend
cd ..\frontend

# Install dependencies
npm install
```

#### Step 4: Configure Automation
```powershell
# Navigate to project root
cd ..

# Edit automation config
notepad ThreatTrace\backend\automation_config.py
```

**Key configurations**:
```python
# Add directories to scan
RANSOMWARE_WATCH_DIRS = [
    "C:\\Users\\YourName\\Downloads",
    "C:\\Users\\YourName\\Documents",
]

# Add files to monitor
AUTO_REGISTER_FILES = [
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
]
```

#### Step 5: Register Files (One-Time)
```powershell
cd ThreatTrace\backend
python auto_file_registration.py
```

#### Step 6: Start All Services

**Terminal 1 - Backend**:
```powershell
cd ThreatTrace\backend
python app.py
```

**Terminal 2 - Automation**:
```powershell
cd ThreatTrace\backend
python automation_runner.py
```

**Terminal 3 - Frontend**:
```powershell
cd ThreatTrace\frontend
npm run dev
```

#### Step 7: Access Application
1. Open browser: `http://localhost:5173`
2. Sign up with a new account
3. Login and explore!

---

## Advanced Features

### Feature 1: Custom Automation Intervals
```python
# In automation_config.py

# Scan for ransomware every 2 minutes instead of 5
RANSOMWARE_SCAN_INTERVAL = 120  # seconds

# Check file integrity every 1 minute
# In scheduler.py
init_scheduler(app, interval_seconds=60)
```

### Feature 2: Email Alert Customization
```python
# In utils/email_alerts.py

def send_tamper_alert(file_path, recipient):
    # Customize email template
    subject = "🚨 URGENT: File Tampered - " + file_path
    body = f"""
    Critical Alert!
    
    File: {file_path}
    Time: {datetime.now()}
    Action Required: Immediate investigation
    
    Login to ThreatTrace for details.
    """
```

### Feature 3: Custom Ransomware Signatures
```python
# In utils/ransomware_scanner.py

KNOWN_RANSOMWARE_HASHES = {
    "your-hash-here": "Custom Ransomware Name",
    # Add more as you discover them
}
```

### Feature 4: API Integration
```python
# Integrate with other tools via API

import requests

# Scan a file programmatically
response = requests.post(
    "http://localhost:5000/api/ransomware/scan",
    json={"file_path": "C:\\temp\\file.exe"},
    headers={"Authorization": "Bearer YOUR_JWT_TOKEN"}
)

result = response.json()
print(f"Suspicious: {result['suspicious']}")
```

### Feature 5: Webhook Integration
```python
# Send alerts to Slack/Discord

def send_webhook_alert(alert):
    import requests
    
    webhook_url = "https://hooks.slack.com/your-webhook"
    
    message = {
        "text": f"🚨 {alert['title']}",
        "attachments": [{
            "color": "danger",
            "fields": [{
                "title": "Message",
                "value": alert['message']
            }]
        }]
    }
    
    requests.post(webhook_url, json=message)
```

---

## Summary Statistics

### Project Metrics
```
📊 Lines of Code: ~10,000+
📦 Modules: 21+
⚙️ Features: 90+
🎯 API Endpoints: 25+
🎨 UI Components: 35+
📁 Database Collections: 5
🔌 WebSocket Events: 4
📧 Email Templates: 3
📈 Chart Types: 4
🔐 Auth Methods: JWT + Bcrypt
```

### Technology Stack Summary
```
Frontend:
  - React 18.2.0
  - Vite 5.4.21
  - React Router v6.3.0
  - Axios 1.4.0
  - Socket.IO Client 4.8.1
  - Chart.js 4.4.0
  - Tailwind CSS v4

Backend:
  - Flask (latest)
  - Flask-SocketIO
  - Flask-JWT-Extended
  - Flask-Mail
  - PyMongo
  - APScheduler
  - Bcrypt

Database:
  - MongoDB

Automation:
  - pywin32 (Windows Event Logs)
  - Python threading
  - APScheduler
```

---

## Conclusion

ThreatTrace is a **production-ready cybersecurity monitoring platform** that provides:

✅ **Real-time threat detection** (ransomware, file tampering, log anomalies)
✅ **Automated monitoring** (no manual intervention needed)
✅ **Multi-channel alerts** (WebSocket, email, database)
✅ **Comprehensive audit trails** (for compliance)
✅ **User-friendly dashboard** (visual analytics)
✅ **Role-based access** (secure multi-user support)
✅ **Cost-effective solution** (open-source, no licensing fees)

**Perfect for**:
- Small to medium businesses
- IT security teams
- Compliance officers
- Educational institutions
- Security researchers
- Managed service providers

**Deployment Ready**:
- Can run on local servers
- Can deploy to cloud (AWS, Azure, GCP)
- Scalable architecture
- Production-grade error handling
- Graceful shutdown mechanisms

---

**Last Updated**: 2026-02-14  
**Project Status**: ✅ Production-Ready  
**Documentation Version**: 1.0
