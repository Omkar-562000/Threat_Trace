# backend/automation_runner.py
"""
====================================================================
         ThreatTrace — Master Automation Runner
====================================================================

Runs all automation components in separate threads:
- Auto-Discovery Ransomware Scanner
- Windows Event Log Collector
- (File registration runs separately - one-time setup)

Usage:
    python automation_runner.py

    # Or run specific components:
    python automation_runner.py --ransomware-only
    python automation_runner.py --eventlog-only

This script keeps all automation running in the background.
Press Ctrl+C to stop all components gracefully.
"""

import sys
import threading
import argparse
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from automation_config import (
    ENABLE_WINDOWS_EVENTLOG,
    AUTOMATION_DEBUG
)


# ============================================================
# COMPONENT RUNNERS (in separate threads)
# ============================================================

def run_ransomware_scanner_thread():
    """Run ransomware scanner in thread"""
    try:
        from auto_ransomware_scanner import run_scanner
        run_scanner()
    except Exception as e:
        print(f"❌ Ransomware scanner thread error: {e}")


def run_eventlog_collector_thread():
    """Run Windows event log collector in thread"""
    try:
        from auto_windows_eventlog import run_collector
        run_collector()
    except Exception as e:
        print(f"❌ Event log collector thread error: {e}")


# ============================================================
# MAIN RUNNER
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="ThreatTrace Master Automation Runner"
    )
    parser.add_argument(
        "--ransomware-only",
        action="store_true",
        help="Run only the ransomware scanner"
    )
    parser.add_argument(
        "--eventlog-only",
        action="store_true",
        help="Run only the Windows event log collector"
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print("   🚀 ThreatTrace Master Automation Runner")
    print("="*70 + "\n")
    
    threads = []
    
    # Determine which components to run
    run_ransomware = not args.eventlog_only
    run_eventlog = not args.ransomware_only and ENABLE_WINDOWS_EVENTLOG
    
    # Start ransomware scanner
    if run_ransomware:
        print("🦠 Starting Ransomware Auto-Scanner...")
        t = threading.Thread(
            target=run_ransomware_scanner_thread,
            daemon=True,
            name="RansomwareScanner"
        )
        t.start()
        threads.append(t)
        time.sleep(1)  # Small delay for clean output
    
    # Start Windows event log collector
    if run_eventlog:
        print("📋 Starting Windows Event Log Collector...")
        t = threading.Thread(
            target=run_eventlog_collector_thread,
            daemon=True,
            name="EventLogCollector"
        )
        t.start()
        threads.append(t)
        time.sleep(1)
    elif not args.eventlog_only:
        print("⚠️  Windows Event Log collection disabled in config")
    
    if not threads:
        print("❌ No automation components enabled!")
        print("   Check automation_config.py")
        return
    
    print(f"\n✅ {len(threads)} automation component(s) running")
    print("   Press Ctrl+C to stop all components\n")
    print("="*70 + "\n")
    
    # Keep main thread alive
    reported_stopped = set()
    try:
        while True:
            # Check if threads are still alive
            alive = [t for t in threads if t.is_alive()]
            
            if len(alive) < len(threads):
                newly_stopped = [t.name for t in threads if not t.is_alive() and t.name not in reported_stopped]
                if newly_stopped:
                    print("\nWARNING: Some threads have stopped!")
                    for name in newly_stopped:
                        print(f"   - {name} is not running")
                        reported_stopped.add(name)
            else:
                reported_stopped.clear()
            
            time.sleep(10)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Stopping all automation components...")
        print("   Waiting for threads to finish...")
        
        # Wait for all threads to finish (with timeout)
        for t in threads:
            t.join(timeout=5)
        
        print("✅ All automation components stopped\n")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
