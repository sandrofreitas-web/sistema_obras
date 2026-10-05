import React from 'react';
import { Projeto, ItemFilaOffline } from '../types';
import {
  HardHat,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  FolderOpen,
  CloudUpload,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  activeProject: Projeto | null;
  projects: Projeto[];
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  isOnline: boolean;
  offlineQueue: ItemFilaOffline[];
  onOpenOfflineQueue: () => void;
  isMobileViewMode: boolean;
  onToggleMobileViewMode: () => void;
  onResetToPilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProject,
  isOnline,
  offlineQueue,
  onOpenOfflineQueue,
  isMobileViewMode,
  onToggleMobileViewMode,
  onResetToPilot,
}) => {
  const pendingOfflineCount = offlineQueue.filter((q) => q.status === 'pendente' || q.status === 'erro').length;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black flex-shrink-0">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white truncate">
                Obra<span className="text-amber-400">Certa</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Piloto ICENV
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 truncate">
              {activeProject?.pastaDocumentos ? (
                <span title={activeProject.pastaDocumentos} className="text-amber-400/90 font-mono text-[10px]">
                  📁 {activeProject.pastaDocumentos}
                </span>
              ) : (
                'Materiais, Orçamentos & Custos de Obra'
              )}
            </p>
          </div>
        </div>

        {/* Project Selector dropdown */}
        <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-4">
          <div className="relative w-full">
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400 transition-colors">
              <FolderOpen className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" />
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    onOpenNewProject();
                  } else {
                    onSelectProject(e.target.value);
                  }
                }}
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-200 outline-none truncate cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.nome}
                  </option>
                ))}
                <option value="__new__" className="bg-slate-900 text-amber-400 font-semibold">
                  + Criar Novo Projeto...
                </option>
              </select>
            </div>
          </div>
          {onResetToPilot && (
            <button
              onClick={onResetToPilot}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors"
              title="Recarregar Dados Oficiais do Projeto Piloto ICENV 2026"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right action badges */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Offline / Online indicator & queue */}
          {pendingOfflineCount > 0 ? (
            <button
              onClick={onOpenOfflineQueue}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/30 transition-all animate-pulse"
              title={`${pendingOfflineCount} fotos na fila offline para sincronizar`}
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span className="font-bold">{pendingOfflineCount}</span>
              <span className="hidden sm:inline">pendentes</span>
            </button>
          ) : (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${
                isOnline ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
              }`}
              title={isOnline ? 'Conectado à internet' : 'Sem conexão - Modo offline ativo na loja'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          )}

          {/* Desktop/Mobile preview simulator toggle (visible on desktop screens) */}
          <button
            onClick={onToggleMobileViewMode}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isMobileViewMode
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
            title="Alternar entre visualização Desktop ampla e simulador Mobile"
          >
            {isMobileViewMode ? (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulador Celular</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Layout Desktop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
