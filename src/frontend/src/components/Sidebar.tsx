import React from 'react';
import {
  HardHat,
  Calculator,
  Layers,
  TrendingUp,
  Hammer,
  ListTree,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Camera,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { TabType } from './Navigation';
import { ItemFilaOffline } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenCapture: () => void;
  isOnline: boolean;
  offlineQueue: ItemFilaOffline[];
  onOpenOfflineQueue: () => void;
  onResetToPilot?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCapture,
  isOnline,
  offlineQueue,
  onOpenOfflineQueue,
  onResetToPilot,
}) => {
  const pendingOfflineCount = offlineQueue.filter((q) => q.status === 'pendente' || q.status === 'erro').length;

  const navItems = [
    {
      id: 'orcamento' as TabType,
      label: 'Orçamento (WBS)',
      short: 'EAP',
      icon: Calculator,
      desc: 'Estrutura analítica de custos e BDI',
    },
    {
      id: 'catalogo' as TabType,
      label: 'Catálogo de Insumos',
      short: 'Insumos',
      icon: Layers,
      desc: 'Preços cotados e materiais',
    },
    {
      id: 'execucao' as TabType,
      label: 'Compras & NF',
      short: 'Compras',
      icon: TrendingUp,
      desc: 'Notas fiscais e desembolso',
    },
    {
      id: 'etapas' as TabType,
      label: 'Cronograma Físico',
      short: 'Etapas',
      icon: Hammer,
      desc: 'Avanço e diário de obra (RDO)',
    },
    {
      id: 'taxonomia' as TabType,
      label: 'Taxonomia & SINAPI',
      short: 'Classes',
      icon: ListTree,
      desc: 'Classes e estrutura técnica',
    },
  ];

  return (
    <aside className="w-16 hover:w-56 group transition-all duration-300 ease-in-out bg-[#070a12] border-r border-slate-800/80 flex flex-col justify-between z-30 select-none flex-shrink-0 relative shadow-xl">
      {/* Top Brand Logo */}
      <div className="flex flex-col">
        <div className="h-14 flex items-center px-3.5 border-b border-slate-800/60 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-md shadow-amber-400/10">
            <HardHat className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            <span className="font-extrabold text-sm tracking-tight text-white block">
              Obra<span className="text-amber-400">Certa</span>
            </span>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider block -mt-0.5">
              ERP Engenharia
            </span>
          </div>
        </div>

        {/* Quick Action: Capturar Etiqueta */}
        <div className="p-2 border-b border-slate-800/50">
          <button
            onClick={onOpenCapture}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-slate-950 border border-amber-400/30 hover:border-amber-400 transition-all font-bold group/btn shadow-sm"
            title="Fotografar Etiqueta / OCR"
          >
            <Camera className="w-5 h-5 flex-shrink-0 stroke-[2.4]" />
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              + Capturar OCR
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/15'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className={`text-[10px] block -mt-0.5 ${isActive ? 'text-slate-900/80 font-medium' : 'text-slate-500'}`}>
                    {item.short}
                  </span>
                </div>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full group-hover:hidden" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry & Utilities */}
      <div className="p-2 border-t border-slate-800/60 space-y-2">
        {/* Offline Queue Indicator */}
        {pendingOfflineCount > 0 ? (
          <button
            onClick={onOpenOfflineQueue}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse"
            title={`${pendingOfflineCount} capturas na fila offline`}
          >
            <CloudUpload className="w-4 h-4 flex-shrink-0" />
            <span className="text-[11px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {pendingOfflineCount} pendentes
            </span>
          </button>
        ) : (
          <div
            className={`flex items-center gap-2 p-2 rounded-xl text-[11px] font-medium transition-all ${
              isOnline
                ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/30'
                : 'text-rose-400 bg-rose-950/30 border border-rose-800/30'
            }`}
            title={isOnline ? 'Online (Sincronizado)' : 'Offline'}
          >
            {isOnline ? <Wifi className="w-4 h-4 flex-shrink-0" /> : <WifiOff className="w-4 h-4 flex-shrink-0" />}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap font-mono text-[10px]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        )}

        {/* Reset Piloto Button */}
        {onResetToPilot && (
          <button
            onClick={onResetToPilot}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
            title="Recarregar Dados Oficiais do Piloto ICENV 2026"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Recarregar Piloto
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
