import React from 'react';
import {
  Layers,
  Calculator,
  TrendingUp,
  Hammer,
  ListTree,
  LayoutDashboard,
  FileText,
  HardHat,
  Briefcase,
  Store,
} from 'lucide-react';

export type TabType =
  | 'canteiro'
  | 'dashboard'
  | 'projetos'
  | 'orcamento'
  | 'execucao'
  | 'fornecedores'
  | 'plantas'
  | 'catalogo'
  | 'etapas'
  | 'taxonomia';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Cockpit & Relatórios',
      icon: LayoutDashboard,
    },
    {
      id: 'projetos' as TabType,
      label: 'Obras & Projetos',
      icon: Briefcase,
    },
    {
      id: 'orcamento' as TabType,
      label: 'Orçamento (WBS)',
      icon: Calculator,
    },
    {
      id: 'execucao' as TabType,
      label: 'Compras & NFs',
      icon: TrendingUp,
    },
    {
      id: 'fornecedores' as TabType,
      label: 'Lojas & Fornecedores',
      icon: Store,
    },
    {
      id: 'plantas' as TabType,
      label: 'Plantas & Revisões',
      icon: FileText,
    },
    {
      id: 'catalogo' as TabType,
      label: 'Catálogo de Insumos',
      icon: Layers,
    },
    {
      id: 'etapas' as TabType,
      label: 'Cronograma Físico',
      icon: Hammer,
    },
    {
      id: 'taxonomia' as TabType,
      label: 'Taxonomia',
      icon: ListTree,
    },
  ];

  const mobileTabs = [
    {
      id: 'canteiro' as TabType,
      label: 'Canteiro',
      icon: HardHat,
    },
    {
      id: 'etapas' as TabType,
      label: 'Diário RDO',
      icon: Hammer,
    },
    {
      id: 'orcamento' as TabType,
      label: 'Checklist',
      icon: Calculator,
    },
    {
      id: 'execucao' as TabType,
      label: 'Custos & NFs',
      icon: TrendingUp,
    },
    {
      id: 'projetos' as TabType,
      label: 'Obras',
      icon: Briefcase,
    },
  ];

  return (
    <>
      {/* Desktop Navigation Top Bar */}
      <nav className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-1.5 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.4]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar — Touch-Friendly & Clean */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 text-slate-400 px-2 py-1 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-5 items-center justify-around">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-400 font-bold bg-amber-400/10'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400 stroke-[2.4]' : 'text-slate-400'}`} />
                <span className="text-[10px] tracking-tight truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
