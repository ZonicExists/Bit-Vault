import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { VaultItem, ItemType, LoginPayload, TotpPayload, NotePayload, CardPayload } from '../types';
import { apiService } from '../services/api';
import { useVault } from '../context/VaultContext';

interface ItemModalProps {
  item?: VaultItem | null;
  defaultType?: ItemType;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, defaultType = 'login', isOpen, onClose, onSave }) => {
  const [itemType, setItemType] = useState<ItemType>('login');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const { categories, filterCategory, setError: setContextError } = useVault();

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setTitle(item.title);
        setItemType(item.type);
        setTags(item.tags);
        setCategoryId(item.category_id);

        if (item.type === 'login') {
          const payload = item.payload as LoginPayload;
          setUsername(payload.username);
          setPassword(payload.password);
          setUrl(payload.url || '');
          setNotes(payload.notes || '');
        } else if (item.type === 'totp') {
          const payload = item.payload as any;
          setTotpSecret(payload.secret || '');
          setUsername(payload.account_name || '');
        } else if (item.type === 'note') {
          const payload = item.payload as NotePayload;
          setNoteContent(payload.content);
        } else if (item.type === 'card') {
          const payload = item.payload as CardPayload;
          setCardholder(payload.cardholder_name);
          setCardNumber(payload.card_number);
          setExpiryMonth(payload.expiry_month);
          setExpiryYear(payload.expiry_year);
          setCvv(payload.cvv);
        }
      } else {
        // Reset form for creating new item and pre-select current section itemType and category
        setItemType(defaultType || 'login');
        setTitle('');
        setTags([]);
        setTagInput('');
        setCategoryId(filterCategory || (categories.length > 0 ? categories[0].id : null));
        setUsername('');
        setPassword('');
        setUrl('');
        setNotes('');
        setTotpSecret('');
        setNoteContent('');
        setCardholder('');
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvv('');
        setError('');
      }
    }
  }, [item, isOpen, defaultType, filterCategory, categories]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      let payload: LoginPayload | TotpPayload | NotePayload | CardPayload;

      if (itemType === 'login') {
        payload = { username, password, url, notes };
      } else if (itemType === 'totp') {
        if (!totpSecret.trim()) {
          setError('Base32 Secret Key is required');
          setIsLoading(false);
          return;
        }
        payload = { secret: totpSecret.trim(), account_name: username.trim() || undefined };
      } else if (itemType === 'note') {
        payload = { content: noteContent };
      } else {
        payload = {
          cardholder_name: cardholder,
          card_number: cardNumber,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv,
        };
      }

      const itemData = {
        type: itemType,
        title,
        category_id: categoryId,
        tags,
        is_favorite: item?.is_favorite || false,
        payload,
      };

      if (item) {
        await apiService.updateItem(item.id, itemData);
      } else {
        await apiService.createItem(itemData as any);
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save item';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {item ? 'Edit Item' : 'New Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {/* Item Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['login', 'totp', 'note', 'card'] as ItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setItemType(type)}
                  className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition truncate border ${
                    itemType === type
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {type === 'login' ? '👤 Login' : type === 'totp' ? '🔑 2FA' : type === 'note' ? '📝 Note' : '💳 Card'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GitHub Account"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500 shadow-inner"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Category
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-bold text-white shadow-inner"
            >
              <option value="" className="bg-slate-900 text-white">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500 shadow-inner"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-red-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {itemType === 'login' && (
            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {itemType === 'totp' && (
            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Base32 Secret Key *
                </label>
                <input
                  type="text"
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ''))}
                  placeholder="BASE32 SECRET KEY (E.G. JBSWY3DPEHPK3PXP)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-mono uppercase text-xs font-bold text-emerald-400 placeholder-slate-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Enter your Base32 2FA secret key to generate live 6-digit authenticator codes.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Account / Username (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {itemType === 'note' && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Content
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here..."
                rows={6}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
              />
            </div>
          )}

          {itemType === 'card' && (
            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholder}
                  onChange={(e) => setCardholder(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs font-medium text-white placeholder-slate-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Month
                  </label>
                  <input
                    type="text"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    placeholder="MM"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    placeholder="YYYY"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs font-medium text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl disabled:opacity-50 transition text-xs shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
