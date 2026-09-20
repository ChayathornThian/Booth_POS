import { describe, it, expect } from 'vitest';
import { calculateItemPricing, calculateCartSummary } from './bundleEngine';
import type { Product, CartItem } from '../types';

describe('bundleEngine', () => {
  const normalProduct: Product = {
    id: 1,
    name: 'Normal Sticker',
    price: 40,
    category: 'Stickers',
    artist: 'INK',
    stock: 100,
    isBundle: false
  };

  const bundleProduct: Product = {
    id: 2,
    name: 'A5 Sticker Sheet',
    price: 55,
    category: 'Stickers',
    artist: 'Field',
    stock: 100,
    isBundle: true,
    bundleQty: 2,
    bundlePrice: 100 // 2 for 100฿ (saves 10฿ per bundle)
  };

  it('calculates regular item with no bundle', () => {
    const res = calculateItemPricing(normalProduct, 3);
    expect(res.unitPrice).toBe(40);
    expect(res.lineSubtotal).toBe(120);
    expect(res.bundleDiscount).toBe(0);
    expect(res.lineTotal).toBe(120);
  });

  it('calculates bundle item with quantity below bundle threshold', () => {
    const res = calculateItemPricing(bundleProduct, 1);
    expect(res.unitPrice).toBe(55);
    expect(res.lineSubtotal).toBe(55);
    expect(res.bundleDiscount).toBe(0);
    expect(res.lineTotal).toBe(55);
  });

  it('calculates exact bundle quantity', () => {
    const res = calculateItemPricing(bundleProduct, 2);
    expect(res.lineSubtotal).toBe(110);
    expect(res.bundleDiscount).toBe(10);
    expect(res.lineTotal).toBe(100);
  });

  it('calculates bundle plus remainder', () => {
    const res = calculateItemPricing(bundleProduct, 5);
    // 2 bundles (4 items) = 200฿, 1 remainder = 55฿ -> Total = 255฿
    // Normal subtotal = 5 * 55 = 275฿ -> discount = 20฿
    expect(res.lineSubtotal).toBe(275);
    expect(res.bundleDiscount).toBe(20);
    expect(res.lineTotal).toBe(255);
  });

  it('calculates cart summary correctly', () => {
    const cartItems: CartItem[] = [
      {
        product: normalProduct,
        quantity: 2,
        unitPrice: 40,
        lineSubtotal: 80,
        bundleDiscount: 0,
        lineTotal: 80
      },
      {
        product: bundleProduct,
        quantity: 3,
        unitPrice: 55,
        lineSubtotal: 165,
        bundleDiscount: 10,
        lineTotal: 155
      }
    ];

    const summary = calculateCartSummary(cartItems);
    expect(summary.subtotal).toBe(245);
    expect(summary.bundleDiscountTotal).toBe(10);
    expect(summary.total).toBe(235);
    expect(summary.totalQuantity).toBe(5);
  });
});
