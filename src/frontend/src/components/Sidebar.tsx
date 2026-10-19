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
  LayoutDashboard,
  FileText,
  Briefcase,
  Store,
} from 'lucide-react';
import { TabType } from './Navigation';
import { ItemFilaOffline } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOnline: boolean;
  offlineQueue: ItemFilaOffline[];
  onOpenOfflineQueue: () => void;
  onResetToPilot?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  short: string;
  icon: any;
  desc: string;
  badge?: string;
}

interface NavCategory {
  id: string;
  titulo: string;
  itens: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOnline,
  offlineQueue,
  onOpenOfflineQueue,
  onResetToPilot,
}) => {
  const pendingOfflineCount = offlineQueue.filter((q) => q.status === 'pendente' || q.status === 'erro').length;

  const categories: NavCategory[] = [
    {
      id: 'cat-gestao',
      titulo: 'Gestão & Diretoria',
      itens: [
        {
          id: 'dashboard',
          label: 'Cockpit & Relatórios',
          short: 'Visão Executiva & Curva S',
          icon: LayoutDashboard,
          desc: 'Visão executiva, Curva S e faturas auditadas',
        },
        {
          id: 'projetos',
          label: 'Obras & Projetos',
          short: 'Portfólio de Obras',
          icon: Briefcase,
          desc: 'Projetos em andamento e concluídos',
        },
        {
          id: 'canteiro',
          label: 'Painel de Canteiro',
          short: 'Visão Macro de Campo',
          icon: HardHat,
          desc: 'Termômetro da obra e frente ativa do mestre',
          badge: 'Campo',
        },
      ],
    },
    {
      id: 'cat-engenharia',
      titulo: 'Engenharia & Projetos',
      itens: [
        {
          id: 'plantas',
          label: 'Plantas & Revisões',
          short: 'Projetos DWG/PDF',
          icon: FileText,
          desc: 'Pranchas R00, R01 e As-Built',
        },
        {
          id: 'orcamento',
          label: 'Orçamento (WBS)',
          short: 'EAP & Cenários de Custo',
          icon: Calculator,
          desc: 'Estrutura analítica de custos e BDI',
        },
        {
          id: 'etapas',
          label: 'Cronograma Físico',
          short: 'Diário de Obra (RDO)',
          icon: Hammer,
          desc: 'Avanço e diário de obra com fotos',
        },
      ],
    },
    {
      id: 'cat-suprimentos',
      titulo: 'Suprimentos & Finanças',
      itens: [
        {
          id: 'execucao',
          label: 'Compras & Notas Fiscais',
          short: 'Desembolso Real Auditado',
          icon: TrendingUp,
          desc: 'Notas fiscais auditadas e compras reais',
        },
        {
          id: 'fornecedores',
          label: 'Lojas & Fornecedores',
          short: 'Parceiros ICENV & Balcão',
          icon: Store,
          desc: 'Rede credenciada e listas de cotação',
        },
        {
          id: 'catalogo',
          label: 'Catálogo de Insumos',
          short: 'Base de Preços & Embalagem',
          icon: Layers,
          desc: 'Preços cotados e materiais',
        },
      ],
    },
    {
      id: 'cat-normas',
      titulo: 'Tabelas & Normas',
      itens: [
        {
          id: 'taxonomia',
          label: 'Taxonomia & SINAPI',
          short: 'Classificação Técnica SP',
          icon: ListTree,
          desc: 'Classes e estrutura técnica SEINFRA/SINAPI',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#070a12] border-r border-slate-800/80 flex flex-col justify-between z-30 select-none flex-shrink-0 shadow-2xl h-full">
      {/* Top Brand Logo */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="h-14 flex items-center px-4 border-b border-slate-800/60 overflow-hidden flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-md shadow-amber-400/20">
            <HardHat className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="ml-3 whitespace-nowrap overflow-hidden">
            <span className="font-extrabold text-sm tracking-tight text-white block">
              Obra<span className="text-amber-400">Certa</span>
            </span>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider block -mt-0.5">
              ERP Engenharia
            </span>
          </div>
        </div>

        {/* Navigation Categories and Sub-Items */}
        <nav className="p-2 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <div className="px-3 pt-2 pb-0.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                  {category.titulo}
                </span>
              </div>

              {/* Sub-Items */}
              <div className="space-y-0.5">
                {category.itens.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/15'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                      title={item.desc}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                      <div className="whitespace-nowrap overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold block truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-tight ${
                              isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-400/20 text-amber-300'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] block -mt-0.5 truncate ${isActive ? 'text-slate-900/80 font-medium' : 'text-slate-400'}`}>
                          {item.short}
                        </span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Telemetry & Utilities */}
      <div className="p-3 border-t border-slate-800/60 space-y-2 bg-[#06080e] flex-shrink-0">
        {/* Offline Queue Indicator */}
        {pendingOfflineCount > 0 ? (
          <button
            onClick={onOpenOfflineQueue}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse"
            title={`${pendingOfflineCount} registros na fila offline`}
          >
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4" />
              <span className="text-[11px] font-bold">Fila Offline</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
              {pendingOfflineCount}
            </span>
          </button>
        ) : (
          <div
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-medium border ${
              isOnline
                ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30'
                : 'text-rose-400 bg-rose-950/20 border-rose-800/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="font-mono text-[10px]">{isOnline ? 'Online (HomeLab)' : 'Modo Offline'}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
            <span className="text-[11px] whitespace-nowrap">
              Recarregar Piloto
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
