# backend/utils/geoip_service.py
"""
====================================================================
              ThreatTrace — GeoIP Service
====================================================================

Extracts IP addresses from logs and maps them to geographic locations
Uses free ip-api.com service (no API key required, 45 requests/min)

For production, consider:
- MaxMind GeoIP2 (requires database file)
- IPStack API (requires API key)
- ip-api.com Pro (paid, higher limits)
"""

import re
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Cache to avoid repeated API calls for same IP
_ip_cache = {}
_cache_ttl = timedelta(hours=24)


# ============================================================
# IP EXTRACTION FROM TEXT
# ============================================================

def extract_ips_from_text(text: str) -> List[str]:
    """
    Extract all valid IPv4 addresses from text
    Returns unique list of IPs
    """
    # IPv4 pattern
    ip_pattern = r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
    
    ips = re.findall(ip_pattern, text)
    
    # Filter out private/local IPs
    public_ips = []
    for ip in set(ips):  # Use set to get unique IPs
        # Skip private ranges
        if ip.startswith(('192.168.', '10.', '172.16.', '172.17.', '172.18.', 
                          '172.19.', '172.20.', '172.21.', '172.22.', '172.23.',
                          '172.24.', '172.25.', '172.26.', '172.27.', '172.28.',
                          '172.29.', '172.30.', '172.31.', '127.', '0.0.0.0',
                          '255.255.255.255', '169.254.')):
            continue
        
        # Skip localhost
        if ip == '127.0.0.1':
            continue
            
        public_ips.append(ip)
    
    return public_ips


# ============================================================
# GEOIP LOOKUP (Using ip-api.com)
# ============================================================

def geolocate_ip(ip: str, use_cache: bool = True) -> Optional[Dict]:
    """
    Get geographic location for an IP address
    
    Returns dict with:
    - ip: IP address
    - country: Country name
    - city: City name
    - lat: Latitude
    - lon: Longitude
    - region: Region/State
    - isp: ISP name
    - org: Organization
    
    Returns None if lookup fails
    """
    # Check cache first
    if use_cache and ip in _ip_cache:
        cached_data, cached_time = _ip_cache[ip]
        if datetime.utcnow() - cached_time < _cache_ttl:
            return cached_data
    
    try:
        # Free API endpoint (45 requests/minute limit)
        url = f"http://ip-api.com/json/{ip}"
        
        # Add timeout to avoid hanging
        response = requests.get(url, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 'success':
                location = {
                    "ip": ip,
                    "country": data.get('country', 'Unknown'),
                    "countryCode": data.get('countryCode', ''),
                    "city": data.get('city', 'Unknown'),
                    "lat": data.get('lat', 0.0),
                    "lon": data.get('lon', 0.0),
                    "lng": data.get('lon', 0.0),  # Alias for consistency
                    "region": data.get('regionName', ''),
                    "isp": data.get('isp', ''),
                    "org": data.get('org', ''),
                    "timezone": data.get('timezone', ''),
                    "zip": data.get('zip', '')
                }
                
                # Cache the result
                _ip_cache[ip] = (location, datetime.utcnow())
                
                return location
            else:
                print(f"  GeoIP lookup failed for {ip}: {data.get('message', 'Unknown error')}")
                return None
                
        else:
            print(f"  GeoIP API returned status {response.status_code} for {ip}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"  GeoIP lookup timeout for {ip}")
        return None
    except requests.exceptions.ConnectionError:
        print(f"  GeoIP API connection error for {ip}")
        return None
    except Exception as e:
        print(f"  GeoIP lookup error for {ip}: {e}")
        return None


# ============================================================
# BATCH GEOIP LOOKUP
# ============================================================

def geolocate_ips_batch(ips: List[str], delay: float = 1.4) -> List[Dict]:
    """
    Geolocate multiple IPs with rate limiting
    
    Args:
        ips: List of IP addresses
        delay: Delay between requests (seconds)
               Default 1.4s = ~40 requests/min (within free tier limit)
    
    Returns:
        List of location dicts (only successful lookups)
    """
    locations = []
    
    for i, ip in enumerate(ips):
        location = geolocate_ip(ip)
        
        if location:
            locations.append(location)
        
        # Rate limiting (skip delay for last IP)
        if i < len(ips) - 1:
            time.sleep(delay)
    
    return locations


# ============================================================
# LOG MESSAGE PROCESSING
# ============================================================

def extract_and_geolocate_from_log(log_message: str) -> List[Dict]:
    """
    Extract IPs from log message and geolocate them
    
    Args:
        log_message: Log message text
    
    Returns:
        List of location dicts
    """
    ips = extract_ips_from_text(log_message)
    
    if not ips:
        return []
    
    # Limit to first 5 IPs to avoid rate limiting
    ips = ips[:5]
    
    locations = geolocate_ips_batch(ips, delay=1.4)
    
    return locations


# ============================================================
# CLEAR CACHE (FOR TESTING)
# ============================================================

def clear_geoip_cache():
    """Clear the GeoIP cache"""
    global _ip_cache
    _ip_cache = {}
    print("  GeoIP cache cleared")


# ============================================================
# GET CACHE STATS
# ============================================================

def get_cache_stats() -> Dict:
    """Get cache statistics"""
    return {
        "cached_ips": len(_ip_cache),
        "cache_ttl_hours": int(_cache_ttl.total_seconds() / 3600)
    }


# ============================================================
# TESTING
# ============================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   GeoIP Service Test")
    print("="*60 + "\n")
    
    # Test IP extraction
    test_log = "Connection from 8.8.8.8 failed. Also saw traffic from 1.1.1.1 and 192.168.1.1"
    print(f"Test log: {test_log}")
    
    ips = extract_ips_from_text(test_log)
    print(f"\nExtracted IPs: {ips}")
    
    # Test geolocation
    print("\nGeolocating IPs...\n")
    locations = geolocate_ips_batch(ips)
    
    for loc in locations:
        print(f"  {loc['ip']} → {loc['city']}, {loc['country']} ({loc['lat']}, {loc['lon']})")
    
    print(f"\nCache stats: {get_cache_stats()}")
    print()
