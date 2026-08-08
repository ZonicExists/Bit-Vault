import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-center text-white tracking-tight mb-2">
            Bit Vault
          </h1>
          <p className="text-center text-slate-400 text-sm mb-8">
            AES-256-GCM Zero-Knowledge Encrypted Storage
          </p>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-5">
            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-500 transition text-sm font-medium"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Unlocking Vault...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Vault</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End Encrypted & Authenticated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
