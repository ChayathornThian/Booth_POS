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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-xl font-black text-white">Booth Settings</h2>
            <p className="text-xs text-slate-400">Configure your PromptPay and participating artists</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Booth Name */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Booth Name</label>
            <input
              type="text"
              required
              value={boothName}
              onChange={e => setBoothName(e.target.value)}
              placeholder="e.g. Art Fest Booth"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:bg-slate-900 focus:border-indigo-500 outline-none placeholder:text-slate-600"
            />
          </div>

          {/* PromptPay Phone / National ID */}
          <div className="space-y-3 p-4 bg-indigo-950/30 rounded-2xl border border-indigo-900/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">PromptPay QR Configuration</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                PromptPay Phone or 13-digit National ID *
              </label>
              <input
                type="text"
                required
                value={promptPayId}
                onChange={e => setPromptPayId(e.target.value)}
                placeholder="0812345678 or 1234567890123"
                className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:border-indigo-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Account Display Name (Optional)
              </label>
              <input
                type="text"
                value={promptPayName}
                onChange={e => setPromptPayName(e.target.value)}
                placeholder="e.g. Somchai S."
                className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-400 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Generated offline on iPad. Test by scanning with your mobile banking app.
            </p>
          </div>

          {/* Google Sheets Sync URL */}
          <div className="space-y-2 p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/50">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Google Sheets Sync Webhook</span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Google Apps Script Web App URL (Optional)
              </label>
              <input
                type="url"
                value={googleSheetsUrl}
                onChange={e => setGoogleSheetsUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:border-emerald-400 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Allows 1-click sync of transactions, line-item sales, and artist payouts to Google Sheets.
            </p>
          </div>

          {/* Artists Management */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">
              Participating Artists in Shared Booth:
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newArtistName}
                onChange={e => setNewArtistName(e.target.value)}
                placeholder="Add artist name..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddArtist}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {artists.map(art => (
                <span
                  key={art}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700"
                >
                  <span>{art}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveArtist(art)}
                    className="text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="text-xs font-bold text-slate-300">Tap Sound & Checkout Chime</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={e => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-500 rounded-sm focus:ring-indigo-500 cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
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
