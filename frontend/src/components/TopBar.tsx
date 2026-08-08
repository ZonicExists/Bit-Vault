import React, { useState } from 'react';
import { LogOut, Settings, Search, ShieldCheck, KeyRound, Lock, Clock } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface TopBarProps {
  onSearchChange: (query: string) => void;
  onSettingsClick: () => void;
  onToolsClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSearchChange, onSettingsClick, onToolsClick }) => {
  const { lock, searchQuery, setSearchQuery, autoLockMinutes } = useVault();
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  const handleLock = async () => {
    await lock();
    setShowLockConfirm(false);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-slate-950 font-extrabold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Bit<span className="text-emerald-400">Vault</span>
                </h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                  AES-256
                </span>
              </div>
              {autoLockMinutes > 0 && (
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Auto-lock in {autoLockMinutes}m
                </p>
              )}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search passwords, 2FA codes, notes..."
                className="w-full pl-10 pr-12 py-2 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs text-white placeholder-slate-500 shadow-inner"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 hidden sm:inline-block">
                /
              </kbd>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToolsClick}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 px-3.5 py-2 rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-sm"
              title="Security Tools & Audit"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Tools</span>
            </button>

            <button
              onClick={onSettingsClick}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition border border-slate-700/80"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLockConfirm(!showLockConfirm)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
                title="Lock Vault"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {showLockConfirm && (
                <div className="absolute right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 whitespace-nowrap z-50 animate-fadeIn">
                  <p className="text-xs font-bold text-white mb-3">Lock your Bit Vault?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLock}
                      className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/20"
                    >
                      Yes, Lock
                    </button>
                    <button
                      onClick={() => setShowLockConfirm(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition border border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
