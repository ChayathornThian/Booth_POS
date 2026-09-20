import React, { useState } from 'react';
import { X, Save, Plus, ShieldCheck, Volume2, VolumeX, FileSpreadsheet } from 'lucide-react';
import type { AppSettings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [boothName, setBoothName] = useState(settings.boothName);
  const [promptPayId, setPromptPayId] = useState(settings.promptPayId);
  const [promptPayName, setPromptPayName] = useState(settings.promptPayName || '');
  const [artists, setArtists] = useState<string[]>(settings.artists || ['INK', 'Field', 'General']);
  const [newArtistName, setNewArtistName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(settings.googleSheetsUrl || '');

  if (!isOpen) return null;

  const handleAddArtist = () => {
    const trimmed = newArtistName.trim();
    if (trimmed && !artists.includes(trimmed)) {
      setArtists([...artists, trimmed]);
      setNewArtistName('');
    }
  };

  const handleRemoveArtist = (name: string) => {
    if (artists.length <= 1) {
      alert('Must keep at least one artist');
      return;
    }
    setArtists(artists.filter(a => a !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      boothName: boothName.trim() || 'Art Booth',
      promptPayId: promptPayId.trim() || '0812345678',
      promptPayName: promptPayName.trim() || undefined,
      artists,
      soundEnabled,
      googleSheetsUrl: googleSheetsUrl.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Booth Settings</h2>
            <p className="text-xs text-slate-400">Configure your PromptPay and participating artists</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Booth Name */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Booth Name</label>
            <input
              type="text"
              required
              value={boothName}
              onChange={e => setBoothName(e.target.value)}
              placeholder="e.g. Art Fest Booth"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          {/* PromptPay Phone / National ID */}
          <div className="space-y-3 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900">PromptPay QR Configuration</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                PromptPay Phone or 13-digit National ID *
              </label>
              <input
                type="text"
                required
                value={promptPayId}
                onChange={e => setPromptPayId(e.target.value)}
                placeholder="0812345678 or 1234567890123"
                className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Account Display Name (Optional)
              </label>
              <input
                type="text"
                value={promptPayName}
                onChange={e => setPromptPayName(e.target.value)}
                placeholder="e.g. Somchai S."
                className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Generated offline on iPad. Test by scanning with your mobile banking app.
            </p>
          </div>

          {/* Google Sheets Sync URL */}
          <div className="space-y-2 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Google Sheets Sync Webhook</span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Google Apps Script Web App URL (Optional)
              </label>
              <input
                type="url"
                value={googleSheetsUrl}
                onChange={e => setGoogleSheetsUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-white border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Allows 1-click sync of transactions, line-item sales, and artist payouts to Google Sheets.
            </p>
          </div>

          {/* Artists Management */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Participating Artists in Shared Booth:
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newArtistName}
                onChange={e => setNewArtistName(e.target.value)}
                placeholder="Add artist name..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleAddArtist}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {artists.map(art => (
                <span
                  key={art}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                >
                  <span>{art}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveArtist(art)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="text-xs font-bold text-slate-700">Tap Sound & Checkout Chime</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={e => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
