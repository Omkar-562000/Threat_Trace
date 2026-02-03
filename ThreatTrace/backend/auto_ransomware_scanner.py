# backend/auto_ransomware_scanner.py
"""
====================================================================
         ThreatTrace — Auto-Discovery Ransomware Scanner
====================================================================

Automatically scans configured directories for suspicious files:
- Runs on a scheduled interval
- Detects high-entropy files (potential encryption)
- Checks suspicious extensions (.lock, .enc, etc.)
- Sends real-time alerts via WebSocket
- Logs all detections to MongoDB

Usage:
    python auto_ransomware_scanner.py

Or run as a Windows service (see service_wrapper.py)
"""

import os
import sys
import time
import math
import requests
import traceback
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from automation_config import (
    RANSOMWARE_WATCH_DIRS,
    RANSOMWARE_SCAN_INTERVAL,
    RANSOMWARE_SCAN_EXTENSIONS,
    RANSOMWARE_MAX_FILE_SIZE_MB,
    RANSOMWARE_SKIP_RECENTLY_MODIFIED,
    MAX_FILES_PER_SCAN,
    MAX_CONCURRENT_WORKERS,
    OPERATION_SLEEP_TIME,
    BACKEND_API_URL,
    AUTOMATION_DEBUG,
    get_valid_watch_dirs
)


# ============================================================
# ENTROPY CALCULATION (Shannon Entropy)
# ============================================================

def calculate_entropy(data: bytes) -> float:
    """Calculate Shannon entropy of data (0-8 scale)"""
    if not data:
        return 0.0
    
    freq = [0] * 256
    for b in data:
        freq[b] += 1
    
    entropy = 0.0
    length = len(data)
    
    for count in freq:
        if count == 0:
            continue
        p = count / length
        entropy -= p * math.log2(p)
    
    return entropy


# ============================================================
# FILE SCANNER
# ============================================================

def scan_single_file(file_path: str) -> dict:
    """
    Scan a single file for ransomware indicators.
    Returns analysis result dict.
    """
    SUSPICIOUS_EXTENSIONS = {".lock", ".enc", ".crypt", ".ransom", ".encrypted"}
    
    result = {
        "path": str(file_path),
        "suspicious": False,
        "reason": [],
        "entropy": 0.0,
        "scanned_at": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        p = Path(file_path)
        
        # Check if file still exists
        if not p.exists():
            result["reason"].append("File disappeared during scan")
            return result
        
        # Check file size
        size_mb = p.stat().st_size / (1024 * 1024)
        if size_mb > RANSOMWARE_MAX_FILE_SIZE_MB:
            if AUTOMATION_DEBUG:
                print(f"  ⏭ Skipping (too large): {p.name} ({size_mb:.1f}MB)")
            return None  # Skip file
        
        # Check if recently modified (might still be writing)
        mod_time = p.stat().st_mtime
        if time.time() - mod_time < RANSOMWARE_SKIP_RECENTLY_MODIFIED:
            if AUTOMATION_DEBUG:
                print(f"  ⏭ Skipping (recently modified): {p.name}")
            return None  # Skip file
        
        # Check extension
        ext = p.suffix.lower()
        if ext in SUSPICIOUS_EXTENSIONS:
            result["suspicious"] = True
            result["reason"].append(f"Suspicious extension: {ext}")
        
        # Calculate entropy (read first 64KB for performance)
        with p.open("rb") as fh:
            sample = fh.read(64 * 1024)
            if sample:
                entropy = calculate_entropy(sample)
                result["entropy"] = round(entropy, 3)
                
                # High entropy = potential encryption
                if entropy >= 7.5:
                    result["suspicious"] = True
                    result["reason"].append(f"High entropy ({entropy:.2f}/8.0) - possibly encrypted")
        
        if result["suspicious"]:
            print(f"  🚨 SUSPICIOUS: {p.name} | Entropy: {result['entropy']} | Reasons: {', '.join(result['reason'])}")
        
        return result
        
    except PermissionError:
        if AUTOMATION_DEBUG:
            print(f"  ⏭ Permission denied: {file_path}")
        return None
    except Exception as e:
        if AUTOMATION_DEBUG:
            print(f"  ❌ Error scanning {file_path}: {e}")
        return None


# ============================================================
# DIRECTORY SCANNER
# ============================================================

def scan_directory(directory: str) -> list:
    """
    Recursively scan directory for suspicious files.
    Returns list of scan results.
    """
    print(f"\n📂 Scanning directory: {directory}")
    
    results = []
    file_count = 0
    
    try:
        p = Path(directory)
        
        # Get all files (recursive)
        all_files = []
        
        for root, dirs, files in os.walk(p):
            # Skip system/hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['$RECYCLE.BIN', 'System Volume Information']]
            
            for file in files:
                file_path = Path(root) / file
                
                # Filter by extension (if configured)
                if RANSOMWARE_SCAN_EXTENSIONS:
                    if file_path.suffix.lower() not in RANSOMWARE_SCAN_EXTENSIONS:
                        continue
                
                all_files.append(str(file_path))
                file_count += 1
                
                # Respect file limit
                if file_count >= MAX_FILES_PER_SCAN:
                    print(f"  ⚠ Reached file limit ({MAX_FILES_PER_SCAN}), stopping scan")
                    break
            
            if file_count >= MAX_FILES_PER_SCAN:
                break
        
        print(f"  📊 Found {len(all_files)} files to scan")
        
        # Scan files concurrently
        with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_WORKERS) as executor:
            futures = {executor.submit(scan_single_file, f): f for f in all_files}
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result:  # Skip None results (errors, skipped files)
                        results.append(result)
                    
                    # Small sleep to avoid CPU overload
                    time.sleep(OPERATION_SLEEP_TIME)
                    
                except Exception as e:
                    if AUTOMATION_DEBUG:
                        print(f"  ❌ Future error: {e}")
        
        print(f"  ✅ Scanned {len(results)} files successfully")
        
    except Exception as e:
        print(f"  ❌ Directory scan error: {e}")
        traceback.print_exc()
    
    return results


