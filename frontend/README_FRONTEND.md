# 🔐 Secure Vault - Frontend

A modern, minimalistic password vault web application built with React and TypeScript.

## 🎨 Design Highlights

- **Minimalistic Color Palette**: Clean, modern design with intuitive UI
  - Deep Navy Dark: `#1A1D23` (Primary background)
  - Emerald Green: `#10B981` (Actions & success)
  - Slate Gray: `#64748B` (Secondary text)
  - Warm Amber: `#F59E0B` (Alerts & warnings)

- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Filtering**: Search and filter items by type and category
- **Secure UI**: Password visibility toggles, never logs sensitive data

## 📋 Prerequisites

- **Node.js** v14+ and npm
- **Backend API** running at `http://localhost:4000/api` (see Backend Contract in `FRONTEND_CONTRACT.md`)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd vault-frontend
npm install
```

### 2. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`.

### 3. Build for Production

```bash
npm run build
```

## 📦 Project Structure

```
src/
├── components/           # React components
│   ├── UnlockPage.tsx    # Vault unlock authentication
│   ├── Dashboard.tsx     # Main vault dashboard
│   ├── VaultItemCard.tsx # Individual item card
│   ├── ItemModal.tsx     # Add/edit item modal
│   ├── TopBar.tsx        # Navigation bar
│   ├── Sidebar.tsx       # Filters sidebar
│   ├── SettingsModal.tsx # Settings & backup
│   └── index.ts          # Component exports
├── context/              # Global state management
│   └── VaultContext.tsx  # Vault state provider
├── services/             # API integration
│   └── api.ts            # API client service
├── types/                # TypeScript type definitions
│   └── index.ts          # All type definitions
├── App.tsx               # Root component
├── App.css               # App styles
├── index.css             # Global styles (Tailwind)
└── index.tsx             # React entry point
```

## 🔌 API Integration

All API communication is handled through `src/services/api.ts`. The service communicates with:

- **Base URL**: configurable via environment variable `REACT_APP_API_URL` (default `http://127.0.0.1:4000`). Example: `REACT_APP_API_URL=https://untapped-snipping-unsaved.ngrok-free.dev` or `REACT_APP_API_URL=http://127.0.0.1:4000`
- **Auth Endpoints**: Unlock, lock, status, change password
- **Item Endpoints**: CRUD operations for vault items
- **File Endpoints**: Upload, download, delete files
- **Category Endpoints**: Manage item categories
- **Settings Endpoints**: User preferences, backup/restore

### Response Format

All API responses follow the standard envelope:

```typescript
{
  "success": true,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error"
  }
}
```

## 🎯 Features

### Authentication
- 🔐 Master password unlock
- 🔒 Session-based locking
- ⏰ Auto-lock timer
- 🔄 Change master password

### Vault Items
- **Login**: Store username, password, URL, notes
- **Note**: Store secure text notes
- **Card**: Store payment card details

### Organization
- 🏷️ Tags for custom organization
- 📁 Categories with color coding
- 🔍 Real-time search
- ⭐ Favorite items

### Security
- 🔐 End-to-end encrypted storage
- 📋 Secure clipboard management
- 💾 Export/import encrypted backups
- 🛡️ Secure password change

### Settings
- ⏱️ Configurable auto-lock
- 📋 Clipboard auto-clear timer
- 💾 Vault backup & restore
- 🔐 Master password management

## 🛠️ Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🎨 Tailwind Configuration

Custom colors defined in `tailwind.config.js`:

```javascript
colors: {
  vault: {
    dark: '#1A1D23',      // Primary dark background
    white: '#FFFFFF',     // Cards & light backgrounds
    emerald: '#10B981',   // Success & primary actions
    red: '#DC2626',       // Danger & deletion
    amber: '#F59E0B',     // Warnings & alerts
    slate: '#64748B',     // Secondary text
    light: '#E5E7EB',     // Borders & dividers
    gray: '#9CA3AF',      // Disabled & tertiary text
    blue: '#0EA5E9',      // Links & secondary actions
    purple: '#8B5CF6',    // Highlights & categories
  }
}
```

## 📝 Environment Variables

The backend API URL is hardcoded to `http://localhost:4000/api`. To change this:

Edit `src/services/api.ts`:

```typescript
private baseURL = 'http://localhost:4000/api'; // Change here
```

For production, consider moving this to environment variables.

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 📚 Usage Examples

### Unlocking the Vault

```
1. Enter master password on unlock screen
2. Click "Unlock Vault" button
3. Dashboard loads with your items
```

### Creating a New Item

```
1. Click "New Item" button
2. Select item type (Login, Note, or Card)
3. Fill in required fields
4. Add tags and category (optional)
5. Click "Save Item"
```

### Searching Items

```
1. Use search bar in top navigation
2. Results filter in real-time
3. Clear search to show all items
```

### Exporting Backup

```
1. Click Settings (gear icon)
2. Navigate to "Backup" tab
3. Click "Export Vault"
4. Save the `.vault` file securely
```

## 🔒 Security Notes

- ⚠️ Never commit `.env` files with secrets
- ⚠️ Always use HTTPS in production
- ⚠️ Keep backups in secure locations
- ⚠️ Master password cannot be recovered if forgotten
- ⚠️ Sensitive data (passwords, cards) is handled carefully but client-side encryption is your responsibility

## 🐛 Troubleshooting

### API Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:4000
```

**Solution**: Ensure backend is running on `http://localhost:4000`

### CORS Issues

**Solution**: Backend should have CORS enabled for `http://localhost:3000`

### Tailwind Styles Not Loading

**Solution**: Ensure `npm install` completed and `npm start` rebuild the CSS

## 🤝 Contributing

To add new features:

1. Create components in `src/components/`
2. Define types in `src/types/index.ts`
3. Add API methods to `src/services/api.ts`
4. Update context if needed in `src/context/VaultContext.tsx`

## 📄 License

Part of the Secure Vault project.

---

**Made with ❤️ for secure password management**
