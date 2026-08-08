import React, { useState, useEffect } from 'react';
import { Star, Copy, Check, Trash2, Edit3, Key, FileText, CreditCard, Clock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopyUsername = () => {
    if (item.type === 'login') {
      const username = (item.payload as LoginPayload).username;
      if (username) {
        navigator.clipboard.writeText(username);
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
      }
    }
  };

  const handleCopyPassword = () => {
    if (item.type === 'login') {
      const password = (item.payload as LoginPayload).password;
      if (password) {
        navigator.clipboard.writeText(password);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
    }
  };

  const category = categories.find((c) => c.id === item.category_id);
  const totpSecret = item.type === 'totp' ? (item.payload as any).secret : undefined;

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
    <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-slate-800/80 hover:border-emerald-500/30 group flex flex-col justify-between">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 group-hover:border-emerald-500/30 transition">
              {getItemIcon(item.type)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-white text-base truncate group-hover:text-emerald-400 transition">{item.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
                  {item.type}
                </span>
                {category && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full shadow-xs" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleFavorite}
            className="p-2 hover:bg-slate-800/80 rounded-xl transition"
            title={item.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
          >
            <Star
              className={`w-4 h-4 ${item.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
            />
          </button>
        </div>

        {/* Item Preview / Details */}
        {item.type === 'login' && (
          <div className="space-y-2">
            {/* Username Row */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-inner">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Username</span>
                <span className="text-xs text-slate-200 font-mono font-semibold truncate block">
                  {(item.payload as LoginPayload).username || 'No username'}
                </span>
              </div>
              <button
                onClick={handleCopyUsername}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded-xl transition"
                title="Copy Username"
              >
                {copiedUsername ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Password Row */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-inner">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</span>
                <span className="text-xs text-emerald-400 font-mono font-extrabold truncate block">
                  {showPassword
                    ? (item.payload as LoginPayload).password || '••••••••'
                    : '••••••••••••'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleCopyPassword}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded-xl transition"
                  title="Copy Password"
                >
                  {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {item.type === 'totp' && (
          <div className="bg-slate-950 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-xl">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>2FA CODE ({secondsRemaining}S)</span>
              </div>
              <span className="font-mono text-2xl font-extrabold text-emerald-400 tracking-widest">{liveTotpCode}</span>
            </div>
            <button
              onClick={handleCopy2FACode}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center gap-1 shadow-md shadow-emerald-500/20"
              title="Copy 2FA Code"
            >
              {copiedTotp ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTotp ? 'Copied' : '2FA'}
            </button>
          </div>
        )}

        {(item.type === 'note' || item.type === 'card') && (
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-inner">
            <span className="text-xs text-slate-300 font-mono truncate">{getItemPreview()}</span>
            <button
              onClick={handleCopySecret}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded-xl transition"
              title="Copy Secret"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 p-4 pt-3 border-t border-slate-800/80 bg-slate-950/40">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition border border-transparent hover:border-red-500/30"
          title="Delete Item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
