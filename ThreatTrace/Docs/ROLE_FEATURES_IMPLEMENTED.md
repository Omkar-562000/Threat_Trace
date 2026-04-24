# ✅ Role-Based Access Control - Implementation Complete

## 🎯 Overview

ThreatTrace now has **fully functional role-based access control** with three tiers. Features are restricted both on the **backend** (API protection) and **frontend** (UI visibility).

---

## 🔐 Role Tiers

### 1️⃣ Personal (Individual Users)
**Target:** Home users, individuals, small-scale monitoring

**Access:**
- ✅ Basic dashboard analytics
- ✅ File integrity monitoring (upload & verify)
- ✅ Ransomware detection
- ✅ System logs viewing
- ✅ Real-time alerts (WebSocket)
- ❌ NO export features (CSV/PDF)
- ❌ NO scheduled scans
- ❌ NO scheduler control

### 2️⃣ Corporate (Big Firms/Enterprises)
**Target:** Companies, organizations, enterprise security teams

**Access:**
- ✅ All Personal features
- ✅ **Export audit reports (CSV)**
- ✅ **Export system logs (CSV/PDF)**
- ✅ Advanced analytics
- ✅ Historical data reports
- ❌ NO scheduler control (Technical only)

### 3️⃣ Technical (IT/Security Professionals)
**Target:** Security engineers, DevOps, system administrators

**Access:**
- ✅ All Corporate features
- ✅ **Scheduler controls** (start/stop/run automated scans)
- ✅ Full API access
- ✅ Custom automation capabilities
- ✅ Advanced threat intelligence

---

## 🛡️ Backend Protection (API Security)

All protected routes now require JWT authentication with role validation:

### Audit Routes (`audit_routes.py`)
```python
@audit_bp.route("/export/csv", methods=["GET"])
@role_required("corporate", "technical")
def export_csv():
    # Only Corporate & Technical users can export
```

### System Logs Routes (`logs_routes.py`, `system_logs_routes.py`)
```python
@logs_bp.route("/export", methods=["GET"])
@role_required("corporate", "technical")
def export_logs():
    # CSV/PDF export restricted
```

### Scheduler Routes (`scheduler_routes.py`)
```python
@scheduler_bp.route("/start", methods=["POST"])
@role_required("technical")
def start_scheduler():
    # Only Technical users can control scheduler
```

**Response for unauthorized access:**
```json
{
  "status": "error",
  "message": "Access denied: insufficient permissions"
}
```
**HTTP Status:** `403 Forbidden`

---

## 🎨 Frontend Restrictions (UI/UX)

### Audit Page (`Audit.jsx`)

**Personal Users See:**
- Basic file verification
- Upload & scan functionality
- Audit history (view only)
- 🔒 **Locked message:** "Export Feature Locked - Upgrade to Corporate or Technical"
- 🔒 **Locked message:** "Scheduler Controls Locked - Upgrade to Technical"

**Corporate Users See:**
- All Personal features
- ✅ Export Latest CSV button (in history section)
- 🔒 **Locked message:** "Scheduler Controls Locked - Upgrade to Technical"

**Technical Users See:**
- All features unlocked
- ✅ Export Latest CSV button
- ✅ Scheduler controls (start, stop, run now, interval setting)

### System Logs Page (`SystemLogs.jsx`)

**Personal Users See:**
- Log viewing with filters
- Search and filter capabilities
- Real-time log streaming
- Timeline charts
- 🔒 **Locked panel:** "Export Locked - Upgrade to Corporate or Technical"

**Corporate & Technical Users See:**
- All features unlocked
- ✅ Export CSV button
- ✅ Export PDF button

### Settings Page (`Settings.jsx`)

**All Users See:**
- Account type badge (color-coded by role)
- Feature list for their tier
- Visual indicators of what they have access to

---

## 📊 Feature Comparison Table

| Feature | Personal | Corporate | Technical |
|---------|----------|-----------|-----------|
| **Core Features** |
| Dashboard Analytics | ✅ | ✅ | ✅ |
| File Integrity Monitoring | ✅ | ✅ | ✅ |
| Ransomware Detection | ✅ | ✅ | ✅ |
| System Logs Viewing | ✅ | ✅ | ✅ |
| Real-time Alerts | ✅ | ✅ | ✅ |
| Search & Filters | ✅ | ✅ | ✅ |
| **Advanced Features** |
| Export Audit Reports (CSV) | ❌ | ✅ | ✅ |
| Export System Logs (CSV/PDF) | ❌ | ✅ | ✅ |
| Historical Reports | ❌ | ✅ | ✅ |
| **Professional Features** |
| Scheduler Control (Auto Scans) | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Custom Automation | ❌ | ❌ | ✅ |

---

## 🧪 Testing Role-Based Access

### 1. Create Test Accounts

