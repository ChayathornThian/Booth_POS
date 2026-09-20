import type { SaleRecord, ArtistSummary } from '../types';

/**
 * Calculates real-time artist summary from sales records
 */
export function calculateArtistSummaries(sales: SaleRecord[]): ArtistSummary[] {
  const summaryMap = new Map<string, ArtistSummary>();

  for (const sale of sales) {
    if (sale.status === 'voided') continue;

    for (const item of sale.items) {
      const artist = item.artist || 'General';
      let entry = summaryMap.get(artist);
      if (!entry) {
        entry = {
          artist,
          itemCount: 0,
          totalSales: 0,
          cashSales: 0,
          promptPaySales: 0
        };
        summaryMap.set(artist, entry);
      }

      entry.itemCount += item.quantity;
      entry.totalSales += item.finalLineTotal;

      if (sale.paymentMethod === 'cash') {
        entry.cashSales += item.finalLineTotal;
      } else {
        entry.promptPaySales += item.finalLineTotal;
      }
    }
  }

  return Array.from(summaryMap.values()).sort((a, b) => b.totalSales - a.totalSales);
}
