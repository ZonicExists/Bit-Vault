import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { Key, ShieldCheck, Folder, Plus, X, Layers, FileText, CreditCard, HardDrive, Zap } from 'lucide-react';

interface MobileNavProps {
  onNewItem: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onNewItem }) => {
  const {
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    categories,
  } = useVault();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectSection = (type: string | null) => {
    setFilterType(type);
    setIsDrawerOpen(false);
  };

  const handleSelectCategory = (catId: string | null) => {
    setFilterCategory(catId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 flex items-center justify-around py-2 px-2 shadow-2xl">
        <button
          onClick={() => handleSelectSection('login')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            filterType === 'login' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className={`w-5 h-5 ${filterType === 'login' ? 'text-emerald-400 scale-110' : ''}`} />
          <span>Login</span>
        </button>

        <button
          onClick={() => handleSelectSection('totp')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            filterType === 'totp' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${filterType === 'totp' ? 'text-emerald-400 scale-110' : ''}`} />
          <span>2FA</span>
        </button>

        {/* Center Action Button */}
        <button
          onClick={onNewItem}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 p-3 rounded-2xl shadow-lg shadow-emerald-500/20 transform -translate-y-3 border-2 border-slate-900 transition active:scale-95"
          title="Create New Item"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => handleSelectSection('files')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            filterType === 'files' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <HardDrive className={`w-5 h-5 ${filterType === 'files' ? 'text-emerald-400 scale-110' : ''}`} />
          <span>Files</span>
        </button>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            isDrawerOpen || filterCategory !== null ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Slide-up Drawer Modal for Mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 md:hidden flex flex-col justify-end animate-fadeIn">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">Vault Sections & Categories</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Sections */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sections</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectSection(null)}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border ${
                    filterType === null ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>All Items</span>
                </button>

                <button
                  onClick={() => handleSelectSection('note')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border ${
                    filterType === 'note' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Notes</span>
                </button>

                <button
                  onClick={() => handleSelectSection('card')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border ${
                    filterType === 'card' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Cards</span>
                </button>

                <button
                  onClick={() => handleSelectSection('files')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border ${
                    filterType === 'files' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-teal-400" />
                  <span>Files</span>
                </button>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleSelectCategory(null)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold text-left border ${
                      filterCategory === null ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`w-full p-3 rounded-2xl text-xs font-semibold text-left flex items-center gap-2.5 border ${
                        filterCategory === cat.id ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
