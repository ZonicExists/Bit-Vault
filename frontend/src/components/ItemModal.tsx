import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { VaultItem, ItemType, LoginPayload, NotePayload, CardPayload } from '../types';
import { apiService } from '../services/api';
import { useVault } from '../context/VaultContext';

interface ItemModalProps {
  item?: VaultItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, isOpen, onClose, onSave }) => {
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
  const [noteContent, setNoteContent] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const { categories, setError: setContextError } = useVault();

  useEffect(() => {
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
    }
  }, [item]);

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

      let payload: LoginPayload | NotePayload | CardPayload;

      if (itemType === 'login') {
        payload = { username, password, url, notes };
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-vault-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-vault-white border-b border-vault-light p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-vault-dark">
            {item ? 'Edit Item' : 'New Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-vault-light rounded transition"
          >
            <X className="w-6 h-6 text-vault-dark" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {error && (
            <div className="bg-vault-red/10 border border-vault-red text-vault-red px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-vault-dark mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['login', 'note', 'card'] as ItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setItemType(type)}
                  className={`py-2 px-3 rounded-lg font-medium transition ${
                    itemType === type
                      ? 'bg-vault-emerald text-vault-white'
                      : 'bg-vault-light text-vault-dark hover:bg-gray-300'
                  }`}
                >
                  {type === 'login' ? '👤 Login' : type === 'note' ? '📝 Note' : '💳 Card'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-vault-dark mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GitHub Account"
              className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-vault-dark mb-2">
              Category
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-vault-dark mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-vault-blue text-vault-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-vault-blue/10 text-vault-blue px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-vault-blue font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {itemType === 'login' && (
            <div className="space-y-4 bg-vault-light/30 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>
            </div>
          )}

          {itemType === 'note' && (
            <div className="bg-vault-light/30 p-4 rounded-lg">
              <label className="block text-sm font-medium text-vault-dark mb-2">
                Content
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here..."
                rows={6}
                className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
              />
            </div>
          )}

          {itemType === 'card' && (
            <div className="space-y-4 bg-vault-light/30 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholder}
                  onChange={(e) => setCardholder(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vault-dark mb-2">
                    Month
                  </label>
                  <input
                    type="text"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    placeholder="MM"
                    className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vault-dark mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    placeholder="YYYY"
                    className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vault-dark mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-vault-light">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-vault-light text-vault-dark rounded-lg hover:bg-vault-light transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-vault-emerald text-vault-white rounded-lg hover:bg-emerald-600 disabled:bg-vault-gray transition"
            >
              {isLoading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
