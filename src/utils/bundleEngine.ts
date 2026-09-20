import type { Product, CartItem } from '../types';

/**
 * Calculates pricing for a specific item with optional bundle rules.
 * e.g., Base price 40฿, Bundle: 3 for 100฿ (saves 20฿ for every 3 items).
 */
export function calculateItemPricing(product: Product, quantity: number): {
  unitPrice: number;
  lineSubtotal: number;
  bundleDiscount: number;
  lineTotal: number;
} {
  const unitPrice = product.price || 0;
  const lineSubtotal = unitPrice * quantity;

  if (
    !product.isBundle ||
    !product.bundleQty ||
    product.bundleQty <= 1 ||
    product.bundlePrice === undefined ||
    quantity < product.bundleQty
  ) {
    return {
      unitPrice,
      lineSubtotal,
      bundleDiscount: 0,
      lineTotal: lineSubtotal
    };
  }

  const bundlesCount = Math.floor(quantity / product.bundleQty);
  const remainderCount = quantity % product.bundleQty;

  const bundleTotalCost = bundlesCount * product.bundlePrice;
  const remainderCost = remainderCount * unitPrice;
  const finalLineTotal = bundleTotalCost + remainderCost;

  const bundleDiscount = Math.max(0, lineSubtotal - finalLineTotal);

  return {
    unitPrice,
    lineSubtotal,
    bundleDiscount,
    lineTotal: finalLineTotal
  };
}

/**
 * Summarizes the entire cart
 */
export function calculateCartSummary(cartItems: CartItem[]): {
  subtotal: number;
  bundleDiscountTotal: number;
  total: number;
  totalQuantity: number;
} {
  let subtotal = 0;
  let bundleDiscountTotal = 0;
  let total = 0;
  let totalQuantity = 0;

  for (const item of cartItems) {
    subtotal += item.lineSubtotal;
    bundleDiscountTotal += item.bundleDiscount;
    total += item.lineTotal;
    totalQuantity += item.quantity;
  }

  return {
    subtotal,
    bundleDiscountTotal,
    total,
    totalQuantity
  };
}
