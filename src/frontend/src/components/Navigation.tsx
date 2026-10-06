import React from 'react';
import {
  Camera,
  Layers,
  Calculator,
  TrendingUp,
  Hammer,
  Settings,
  ListTree,
} from 'lucide-react';

export type TabType = 'catalogo' | 'orcamento' | 'execucao' | 'etapas' | 'taxonomia';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenCapture: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenCapture,
}) => {
  const tabs = [
    {
      id: 'catalogo' as TabType,
      label: 'Catálogo de Insumos',
      mobileLabel: 'Insumos',
      icon: Layers,
    },
    {
      id: 'orcamento' as TabType,
      label: 'Detalhamento do Projeto',
      mobileLabel: 'Projeto',
      icon: Calculator,
    },
    {
      id: 'execucao' as TabType,
      label: 'Controle de Custos & NF',
      mobileLabel: 'Custos',
      icon: TrendingUp,
    },
    {
      id: 'etapas' as TabType,
      label: 'Cronograma Físico',
      mobileLabel: 'Cronograma',
      icon: Hammer,
    },
    {
      id: 'taxonomia' as TabType,
      label: 'Taxonomia de Materiais',
      mobileLabel: 'Taxonomia',
      icon: ListTree,
    },
  ];

  return (
    <>
      {/* Desktop Navigation Top Bar */}
      <nav className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Capture Quick CTA button */}
          <div className="py-2">
            <button
              onClick={onOpenCapture}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>+ Capturar Etiqueta</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-2 py-1 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around relative">
          {/* Tab: Catálogo */}
          <button
            onClick={() => onSelectTab('catalogo')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors ${
              currentTab === 'catalogo' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Catálogo</span>
          </button>

          {/* Tab: Orçamento / Projetos */}
          <button
            onClick={() => onSelectTab('orcamento')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors ${
              currentTab === 'orcamento' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Orçamento</span>
          </button>

          {/* Center Elevated Floating Camera Button */}
          <div className="-mt-5 flex flex-col items-center">
            <button
              onClick={onOpenCapture}
              className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center border-2 border-slate-900 shadow-sm active:scale-90 transition-transform"
              aria-label="Fotografar Etiqueta"
            >
              <Camera className="w-6 h-6 stroke-[2.4]" />
            </button>
            <span className="text-[10px] font-bold text-amber-400 mt-0.5">Capturar</span>
          </div>

          {/* Tab: Execução Financeira */}
          <button
            onClick={() => onSelectTab('execucao')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors ${
              currentTab === 'execucao' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Execução</span>
          </button>

          {/* Tab: Etapas / Avanço Físico */}
          <button
            onClick={() => onSelectTab('etapas')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors ${
              currentTab === 'etapas' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Etapas</span>
          </button>
        </div>
      </nav>
    </>
  );
};
