# Role-Based Access Control (RBAC) Implementation Guide

## Overview

ThreatTrace now supports three user roles with different access levels:

1. **Personal** - Individual users with basic features
2. **Corporate** - Big firms/enterprises with advanced features
3. **Technical** - IT/Security professionals with full access

---

## Backend Implementation

### 1. Role Validation in Routes

Use the `@role_required()` decorator to protect endpoints:

```python
from utils.role_guard import role_required

# Only Corporate and Technical users can export
@audit_bp.route("/export/csv", methods=["GET"])
@role_required("corporate", "technical")
def export_csv():
    # ... export logic
    pass

# Only Technical users can access scheduler
@scheduler_bp.route("/start", methods=["POST"])
@role_required("technical")
def start_scheduler():
    # ... scheduler logic
    pass
```

### 2. Available Roles

- `personal` - Basic access
- `corporate` - Advanced access (includes export features)
- `technical` - Full access (includes API and scheduler)

---

## Frontend Implementation

### 1. Import Role Utilities

```javascript
import { 
  getUserRole, 
  hasRole, 
  isPersonal, 
  isCorporate, 
  isTechnical,
  getRoleDisplayName,
  getRoleBadgeColor 
} from "../utils/role";
```

### 2. Conditional Rendering Based on Role

#### Example 1: Hide/Show Features

```jsx
import { isCorporate, isTechnical } from "../utils/role";

export default function AuditPage() {
  return (
    <div>
      {/* All users see this */}
      <AuditHistory />

      {/* Only Corporate and Technical users see export buttons */}
      {(isCorporate() || isTechnical()) && (
        <div>
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={exportPDF}>Export PDF</button>
        </div>
      )}
    </div>
  );
}
```

#### Example 2: Using hasRole()

```jsx
import { hasRole } from "../utils/role";

export default function SchedulerPage() {
  if (!hasRole(["technical"])) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400">
          ⚠️ Technical account required for scheduler access
        </p>
      </div>
    );
  }

  return <SchedulerDashboard />;
}
```

### 3. Display Role Badge

```jsx
import { getRoleDisplayName, getRoleBadgeColor } from "../utils/role";

export default function UserProfile() {
  const roleName = getRoleDisplayName();
  const badgeColor = getRoleBadgeColor();

  return (
    <span className={`px-3 py-1 rounded-full text-sm border ${badgeColor}`}>
      {roleName}
    </span>
  );
}
```

---

## Feature Access Matrix

| Feature | Personal | Corporate | Technical |
|---------|----------|-----------|-----------|
| Basic Threat Monitoring | ✅ | ✅ | ✅ |
| File Integrity Checks | ✅ | ✅ | ✅ |
| Real-time Alerts | ✅ | ✅ | ✅ |
| System Logs | ✅ | ✅ | ✅ |
| Export Reports (CSV/PDF) | ❌ | ✅ | ✅ |
| Scheduled Scans | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Custom Rules | ❌ | ❌ | ✅ |
| Scheduler Control | ❌ | ❌ | ✅ |

---

## Quick Implementation Checklist

### For Backend Routes:
- [ ] Add `@role_required("corporate", "technical")` to export endpoints
- [ ] Add `@role_required("technical")` to scheduler endpoints
- [ ] Add `@role_required("technical")` to advanced API endpoints

### For Frontend Pages:
- [ ] Import role utilities from `utils/role.js`
- [ ] Add conditional rendering for premium features
- [ ] Show upgrade prompts for restricted features
- [ ] Display role badge in user profile/settings

---

## Example: Protecting Audit Export

**Backend** (`audit_routes.py`):
```python
@audit_bp.route("/export/csv", methods=["GET"])
@role_required("corporate", "technical")
def export_csv():
    # ... existing export logic
    pass
```

**Frontend** (`Audit.jsx`):
```jsx
import { hasRole } from "../utils/role";

export default function Audit() {
  const canExport = hasRole(["corporate", "technical"]);

  return (
    <div>
      {canExport ? (
        <button onClick={handleExport}>Export CSV</button>
      ) : (
        <div className="text-gray-400 text-sm">
          <span>📦 Export available for Corporate & Technical users</span>
        </div>
      )}
    </div>
  );
}
```

---

## Testing

1. **Create accounts with different roles:**
   - Sign up as Personal user
   - Sign up as Corporate user
   - Sign up as Technical user

2. **Test access levels:**
   - Try exporting reports with each role
   - Try accessing scheduler with each role
   - Verify appropriate error messages

3. **Check JWT tokens:**
   - Login and inspect token in browser DevTools
   - Verify `role` field is included in JWT payload

---

## Notes

- Roles are assigned during signup and stored in MongoDB
- Role is included in JWT token for authentication
- Frontend role checks are for UX only - backend always validates
- Always use backend `@role_required()` decorator for security
