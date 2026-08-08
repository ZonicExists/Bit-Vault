import React from 'react';
import { useVault } from '../context/VaultContext';
import { Layers, Folder, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    categories,
    fetchItems,
    items,
  } = useVault();

  const handleFilterChange = (type: string | null, category: string | null) => {
    setFilterType(type);
    setFilterCategory(category);
  };

  const navItems = [
    { type: null, label: 'All Items', icon: '⚡' },
    { type: 'login', label: 'Login Credentials', icon: '👤' },
    { type: 'totp', label: '2FA Codes', icon: '🔑' },
    { type: 'note', label: 'Secure Notes', icon: '📝' },
    { type: 'card', label: 'Payment Cards', icon: '💳' },
    { type: 'files', label: 'Secure Files', icon: '📁' },
  ];

  return (
    <div className="hidden md:flex w-64 bg-slate-900/95 border-r border-slate-800/80 p-5 space-y-6 flex-col justify-between shrink-0 shadow-2xl">
      <div className="space-y-6">
        {/* Item Types Navigation */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vault Sections</h3>
          </div>

          <div className="space-y-1.5">
            {navItems.map((nav) => {
              const isActive = filterType === nav.type;
              return (
                <button
                  key={nav.label}
                  onClick={() => handleFilterChange(nav.type, filterCategory)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition text-xs font-bold flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{nav.icon}</span>
                    <span>{nav.label}</span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Navigation */}
        {categories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Folder className="w-3.5 h-3.5 text-teal-400" />
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</h3>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => handleFilterChange(filterType, null)}
                className={`w-full text-left px-3.5 py-2 rounded-xl transition text-xs font-bold ${
                  filterCategory === null
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => {
                const isActive = filterCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleFilterChange(filterType, cat.id)}
                    className={`w-full text-left px-3.5 py-2 rounded-xl transition text-xs font-semibold flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Security Health Card Widget */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Vault Status</span>
          </div>
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" /> Encrypted
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
          Protected with zero-knowledge AES-256-GCM encryption key.
        </p>
      </div>
    </div>
  );
};
