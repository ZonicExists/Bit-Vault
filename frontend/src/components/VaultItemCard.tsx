import React from 'react';
import { Star, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { VaultItem as VaultItemType, LoginPayload } from '../types';
import { useVault } from '../context/VaultContext';
import { apiService } from '../services/api';

interface VaultItemCardProps {
  item: VaultItemType;
  onEdit: (item: VaultItemType) => void;
  onRefresh: () => void;
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({ item, onEdit, onRefresh }) => {
  const { setError } = useVault();

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '👤';
      case 'note':
        return '📝';
      case 'card':
        return '💳';
      default:
        return '📦';
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.title}"?`)) {
      try {
        await apiService.deleteItem(item.id);
        onRefresh();
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  const handleFavorite = async () => {
    try {
      await apiService.updateItem(item.id, { is_favorite: !item.is_favorite });
      onRefresh();
    } catch (err) {
      setError('Failed to update favorite');
    }
  };

  const getItemPreview = () => {
    switch (item.type) {
      case 'login': {
        const payload = item.payload as LoginPayload;
        return `${payload.username}`;
      }
      case 'note': {
        const payload = item.payload as any;
        return payload.content.substring(0, 50) + '...';
      }
      case 'card': {
        const payload = item.payload as any;
        return `••••${payload.card_number.slice(-4)}`;
      }
      default:
        return '';
    }
  };

  return (
    <div className="bg-vault-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border-l-4 border-vault-emerald">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{getItemIcon(item.type)}</span>
            <div>
              <h3 className="font-semibold text-vault-dark truncate">{item.title}</h3>
              <p className="text-xs text-vault-gray">{item.type.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={handleFavorite}
            className="p-1 hover:bg-vault-light rounded transition"
          >
            <Star
              className={`w-5 h-5 ${item.is_favorite ? 'fill-vault-amber text-vault-amber' : 'text-vault-gray'}`}
            />
          </button>
        </div>

        {/* Preview */}
        <p className="text-sm text-vault-slate mb-3 font-mono">{getItemPreview()}</p>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="bg-vault-blue/10 text-vault-blue text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-vault-light">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 bg-vault-blue/10 text-vault-blue hover:bg-vault-blue/20 px-3 py-2 rounded text-sm font-medium transition"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-vault-red/10 text-vault-red rounded transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
