import hashlib
import os

# Simple ransomware signature hashes (for demo)
KNOWN_RANSOM_HASHES = {
    "3c4a96b6c8e47b7c1a9a8f278e4d9f5e": "WannaCry",
    "a5b9a6a9e7f4a6f9b9c3e7f9d5a6b8e1": "Locky",
    "e2b7c3d6a9f4e8c5a6b7d8e9f4a6b7e8": "CryptoLocker"
}

def calculate_file_hash(file_path):
    """Calculate SHA256 hash of a given file."""
    sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
    except FileNotFoundError:
        return None

def scan_file(file_path):
    """Scan file for ransomware signatures."""
    hash_val = calculate_file_hash(file_path)
    if not hash_val:
        return {"status": "error", "message": "File not found"}
    
    if hash_val in KNOWN_RANSOM_HASHES:
        return {
            "status": "infected",
            "threat": KNOWN_RANSOM_HASHES[hash_val],
            "hash": hash_val
        }
    else:
        return {"status": "clean", "hash": hash_val}
