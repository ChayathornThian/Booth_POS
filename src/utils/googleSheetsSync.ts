import type { SaleRecord, Product } from '../types';
import { calculateArtistSummaries } from './artistSummary';

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  syncedSalesCount: number;
}

/**
 * Sends sales, itemized ledger, and artist settlement to Google Apps Script Web App
 */
export async function syncToGoogleSheets(
  webAppUrl: string,
  sales: SaleRecord[],
  products: Product[],
  boothName: string
): Promise<GoogleSheetsSyncResult> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Please enter a valid Google Apps Script Web App URL in Settings.',
      syncedSalesCount: 0
    };
  }

  const artistSummaries = calculateArtistSummaries(sales);

  // Flatten items sold for line-by-line sheet
  const itemsSold = sales.flatMap(sale =>
    sale.items.map(item => ({
      receiptId: sale.receiptId,
      timestamp: sale.timestamp,
      dateFormatted: new Date(sale.timestamp).toLocaleString(),
      name: item.name,
      category: item.category,
      subCategory: item.subCategory || '',
      artist: item.artist || 'General',
      price: item.price,
      quantity: item.quantity,
      bundleDiscount: item.bundleDiscount,
      finalLineTotal: item.finalLineTotal,
      paymentMethod: sale.paymentMethod
    }))
  );

  const payload = {
    action: 'SYNC_BOOTH_DATA',
    boothName,
    syncTimestamp: new Date().toISOString(),
    salesCount: sales.length,
    sales: sales.map(s => ({
      receiptId: s.receiptId,
      timestamp: s.timestamp,
      dateFormatted: new Date(s.timestamp).toLocaleString(),
      paymentMethod: s.paymentMethod,
      itemCount: s.itemCount,
      subtotal: s.subtotal,
      bundleDiscountTotal: s.bundleDiscountTotal,
      total: s.total,
      cashTendered: s.cashTendered || 0,
      changeAmount: s.changeAmount || 0,
      artists: Array.from(new Set(s.items.map(i => i.artist || 'General'))).join(', '),
      itemsSummary: s.items.map(i => `${i.name} (x${i.quantity})`).join('; ')
    })),
    itemsSold,
    artistSummaries,
    products: products.map(p => ({
      name: p.name,
      artist: p.artist,
      category: p.category,
      subCategory: p.subCategory || '',
      price: p.price,
      stock: p.stock
    }))
  };

  try {
    // Note: Google Apps Script web apps require text/plain to avoid CORS preflight options issues
    await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      mode: 'no-cors' // Google Apps Script redirects with 302
    });

    return {
      success: true,
      message: `Successfully synced ${sales.length} transactions and artist settlements to Google Sheets!`,
      syncedSalesCount: sales.length
    };
  } catch (err) {
    console.error('Failed to sync to Google Sheets', err);
    return {
      success: false,
      message: 'Failed to connect to Google Sheets. Check your internet connection and Apps Script URL.',
      syncedSalesCount: 0
    };
  }
}

/**
 * Standard Google Apps Script code that the user can paste into Extensions > Apps Script
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * BoothPOS V2 — Google Sheets Sync Endpoint
 * Paste this code into: Google Sheets > Extensions > Apps Script
 * Then Deploy > New Deployment > Web app > Who has access: Anyone
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Transactions Sheet
    var transSheet = getOrCreateSheet(ss, "Transactions", [
      "Receipt ID", "Date & Time", "Payment Method", "Items Count", 
      "Subtotal", "Bundle Discount", "Total (THB)", "Cash Received", 
      "Change", "Artists", "Items Summary"
    ]);
    
    // Clear old data and re-write
    if (data.sales && data.sales.length > 0) {
      if (transSheet.getLastRow() > 1) {
        transSheet.getRange(2, 1, transSheet.getLastRow() - 1, 11).clearContent();
      }
      var transRows = data.sales.map(function(s) {
        return [
          s.receiptId, s.dateFormatted, s.paymentMethod.toUpperCase(), s.itemCount,
          s.subtotal, s.bundleDiscountTotal, s.total, s.cashTendered,
          s.changeAmount, s.artists, s.itemsSummary
        ];
      });
      transSheet.getRange(2, 1, transRows.length, 11).setValues(transRows);
    }

    // 2. Items Sold Sheet (Line-by-line)
    var itemsSheet = getOrCreateSheet(ss, "Items_Sold", [
      "Receipt ID", "Date & Time", "Item Name", "Category", "SubCategory",
      "Artist", "Price", "Quantity", "Discount", "Line Total", "Payment Method"
    ]);
    
    if (data.itemsSold && data.itemsSold.length > 0) {
      if (itemsSheet.getLastRow() > 1) {
        itemsSheet.getRange(2, 1, itemsSheet.getLastRow() - 1, 11).clearContent();
      }
      var itemRows = data.itemsSold.map(function(i) {
        return [
          i.receiptId, i.dateFormatted, i.name, i.category, i.subCategory,
          i.artist, i.price, i.quantity, i.bundleDiscount, i.finalLineTotal, i.paymentMethod.toUpperCase()
        ];
      });
      itemsSheet.getRange(2, 1, itemRows.length, 11).setValues(itemRows);
    }

    // 3. Artist Settlement Sheet
    var artistSheet = getOrCreateSheet(ss, "Artist_Settlement", [
      "Artist", "Items Sold", "Cash Sales", "PromptPay Sales", "Total Net Payout"
    ]);
    
    if (data.artistSummaries && data.artistSummaries.length > 0) {
      if (artistSheet.getLastRow() > 1) {
        artistSheet.getRange(2, 1, artistSheet.getLastRow() - 1, 5).clearContent();
      }
      var artistRows = data.artistSummaries.map(function(a) {
        return [
          a.artist, a.itemCount, a.cashSales, a.promptPaySales, a.totalSales
        ];
      });
      artistSheet.getRange(2, 1, artistRows.length, 5).setValues(artistRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", syncedAt: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}
`;
