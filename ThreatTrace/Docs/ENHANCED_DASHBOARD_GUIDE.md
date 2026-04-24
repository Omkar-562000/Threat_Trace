# 🌍 ThreatTrace Enhanced Dashboard Guide

## 🎯 Overview

The Enhanced Dashboard transforms ThreatTrace into a world-class Security Operations Center (SOC) with:

- **3D Interactive Globe** - Real-time global threat visualization
- **Advanced Analytics Charts** - Comprehensive threat intelligence
- **Real-time Updates** - Auto-refresh every 30 seconds
- **Bento Grid Layout** - Modern, high-density information design
- **Live Threat Monitoring** - WebSocket-powered real-time alerts

---

## ✨ Features Implemented

### 1. **3D Global Threat Map** 🌐

**Location:** Top-left large panel (8 columns)

**Features:**
- Interactive 3D Earth globe using react-globe.gl
- Real-time threat markers from 25+ major cities worldwide
- Color-coded severity levels:
  - 🔴 **Critical** - Red (#ff0066)
  - 🟠 **High** - Orange (#ff4444)
  - 🟡 **Medium** - Yellow (#facc15)
  - 🔵 **Low** - Blue (#38bdf8)
- Animated pulsing rings for critical/high severity threats
- Hover tooltips showing:
  - City and country
  - Threat type (Ransomware, DDoS, Malware, etc.)
  - Severity level
  - Threat count
  - Threat ID
- Auto-rotating globe for cinematic effect
- Night mode Earth texture with stars background
- Interactive - Click and drag to rotate, scroll to zoom

**How It Works:**
```javascript
// Backend generates threat data from multiple global locations
GET /api/dashboard/threat-locations

// Returns geographic coordinates with threat info
{
  "lat": 40.7128,
  "lng": -74.0060,
  "city": "New York",
  "country": "USA",
  "severity": "high",
  "type": "Ransomware",
  "count": 15
}
```

---

### 2. **24-Hour Threat Trends Chart** 📈

**Location:** Middle-left panel (8 columns)

**Features:**
- Multi-line chart showing:
  - Total threats (red line)
  - Blocked threats (green line)
  - Active threats (yellow line)
- Time-series data for last 24 hours
- Smooth curves with gradient fills
- Interactive tooltips on hover
- Auto-scaling Y-axis
- Gridlines for easy reading

**Chart Technology:**
- Using Chart.js with react-chartjs-2
- Line chart with area fill
- Real-time data updates

---

### 3. **Attack Types Distribution** 🥧

**Location:** Bottom-left panel (6 columns)

**Features:**
- Doughnut chart showing threat type breakdown:
  - Ransomware
  - Malware
  - Phishing
  - DDoS
  - SQL Injection
  - Zero-Day exploits
  - APT (Advanced Persistent Threats)
  - Brute Force attacks
- Color-coded segments
- Percentage calculations
- Legend with counts
- Interactive tooltips

---

### 4. **Severity Breakdown** 📊

**Location:** Top-right panel (4 columns)

**Features:**
- Vertical bar chart
- Four severity levels with counts
- Color-matched bars:
  - Critical: Red
  - High: Orange
  - Medium: Yellow
  - Low: Blue
- Clean, minimal design

---

### 5. **Active Threats Feed** 🚨

**Location:** Right side panel (4 columns)

**Features:**
- Real-time scrolling list of top 8 threats
- Each threat card shows:
  - Threat name
  - Threat ID
  - Severity badge
  - Source (Email, Web, Network, USB, API)
  - Timestamp
  - Status (Blocked, Quarantined, Monitoring, Investigating)
- Color-coded severity badges
- Hover effects for better UX
- Custom scrollbar styling
- Auto-updates every 30 seconds

---

### 6. **System Performance Panel** ⚙️

**Location:** Bottom-right panel (6 columns)

**Features:**
- Files scanned counter
- Integrity checks counter
- Average response time
- System uptime percentage
- "All Systems Operational" status indicator
- Gradient card backgrounds
- Icon decorations

---

### 7. **Quick Stats Cards** 📌

**Location:** Top row (4 cards)

**Features:**
Four beautiful stat cards with:
- Total threats today
- Blocked attacks
- Active threats
- Global coverage (countries affected)

Each card includes:
- Large value display
- Icon
- Subtitle
- Trend indicator (up/down arrows with percentages)
- Gradient backgrounds
- Hover scale animation

---

## 🎨 Design Elements

### Bento Grid Layout

Modern card-based layout inspired by macOS and Linear app:
```
┌─────────────────┬──────┐
│   3D Globe      │Active│
│   (8 cols)      │Thread│
│                 │(4col)│
├─────────────────┼──────┤
│ Threat Trends   │Sevrt │
│   (8 cols)      │(4col)│
├─────────┬───────┴──────┤
│ Attack  │   System     │
│ Types   │   Stats      │
│ (6 col) │  (6 cols)    │
└─────────┴──────────────┘
```

### Color Palette

**Primary Colors:**
- Purple: `#a855f7` - Main accent
- Cyan: `#00eaff` - Secondary accent
- Pink: `#ec4899` - Highlights

**Severity Colors:**
- Critical: `#ff0066`
- High: `#ff4444`
- Medium: `#facc15`
- Low: `#38bdf8`

### Typography

- Headings: System font stack (San Francisco / Segoe UI)
- Body: Inter (if loaded)
- Monospace: For IDs and timestamps

### Glassmorphism

All panels use:
- `backdrop-filter: blur(15px)`
- Semi-transparent backgrounds
- Subtle borders
- Shadow effects
- Rounded corners (16px-24px)

---

## 🔌 Backend API Endpoints

### 1. Threat Locations
```http
GET /api/dashboard/threat-locations
```
Returns geographic threat data for 3D globe.

**Response:**
```json
{
  "status": "success",
  "total": 25,
  "threats": [
    {
      "id": "THR-45231",
      "lat": 40.7128,
      "lng": -74.0060,
      "city": "New York",
      "country": "USA",
      "severity": "high",
      "type": "Ransomware",
      "count": 15,
      "timestamp": "2026-01-19T12:30:00"
    }
  ]
}
```

---

### 2. Threat Trends
```http
GET /api/dashboard/threat-trends
```
Returns 24-hour time-series data.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": "10:00",
      "threats": 45,
      "blocked": 38,
      "active": 3
    }
  ]
}
```

---

### 3. Threat Types
```http
GET /api/dashboard/threat-types
```
Returns attack type distribution.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "type": "Ransomware",
      "count": 120,
      "color": "#ef4444"
    }
  ]
}
```

---

### 4. Severity Stats
```http
GET /api/dashboard/severity-stats
```
Returns severity breakdown.

**Response:**
```json
{
  "status": "success",
  "data": {
    "critical": 15,
    "high": 45,
    "medium": 68,
    "low": 32
  }
}
```

---

### 5. Dashboard Stats
```http
GET /api/dashboard/stats
```
Returns overall statistics.

**Response:**
```json
{
  "status": "success",
  "stats": {
    "total_threats_today": 350,
    "blocked_attacks": 320,
    "active_threats": 8,
    "files_scanned": 1500,
    "integrity_checks": 450,
    "countries_affected": 28,
    "avg_response_time": "1.2s",
    "uptime": "99.97%"
  }
}
```

---

### 6. Top Threats
```http
GET /api/dashboard/top-threats
```
Returns recent high-priority threats.

**Response:**
```json
{
  "status": "success",
  "threats": [
    {
      "id": "THR-12345",
      "name": "WannaCry Variant",
      "severity": "critical",
      "source": "Email",
      "timestamp": "14:32:15",
      "status": "Blocked"
    }
  ]
}
```

---

## 🔄 Real-Time Updates

### Auto-Refresh
- Dashboard data refreshes **every 30 seconds**
- Uses `setInterval` for periodic updates
- All charts and stats update automatically

### WebSocket Alerts
Connected to Socket.IO for instant notifications:
- `new_alert` - Generic security alerts
- `tamper_alert` - File integrity violations
- `ransomware_alert` - Ransomware detection

When received:
1. Toast notification appears
2. Dashboard data refreshes immediately
3. Charts update with new data

---

## 📱 Responsive Design

### Desktop (1920px+)
- Full Bento grid layout
- Globe at 600px height
- All panels visible

### Laptop (1024px - 1920px)
- Optimized column widths
- Charts maintain aspect ratio

### Tablet (768px - 1024px)
- Stacked layout
- Globe reduces to 500px
- 2-column grid for stats

### Mobile (< 768px)
- Single column layout
- Globe at 400px
- Vertical scrolling

---

## 🚀 Usage Instructions

### For End Users

1. **Login** to ThreatTrace
2. Navigate to **Dashboard** from sidebar
3. **Explore the Globe:**
   - Hover over threat markers for details
   - Drag to rotate the Earth
   - Scroll to zoom in/out
4. **Review Charts:**
   - Check 24-hour trends
   - Analyze attack type distribution
   - Monitor severity levels
5. **Monitor Active Threats:**
   - Scroll through the threat feed
   - Click on threat cards for more info (future feature)
6. **Check System Stats:**
   - Review performance metrics
   - Verify system health

### For Administrators

**Accessing Raw Data:**
```bash
# Test API endpoints
curl http://localhost:5000/api/dashboard/threat-locations
curl http://localhost:5000/api/dashboard/threat-trends
curl http://localhost:5000/api/dashboard/stats
```

**Monitoring Real-time Updates:**
- Open browser DevTools (F12)
- Go to Network tab
- Watch for periodic API calls every 30 seconds
- Monitor WebSocket connections

---

## 🎯 Testing the Enhanced Dashboard

### Quick Test Checklist

- [ ] Dashboard loads without errors
- [ ] 3D Globe renders with threat markers
- [ ] Globe rotates automatically
- [ ] Hover tooltips appear on threat markers
- [ ] All 4 stat cards display values
- [ ] Threat trends chart shows line graphs
- [ ] Attack types doughnut chart renders
- [ ] Severity bar chart displays
- [ ] Active threats list populates
- [ ] System stats panel shows metrics
- [ ] Data auto-refreshes after 30 seconds
- [ ] Real-time alerts trigger toast notifications
- [ ] No console errors
- [ ] Responsive on different screen sizes

### Manual Testing Steps

1. **Test Globe Interaction:**
   ```
   - Click and drag to rotate
   - Scroll to zoom
   - Hover over different threat markers
   - Verify tooltips show correct data
   ```

2. **Test Real-time Updates:**
   ```
   - Wait 30 seconds
   - Check if stats change
   - Verify charts update
   - Trigger a test alert from backend
   ```

3. **Test Charts:**
   ```
   - Hover over chart elements
   - Verify tooltips appear
   - Check legend items
   - Verify all data renders
   ```

4. **Test Performance:**
   ```
   - Monitor FPS in browser DevTools
   - Check memory usage
   - Verify smooth animations
   - Test on slower devices
   ```

---

## 🛠️ Customization

### Change Globe Texture
Edit `GlobeVisualization.jsx`:
```javascript
globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
// Options: earth-night.jpg, earth-blue-marble.jpg, earth-topology.png
```

### Adjust Auto-Refresh Interval
Edit `EnhancedDashboard.jsx`:
```javascript
const refreshInterval = setInterval(() => {
  fetchAllData();
}, 30000); // Change from 30000ms (30s) to desired value
```

### Modify Threat Colors
Edit `dashboard_routes.py`:
```python
threat_types = [
    {"type": "Ransomware", "count": random.randint(50, 150), "color": "#ef4444"},
    # Change colors here
]
```

### Add More Threat Locations
Edit `dashboard_routes.py` in the `get_threat_locations()` function:
```python
threat_locations = [
    # Add more cities with lat/lng coordinates
    {"lat": 35.6762, "lng": 139.6503, "city": "Tokyo", ...}
]
```

---

## 🐛 Troubleshooting

### Globe Not Rendering
**Symptoms:** Blank space where globe should be

**Solutions:**
1. Check browser console for errors
2. Verify `react-globe.gl` is installed:
   ```bash
   npm list react-globe.gl
   ```
3. Check if WebGL is supported:
   ```javascript
   // In browser console
   document.createElement('canvas').getContext('webgl')
   ```
4. Try different browser (Chrome/Edge recommended)

---

### Charts Not Displaying
**Symptoms:** Empty panels where charts should appear

**Solutions:**
1. Verify Chart.js is installed:
   ```bash
   npm list chart.js react-chartjs-2
   ```
2. Check API endpoints are returning data:
   ```bash
   curl http://localhost:5000/api/dashboard/threat-trends
   ```
3. Check browser console for errors

---

### No Data Showing
**Symptoms:** All values show as "0" or "N/A"

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://localhost:5000/api/dashboard/stats
   ```
2. Check MongoDB connection
3. Verify API routes are registered
4. Check browser Network tab for failed requests

---

### Slow Performance
**Symptoms:** Laggy animations, slow rendering

**Solutions:**
1. Reduce globe point count in backend
2. Increase auto-refresh interval
3. Disable globe auto-rotate:
   ```javascript
   globeEl.current.controls().autoRotate = false;
   ```
4. Use lower resolution globe texture
5. Close other browser tabs

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────┐
│           Frontend (React)                      │
│  ┌──────────────────────────────────────────┐  │
│  │  EnhancedDashboard.jsx                   │  │
│  │  - Fetches data from 6 API endpoints    │  │
│  │  - Updates every 30 seconds              │  │
│  │  - Listens to WebSocket alerts           │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                     ↓ HTTP Requests
┌─────────────────────────────────────────────────┐
│           Backend (Flask)                       │
│  ┌──────────────────────────────────────────┐  │
│  │  dashboard_routes.py                     │  │
│  │  - /threat-locations                     │  │
│  │  - /threat-trends                        │  │
│  │  - /threat-types                         │  │
│  │  - /severity-stats                       │  │
│  │  - /stats                                │  │
│  │  - /top-threats                          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                     ↓ Queries
┌─────────────────────────────────────────────────┐
│           Database (MongoDB)                    │
│  - Alerts collection                            │
│  - Logs collection                              │
│  - (Currently using mock data for demo)         │
└─────────────────────────────────────────────────┘
```

---

## 🎓 Technology Stack

### Frontend
- **React** - UI framework
- **react-globe.gl** - 3D globe visualization (Three.js wrapper)
- **Chart.js** - Charting library
- **react-chartjs-2** - React wrapper for Chart.js
- **Heroicons** - Icon library
- **Tailwind CSS** - Utility-first CSS (via custom classes)
- **Socket.IO Client** - Real-time WebSocket communication

### Backend
- **Flask** - Python web framework
- **Flask-SocketIO** - WebSocket support
- **MongoDB** - Database
- **Python Random** - Mock data generation (for demo)

---

## 📈 Future Enhancements

### Planned Features
1. **Drill-down Details:**
   - Click threat markers for detailed modal
   - View threat timeline
   - Access mitigation recommendations

2. **Custom Date Ranges:**
   - Filter charts by date range
   - Export historical data
   - Compare time periods

3. **Alert Configuration:**
   - Set custom alert thresholds
   - Configure email notifications
   - Create alert rules

4. **Threat Playback:**
   - Replay threat events over time
   - Animated timeline
   - Heat map mode

5. **AI Predictions:**
   - ML-based threat predictions
   - Anomaly detection visualization
   - Risk score trending

6. **Export Capabilities:**
   - Export dashboard as PDF
   - Schedule daily reports
   - Email dashboard snapshots

---

## 📚 References

- **react-globe.gl:** https://github.com/vasturiano/react-globe.gl
- **Chart.js:** https://www.chartjs.org/
- **Three.js:** https://threejs.org/
- **Socket.IO:** https://socket.io/

---

## ✅ Summary

The Enhanced Dashboard transforms ThreatTrace into a professional-grade SOC platform with:

✨ **Visual Impact:** Stunning 3D globe with real-time threat markers  
📊 **Analytics:** Comprehensive charts for threat intelligence  
⚡ **Performance:** Real-time updates every 30 seconds  
🎨 **Design:** Modern Bento grid layout with glassmorphism  
🌍 **Global:** 25+ cities with geographic threat tracking  
🔄 **Live:** WebSocket integration for instant alerts  

**Access:** Log in → Dashboard → Experience the Command Center! 🚀

---

*ThreatTrace Enhanced Dashboard - AI-Powered Global Threat Intelligence Platform*
