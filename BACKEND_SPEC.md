# ⚙️ Custom Vault Project - Backend Developer Handoff Specification

> **Target Audience**: Backend & Security Developer (Developer A)  
> **Goal**: Build the secure cryptographic engine, SQLite database models, `.vault` storage container, and API endpoints to power the Custom Vault application.

---

## 🛠️ 1. Tech Stack & Dependencies

- **Runtime**: Node.js (v18+) or Python (Flask/FastAPI)
- **Database**: SQLite3 (`sqlite3` / `better-sqlite3` / Prisma / Knex)
- **Cryptography**: Native Node `crypto` library (PBKDF2, AES-256-GCM)
- **Server Framework**: Express.js or Fastify
- **Environment**: `dotenv`

```bash
# Recommended Node.js setup
npm init -y
npm install express cors dotenv better-sqlite3 multer uuid
npm install -D nodemon jest supertest
```

---

## 🔑 2. Cryptographic Engine Specification (`src/crypto/`)

### Key Derivation (`pbkdf2.js`)
```javascript
const crypto = require('crypto');

function deriveMasterKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      100000, // 100k iterations
      32,     // 256 bits
      'sha256',
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey); // Buffer
      }
    );
  });
}
```

### AES-256-GCM Encryption / Decryption (`aesGcm.js`)
```javascript
function encryptPayload(plaintext, masterKey) {
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  
  let ciphertext = cipher.update(JSON.stringify(plaintext), 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    authTag: authTag,
    ciphertext: ciphertext
  };
}

function decryptPayload(encryptedEnvelope, masterKey) {
  const { iv, authTag, ciphertext } = encryptedEnvelope;
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, Buffer.from(iv, 'hex'));
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

### Memory Cleanup (`memClean.js`)
```javascript
function zeroBuffer(buf) {
  if (Buffer.isBuffer(buf)) {
    buf.fill(0);
  }
}
```

---

## 🗄️ 3. SQLite Database Schema (`src/db/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS vault_meta (
  id INTEGER PRIMARY KEY DEFAULT 1,
  salt TEXT NOT NULL,
  verification_envelope TEXT NOT NULL, -- Encrypted string "VAULT_VALID" to test password
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'login' | 'note' | 'card'
  title TEXT NOT NULL,
  category_id TEXT,
  tags_json TEXT DEFAULT '[]',
  is_favorite INTEGER DEFAULT 0,
  encrypted_payload TEXT NOT NULL, -- Encrypted JSON string of LoginPayload/NotePayload/CardPayload
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  encrypted_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 4. API Controllers & Routes

### Auth Controller (`src/controllers/authController.js`)
- `POST /api/auth/unlock`: Accepts `{ master_password }`. Derives key using stored salt, decrypts `verification_envelope`. If valid, stores master key in memory session and returns `{ success: true }`.
- `POST /api/auth/lock`: Wipes master key buffer from memory, returns `{ success: true }`.
- `GET /api/auth/status`: Checks if memory session key is active.
- `POST /api/auth/change-password`: Accepts `{ current_password, new_password }`. Re-encrypts all items with new derived master key.

### Items Controller (`src/controllers/itemController.js`)
- `GET /api/items`: Reads items from SQLite, decrypts payload for each item using active memory session key, returns array of `VaultItem`.
- `POST /api/items`: Encrypts `payload` with memory session key, inserts into SQLite `items` table.
- `PUT /api/items/:id`: Updates fields, re-encrypts payload, updates `updated_at`.
- `DELETE /api/items/:id`: Deletes item record from DB.

### File Controller (`src/controllers/fileController.js`)
- `POST /api/files/upload`: Streams uploaded file bytes through `crypto.createCipheriv('aes-256-gcm')` to `./data/uploads/file_id.enc`. Saves file metadata record in SQLite.
- `GET /api/files/:id/download`: Reads `.enc` file, streams through `crypto.createDecipheriv`, pipes decrypted stream to HTTP response.

---

## 🎯 5. Backend Checklist & Deliverables

- [ ] Setup Express server with CORS & JSON body parsing middleware.
- [ ] Create `schema.sql` runner & SQLite initialization logic.
- [ ] Implement `pbkdf2.js` & `aesGcm.js` cryptographic modules.
- [ ] Build `/api/auth/unlock`, `/api/auth/lock`, and `/api/auth/status` endpoints.
- [ ] Build `/api/items` CRUD endpoints with transparent payload encryption/decryption.
- [ ] Build streaming encrypted upload and download controllers for files.
- [ ] Write unit tests verifying encryption roundtrips & authentication error handling.
