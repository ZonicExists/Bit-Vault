import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, RefreshCw, Copy, Check, ShieldAlert, Upload, Download, Trash2, FileText, Clock } from 'lucide-react';
import { apiService } from '../services/api';
import { PasswordGenResult, PwnedCheckResult, TotpSecretResult, SecurityAuditScore, VaultFile } from '../types';

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

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'pwned' | 'totp' | 'audit' | 'files'>('generator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Generator State
  const [genLength, setGenLength] = useState(16);
  const [incUpper, setIncUpper] = useState(true);
  const [incLower, setIncLower] = useState(true);
  const [incDigits, setIncDigits] = useState(true);
  const [incSymbols, setIncSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [genResult, setGenResult] = useState<PasswordGenResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Pwned Check State
  const [pwnedInput, setPwnedInput] = useState('');
  const [pwnedResult, setPwnedResult] = useState<PwnedCheckResult | null>(null);

  // TOTP State
  const [totpAccount, setTotpAccount] = useState('Vault User');
  const [totpResult, setTotpResult] = useState<TotpSecretResult | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [liveTotpCode, setLiveTotpCode] = useState('------');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [copiedTotpCode, setCopiedTotpCode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSecondsRemaining(sec);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (totpResult?.secret) {
      computeTotpCode(totpResult.secret).then(setLiveTotpCode);
    } else {
      setLiveTotpCode('------');
    }
  }, [totpResult?.secret, secondsRemaining]);

  const handleCopyLiveTotpCode = () => {
    const cleanCode = liveTotpCode.replace(/\s+/g, '');
    if (cleanCode && cleanCode !== '------') {
      navigator.clipboard.writeText(cleanCode);
      setCopiedTotpCode(true);
      setTimeout(() => setCopiedTotpCode(false), 2000);
    }
  };

  // Audit State
  const [auditScore, setAuditScore] = useState<SecurityAuditScore | null>(null);

  // Files State
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'generator') handleGeneratePassword();
      if (activeTab === 'audit') loadAuditScore();
      if (activeTab === 'files') loadVaultFiles();
    }
  }, [isOpen, activeTab]);

  const handleGeneratePassword = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.generatePassword({
        length: genLength,
        include_uppercase: incUpper,
        include_lowercase: incLower,
        include_digits: incDigits,
        include_symbols: incSymbols,
        avoid_ambiguous: avoidAmbiguous
      });
      setGenResult(res);
      setCopied(false);
    } catch (err) {
      setError('Failed to generate password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (genResult?.password) {
      navigator.clipboard.writeText(genResult.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckPwned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwnedInput) return;
    try {
      setIsLoading(true);
      const res = await apiService.checkPwned(pwnedInput);
      setPwnedResult(res);
    } catch (err) {
      setError('Failed to check password leak database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTotp = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.generateTotpSecret(totpAccount);
      setTotpResult(res);
      setVerifyResult(null);
      setVerifyCode('');
    } catch (err) {
      setError('Failed to generate TOTP secret');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpResult || !verifyCode) return;
    try {
      setIsLoading(true);
      const res = await apiService.verifyTotpCode(totpResult.secret, verifyCode);
      setVerifyResult(res.is_valid);
    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditScore = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getSecurityScore();
      setAuditScore(res);
    } catch (err) {
      setError('Failed to calculate security score');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVaultFiles = async () => {
    try {
      setIsLoading(true);
      const files = await apiService.getFiles();
      setVaultFiles(files);
    } catch (err) {
      setError('Failed to load encrypted files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      await apiService.uploadFile(file);
      setSuccess('Encrypted file uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await loadVaultFiles();
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const blob = await apiService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download decrypted file');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (window.confirm('Delete this encrypted file?')) {
      try {
        await apiService.deleteFile(fileId);
        await loadVaultFiles();
      } catch (err) {
        setError('Failed to delete file');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Bit Vault Security Hub</h2>
              <p className="text-xs text-slate-400 font-medium">Password Generator, Pwned Checker & Security Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800 flex overflow-x-auto bg-slate-950/60">
          {[
            { id: 'generator', label: 'Generator' },
            { id: 'pwned', label: 'Pwned Check' },
            { id: 'audit', label: 'Security Score' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3.5 font-bold text-xs whitespace-nowrap transition border-b-2 tracking-wide uppercase ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-medium animate-fadeIn">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-xs font-medium animate-fadeIn">
              {success}
            </div>
          )}

          {/* Tab 1: Password Generator */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              {/* Output Display */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-inner">
                <div className="flex-1 font-mono text-lg font-extrabold text-white break-all tracking-wider">
                  {genResult?.password || 'Generating...'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGeneratePassword}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
                    title="Regenerate"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleCopyPassword}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition flex items-center gap-1.5 text-xs shadow-md shadow-emerald-500/20"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Entropy & Strength Stats */}
              {genResult && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entropy Rating</p>
                    <p className="text-xl font-extrabold font-mono text-white mt-0.5">{genResult.entropy_bits} bits</p>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Strength Label</p>
                    <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {genResult.strength_label}
                    </span>
                  </div>
                </div>
              )}

              {/* Settings Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>PASSWORD LENGTH</span>
                    <span className="font-mono text-emerald-400">{genLength} characters</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="64"
                    value={genLength}
                    onChange={(e) => {
                      setGenLength(parseInt(e.target.value));
                      setTimeout(handleGeneratePassword, 0);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer bg-slate-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={incUpper}
                      onChange={(e) => { setIncUpper(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-emerald-400 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>Uppercase (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={incLower}
                      onChange={(e) => { setIncLower(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-emerald-400 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>Lowercase (a-z)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={incDigits}
                      onChange={(e) => { setIncDigits(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-emerald-400 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={incSymbols}
                      onChange={(e) => { setIncSymbols(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-emerald-400 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>Symbols (!@#$)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer col-span-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avoidAmbiguous}
                      onChange={(e) => { setAvoidAmbiguous(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-emerald-400 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>Avoid Ambiguous Characters (l, 1, I, O, 0)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Pwned Checker */}
          {activeTab === 'pwned' && (
            <div className="space-y-6">
              <form onSubmit={handleCheckPwned} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Check Password Against Data Breaches
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={pwnedInput}
                      onChange={(e) => setPwnedInput(e.target.value)}
                      placeholder="Enter password to check..."
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !pwnedInput}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl disabled:opacity-50 transition text-xs shadow-md shadow-emerald-500/20"
                    >
                      {isLoading ? 'Checking...' : 'Check Breach'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    🔒 Uses 100% anonymized k-anonymity SHA-1 lookup (HaveIBeenPwned). Your password is never sent in cleartext.
                  </p>
                </div>
              </form>

              {pwnedResult && (
                <div className={`p-5 rounded-2xl border ${pwnedResult.is_compromised ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                  <div className="flex items-center gap-3">
                    {pwnedResult.is_compromised ? (
                      <ShieldAlert className="w-8 h-8 text-red-400" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {pwnedResult.is_compromised ? 'COMPROMISED PASSWORD!' : 'Safe & Clean!'}
                      </h4>
                      <p className="text-xs mt-1 text-slate-300">
                        {pwnedResult.is_compromised
                          ? `This password has been seen in ${pwnedResult.breach_count.toLocaleString()} known data leaks. Do NOT use this password!`
                          : 'This password has not been found in known public data breaches.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Security Audit */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {auditScore && (
                <>
                  <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Overall Vault Security Score</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Based on complexity, password reuse, and age</p>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`text-4xl font-extrabold ${auditScore.score >= 80 ? 'text-emerald-400' : auditScore.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {auditScore.score}
                      </span>
                      <span className="text-lg text-slate-500 font-bold">/ 100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-extrabold font-mono text-red-400">{auditScore.weak_passwords_count}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Weak Passwords</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-extrabold font-mono text-amber-400">{auditScore.reused_passwords_count}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Reused Groups</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-extrabold font-mono text-blue-400">{auditScore.stale_passwords_count}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Stale (&gt;180 days)</p>
                    </div>
                  </div>

                  {/* Issues Detail */}
                  {auditScore.issues.weak_passwords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Weak Passwords Needing Attention</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {auditScore.issues.weak_passwords.map((item) => (
                          <div key={item.id} className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
                            <span className="text-white">{item.title}</span>
                            <span className="text-red-400">{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
