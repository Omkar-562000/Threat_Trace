"""
ThreatTrace Test Data Generator
================================
Generates realistic test logs and simulates various security scenarios
for manual and automated testing.

Usage:
    python test_data_generator.py --mode [clean|suspicious|tampered|all]
"""

import random
import time
from datetime import datetime, timedelta
import os
import hashlib
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Sample log templates
LOG_TEMPLATES = {
    "clean": [
        "User {user} logged in successfully from IP {ip}",
        "System backup completed successfully at {time}",
        "Database query executed: SELECT * FROM users WHERE id={id}",
        "File accessed: {file} by user {user}",
        "Network connection established to {ip}:{port}",
        "Service {service} started successfully",
        "Configuration updated: {setting} changed to {value}",
        "Email sent to {email} - Subject: {subject}",
        "API request received: GET /api/{endpoint}",
        "Cache cleared for module {module}",
    ],
    "suspicious": [
        "Multiple failed login attempts detected for user {user} from IP {ip}",
        "Unusual file access pattern detected: {file}",
        "Port scan detected from IP {ip} on ports {ports}",
        "Elevated privileges requested by process {process}",
        "Unusual network traffic spike detected at {time}",
        "SQL injection attempt blocked: {query}",
        "Brute force attack detected from IP {ip}",
        "Unauthorized access attempt to {resource}",
        "Suspicious command execution: {command}",
        "Anomalous data transfer: {size}MB to external IP {ip}",
    ],
    "critical": [
        "CRITICAL: Ransomware signature detected in file {file}",
        "CRITICAL: System file {file} has been encrypted",
        "CRITICAL: Unauthorized root access detected",
        "CRITICAL: Multiple system files deleted by process {process}",
        "CRITICAL: Database breach attempt from IP {ip}",
        "CRITICAL: Malware detected: {malware_name}",
        "CRITICAL: Data exfiltration in progress to {ip}",
        "CRITICAL: Backdoor discovered on port {port}",
    ]
}

# Sample data
USERS = ["admin", "john.doe", "jane.smith", "bob.wilson", "alice.brown", "system", "root"]
IPS = ["192.168.1.100", "10.0.0.50", "172.16.0.25", "45.33.21.89", "185.220.101.35"]
FILES = [
    "/var/log/system.log", 
    "/etc/passwd", 
    "/home/user/documents/report.pdf",
    "/var/www/html/index.php",
    "C:\\Windows\\System32\\config.sys",
    "C:\\Users\\Admin\\Documents\\sensitive.xlsx"
]
SERVICES = ["nginx", "mysql", "redis", "mongodb", "apache", "ssh"]
PROCESSES = ["chrome.exe", "python.exe", "svchost.exe", "explorer.exe", "system"]
MALWARE_NAMES = ["WannaCry", "Ryuk", "Maze", "Emotet", "TrickBot"]

def generate_log_entry(log_type="clean"):
    """Generate a single log entry"""
    template = random.choice(LOG_TEMPLATES[log_type])
    
    # Fill in placeholders
    log = template.format(
        user=random.choice(USERS),
        ip=random.choice(IPS),
        time=datetime.now().strftime("%H:%M:%S"),
        id=random.randint(1000, 9999),
        file=random.choice(FILES),
        port=random.choice([22, 80, 443, 3306, 5432, 8080]),
        ports=f"{random.randint(1, 65000)}-{random.randint(1, 65000)}",
        service=random.choice(SERVICES),
        setting="max_connections",
        value=random.randint(100, 1000),
        email=f"{random.choice(['user', 'admin', 'support'])}@example.com",
        subject="System Notification",
        endpoint=random.choice(["users", "logs", "alerts", "reports"]),
        module=random.choice(SERVICES),
        process=random.choice(PROCESSES),
        query="' OR '1'='1",
        command="rm -rf / --no-preserve-root",
        size=random.randint(100, 5000),
        resource="/admin/dashboard",
        malware_name=random.choice(MALWARE_NAMES)
    )
    
    return log

def create_test_log_file(filename, num_entries=100, log_mix=None):
    """Create a test log file with mixed log types"""
    if log_mix is None:
        log_mix = {"clean": 0.7, "suspicious": 0.2, "critical": 0.1}
    
    os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else ".", exist_ok=True)
    
    with open(filename, "w") as f:
        for i in range(num_entries):
            # Determine log type based on distribution
            rand = random.random()
            if rand < log_mix["clean"]:
                log_type = "clean"
                level = "INFO"
            elif rand < log_mix["clean"] + log_mix["suspicious"]:
                log_type = "suspicious"
                level = "WARNING"
            else:
                log_type = "critical"
                level = "ERROR"
            
            timestamp = datetime.now() - timedelta(minutes=num_entries - i)
            log_entry = generate_log_entry(log_type)
            
            f.write(f"[{timestamp.isoformat()}] [{level}] {log_entry}\n")
    
    print(f"✅ Created test log file: {filename} ({num_entries} entries)")
    return filename

