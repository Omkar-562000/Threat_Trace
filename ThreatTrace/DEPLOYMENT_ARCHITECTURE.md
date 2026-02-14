# 🏗️ ThreatTrace Deployment Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Your Portfolio Visitors)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   VERCEL CDN (Frontend)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React + Vite Application (Static)              │ │
│  │  • React Router                                        │ │
│  │  • Chart.js Visualizations                            │ │
│  │  • Socket.IO Client                                   │ │
│  │  • Axios HTTP Client                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  URL: https://threattrace-yourname.vercel.app               │
│  Cost: FREE ✅                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ API Calls (REST + WebSocket)
                           │ CORS: Allowed
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDER (Backend API Server)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Flask Application (Python 3.11)                │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  API Routes                                      │ │ │
│  │  │  • /api/auth      - Authentication              │ │ │
│  │  │  • /api/ransomware - File scanning              │ │ │
│  │  │  • /api/audit     - File integrity              │ │ │
│  │  │  • /api/logs      - System logs                 │ │ │
│  │  │  • /api/alerts    - Alert management            │ │ │
│  │  │  • /api/reports   - Report generation           │ │ │
│  │  │  • /api/dashboard - Dashboard data              │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Real-time Layer                                 │ │ │
│  │  │  • Flask-SocketIO                                │ │ │
│  │  │  • Eventlet (WSGI Server)                        │ │ │
│  │  │  • Gunicorn (Production Server)                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Background Tasks                                 │ │ │
│  │  │  • APScheduler                                    │ │ │
│  │  │  • File integrity scans                           │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Security                                         │ │ │
│  │  │  • JWT Authentication                             │ │ │
│  │  │  • Bcrypt Password Hashing                        │ │ │
│  │  │  • CORS Protection                                │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  URL: https://threattrace-backend.onrender.com              │
│  Cost: FREE ✅ (750 hours/month)                            │
│  Limitation: Sleeps after 15 min inactivity ⚠️              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Database Queries
                           │ Connection String
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            MONGODB ATLAS (Database)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              M0 Free Tier Cluster                      │ │
│  │                                                        │ │
│  │  Collections:                                          │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  • users         - User accounts                 │ │ │
│  │  │  • logs          - System/scan logs              │ │ │
│  │  │  • alerts        - Security alerts               │ │ │
│  │  │  • audit_files   - File integrity records        │ │ │
│  │  │  • reports       - Generated reports             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  Features:                                             │ │
│  │  • Automatic Backups                                   │ │
│  │  • High Availability (3 replicas)                      │ │
│  │  • Encryption at Rest                                  │ │
│  │  • Network Security (IP Whitelist)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Storage: 512MB                                              │
│  Cost: FREE ✅                                              │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              OPTIONAL: EMAIL SERVICE                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Gmail SMTP (App Password)                      │ │
│  │  • Password reset emails                               │ │
│  │  • Alert notifications                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Cost: FREE ✅                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User → Frontend (Vercel)
       ↓
       POST /api/auth/login
       ↓
Backend (Render) → Verify credentials
       ↓
       Query users collection
       ↓
MongoDB Atlas
       ↓
       Return user data
       ↓
Backend → Generate JWT token
       ↓
Frontend ← Token stored in localStorage
```

### 2. File Scan Flow
```
User uploads file → Frontend
       ↓
       POST /api/ransomware/upload
       ↓
Backend receives file
       ↓
       ML model analyzes file
       ↓
       Save scan log to MongoDB
       ↓
       Emit real-time alert via Socket.IO
       ↓
Frontend receives WebSocket event
       ↓
       Update UI with scan results
```

### 3. Real-time Alert Flow
```
Backend detects threat
       ↓
       Emit Socket.IO event
       ↓
       ┌─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
   Frontend 1       Frontend 2       Frontend N
   (Connected)      (Connected)      (Connected)
       ↓                 ▼                 ↓
   Update UI        Update UI        Update UI
   Show toast       Show toast       Show toast
```

## Environment Variables Flow

### Development (Local)
```
Frontend (.env.local)
VITE_API_BASE=http://127.0.0.1:5000

Backend (.env)
MONGO_URI=mongodb://localhost:27017/threattrace
DEBUG=True
SECRET_KEY=dev-secret
```

### Production (Cloud)
```
Frontend (Vercel Environment Variables)
VITE_API_BASE=https://threattrace-backend.onrender.com

Backend (Render Environment Variables)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/threattrace
DEBUG=False
SECRET_KEY=<random-generated>
JWT_SECRET_KEY=<random-generated>
FRONTEND_URL=https://threattrace-yourname.vercel.app
```

## Request Flow Details

### HTTP REST API Request
```
1. Frontend makes axios call:
   axios.post('${API_ROOT}/api/ransomware/upload', formData)

2. Browser sends HTTPS request:
   https://threattrace-backend.onrender.com/api/ransomware/upload

3. Render routes to Flask app:
   Gunicorn → Flask → Blueprint route handler

