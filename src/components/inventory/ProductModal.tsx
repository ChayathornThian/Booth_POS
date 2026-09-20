import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Layers } from 'lucide-react';
import type { Product, AppSettings } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>, id?: number) => void;
  productToEdit?: Product | null;
  settings: AppSettings;
  existingCategories: string[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  settings,
  existingCategories
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Stickers');
  const [subCategory, setSubCategory] = useState('');
  const [artist, setArtist] = useState(settings.artists[0] || 'General');
  const [stock, setStock] = useState('50');
  const [emoji, setEmoji] = useState('✨');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isBundle, setIsBundle] = useState(false);
  const [bundleQty, setBundleQty] = useState('2');
  const [bundlePrice, setBundlePrice] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setPrice(productToEdit.price?.toString() || '');
      setCategory(productToEdit.category || 'Stickers');
      setSubCategory(productToEdit.subCategory || '');
      setArtist(productToEdit.artist || settings.artists[0] || 'General');
      setStock(productToEdit.stock?.toString() || '0');
      setEmoji(productToEdit.emoji || '✨');
      setImagePreview(productToEdit.image || '');
      setIsBundle(!!productToEdit.isBundle);
      setBundleQty(productToEdit.bundleQty?.toString() || '2');
      setBundlePrice(productToEdit.bundlePrice?.toString() || '');
    } else {
      setName('');
      setPrice('');
      setCategory('Stickers');
      setSubCategory('');
      setArtist(settings.artists[0] || 'General');
      setStock('50');
      setEmoji('✨');
      setImagePreview('');
      setIsBundle(false);
      setBundleQty('2');
      setBundlePrice('');
    }
  }, [productToEdit, isOpen, settings.artists]);

  if (!isOpen) return null;

  // Handle local image file upload -> convert to base64 Data URL for 100% offline IndexedDB persistence
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (compress if over 1MB or read directly)
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product name is required');
      return;
    }

    const priceNum = parseFloat(price) || 0;
    const stockNum = parseInt(stock, 10) || 0;
    const bQtyNum = isBundle ? parseInt(bundleQty, 10) || 2 : undefined;
    const bPriceNum = isBundle ? parseFloat(bundlePrice) || 0 : undefined;

    onSave(
      {
        name: name.trim(),
        price: priceNum,
        category: category.trim() || 'Others',
        subCategory: subCategory.trim() || undefined,
        artist: artist.trim() || 'General',
        stock: stockNum,
        emoji: emoji || '✨',
        image: imagePreview || undefined,
        isBundle,
        bundleQty: bQtyNum,
        bundlePrice: bPriceNum
      },
      productToEdit?.id
    );
    onClose();
  };

  const popularEmojis = ['✨', '💖', '🌸', '🎨', '💌', '🔑', '📌', '🖼️', '📓', '🎀', '☕', '🍂', '🌅'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {productToEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-400">Save product details and local image to iPad storage</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Local Photo Upload Area */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Local Product Image (Stored 100% Offline in IndexedDB):
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-rose-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-2xl">{emoji}</span>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors border border-slate-200">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>{imagePreview ? 'Change Local Photo' : 'Select Photo from iPad'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saved permanently on this device. Loads at 0ms with zero internet.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Emoji Picker */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Or Choose Quick Emoji Icon:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {popularEmojis.map(e => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                    emoji === e ? 'bg-indigo-600 text-white scale-110 shadow-xs' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sticker Sheet A5 Blooms"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Price (฿) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="55"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>

          {/* Category & SubCategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
              <input
                type="text"
                list="categories-list"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Stickers, Postcard..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
              <datalist id="categories-list">
                {existingCategories.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Sub-Category</label>
              <input
                type="text"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                placeholder="Sheet A5, Die-cut..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>

          {/* Artist Selection */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Artist / Creator</label>
            <select
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
            >
              {settings.artists.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Bundle Deal Section */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">Specific Item Bundle Deal</span>
              </div>
              <input
                type="checkbox"
                checked={isBundle}
                onChange={e => setIsBundle(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {isBundle && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-amber-800 block mb-1">Bundle Quantity</label>
                  <input
                    type="number"
                    min="2"
                    value={bundleQty}
                    onChange={e => setBundleQty(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-800 block mb-1">Bundle Price (฿)</label>
                  <input
                    type="number"
                    min="1"
                    value={bundlePrice}
                    onChange={e => setBundlePrice(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
