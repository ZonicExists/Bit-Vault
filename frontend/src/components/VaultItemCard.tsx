import React, { useState, useEffect } from 'react';
import { Star, Copy, Check, Trash2, Edit3, Key, FileText, CreditCard, Clock, ShieldCheck } from 'lucide-react';
import { VaultItem as VaultItemType, LoginPayload, CardPayload, NotePayload } from '../types';
import { useVault } from '../context/VaultContext';
import { apiService } from '../services/api';

function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output = new Uint8Array(Math.floor((clean.length * 5) / 8));
  let index = 0;

  for (let i = 0; i < clean.length; i++) {
    const charIndex = alphabet.indexOf(clean[i]);
    if (charIndex === -1) continue;
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output.slice(0, index);
}

async function computeTotpCode(secretBase32: string): Promise<string> {
  try {
    const keyBytes = base32Decode(secretBase32);
    if (keyBytes.length === 0) return '------';

    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep);

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, counter, false);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const sigBytes = new Uint8Array(signature);

    const offset = sigBytes[sigBytes.length - 1] & 0xf;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return `${otp.slice(0, 3)} ${otp.slice(3)}`;
  } catch (e) {
    return '------';
  }
}

interface VaultItemCardProps {
  item: VaultItemType;
  onEdit: (item: VaultItemType) => void;
  onRefresh: () => void;
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({ item, onEdit, onRefresh }) => {
  const { setError, categories } = useVault();
  const [copied, setCopied] = useState(false);

  const category = categories.find((c) => c.id === item.category_id);
  const totpSecret = item.type === 'totp'
    ? (item.payload as any).secret
    : item.type === 'login'
    ? (item.payload as any).totp_secret
    : undefined;

  const [liveTotpCode, setLiveTotpCode] = useState('------');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [copiedTotp, setCopiedTotp] = useState(false);

  useEffect(() => {
    if (!totpSecret) return;
    const timer = setInterval(() => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSecondsRemaining(sec);
    }, 1000);
    return () => clearInterval(timer);
  }, [totpSecret]);

  useEffect(() => {
    if (totpSecret) {
      computeTotpCode(totpSecret).then(setLiveTotpCode);
    }
  }, [totpSecret, secondsRemaining]);

  const handleCopy2FACode = () => {
    const cleanCode = liveTotpCode.replace(/\s+/g, '');
    if (cleanCode && cleanCode !== '------') {
      navigator.clipboard.writeText(cleanCode);
      setCopiedTotp(true);
      setTimeout(() => setCopiedTotp(false), 2000);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Key className="w-5 h-5 text-emerald-500" />;
      case 'totp':
        return <ShieldCheck className="w-5 h-5 text-teal-500" />;
      case 'note':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      default:
        return <Key className="w-5 h-5 text-slate-500" />;
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

  const handleCopySecret = () => {
    let textToCopy = '';
    if (item.type === 'login') {
      textToCopy = (item.payload as LoginPayload).password;
    } else if (item.type === 'totp') {
      textToCopy = (item.payload as any).secret;
    } else if (item.type === 'note') {
      textToCopy = (item.payload as NotePayload).content;
    } else if (item.type === 'card') {
      textToCopy = (item.payload as CardPayload).card_number;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getItemPreview = () => {
    switch (item.type) {
      case 'login': {
        const payload = item.payload as LoginPayload;
        return payload.username || 'No username';
      }
      case 'totp': {
        const payload = item.payload as any;
        return payload.account_name || '2FA Authenticator';
      }
      case 'note': {
        const payload = item.payload as NotePayload;
        return payload.content ? payload.content.substring(0, 40) + '...' : 'Empty note';
      }
      case 'card': {
        const payload = item.payload as CardPayload;
        return payload.card_number ? `•••• ${payload.card_number.slice(-4)}` : '•••• Card';
      }
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-slate-200/80 group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 bg-slate-100/80 rounded-lg group-hover:bg-slate-200/70 transition">
              {getItemIcon(item.type)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-800 truncate group-hover:text-emerald-600 transition">{item.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  {item.type}
                </span>
                {category && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleFavorite}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
            title={item.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
          >
            <Star
              className={`w-4 h-4 ${item.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
            />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-slate-50/70 border border-slate-100 p-2.5 rounded-lg mb-3 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-mono truncate">{getItemPreview()}</span>
          <button
            onClick={handleCopySecret}
            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
            title="Copy Secret"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live 2FA / TOTP Code Badge */}
        {totpSecret && (
          <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between border border-slate-800 mb-3 shadow-md">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                <Clock className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>2FA Code ({secondsRemaining}s)</span>
              </div>
              <span className="font-mono text-xl font-extrabold text-emerald-400 tracking-widest">{liveTotpCode}</span>
            </div>
            <button
              onClick={handleCopy2FACode}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
              title="Copy 2FA Code"
            >
              {copiedTotp ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTotp ? 'Copied' : '2FA'}
            </button>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[11px] font-medium px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 bg-slate-100 text-slate-700 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
