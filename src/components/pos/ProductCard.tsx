import React from 'react';
import type { Product } from '../../types';
import { getArtistColor } from './CategoryBar';
import { Layers } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity
}) => {
  const isOutOfStock = product.stock <= 0;
  const artistStyle = getArtistColor(product.artist || 'General');

  return (
    <button
      onClick={() => {
        if (!isOutOfStock) {
          onAddToCart(product);
        }
      }}
      disabled={isOutOfStock}
      className={`group relative flex flex-col justify-between text-left bg-slate-900 rounded-2xl border-2 transition-all duration-150 overflow-hidden select-none active:scale-97 p-3 shadow-md cursor-pointer ${
        isOutOfStock
          ? 'opacity-40 border-slate-800 cursor-not-allowed bg-slate-950'
          : cartQuantity > 0
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-950/50'
          : 'border-slate-800 hover:border-indigo-500/60 hover:shadow-indigo-950/30'
      }`}
      style={{ minHeight: '170px' }}
    >
      {/* In-Cart Quantity Indicator */}
      {cartQuantity > 0 && (
        <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-150">
          {cartQuantity}
        </div>
      )}

      {/* Top Section: Visual Media (Local Image or Large Emoji) */}
      <div className="w-full h-24 rounded-xl bg-slate-800/80 flex items-center justify-center overflow-hidden mb-2 relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="text-4xl select-none transform group-hover:scale-110 transition-transform">
            {product.emoji || '✨'}
          </div>
        )}

        {/* Sold out overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
            <span className="text-white font-extrabold text-xs tracking-wider uppercase bg-rose-600 px-2.5 py-1 rounded-md shadow-sm">
              Sold Out
            </span>
          </div>
        )}

        {/* Artist Tag pill */}
        <div className="absolute bottom-1.5 left-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${artistStyle.bg} ${artistStyle.text} ${artistStyle.border} shadow-2xs backdrop-blur-xs`}>
            {product.artist}
          </span>
        </div>
      </div>

      {/* Middle Section: Item Title & SubCategory */}
      <div className="flex-1 flex flex-col justify-start">
        <h3 className="font-bold text-slate-100 text-sm line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
          {product.name}
        </h3>
        {product.subCategory && (
          <span className="text-[11px] text-slate-400 font-medium mt-0.5">
            {product.subCategory}
          </span>
        )}
      </div>

      {/* Bottom Section: Price & Bundle Badge */}
      <div className="mt-2 pt-2 border-t border-slate-800 flex items-end justify-between">
        <div>
          <div className="text-base font-extrabold text-emerald-400 tracking-tight">
            ฿{product.price.toFixed(0)}
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[10px] text-amber-400 font-semibold">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Bundle Deal Badge */}
        {product.isBundle && product.bundleQty && product.bundlePrice && (
          <div className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>{product.bundleQty} for ฿{product.bundlePrice}</span>
          </div>
        )}
      </div>
    </button>
  );
};
