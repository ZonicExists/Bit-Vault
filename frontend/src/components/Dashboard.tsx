import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { VaultItemCard } from './VaultItemCard';
import { ItemModal } from './ItemModal';
import { SettingsModal } from './SettingsModal';
import { VaultItem } from '../types';

export const Dashboard: React.FC = () => {
  const {
    items,
    isLoading,
    error,
    setError,
    fetchItems,
    selectItem,
    searchQuery,
    filterType,
    filterCategory,
  } = useVault();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, [searchQuery, filterType, filterCategory]);

  const handleNewItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: VaultItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = () => {
    fetchItems();
    handleCloseModal();
  };

  const handleRefreshItems = () => {
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-vault-light">
      {/* Top Navigation */}
      <TopBar onSearchChange={() => {}} onSettingsClick={() => setIsSettingsOpen(true)} />

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-vault-dark">Your Vault</h2>
                <p className="text-vault-gray mt-1">
                  {items.length} item{items.length !== 1 ? 's' : ''} stored securely
                </p>
              </div>
              <button
                onClick={handleNewItem}
                className="flex items-center gap-2 bg-vault-emerald text-vault-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition font-medium shadow-md"
              >
                <Plus className="w-5 h-5" />
                New Item
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-vault-red/10 border border-vault-red text-vault-red px-6 py-4 rounded-lg mb-6 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-vault-red hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-vault-emerald border-t-transparent"></div>
                  <p className="text-vault-gray mt-4">Loading items...</p>
                </div>
              </div>
            )}

            {/* Items Grid */}
            {!isLoading && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <VaultItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onRefresh={handleRefreshItems}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && items.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold text-vault-dark mb-2">No items yet</h3>
                <p className="text-vault-gray mb-6">
                  {searchQuery || filterType || filterCategory
                    ? 'No items match your search or filters'
                    : 'Create your first vault item to get started'}
                </p>
                {!searchQuery && !filterType && !filterCategory && (
                  <button
                    onClick={handleNewItem}
                    className="inline-flex items-center gap-2 bg-vault-emerald text-vault-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Item
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ItemModal
        item={editingItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
