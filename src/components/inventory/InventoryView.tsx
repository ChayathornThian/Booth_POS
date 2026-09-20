import React, { useState, useRef } from 'react';
import { Plus, Upload, Download, Search, Trash2, Edit3, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Product, AppSettings } from '../../types';
import { ProductModal } from './ProductModal';
import { exportProductsToCsv, parseProductsCsv } from '../../utils/csvHelper';
import { SAMPLE_PRODUCTS, db } from '../../db/db';
import { getArtistColor } from '../pos/CategoryBar';

interface InventoryViewProps {
  products: Product[];
  settings: AppSettings;
  onRefreshProducts: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  settings,
  onRefreshProducts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filtered products
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesArtist = selectedArtist === 'All' || p.artist === selectedArtist;
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesArtist && matchesCategory;
    });
  }, [products, searchQuery, selectedArtist, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>, id?: number) => {
    if (id) {
      await db.products.update(id, productData);
    } else {
      await db.products.add(productData as Product);
    }
    onRefreshProducts();
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await db.products.delete(id);
      onRefreshProducts();
    }
  };

  const handleQuickStockChange = async (id: number, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    await db.products.update(id, { stock: newStock });
    onRefreshProducts();
  };

  const handleLoadSampleCatalog = async () => {
    if (window.confirm('Load starter art fest sample products? (Stickers, postcards, acrylics)')) {
      await db.products.bulkAdd(SAMPLE_PRODUCTS as Product[]);
      onRefreshProducts();
      setImportStatus('Loaded 10 sample products successfully!');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleLoadRealCatalog = async () => {
    if (window.confirm('Import your full Real_product.csv catalog (120+ items from INK, Field, etc.) into local storage?')) {
      try {
        const response = await fetch('/Real_product.csv');
        const text = await response.text();
        const parsed = parseProductsCsv(text);
        if (parsed.length > 0) {
          await db.products.bulkAdd(parsed as Product[]);
          onRefreshProducts();
          setImportStatus(`Successfully imported ${parsed.length} items from Real_product.csv!`);
          setTimeout(() => setImportStatus(null), 4000);
        }
      } catch (err) {
        console.error('Failed to load Real_product.csv', err);
        alert('Could not load Real_product.csv');
      }
    }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseProductsCsv(text);
      if (parsed.length === 0) {
        alert('Could not find valid product rows in CSV file.');
        return;
      }

      await db.products.bulkAdd(parsed as Product[]);
      onRefreshProducts();
      setImportStatus(`Successfully imported ${parsed.length} products from CSV!`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      console.error('Failed to parse CSV', err);
      alert('Error reading CSV file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Action Header */}
      <div className="bg-white border-b border-slate-200 p-5 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog & Setup</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {products.length} products total • Local images saved permanently in iPad database
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleLoadSampleCatalog}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Sample Data</span>
          </button>

          <button
            onClick={handleLoadRealCatalog}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Import 120+ real products from Real_product.csv"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Import Real_product.csv</span>
          </button>

          <label className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={() => exportProductsToCsv(products)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {importStatus && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-5 py-2 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>

        <select
          value={selectedArtist}
          onChange={e => setSelectedArtist(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">All Artists</option>
          {settings.artists.map(a => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-3">Artist</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Price</th>
                <th className="py-3.5 px-3">Bundle Deal</th>
                <th className="py-3.5 px-3">Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found. Tap "Add Product" or "Load Sample Data" to start!
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const artistStyle = getArtistColor(prod.artist || 'General');
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Photo / Emoji & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-lg">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              prod.emoji || '✨'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                            {prod.subCategory && (
                              <div className="text-[11px] text-slate-400">{prod.subCategory}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${artistStyle.bg} ${artistStyle.text} ${artistStyle.border}`}>
                          {prod.artist}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        {prod.category}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-extrabold text-slate-900 text-sm">
                        ฿{prod.price.toFixed(0)}
                      </td>

                      {/* Bundle Deal */}
                      <td className="py-3 px-3">
                        {prod.isBundle && prod.bundleQty && prod.bundlePrice ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                            {prod.bundleQty} for ฿{prod.bundlePrice}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Stock Quick Stepper */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => prod.id && handleQuickStockChange(prod.id, prod.stock, -1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className={`min-w-[32px] text-center font-bold ${prod.stock <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {prod.stock}
                          </span>
                          <button
                            onClick={() => prod.id && handleQuickStockChange(prod.id, prod.stock, 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => prod.id && handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        settings={settings}
        existingCategories={categories.filter(c => c !== 'All')}
      />
    </div>
  );
};
