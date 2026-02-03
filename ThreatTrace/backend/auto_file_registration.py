# backend/auto_file_registration.py
"""
====================================================================
      ThreatTrace — Auto File Integrity Registration
====================================================================

Automatically registers critical files for integrity monitoring:
- Scans configured files and directories
- Registers them with the audit system
- Backend scheduler will automatically verify them periodically

This only needs to run ONCE to register files.
After registration, the backend scheduler handles verification.

Usage:
    python auto_file_registration.py

    # Or with options:
    python auto_file_registration.py --force  # Re-register even if already registered
"""

import sys
import os
import argparse
import requests
import traceback
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from automation_config import (
    AUTO_REGISTER_FILES,
    AUTO_REGISTER_DIRS,
    AUTO_REGISTER_EXTENSIONS,
    BACKEND_API_URL,
    AUTOMATION_DEBUG,
    get_valid_auto_register_files
)


# ============================================================
# FILE REGISTRATION
# ============================================================

def register_file(file_path: str, force: bool = False) -> bool:
    """
    Register a single file with the audit system.
    Returns True if successful, False otherwise.
    """
    try:
        url = f"{BACKEND_API_URL}/api/audit/verify-path"
        
        payload = {
            "log_path": file_path
        }
        
        response = requests.post(url, json=payload, timeout=15)
        
        if response.status_code in [200, 201]:
            data = response.json()
            
            if data.get("tampered"):
                print(f"  ⚠️  REGISTERED (already modified): {Path(file_path).name}")
            else:
                print(f"  ✅ REGISTERED: {Path(file_path).name}")
            
            return True
        else:
            print(f"  ❌ Failed ({response.status_code}): {Path(file_path).name}")
            if AUTOMATION_DEBUG:
                print(f"     Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Cannot connect to backend at {BACKEND_API_URL}")
        return False
    except Exception as e:
        print(f"  ❌ Error registering {Path(file_path).name}: {e}")
        if AUTOMATION_DEBUG:
            traceback.print_exc()
        return False


# ============================================================
# DIRECTORY SCANNER
# ============================================================

def scan_and_register_directory(directory: str, extensions: list) -> tuple:
    """
    Scan directory and register all matching files.
    Returns (successful, failed) counts.
    """
    print(f"\n📂 Scanning directory: {directory}")
    
    successful = 0
    failed = 0
    
    try:
        p = Path(directory)
        
        if not p.exists() or not p.is_dir():
            print(f"  ⚠️  Directory does not exist or is not accessible")
            return (0, 0)
        
        # Get all files matching extensions
        files_to_register = []
        
        for ext in extensions:
            pattern = f"**/*{ext}" if ext.startswith('.') else f"**/*.{ext}"
            matching = list(p.glob(pattern))
            files_to_register.extend(matching)
        
        # Remove duplicates
        files_to_register = list(set(files_to_register))
        
        print(f"  📊 Found {len(files_to_register)} files to register")
        
        # Register each file
        for file_path in files_to_register:
            if register_file(str(file_path)):
                successful += 1
            else:
                failed += 1
        
    except Exception as e:
        print(f"  ❌ Directory scan error: {e}")
        if AUTOMATION_DEBUG:
            traceback.print_exc()
    
    return (successful, failed)


# ============================================================
# MAIN REGISTRATION PROCESS
# ============================================================

def run_registration(force: bool = False):
    """Main registration process"""
    
    print("\n" + "="*70)
    print("   🔒 ThreatTrace Auto File Registration")
    print("="*70)
    print(f"   Backend API: {BACKEND_API_URL}")
    print(f"   Force Re-registration: {force}")
    print("="*70 + "\n")
    
    total_successful = 0
    total_failed = 0
    
    # ========================================
    # 1️⃣ Register Individual Files
    # ========================================
    
    valid_files = get_valid_auto_register_files()
    
    if valid_files:
        print(f"📄 Registering {len(valid_files)} individual files:\n")
        
        for file_path in valid_files:
            if register_file(file_path, force):
                total_successful += 1
            else:
                total_failed += 1
    else:
        print("ℹ️  No individual files configured for registration\n")
    
    # ========================================
    # 2️⃣ Register Files from Directories
    # ========================================
    
    if AUTO_REGISTER_DIRS:
        print(f"\n📁 Registering files from {len(AUTO_REGISTER_DIRS)} directories:")
        print(f"   Extensions: {', '.join(AUTO_REGISTER_EXTENSIONS)}\n")
        
        for directory in AUTO_REGISTER_DIRS:
            p = Path(directory)
            
            if not p.exists():
                print(f"  ⚠️  Directory not found: {directory}")
                continue
            
            successful, failed = scan_and_register_directory(
                directory,
                AUTO_REGISTER_EXTENSIONS
            )
            
            total_successful += successful
            total_failed += failed
    else:
        print("\nℹ️  No directories configured for registration\n")
    
    # ========================================
    # 3️⃣ Summary
    # ========================================
    
    print("\n" + "="*70)
    print("   📊 Registration Summary")
    print("="*70)
    print(f"   ✅ Successfully registered: {total_successful}")
    print(f"   ❌ Failed: {total_failed}")
    print(f"   📈 Total: {total_successful + total_failed}")
    print("="*70)
    
    if total_successful > 0:
        print("\n✅ Files registered successfully!")
        print("   The backend scheduler will now automatically check these files")
        print(f"   for tampering every few minutes.\n")
    else:
        print("\n⚠️  No files were registered!")
        print("   Check automation_config.py to configure files to monitor.\n")
    
    return total_successful, total_failed


# ============================================================
# CHECK BACKEND CONNECTIVITY
# ============================================================

def check_backend():
    """Check if backend is running and accessible"""
    print("🔍 Checking backend connectivity...")
    
    try:
        response = requests.get(f"{BACKEND_API_URL}/", timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Backend is running at {BACKEND_API_URL}\n")
            return True
        else:
            print(f"⚠️  Backend returned status {response.status_code}\n")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {BACKEND_API_URL}")
        print("   Make sure the backend is running:\n")
        print("   cd ThreatTrace/backend")
        print("   python app.py\n")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}\n")
        return False


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ThreatTrace Auto File Registration")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-registration even if files are already registered"
    )
    
    args = parser.parse_args()
    
    # Check backend first
    if not check_backend():
        sys.exit(1)
    
    # Run registration
    try:
        successful, failed = run_registration(force=args.force)
        
        if failed > 0:
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Registration stopped by user (Ctrl+C)")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        traceback.print_exc()
        sys.exit(1)
