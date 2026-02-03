# backend/auto_windows_eventlog.py
"""
====================================================================
          ThreatTrace — Windows Event Log Collector
====================================================================

Automatically collects Windows Event Logs and sends to ThreatTrace:
- Monitors System, Application, and Security logs
- Polls for new events at configurable interval
- Sends events to backend via REST API
- Real-time streaming via WebSocket

Requirements:
    pip install pywin32

Usage:
    python auto_windows_eventlog.py

Or run as a Windows service (see service_wrapper.py)
"""

import sys
import time
import requests
import traceback
from datetime import datetime, timedelta
from pathlib import Path

# Windows-specific imports
try:
    import win32evtlog
    import win32evtlogutil
    import win32con
    WINDOWS_AVAILABLE = True
except ImportError:
    print("❌ pywin32 not installed. Run: pip install pywin32")
    WINDOWS_AVAILABLE = False

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from automation_config import (
    ENABLE_WINDOWS_EVENTLOG,
    WINDOWS_EVENTLOG_SOURCES,
    WINDOWS_EVENTLOG_POLL_INTERVAL,
    WINDOWS_EVENTLOG_TYPES,
    WINDOWS_EVENTLOG_MAX_EVENTS,
    BACKEND_API_URL,
    AUTOMATION_DEBUG
)

# Import GeoIP service
try:
    from utils.geoip_service import extract_and_geolocate_from_log
except ImportError:
    extract_and_geolocate_from_log = None
    if AUTOMATION_DEBUG:
        print("  ⚠ GeoIP service not available - location data will be skipped")


# ============================================================
# EVENT TYPE MAPPING
# ============================================================

EVENT_TYPE_MAP = {
    win32con.EVENTLOG_ERROR_TYPE: "ERROR",
    win32con.EVENTLOG_WARNING_TYPE: "WARNING",
    win32con.EVENTLOG_INFORMATION_TYPE: "INFO",
    win32con.EVENTLOG_AUDIT_SUCCESS: "INFO",
    win32con.EVENTLOG_AUDIT_FAILURE: "WARNING",
} if WINDOWS_AVAILABLE else {}


# ============================================================
# WINDOWS EVENT LOG READER
# ============================================================

class WindowsEventLogReader:
    """Reads Windows Event Logs and tracks last read position"""
    
    def __init__(self, log_name: str):
        self.log_name = log_name
        self.server = None  # Local machine
        self.last_record = None
        self.handle = None
        
    def open(self):
        """Open event log handle"""
        try:
            self.handle = win32evtlog.OpenEventLog(self.server, self.log_name)
            
            # Get the most recent record number (to start reading from here)
            flags = win32evtlog.EVENTLOG_FORWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            events = win32evtlog.ReadEventLog(self.handle, flags, 0)
            
            if events:
                self.last_record = events[-1].RecordNumber
                print(f"  ✅ Opened '{self.log_name}' - Starting from record #{self.last_record}")
            else:
                self.last_record = 0
                print(f"  ✅ Opened '{self.log_name}' - No existing events")
                
        except Exception as e:
            print(f"  ❌ Failed to open '{self.log_name}': {e}")
            raise
    
    def read_new_events(self, max_events: int = 100) -> list:
        """Read new events since last read"""
        if not self.handle:
            return []
        
        events = []
        
        try:
            # Read forward from last position
            flags = win32evtlog.EVENTLOG_FORWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            
            # Read events
            raw_events = win32evtlog.ReadEventLog(
                self.handle,
                flags,
                self.last_record + 1 if self.last_record else 0
            )
            
            for event in raw_events[:max_events]:
                # Filter by event type
                event_type = EVENT_TYPE_MAP.get(event.EventType, "INFO")
                
                if event_type not in WINDOWS_EVENTLOG_TYPES:
                    continue
                
                # Extract event data
                try:
                    # Get event message (can fail for some events)
                    message = win32evtlogutil.SafeFormatMessage(event, self.log_name)
                    if not message:
                        message = f"Event ID {event.EventID} (no description available)"
                except:
                    message = f"Event ID {event.EventID} from {event.SourceName}"
                
                # Create event object
                event_data = {
                    "timestamp": event.TimeGenerated.isoformat() if event.TimeGenerated else datetime.utcnow().isoformat(),
                    "level": event_type,
                    "source": f"windows_{self.log_name.lower()}",
                    "message": f"[{event.SourceName}] {message}".strip(),
                    "event_id": event.EventID,
                    "record_number": event.RecordNumber
                }
                
                events.append(event_data)
                
                # Update last record number
                if event.RecordNumber > (self.last_record or 0):
                    self.last_record = event.RecordNumber
            
            if events and AUTOMATION_DEBUG:
                print(f"  📥 Read {len(events)} new events from '{self.log_name}'")
                
        except Exception as e:
            if AUTOMATION_DEBUG:
                print(f"  ⚠ Error reading from '{self.log_name}': {e}")
        
        return events
    
    def close(self):
        """Close event log handle"""
        if self.handle:
            try:
                win32evtlog.CloseEventLog(self.handle)
            except:
                pass