4. Backend processes request:
   • Validate JWT token
   • Process file upload
   • Run ML detection
   • Save to MongoDB

5. Return JSON response:
   { status: "success", result: {...} }

6. Frontend receives response:
   • Update state
   • Show UI feedback
```

### WebSocket Real-time Request
```
1. Frontend connects on mount:
   const socket = io(API_ROOT)

2. Persistent WebSocket connection established:
   wss://threattrace-backend.onrender.com/socket.io

3. Backend detects threat:
   socketio.emit('new_alert', alert_data)

4. All connected clients receive event instantly:
   socket.on('new_alert', (data) => {
     // Update UI
   })

5. No polling needed - push-based updates
```

## Scaling Considerations

### Current Free Tier Limits
| Resource | Limit | What Happens When Exceeded |
|----------|-------|----------------------------|
| Render RAM | 512MB | App may crash/restart |
| Render CPU | Shared | Slower response times |
| MongoDB Storage | 512MB | Need to upgrade to paid tier |
| Render Sleep | After 15min | 30s cold start on next request |
| Vercel Bandwidth | 100GB/month | Very unlikely to hit for portfolio |

### Future Scaling Path (If needed)
```
1. Starter (Current): Free
   → 100 concurrent users
   → ~1,000 requests/day

2. Small ($7/month Render + Free MongoDB):
   → 1,000 concurrent users
   → No sleep
   → ~10,000 requests/day

3. Medium ($64/month total):
   → 10,000+ concurrent users
   → Dedicated resources
   → Auto-scaling
   → Custom domain

4. Enterprise (Custom pricing):
   → Load balancing
   → Multiple regions
   → Database sharding
   → Microservices architecture
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Transport Layer Security (TLS)                           │
│     • HTTPS everywhere (Vercel + Render auto-provision)     │
│     • WSS (WebSocket Secure)                                │
│                                                              │
│  2. Authentication & Authorization                           │
│     • JWT tokens with expiration                            │
│     • Bcrypt password hashing (10 rounds)                   │
│     • Token refresh mechanism                               │
│                                                              │
│  3. Network Security                                         │
│     • CORS configured for specific origins                  │
│     • MongoDB IP whitelist                                  │
│     • Render automatic DDoS protection                      │
│                                                              │
│  4. Application Security                                     │
│     • Input validation                                      │
│     • File upload size limits                               │
│     • SQL injection prevention (using PyMongo ORM)          │
│     • XSS protection (React auto-escapes)                   │
│                                                              │
│  5. Data Security                                            │
│     • Passwords never stored in plain text                  │
│     • Sensitive env vars in secure storage                  │
│     • MongoDB encryption at rest                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Frontend (Vercel)
- ✅ Code splitting (React.lazy + Suspense)
- ✅ Tree shaking (Vite production build)
- ✅ Minification (Terser)
- ✅ CDN distribution (Vercel Edge Network)
- ✅ Brotli compression
- ✅ Cached static assets (1 year)

### Backend (Render)
- ✅ Gunicorn with Eventlet workers
- ✅ Connection pooling for MongoDB
- ✅ APScheduler for background tasks
- ⚠️ No Redis caching (add if needed)
- ⚠️ No CDN for API responses

### Database (MongoDB Atlas)
- ✅ Indexes on frequently queried fields
- ✅ Connection string with retryWrites
- ✅ Read preference: primary
- ⚠️ No query result caching

## Monitoring & Observability

### What's Available (Free)
1. **Render Dashboard**:
   - CPU/RAM usage
   - Request logs
   - Deployment history
   - Health checks

2. **Vercel Analytics**:
   - Page views
   - Response times
   - Geographic distribution
   - Build logs

3. **MongoDB Atlas**:
   - Query performance
   - Database size
   - Connection stats
   - Slow query logs

### What You Can Add (Free)
1. **UptimeRobot**:
   - Ping backend every 5 minutes
   - Email alerts on downtime
   - Prevents sleep

2. **Sentry** (Free tier):
   - Error tracking
   - Performance monitoring
   - 5,000 events/month

3. **Google Analytics**:
   - User behavior tracking
   - Conversion funnels

## Deployment Pipeline

```
Local Development
       ↓
   Git Commit
       ↓
   Git Push to GitHub
       ↓
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
   Vercel             Render          (MongoDB Atlas)
   detects push       detects push     (Always running)
       ↓                 ↓
   Auto-build         Auto-build
   • npm install      • pip install
   • npm run build    • gunicorn start
       ↓                 ▼
   Auto-deploy        Auto-deploy
   • Deploy to CDN    • Restart service
       ↓                 ▼
   Live in ~30s       Live in ~2min
       ↓                 ▼
   ✅ Frontend        ✅ Backend
   updated            updated
```

---

## Summary

**Total Cost**: $0/month
**Deployment Time**: ~25 minutes
**Maintenance**: Auto-updates on git push
**Uptime**: 99.9%* (*with UptimeRobot to prevent sleep)

Perfect for a portfolio project! 🎉
