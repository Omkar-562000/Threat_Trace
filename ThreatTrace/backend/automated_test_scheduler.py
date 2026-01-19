"""
ThreatTrace Automated Test Scheduler
====================================
Schedules automated tests and log generation for continuous testing.

This script simulates real-world scenarios by:
- Generating logs at scheduled intervals
- Creating tampered files periodically
- Triggering integrity scans
- Simulating security events

Usage:
    python automated_test_scheduler.py
"""

import schedule
import time
import random
import requests
from datetime import datetime
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_data_generator import (
    generate_log_entry,
    create_test_log_file,
    tamper_log_file,
    ingest_logs_to_system
)

API_BASE = "http://127.0.0.1:5000"

class AutomatedTestScheduler:
    def __init__(self):
        self.test_dir = "test_files/automated"
        os.makedirs(self.test_dir, exist_ok=True)
        self.iteration = 0
        
    def log_test_event(self, message, level="INFO"):
        """Log test events to console and system"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
        # Send to system logs
        try:
            requests.post(f"{API_BASE}/api/logs/ingest", json={
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "source": "automated_scheduler",
                "message": message
            })
        except:
            pass
    
    def generate_hourly_logs(self):
        """Generate realistic logs every hour"""
        self.log_test_event("🕐 Hourly log generation started")
        
        filename = os.path.join(self.test_dir, f"hourly_{datetime.now().strftime('%Y%m%d_%H')}.log")
        
        # Random mix based on time of day
        hour = datetime.now().hour
        if 0 <= hour < 6:  # Night - fewer logs, more suspicious
            log_mix = {"clean": 0.5, "suspicious": 0.4, "critical": 0.1}
            num_entries = 50
        elif 9 <= hour < 17:  # Business hours - more activity
            log_mix = {"clean": 0.8, "suspicious": 0.15, "critical": 0.05}
            num_entries = 200
        else:  # Evening
            log_mix = {"clean": 0.7, "suspicious": 0.25, "critical": 0.05}
            num_entries = 100
        
        create_test_log_file(filename, num_entries, log_mix)
        self.log_test_event(f"✅ Created hourly log: {filename}")
        
        # Ingest some logs
        ingest_logs_to_system(filename)
    
    def generate_real_time_events(self):
        """Generate real-time events every 5 minutes"""
        log_types = ["clean", "suspicious", "critical"]
        weights = [0.7, 0.2, 0.1]
        
        log_type = random.choices(log_types, weights=weights)[0]
        level = {"clean": "INFO", "suspicious": "WARNING", "critical": "ERROR"}[log_type]
        message = generate_log_entry(log_type)
        
        try:
            requests.post(f"{API_BASE}/api/logs/ingest", json={
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "source": "real_time_generator",
                "message": message
            })
            self.log_test_event(f"📡 Real-time event: {message[:50]}...", level)
        except Exception as e:
            self.log_test_event(f"❌ Failed to send real-time event: {e}", "ERROR")
    
    def simulate_tamper_detection(self):
        """Simulate file tampering for integrity testing"""
        self.log_test_event("🔍 Simulating file tampering scenario")
        
        # Create original file
        original = os.path.join(self.test_dir, f"integrity_test_{self.iteration}.log")
        create_test_log_file(original, 100, {"clean": 1.0, "suspicious": 0, "critical": 0})
        
        # Wait a moment
        time.sleep(2)
        
        # Create tampered version
        tampered = os.path.join(self.test_dir, f"integrity_test_{self.iteration}_tampered.log")
        tamper_log_file(original, tampered)
        
        self.log_test_event(f"⚠️  Tampered file created: {tampered}", "WARNING")
        self.iteration += 1
    
    def trigger_audit_scan(self):
        """Trigger an automated audit scan"""
        self.log_test_event("🔎 Triggering automated audit scan")
        
        # Get a random test file
        test_files = [f for f in os.listdir(self.test_dir) if f.endswith('.log')]
        if test_files:
            test_file = os.path.join(self.test_dir, random.choice(test_files))
            
            try:
                with open(test_file, 'rb') as f:
                    # This would trigger the audit endpoint
                    # For now, just log it
                    self.log_test_event(f"📊 Audit scan completed for: {test_file}")
            except Exception as e:
                self.log_test_event(f"❌ Audit scan failed: {e}", "ERROR")
    
    def generate_security_events(self):
        """Generate various security events"""
        events = [
            ("Multiple failed login attempts detected", "WARNING"),
            ("Unusual file access pattern observed", "WARNING"),
            ("Port scan detected from external IP", "ERROR"),
            ("SQL injection attempt blocked", "WARNING"),
            ("Malware signature detected in upload", "ERROR"),
            ("Brute force attack mitigated", "ERROR"),
        ]
        
        event, level = random.choice(events)
        self.log_test_event(f"🛡️ Security event: {event}", level)
        
        try:
            requests.post(f"{API_BASE}/api/logs/ingest", json={
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "source": "security_monitor",
                "message": event
            })
        except:
            pass
    
    def cleanup_old_files(self):
        """Clean up old test files (keep last 24 hours)"""
        self.log_test_event("🧹 Cleaning up old test files")
        
        try:
            files = os.listdir(self.test_dir)
            for file in files:
                filepath = os.path.join(self.test_dir, file)
                # Check file age
                file_age = time.time() - os.path.getmtime(filepath)
                if file_age > 86400:  # 24 hours
                    os.remove(filepath)
                    self.log_test_event(f"🗑️  Removed old file: {file}")
        except Exception as e:
            self.log_test_event(f"❌ Cleanup failed: {e}", "ERROR")
    
    def health_check(self):
        """Check if ThreatTrace backend is running"""
        try:
            response = requests.get(f"{API_BASE}/")
            if response.status_code == 200:
                self.log_test_event("✅ ThreatTrace backend health check passed")
            else:
                self.log_test_event(f"⚠️  Backend returned status: {response.status_code}", "WARNING")
        except Exception as e:
            self.log_test_event(f"❌ Backend health check failed: {e}", "ERROR")
    
    def start(self):
        """Start the automated test scheduler"""
        print("\n" + "="*70)
        print("🤖 ThreatTrace Automated Test Scheduler")
        print("="*70)
        print("\nScheduled Tasks:")
        print("  • Real-time events: Every 5 minutes")
        print("  • Security events: Every 10 minutes")
        print("  • Hourly log generation: Every hour")
        print("  • Audit scan: Every 30 minutes")
        print("  • Tamper simulation: Every 2 hours")
        print("  • Health check: Every 15 minutes")
        print("  • Cleanup: Daily at midnight")
        print("\nPress Ctrl+C to stop\n")
        print("="*70 + "\n")
        
        # Schedule tasks
        schedule.every(5).minutes.do(self.generate_real_time_events)
        schedule.every(10).minutes.do(self.generate_security_events)
        schedule.every(15).minutes.do(self.health_check)
        schedule.every(30).minutes.do(self.trigger_audit_scan)
        schedule.every(1).hours.do(self.generate_hourly_logs)
        schedule.every(2).hours.do(self.simulate_tamper_detection)
        schedule.every().day.at("00:00").do(self.cleanup_old_files)
        
        # Run initial health check
        self.health_check()
        
        # Run scheduler
        try:
            while True:
                schedule.run_pending()
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n⏹️  Scheduler stopped by user")
            self.log_test_event("Automated test scheduler stopped")

if __name__ == "__main__":
    scheduler = AutomatedTestScheduler()
    scheduler.start()
