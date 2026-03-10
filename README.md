<p align="center">
  <img src="./frontend/public/images/logos/logo-full.png" alt="ThreatTrace banner" width="520" />
</p>

<h1 align="center">ThreatTrace</h1>

<p align="center">
  Real-time cyber security monitoring platform with threat visibility, audit integrity, ransomware scanning, location intelligence, and runtime containment.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=061a23" alt="React + Vite" />
  <img src="https://img.shields.io/badge/Backend-Flask-111827?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Database-MongoDB-0f172a?style=for-the-badge&logo=mongodb&logoColor=47A248" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-1f2937?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RBAC-Personal%20%7C%20Corporate%20%7C%20Technical-7c3aed?style=flat-square" alt="RBAC" />
  <img src="https://img.shields.io/badge/Automation-Windows%20Events%20%2B%20File%20Scanning-0ea5e9?style=flat-square" alt="Automation" />
  <img src="https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt%20%2B%20Audit%20Chain-ef4444?style=flat-square" alt="Security" />
</p>

> ThreatTrace is a full-stack security operations dashboard designed to turn host activity, suspicious files, and security events into actionable, real-time intelligence.

## Overview

ThreatTrace combines real-time threat visibility, file integrity auditing, ransomware detection, centralized log monitoring, reporting, location intelligence, and runtime containment controls in a single role-based dashboard.

It is built as a React frontend with a Flask + MongoDB backend and includes automation scripts that can ingest data directly from the host system, including Windows Event Logs, watched files, and monitored directories.

