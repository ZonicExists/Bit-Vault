import json
import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from pydantic import BaseModel

from app.db.database import get_db
from app.services.session_service import session_service
from app.middleware.auth_middleware import require_unlocked_vault
from app.models.responses import success_response
from app.routers.backup import export_backup, import_backup

router = APIRouter(prefix="/api/settings", tags=["Settings & Vault Management"])

# In-memory clipboard setting storage for current session
_clipboard_auto_clear_seconds = 30

class SettingsUpdateRequest(BaseModel):
    auto_lock_minutes: Optional[int] = None
    clipboard_auto_clear_seconds: Optional[int] = None

@router.get("")
def get_settings(master_key: bytes = Depends(require_unlocked_vault)):
    return success_response({
        "auto_lock_minutes": session_service.auto_lock_minutes,
        "clipboard_auto_clear_seconds": _clipboard_auto_clear_seconds
    })

@router.put("")
def update_settings(
    req: SettingsUpdateRequest,
    master_key: bytes = Depends(require_unlocked_vault)
):
    global _clipboard_auto_clear_seconds
    if req.auto_lock_minutes is not None:
        session_service.auto_lock_minutes = max(0, req.auto_lock_minutes)
    if req.clipboard_auto_clear_seconds is not None:
        _clipboard_auto_clear_seconds = max(0, req.clipboard_auto_clear_seconds)

    return success_response({
        "auto_lock_minutes": session_service.auto_lock_minutes,
        "clipboard_auto_clear_seconds": _clipboard_auto_clear_seconds
    })

@router.post("/export")
@router.get("/export")
def export_settings_vault(
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    return export_backup(db=db, master_key=master_key)

@router.post("/import")
async def import_settings_vault(
    file: Optional[UploadFile] = File(None),
    vault_file: Optional[UploadFile] = File(None),
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    upload = file or vault_file
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_FILE", "message": "No backup file uploaded."}
        )
    return await import_backup(file=upload, db=db, master_key=master_key)
