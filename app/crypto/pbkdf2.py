import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from app.config import settings

def derive_master_key(password: str, salt: bytes) -> bytes:
    """
    Derives a 256-bit (32-byte) key from the given password and salt using PBKDF2-HMAC-SHA256.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=settings.KEY_LENGTH_BYTES,
        salt=salt,
        iterations=settings.PBKDF2_ITERATIONS,
    )
    return kdf.derive(password.encode('utf-8'))

def generate_salt() -> bytes:
    """
    Generates a cryptographically random salt (16 bytes).
    """
    return os.urandom(settings.SALT_LENGTH_BYTES)
