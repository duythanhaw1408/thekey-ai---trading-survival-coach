import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# Use a fixed key from ENV or generate one (WARNING: Should persist in production ENV)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Generate a key for first time use
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"⚠️ ENCRYPTION_KEY not found in .env. Generated temporary key: {ENCRYPTION_KEY}")
    print("MANDATORY: Add ENCRYPTION_KEY to your .env to avoid data loss on restart!")

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    """Encrypt a string using Fernet (AES-128 in CBC mode with HMAC)."""
    if not data:
        return ""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    """Decrypt a Fernet token back to a string. Returns original string if decryption fails (legacy data support)."""
    if not token:
        return ""
    try:
        return cipher_suite.decrypt(token.encode()).decode()
    except Exception:
        # Graceful fallback: Assume data is not encrypted yet (Legacy support)
        return token
