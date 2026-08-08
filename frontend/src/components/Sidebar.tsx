import React from 'react';
import { useVault } from '../context/VaultContext';

export const Sidebar: React.FC = () => {
  const {
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    categories,
    fetchItems,
  } = useVault();

  const handleFilterChange = async (type: string | null, category: string | null) => {
    setFilterType(type);
    setFilterCategory(category);
    // Fetch items with new filters
    setTimeout(() => fetchItems(), 0);
  };

  return (
    <div className="w-full md:w-64 bg-vault-white border-b md:border-r md:border-b-0 border-vault-light p-6 space-y-6">
      {/* Item Type Filter */}
      <div>
        <h3 className="font-semibold text-vault-dark mb-3 text-sm uppercase">Type</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleFilterChange(null, filterCategory)}
            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
              filterType === null
                ? 'bg-vault-emerald text-vault-white'
                : 'hover:bg-vault-light text-vault-dark'
            }`}
          >
            All Items
          </button>
          {(['login', 'note', 'card'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type, filterCategory)}
              className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center gap-2 ${
                filterType === type
                  ? 'bg-vault-emerald text-vault-white'
                  : 'hover:bg-vault-light text-vault-dark'
              }`}
            >
              <span>{type === 'login' ? '👤' : type === 'note' ? '📝' : '💳'}</span>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div>
          <h3 className="font-semibold text-vault-dark mb-3 text-sm uppercase">Categories</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleFilterChange(filterType, null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                filterCategory === null
                  ? 'bg-vault-emerald text-vault-white'
                  : 'hover:bg-vault-light text-vault-dark'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleFilterChange(filterType, category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center gap-2 ${
                  filterCategory === category.id
                    ? 'bg-vault-emerald text-vault-white'
                    : 'hover:bg-vault-light text-vault-dark'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-vault-light/30 p-3 rounded-lg">
        <p className="text-xs text-vault-gray">
          💡 Filters help you quickly find your stored items
        </p>
      </div>
    </div>
  );
};
