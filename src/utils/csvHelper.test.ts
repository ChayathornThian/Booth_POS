import { describe, it, expect } from 'vitest';
import { parseProductsCsv } from './csvHelper';
import { calculateArtistSummaries } from './artistSummary';
import type { SaleRecord } from '../types';

describe('csvHelper', () => {
  it('parses valid CSV text into products with bundle detection', () => {
    const csvData = `Name,Price,Category,SubCategory,Artist,Stock,IsBundle,BundleQty,BundlePrice
"Sticker Sheet A5 Blooms",55,"Stickers","Sheet A5","Field",45,TRUE,2,100
"Cat Charm",120,"Acrylics","Keychains","INK",20,FALSE,,`;

    const products = parseProductsCsv(csvData);
    expect(products.length).toBe(2);

    expect(products[0].name).toBe('Sticker Sheet A5 Blooms');
    expect(products[0].price).toBe(55);
    expect(products[0].category).toBe('Stickers');
    expect(products[0].subCategory).toBe('Sheet A5');
    expect(products[0].artist).toBe('Field');
    expect(products[0].stock).toBe(45);
    expect(products[0].isBundle).toBe(true);
    expect(products[0].bundleQty).toBe(2);
    expect(products[0].bundlePrice).toBe(100);

    expect(products[1].name).toBe('Cat Charm');
    expect(products[1].price).toBe(120);
    expect(products[1].artist).toBe('INK');
    expect(products[1].isBundle).toBe(false);
  });
});

describe('artistSummary', () => {
  it('correctly aggregates sales by artist with cash vs promptpay split', () => {
    const sales: SaleRecord[] = [
      {
        receiptId: 'REC-001',
        timestamp: '2026-09-20T10:00:00.000Z',
        items: [
          {
            name: 'Sticker INK',
            price: 50,
            quantity: 2,
            artist: 'INK',
            category: 'Stickers',
            bundleDiscount: 0,
            finalLineTotal: 100
          },
          {
            name: 'Postcard Field',
            price: 45,
            quantity: 1,
            artist: 'Field',
            category: 'Postcard',
            bundleDiscount: 0,
            finalLineTotal: 45
          }
        ],
        itemCount: 3,
        subtotal: 145,
        bundleDiscountTotal: 0,
        total: 145,
        paymentMethod: 'cash',
        status: 'completed'
      },
      {
        receiptId: 'REC-002',
        timestamp: '2026-09-20T11:00:00.000Z',
        items: [
          {
            name: 'Charm INK',
            price: 150,
            quantity: 1,
            artist: 'INK',
            category: 'Acrylics',
            bundleDiscount: 0,
            finalLineTotal: 150
          }
        ],
        itemCount: 1,
        subtotal: 150,
        bundleDiscountTotal: 0,
        total: 150,
        paymentMethod: 'promptpay',
        status: 'completed'
      }
    ];

    const summaries = calculateArtistSummaries(sales);
    expect(summaries.length).toBe(2);

    const inkSummary = summaries.find(s => s.artist === 'INK');
    expect(inkSummary).toBeDefined();
    expect(inkSummary?.itemCount).toBe(3);
    expect(inkSummary?.totalSales).toBe(250);
    expect(inkSummary?.cashSales).toBe(100);
    expect(inkSummary?.promptPaySales).toBe(150);

    const fieldSummary = summaries.find(s => s.artist === 'Field');
    expect(fieldSummary).toBeDefined();
    expect(fieldSummary?.itemCount).toBe(1);
    expect(fieldSummary?.totalSales).toBe(45);
    expect(fieldSummary?.cashSales).toBe(45);
    expect(fieldSummary?.promptPaySales).toBe(0);
  });
});
