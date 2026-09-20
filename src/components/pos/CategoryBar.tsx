import React from 'react';
import { Search, User } from 'lucide-react';
import type { Product } from '../../types';

interface CategoryBarProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (subCategory: string) => void;
  selectedArtist: string;
  onSelectArtist: (artist: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Color palettes for artist tags in dark mode
export const ARTIST_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  INK: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/40' },
  Field: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  General: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' }
};

export function getArtistColor(artist: string) {
  return ARTIST_COLORS[artist] || { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' };
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  selectedArtist,
  onSelectArtist,
  searchQuery,
  onSearchChange
}) => {
  // Extract unique categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Extract unique sub-categories for current category
  const subCategories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (selectedCategory === 'All' || p.category === selectedCategory) {
        if (p.subCategory && p.subCategory.trim().length > 0) {
          set.add(p.subCategory.trim());
        }
      }
    });
    return Array.from(set).sort();
  }, [products, selectedCategory]);

  // Extract unique artists
  const artists = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.artist) set.add(p.artist);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  return (
    <div className="bg-slate-900 border-b border-slate-800 shadow-sm shrink-0 px-5 py-3 space-y-2.5 select-none">
      {/* Top Row: Categories & Search & Artist Filter */}
      <div className="flex items-center justify-between gap-3">
        {/* Main Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  onSelectSubCategory('All');
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-102'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Artist Filter Dropdown / Pill */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Artist:</span>
          <select
            value={selectedArtist}
            onChange={e => onSelectArtist(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
          >
            {artists.map(art => (
              <option key={art} value={art} className="bg-slate-800 text-slate-200">
                {art === 'All' ? 'All Artists' : art}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search */}
        <div className="relative w-56 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-800 hover:bg-slate-750 focus:bg-slate-800 text-xs text-white placeholder:text-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Sub-Category Pills (when subcategories exist) */}
      {subCategories.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80 overflow-x-auto pb-0.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Sub:</span>
          <button
            onClick={() => onSelectSubCategory('All')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedSubCategory === 'All'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            All {selectedCategory === 'All' ? '' : selectedCategory}
          </button>
          {subCategories.map(sub => {
            const isSubSelected = selectedSubCategory === sub;
            return (
              <button
                key={sub}
                onClick={() => onSelectSubCategory(sub)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSubSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
