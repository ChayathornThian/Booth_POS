import React, { useState } from 'react';
import { X, Cloud, Save, UploadCloud, Check } from 'lucide-react';
import type { AppSettings, FirebaseConfig, Product } from '../../types';
import { uploadAllProductsToCloud } from '../../firebase/sync';
import { initFirebase } from '../../firebase/config';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  products: Product[];
  onSaveSettings: (settings: AppSettings) => void;
  isCloudConnected: boolean;
  onRefreshCloudSync: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  settings,
  products,
  onSaveSettings,
  isCloudConnected,
  onRefreshCloudSync
}) => {
  const [enabled, setEnabled] = useState(settings.cloudSyncEnabled || false);
  const [boothId, setBoothId] = useState(settings.boothId || 'art-booth-01');
  const [configText, setConfigText] = useState('');
  const [apiKey, setApiKey] = useState(settings.firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(settings.firebaseConfig?.projectId || '');
  const [appId, setAppId] = useState(settings.firebaseConfig?.appId || '');
  const [authDomain, setAuthDomain] = useState(settings.firebaseConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(settings.firebaseConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(settings.firebaseConfig?.messagingSenderId || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-parse when user pastes the entire `const firebaseConfig = { ... }` block
  const handleConfigPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setConfigText(val);

    try {
      const getVal = (key: string) => {
        const match = val.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
        return match ? match[1] : '';
      };

      const extractedApiKey = getVal('apiKey');
      const extractedProjectId = getVal('projectId');
      const extractedAppId = getVal('appId');
      const extractedAuthDomain = getVal('authDomain');
      const extractedBucket = getVal('storageBucket');
      const extractedSenderId = getVal('messagingSenderId');

      if (extractedApiKey) setApiKey(extractedApiKey);
      if (extractedProjectId) setProjectId(extractedProjectId);
      if (extractedAppId) setAppId(extractedAppId);
      if (extractedAuthDomain) setAuthDomain(extractedAuthDomain);
      if (extractedBucket) setStorageBucket(extractedBucket);
      if (extractedSenderId) setMessagingSenderId(extractedSenderId);
    } catch (err) {
      console.debug('Paste parse err', err);
    }
  };

  const handleSave = () => {
    const fbConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    onSaveSettings({
      ...settings,
      cloudSyncEnabled: enabled,
      boothId: boothId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      firebaseConfig: fbConfig
    });

    initFirebase(fbConfig);
    onRefreshCloudSync();
    onClose();
  };

  const handleUploadProducts = async () => {
    if (!boothId.trim()) {
      alert('Please set a Booth ID first');
      return;
    }
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const count = await uploadAllProductsToCloud(boothId, products);
      setUploadMessage(`Successfully uploaded ${count} products to the cloud!`);
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err) {
      console.error('Failed to upload products to cloud', err);
      alert('Failed to upload to cloud. Please check your Firebase settings & internet.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none font-sans">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Cloud Database & Live Monitor</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCloudConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isCloudConnected ? 'Connected' : 'Offline / Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-time sync to Firebase for separate remote dashboards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4.5 flex-1 text-xs text-slate-600">
          {uploadMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {/* Cloud Enable & Booth ID */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block">Enable Cloud Real-Time Sync</span>
                <span className="text-slate-400 text-[11px]">Stream sales and live stock to other phones & monitors</span>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-sm focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Booth Shared ID (e.g. `boothsuay`):
              </label>
              <input
                type="text"
                value={boothId}
                onChange={e => setBoothId(e.target.value)}
                placeholder="booth-artfest-2026"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Share this Booth ID or the Monitor link with friends so they can view your live dashboard.
              </p>
            </div>
          </div>

          {/* Quick Paste Firebase Config */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">
                Paste Firebase Web App Config:
              </label>
              <span className="text-[10px] font-semibold text-indigo-600">Auto-fills all fields below</span>
            </div>
            <textarea
              rows={3}
              value={configText}
              onChange={handleConfigPaste}
              placeholder="Paste `const firebaseConfig = { ... }` directly from Firebase Console..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Individual Fields (Optional Manual Entry) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">API Key *</label>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Project ID *</label>
              <input
                type="text"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="my-art-pos-123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">App ID *</label>
              <input
                type="text"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="1:123456:web:abcd"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={e => setAuthDomain(e.target.value)}
                placeholder="project.firebaseapp.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleSave}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect Cloud Database</span>
            </button>

            {isCloudConnected && (
              <button
                onClick={handleUploadProducts}
                disabled={isUploading}
                className="w-full py-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>{isUploading ? 'Uploading Products...' : `Upload ${products.length} Local Products to Cloud`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
