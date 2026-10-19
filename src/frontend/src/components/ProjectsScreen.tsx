import React from 'react';
import {
  Briefcase,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Calculator,
  FolderOpen,
  DollarSign,
  HardHat,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Projeto } from '../types';
import { TabType } from './Navigation';

interface ProjectsScreenProps {
  projects: Projeto[];
  activeProject: Projeto | null;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  onNavigateTab: (tab: TabType) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProject,
  onNavigateTab,
}) => {
  // KPIs consolidados de todo o portfólio de obras
  const totalProjetos = projects.length;
  const emAndamento = projects.filter((p) => p.status === 'em_andamento').length;
  const totalOrcadoGeral = projects.reduce((acc, p) => {
    const teto = (p.orcamentoMaoObra || 0) + (p.orcamentoMateriais || 0);
    return acc + (teto > 0 ? teto : (p.orcamentoTeto || 0));
  }, 0);
  const totalGastoGeral = projects.reduce((acc, p) => {
    const gastoCompras = (p.compras || []).reduce((sum, c) => sum + c.valorTotal, 0);
    return acc + gastoCompras;
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Em Andamento
          </span>
        );
      case 'planejamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            Em Planejamento
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluída
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Portfólio Institucional ICENV
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Banco Centralizado de Obras
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-amber-400" />
            <span>Obras & Projetos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerenciamento global de obras em andamento, projetos planejados e acervo histórico físico-financeiro.
          </p>
        </div>

        {/* CTA: Criar Novo Projeto */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-400/15 active:scale-95 transition-all whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Nova Obra / Projeto</span>
        </button>
      </div>

      {/* KPI Cards do Portfólio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Obras</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {totalProjetos} projetos
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
            <span>● {emAndamento} frente ativa em campo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Orçamento Consolidado</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            R$ {totalOrcadoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Investimento previsto no conjunto
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Compras Faturadas (NFs)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            R$ {totalGastoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Desembolso em notas fiscais e recibos
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Mão de Obra Geral</span>
            <HardHat className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            R$ 48.000,00
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Profissional Wagner (Frentes 1 e 2)
          </div>
        </div>
      </div>

      {/* Grid de Cards dos Projetos */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Projetos Cadastrados no Banco Unificado
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map((proj) => {
            const isActive = activeProject?.id === proj.id;
            const teto = (proj.orcamentoMaoObra || 0) + (proj.orcamentoMateriais || 0);
            const totalOrcado = teto > 0 ? teto : (proj.orcamentoTeto || 53800);
            const totalCompras = (proj.compras || []).reduce((acc, c) => acc + c.valorTotal, 0);
            const totalMaoObra = proj.orcamentoMaoObra || (proj.id === 'proj-icenv-pastoral' ? 32500 : 15500);
            const totalComprometido = totalCompras + (proj.status === 'em_andamento' ? totalMaoObra : 0);
            const percentual = totalOrcado > 0 ? Math.min((totalComprometido / totalOrcado) * 100, 100) : 0;
            const qtdAmbientes = proj.ambientes?.length || 0;
            const qtdCompras = proj.compras?.length || 0;

            return (
              <div
                key={proj.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between ${
                  isActive
                    ? 'border-amber-400/80 ring-2 ring-amber-400/20 bg-slate-900/90'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getStatusBadge(proj.status)}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                            ● Obra Ativa no Workbench
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {proj.cliente || 'ICENV 2026'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                        {proj.nome}
                      </h3>
                    </div>
                  </div>

                  {/* Descrição do Projeto */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {proj.descricao}
                  </p>

                  {/* Progresso Físico-Financeiro */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Consumo Financeiro da Obra</span>
                      <span className="font-mono font-black text-slate-200">
                        {percentual.toFixed(1)}% ({totalComprometido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentual > 90 ? 'bg-rose-500' : percentual > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-mono">
                      <span>Teto: {totalOrcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      <span>{qtdCompras} NFs / Pedidos Faturados</span>
                    </div>
                  </div>

                  {/* Informações Complementares */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Início da Obra</span>
                      <span className="font-bold text-slate-200">
                        {proj.dataInicio || '13/10/2026'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Previsão Término</span>
                      <span className="font-bold text-slate-200">
                        {proj.dataPrevisao || '15/11/2026'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onNavigateTab('orcamento');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
                      title="Ver Estrutura Analítica de Custos (WBS)"
                    >
                      Ver EAP
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onNavigateTab('execucao');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
                      title="Ver Compras e Faturas Homologadas"
                    >
                      Compras ({qtdCompras})
                    </button>
                  </div>

                  {isActive ? (
                    <button
                      onClick={() => onNavigateTab('dashboard')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-sm active:scale-95"
                    >
                      <span>Abrir Cockpit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onNavigateTab('dashboard');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95"
                    >
                      <span>Selecionar Obra</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
