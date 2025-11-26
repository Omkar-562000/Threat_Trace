# backend/system_monitor.py
"""
Standalone monitor: tails a file and POSTs new lines to the backend /api/logs/ingest.
Usage: python system_monitor.py --file "C:/path/to/system.log" --url "http://127.0.0.1:5000/api/logs/ingest"
"""
import time
import requests
import argparse
import os
import json

def tail_and_post(file_path, ingest_url, source="system_monitor", level="INFO", sleep=1.0):
    # start at end of file
    with open(file_path, "rb") as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(sleep)
                continue
            try:
                text = line.decode("utf-8", errors="replace").strip()
            except:
                text = str(line)
            payload = {
                "message": text,
                "level": level,
                "source": source
            }
            try:
                r = requests.post(ingest_url, json=payload, timeout=5)
                if r.status_code not in (200, 201):
                    print("Ingest error:", r.status_code, r.text)
            except Exception as e:
                print("POST error:", e)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to log file to tail")
    parser.add_argument("--url", default="http://127.0.0.1:5000/api/logs/ingest", help="Ingest URL")
    parser.add_argument("--source", default="system_monitor")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print("File not found:", args.file)
        exit(1)

    print("Tailing file:", args.file)
    tail_and_post(args.file, args.url, source=args.source)
