# Bit Vault — Zero-Knowledge Password & Encrypted File Vault 🛡️

**Bit Vault** is a state-of-the-art, open-source personal password manager and encrypted document vault built with a modern dark glassmorphic interface, zero-knowledge AES-256-GCM encryption, live TOTP 2FA code generation, and k-Anonymity password breach auditing.

---

## ✨ Features

### 🔒 Zero-Knowledge Security Architecture
- **PBKDF2 Key Derivation**: Master passwords are key-stretched using 100,000 PBKDF2 iterations with unique salts.
- **AES-256-GCM Encryption**: All sensitive payloads (passwords, notes, payment details, uploaded files) are encrypted using AES-256-GCM authenticated encryption.
- **Auto-Lock Session Protection**: Automatically locks after configurable inactivity periods or on manual lock command.

---

### 📂 Vault Management
- 👤 **Login Credentials**: Store web accounts with username, website URLs, and inline password toggles (`👁️`).
- 🔑 **Live 2FA Authenticator**: RFC 6238 TOTP code generation computed locally with real-time 30-second countdown progress bars.
- 📝 **Encrypted Notes**: Store private text, API keys, and formatted notes securely.
- 💳 **Payment Cards**: Keep credit card numbers, expiry dates, and CVVs encrypted.
- 📁 **Encrypted Storage Hub**: Drag-and-drop file manager that encrypts documents with AES-256 before writing to disk, offering file type filters, size analytics, and 1-click decrypted file downloads.

---

### 🛠️ Integrated Security Hub
- 🎲 **Cryptographic Password Generator**: Customizable length slider, character sets, entropy rating (bits), and estimated crack time stats.
- 🛡️ **Pwned Password Lookup**: Integrates k-Anonymity API (sending only the first 5 SHA-1 hash characters) to check if passwords have been exposed in data breaches.
- 📊 **Security Score Audit**: Audits your vault for weak passwords, duplicate credentials across accounts, and stale items untouched for >180 days.

---

### 📱 Responsive Glassmorphic UI
- **Modern Cyber Aesthetic**: Built using Tailwind CSS, backdrop blur effects, vibrant status indicators, and clean monospaced security typography.
- **Mobile & Tablet Floating Navigation**: Features a fixed bottom navigation bar and slide-up category drawer for phones and tablets.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 16+** & **npm**

---

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/ZonicExists/Bit-Vault.git
cd Bit-Vault

# Create python virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --port 4000 --host 0.0.0.0
```

---

### 3. Frontend Setup
```bash
# Open a new terminal tab and navigate to frontend directory
cd Bit-Vault/frontend

# Install dependencies
npm install

# Build production assets or launch development server
npm run build
```

The application will be served at `http://localhost:4000`.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, FastAPI, SQLite, PyCryptodome (AES-256-GCM), Pydantic
- **Frontend**: React (TypeScript), Tailwind CSS, Lucide Icons, Web Crypto API
- **Branding & Assets**: Standard SVG Icon system (`favicon.svg`)

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
