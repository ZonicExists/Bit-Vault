import uuid
import sqlite3
from fastapi import APIRouter, Depends, status
from app.db.database import get_db
from app.middleware.auth_middleware import require_unlocked_vault
from app.models.schemas import Category, CategoryCreate, Tag
from app.models.responses import success_response

router = APIRouter(prefix="", tags=["Categories & Tags"])

@router.get("/api/categories")
def get_categories(
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM categories;")
    rows = cursor.fetchall()
    categories = [Category(**row).model_dump() for row in rows]
    return success_response(categories)

@router.post("/api/categories", status_code=201)
def create_category(
    cat_in: CategoryCreate,
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cat_id = f"cat_{uuid.uuid4().hex[:8]}"
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?);",
        (cat_id, cat_in.name, cat_in.color, cat_in.icon)
    )
    db.commit()

    category = Category(id=cat_id, name=cat_in.name, color=cat_in.color, icon=cat_in.icon)
    return success_response(category.model_dump())

@router.get("/api/tags")
def get_tags(
    db: sqlite3.Connection = Depends(get_db),
    master_key: bytes = Depends(require_unlocked_vault)
):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM tags;")
    rows = cursor.fetchall()
    tags = [Tag(**row).model_dump() for row in rows]
    return success_response(tags)
