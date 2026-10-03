import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Store,
  DollarSign,
  FileText,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Projeto, CompraReal } from '../types';

interface ExecutionScreenProps {
  project: Projeto | null;
  onOpenRegisterPurchase: () => void;
  onProjectUpdated: (project: Projeto) => void;
}

export const ExecutionScreen: React.FC<ExecutionScreenProps> = ({
  project,
  onOpenRegisterPurchase,
  onProjectUpdated,
}) => {
  if (!project) return null;

  const currentScenario =
    project.cenarios.find((c) => c.id === project.cenarioAtivoId) || project.cenarios[0];

  const plannedTotal = (currentScenario?.itens || []).reduce((acc, i) => acc + i.precoTotal, 0);
  const contingencyMargin = (plannedTotal * (project.contingenciaPercent ?? 10)) / 100;
  const totalPlannedWithMargin = plannedTotal + contingencyMargin;

  // Real purchases
  const purchases = project.compras || [];
  const realTotalSpent = purchases.reduce((acc, p) => acc + p.valorTotal, 0);

  // Indicators
  const executedPercent = totalPlannedWithMargin > 0 ? (realTotalSpent / totalPlannedWithMargin) * 100 : 0;
  const balanceRemaining = totalPlannedWithMargin - realTotalSpent;
  const realCostPerM2 = project.areaTotalM2 > 0 ? realTotalSpent / project.areaTotalM2 : 0;
  const plannedCostPerM2 = project.areaTotalM2 > 0 ? totalPlannedWithMargin / project.areaTotalM2 : 0;

  // Category comparison: Planned vs Actual
  const categoryComparison = useMemo(() => {
    const map: Record<string, { planned: number; actual: number }> = {};

    // Planned by category
    (currentScenario?.itens || []).forEach((item) => {
      if (!map[item.classe]) map[item.classe] = { planned: 0, actual: 0 };
      map[item.classe].planned += item.precoTotal;
    });

    // Actual by category
    purchases.forEach((p) => {
      const cat = p.categoria || 'Geral';
      if (!map[cat]) map[cat] = { planned: 0, actual: 0 };
      map[cat].actual += p.valorTotal;
    });

    return Object.entries(map).map(([categoria, vals]) => {
      const deviance = vals.actual - vals.planned;
      const deviancePercent = vals.planned > 0 ? (deviance / vals.planned) * 100 : 0;
      const isOverBudget = vals.actual > vals.planned && vals.planned > 0;

      return {
        categoria,
        planned: vals.planned,
        actual: vals.actual,
        deviance,
        deviancePercent,
        isOverBudget,
      };
    });
  }, [currentScenario, purchases]);

  // Check budget overrun alerts
  const overruns = categoryComparison.filter((c) => c.isOverBudget);

  // Group purchases by date / month for disbursement trend
  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [purchases]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header and CTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
              Módulo 4 • Execução Financeira
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Controle de Custos: Planejado vs Realizado
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe o desembolso real da reforma, notas fiscais e alertas de estouro de orçamento
          </p>
        </div>

        <button
          onClick={onOpenRegisterPurchase}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Compra / NF</span>
        </button>
      </div>

      {/* Overrun Alerts Banner (Alertas de Estouro Seção 6.1) */}
      {overruns.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-sm">
              Alerta de Estouro de Orçamento Detectado!
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            As seguintes categorias ultrapassaram o montante originalmente orçado no cenário ativo:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {overruns.map((o) => (
              <span
                key={o.categoria}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-900/60 border border-rose-700 text-rose-200 text-xs font-semibold"
              >
                <span>{o.categoria}:</span>
                <strong className="text-rose-100">
                  +R$ {o.deviance.toFixed(2)} (+{o.deviancePercent.toFixed(1)}%)
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards: Planned vs Spent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Planejado Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Orçado Total (Cenário Ativo)</span>
          <div className="text-lg sm:text-2xl font-extrabold text-white mt-1">
            R$ {totalPlannedWithMargin.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Meta: R$ {plannedCostPerM2.toFixed(2)} / m²
          </span>
        </div>

        {/* Realizado Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Gasto Realizado da Obra</span>
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-400 mt-1">
            R$ {realTotalSpent.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Atual: R$ {realCostPerM2.toFixed(2)} / m²
          </span>
        </div>

        {/* % Executado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">% do Orçamento Executado</span>
            <span className="text-xs font-bold text-amber-400">{executedPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                executedPercent > 100 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(executedPercent, 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {purchases.length} aquisições registradas
          </span>
        </div>

        {/* Saldo Restante ou Desvio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">
            {balanceRemaining >= 0 ? 'Saldo Restante para Gastar' : 'Déficit / Estouro Acumulado'}
          </span>
          <div
            className={`text-lg sm:text-2xl font-extrabold mt-1 ${
              balanceRemaining >= 0 ? 'text-blue-400' : 'text-rose-400'
            }`}
          >
            R$ {Math.abs(balanceRemaining).toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {balanceRemaining >= 0 ? 'Dentro do orçamento' : 'Atenção aos próximos gastos'}
          </span>
        </div>
      </div>

      {/* Comparative Table: Planned x Actual by Category (Seção 6.1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Comparativo Planejado x Realizado por Categoria
          </h3>
          <span className="text-xs text-slate-400">Desvios em R$ e %</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Planejado (R$)</th>
                <th className="py-3 px-4">Realizado (R$)</th>
                <th className="py-3 px-4">Desvio (R$)</th>
                <th className="py-3 px-4">Desvio (%)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {categoryComparison.map((cat) => {
                const isUnder = cat.deviance <= 0;
                return (
                  <tr key={cat.categoria} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">{cat.categoria}</td>
                    <td className="py-3 px-4 text-slate-300">
                      R$ {cat.planned.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      R$ {cat.actual.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 font-bold ${
                        isUnder ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {cat.deviance > 0 ? '+' : ''}
                      R$ {cat.deviance.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 font-bold ${
                        isUnder ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {cat.deviancePercent > 0 ? '+' : ''}
                      {cat.deviancePercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      {cat.actual === 0 ? (
                        <span className="text-[11px] text-slate-500">Pendente</span>
                      ) : isUnder ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          Economia
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                          Estouro
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Histórico de Compras da Obra & Notas Fiscais
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {purchases.length} aquisições
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma compra registrada ainda nesta obra.</p>
            <button
              onClick={onOpenRegisterPurchase}
              className="text-emerald-400 hover:underline font-semibold mt-1 inline-block"
            >
              + Registrar primeira aquisição
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {sortedPurchases.map((compra) => (
              <div
                key={compra.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                      {compra.categoria}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Store className="w-3 h-3" />
                      {compra.fornecedorLoja}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(compra.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{compra.descricao}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      Qtd: <strong>{compra.quantidade} {compra.unidade}</strong>
                    </span>
                    <span>
                      Unitário: <strong>R$ {compra.valorUnitario.toFixed(2)}</strong>
                    </span>
                    {compra.numeroNotaFiscal && (
                      <span className="text-slate-300 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">
                        {compra.numeroNotaFiscal}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-emerald-400">
                    R$ {compra.valorTotal.toFixed(2)}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Pago via {compra.formaPagamento.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
