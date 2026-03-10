# ThreatTrace Comprehensive Project Analysis

## How to Run the Project

### Prerequisites

- Python 3.x
- Node.js and npm
- MongoDB local or MongoDB Atlas
- Windows system if you want to use Windows Event Log automation

### Backend setup

1. Open terminal in `ThreatTrace/backend`
2. Install Python dependencies:

```powershell
pip install -r requirements.txt
```

3. Create a `.env` file in `backend/` with required values:

```env
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_email_password
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
DEBUG=True
```

4. Start backend server:

```powershell
python app.py
```

Backend runs by default at `http://127.0.0.1:5000`.

### Frontend setup

1. Open terminal in `ThreatTrace/frontend`
2. Install frontend dependencies:

```powershell
npm install
```

3. Start frontend:

```powershell
npm run dev
```

Frontend runs by default at `http://127.0.0.1:5173`.

### Optional automation setup

If you want the project to automatically use local system data, run these optional scripts after backend is running.

From `ThreatTrace/backend`:

```powershell
python automation_runner.py
```

Optional one-time file registration:

```powershell
python auto_file_registration.py
```

### Full run order

1. Start MongoDB or ensure Atlas connection is working
2. Start backend with `python app.py`
3. Start frontend with `npm run dev`
4. Optionally start automation with `python automation_runner.py`
5. Open `http://127.0.0.1:5173`

## 1. Project Overview

ThreatTrace is a full-stack cyber security monitoring platform built as a role-based web application. It combines:

- authentication and profile management
- ransomware file scanning
- file integrity auditing
- centralized system log ingestion
- real-time alerting
- security reporting
- location intelligence with globe visualization
- runtime containment controls
- background automation agents

The project is structured as two main applications:

- `frontend/`: React + Vite single-page application
- `backend/`: Flask API + Socket.IO + MongoDB services

From the codebase, this project appears to have been built as a practical security operations dashboard for local/system monitoring use, with a mix of:

- real backend-driven data
- simulated or fallback analytics for dashboard visuals
- automation scripts that pull data from the local machine and push it into the platform

## 2. High-Level Architecture

### Frontend

- Built with React 18 and Vite
- Uses `react-router-dom` for page routing
- Uses `axios` for API communication
- Uses `socket.io-client` for real-time updates
- Uses `chart.js` and `react-chartjs-2` for charts
- Uses `react-globe.gl` and `three` for the 3D globe
- Uses Tailwind-style utility classes and custom cyber-themed UI styling

Main frontend entry flow:

1. User logs in.
2. JWT token and role are stored in `localStorage`.
3. `ProtectedRoute` checks token presence and role features.
4. `DashboardLayout` loads sidebar, top navbar, background, and global socket listeners.
5. Individual pages fetch data from backend REST APIs and subscribe to socket events.

### Backend

- Built with Flask
- Uses Flask-CORS for frontend access
- Uses Flask-JWT-Extended for authentication
- Uses Flask-Bcrypt for password hashing
- Uses Flask-Mail for password reset and alert emails
- Uses Flask-SocketIO for real-time event push
- Uses APScheduler for periodic integrity checks
- Uses PyMongo for MongoDB access

Main backend flow:

1. `backend/app.py` boots Flask and extensions.
2. MongoDB is initialized through `database/db_config.py`.
3. Security audit and canary indexes are created on startup.
4. Blueprints are registered for each functional module.
5. Socket events are emitted when alerts, logs, tamper events, or location events occur.

### Database

MongoDB is the central datastore. Collections used in the current implementation include:

- `users`
- `revoked_tokens`
- `alerts`
- `system_alerts`
- `audit_logs`
- `ransomware_logs`
- `system_logs`
- `tracked_locations`
- `security_audit_trail`
- `blocked_ips`
- `canary_assets`
- `canary_triggers`
- `canary_ip_allowlist`
- `canary_challenges`
- `canary_challenge_responses`

## 3. Tech Stack and Where It Is Used

### Frontend stack

- React: component-based UI in `frontend/src`
- Vite: development/build tool in `frontend/package.json` and `vite.config.js`
- React Router: route protection and page navigation in `frontend/src/App.jsx`
- Axios: HTTP service layer in `frontend/src/services/*.js`
- Socket.IO client: live alerts/logs/stats in `frontend/src/utils/socket.js`
- Chart.js + react-chartjs-2: trends, threat types, severity visualizations
- react-globe.gl + three: interactive globe in `GlobeVisualization.jsx`
- Heroicons: iconography in dashboard and UI pages

