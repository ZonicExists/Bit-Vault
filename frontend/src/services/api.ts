import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  VaultItem,
  VaultFile,
  Category,
  VaultSettings,
  SessionStatus,
  PasswordGenOptions,
  PasswordGenResult,
  PwnedCheckResult,
  TotpSecretResult,
  SecurityAuditScore
} from '../types';

class ApiService {
  private api: AxiosInstance;
  // Use environment variable REACT_APP_API_URL if provided (e.g. http://127.0.0.1:4000)
  // Default to the requested local FastAPI server
  private baseURL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://127.0.0.1:4000');

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============ Auth Endpoints ============

  async unlock(masterPassword: string): Promise<SessionStatus> {
    const response = await this.api.post<ApiResponse<SessionStatus>>('/api/auth/unlock', {
      master_password: masterPassword,
    });
    return response.data.data;
  }

  async lock(): Promise<{ is_unlocked: boolean }> {
    const response = await this.api.post<ApiResponse<{ is_unlocked: boolean }>>('/api/auth/lock', {});
    return response.data.data;
  }

  async checkStatus(): Promise<SessionStatus> {
    const response = await this.api.get<ApiResponse<SessionStatus>>('/api/auth/status');
    return response.data.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.api.post<ApiResponse<{ message: string }>>('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data.data;
  }

  // ============ Vault Items Endpoints ============

  async getItems(type?: string, categoryId?: string, search?: string, sort?: string): Promise<VaultItem[]> {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (categoryId) params.category_id = categoryId;
    if (search) params.search = search;
    if (sort) params.sort = sort;

    const response = await this.api.get<ApiResponse<VaultItem[]>>('/api/items', { params });
    return response.data.data;
  }

  async getItem(id: string): Promise<VaultItem> {
    const response = await this.api.get<ApiResponse<VaultItem>>(`/api/items/${id}`);
    return response.data.data;
  }

  async createItem(item: Omit<VaultItem, 'id' | 'created_at' | 'updated_at'>): Promise<VaultItem> {
    const response = await this.api.post<ApiResponse<VaultItem>>('/api/items', item);
    return response.data.data;
  }

  async updateItem(id: string, item: Partial<VaultItem>): Promise<VaultItem> {
    const response = await this.api.put<ApiResponse<VaultItem>>(`/api/items/${id}`, item);
    return response.data.data;
  }

  async deleteItem(id: string): Promise<{ id: string }> {
    const response = await this.api.delete<ApiResponse<{ id: string }>>(`/api/items/${id}`);
    return response.data.data;
  }

  // ============ File Manager Endpoints ============

  async uploadFile(file: File): Promise<VaultFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post<ApiResponse<VaultFile>>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await this.api.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteFile(fileId: string): Promise<{ id: string }> {
    const response = await this.api.delete<ApiResponse<{ id: string }>>(`/api/files/${fileId}`);
    return response.data.data;
  }

  // ============ Categories Endpoints ============

  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<ApiResponse<Category[]>>('/api/categories');
    return response.data.data;
  }

  async createCategory(name: string, color: string, icon: string): Promise<Category> {
    const response = await this.api.post<ApiResponse<Category>>('/api/categories', {
      name,
      color,
      icon,
    });
    return response.data.data;
  }

  async deleteCategory(categoryId: string): Promise<{ id: string }> {
    const response = await this.api.delete<ApiResponse<{ id: string }>>(`/api/categories/${categoryId}`);
    return response.data.data;
  }

  // ============ Settings Endpoints ============

  async getSettings(): Promise<VaultSettings> {
    const response = await this.api.get<ApiResponse<VaultSettings>>('/api/settings');
    return response.data.data;
  }

  async updateSettings(settings: Partial<VaultSettings>): Promise<VaultSettings> {
    const response = await this.api.put<ApiResponse<VaultSettings>>('/api/settings', settings);
    return response.data.data;
  }

  async exportVault(): Promise<Blob> {
    const response = await this.api.post('/api/settings/export', {}, {
      responseType: 'blob',
    });
    return response.data;
  }

  async importVault(file: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('vault_file', file);

    const response = await this.api.post<ApiResponse<{ success: boolean }>>('/api/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // ============ Security & Utility Tools ============

  async getFiles(): Promise<VaultFile[]> {
    const response = await this.api.get<ApiResponse<VaultFile[]>>('/api/files');
    return response.data.data;
  }

  async generatePassword(options?: PasswordGenOptions): Promise<PasswordGenResult> {
    const response = await this.api.post<ApiResponse<PasswordGenResult>>('/api/utils/generate-password', options || {});
    return response.data.data;
  }

  async checkPwned(password: string): Promise<PwnedCheckResult> {
    const response = await this.api.post<ApiResponse<PwnedCheckResult>>('/api/utils/check-pwned', { password });
    return response.data.data;
  }

  async generateTotpSecret(accountName?: string): Promise<TotpSecretResult> {
    const response = await this.api.post<ApiResponse<TotpSecretResult>>('/api/utils/totp/generate-secret', null, {
      params: { account_name: accountName || 'Vault User' }
    });
    return response.data.data;
  }

  async verifyTotpCode(secret: string, code: string): Promise<{ is_valid: boolean }> {
    const response = await this.api.post<ApiResponse<{ is_valid: boolean }>>('/api/utils/totp/verify', { secret, code });
    return response.data.data;
  }

  async getSecurityScore(): Promise<SecurityAuditScore> {
    const response = await this.api.get<ApiResponse<SecurityAuditScore>>('/api/audit/security-score');
    return response.data.data;
  }
}

export const apiService = new ApiService();
