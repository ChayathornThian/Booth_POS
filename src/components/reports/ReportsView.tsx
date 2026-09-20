import React, { useState } from 'react';
import { Download, Banknote, QrCode, TrendingUp, Package, Trash2, ArrowDownToLine, FileSpreadsheet } from 'lucide-react';
import type { SaleRecord } from '../../types';
import { calculateArtistSummaries } from '../../utils/artistSummary';
import { exportSalesToCsv, exportItemizedSalesToCsv } from '../../utils/csvHelper';
import { getArtistColor } from '../pos/CategoryBar';
import { db } from '../../db/db';

interface ReportsViewProps {
  sales: SaleRecord[];
  onRefreshSales: () => void;
  onRefreshProducts: () => void;
  onOpenGoogleSheetsSync: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  onRefreshSales,
  onRefreshProducts,
  onOpenGoogleSheetsSync
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'artists' | 'transactions'>('artists');

  // Overall totals
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.itemCount, 0);
  const cashRevenue = sales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);
  const promptPayRevenue = sales
    .filter(s => s.paymentMethod === 'promptpay')
    .reduce((sum, s) => sum + s.total, 0);

  // Artist summaries
  const artistSummaries = React.useMemo(() => {
    return calculateArtistSummaries(sales);
  }, [sales]);

  const handleVoidSale = async (sale: SaleRecord) => {
    if (!sale.id) return;
    if (window.confirm(`Void Receipt #${sale.receiptId}? This will restore product stocks.`)) {
      // Restore stocks
      for (const item of sale.items) {
        if (item.productId && typeof item.productId === 'number') {
          const prod = await db.products.get(item.productId);
          if (prod) {
            await db.products.update(item.productId, { stock: prod.stock + item.quantity });
          }
        }
      }
      // Delete sale record
      await db.sales.delete(sale.id);
      onRefreshSales();
      onRefreshProducts();
    }
  };

  const handleClearAllSales = async () => {
    if (window.confirm('WARNING: Are you sure you want to clear all sales data? Make sure you exported CSV first!')) {
      await db.sales.clear();
      onRefreshSales();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Action Header */}
      <div className="bg-white border-b border-slate-200 p-5 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales & Artist Settlement</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {sales.length} orders completed • Multi-artist payout breakdown
          </p>
        </div>

        {/* Export & Sync Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGoogleSheetsSync}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sync to Google Sheet</span>
          </button>

          <button
            onClick={() => exportSalesToCsv(sales)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-slate-900/15 transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            <span>Export Transactions CSV</span>
          </button>

          <button
            onClick={() => exportItemizedSalesToCsv(sales)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Items Sold CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-4 gap-4 p-5 shrink-0">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">฿{totalRevenue.toFixed(0)}</span>
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Items Sold</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalItemsSold}</span>
          </div>
        </div>

        {/* Cash in Pouch */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cash in Pouch</span>
            <span className="text-2xl font-black text-emerald-700 tracking-tight">฿{cashRevenue.toFixed(0)}</span>
          </div>
        </div>

        {/* PromptPay in Bank */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PromptPay (Bank)</span>
            <span className="text-2xl font-black text-blue-700 tracking-tight">฿{promptPayRevenue.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="px-5 pb-3 flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('artists')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'artists'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Artist Settlement Breakdown
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Transaction Ledger ({sales.length})
          </button>
        </div>

        {sales.length > 0 && (
          <button
            onClick={handleClearAllSales}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Sales Log</span>
          </button>
        )}
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {activeSubTab === 'artists' ? (
          /* Multi-Artist Settlement Table */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Artist</th>
                  <th className="py-3.5 px-3 text-center">Items Sold</th>
                  <th className="py-3.5 px-3">Cash Earned</th>
                  <th className="py-3.5 px-3">PromptPay Earned</th>
                  <th className="py-3.5 px-4 text-right">Total Net Payout Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {artistSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No sales recorded yet. Ring up items in the POS to see live artist splits!
                    </td>
                  </tr>
                ) : (
                  artistSummaries.map(art => {
                    const artistStyle = getArtistColor(art.artist);
                    return (
                      <tr key={art.artist} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${artistStyle.bg} ${artistStyle.text} ${artistStyle.border}`}>
                            {art.artist}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center font-bold text-slate-800 text-sm">
                          {art.itemCount}
                        </td>
                        <td className="py-4 px-3 font-semibold text-emerald-700">
                          ฿{art.cashSales.toFixed(0)}
                        </td>
                        <td className="py-4 px-3 font-semibold text-blue-700">
                          ฿{art.promptPaySales.toFixed(0)}
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900 text-base">
                          ฿{art.totalSales.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Transaction Ledger Table */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Receipt</th>
                  <th className="py-3.5 px-3">Time</th>
                  <th className="py-3.5 px-3">Items</th>
                  <th className="py-3.5 px-3">Method</th>
                  <th className="py-3.5 px-3 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.receiptId}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="line-clamp-1 max-w-xs">
                          {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          sale.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-sm">
                        ฿{sale.total.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleVoidSale(sale)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                          title="Void transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
