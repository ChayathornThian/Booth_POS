import React, { useState, useEffect } from 'react';
import { X, QrCode, Banknote, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { generatePromptPayQRDataUrl } from '../../utils/promptpay';
import type { AppSettings } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  settings: AppSettings;
  onConfirmPayment: (method: 'promptpay' | 'cash', cashTendered?: number, changeAmount?: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  total,
  settings,
  onConfirmPayment
}) => {
  const [method, setMethod] = useState<'promptpay' | 'cash'>('promptpay');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [cashTendered, setCashTendered] = useState<number>(total);
  const [customCashInput, setCustomCashInput] = useState<string>(total.toString());

  // Quick cash bill denominations
  const quickBills = [
    { label: 'Exact', value: total },
    { label: '฿50', value: 50 },
    { label: '฿100', value: 100 },
    { label: '฿500', value: 500 },
    { label: '฿1,000', value: 1000 }
  ].filter(b => b.value >= total || b.label === 'Exact');

  // Generate offline QR code whenever modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      setIsGeneratingQR(true);
      setCashTendered(total);
      setCustomCashInput(total.toString());

      generatePromptPayQRDataUrl(settings.promptPayId, total)
        .then(url => {
          setQrDataUrl(url);
          setIsGeneratingQR(false);
        })
        .catch(err => {
          console.error('Failed to generate offline QR', err);
          setIsGeneratingQR(false);
        });
    }
  }, [isOpen, total, settings.promptPayId]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - total);
  const isCashSufficient = cashTendered >= total;

  const handleCashSelect = (amount: number) => {
    setCashTendered(amount);
    setCustomCashInput(amount.toString());
  };

  const handleCustomCashChange = (val: string) => {
    setCustomCashInput(val);
    const parsed = parseFloat(val);
    setCashTendered(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Payment Checkout</span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Total: ฿{total.toFixed(0)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setMethod('promptpay')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              method === 'promptpay'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>PromptPay QR</span>
          </button>

          <button
            onClick={() => setMethod('cash')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              method === 'cash'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash Tendered</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {method === 'promptpay' ? (
            /* PromptPay Tab: 100% Offline QR */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-64 h-64 rounded-3xl bg-white border-4 border-slate-800 p-3 shadow-2xl flex items-center justify-center relative">
                {isGeneratingQR ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <span>Generating Offline QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="PromptPay Offline QR" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <span className="text-xs text-rose-500">Failed to generate QR</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>EMVCo Verified • Works Without Internet</span>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  PromptPay ID: <span className="font-bold text-slate-200 font-mono">{settings.promptPayId}</span>
                  {settings.promptPayName && ` (${settings.promptPayName})`}
                </p>
              </div>

              <button
                onClick={() => onConfirmPayment('promptpay')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-98 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm PromptPay Received</span>
              </button>
            </div>
          ) : (
            /* Cash Tab: Quick Change Calculator */
            <div className="space-y-5">
              {/* Quick Bill Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Tendered Bills:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickBills.map(bill => (
                    <button
                      key={bill.label}
                      onClick={() => handleCashSelect(bill.value)}
                      className={`py-3 px-2 rounded-xl text-sm font-extrabold border-2 transition-all cursor-pointer active:scale-95 ${
                        cashTendered === bill.value
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60'
                      }`}
                    >
                      {bill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Cash Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Or Key In Custom Cash Received (฿):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-lg">฿</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={customCashInput}
                    onChange={e => handleCustomCashChange(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-xl font-black text-white focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Change Calculation Display Box */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  isCashSufficient
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {isCashSufficient ? 'Change to Return:' : 'Amount Insufficient:'}
                  </span>
                  <p className="text-xs opacity-80">
                    {isCashSufficient
                      ? `Given ฿${cashTendered.toFixed(0)} - Total ฿${total.toFixed(0)}`
                      : `Needs ฿${(total - cashTendered).toFixed(0)} more`}
                  </p>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  ฿{isCashSufficient ? changeDue.toFixed(0) : (total - cashTendered).toFixed(0)}
                </div>
              </div>

              <button
                onClick={() => onConfirmPayment('cash', cashTendered, changeDue)}
                disabled={!isCashSufficient}
                className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCashSufficient
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Cash Sale</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