### Backend stack

- Flask: API server in `backend/app.py`
- Flask-JWT-Extended: JWT auth and token checks
- Flask-Bcrypt: password hashing in auth module
- Flask-Mail: reset email and security email sending
- Flask-SocketIO: real-time event delivery
- APScheduler: periodic integrity scan scheduler
- PyMongo: direct MongoDB collection access
- Requests: used by automation scripts to send data to backend
- ReportLab: PDF export for logs/reports

### Automation stack

- PowerShell starter scripts in project root
- Python background scripts in `backend/auto_*.py`
- Windows Event Log APIs through `pywin32` in `auto_windows_eventlog.py`
- local file system walking via `os.walk`, `pathlib`, and threaded scanning in `auto_ransomware_scanner.py`

## 4. How the Project Was Built

Based on the code structure, the project was built in layers:

### Step 1: Core security platform

The first foundation is a Flask + MongoDB backend with login/register/reset-password, plus a React dashboard frontend.

### Step 2: Feature modules

Separate backend blueprints and frontend pages were then added for:

- ransomware scanning
- file integrity audit
- system logs
- alerts
- reports

### Step 3: Real-time experience

Socket.IO was added to push:

- new alerts
- ransomware alerts
- tamper alerts
- system log events
- location intelligence events

This makes the dashboard act more like a monitoring console than a normal CRUD app.

### Step 4: Role-based product tiers

A role model was added so the same application serves three user types:

- personal
- corporate
- technical

The frontend hides and protects routes by feature. The backend enforces role checks at the API layer.

### Step 5: Automation and local system ingestion

Automation scripts were added to make the product pull data from the actual machine:

- Windows event logs are collected automatically
- configured directories are scanned for ransomware indicators
- important files can be auto-registered for integrity monitoring

That turns the project from a static dashboard into a system-aware monitoring platform.

## 5. Role-Based Access System

The role model is defined in `frontend/src/utils/role.js` and enforced on the backend by `backend/utils/role_guard.py`.

### Roles

- `personal`
- `corporate`
- `technical`

### Personal user

Can access:

- dashboard
- ransomware scan
- audit
- alerts
- logs
- settings

Use case:
individual user wanting basic monitoring, scanning, alerts, and profile control.

### Corporate user

Gets everything in Personal plus:

- reports
- CSV/PDF report export
- location tracking

Use case:
operations or management user who needs reporting and geographic threat context.

### Technical user

Gets everything in Corporate plus:

- security control
- canary trap management
- scheduler controls in audit
- destructive operations like deleting alerts

Use case:
admin/SOC/technical analyst who needs containment and deeper security control.

### Enforcement model

Frontend enforcement:

- `ProtectedRoute.jsx` checks token presence
- `requiredFeature` gates page access
- role utilities map routes to features

Backend enforcement:

- `role_required()` decorator validates JWT and role claim
- unauthorized access returns HTTP 403
- denials are logged into the security audit trail

## 6. Security Design

ThreatTrace has multiple security layers implemented in code.

### Authentication security

- passwords are hashed with Bcrypt
- JWT tokens are issued for 12 hours
- revoked token support exists
- force logout can invalidate older tokens

### Login abuse protection

In `auth_routes.py`:

- failed attempts are counted
- after 5 failed attempts, account is locked for 15 minutes
- suspicious login attempts generate alerts
- security events are recorded in the audit trail

### API authorization

Sensitive APIs use role decorators. Examples:

- reports export: corporate and technical only
- alert deletion: technical only
- security control: technical only

### Runtime containment

In `security_audit.py` and `security_routes.py`:

- abusive IPs can be auto-blocked
- risky users can be auto-quarantined
- quarantined users can be released manually
- blocked IPs can be removed manually

### Append-only style security audit trail

Security events are stored with:

- `prev_hash`
- `event_hash`

This creates a hash-chained log trail to make the security audit path tamper-evident.

### Auto-detection logic for anomalies

The system watches for:

- brute-force login patterns
- mass export patterns
- repeated authorization denials
- bursts of destructive alert actions

When thresholds are crossed, the system can:

- emit a security alert
- block an IP
- quarantine a user

### Email alerts

Email is used for:

- password reset flows
- tamper alerts
- security alerts

### Canary traps

The technical security control module includes canary assets and challenge flows:

- create trap assets
- track trigger events
- maintain allowlists
- collect challenge responses

This is useful for deception-based detection.

## 7. Main Modules and How They Work

### 7.1 Authentication module

Backend:
- `backend/routes/auth_routes.py`

