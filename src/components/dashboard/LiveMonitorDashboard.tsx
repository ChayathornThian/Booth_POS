import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  Banknote, 
  QrCode, 
  AlertTriangle, 
  Share2, 
  Check, 
  ArrowLeft, 
  Radio, 
  Clock 
} from 'lucide-react';
import type { Product, SaleRecord, AppSettings } from '../../types';
import { calculateArtistSummaries } from '../../utils/artistSummary';
import { getArtistColor } from '../pos/CategoryBar';

interface LiveMonitorDashboardProps {
  products: Product[];
  sales: SaleRecord[];
  settings: AppSettings;
  onSwitchToTerminal: () => void;
  isCloudConnected: boolean;
}

export const LiveMonitorDashboard: React.FC<LiveMonitorDashboardProps> = ({
  products,
  sales,
  settings,
  onSwitchToTerminal,
  isCloudConnected
}) => {
  const [selectedArtist, setSelectedArtist] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);

  // Overall totals
  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.total, 0), [sales]);
  const totalItemsSold = useMemo(() => sales.reduce((sum, s) => sum + s.itemCount, 0), [sales]);
  const cashRevenue = useMemo(() => 
    sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0), [sales]
  );
  const promptPayRevenue = useMemo(() => 
    sales.filter(s => s.paymentMethod === 'promptpay').reduce((sum, s) => sum + s.total, 0), [sales]
  );

  // Artist summaries
  const artistSummaries = useMemo(() => calculateArtistSummaries(sales), [sales]);

  // Low stock products (stock <= 5)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock !== undefined && p.stock <= 5);
  }, [products]);

  // Filtered sales feed
  const filteredSales = useMemo(() => {
    if (selectedArtist === 'All') return sales;
    return sales.filter(s => s.items.some(i => (i.artist || 'General') === selectedArtist));
  }, [sales, selectedArtist]);

  const handleCopyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'monitor');
    if (settings.boothId) {
      url.searchParams.set('booth', settings.boothId);
    }
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert('Link: ' + url.toString());
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto select-none font-sans">
      {/* Top Banner Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 p-4 md:px-8 sticky top-0 z-20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToTerminal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cashier Terminal</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">{settings.boothName}</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Live Monitor Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Booth ID: <span className="font-mono text-indigo-400 font-bold">{settings.boothId || 'default'}</span>
            </p>
          </div>
        </div>

        {/* Live Status & Share Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-300">
              {isCloudConnected ? 'Live Cloud Connected' : 'Local Standby'}
            </span>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            title="Copy shareable link for other artists"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Monitor Link'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Revenue */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              ฿{totalRevenue.toFixed(0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">{sales.length} completed transactions</span>
          </div>

          {/* Items Sold */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Items Sold</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-300 tracking-tight">
              {totalItemsSold}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">units purchased</span>
          </div>

          {/* Cash in Pouch */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cash in Pouch</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              ฿{cashRevenue.toFixed(0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">physical cash collected</span>
          </div>

          {/* PromptPay in Bank */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">PromptPay</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-400 tracking-tight">
              ฿{promptPayRevenue.toFixed(0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">bank account transfers</span>
          </div>
        </div>

        {/* Low Stock Warning Alert Banner (if any) */}
        {lowStockProducts.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Low Stock Alerts on Table ({lowStockProducts.length} items need restock)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <span
                  key={p.id}
                  className="px-3 py-1 rounded-xl bg-rose-900/50 border border-rose-700/60 text-rose-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{p.name}</span>
                  <span className="text-[11px] font-black px-1.5 py-0.2 rounded bg-rose-700 text-white">
                    {p.stock} left
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Artist Settlements Table */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Artist Sales Breakdown
              </h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Filter:</span>
              <select
                value={selectedArtist}
                onChange={e => setSelectedArtist(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
              >
                <option value="All">All Artists</option>
                {settings.artists.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Artist</th>
                  <th className="py-3 px-3 text-center">Items Sold</th>
                  <th className="py-3 px-3">Cash Share</th>
                  <th className="py-3 px-3">PromptPay Share</th>
                  <th className="py-3 px-4 text-right">Net Payout Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {artistSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No sales recorded yet for this session.
                    </td>
                  </tr>
                ) : (
                  artistSummaries
                    .filter(a => selectedArtist === 'All' || a.artist === selectedArtist)
                    .map(art => {
                      const artistStyle = getArtistColor(art.artist);
                      return (
                        <tr key={art.artist} className="hover:bg-slate-700/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${artistStyle.bg} ${artistStyle.text} ${artistStyle.border}`}>
                              {art.artist}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-white text-sm">
                            {art.itemCount}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-emerald-400">
                            ฿{art.cashSales.toFixed(0)}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-blue-400">
                            ฿{art.promptPaySales.toFixed(0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-300 text-base">
                            ฿{art.totalSales.toFixed(0)}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Transaction Activity Stream */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Sales Activity Feed
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'}
            </span>
          </div>

          <div className="divide-y divide-slate-700/60 max-h-96 overflow-y-auto">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No transactions yet. Sales rung up at the booth will appear here in real time!
              </div>
            ) : (
              filteredSales.slice(0, 30).map(sale => (
                <div key={sale.id || sale.receiptId} className="p-3.5 hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      sale.paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {sale.paymentMethod === 'cash' ? '฿' : 'QR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">#{sale.receiptId}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                        {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-white">
                      ฿{sale.total.toFixed(0)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {sale.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
