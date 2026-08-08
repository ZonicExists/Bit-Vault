import React, { useState } from 'react';
import { LogOut, Settings, Search } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface TopBarProps {
  onSearchChange: (query: string) => void;
  onSettingsClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSearchChange, onSettingsClick }) => {
  const { lock, searchQuery, setSearchQuery, autoLockMinutes } = useVault();
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  const handleLock = async () => {
    await lock();
    setShowLockConfirm(false);
  };

  return (
    <div className="bg-vault-white border-b border-vault-light">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <div className="bg-vault-emerald p-2 rounded-lg">
              <span className="text-lg font-bold text-vault-white">🔐</span>
            </div>
            <h1 className="text-xl font-bold text-vault-dark hidden sm:block">Secure Vault</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-vault-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-vault-light rounded-lg transition"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-vault-dark" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLockConfirm(!showLockConfirm)}
                className="p-2 hover:bg-vault-red/10 rounded-lg transition text-vault-red"
                title="Lock vault"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {showLockConfirm && (
                <div className="absolute right-0 mt-1 bg-vault-white border border-vault-light rounded-lg shadow-lg p-3 whitespace-nowrap z-10">
                  <p className="text-sm text-vault-dark mb-2">Lock vault?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLock}
                      className="px-3 py-1 bg-vault-red text-vault-white rounded text-xs hover:bg-red-700"
                    >
                      Yes, Lock
                    </button>
                    <button
                      onClick={() => setShowLockConfirm(false)}
                      className="px-3 py-1 bg-vault-light text-vault-dark rounded text-xs hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-lock info */}
        {autoLockMinutes > 0 && (
          <p className="text-xs text-vault-gray mt-2">
            Auto-lock in {autoLockMinutes} minutes
          </p>
        )}
      </div>
    </div>
  );
};
