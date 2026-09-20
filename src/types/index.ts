export interface Product {
  id?: number;
  barcode?: string;
  name: string;
  price: number;
  category: string;
  subCategory?: string;
  artist: string;
  stock: number;
  image?: string; // Stored as base64 / data URL in local IndexedDB for 100% offline persistence
  emoji?: string;
  description?: string;
  isBundle?: boolean;
  bundleQty?: number;
  bundlePrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  bundleDiscount: number;
  lineTotal: number;
}

export interface SaleItem {
  productId?: number | string;
  name: string;
  price: number;
  quantity: number;
  artist: string;
  category: string;
  subCategory?: string;
  bundleDiscount: number;
  finalLineTotal: number;
}

export interface SaleRecord {
  id?: number;
  receiptId: string;
  timestamp: string; // ISO string
  items: SaleItem[];
  itemCount: number;
  subtotal: number;
  bundleDiscountTotal: number;
  total: number;
  paymentMethod: 'cash' | 'promptpay';
  cashTendered?: number;
  changeAmount?: number;
  promptPayId?: string;
  status: 'completed' | 'voided';
}

export interface ArtistSummary {
  artist: string;
  itemCount: number;
  totalSales: number;
  cashSales: number;
  promptPaySales: number;
}

export interface CategorySummary {
  category: string;
  subCategories: string[];
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AppSettings {
  boothName: string;
  promptPayId: string;
  promptPayName?: string;
  artists: string[];
  soundEnabled: boolean;
  googleSheetsUrl?: string;
  lastSyncedAt?: string;
  cloudSyncEnabled?: boolean;
  boothId?: string; // Unique shared key for the booth, e.g. "boothsuay-2026"
  firebaseConfig?: FirebaseConfig;
  appMode?: 'cashier' | 'monitor'; // Cashier runs terminal, Monitor views live analytics
}