def tamper_log_file(original_file, tampered_file):
    """Create a tampered version of a log file"""
    with open(original_file, "r") as f:
        lines = f.readlines()
    
    # Tamper with 10% of lines
    num_tamper = max(1, len(lines) // 10)
    tampered_indices = random.sample(range(len(lines)), num_tamper)
    
    for idx in tampered_indices:
        # Modify timestamp or content
        if random.random() > 0.5:
            lines[idx] = lines[idx].replace("INFO", "MODIFIED")
        else:
            lines[idx] = lines[idx][:-1] + " [TAMPERED]\n"
    
    with open(tampered_file, "w") as f:
        f.writelines(lines)
    
    print(f"⚠️  Created tampered log file: {tampered_file}")
    return tampered_file

def ingest_logs_to_system(log_file, api_url="http://127.0.0.1:5000/api/logs/ingest"):
    """Send logs to the system via API"""
    try:
        with open(log_file, "r") as f:
            lines = f.readlines()
        
        for line in lines:
            # Parse log entry
            parts = line.strip().split("] ")
            if len(parts) >= 3:
                timestamp = parts[0][1:]  # Remove leading [
                level = parts[1][1:]      # Remove leading [
                message = "] ".join(parts[2:])
                
                data = {
                    "timestamp": timestamp,
                    "level": level,
                    "source": "test_generator",
                    "message": message
                }
                
                response = requests.post(api_url, json=data)
                if response.status_code == 200:
                    print(f"✅ Ingested: {message[:50]}...")
                time.sleep(0.1)  # Throttle requests
        
        print(f"✅ All logs from {log_file} ingested successfully")
    except Exception as e:
        print(f"❌ Error ingesting logs: {e}")

def generate_continuous_logs(duration_minutes=10, interval_seconds=5):
    """Generate logs continuously for testing real-time features"""
    print(f"🔄 Generating logs for {duration_minutes} minutes (every {interval_seconds}s)...")
    
    end_time = datetime.now() + timedelta(minutes=duration_minutes)
    api_url = "http://127.0.0.1:5000/api/logs/ingest"
    
    while datetime.now() < end_time:
        # Generate random log
        log_type = random.choices(
            ["clean", "suspicious", "critical"],
            weights=[0.7, 0.2, 0.1]
        )[0]
        
        level = {"clean": "INFO", "suspicious": "WARNING", "critical": "ERROR"}[log_type]
        message = generate_log_entry(log_type)
        
        data = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "source": "continuous_generator",
            "message": message
        }
        
        try:
            response = requests.post(api_url, json=data)
            if response.status_code == 200:
                print(f"✅ [{level}] {message[:60]}...")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        time.sleep(interval_seconds)
    
    print("✅ Continuous log generation completed")

def create_test_suite():
    """Create a comprehensive test suite"""
    test_dir = "test_files"
    os.makedirs(test_dir, exist_ok=True)
    
    print("\n" + "="*60)
    print("🧪 ThreatTrace Test Suite Generator")
    print("="*60 + "\n")
    
    # 1. Clean logs
    clean_file = os.path.join(test_dir, "clean_system.log")
    create_test_log_file(clean_file, 200, {"clean": 1.0, "suspicious": 0.0, "critical": 0.0})
    
    # 2. Suspicious logs
    suspicious_file = os.path.join(test_dir, "suspicious_activity.log")
    create_test_log_file(suspicious_file, 150, {"clean": 0.3, "suspicious": 0.6, "critical": 0.1})
    
    # 3. Critical logs
    critical_file = os.path.join(test_dir, "critical_alerts.log")
    create_test_log_file(critical_file, 100, {"clean": 0.1, "suspicious": 0.3, "critical": 0.6})
    
    # 4. Mixed realistic scenario
    mixed_file = os.path.join(test_dir, "realistic_mix.log")
    create_test_log_file(mixed_file, 500, {"clean": 0.7, "suspicious": 0.25, "critical": 0.05})
    
    # 5. Create tampered version
    tampered_file = os.path.join(test_dir, "clean_system_tampered.log")
    tamper_log_file(clean_file, tampered_file)
    
    # 6. Large log file for performance testing
    large_file = os.path.join(test_dir, "large_system.log")
    create_test_log_file(large_file, 5000, {"clean": 0.8, "suspicious": 0.15, "critical": 0.05})
    
    print("\n" + "="*60)
    print("✅ Test Suite Created Successfully!")
    print("="*60)
    print(f"\nTest files created in: {os.path.abspath(test_dir)}/")
    print("\nGenerated files:")
    print("  1. clean_system.log - Baseline clean logs")
    print("  2. suspicious_activity.log - Suspicious patterns")
    print("  3. critical_alerts.log - Critical security events")
    print("  4. realistic_mix.log - Realistic mix of all types")
    print("  5. clean_system_tampered.log - Tampered version for integrity testing")
    print("  6. large_system.log - Large file for performance testing")
    print("\nNext steps:")
    print("  • Use these files in the Audit page for integrity testing")
    print("  • Ingest logs to test real-time monitoring")
    print("  • Test role-based export features")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ThreatTrace Test Data Generator")
    parser.add_argument(
        "--mode",
        choices=["suite", "ingest", "continuous"],
        default="suite",
        help="Generation mode: suite (create files), ingest (send to API), continuous (real-time)"
    )
    parser.add_argument("--file", help="Specific file to ingest")
    parser.add_argument("--duration", type=int, default=10, help="Duration in minutes for continuous mode")
    parser.add_argument("--interval", type=int, default=5, help="Interval in seconds for continuous mode")
    
    args = parser.parse_args()
    
    if args.mode == "suite":
        create_test_suite()
    elif args.mode == "ingest":
        if args.file:
            ingest_logs_to_system(args.file)
        else:
            print("❌ Please specify --file for ingest mode")
    elif args.mode == "continuous":
        generate_continuous_logs(args.duration, args.interval)
