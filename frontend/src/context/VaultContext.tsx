import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { VaultItem, Category } from '../types';
import { apiService } from '../services/api';

interface VaultContextType {
  isUnlocked: boolean;
  autoLockMinutes: number;
  items: VaultItem[];
  categories: Category[];
  selectedItem: VaultItem | null;
  searchQuery: string;
  filterType: string | null;
  filterCategory: string | null;
  isLoading: boolean;
  error: string | null;

  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  selectItem: (item: VaultItem | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;
  setFilterCategory: (categoryId: string | null) => void;
  setError: (error: string | null) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await apiService.checkStatus();
        setIsUnlocked(status.is_unlocked);
        setAutoLockMinutes(status.auto_lock_minutes);
      } catch (err) {
        console.error('Failed to check status:', err);
      }
    };
    checkStatus();
  }, []);

  const unlock = async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await apiService.unlock(password);
      setIsUnlocked(status.is_unlocked);
      setAutoLockMinutes(status.auto_lock_minutes);
      await fetchItems();
      await fetchCategories();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unlock vault';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const lock = async () => {
    try {
      setIsLoading(true);
      await apiService.lock();
      setIsUnlocked(false);
      setItems([]);
      setCategories([]);
      setSelectedItem(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to lock vault';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const fetchedItems = await apiService.getItems(
        filterType || undefined,
        filterCategory || undefined,
        searchQuery || undefined
      );
      setItems(fetchedItems);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch items';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await apiService.getCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMsg);
    }
  };

  const value: VaultContextType = {
    isUnlocked,
    autoLockMinutes,
    items,
    categories,
    selectedItem,
    searchQuery,
    filterType,
    filterCategory,
    isLoading,
    error,
    unlock,
    lock,
    fetchItems,
    fetchCategories,
    selectItem: setSelectedItem,
    setSearchQuery,
    setFilterType,
    setFilterCategory,
    setError,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
};