# ============================================================
# SEND RESULTS TO BACKEND
# ============================================================

def send_scan_result(result: dict):
    """Send scan result to backend API"""
    try:
        # Only send suspicious files to avoid DB bloat
        if not result.get("suspicious"):
            return
        
        url = f"{BACKEND_API_URL}/api/ransomware/scan"
        
        payload = {
            "file_path": result["path"]
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code in [200, 201]:
            if AUTOMATION_DEBUG:
                print(f"  ✅ Sent alert for: {Path(result['path']).name}")
        else:
            print(f"  ⚠ Backend returned {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Cannot connect to backend at {BACKEND_API_URL}")
    except Exception as e:
        print(f"  ❌ Error sending result: {e}")


# ============================================================
# MAIN SCAN LOOP
# ============================================================

def run_scanner():
    """Main scanner loop - runs continuously"""
    
    print("\n" + "="*70)
    print("   🛡️  ThreatTrace Auto-Ransomware Scanner Started")
    print("="*70)
    print(f"   Backend API: {BACKEND_API_URL}")
    print(f"   Scan Interval: {RANSOMWARE_SCAN_INTERVAL}s")
    print(f"   Max File Size: {RANSOMWARE_MAX_FILE_SIZE_MB}MB")
    print("="*70 + "\n")
    
    # Get valid directories
    watch_dirs = get_valid_watch_dirs()
    
    if not watch_dirs:
        print("❌ No valid directories to watch! Check automation_config.py")
        return
    
    print(f"📁 Watching {len(watch_dirs)} directories:")
    for d in watch_dirs:
        print(f"   - {d}")
    print()
    
    scan_count = 0
    
    try:
        while True:
            scan_count += 1
            start_time = time.time()
            
            print(f"\n{'='*70}")
            print(f"🔍 Starting Scan Cycle #{scan_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*70}")
            
            all_results = []
            
            # Scan each directory
            for directory in watch_dirs:
                results = scan_directory(directory)
                all_results.extend(results)
            
            # Send suspicious files to backend
            suspicious_count = sum(1 for r in all_results if r.get("suspicious"))
            
            if suspicious_count > 0:
                print(f"\n🚨 Found {suspicious_count} SUSPICIOUS files!")
                
                for result in all_results:
                    if result.get("suspicious"):
                        send_scan_result(result)
            
            # Broadcast stats update via WebSocket
            try:
                stats_payload = {
                    "event": "stats_update",
                    "data": {
                        "files_scanned": len(all_results),
                        "suspicious_files": suspicious_count,
                        "last_scan": datetime.utcnow().isoformat()
                    }
                }
                requests.post(f"{BACKEND_API_URL}/api/dashboard/broadcast", json=stats_payload, timeout=5)
                
                # Also send activity update
                activity_payload = {
                    "event": "activity_update",
                    "data": {
                        "id": f"scan-{datetime.utcnow().timestamp()}",
                        "timestamp": datetime.utcnow().isoformat(),
                        "type": "scan",
                        "severity": "critical" if suspicious_count > 0 else "info",
                        "message": f"Scan completed: {suspicious_count} suspicious file(s) found" if suspicious_count > 0 else f"Scan completed: {len(all_results)} files checked - all clean",
                        "details": f"Scanned {len(all_results)} files",
                        "source": "Auto Ransomware Scanner"
                    }
                }
                requests.post(f"{BACKEND_API_URL}/api/dashboard/broadcast", json=activity_payload, timeout=5)
            except Exception as e:
                if AUTOMATION_DEBUG:
                    print(f"  ⚠ Failed to broadcast stats: {e}")
            else:
                print(f"\n✅ No suspicious files detected")
            
            # Summary
            elapsed = time.time() - start_time
            print(f"\n📊 Scan Summary:")
            print(f"   - Total files scanned: {len(all_results)}")
            print(f"   - Suspicious files: {suspicious_count}")
            print(f"   - Time taken: {elapsed:.2f}s")
            
            # Wait for next scan
            print(f"\n⏳ Next scan in {RANSOMWARE_SCAN_INTERVAL}s...")
            print(f"{'='*70}\n")
            
            time.sleep(RANSOMWARE_SCAN_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Scanner stopped by user (Ctrl+C)")
    except Exception as e:
        print(f"\n❌ Fatal error in scanner: {e}")
        traceback.print_exc()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    run_scanner()
