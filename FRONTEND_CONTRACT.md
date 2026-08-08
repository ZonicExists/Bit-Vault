# 📌 Frontend Integration Contract (Variables & API Routes)

> **Note for Frontend Developer**: You have full freedom to design the UI, CSS, frameworks, and component structure however you like!  
> This document lists **ONLY the mandatory variable names, data types, and API endpoints** you need to use so your frontend communicates seamlessly with the backend.

---

## 1. 🌐 API Base URL & Standard Response Format

- **Base URL**: `http://localhost:4000/api`

### Standard Response Envelope
All API responses return this JSON format:
```json
{
  "success": true,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE_NAME",
    "message": "Human readable error description"
  }
}
```

---

## 2. 📦 Data Types & Variable Names

Use these exact variable names and types in your state / API models:

### Vault Item (`VaultItem`)
```typescript
type ItemType = 'login' | 'note' | 'card';

interface VaultItem {
  id: string;                      // e.g. "550e8400-e29b-41d4-a716-446655440000"
  type: ItemType;                  // 'login' | 'note' | 'card'
  title: string;                   // Item name e.g. "GitHub Account"
  category_id: string | null;      // Category ID or null
  tags: string[];                  // e.g. ["Work", "Personal"]
  is_favorite: boolean;            // true / false
  payload: LoginPayload | NotePayload | CardPayload;
  created_at: string;              // ISO string e.g. "2026-08-08T12:00:00Z"
  updated_at: string;
}

// 1. Login Item Payload
interface LoginPayload {
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

// 2. Note Item Payload
interface NotePayload {
  content: string;
}

// 3. Card Item Payload
interface CardPayload {
  cardholder_name: string;
  card_number: string;
  expiry_month: string; // "08"
  expiry_year: string;  // "2028"
  cvv: string;
  pin?: string;
}
```

### Vault File (`VaultFile`)
```typescript
interface VaultFile {
  id: string;
  original_name: string;   // e.g. "passport.pdf"
  file_size: number;       // Size in bytes
  mime_type: string;       // e.g. "application/pdf"
  created_at: string;
}
```

### Category (`Category`) & Tag (`Tag`)
```typescript
interface Category {
  id: string;
  name: string;      // e.g. "Finance"
  color: string;     // Hex color code e.g. "#10b981"
  icon: string;      // Icon name e.g. "credit-card"
}

interface Tag {
  id: string;
  name: string;      // e.g. "Urgent"
}
```

### Settings & Session
```typescript
interface VaultSettings {
  auto_lock_minutes: number;             // e.g. 15 (0 = disabled)
  clipboard_auto_clear_seconds: number; // e.g. 30
}

interface SessionStatus {
  is_unlocked: boolean;
  auto_lock_minutes: number;
}
```

---

## 🔌 3. Required API Endpoints

### 🔐 Auth Endpoints

| Method | Endpoint | Request Body | Response `data` |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/unlock` | `{ "master_password": "string" }` | `{ "is_unlocked": true, "auto_lock_minutes": 15 }` |
| `POST` | `/api/auth/lock` | `{}` | `{ "is_unlocked": false }` |
| `GET` | `/api/auth/status` | `None` | `{ "is_unlocked": boolean, "auto_lock_minutes": number }` |
| `POST` | `/api/auth/change-password` | `{ "current_password": "string", "new_password": "string" }` | `{ "message": "Vault re-encrypted successfully." }` |

---

### 📦 Vault Items Endpoints

| Method | Endpoint | Query / Body | Response `data` |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/items` | Query: `?type=login&category_id=x&search=query&sort=title_asc` | `VaultItem[]` |
| `GET` | `/api/items/:id` | `None` | `VaultItem` |
| `POST` | `/api/items` | Body: `VaultItem` object (without `id`, `created_at`) | `VaultItem` (Created object with ID) |
| `PUT` | `/api/items/:id` | Body: `Partial<VaultItem>` | `VaultItem` (Updated object) |
| `DELETE` | `/api/items/:id` | `None` | `{ "id": "deleted_item_id" }` |

---

### 📁 File Manager Endpoints

| Method | Endpoint | Request Payload | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/files/upload` | `FormData` with field key `"file"` | `{ "success": true, "data": VaultFile }` |
| `GET` | `/api/files/:id/download` | `None` | Binary File Download Stream |
| `DELETE` | `/api/files/:id` | `None` | `{ "success": true, "data": { "id": "file_id" } }` |

---

### ⚙️ Categories & Settings Endpoints

| Method | Endpoint | Request / Response |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | Returns `Category[]` |
| `POST` | `/api/categories` | Body: `{ name, color, icon }` => Returns `Category` |
| `DELETE` | `/api/categories/:id` | Returns `{ "id": "category_id" }` |
| `GET` | `/api/settings` | Returns `VaultSettings` |
| `PUT` | `/api/settings` | Body: `Partial<VaultSettings>` => Returns `VaultSettings` |
| `POST` | `/api/settings/export` | Triggers `.vault` backup file download |
| `POST` | `/api/settings/import` | `FormData` with key `"vault_file"` => Returns `{ success: true }` |

---

## ⚡ 4. Quick Summary Checklist for Frontend Dev

1. Base API URL: `http://localhost:4000/api`
2. Unlock with `POST /api/auth/unlock` (`master_password`).
3. Fetch items with `GET /api/items`.
4. Send item payloads strictly matching `LoginPayload`, `NotePayload`, or `CardPayload`.
5. Upload files using `POST /api/files/upload` with FormData key `"file"`.
