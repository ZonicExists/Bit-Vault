import React, { useState, useEffect } from 'react';
import { X, Upload, Download } from 'lucide-react';
import { apiService } from '../services/api';
import { useVault } from '../context/VaultContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [clipboardClearSeconds, setClipboardClearSeconds] = useState(30);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'backup'>('general');

  const { setError: setContextError } = useVault();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const settings = await apiService.getSettings();
      setAutoLockMinutes(settings.auto_lock_minutes);
      setClipboardClearSeconds(settings.clipboard_auto_clear_seconds);
    } catch (err) {
      setContextError('Failed to load settings');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await apiService.updateSettings({
        auto_lock_minutes: autoLockMinutes,
        clipboard_auto_clear_seconds: clipboardClearSeconds,
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await apiService.changePassword(currentPassword, newPassword);

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const blob = await apiService.exportVault();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault-backup-${new Date().toISOString().split('T')[0]}.vault`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Vault exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export vault';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await apiService.importVault(file);
      setSuccess('Vault imported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import vault';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-vault-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-vault-white border-b border-vault-light p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-vault-dark">Bit Vault Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-vault-light rounded transition"
          >
            <X className="w-6 h-6 text-vault-dark" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-vault-light flex">
          {(['general', 'security', 'backup'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeTab === tab
                  ? 'border-b-2 border-vault-emerald text-vault-emerald'
                  : 'text-vault-gray hover:text-vault-dark'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Messages */}
          {error && (
            <div className="bg-vault-red/10 border border-vault-red text-vault-red px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-vault-emerald/10 border border-vault-emerald text-vault-emerald px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Auto-lock after (minutes)
                </label>
                <input
                  type="number"
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Math.max(0, parseInt(e.target.value)))}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
                <p className="text-xs text-vault-gray mt-1">
                  Set to 0 to disable auto-lock
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Clear clipboard after (seconds)
                </label>
                <input
                  type="number"
                  value={clipboardClearSeconds}
                  onChange={(e) => setClipboardClearSeconds(Math.max(0, parseInt(e.target.value)))}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
                <p className="text-xs text-vault-gray mt-1">
                  Automatically clear sensitive data from clipboard
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-vault-emerald text-vault-white py-2 rounded-lg hover:bg-emerald-600 disabled:bg-vault-gray transition"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Current Master Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  New Master Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vault-dark mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                />
              </div>

              <div className="bg-vault-amber/10 border border-vault-amber p-3 rounded-lg">
                <p className="text-xs text-vault-amber">
                  ⚠️ Changing your master password will re-encrypt your entire vault. This may take a moment.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-vault-emerald text-vault-white py-2 rounded-lg hover:bg-emerald-600 disabled:bg-vault-gray transition"
              >
                {isLoading ? 'Changing Password...' : 'Change Master Password'}
              </button>
            </form>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="bg-vault-light/30 p-4 rounded-lg">
                <p className="text-sm text-vault-dark mb-3">
                  Export your vault as an encrypted backup file or import a previously exported vault.
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-vault-blue text-vault-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-vault-gray transition"
              >
                <Download className="w-4 h-4" />
                {isLoading ? 'Exporting...' : 'Export Vault'}
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".vault"
                  onChange={handleImport}
                  disabled={isLoading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-vault-purple text-vault-white py-3 rounded-lg hover:bg-purple-600 disabled:bg-vault-gray transition"
                >
                  <Upload className="w-4 h-4" />
                  {isLoading ? 'Importing...' : 'Import Vault'}
                </button>
              </div>

              <div className="bg-vault-amber/10 border border-vault-amber p-3 rounded-lg">
                <p className="text-xs text-vault-amber">
                  💾 Regularly export your vault for backup purposes. Keep backups in a secure location.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