# ============================================================
# SEND EVENT TO BACKEND
# ============================================================

def send_event_to_backend(event: dict):
    """Send event to ThreatTrace backend"""
    try:
        url = f"{BACKEND_API_URL}/api/logs/ingest"
        
        payload = {
            "timestamp": event["timestamp"],
            "level": event["level"],
            "source": event["source"],
            "message": event["message"]
        }
        
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code not in [200, 201]:
            if AUTOMATION_DEBUG:
                print(f"  ⚠ Backend returned {response.status_code}")
        
        # Extract IPs and geolocate (for threat map)
        if extract_and_geolocate_from_log and event.get("level") in ["ERROR", "CRITICAL", "WARNING"]:
            try:
                locations = extract_and_geolocate_from_log(event["message"])
                
                # Send locations to dashboard
                for location in locations:
                    threat_location_payload = {
                        "event": "threat_location",
                        "data": {
                            "lat": location["lat"],
                            "lng": location["lon"],
                            "city": location["city"],
                            "country": location["country"],
                            "type": "System Event",
                            "severity": event["level"].lower(),
                            "ip": location["ip"]
                        }
                    }
                    requests.post(f"{BACKEND_API_URL}/api/dashboard/broadcast", json=threat_location_payload, timeout=5)
                    
                    if AUTOMATION_DEBUG and locations:
                        print(f"    📍 Geolocated {len(locations)} IP(s) from event")
            except Exception as e:
                if AUTOMATION_DEBUG:
                    print(f"    ⚠ GeoIP error: {e}")
                
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Cannot connect to backend at {BACKEND_API_URL}")
    except Exception as e:
        if AUTOMATION_DEBUG:
            print(f"  ❌ Error sending event: {e}")


# ============================================================
# MAIN COLLECTION LOOP
# ============================================================

def run_collector():
    """Main event log collector loop"""
    
    if not WINDOWS_AVAILABLE:
        print("❌ Windows Event Log collection not available (pywin32 not installed)")
        return
    
    if not ENABLE_WINDOWS_EVENTLOG:
        print("⚠️  Windows Event Log collection is disabled in automation_config.py")
        return
    
    print("\n" + "="*70)
    print("   📋 ThreatTrace Windows Event Log Collector Started")
    print("="*70)
    print(f"   Backend API: {BACKEND_API_URL}")
    print(f"   Poll Interval: {WINDOWS_EVENTLOG_POLL_INTERVAL}s")
    print(f"   Event Types: {', '.join(WINDOWS_EVENTLOG_TYPES)}")
    print("="*70 + "\n")
    
    # Initialize readers for each log source
    readers = {}
    
    print("📂 Opening event log sources:")
    for source in WINDOWS_EVENTLOG_SOURCES:
        try:
            reader = WindowsEventLogReader(source)
            reader.open()
            readers[source] = reader
        except Exception as e:
            print(f"  ⚠️  Skipping '{source}' - {e}")
    
    if not readers:
        print("❌ No event log sources available!")
        return
    
    print(f"\n✅ Monitoring {len(readers)} event log sources\n")
    
    poll_count = 0
    
    try:
        while True:
            poll_count += 1
            
            if AUTOMATION_DEBUG:
                print(f"🔄 Poll #{poll_count} - {datetime.now().strftime('%H:%M:%S')}")
            
            total_events = 0
            
            # Read from each source
            for source, reader in readers.items():
                events = reader.read_new_events(max_events=WINDOWS_EVENTLOG_MAX_EVENTS)
                
                # Send events to backend
                for event in events:
                    send_event_to_backend(event)
                    total_events += 1
            
            if total_events > 0:
                print(f"  📤 Sent {total_events} events to backend")
            elif AUTOMATION_DEBUG:
                print(f"  ✓ No new events")
            
            # Wait for next poll
            time.sleep(WINDOWS_EVENTLOG_POLL_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Collector stopped by user (Ctrl+C)")
    except Exception as e:
        print(f"\n❌ Fatal error in collector: {e}")
        traceback.print_exc()
    finally:
        # Close all readers
        print("\n🔒 Closing event log handles...")
        for reader in readers.values():
            reader.close()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    run_collector()
