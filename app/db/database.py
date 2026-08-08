import os
import sqlite3
from typing import Generator
from app.config import settings

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def dict_factory(cursor, row):
    fields = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(fields, row)}

def get_db_connection() -> sqlite3.Connection:
    """
    Returns a connected SQLite database connection with row factory enabled.
    """
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db() -> None:
    """
    Initializes database tables from schema.sql and seeds default categories.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
        
    # Check if default categories exist
    cursor.execute("SELECT COUNT(*) as count FROM categories;")
    res = cursor.fetchone()
    if res and res["count"] == 0:
        cursor.executemany(
            "INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?);",
            [
                ("cat_personal", "Personal", "#3b82f6", "user"),
                ("cat_work", "Work", "#8b5cf6", "briefcase"),
                ("cat_finance", "Finance", "#10b981", "credit-card"),
                ("cat_social", "Social", "#f59e0b", "share-2"),
            ]
        )
        
    conn.commit()
    conn.close()

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """
    FastAPI dependency yielding SQLite database connection.
    """
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
