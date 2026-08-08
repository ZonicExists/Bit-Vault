import json
import os
from typing import Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

def encrypt_payload(payload: Any, master_key: bytes) -> dict:
    """
    Encrypts a JSON serializable payload, dict, list, Pydantic model, or string with AES-256-GCM.
    Returns an encrypted envelope dict: { "iv": hex, "authTag": hex, "ciphertext": hex }
    """
    if hasattr(payload, "model_dump"):
        payload = payload.model_dump()
    elif hasattr(payload, "dict"):
        payload = payload.dict()

    if isinstance(payload, (dict, list)):
        plaintext = json.dumps(payload).encode('utf-8')
    elif isinstance(payload, str):
        plaintext = payload.encode('utf-8')
    elif isinstance(payload, bytes):
        plaintext = payload
    else:
        raise ValueError("Unsupported payload type for encryption")

    iv = os.urandom(settings.IV_LENGTH_BYTES)
    aesgcm = AESGCM(master_key)
    
    # AESGCM.encrypt returns ciphertext + 16-byte auth_tag appended
    encrypted_bytes = aesgcm.encrypt(iv, plaintext, None)
    
    ciphertext_bytes = encrypted_bytes[:-settings.AUTH_TAG_LENGTH_BYTES]
    auth_tag_bytes = encrypted_bytes[-settings.AUTH_TAG_LENGTH_BYTES:]
    
    return {
        "iv": iv.hex(),
        "authTag": auth_tag_bytes.hex(),
        "ciphertext": ciphertext_bytes.hex()
    }

def decrypt_payload(envelope: dict, master_key: bytes) -> dict | str:
    """
    Decrypts an encrypted envelope using AES-256-GCM and master_key.
    Returns parsed JSON payload or string.
    """
    iv = bytes.fromhex(envelope["iv"])
    auth_tag = bytes.fromhex(envelope["authTag"])
    ciphertext = bytes.fromhex(envelope["ciphertext"])
    
    aesgcm = AESGCM(master_key)
    
    # Recombine ciphertext + auth_tag
    combined = ciphertext + auth_tag
    decrypted_bytes = aesgcm.decrypt(iv, combined, None)
    
    decrypted_str = decrypted_bytes.decode('utf-8')
    try:
        return json.loads(decrypted_str)
    except json.JSONDecodeError:
        return decrypted_str
