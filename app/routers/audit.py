import json
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.db.database import get_db
from app.crypto.aes_gcm import decrypt_payload
from app.middleware.auth_middleware import require_unlocked_vault
from app.models.responses import success_response

router = APIRouter(prefix="/api/audit", tags=["Security Audit"])

def is_password_weak(pwd: str) -> bool:
    if len(pwd) < 12:
        return True
    has_digit = any(c.isdigit() for c in pwd)
    has_upper = any(c.isupper() for c in pwd)
    has_lower = any(c.islower() for c in pwd)
    has_symbol = any(not c.isalnum() for c in pwd)
    categories = sum([has_digit, has_upper, has_lower, has_symbol])
    return categories < 3

@router.get("/security-score")
def get_security_score(
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT id, title, type, encrypted_payload, updated_at FROM items;")
    rows = cursor.fetchall()

    total_items = len(rows)
    weak_items = []
    passwords_map: Dict[str, List[Dict[str, str]]] = {}
    stale_items = []

    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(days=180)

    for row in rows:
        try:
            env = json.loads(row["encrypted_payload"])
            payload = decrypt_payload(env, master_key)
        except Exception:
            continue

        pwd = None
        if isinstance(payload, dict):
            pwd = payload.get("password") or payload.get("pin") or payload.get("cvv")

        if pwd:
            if is_password_weak(pwd):
                weak_items.append({
                    "id": row["id"],
                    "title": row["title"],
                    "reason": "Password length is under 12 characters or lacks complexity."
                })

            if pwd not in passwords_map:
                passwords_map[pwd] = []
            passwords_map[pwd].append({"id": row["id"], "title": row["title"]})

        if row.get("updated_at"):
            try:
                updated_dt = datetime.fromisoformat(row["updated_at"])
                if updated_dt < stale_cutoff:
                    stale_items.append({
                        "id": row["id"],
                        "title": row["title"],
                        "last_updated": row["updated_at"]
                    })
            except Exception:
                pass

    reused_groups = []
    for pwd, item_list in passwords_map.items():
        if len(item_list) > 1:
            reused_groups.append({
                "count": len(item_list),
                "items": item_list
            })

    # Score calculation algorithm
    score = 100
    weak_deduction = min(len(weak_items) * 10, 40)
    reused_deduction = min(len(reused_groups) * 15, 40)
    stale_deduction = min(len(stale_items) * 5, 20)

    score = max(0, score - weak_deduction - reused_deduction - stale_deduction)

    return success_response({
        "score": score,
        "total_items": total_items,
        "weak_passwords_count": len(weak_items),
        "reused_passwords_count": len(reused_groups),
        "stale_passwords_count": len(stale_items),
        "issues": {
            "weak_passwords": weak_items,
            "reused_passwords": reused_groups,
            "stale_passwords": stale_items
        }
    })
