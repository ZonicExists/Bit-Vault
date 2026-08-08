import json
from datetime import datetime, timezone
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response

from app.db.database import get_db
from app.crypto.aes_gcm import encrypt_payload, decrypt_payload
from app.middleware.auth_middleware import require_unlocked_vault
from app.models.responses import success_response

router = APIRouter(prefix="/api/backup", tags=["Backup & Restore"])

CONTAINER_MAGIC = "VAULT_CONTAINER_V1"

@router.get("/export")
def export_backup(
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()

    cursor.execute("SELECT * FROM categories;")
    categories = cursor.fetchall()

    cursor.execute("SELECT * FROM tags;")
    tags = cursor.fetchall()

    cursor.execute("SELECT * FROM items;")
    items = cursor.fetchall()

    cursor.execute("SELECT * FROM files;")
    files = cursor.fetchall()

    backup_content = {
        "magic": CONTAINER_MAGIC,
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "categories": categories,
        "tags": tags,
        "items": items,
        "files": files
    }

    # Encrypt the complete backup package with master key
    encrypted_envelope = encrypt_payload(backup_content, master_key)
    envelope_bytes = json.dumps(encrypted_envelope).encode('utf-8')

    date_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"vault_backup_{date_str}.vault"

    return Response(
        content=envelope_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post("/import")
async def import_backup(
    file: UploadFile = File(...),
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    file_bytes = await file.read()
    try:
        envelope = json.loads(file_bytes.decode('utf-8'))
        backup_content = decrypt_payload(envelope, master_key)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_BACKUP_FILE", "message": "Failed to decrypt backup. Invalid format or wrong master password."}
        )

    if not isinstance(backup_content, dict) or backup_content.get("magic") != CONTAINER_MAGIC:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "UNSUPPORTED_BACKUP_MAGIC", "message": "Invalid vault backup container header."}
        )

    cursor = db.cursor()
    imported_categories = 0
    imported_tags = 0
    imported_items = 0
    imported_files = 0

    for cat in backup_content.get("categories", []):
        cursor.execute(
            "INSERT OR REPLACE INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?);",
            (cat["id"], cat["name"], cat["color"], cat["icon"])
        )
        imported_categories += 1

    for tag in backup_content.get("tags", []):
        cursor.execute(
            "INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?);",
            (tag["id"], tag["name"])
        )
        imported_tags += 1

    for item in backup_content.get("items", []):
        cursor.execute(
            """
            INSERT OR REPLACE INTO items (id, type, title, category_id, tags_json, is_favorite, encrypted_payload, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                item["id"],
                item["type"],
                item["title"],
                item["category_id"],
                item.get("tags_json", "[]"),
                item.get("is_favorite", 0),
                item["encrypted_payload"],
                item["created_at"],
                item["updated_at"]
            )
        )
        imported_items += 1

    for f in backup_content.get("files", []):
        cursor.execute(
            """
            INSERT OR REPLACE INTO files (id, original_name, file_size, mime_type, encrypted_path, created_at)
            VALUES (?, ?, ?, ?, ?);
            """,
            (f["id"], f["original_name"], f["file_size"], f["mime_type"], f["encrypted_path"], f["created_at"])
        )
        imported_files += 1

    db.commit()

    return success_response({
        "imported_categories": imported_categories,
        "imported_tags": imported_tags,
        "imported_items": imported_items,
        "imported_files": imported_files
    })
