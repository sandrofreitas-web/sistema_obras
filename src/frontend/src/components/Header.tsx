import React from 'react';
import { Projeto, ItemFilaOffline } from '../types';
import {
  FolderOpen,
  Plus,
  Printer,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  HardHat
} from 'lucide-react';

interface HeaderProps {
  activeProject: Projeto | null;
  projects: Projeto[];
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  isOnline: boolean;
  offlineQueue: ItemFilaOffline[];
  onOpenOfflineQueue: () => void;
  onOpenAddItem?: () => void;
  onOpenPrintBudget?: () => void;
  onExportCSV?: () => void;
  editModeEnabled?: boolean;
  onToggleEditMode?: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProject,
  onOpenAddItem,
  onOpenPrintBudget,
  onExportCSV,
  editModeEnabled = true,
  onToggleEditMode,
}) => {
  return (
    <header className="h-[54px] bg-[#090d16] border-b border-slate-800 text-white px-4 flex items-center justify-between sticky top-0 z-20 select-none shadow-sm flex-shrink-0">
      {/* Esquerda: Identificação do Projeto & Metadados Executivos */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Seletor Rápido de Obra Ativa */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  onOpenNewProject();
                } else {
                  onSelectProject(e.target.value);
                }
              }}
              className="bg-[#0f172a] hover:bg-[#162035] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none cursor-pointer pr-7 transition-colors truncate max-w-[280px] sm:max-w-[360px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.nome}
                </option>
              ))}
              <option value="__new__" className="bg-slate-900 text-amber-400 font-bold">
                + Criar Nova Obra...
              </option>
            </select>
          </div>
        </div>

        {/* Separador Vertical */}
        <div className="hidden md:block h-5 w-[1px] bg-slate-800" />

        {/* Metadados: Cliente / Responsável */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <span>Cliente / Local:</span>
          <strong className="text-slate-200 font-medium">
            {activeProject?.cliente || 'ICENV 2026'}
          </strong>
        </div>

        {/* Separador Vertical */}
        <div className="hidden xl:block h-5 w-[1px] bg-slate-800" />

        {/* Base SINAPI / Referência de Custo */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Base:</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
            SINAPI SP 2026
          </span>
        </div>

        {/* Separador Vertical */}
        <div className="hidden xl:block h-5 w-[1px] bg-slate-800" />

        {/* Status da Obra Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Obra: Em Andamento
          </span>
        </div>
      </div>

      {/* Direita: Switch de Edição + Ações de Engenharia */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Switch: Editar Orçamento */}
        {onToggleEditMode && (
          <button
            onClick={() => onToggleEditMode(!editModeEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              editModeEnabled
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Alternar permissão de edição rápida de quantitativos e preços"
          >
            {editModeEnabled ? (
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline text-[11px]">
              {editModeEnabled ? 'Edição Habilitada' : 'Visualização'}
            </span>
          </button>
        )}

        {/* Botão Exportar CSV */}
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Exportar Planilha Orçamentária CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline text-[11px]">CSV</span>
          </button>
        )}

        {/* Botão Imprimir PDF */}
        {onOpenPrintBudget && (
          <button
            onClick={onOpenPrintBudget}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Imprimir Relatório ou Gerar PDF Executivo"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline text-[11px]">PDF</span>
          </button>
        )}

        {/* Botão Primário: + Incluir Item */}
        {onOpenAddItem && (
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-sm active:scale-95"
            title="Incluir Novo Insumo ou Composição"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Incluir Item</span>
          </button>
        )}
      </div>
    </header>
  );
};