Frontend:
- `Login.jsx`
- `Signup.jsx`
- `ForgotPassword.jsx`
- `ResetPassword.jsx`

Build logic:

- register inserts a user with default profile fields
- login verifies password, records login IP/time, and returns JWT + role
- forgot-password generates a reset token and emails it
- reset-password validates token and updates password
- profile endpoints load and update user profile data

### 7.2 Dashboard module

Backend:
- `backend/routes/dashboard_routes.py`

Frontend:
- `EnhancedDashboard.jsx`
- chart/globe/feed components

Build logic:

- frontend fetches locations, trends, types, severity, stats, and top threats
- frontend refreshes every 30 seconds
- frontend also listens to live socket events
- some dashboard endpoints use real DB counts
- some dashboard visuals use fallback/mock distribution when real data is incomplete

Important note:
the dashboard is a hybrid real-time analytics layer, not a pure raw-data mirror. It mixes real stored data with generated/fallback presentation data for richer visuals.

### 7.3 Ransomware detection module

Backend:
- `backend/routes/ransomware_routes.py`
- `backend/utils/ransomware_scanner.py`
- `backend/auto_ransomware_scanner.py`

Frontend:
- `Ransomware.jsx`

Logic used:

- suspicious extensions are checked
- entropy analysis is used to identify possible encryption
- suspicious scans are stored in `ransomware_logs`
- suspicious results emit alerts

Methods used:

- Shannon entropy calculation
- file upload scanning
- path-based scanning
- scheduled directory scanning through automation

### 7.4 Audit integrity module

Backend:
- `backend/routes/audit_routes.py`
- `backend/utils/audit_service.py`
- `backend/scheduler.py`

Frontend:
- `Audit.jsx`

Logic used:

- first scan creates baseline snapshot
- later scans compute SHA-256 hash
- file lines are compared with unified diff
- tampering is detected when new hash differs from stored hash
- risk score is computed from tamper state, added/removed lines, and file size
- recommendations are generated from risk level

Methods used:

- streaming SHA-256 hashing
- snapshot storage
- line diffing with `difflib.unified_diff`
- scheduled periodic re-verification
- websocket tamper alerts
- tamper email alerts

### 7.5 System logs module

Backend:
- `backend/routes/logs_routes.py`

Frontend:
- `SystemLogs.jsx`

Logic used:

- logs are ingested through `/api/logs/ingest`
- logs are stored in `system_logs`
- logs can be filtered by text, level, source, and date range
- socket events stream fresh logs to the UI
- frontend buffers incoming log events to avoid render storms
- logs can be exported by higher roles

Methods used:

- paginated retrieval
- live push via Socket.IO
- client-side filtering and timeline aggregation

### 7.6 Alerts module

Backend:
- `backend/routes/alerts_routes.py`
- `backend/utils/alert_manager.py`

Frontend:
- `Alerts.jsx`

Logic used:

- alerts are generated from different sources such as auth, ransomware, tamper, and security audit
- alerts are stored in MongoDB
- users can acknowledge and resolve alerts
- technical users can delete alerts
- bulk acknowledge and bulk resolve are supported

Methods used:

- REST CRUD-style operations
- aggregation for stats
- security audit logging for sensitive actions
- live alert push over Socket.IO

### 7.7 Reports module

Backend:
- `backend/routes/reports_routes.py`

Frontend:
- `Reports.jsx`

Logic used:

- user picks date range
- backend combines alert, audit, and ransomware data into a summary report
- report export is limited to corporate and technical roles
- CSV and PDF outputs are supported

Methods used:

- date range filtering
- aggregation pipelines
- PDF generation with ReportLab
- security audit logging for export actions

### 7.8 Location intelligence module

Backend:
- `backend/routes/locations_routes.py`
- `backend/utils/geoip_service.py`

Frontend:
- `LocationTracking.jsx`
- `GlobeVisualization.jsx`

Logic used:

- suspicious source IP or provided IP is geolocated
- event is saved in `tracked_locations`
- event is emitted to the frontend
- globe points and event detail panels are updated
- page also supports drill simulation for demo/testing

Methods used:

- GeoIP enrichment
- confidence scoring based on severity, proxy/hosting/Tor flags, and failure counts
- live threat-location socket events
- event deep-linking via query parameter

### 7.9 Security control module

Backend:
- `backend/routes/security_routes.py`
- `backend/routes/canary_routes.py`
- `backend/utils/security_audit.py`
- `backend/utils/canary_trap.py`

Frontend:
- `SecurityControl.jsx`

