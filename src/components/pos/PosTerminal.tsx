import React, { useState, useMemo } from 'react';
import type { Product, CartItem, AppSettings, SaleRecord } from '../../types';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { CartPanel } from './CartPanel';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { calculateItemPricing, calculateCartSummary } from '../../utils/bundleEngine';
import { playTapSound, playSuccessSound } from '../../utils/audio';
import { recordSale } from '../../db/db';
import confetti from 'canvas-confetti';

interface PosTerminalProps {
  products: Product[];
  settings: AppSettings;
  onRefreshProducts: () => void;
  onRefreshSales: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  settings,
  onRefreshProducts,
  onRefreshSales
}) => {
  // Category & Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [selectedArtist, setSelectedArtist] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleRecord | null>(null);

  // Filter products based on Category, Sub-Category, Artist, and Search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'All' || p.subCategory === selectedSubCategory;
      const matchesArtist = selectedArtist === 'All' || p.artist === selectedArtist;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSubCategory && matchesArtist && matchesSearch;
    });
  }, [products, selectedCategory, selectedSubCategory, selectedArtist, searchQuery]);

  // Cart quantity lookup map for quick badge indicators on cards
  const cartQuantityMap = useMemo(() => {
    const map = new Map<number, number>();
    cart.forEach(item => {
      if (item.product.id) {
        map.set(item.product.id, item.quantity);
      }
    });
    return map;
  }, [cart]);

  // Cart totals
  const { subtotal, bundleDiscountTotal, total, totalQuantity } = useMemo(() => {
    return calculateCartSummary(cart);
  }, [cart]);

  // Add product to cart or increment quantity
  const handleAddToCart = (product: Product) => {
    if (settings.soundEnabled) {
      playTapSound();
    }

    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(item => item.product.id === product.id);

      if (existingIdx >= 0) {
        const existing = prevCart[existingIdx];
        const newQty = existing.quantity + 1;
        const pricing = calculateItemPricing(product, newQty);

        const updated = [...prevCart];
        updated[existingIdx] = {
          product,
          quantity: newQty,
          ...pricing
        };
        return updated;
      } else {
        const pricing = calculateItemPricing(product, 1);
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            ...pricing
          }
        ];
      }
    });
  };

  // Adjust quantity from cart stepper
  const handleUpdateQty = (productId: number, delta: number) => {
    if (settings.soundEnabled) {
      playTapSound();
    }

    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(item => item.product.id === productId);
      if (existingIdx === -1) return prevCart;

      const existing = prevCart[existingIdx];
      const newQty = existing.quantity + delta;

      if (newQty <= 0) {
        return prevCart.filter(item => item.product.id !== productId);
      }

      const pricing = calculateItemPricing(existing.product, newQty);
      const updated = [...prevCart];
      updated[existingIdx] = {
        ...existing,
        quantity: newQty,
        ...pricing
      };
      return updated;
    });
  };

  const handleRemoveItem = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Complete payment and record transaction in IndexedDB
  const handleConfirmPayment = async (
    method: 'promptpay' | 'cash',
    cashTendered?: number,
    changeAmount?: number
  ) => {
    const receiptId = `REC-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.unitPrice,
      quantity: item.quantity,
      artist: item.product.artist || 'General',
      category: item.product.category,
      subCategory: item.product.subCategory,
      bundleDiscount: item.bundleDiscount,
      finalLineTotal: item.lineTotal
    }));

    const saleRecord: Omit<SaleRecord, 'id'> = {
      receiptId,
      timestamp,
      items: saleItems,
      itemCount: totalQuantity,
      subtotal,
      bundleDiscountTotal,
      total,
      paymentMethod: method,
      cashTendered: method === 'cash' ? cashTendered : undefined,
      changeAmount: method === 'cash' ? changeAmount : undefined,
      promptPayId: method === 'promptpay' ? settings.promptPayId : undefined,
      status: 'completed'
    };

    try {
      const newSaleId = await recordSale(saleRecord);
      const completedRecord = { ...saleRecord, id: newSaleId };

      if (settings.soundEnabled) {
        playSuccessSound();
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        console.debug('Confetti error', e);
      }

      // Refresh DB data
      onRefreshProducts();
      onRefreshSales();

      // Close checkout, clear cart, show receipt
      setIsCheckoutOpen(false);
      setCart([]);
      setLastCompletedSale(completedRecord);
      setIsReceiptOpen(true);
    } catch (err) {
      console.error('Failed to record sale', err);
      alert('Could not record sale to local database');
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left / Main Section: Visual Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Category & Sub-Category Navigation Bar */}
        <CategoryBar
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={setSelectedSubCategory}
          selectedArtist={selectedArtist}
          onSelectArtist={setSelectedArtist}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <span className="text-4xl mb-2">🔍</span>
              <p className="font-bold text-slate-600 text-sm">No items match your filter</p>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting "All" categories or clear your search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  cartQuantity={product.id ? cartQuantityMap.get(product.id) || 0 : 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Cart Panel (Always Visible on iPad) */}
      <CartPanel
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        subtotal={subtotal}
        bundleDiscountTotal={bundleDiscountTotal}
        total={total}
        totalQuantity={totalQuantity}
      />

      {/* Checkout Modal (Offline PromptPay QR & Cash) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
        settings={settings}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        sale={lastCompletedSale}
        onClose={() => setIsReceiptOpen(false)}
        boothName={settings.boothName}
      />
    </div>
  );
};
