import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
import sqlite3

from app.db.database import get_db
from app.crypto.aes_gcm import encrypt_payload, decrypt_payload
from app.middleware.auth_middleware import require_unlocked_vault
from app.models.schemas import VaultItem, VaultItemCreate, VaultItemUpdate
from app.models.responses import success_response, error_response

router = APIRouter(prefix="/api/items", tags=["Vault Items"])

def parse_db_item(row: dict, master_key: bytes) -> VaultItem:
    encrypted_envelope = json.loads(row["encrypted_payload"])
    decrypted_payload = decrypt_payload(encrypted_envelope, master_key)
    
    tags = []
    if row.get("tags_json"):
        try:
            tags = json.loads(row["tags_json"])
        except Exception:
            tags = []

    return VaultItem(
        id=row["id"],
        type=row["type"],
        title=row["title"],
        category_id=row["category_id"],
        tags=tags,
        is_favorite=bool(row["is_favorite"]),
        payload=decrypted_payload,
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.get("", response_model=dict)
def get_items(
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "title_asc",
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    query = "SELECT * FROM items WHERE 1=1"
    params = []

    if type and type != "all":
        query += " AND type = ?"
        params.append(type)

    if category_id:
        query += " AND category_id = ?"
        params.append(category_id)

    cursor = db.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()

    items: List[VaultItem] = []
    for row in rows:
        try:
            item = parse_db_item(row, master_key)
            items.append(item)
        except Exception:
            continue

    # Filter search query
    if search:
        s = search.lower()
        filtered_items = []
        for item in items:
            title_match = s in item.title.lower()
            tag_match = any(s in tag.lower() for tag in item.tags)
            payload_str = json.dumps(item.payload).lower()
            payload_match = s in payload_str
            if title_match or tag_match or payload_match:
                filtered_items.append(item)
        items = filtered_items

    # Sorting
    if sort == "title_asc":
        items.sort(key=lambda x: x.title.lower())
    elif sort == "title_desc":
        items.sort(key=lambda x: x.title.lower(), reverse=True)
    elif sort == "updated_desc":
        items.sort(key=lambda x: x.updated_at, reverse=True)
    elif sort == "created_desc":
        items.sort(key=lambda x: x.created_at, reverse=True)

    return success_response([item.model_dump() for item in items])

@router.post("", status_code=status.HTTP_217_CREATED if hasattr(status, "HTTP_217_CREATED") else 201)
def create_item(
    item_in: VaultItemCreate,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    item_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Payload model or dict to dict
    payload_dict = item_in.payload if isinstance(item_in.payload, dict) else item_in.payload.model_dump()
    encrypted_envelope = encrypt_payload(payload_dict, master_key)

    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO items (id, type, title, category_id, tags_json, is_favorite, encrypted_payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (
            item_id,
            item_in.type,
            item_in.title,
            item_in.category_id,
            json.dumps(item_in.tags),
            1 if item_in.is_favorite else 0,
            json.dumps(encrypted_envelope),
            now_iso,
            now_iso
        )
    )

    # Insert tags into tags table
    for tag in item_in.tags:
        cursor.execute("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?);", (str(uuid.uuid4()), tag))

    db.commit()

    created_item = VaultItem(
        id=item_id,
        type=item_in.type,
        title=item_in.title,
        category_id=item_in.category_id,
        tags=item_in.tags,
        is_favorite=item_in.is_favorite,
        payload=payload_dict,
        created_at=now_iso,
        updated_at=now_iso
    )

    return success_response(created_item.model_dump())

@router.put("/{item_id}")
def update_item(
    item_id: str,
    item_in: VaultItemUpdate,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ?;", (item_id,))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ITEM_NOT_FOUND", "message": f"Vault item with ID {item_id} not found."}
        )

    current_item = parse_db_item(row, master_key)

    new_title = item_in.title if item_in.title is not None else current_item.title
    new_category_id = item_in.category_id if item_in.category_id is not None else current_item.category_id
    new_tags = item_in.tags if item_in.tags is not None else current_item.tags
    new_is_favorite = item_in.is_favorite if item_in.is_favorite is not None else current_item.is_favorite
    
    if item_in.payload is not None:
        new_payload = item_in.payload if isinstance(item_in.payload, dict) else item_in.payload.model_dump()
    else:
        new_payload = current_item.payload

    now_iso = datetime.now(timezone.utc).isoformat()
    new_encrypted_envelope = encrypt_payload(new_payload, master_key)

    cursor.execute(
        """
        UPDATE items
        SET title = ?, category_id = ?, tags_json = ?, is_favorite = ?, encrypted_payload = ?, updated_at = ?
        WHERE id = ?;
        """,
        (
            new_title,
            new_category_id,
            json.dumps(new_tags),
            1 if new_is_favorite else 0,
            json.dumps(new_encrypted_envelope),
            now_iso,
            item_id
        )
    )

    for tag in new_tags:
        cursor.execute("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?);", (str(uuid.uuid4()), tag))

    db.commit()

    updated_item = VaultItem(
        id=item_id,
        type=current_item.type,
        title=new_title,
        category_id=new_category_id,
        tags=new_tags,
        is_favorite=new_is_favorite,
        payload=new_payload,
        created_at=current_item.created_at,
        updated_at=now_iso
    )

    return success_response(updated_item.model_dump())

@router.delete("/{item_id}")
def delete_item(
    item_id: str,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM items WHERE id = ?;", (item_id,))
    if not cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ITEM_NOT_FOUND", "message": f"Vault item with ID {item_id} not found."}
        )

    cursor.execute("DELETE FROM items WHERE id = ?;", (item_id,))
    db.commit()

    return success_response({"id": item_id})
