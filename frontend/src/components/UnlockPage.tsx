import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const UnlockPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { unlock } = useVault();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await unlock(password);
    } catch (err) {
      setError('Incorrect master password. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-vault-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex justify-center mb-8">
            <div className="bg-vault-emerald p-4 rounded-full">
              <Lock className="w-8 h-8 text-vault-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-vault-dark mb-2">
            Secure Vault
          </h1>
          <p className="text-center text-vault-slate mb-8">
            Enter your master password to access your vault
          </p>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-5">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-vault-dark mb-2">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="w-full px-4 py-3 border-2 border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald text-vault-dark placeholder-vault-gray transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-vault-slate hover:text-vault-dark"
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-vault-red/10 border border-vault-red text-vault-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-vault-emerald text-vault-white font-semibold py-3 rounded-lg hover:bg-emerald-600 disabled:bg-vault-gray disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Unlocking...' : 'Unlock Vault'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-vault-gray text-xs mt-6">
            Keep your master password secure. You cannot recover it if forgotten.
          </p>
        </div>
      </div>
    </div>
  );
};
