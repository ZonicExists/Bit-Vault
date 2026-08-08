import json
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_db
from app.crypto.pbkdf2 import derive_master_key, generate_salt
from app.crypto.aes_gcm import encrypt_payload, decrypt_payload
from app.services.session_service import session_service
from app.models.schemas import SetupRequest, UnlockRequest, ChangePasswordRequest
from app.models.responses import success_response, error_response
from app.middleware.auth_middleware import require_unlocked_vault

router = APIRouter(prefix="/api/auth", tags=["Auth"])

VERIFICATION_STRING = "VAULT_VALID"

@router.get("/status")
def get_status(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM vault_meta LIMIT 1;")
    row = cursor.fetchone()
    is_initialized = row is not None

    return success_response({
        "is_unlocked": session_service.is_unlocked(),
        "is_initialized": is_initialized,
        "auto_lock_minutes": session_service.auto_lock_minutes,
        "unlocked_at": session_service.unlocked_at
    })

@router.post("/setup")
def setup_vault(req: SetupRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM vault_meta LIMIT 1;")
    if cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VAULT_ALREADY_INITIALIZED", "message": "Vault is already initialized."}
        )

    salt = generate_salt()
    master_key = derive_master_key(req.master_password, salt)
    verification_envelope = encrypt_payload(VERIFICATION_STRING, master_key)

    cursor.execute(
        "INSERT INTO vault_meta (id, salt, verification_envelope) VALUES (1, ?, ?);",
        (salt.hex(), json.dumps(verification_envelope))
    )
    db.commit()

    # Automatically unlock upon initial setup
    session_service.set_master_key(master_key)

    return success_response({
        "is_unlocked": True,
        "auto_lock_minutes": session_service.auto_lock_minutes,
        "unlocked_at": session_service.unlocked_at
    })

@router.post("/unlock")
def unlock_vault(req: UnlockRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT salt, verification_envelope FROM vault_meta LIMIT 1;")
    meta = cursor.fetchone()

    if not meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VAULT_NOT_INITIALIZED", "message": "Vault is not initialized. Please run setup first."}
        )

    salt = bytes.fromhex(meta["salt"])
    envelope = json.loads(meta["verification_envelope"])

    try:
        master_key = derive_master_key(req.master_password, salt)
        decrypted = decrypt_payload(envelope, master_key)
        if decrypted != VERIFICATION_STRING:
            raise ValueError("Invalid verification token")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_MASTER_PASSWORD", "message": "Incorrect Master Password. Please retry."}
        )

    session_service.set_master_key(master_key)

    return success_response({
        "is_unlocked": True,
        "auto_lock_minutes": session_service.auto_lock_minutes,
        "unlocked_at": session_service.unlocked_at
    })

@router.post("/lock")
def lock_vault():
    session_service.lock_vault()
    return success_response({"is_unlocked": False})

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT salt, verification_envelope FROM vault_meta LIMIT 1;")
    meta = cursor.fetchone()

    if not meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VAULT_NOT_INITIALIZED", "message": "Vault is not initialized."}
        )

    current_salt = bytes.fromhex(meta["salt"])
    envelope = json.loads(meta["verification_envelope"])

    # Verify current password
    try:
        derived_current_key = derive_master_key(req.current_password, current_salt)
        decrypted = decrypt_payload(envelope, derived_current_key)
        if decrypted != VERIFICATION_STRING:
            raise ValueError("Invalid current password")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_MASTER_PASSWORD", "message": "Current Master Password does not match."}
        )

    # Derive new master key
    new_salt = generate_salt()
    new_master_key = derive_master_key(req.new_password, new_salt)
    new_verification_envelope = encrypt_payload(VERIFICATION_STRING, new_master_key)

    # Re-encrypt all items
    cursor.execute("SELECT id, encrypted_payload FROM items;")
    items = cursor.fetchall()

    for item in items:
        old_env = json.loads(item["encrypted_payload"])
        decrypted_payload = decrypt_payload(old_env, derived_current_key)
        new_env = encrypt_payload(decrypted_payload, new_master_key)
        cursor.execute(
            "UPDATE items SET encrypted_payload = ? WHERE id = ?;",
            (json.dumps(new_env), item["id"])
        )

    # Update vault_meta
    cursor.execute(
        "UPDATE vault_meta SET salt = ?, verification_envelope = ? WHERE id = 1;",
        (new_salt.hex(), json.dumps(new_verification_envelope))
    )

    db.commit()

    # Update active session key
    session_service.set_master_key(new_master_key)

    return success_response({"message": "Master password changed & vault re-encrypted successfully."})
