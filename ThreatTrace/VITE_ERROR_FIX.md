# 🔧 Vite Error Fix - "vite is not recognized"

## Problem
```
'vite' is not recognized as an internal or external command
```

## Root Cause
- The `node_modules` folder was corrupted or incomplete
- `devDependencies` (vite and @vitejs/plugin-react) weren't installed properly
- Previous npm install didn't complete successfully

## Solution Applied

### Complete Clean Reinstall:
```powershell
cd ThreatTrace/frontend

# 1. Remove corrupted node_modules
Remove-Item -Recurse -Force node_modules

# 2. Remove package-lock.json
Remove-Item package-lock.json

# 3. Clean npm cache
npm cache clean --force

# 4. Fresh install of all dependencies
npm install
```

### This installs:
- ✅ All dependencies from `dependencies` section
- ✅ All devDependencies including **vite** and **@vitejs/plugin-react**
- ✅ Proper .bin executables for vite

## Verification

After install completes, verify vite is installed:
```powershell
Test-Path node_modules\.bin\vite.cmd  # Should return True
```

## Running the Dev Server

Once verified, start the development server:
```powershell
npm run dev
```

Should see:
```
VITE v5.x.x ready in XXXms

➜  Local:   http://localhost:5173/
➜  Network: http://172.20.10.3:5173/
```

## Alternative Fix (If Above Doesn't Work)

If the problem persists, install vite globally:
```powershell
npm install -g vite
```

Then update package.json scripts to use global vite:
```json
{
  "scripts": {
    "dev": "vite",    // This will use global vite
    ...
  }
}
```

## Status
⏳ **Currently Running:** Complete clean reinstall  
⏳ **Expected Duration:** 2-3 minutes  
✅ **Backend:** Running perfectly at http://127.0.0.1:5000  
⏳ **Frontend:** Will start after install completes  

---

*Fix is in progress - frontend will be ready shortly!*
