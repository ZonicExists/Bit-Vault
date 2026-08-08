# Custom Vault Project - Dual Frontend & Backend Roadmap

> A secure, encrypted, personal vault to store your data (notes, files, passwords, credit cards, etc.)

---

## 🏗️ Architecture & Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (UI & UX)                               │
│                                                                             │
│   ┌────────────────┐      ┌─────────────────┐      ┌────────────────────┐   │
│   │ 🔐 Lock Screen │      │ 📊 Dashboard    │      │ 📝 Item Modal &    │   │
│   │                │      │ - Items List    │      │    Password Gen    │   │
│   │ - Master Pass  │      │ - Search Bar    │      │ - Reveal Password  │   │
│   │ - Unlock State │      │ - Filters/Tags  │      │ - Auto-clear copy  │   │
│   └───────┬────────┘      └────────┬────────┘      └─────────┬──────────┘   │
│           │                        │                         │              │
│   ┌───────┴────────────────────────┴─────────────────────────┴──────────┐   │
│   │                    📁 File Manager & Settings UI                    │   │
│   └────────────────────────────────┬────────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ API / IPC Transport Layer
┌────────────────────────────────────┼────────────────────────────────────────┐
│                                    v                                        │
│                           BACKEND & SECURITY ENGINE                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🔑 Cryptographic Engine: PBKDF2 Key Derivation + AES-256-GCM       │   │
│   └────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                        │
│   ┌────────────────────────────────┴────────────────────────────────────┐   │
│   │  🗄️ SQLite Encrypted Database + Storage Container (.vault)           │   │
│   └────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                        │
│   ┌────────────────────────────────┴────────────────────────────────────┐   │
│   │  ⏱️ Auto-Lock Timer + Memory Hygiene (Wipe key buffers on lock)     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ BACKEND ROADMAP

### Phase B1: Cryptographic Engine Core (`/backend/src/crypto/`)
- [ ] **PBKDF2 Module**: 256-bit Key derivation from Master Password + 16-byte random Salt (SHA-256, 100,000+ iterations).
- [ ] **AES-256-GCM Engine**: Payload encryption/decryption with random 12-byte IV and 16-byte authentication tag verification.
- [ ] **Memory Hygiene Engine**: Zeroing raw key buffers in memory immediately upon vault lock or session termination.

### Phase B2: Storage Format & Container (`/backend/src/storage/`)
- [ ] **`.vault` File Specification**: Binary/JSON header parser (Magic Header, Salt, IV, Auth Tag, Verification Ciphertext).
- [ ] **Atomic File Writer**: Temporary file write + atomic rename mechanism to prevent vault corruption.

### Phase B3: Database & Persistence (`/backend/src/db/`)
- [ ] **SQLite Schema**: Tables for `items`, `files`, `categories`, `tags`, `item_tags`, and `vault_meta`.
- [ ] **Database Access Layer**: Encrypted payload storage, indexed fields for fast lookup, transaction handling.

### Phase B4: Authentication & Session Controllers (`/backend/src/auth/`)
- [ ] **Lock/Unlock Handler**: Password verification via test ciphertext decryption & session key storage.
- [ ] **Inactivity Auto-Lock Watcher**: Auto-lock timer with configurable intervals (1m, 5m, 15m, 30m).

### Phase B5: API & File Controllers (`/backend/src/controllers/`)
- [ ] **Vault Items API**: `GET`, `POST`, `PUT`, `DELETE` handlers for items (Notes, Passwords, Credit Cards).
- [ ] **Streaming File Controller**: Chunked AES-256 streaming upload & download handlers.
- [ ] **Master Password Re-Keying**: Decrypt all records with old key, re-encrypt with new key derived from new password.

### Phase B6: Backup & Cloud Sync (`/backend/src/sync/`)
- [ ] **Local Backup Engine**: Export `.vault` snapshot file; restore parser.
- [ ] **Cloud Sync Adapters**: Optional GitHub Gist API / Google Drive sync module.

---

## 🎨 FRONTEND ROADMAP

### Phase F1: Design System & Components (`/frontend/src/styles/`)
- [ ] **CSS Design System**: Dark theme palette (Obsidian, Violet, Emerald), CSS Variables, glassmorphic card styles.
- [ ] **Common Component Library**: Buttons, Modal Drawers, Toast Notifications, Input Fields, Badges.

### Phase F2: Lock Screen (`/frontend/src/views/LockScreen/`)
- [ ] **Unlock Card UI**: Master password input, show/hide password toggle, lock icon state animation.
- [ ] **Auth Feedback**: Error toast, progress spinner, retry cooldown timer on failed attempts.

### Phase F3: Vault Dashboard Shell (`/frontend/src/views/Dashboard/`)
- [ ] **Sidebar Navigation**: Filter tabs (All Items, Passwords, Notes, Cards, Files, Settings), Lock Vault button.
- [ ] **Header**: Debounced search bar, item count gauge, cloud sync status indicator, auto-lock countdown timer.

### Phase F4: Vault Items & Interactive Views (`/frontend/src/views/Items/`)
- [ ] **Item List / Grid Component**: Item card grid with type icons, title, updated date, category pill.
- [ ] **Item Detail & Editor Modal**: Form view/edit, password strength meter, 8-64 char generator slider, one-click copy with 30s auto-clear toast.

### Phase F5: File Manager UI (`/frontend/src/views/FileManager/`)
- [ ] **Dropzone Component**: Drag-and-drop file uploader with progress bar.
- [ ] **Encrypted File List Table**: File size, mime type icons, on-the-fly decrypted download button, delete trigger.

### Phase F6: Settings & Backup UI (`/frontend/src/views/Settings/`)
- [ ] **Change Password Panel**: Old password validation, new password strength meter, re-encryption progress indicator.
- [ ] **Preferences & Backup Panel**: Auto-lock timeout slider, Export `.vault` snapshot button, Cloud Sync setup wizard.

---

*This roadmap provides a complete separation of Frontend and Backend workflows for the Custom Vault Project.*