Logic used:

- display blocked IPs
- display quarantined users
- display security audit events
- manage canary assets
- manage canary allowlist
- review canary triggers and challenge responses

Methods used:

- runtime containment actions
- admin response tools
- deception/decoy workflow

### 7.10 Settings/profile module

Backend:
- auth profile endpoints

Frontend:
- `Settings.jsx`

Logic used:

- loads profile from backend
- caches profile in browser
- supports profile metadata edits
- supports avatar upload via base64 or URL
- shows current role and capability labels

## 8. Page-by-Page UI Explanation

### Login page

Elements:

- logo and cyber background
- email input
- password input
- forgot password link
- login button
- signup navigation

Purpose:
entry point into the system.

### Signup page

Elements:

- name, email, password fields
- role selector
- submit button

Purpose:
create account and choose initial product role/tier.

### Forgot password page

Elements:

- email field
- send reset button

Purpose:
start password reset email flow.

### Reset password page

Elements:

- new password
- confirm password
- reset action button

Purpose:
complete password recovery.

### Enhanced dashboard page

Elements:

- top heading and action buttons
- animated stat cards
- 3D globe
- live activity feed
- threat trends chart
- threat types chart
- severity chart
- secondary metric cards

Purpose:
give a central security operations summary view.

### Ransomware page

Elements:

- upload file input
- upload and scan button
- scan log table

Purpose:
manual malware/ransomware inspection for suspicious files.

### Audit page

Elements:

- verify-by-path input
- file upload scan input
- result display
- audit history
- scheduler controls for technical role
- locked scheduler info for non-technical roles

Purpose:
detect file tampering and maintain integrity history.

### Alerts page

Elements:

- alert statistics cards
- severity/status/source filters
- bulk action controls
- alert table/cards
- per-alert acknowledge/resolve/delete actions
- pagination

Purpose:
security incident handling workflow.

### Reports page

Elements:

- date range selectors
- quick presets
- generate report button
- export CSV/PDF buttons
- summary statistics
- top threats
- recent activities

Purpose:
turn operational data into management-friendly summaries.

### System logs page

Elements:

- filters for query, level, source, dates
- auto-refresh toggle
- timeline chart
- logs table
- export controls

Purpose:
central log review and troubleshooting.

### Location intelligence page

Elements:

- SOC drill simulator controls
- severity/source filters
- 3D globe
- tracked event list
- selected event details panel

Purpose:
visualize attacker source locations and incident spread.

### Security control page

Elements:

- blocked IP summary
- quarantined users summary
- audit chain summary
- canary asset counts
- canary trigger counts
- allowlist counts
- unblock/release controls
- canary creation and allowlist management
- challenge response review

Purpose:
technical admin control center for live containment and deception security.

### Settings page

Elements:

- account overview
- role capability cards
- profile form
- avatar upload/URL

Purpose:
manage personal account and see feature entitlement.

## 9. Day-to-Day Usage

### For normal daily users

ThreatTrace can be used as a daily safety dashboard to:

- check whether suspicious files were scanned
- monitor important files for unexpected changes
- view security alerts from the system
- review important logs
- generate reports for recent activity

Example day-to-day value:

- a personal user can verify a log or file was not modified
- a corporate user can export a weekly threat report
- a technical user can monitor abusive IPs and release or quarantine accounts

### For technical/security users

It acts more like a mini SOC console:

- ingest system events
- scan watched directories for ransomware indicators
- investigate suspicious geographic sources
- respond to brute-force or export-abuse anomalies
- use canary traps for detection
- operate automated integrity scans

## 10. Automation and How It Is Implemented

ThreatTrace has one of its strongest parts in the automation layer.

### 10.1 Automation configuration

All automation settings are centralized in `backend/automation_config.py`.

It defines:

- ransomware watch directories
- scan interval
- file extensions to inspect
- auto-register files/directories
- Windows Event Log sources
- event polling interval
- backend API URL
- performance limits

### 10.2 Master automation runner

`backend/automation_runner.py` starts multiple automation components in threads:

- ransomware auto-scanner
- Windows event log collector

This is the process supervisor for background agents.

### 10.3 Auto-ransomware scanner

File:
- `backend/auto_ransomware_scanner.py`

Implementation logic:

1. Load configured watch directories.
2. Walk files recursively.
3. Skip hidden/system directories.
4. Respect max file and file-size limits.
5. Skip files modified too recently.
6. Scan candidate files concurrently.
7. Compute entropy and suspicious extension rules.
8. Only suspicious results are posted back to backend.

