import React, { useState } from 'react';
import { X, Copy, Check, FileSpreadsheet, RefreshCw, ShieldCheck } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../utils/googleSheetsSync';
import type { AppSettings } from '../../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
  syncStatus: string | null;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTriggerSync,
  isSyncing,
  syncStatus
}) => {
  const [url, setUrl] = useState(settings.googleSheetsUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  };

  const handleSaveUrl = () => {
    onSaveSettings({
      ...settings,
      googleSheetsUrl: url.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Sync with Google Sheets</h2>
              <p className="text-xs text-slate-500">Live backup of transactions, sold items & artist settlements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-600">
          {/* Status Message */}
          {syncStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Web App URL Input */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">
              Google Apps Script Web App URL:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                Save
              </button>
            </div>
            {settings.lastSyncedAt && (
              <p className="text-[11px] text-slate-400">
                Last synced: {new Date(settings.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Big Sync Button */}
          <div>
            <button
              onClick={onTriggerSync}
              disabled={isSyncing || !url}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isSyncing || !url
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing to Google Sheets...' : 'Sync Now to Google Sheets'}</span>
            </button>
          </div>

          {/* Setup Instructions Accordion/Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                How to setup your Google Sheet (Takes 1 minute):
              </h3>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Script Code'}</span>
              </button>
            </div>

            <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 font-medium">
              <li>
                Open or create a new <strong>Google Sheet</strong>.
              </li>
              <li>
                Click <strong>Extensions → Apps Script</strong> in the top menu.
              </li>
              <li>
                Click <strong>"Copy Script Code"</strong> above, replace the code in Apps Script, and click the <strong>Save (Floppy disk)</strong> icon.
              </li>
              <li>
                Click <strong>Deploy → New deployment</strong> (top right):
                <ul className="list-disc pl-4 text-[11px] text-slate-500 mt-1 space-y-0.5">
                  <li>Select type: <strong>Web app</strong></li>
                  <li>Execute as: <strong>Me</strong></li>
                  <li>Who has access: <strong>Anyone</strong> (critical for direct sync)</li>
                </ul>
              </li>
              <li>
                Click <strong>Deploy</strong>, copy the <strong>Web App URL</strong>, and paste it in the box above!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
