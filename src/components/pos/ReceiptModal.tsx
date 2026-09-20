import React from 'react';
import { CheckCircle2, Printer, X } from 'lucide-react';
import type { SaleRecord } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: SaleRecord | null;
  onClose: () => void;
  boothName: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  sale,
  onClose,
  boothName
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Receipt Header Banner */}
        <div className="bg-emerald-600 text-white p-4 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-100" />
          <h3 className="font-extrabold text-lg">Sale Recorded!</h3>
          <p className="text-xs text-emerald-100">Receipt #{sale.receiptId}</p>
        </div>

        {/* Paper Receipt Styling */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-3 bg-slate-50 border-y border-dashed border-slate-300">
          <div className="text-center pb-2 border-b border-slate-200">
            <h4 className="font-bold text-sm tracking-wider uppercase text-slate-900">{boothName}</h4>
            <p className="text-[10px] text-slate-400">{new Date(sale.timestamp).toLocaleString()}</p>
          </div>

          {/* Line items */}
          <div className="space-y-1.5 py-1">
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <span>{item.name}</span>
                  <div className="text-[10px] text-slate-400">
                    {item.quantity} × ฿{item.price.toFixed(0)} ({item.artist})
                  </div>
                </div>
                <div className="text-right font-bold">
                  ฿{item.finalLineTotal.toFixed(0)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>฿{sale.subtotal.toFixed(0)}</span>
            </div>
            {sale.bundleDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Bundle Deals:</span>
                <span>-฿{sale.bundleDiscountTotal.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300 text-slate-950">
              <span>TOTAL:</span>
              <span>฿{sale.total.toFixed(0)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Paid Via:</span>
              <span className="font-bold uppercase text-slate-700">{sale.paymentMethod}</span>
            </div>
            {sale.paymentMethod === 'cash' && sale.cashTendered !== undefined && (
              <>
                <div className="flex justify-between">
                  <span>Cash Received:</span>
                  <span>฿{sale.cashTendered.toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Change Given:</span>
                  <span>฿{(sale.changeAmount || 0).toFixed(0)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400">
            Thank you for supporting our art! 💖
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
