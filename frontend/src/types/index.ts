// API Types based on Frontend Contract

export type ItemType = 'login' | 'totp' | 'note' | 'card';

export interface LoginPayload {
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export interface TotpPayload {
  secret: string;
  account_name?: string;
}

export interface NotePayload {
  content: string;
}

export interface CardPayload {
  cardholder_name: string;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  pin?: string;
}

export interface VaultItem {
  id: string;
  type: ItemType;
  title: string;
  category_id: string | null;
  tags: string[];
  is_favorite: boolean;
  payload: LoginPayload | TotpPayload | NotePayload | CardPayload;
  created_at: string;
  updated_at: string;
}

export interface VaultFile {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface VaultSettings {
  auto_lock_minutes: number;
  clipboard_auto_clear_seconds: number;
}

export interface SessionStatus {
  is_unlocked: boolean;
  auto_lock_minutes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PasswordGenOptions {
  length?: number;
  include_uppercase?: boolean;
  include_lowercase?: boolean;
  include_digits?: boolean;
  include_symbols?: boolean;
  avoid_ambiguous?: boolean;
}

export interface PasswordGenResult {
  password: string;
  length: number;
  entropy_bits: number;
  strength_label: string;
}

export interface PwnedCheckResult {
  is_compromised: boolean;
  breach_count: number;
  prefix?: string;
}

export interface TotpSecretResult {
  secret: string;
  otpauth_url: string;
}

export interface SecurityAuditIssueItem {
  id: string;
  title: string;
  reason?: string;
  last_updated?: string;
}

export interface SecurityAuditReusedGroup {
  count: number;
  items: SecurityAuditIssueItem[];
}

export interface SecurityAuditScore {
  score: number;
  total_items: number;
  weak_passwords_count: number;
  reused_passwords_count: number;
  stale_passwords_count: number;
  issues: {
    weak_passwords: SecurityAuditIssueItem[];
    reused_passwords: SecurityAuditReusedGroup[];
    stale_passwords: SecurityAuditIssueItem[];
  };
}