## Quick Navigation

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Core Modules](#core-modules)
- [Role Model](#role-model)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Automation Overview](#automation-overview)
- [Security Design](#security-design)
- [API Modules](#api-modules)
- [Project Documentation](#project-documentation)
- [Use Cases](#use-cases)
- [Status](#status)

## Highlights

| Capability | What it delivers |
|---|---|
| Real-time dashboard | Live alerts, charts, activity feed, and 3D globe |
| RBAC | Feature-based access for `personal`, `corporate`, and `technical` users |
| Ransomware detection | Suspicious extension checks and entropy analysis |
| Audit integrity | SHA-256 hashing, baselining, diffs, and scheduled verification |
| Log monitoring | Centralized ingestion, filtering, export, and socket updates |
| Alert operations | Acknowledge, resolve, bulk actions, and admin deletion |
| Reporting | Summary generation plus CSV/PDF export |
| Location intelligence | IP geolocation and incident visualization |
| Security control | Blocked IPs, quarantined users, canary traps, and audit chain |
| Automation | Windows Event Logs, watched directories, and file registration |

## Why It Stands Out

- Unifies monitoring, detection, response, and reporting in one interface
- Connects local system telemetry directly into a live web dashboard
- Supports both daily users and technical responders through tiered access
- Includes both operational security logic and presentation-ready analytics

## Visual Preview

Add screenshots or GIFs here to make the repository immediately more engaging for visitors.

| Preview | Suggested content |
|---|---|
| Dashboard | Main dashboard with stats, globe, and charts |
| Alerts | Alert center with statuses and actions |
| Audit | File integrity module with scheduler controls |
| Security Control | Blocked IPs, quarantined users, and canary controls |

Recommended screenshot paths once you add them:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/alerts.png`
- `docs/screenshots/audit.png`
- `docs/screenshots/security-control.png`

Recommended demo assets:

- `docs/demo/threattrace-demo.gif`
- `docs/demo/threattrace-walkthrough.mp4`

Example Markdown you can use later:

```md
## Screenshots

![Dashboard](./docs/screenshots/dashboard.png)
![Alerts](./docs/screenshots/alerts.png)
```

## Architecture

### Frontend

- React 18
- Vite
- React Router
- Axios
- Socket.IO client
- Chart.js / react-chartjs-2
- react-globe.gl / three

### Backend

- Flask
- Flask-JWT-Extended
- Flask-Bcrypt
- Flask-Mail
- Flask-SocketIO
- APScheduler
- PyMongo
- ReportLab

### Data layer

- MongoDB for users, alerts, logs, audits, reports, runtime security controls, and canary workflows

## System Flow

```text
Windows events / local files / watched directories
                |
                v
        automation agents
                |
                v
      Flask APIs + MongoDB storage
                |
                v
     Socket.IO real-time event emission
                |
                v
 React dashboard, alerts, logs, reports, globe, and security control
```

## Feature Walkthrough

### 1. Detect

- monitor suspicious files
- ingest Windows Event Logs
- identify tampering in critical files
- geolocate suspicious source activity

### 2. Visualize

- review live dashboard stats
- inspect chart-based threat trends
- explore global threat signals on the 3D globe
- track activity through the live feed

### 3. Respond

- acknowledge or resolve alerts
- export reports
- unblock IPs when necessary
- release quarantined users
- review canary triggers and challenge responses

## Core Modules

### Authentication and profile management

- JWT-based authentication
- password hashing with Bcrypt
- forgot/reset password flow via email
- editable role-aware profile settings

### Dashboard and live monitoring

- aggregated threat metrics
- live activity feed
- severity and trend charts
- globe-based threat visualization
- WebSocket-driven UI refresh

### Ransomware detection

- manual upload scan flow
- suspicious extension checks
- entropy-based detection logic
- stored scan logs and live ransomware alerts

### File integrity audit

- baseline creation on first scan
- streaming SHA-256 hashing
- line diff generation
- risk scoring and recommendations
- optional scheduled re-verification

### System logs and alerts

- log ingestion from automation or APIs
- filtering by level, source, date, and text
- alert acknowledgment and resolution
- CSV/PDF export for higher roles

### Reports and location intelligence

- date-range reporting
- top threats and activity summaries
- IP-based geolocation enrichment
- 3D globe correlation of suspicious activity

### Security control

- blocked IP tracking
- user quarantine management
- security audit trail
- canary traps, triggers, allowlists, and challenge responses

## Role Model

ThreatTrace uses a feature-based RBAC design.

### Personal

- dashboard
- ransomware scan
- audit
- alerts
- logs
- settings

### Corporate

Everything in Personal, plus:

- reports
- report export
- location intelligence

### Technical

Everything in Corporate, plus:

- security control
- canary trap management
- scheduler controls for automated audit scans
- destructive admin actions such as alert deletion

## Repository Structure

```text
ThreatTrace/
|-- backend/
|   |-- app.py
|   |-- automation_runner.py
|   |-- automation_config.py
|   |-- auto_windows_eventlog.py
|   |-- auto_ransomware_scanner.py
|   |-- auto_file_registration.py
|   |-- routes/
|   |-- utils/
|   `-- database/
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |-- components/
|   |   |-- layouts/
|   |   |-- services/
|   |   `-- utils/
|   `-- public/
`-- docs and setup guides
```

## Quick Start

For a fast local run, start with backend, then frontend, then optional automation.

### 1. Prerequisites

- Python 3.x
- Node.js + npm
- MongoDB local instance or MongoDB Atlas
- Windows if you want to run Windows Event Log automation

### 2. Backend setup

From `backend/`:

```powershell
pip install -r requirements.txt
```

Create `backend/.env`:

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

Start the backend:

```powershell
python app.py
```

Default backend URL: `http://127.0.0.1:5000`

### 3. Frontend setup

From `frontend/`:

```powershell
npm install
npm run dev
```

Default frontend URL: `http://127.0.0.1:5173`

### 4. Optional automation

To ingest local system data automatically, start the automation runner from `backend/`:

```powershell
python automation_runner.py
```

To register critical files for integrity monitoring:

```powershell
python auto_file_registration.py
```

## Typical Run Order

1. Start MongoDB or confirm Atlas connectivity
2. Run the backend with `python app.py`
3. Run the frontend with `npm run dev`
4. Optionally run `python automation_runner.py`
5. Open the frontend in the browser

## At a Glance

```text
Local system activity
   -> automation agents
   -> Flask API + MongoDB
   -> Socket.IO events
   -> React dashboard and module pages
   -> alerts, reports, location intelligence, and security control
```

## Demo Flow

If you want to showcase the project quickly:

1. Start backend and frontend
2. Log in with a test user
3. Open the dashboard and alerts page
4. Run `python automation_runner.py`
5. Trigger a file scan or audit verification
6. Show new alerts, live logs, and location updates in the UI
7. Open reports or security control for role-based features

## Automation Overview

ThreatTrace includes background automation that turns host-system activity into application telemetry.

### Windows Event Log collector

- polls configured Windows log sources
- normalizes events into ThreatTrace log schema
- sends them to backend ingestion APIs
- can enrich suspicious events with geolocation

### Auto-ransomware scanner

- scans configured directories recursively
- checks suspicious extensions
- computes file entropy
- posts suspicious detections to backend APIs

### Auto file registration

- registers critical files and config files with the audit system
- enables scheduled integrity checks after baseline creation

Automation behavior is configured in `backend/automation_config.py`.

## Security Design

- JWT authentication with role claims
- Bcrypt password hashing
- login lockout after repeated failed attempts
- append-only style hash-chained security audit trail
- authorization-denied event logging
- runtime IP blocking and user quarantine
- canary/deception workflows for technical users
- email notifications for reset and tamper/security flows

## API Modules

The backend is organized into feature blueprints:

- `auth`
- `ransomware`
- `audit`
- `logs`
- `alerts`
- `reports`
- `dashboard`
- `locations`
- `security`
- `canary`
- `scheduler`

## Notes

- The dashboard analytics layer mixes live stored data with fallback/demo-friendly visualization logic where data is sparse.
- The project contains multiple additional guides and implementation notes in the repository root for testing, deployment, and automation setup.
- Some automation features are Windows-specific by design.

## Project Documentation

For deeper documentation, see:

- [COMPREHENSIVE_PROJECT_ANALYSIS.md](./COMPREHENSIVE_PROJECT_ANALYSIS.md)
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
- [AUTOMATION_SETUP_GUIDE.md](./AUTOMATION_SETUP_GUIDE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## Roadmap Ideas

- add containerized deployment with Docker Compose
- add SIEM-style saved searches and dashboards
- add multi-tenant organization support
- add stronger audit evidence export and signed reports
- add advanced anomaly scoring and ML-assisted prioritization
- add richer case-management workflow for alert triage

## Use Cases

### Daily user value

- scan suspicious files
- verify that important files have not been tampered with
- monitor active alerts and system events
- review recent security activity in one dashboard

### Technical/security operations value

- ingest local system telemetry automatically
- detect suspicious file behavior and tampering
- investigate suspicious source locations
- manage containment actions and canary-based detection
- export reports and review security audit evidence

## Status

ThreatTrace is implemented as a working multi-module project with UI, API, automation, and role-based security features suitable for demonstration, portfolio presentation, and further expansion into a more production-ready security operations tool.

## Author Notes

This repository is structured as a serious portfolio-grade cyber security project rather than a small CRUD demo. It combines frontend engineering, backend API design, real-time systems, security controls, automation, and data visualization in one application.

If you want to make the README even stronger, the next highest-value addition is a real screenshot set and one short GIF showing:

- dashboard load
- alert arriving in real time
- audit tamper detection
- location update on globe
