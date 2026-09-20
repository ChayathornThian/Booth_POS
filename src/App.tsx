import { useState, useEffect, useCallback } from 'react';
import type { Product, SaleRecord, AppSettings } from './types';
import { db, getSettings, saveSettings, seedInitialProductsIfEmpty } from './db/db';
import { Navbar } from './components/Navbar';
import { PosTerminal } from './components/pos/PosTerminal';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsModal } from './components/settings/SettingsModal';
import { GoogleSheetsModal } from './components/sync/GoogleSheetsModal';
import { CloudSyncModal } from './components/sync/CloudSyncModal';
import { LiveMonitorDashboard } from './components/dashboard/LiveMonitorDashboard';
import { syncToGoogleSheets } from './utils/googleSheetsSync';
import { initFirebase } from './firebase/config';
import { subscribeToCloudBooth } from './firebase/sync';

export function App() {
  const [currentTab, setCurrentTab] = useState<'pos' | 'inventory' | 'reports'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    boothName: 'Art Fest Booth',
    promptPayId: '0812345678',
    promptPayName: 'Booth PromptPay',
    artists: ['INK', 'Field', 'General'],
    soundEnabled: true,
    cloudSyncEnabled: true,
    boothId: 'boothsuay'
  });

  const [isMonitorMode, setIsMonitorMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isSyncingToSheets, setIsSyncingToSheets] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load products from local IndexedDB
  const refreshProducts = useCallback(async () => {
    try {
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch (err) {
      console.error('Failed to load products from IndexedDB', err);
    }
  }, []);

  // Load sales ledger from local IndexedDB
  const refreshSales = useCallback(async () => {
    try {
      const allSales = await db.sales.reverse().toArray();
      setSales(allSales);
    } catch (err) {
      console.error('Failed to load sales from IndexedDB', err);
    }
  }, []);

  // Load settings
  const refreshSettings = useCallback(async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  }, []);

  // Initialize DB on first launch
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await seedInitialProductsIfEmpty();
      await refreshSettings();
      await refreshProducts();
      await refreshSales();

      // Check URL query parameters for ?mode=monitor or ?booth=xxx
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const booth = params.get('booth');

      if (mode === 'monitor') {
        setIsMonitorMode(true);
      }
      if (booth) {
        setSettings(prev => ({ ...prev, boothId: booth }));
      }

      setIsLoading(false);
    }
    init();
  }, [refreshSettings, refreshProducts, refreshSales]);

  // Firebase real-time subscription for live sync across devices
  useEffect(() => {
    if (!settings.cloudSyncEnabled || !settings.boothId) {
      setIsCloudConnected(false);
      return;
    }

    const { db: firestore } = initFirebase(settings.firebaseConfig);
    if (!firestore) {
      setIsCloudConnected(false);
      return;
    }

    setIsCloudConnected(true);

    const unsubscribe = subscribeToCloudBooth(
      settings.boothId,
      remoteProducts => {
        if (remoteProducts.length > 0) {
          setProducts(remoteProducts);
        }
      },
      remoteSales => {
        if (remoteSales.length > 0) {
          setSales(remoteSales);
        }
      },
      err => {
        console.error('Cloud booth sync error', err);
        setIsCloudConnected(false);
      }
    );

    return () => unsubscribe();
  }, [settings.cloudSyncEnabled, settings.boothId, settings.firebaseConfig]);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleSound = async () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleSyncToGoogleSheets = async () => {
    if (!settings.googleSheetsUrl) {
      alert('Please enter your Google Apps Script Web App URL first.');
      return;
    }

    setIsSyncingToSheets(true);
    setSheetsSyncStatus(null);

    const result = await syncToGoogleSheets(
      settings.googleSheetsUrl,
      sales,
      products,
      settings.boothName
    );

    setIsSyncingToSheets(false);
    setSheetsSyncStatus(result.message);

    if (result.success) {
      const updated = { ...settings, lastSyncedAt: new Date().toISOString() };
      setSettings(updated);
      await saveSettings(updated);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-2xl font-black mb-3 animate-pulse">
          🎨
        </div>
        <h2 className="font-bold text-lg">Loading BoothPOS V2...</h2>
        <p className="text-xs text-slate-400 mt-1">Starting 100% offline local database</p>
      </div>
    );
  }

  // Live Remote Monitor Dashboard Mode
  if (isMonitorMode) {
    return (
      <LiveMonitorDashboard
        products={products}
        sales={sales}
        settings={settings}
        onSwitchToTerminal={() => setIsMonitorMode(false)}
        isCloudConnected={isCloudConnected}
      />
    );
  }

  // Standard Cashier Terminal Mode
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onSwitchToMonitor={() => setIsMonitorMode(true)}
        settings={settings}
        onToggleSound={handleToggleSound}
        cartCount={0}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Screen Views */}
      <main className="flex-1 flex overflow-hidden">
        {currentTab === 'pos' && (
          <PosTerminal
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
            onRefreshSales={refreshSales}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            products={products}
            settings={settings}
            onRefreshProducts={refreshProducts}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            sales={sales}
            onRefreshSales={refreshSales}
            onRefreshProducts={refreshProducts}
            onOpenGoogleSheetsSync={() => setIsGoogleSheetsOpen(true)}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Cloud Database & Live Monitor Settings Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        settings={settings}
        products={products}
        onSaveSettings={handleSaveSettings}
        isCloudConnected={isCloudConnected}
        onRefreshCloudSync={() => {}}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTriggerSync={handleSyncToGoogleSheets}
        isSyncing={isSyncingToSheets}
        syncStatus={sheetsSyncStatus}
      />
    </div>
  );
}

export default App;
