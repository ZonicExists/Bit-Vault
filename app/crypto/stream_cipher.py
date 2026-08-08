import os
from typing import Generator
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

def encrypt_and_save_file(file_bytes: bytes, target_path: str, master_key: bytes) -> dict:
    """
    Encrypts raw file bytes with AES-256-GCM and writes to target_path.
    Structure written to disk: [12 bytes IV][16 bytes AuthTag][Ciphertext]
    """
    iv = os.urandom(settings.IV_LENGTH_BYTES)
    aesgcm = AESGCM(master_key)
    
    encrypted_bytes = aesgcm.encrypt(iv, file_bytes, None)
    ciphertext = encrypted_bytes[:-settings.AUTH_TAG_LENGTH_BYTES]
    auth_tag = encrypted_bytes[-settings.AUTH_TAG_LENGTH_BYTES:]
    
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "wb") as f:
        f.write(iv)
        f.write(auth_tag)
        f.write(ciphertext)
        
    return {
        "iv": iv.hex(),
        "authTag": auth_tag.hex(),
        "size": len(file_bytes)
    }

def read_and_decrypt_file(source_path: str, master_key: bytes, chunk_size: int = 64 * 1024) -> Generator[bytes, None, None]:
    """
    Reads an encrypted file from disk, decrypts it with AES-256-GCM, and yields chunks.
    """
    if not os.path.exists(source_path):
        raise FileNotFoundError("Encrypted file not found on disk")
        
    with open(source_path, "rb") as f:
        file_data = f.read()
        
    if len(file_data) < (settings.IV_LENGTH_BYTES + settings.AUTH_TAG_LENGTH_BYTES):
        raise ValueError("Encrypted file corrupted or invalid length")
        
    iv = file_data[:settings.IV_LENGTH_BYTES]
    auth_tag = file_data[settings.IV_LENGTH_BYTES:settings.IV_LENGTH_BYTES + settings.AUTH_TAG_LENGTH_BYTES]
    ciphertext = file_data[settings.IV_LENGTH_BYTES + settings.AUTH_TAG_LENGTH_BYTES:]
    
    aesgcm = AESGCM(master_key)
    decrypted_bytes = aesgcm.decrypt(iv, ciphertext + auth_tag, None)
    
    # Yield in chunks for streaming response
    for i in range(0, len(decrypted_bytes), chunk_size):
        yield decrypted_bytes[i:i + chunk_size]
