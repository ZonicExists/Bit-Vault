from typing import Literal, Optional, Any, Union
from pydantic import BaseModel, Field

ItemType = Literal['login', 'totp', 'note', 'card']

class LoginPayload(BaseModel):
    username: str
    password: str
    url: Optional[str] = None
    notes: Optional[str] = None

class TotpPayload(BaseModel):
    secret: str
    account_name: Optional[str] = None

class NotePayload(BaseModel):
    content: str

class CardPayload(BaseModel):
    cardholder_name: str
    card_number: str
    expiry_month: str
    expiry_year: str
    cvv: str
    pin: Optional[str] = None

class VaultItemCreate(BaseModel):
    type: ItemType
    title: str
    category_id: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    is_favorite: bool = False
    payload: Union[LoginPayload, TotpPayload, NotePayload, CardPayload, dict]

class VaultItemUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[list[str]] = None
    is_favorite: Optional[bool] = None
    payload: Optional[Union[LoginPayload, NotePayload, CardPayload, dict]] = None

class VaultItem(BaseModel):
    id: str
    type: ItemType
    title: str
    category_id: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    is_favorite: bool = False
    payload: Union[LoginPayload, NotePayload, CardPayload, dict]
    created_at: str
    updated_at: str

class VaultFile(BaseModel):
    id: str
    original_name: str
    file_size: int
    mime_type: str
    encrypted_path: str
    created_at: str

class Category(BaseModel):
    id: str
    name: str
    color: str
    icon: str

class CategoryCreate(BaseModel):
    name: str
    color: str
    icon: str

class Tag(BaseModel):
    id: str
    name: str

class SessionStatus(BaseModel):
    is_unlocked: bool
    is_initialized: bool
    auto_lock_minutes: int
    unlocked_at: Optional[str] = None

class SetupRequest(BaseModel):
    master_password: str

class UnlockRequest(BaseModel):
    master_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
