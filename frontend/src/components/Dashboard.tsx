import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { VaultItemCard } from './VaultItemCard';
import { ItemModal } from './ItemModal';
import { SettingsModal } from './SettingsModal';
import { ToolsModal } from './ToolsModal';
import { FileManagerSection } from './FileManagerSection';
import { MobileNav } from './MobileNav';
import { VaultItem } from '../types';

export const Dashboard: React.FC = () => {
  const {
    items,
    isLoading,
    error,
    setError,
    fetchItems,
    searchQuery,
    filterType,
    filterCategory,
  } = useVault();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);



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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <TopBar
        onSearchChange={() => {}}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onToolsClick={() => setIsToolsOpen(true)}
      />

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {filterType === 'files' ? (
              <FileManagerSection />
            ) : (
              <>
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                      Your Bit Vault
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">
                      {items.length} encrypted item{items.length !== 1 ? 's' : ''} stored under zero-knowledge vault
                    </p>
                  </div>

                  <button
                    onClick={handleNewItem}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                    <span>New Item</span>
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-between text-sm font-medium animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 font-bold">
                      ✕
                    </button>
                  </div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-3">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-400 border-t-transparent"></div>
                      <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Decrypting Vault Items...</p>
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

                {/* Empty State View */}
                {!isLoading && items.length === 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-16 text-center shadow-xl max-w-2xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-slate-800/80 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-slate-700/60">
                      🔒
                    </div>
                    <h3 className="text-2xl font-bold text-white">No items found</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">
                      {searchQuery || filterType || filterCategory
                        ? 'No items match your active search or category filters.'
                        : 'Create your first encrypted vault item to get started.'}
                    </p>
                    {!searchQuery && !filterType && !filterCategory && (
                      <button
                        onClick={handleNewItem}
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-sm mt-2"
                      >
                        <Plus className="w-5 h-5" />
                        Create First Item
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav onNewItem={handleNewItem} />

      {/* Modals */}
      <ItemModal
        item={editingItem}
        defaultType={(filterType as any) || 'login'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ToolsModal isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />
    </div>
  );
};
