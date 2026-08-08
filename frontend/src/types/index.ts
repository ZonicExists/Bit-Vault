// API Types based on Frontend Contract

export type ItemType = 'login' | 'note' | 'card';

export interface LoginPayload {
  username: string;
  password: string;
  url?: string;
  notes?: string;
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
  payload: LoginPayload | NotePayload | CardPayload;
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
