import os
import re
import uuid
from datetime import datetime, timezone
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse

from app.config import settings
from app.db.database import get_db
from app.crypto.stream_cipher import encrypt_and_save_file, read_and_decrypt_file
from app.middleware.auth_middleware import require_unlocked_vault
from app.models.schemas import VaultFile
from app.models.responses import success_response

router = APIRouter(prefix="/api/files", tags=["File Manager"])

def _sanitize_filename(name: str) -> str:
    """Strip path components, control chars, and quotes to prevent header injection."""
    # Take only the basename (no path traversal)
    name = os.path.basename(name)
    # Remove control characters, quotes, semicolons, and backslashes
    name = re.sub(r'[\x00-\x1f\x7f"\'\\;]', '_', name)
    # Collapse whitespace
    name = name.strip()
    return name if name else "download"

@router.get("")
def list_files(
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT id, original_name, file_size, mime_type, created_at FROM files;")
    rows = cursor.fetchall()
    return success_response(rows)

@router.post("/upload", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    file_id = str(uuid.uuid4())
    original_name = file.filename or "unnamed_file"
    mime_type = file.content_type or "application/octet-stream"
    
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Enforce upload size limit
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            }
        )
    
    encrypted_filename = f"{file_id}.enc"
    encrypted_path = os.path.join(settings.STORAGE_DIR, encrypted_filename)
    
    # Encrypt raw file content and write to target path
    encrypt_and_save_file(file_bytes, encrypted_path, master_key)
    
    now_iso = datetime.now(timezone.utc).isoformat()
    
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO files (id, original_name, file_size, mime_type, encrypted_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
        """,
        (file_id, original_name, file_size, mime_type, encrypted_path, now_iso)
    )
    db.commit()

    # Exclude encrypted_path from API response — internal detail
    return success_response({
        "id": file_id,
        "original_name": original_name,
        "file_size": file_size,
        "mime_type": mime_type,
        "created_at": now_iso
    })

@router.get("/{file_id}/download")
def download_file(
    file_id: str,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM files WHERE id = ?;", (file_id,))
    file_row = cursor.fetchone()

    if not file_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FILE_NOT_FOUND", "message": f"Vault file with ID {file_id} not found."}
        )

    encrypted_path = file_row["encrypted_path"]
    original_name = file_row["original_name"]
    mime_type = file_row["mime_type"]

    if not os.path.exists(encrypted_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DISK_FILE_MISSING", "message": "Encrypted file missing from disk storage."}
        )

    stream = read_and_decrypt_file(encrypted_path, master_key)

    safe_name = _sanitize_filename(original_name)
    headers = {
        "Content-Disposition": f'attachment; filename="{safe_name}"'
    }

    return StreamingResponse(
        stream,
        media_type=mime_type,
        headers=headers
    )

@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT encrypted_path FROM files WHERE id = ?;", (file_id,))
    file_row = cursor.fetchone()

    if not file_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FILE_NOT_FOUND", "message": f"Vault file with ID {file_id} not found."}
        )

    encrypted_path = file_row["encrypted_path"]
    if os.path.exists(encrypted_path):
        try:
            os.remove(encrypted_path)
        except OSError:
            pass

    cursor.execute("DELETE FROM files WHERE id = ?;", (file_id,))
    db.commit()

    return success_response({"id": file_id})
