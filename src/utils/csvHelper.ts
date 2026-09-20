import type { Product, SaleRecord } from '../types';

/**
 * Escapes fields for CSV format
 */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates and triggers download of Transaction Ledger CSV
 */
export function exportSalesToCsv(sales: SaleRecord[], filename = 'booth_transactions.csv'): void {
  if (sales.length === 0) {
    alert('No transactions to export yet!');
    return;
  }

  const headers = [
    'Receipt ID',
    'Date & Time',
    'Payment Method',
    'Item Count',
    'Subtotal',
    'Bundle Discount',
    'Total (THB)',
    'Cash Tendered',
    'Change',
    'Artists',
    'Items Summary'
  ];

  const rows = sales.map(sale => {
    const artists = Array.from(new Set(sale.items.map(i => i.artist || 'Unknown'))).join(', ');
    const itemsSummary = sale.items
      .map(i => `${i.name} (x${i.quantity} @ ฿${i.price})`)
      .join('; ');

    return [
      escapeCsv(sale.receiptId),
      escapeCsv(new Date(sale.timestamp).toLocaleString()),
      escapeCsv(sale.paymentMethod.toUpperCase()),
      escapeCsv(sale.itemCount),
      escapeCsv(sale.subtotal.toFixed(2)),
      escapeCsv(sale.bundleDiscountTotal.toFixed(2)),
      escapeCsv(sale.total.toFixed(2)),
      escapeCsv(sale.cashTendered !== undefined ? sale.cashTendered.toFixed(2) : ''),
      escapeCsv(sale.changeAmount !== undefined ? sale.changeAmount.toFixed(2) : ''),
      escapeCsv(artists),
      escapeCsv(itemsSummary)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  triggerDownload(csvContent, filename);
}

/**
 * Generates detailed line-item level CSV (each item sold on its own row)
 */
export function exportItemizedSalesToCsv(sales: SaleRecord[], filename = 'booth_items_sold.csv'): void {
  if (sales.length === 0) {
    alert('No transactions to export yet!');
    return;
  }

  const headers = [
    'Receipt ID',
    'Date & Time',
    'Item Name',
    'Category',
    'SubCategory',
    'Artist',
    'Unit Price',
    'Quantity',
    'Line Discount',
    'Final Line Total',
    'Payment Method'
  ];

  const rows: string[] = [];
  sales.forEach(sale => {
    const formattedDate = new Date(sale.timestamp).toLocaleString();
    sale.items.forEach(item => {
      rows.push([
        escapeCsv(sale.receiptId),
        escapeCsv(formattedDate),
        escapeCsv(item.name),
        escapeCsv(item.category),
        escapeCsv(item.subCategory || ''),
        escapeCsv(item.artist || 'General'),
        escapeCsv(item.price.toFixed(2)),
        escapeCsv(item.quantity),
        escapeCsv(item.bundleDiscount.toFixed(2)),
        escapeCsv(item.finalLineTotal.toFixed(2)),
        escapeCsv(sale.paymentMethod.toUpperCase())
      ].join(','));
    });
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  triggerDownload(csvContent, filename);
}

/**
 * Export product catalog to CSV
 */
export function exportProductsToCsv(products: Product[], filename = 'booth_products.csv'): void {
  const headers = [
    'Barcode',
    'Name',
    'Price',
    'Category',
    'SubCategory',
    'Artist',
    'Stock',
    'Emoji',
    'IsBundle',
    'BundleQty',
    'BundlePrice'
  ];

  const rows = products.map(p => [
    escapeCsv(p.barcode || ''),
    escapeCsv(p.name),
    escapeCsv(p.price),
    escapeCsv(p.category),
    escapeCsv(p.subCategory || ''),
    escapeCsv(p.artist),
    escapeCsv(p.stock),
    escapeCsv(p.emoji || ''),
    escapeCsv(p.isBundle ? 'TRUE' : 'FALSE'),
    escapeCsv(p.bundleQty || ''),
    escapeCsv(p.bundlePrice || '')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  triggerDownload(csvContent, filename);
}

/**
 * Parse CSV text into Product objects (supports both V1 Real_product.csv and V2 format)
 */
export function parseProductsCsv(text: string): Omit<Product, 'id'>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const products: Omit<Product, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex to handle commas inside quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (const char of lines[i]) {
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const getCol = (names: string[]): string => {
      for (const name of names) {
        const idx = rawHeaders.indexOf(name.toLowerCase());
        if (idx !== -1 && values[idx] !== undefined) {
          return values[idx].replace(/^["']|["']$/g, '');
        }
      }
      return '';
    };

    const name = getCol(['name', 'product name', 'item']);
    if (!name) continue;

    const price = parseFloat(getCol(['price', 'unit price'])) || 0;
    const category = getCol(['category', 'type']) || 'Others';
    const subCategory = getCol(['subcategory', 'sub category', 'group']) || undefined;
    const artist = getCol(['artist', 'creator', 'author']) || 'General';
    const stock = parseInt(getCol(['stock', 'quantity', 'qty']), 10) || 0;
    const barcode = getCol(['barcode', 'sku', 'code']) || undefined;
    const emoji = getCol(['emoji', 'icon']) || undefined;

    // Bundle checks: support either IsBundle or V1's IsSetPriced
    const isBundleVal = getCol(['isbundle', 'issetpriced']).toLowerCase();
    const isBundle = isBundleVal === 'true' || isBundleVal === '1';

    let bundleQty: number | undefined = parseInt(getCol(['bundleqty', 'set1_qty']), 10) || undefined;
    let bundlePrice: number | undefined = parseFloat(getCol(['bundleprice', 'set1_price'])) || undefined;

    if (!isBundle) {
      bundleQty = undefined;
      bundlePrice = undefined;
    }

    products.push({
      name,
      price,
      category,
      subCategory,
      artist,
      stock,
      barcode,
      emoji,
      isBundle,
      bundleQty,
      bundlePrice
    });
  }

  return products;
}

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
