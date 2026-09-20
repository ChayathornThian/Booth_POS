import React from 'react';
import { ShoppingBag, Package, BarChart3, Settings, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import type { AppSettings } from '../types';

interface NavbarProps {
  currentTab: 'pos' | 'inventory' | 'reports';
  onSelectTab: (tab: 'pos' | 'inventory' | 'reports') => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onToggleSound: () => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  settings,
  onToggleSound,
  cartCount
}) => {
  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-5 border-b border-slate-800 shrink-0 select-none">
      {/* Booth Brand & Offline Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-xl font-black shadow-md shadow-amber-500/20">
          🎨
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">{settings.boothName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              100% Offline Ready
            </span>
          </div>
          <p className="text-xs text-slate-400">BoothPOS V2 • iPad Terminal</p>
        </div>
      </div>

      {/* Main Tab Navigation (Large Touch Buttons) */}
      <nav className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50">
        <button
          onClick={() => onSelectTab('pos')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
            currentTab === 'pos'
              ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>POS Terminal</span>
          {cartCount > 0 && (
            <span className="ml-1 px-2 py-0.2 text-xs rounded-full bg-amber-400 text-slate-950 font-bold">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('inventory')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
            currentTab === 'inventory'
              ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & CSV</span>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
            currentTab === 'reports'
              ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales & Settlement</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSound}
          title={settings.soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          className={`p-2.5 rounded-xl border transition-all ${
            settings.soundEnabled
              ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
              : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
        >
          {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Booth Settings"
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
