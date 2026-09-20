import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Tag } from 'lucide-react';
import type { CartItem } from '../../types';
import { getArtistColor } from './CategoryBar';

interface CartPanelProps {
  cart: CartItem[];
  onUpdateQty: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  subtotal: number;
  bundleDiscountTotal: number;
  total: number;
  totalQuantity: number;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  subtotal,
  bundleDiscountTotal,
  total,
  totalQuantity
}) => {
  return (
    <aside className="w-88 md:w-96 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-sm select-none">
      {/* Cart Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base leading-none">Current Cart</h2>
            <p className="text-xs text-slate-400 mt-0.5">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in order</p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
            title="Clear all items"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="font-semibold text-slate-600 text-sm">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Tap any item on the left to start adding to this order
            </p>
          </div>
        ) : (
          cart.map(item => {
            const artistStyle = getArtistColor(item.product.artist || 'General');
            const hasBundleDiscount = item.bundleDiscount > 0;

            return (
              <div
                key={item.product.id}
                className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex flex-col gap-2"
              >
                {/* Item Details Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden text-lg">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        item.product.emoji || '✨'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${artistStyle.bg} ${artistStyle.text} ${artistStyle.border}`}>
                          {item.product.artist}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ฿{item.unitPrice.toFixed(0)} ea
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => item.product.id && onRemoveItem(item.product.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  {/* Stepper Buttons */}
                  <div className="flex items-center bg-white rounded-xl border border-slate-300 shadow-2xs">
                    <button
                      onClick={() => item.product.id && onUpdateQty(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-l-xl transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-extrabold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => item.product.id && onUpdateQty(item.product.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-r-xl transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pricing info */}
                  <div className="text-right">
                    {hasBundleDiscount && (
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600">
                        <Tag className="w-2.5 h-2.5" />
                        <span>-฿{item.bundleDiscount.toFixed(0)} bundle</span>
                      </div>
                    )}
                    <span className="text-sm font-black text-slate-900">
                      ฿{item.lineTotal.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Big Checkout Button */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">฿{subtotal.toFixed(0)}</span>
            </div>

            {bundleDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Bundle Deals Savings
                </span>
                <span>-฿{bundleDiscountTotal.toFixed(0)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-2xl font-black text-slate-950 tracking-tight">
                ฿{total.toFixed(0)}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenCheckout}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all duration-150 cursor-pointer"
          >
            <span>Charge ฿{total.toFixed(0)}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
};
