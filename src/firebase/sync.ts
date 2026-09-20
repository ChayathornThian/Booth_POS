import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch,
  increment
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { Product, SaleRecord } from '../types';

/**
 * Subscribe to live cloud changes for products and sales records
 */
export function subscribeToCloudBooth(
  boothId: string,
  onProductsUpdate: (products: Product[]) => void,
  onSalesUpdate: (sales: SaleRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  const db = getFirebaseDb();
  if (!db || !boothId) return () => {};

  const cleanBoothId = boothId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  // 1. Products Collection Listener
  const productsRef = collection(db, 'booths', cleanBoothId, 'products');
  const unsubscribeProducts = onSnapshot(
    productsRef,
    snapshot => {
      const prods: Product[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: data.id || parseInt(d.id, 10) || d.id,
          name: data.name || '',
          price: data.price || 0,
          category: data.category || 'Others',
          subCategory: data.subCategory || '',
          artist: data.artist || 'General',
          stock: data.stock !== undefined ? data.stock : 0,
          image: data.image || undefined,
          emoji: data.emoji || undefined,
          isBundle: !!data.isBundle,
          bundleQty: data.bundleQty,
          bundlePrice: data.bundlePrice
        };
      });
      onProductsUpdate(prods);
    },
    err => {
      console.error('Cloud products listener error', err);
      onError?.(err);
    }
  );

  // 2. Sales Collection Listener (Live Transaction Stream)
  const salesRef = collection(db, 'booths', cleanBoothId, 'sales');
  const salesQuery = query(salesRef, orderBy('timestamp', 'desc'));
  const unsubscribeSales = onSnapshot(
    salesQuery,
    snapshot => {
      const records: SaleRecord[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: data.id || d.id,
          receiptId: data.receiptId || d.id,
          timestamp: data.timestamp || new Date().toISOString(),
          items: data.items || [],
          itemCount: data.itemCount || 0,
          subtotal: data.subtotal || 0,
          bundleDiscountTotal: data.bundleDiscountTotal || 0,
          total: data.total || 0,
          paymentMethod: data.paymentMethod || 'cash',
          cashTendered: data.cashTendered,
          changeAmount: data.changeAmount,
          promptPayId: data.promptPayId,
          status: data.status || 'completed'
        };
      });
      onSalesUpdate(records);
    },
    err => {
      console.error('Cloud sales listener error', err);
      onError?.(err);
    }
  );

  return () => {
    unsubscribeProducts();
    unsubscribeSales();
  };
}

/**
 * Record a sale to the cloud and decrement inventory atomically
 */
export async function pushSaleToCloud(boothId: string, sale: SaleRecord): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !boothId) return;

  const cleanBoothId = boothId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const saleDocRef = doc(db, 'booths', cleanBoothId, 'sales', sale.receiptId);

  // 1. Write sale document
  await setDoc(saleDocRef, {
    receiptId: sale.receiptId,
    timestamp: sale.timestamp,
    itemCount: sale.itemCount,
    subtotal: sale.subtotal,
    bundleDiscountTotal: sale.bundleDiscountTotal,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    cashTendered: sale.cashTendered || null,
    changeAmount: sale.changeAmount || null,
    promptPayId: sale.promptPayId || null,
    status: sale.status || 'completed',
    items: sale.items
  });

  // 2. Decrement stock for inventory items in cloud
  const batch = writeBatch(db);
  for (const item of sale.items) {
    if (item.productId) {
      const prodDocRef = doc(db, 'booths', cleanBoothId, 'products', String(item.productId));
      batch.update(prodDocRef, {
        stock: increment(-item.quantity)
      });
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    console.debug('Batch stock decrement non-critical error', err);
  }
}

/**
 * Push or update single product in cloud
 */
export async function pushProductToCloud(boothId: string, product: Product): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !boothId || !product.id) return;

  const cleanBoothId = boothId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const prodDocRef = doc(db, 'booths', cleanBoothId, 'products', String(product.id));

  await setDoc(prodDocRef, {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    subCategory: product.subCategory || '',
    artist: product.artist || 'General',
    stock: product.stock,
    emoji: product.emoji || '',
    isBundle: !!product.isBundle,
    bundleQty: product.bundleQty || null,
    bundlePrice: product.bundlePrice || null
  }, { merge: true });
}

/**
 * Delete product from cloud
 */
export async function deleteProductFromCloud(boothId: string, productId: number | string): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !boothId) return;

  const cleanBoothId = boothId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const prodDocRef = doc(db, 'booths', cleanBoothId, 'products', String(productId));
  await deleteDoc(prodDocRef);
}

/**
 * Bulk upload full local catalog to cloud
 */
export async function uploadAllProductsToCloud(boothId: string, products: Product[]): Promise<number> {
  const db = getFirebaseDb();
  if (!db || !boothId) return 0;

  const cleanBoothId = boothId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const batch = writeBatch(db);
  let count = 0;

  for (const product of products) {
    if (!product.id) continue;
    const prodDocRef = doc(db, 'booths', cleanBoothId, 'products', String(product.id));
    batch.set(prodDocRef, {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory || '',
      artist: product.artist || 'General',
      stock: product.stock,
      emoji: product.emoji || '',
      isBundle: !!product.isBundle,
      bundleQty: product.bundleQty || null,
      bundlePrice: product.bundlePrice || null
    }, { merge: true });
    count++;
  }

  await batch.commit();
  return count;
}
