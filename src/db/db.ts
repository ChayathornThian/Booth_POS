import Dexie, { type Table } from 'dexie';
import type { Product, SaleRecord, AppSettings } from '../types';

export class BoothPOSDatabase extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<SaleRecord, number>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('BoothPOS_V2_DB');
    this.version(1).stores({
      products: '++id, barcode, name, category, subCategory, artist, price, stock',
      sales: '++id, receiptId, timestamp, paymentMethod, status',
      settings: 'key'
    });
  }
}

export const db = new BoothPOSDatabase();

// Default settings helper
export async function getSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = {
    boothName: 'Art Booth',
    promptPayId: '0812345678',
    promptPayName: 'Booth PromptPay',
    artists: ['INK', 'Field', 'General'],
    soundEnabled: true
  };

  try {
    const record = await db.settings.get('app_settings');
    if (record && record.value) {
      return { ...defaultSettings, ...(record.value as AppSettings) };
    }
  } catch (err) {
    console.error('Failed to read settings from db', err);
  }
  return defaultSettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ key: 'app_settings', value: settings });
}

/**
 * Record a sale and decrement item inventory stocks atomically
 */
export async function recordSale(sale: Omit<SaleRecord, 'id'>): Promise<number> {
  return await db.transaction('rw', db.products, db.sales, async () => {
    // 1. Decrement stock for inventory items
    for (const item of sale.items) {
      if (item.productId && typeof item.productId === 'number') {
        const prod = await db.products.get(item.productId);
        if (prod) {
          const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
          await db.products.update(item.productId, { stock: newStock });
        }
      }
    }

    // 2. Insert sale record
    return await db.sales.add(sale as SaleRecord);
  });
}

/**
 * Initial sample products to populate the catalog if empty
 */
export const SAMPLE_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'PLAVE Sticker Set',
    price: 50,
    category: 'Stickers',
    subCategory: 'Die-cut',
    artist: 'INK',
    stock: 50,
    emoji: '💖',
    isBundle: false
  },
  {
    name: 'Sticker Sheet A5 Blooms',
    price: 55,
    category: 'Stickers',
    subCategory: 'Sheet A5',
    artist: 'Field',
    stock: 45,
    emoji: '🌸',
    isBundle: true,
    bundleQty: 2,
    bundlePrice: 100 // 2 for 100฿ (saves 10฿)
  },
  {
    name: 'Sticker Sheet A5 Fall',
    price: 55,
    category: 'Stickers',
    subCategory: 'Sheet A5',
    artist: 'Field',
    stock: 40,
    emoji: '🍂',
    isBundle: true,
    bundleQty: 2,
    bundlePrice: 100
  },
  {
    name: 'Postcard - Sunset Horizon',
    price: 45,
    category: 'Postcard',
    subCategory: 'Landscape',
    artist: 'Field',
    stock: 35,
    emoji: '🌅',
    isBundle: true,
    bundleQty: 3,
    bundlePrice: 120 // 3 for 120฿ (saves 15฿)
  },
  {
    name: 'Postcard - Sakura Garden',
    price: 45,
    category: 'Postcard',
    subCategory: 'Landscape',
    artist: 'INK',
    stock: 30,
    emoji: '🌸',
    isBundle: true,
    bundleQty: 3,
    bundlePrice: 120
  },
  {
    name: 'Acrylic Charm - Starlight Cat',
    price: 150,
    category: 'Acrylics',
    subCategory: 'Keychains',
    artist: 'INK',
    stock: 25,
    emoji: '✨',
    isBundle: false
  },
  {
    name: 'Acrylic Standee - Tea Party',
    price: 250,
    category: 'Acrylics',
    subCategory: 'Standees',
    artist: 'Field',
    stock: 15,
    emoji: '☕',
    isBundle: false
  },
  {
    name: 'Mini Stamp Set 01',
    price: 15,
    category: 'Stickers',
    subCategory: 'Stamps',
    artist: 'Field',
    stock: 80,
    emoji: '💌',
    isBundle: true,
    bundleQty: 5,
    bundlePrice: 60 // 5 for 60฿ (saves 15฿)
  },
  {
    name: 'Art Sketchbook Vol. 1',
    price: 320,
    category: 'Books',
    subCategory: 'Artbook',
    artist: 'Field',
    stock: 12,
    emoji: '📖',
    isBundle: false
  },
  {
    name: 'Handmade Hair Tie - Floral',
    price: 169,
    category: 'Others',
    subCategory: 'Accessories',
    artist: 'Field',
    stock: 20,
    emoji: '🎀',
    isBundle: false
  }
];

export async function seedInitialProductsIfEmpty(): Promise<boolean> {
  const count = await db.products.count();
  if (count === 0) {
    await db.products.bulkAdd(SAMPLE_PRODUCTS);
    return true;
  }
  return false;
}
