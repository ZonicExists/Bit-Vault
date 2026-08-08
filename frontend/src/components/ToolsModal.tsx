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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-vault-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-vault-white border-b border-vault-light p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-vault-emerald/10 p-2 rounded-lg text-vault-emerald">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-vault-dark">Bit Vault Security Hub & Tools</h2>
              <p className="text-xs text-vault-gray">Password Generator, Pwned Checker, 2FA & Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-vault-light rounded transition">
            <X className="w-6 h-6 text-vault-dark" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-vault-light flex overflow-x-auto">
          {[
            { id: 'generator', label: 'Generator' },
            { id: 'pwned', label: 'Pwned Check' },
            { id: 'audit', label: 'Security Score' },
            { id: 'files', label: 'File Manager' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 font-medium text-sm whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-vault-emerald text-vault-emerald'
                  : 'border-transparent text-vault-gray hover:text-vault-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-vault-red/10 border border-vault-red text-vault-red px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-vault-emerald/10 border border-vault-emerald text-vault-emerald px-4 py-3 rounded text-sm">
              {success}
            </div>
          )}

          {/* Tab 1: Password Generator */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              {/* Output Display */}
              <div className="bg-vault-light/40 border border-vault-light p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex-1 font-mono text-lg font-bold text-vault-dark break-all">
                  {genResult?.password || 'Generating...'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGeneratePassword}
                    className="p-2 bg-vault-white hover:bg-vault-light rounded-lg border border-vault-light transition"
                    title="Regenerate"
                  >
                    <RefreshCw className={`w-5 h-5 text-vault-dark ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleCopyPassword}
                    className="px-4 py-2 bg-vault-emerald text-vault-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 font-medium"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Entropy & Strength Stats */}
              {genResult && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-vault-white border border-vault-light p-4 rounded-lg">
                    <p className="text-xs text-vault-gray">Entropy Rating</p>
                    <p className="text-xl font-bold text-vault-dark">{genResult.entropy_bits} bits</p>
                  </div>
                  <div className="bg-vault-white border border-vault-light p-4 rounded-lg">
                    <p className="text-xs text-vault-gray">Strength Label</p>
                    <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {genResult.strength_label}
                    </span>
                  </div>
                </div>
              )}

              {/* Settings Controls */}
              <div className="space-y-4 pt-2 border-t border-vault-light">
                <div>
                  <div className="flex justify-between text-sm font-medium text-vault-dark mb-2">
                    <span>Password Length</span>
                    <span>{genLength} characters</span>
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
                    className="w-full accent-vault-emerald cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incUpper}
                      onChange={(e) => { setIncUpper(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-vault-emerald"
                    />
                    <span>Uppercase (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incLower}
                      onChange={(e) => { setIncLower(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-vault-emerald"
                    />
                    <span>Lowercase (a-z)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incDigits}
                      onChange={(e) => { setIncDigits(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-vault-emerald"
                    />
                    <span>Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incSymbols}
                      onChange={(e) => { setIncSymbols(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-vault-emerald"
                    />
                    <span>Symbols (!@#$)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={avoidAmbiguous}
                      onChange={(e) => { setAvoidAmbiguous(e.target.checked); setTimeout(handleGeneratePassword, 0); }}
                      className="accent-vault-emerald"
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
                  <label className="block text-sm font-medium text-vault-dark mb-2">
                    Check Password Against Data Breaches
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={pwnedInput}
                      onChange={(e) => setPwnedInput(e.target.value)}
                      placeholder="Enter password to check..."
                      className="flex-1 px-4 py-2 border border-vault-light rounded-lg focus:outline-none focus:border-vault-emerald"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !pwnedInput}
                      className="bg-vault-emerald text-vault-white px-6 py-2 rounded-lg hover:bg-emerald-600 disabled:bg-vault-gray transition"
                    >
                      {isLoading ? 'Checking...' : 'Check Breach'}
                    </button>
                  </div>
                  <p className="text-xs text-vault-gray mt-1">
                    🔒 Uses 100% anonymized k-anonymity SHA-1 lookup (HaveIBeenPwned). Your password is never sent in cleartext.
                  </p>
                </div>
              </form>

              {pwnedResult && (
                <div className={`p-5 rounded-xl border ${pwnedResult.is_compromised ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center gap-3">
                    {pwnedResult.is_compromised ? (
                      <ShieldAlert className="w-8 h-8 text-red-600" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-emerald-600" />
                    )}
                    <div>
                      <h4 className={`font-bold ${pwnedResult.is_compromised ? 'text-red-800' : 'text-emerald-800'}`}>
                        {pwnedResult.is_compromised ? 'COMPROMISED PASSWORD!' : 'Safe & Clean!'}
                      </h4>
                      <p className="text-sm mt-1 text-vault-dark">
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
                  <div className="bg-vault-light/30 border border-vault-light p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-vault-dark">Overall Vault Security Score</h3>
                      <p className="text-xs text-vault-gray mt-1">Based on complexity, password reuse, and age</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-4xl font-extrabold ${auditScore.score >= 80 ? 'text-emerald-600' : auditScore.score >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                        {auditScore.score}
                      </span>
                      <span className="text-xl text-vault-gray font-bold">/ 100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-vault-white border border-vault-light p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-red-600">{auditScore.weak_passwords_count}</p>
                      <p className="text-xs text-vault-gray mt-1">Weak Passwords</p>
                    </div>
                    <div className="bg-vault-white border border-vault-light p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-amber-500">{auditScore.reused_passwords_count}</p>
                      <p className="text-xs text-vault-gray mt-1">Reused Groups</p>
                    </div>
                    <div className="bg-vault-white border border-vault-light p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-500">{auditScore.stale_passwords_count}</p>
                      <p className="text-xs text-vault-gray mt-1">Stale (&gt;180 days)</p>
                    </div>
                  </div>

                  {/* Issues Detail */}
                  {auditScore.issues.weak_passwords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-vault-dark uppercase">Weak Passwords Needing Attention</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {auditScore.issues.weak_passwords.map((item) => (
                          <div key={item.id} className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center justify-between text-xs">
                            <span className="font-bold text-red-800">{item.title}</span>
                            <span className="text-red-600">{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 5: Encrypted File Manager */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-vault-light pb-4">
                <div>
                  <h3 className="font-bold text-vault-dark">Encrypted Vault Storage</h3>
                  <p className="text-xs text-vault-gray">Files are encrypted with AES-256-GCM before writing to disk</p>
                </div>

                <label className="bg-vault-emerald text-vault-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition cursor-pointer flex items-center gap-2 text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                  <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {vaultFiles.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-vault-gray mx-auto mb-2 opacity-50" />
                  <p className="text-vault-dark font-medium">No encrypted files stored</p>
                  <p className="text-xs text-vault-gray">Upload documents or files to encrypt them securely in your vault</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {vaultFiles.map((file) => (
                    <div key={file.id} className="bg-vault-white border border-vault-light p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-vault-dark">{file.original_name}</p>
                        <p className="text-xs text-vault-gray mt-1">
                          {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadFile(file.id, file.original_name)}
                          className="p-2 bg-vault-blue/10 text-vault-blue hover:bg-vault-blue/20 rounded-lg transition"
                          title="Decrypt & Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 bg-vault-red/10 text-vault-red hover:bg-vault-red/20 rounded-lg transition"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