Why this logic works:

- entropy is a practical indicator for encrypted content
- suspicious extension matching catches renamed encrypted files
- recent-file skipping avoids false positives on files still being written
- concurrency improves speed without blocking on a single file

### 10.4 Auto file registration

File:
- `backend/auto_file_registration.py`

Implementation logic:

1. Read configured critical files and directories.
2. Verify each path exists.
3. For each file, call `/api/audit/verify-path`.
4. First verification creates baseline in `audit_logs`.
5. Scheduler later re-checks these registered files automatically.

Why this logic works:

it separates one-time baseline registration from recurring monitoring.

### 10.5 Windows Event Log collector

File:
- `backend/auto_windows_eventlog.py`

Implementation logic:

1. Open configured Windows event logs like System and Application.
2. Track the last record number read.
3. Poll for new records at a fixed interval.
4. Normalize events to the ThreatTrace schema.
5. POST them into `/api/logs/ingest`.
6. For warning/error-style events, try to extract IPs and geolocate them.
7. Broadcast threat locations to dashboard if location data is found.

Why this logic works:

- it turns local Windows telemetry into centralized application data
- it connects logs directly to visual monitoring and location intelligence

## 11. How Data From the Local System Is Automatically Used

This is the end-to-end local-data path.

### Path A: Windows event logs

1. Your machine generates Windows events.
2. `auto_windows_eventlog.py` reads them locally using Windows APIs.
3. It sends them to the backend `/api/logs/ingest`.
4. Backend stores them in `system_logs`.
5. Backend emits `system_log` socket events.
6. Dashboard and System Logs page update in real time.
7. If IPs are found, location events can also be generated for globe display.

### Path B: Local files for ransomware scanning

1. The auto-scanner reads configured folders like Downloads/Documents.
2. It scans files locally for entropy and suspicious extensions.
3. Suspicious file paths are sent to backend ransomware API.
4. Backend records the scan and raises alerts.
5. Alerts appear in dashboard, alert center, and ransomware logs.

### Path C: Local files for integrity monitoring

1. You register critical files manually or through auto-registration.
2. Backend creates baseline hashes and snapshots.
3. APScheduler rechecks them at intervals.
4. If content changes, tamper alerts and optional emails are generated.
5. Audit history and dashboard are updated.

## 12. Core Logic and Methods Used Across the Project

Main technical methods used in this codebase:

- JWT-based stateless authentication
- Bcrypt password hashing
- role-based access control with feature mapping
- SHA-256 streaming hashing
- unified diff comparison
- entropy-based suspicious file detection
- MongoDB document collections with direct query access
- aggregation for stats/reporting
- Socket.IO event broadcasting
- append-only hash-chained audit logging
- IP geolocation enrichment
- background task scheduling
- threaded automation workers

## 13. Notable Implementation Characteristics

### Strengths

- clear frontend/backend separation
- practical security feature coverage
- real-time event-driven UI
- well-defined user roles
- good automation story for local machine telemetry
- direct operational value for demo and real usage

### Important observations

- some dashboard analytics endpoints use fallback or mock distribution logic when real data is sparse
- there are overlapping/legacy pieces such as alternate log route files and older dashboard code paths
- the current data model is PyMongo-based rather than a strict ORM/schema system

These do not break the project concept, but they matter when presenting it: the platform is both a working security monitor and a demo-friendly showcase with enhanced visuals.

## 14. Suggested Short Project Summary

ThreatTrace is a role-based cyber security monitoring platform built with React, Flask, MongoDB, and Socket.IO. It combines ransomware detection, file integrity auditing, centralized logs, alert management, reporting, location intelligence, and runtime containment controls. Its automation layer reads data from the local system, including Windows event logs and watched directories, and pushes that telemetry into the application for real-time monitoring and response.

## 15. Best Way to Explain This Project in Presentation or Viva

You can describe it like this:

"I built ThreatTrace as a full-stack cyber security monitoring platform. The frontend is built in React with Vite, charts, and a 3D globe for visualization. The backend is Flask with MongoDB, JWT authentication, Socket.IO for real-time updates, APScheduler for automated checks, and Python automation scripts. The system supports three roles: Personal, Corporate, and Technical. Personal users get core monitoring features, Corporate users get reporting and location intelligence, and Technical users get containment controls and canary traps. The project automatically uses data from the host system through Windows Event Log collection, directory-based ransomware scanning, and file integrity registration. That data flows into MongoDB, triggers real-time alerts, and appears across the dashboard, logs, alerts, audit, and reports modules."