```bash
# Open http://localhost:5173 and create 3 accounts:

1. Personal User:
   - Email: personal@test.com
   - Role: Personal - Individual User

2. Corporate User:
   - Email: corporate@test.com
   - Role: Corporate - Big Firm/Enterprise

3. Technical User:
   - Email: technical@test.com
   - Role: Technical - IT/Security Professional
```

### 2. Test Export Features

**As Personal User:**
- ❌ Try to export audit reports → See locked message
- ❌ Try to export system logs → See locked message

**As Corporate User:**
- ✅ Export audit reports (CSV) → Should work
- ✅ Export system logs (CSV/PDF) → Should work
- ❌ Access scheduler controls → See locked message

**As Technical User:**
- ✅ All exports work
- ✅ Scheduler controls accessible
- ✅ Can start/stop/run automated scans

### 3. Test Backend Protection

Try accessing protected endpoints directly (using browser dev tools or Postman):

```bash
# Without proper role - should return 403 Forbidden
GET http://127.0.0.1:5000/api/audit/export/csv?file_path=test.log
Authorization: Bearer <personal_user_token>

Response:
{
  "status": "error",
  "message": "Access denied: insufficient permissions"
}
```

---

## 🔒 Security Implementation

### JWT Token Structure
```json
{
  "identity": {
    "user_id": "507f1f77bcf86cd799439011",
    "role": "corporate"
  },
  "exp": 1234567890
}
```

### Frontend Authorization
```javascript
// utils/role.js
export const hasRole = (allowedRoles) => {
  const userRole = localStorage.getItem("role");
  return allowedRoles.includes(userRole);
};
```

### Backend Authorization
```python
# utils/role_guard.py
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            role = identity.get("role")
            
            if role not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": "Access denied: insufficient permissions"
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
```

---

## 🎨 UI Visual Indicators

### Role Badge Colors
- **Personal:** Blue (`bg-blue-500/20 text-blue-400`)
- **Corporate:** Purple (`bg-purple-500/20 text-purple-400`)
- **Technical:** Green (`bg-green-500/20 text-green-400`)

### Locked Feature Display
```jsx
<div className="glass-cyber p-4 border-2 border-yellow-500/30 bg-yellow-500/5">
  <div className="flex items-center gap-3">
    <span className="text-3xl">🔒</span>
    <div>
      <h3 className="font-semibold text-yellow-400">Feature Locked</h3>
      <p className="text-sm text-gray-400 mt-1">
        Upgrade to <span className="text-cyberPurple font-semibold">Corporate</span>
      </p>
    </div>
  </div>
</div>
```

---

## 📁 Modified Files

### Backend:
- ✅ `routes/audit_routes.py` - Added @role_required to exports
- ✅ `routes/logs_routes.py` - Protected export endpoint
- ✅ `routes/system_logs_routes.py` - Protected export endpoint
- ✅ `routes/scheduler_routes.py` - Protected all scheduler endpoints
- ✅ `routes/auth_routes.py` - Enhanced registration with role validation
- ✅ `utils/role_guard.py` - Already had the decorator (no changes)

### Frontend:
- ✅ `pages/Audit.jsx` - Added role-based UI for exports & scheduler
- ✅ `pages/SystemLogs.jsx` - Added role-based export UI
- ✅ `pages/Settings.jsx` - Shows role badge and features
- ✅ `pages/Login.jsx` - Added navigation links
- ✅ `pages/Signup.jsx` - Added role selection dropdown
- ✅ `services/auditService.js` - Added JWT tokens to protected requests
- ✅ `utils/role.js` - Created role utility functions

---

## ✅ Implementation Checklist

- [x] Backend route protection with `@role_required`
- [x] Frontend conditional rendering based on roles
- [x] JWT token validation for protected endpoints
- [x] Visual locked/unlocked indicators
- [x] Upgrade prompts for restricted features
- [x] Role badge display in Settings
- [x] Export functionality with role checks
- [x] Scheduler controls for Technical users only
- [x] Proper error messages (403 Forbidden)
- [x] Role selection during signup
- [x] Role stored in JWT and localStorage

---

## 🚀 How It Works

1. **User signs up** → Selects role (Personal/Corporate/Technical)
2. **Role stored in MongoDB** → Associated with user account
3. **User logs in** → Role included in JWT token
4. **Token stored** → localStorage on frontend
5. **Frontend checks role** → Shows/hides features dynamically
6. **Backend validates role** → On every protected API call
7. **403 response** → If user tries to access unauthorized feature

---

## 🎉 Result

ThreatTrace now has **enterprise-grade role-based access control** that:
- ✅ Protects sensitive features
- ✅ Provides clear upgrade paths
- ✅ Maintains excellent UX with visual indicators
- ✅ Enforces security on both frontend and backend
- ✅ Works seamlessly with JWT authentication

Users can now test different tiers and see exactly what features are available for each role!
