import React, { useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Plus,
  AlertTriangle,
  Calendar,
  Store,
  DollarSign,
  FileText,
  CreditCard,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { Projeto, CompraReal } from '../types';

interface ExecutionScreenProps {
  project: Projeto | null;
  onOpenRegisterPurchase: () => void;
  onProjectUpdated: (project: Projeto) => void;
}

// Helpers de formatação no padrão brasileiro (pt-BR)
// 1. Nos cards de resumo/telemetria: mantém R$ (ex: R$ 1.250,50)
const formatCurrencyBR = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// 2. Nas listas e tabelas de desvios e compras: sem R$, com separador de milhar e vírgula decimal (ex: 1.250,50)
const formatNumberBR = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const ExecutionScreen: React.FC<ExecutionScreenProps> = ({
  project,
  onOpenRegisterPurchase,
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
    <div className="space-y-4 pb-20">
      {/* Header Executivo Técnico */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-wider font-mono">
              Módulo 4 • Execução Financeira
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Controle de Custos: Planejado vs Realizado
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe o desembolso real, notas fiscais e balanço financeiro da obra.
          </p>
        </div>

        <button
          onClick={onOpenRegisterPurchase}
          className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ Registrar Compra / NF</span>
        </button>
      </div>

      {/* Alerta de Estouro Técnico */}
      {overruns.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Alerta de Estouro Orçamentário Detectado</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            As seguintes categorias ultrapassaram o montante originalmente orçado no cenário ativo:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {overruns.map((o) => (
              <span
                key={o.categoria}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-900/40 border border-rose-700/80 text-rose-200 font-mono text-[11px]"
              >
                <span>{o.categoria}:</span>
                <strong className="text-rose-100">
                  +{formatCurrencyBR(o.deviance)} (+{o.deviancePercent.toFixed(1)}%)
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Telemetria Financeira Consolidada (Menos cards, dados em linha) */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-800 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800/80 bg-slate-900 shadow-sm text-xs">
        {/* 1. Planejado Total */}
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            1. Orçado Total (Ativo)
          </span>
          <div className="text-base sm:text-lg font-black text-white font-mono tabular-nums">
            {formatCurrencyBR(totalPlannedWithMargin)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Meta: {formatCurrencyBR(plannedCostPerM2)}/m²
          </span>
        </div>

        {/* 2. Realizado Total */}
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            2. Realizado da Obra
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-400 font-mono tabular-nums">
            {formatCurrencyBR(realTotalSpent)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Atual: {formatCurrencyBR(realCostPerM2)}/m²
          </span>
        </div>

        {/* 3. % Executado com Mini Barra */}
        <div className="p-3.5 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              3. % Executado
            </span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {executedPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                executedPercent > 100 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(executedPercent, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {purchases.length} aquisições registradas
          </span>
        </div>

        {/* 4. Saldo Restante ou Déficit */}
        <div className="p-3.5 space-y-0.5 bg-slate-950/40">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            4. Saldo em Caixa
          </span>
          <div
            className={`text-base sm:text-lg font-black font-mono tabular-nums ${
              balanceRemaining >= 0 ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            {formatCurrencyBR(Math.abs(balanceRemaining))}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {balanceRemaining >= 0 ? 'Dentro do teto previsto' : 'Estouro acumulado'}
          </span>
        </div>
      </div>

      {/* Tabela Técnica: Comparativo Planejado x Realizado por Categoria */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Comparativo Planejado x Realizado por Grupo
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Desvios Analíticos em R$ e %
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800 tracking-wider uppercase">
                <th className="py-2.5 px-3">Grupo / Categoria</th>
                <th className="py-2.5 px-3 text-right">Planejado</th>
                <th className="py-2.5 px-3 text-right">Realizado</th>
                <th className="py-2.5 px-3 text-right">Desvio</th>
                <th className="py-2.5 px-3 text-right">Desvio (%)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-sans">
              {categoryComparison.map((cat) => {
                const isUnder = cat.deviance <= 0;
                return (
                  <tr key={cat.categoria} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-200">{cat.categoria}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {formatNumberBR(cat.planned)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-100 tabular-nums">
                      {formatNumberBR(cat.actual)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold tabular-nums ${
                        isUnder ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {cat.deviance > 0 ? '+' : ''}
                      {formatNumberBR(cat.deviance)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold tabular-nums ${
                        isUnder ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {cat.deviancePercent > 0 ? '+' : ''}
                      {cat.deviancePercent.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      {cat.actual === 0 ? (
                        <span className="text-[10px] font-mono text-slate-500">Pendente</span>
                      ) : isUnder ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Economia
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
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

      {/* Histórico Técnico de Compras & Notas Fiscais (Tabela de Engenharia) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Histórico Técnico de Compras & Comprovantes Fiscais
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {purchases.length} aquisições registradas
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Nenhuma compra registrada nesta obra.</p>
            <button
              onClick={onOpenRegisterPurchase}
              className="text-emerald-400 hover:underline font-semibold mt-1 inline-block"
            >
              + Registrar primeira aquisição
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800 tracking-wider uppercase">
                  <th className="py-2.5 px-3 min-w-[90px]">Data</th>
                  <th className="py-2.5 px-3 min-w-[100px]">Nº NF / Doc</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Insumo Adquirido</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Grupo / Cat</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Fornecedor</th>
                  <th className="py-2.5 px-3 text-right min-w-[80px]">Qtd</th>
                  <th className="py-2.5 px-3 text-right min-w-[90px]">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-right min-w-[100px]">Total Pago</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {sortedPurchases.map((compra) => (
                  <tr key={compra.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Data */}
                    <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">
                      {new Date(compra.data).toLocaleDateString('pt-BR')}
                    </td>

                    {/* NF */}
                    <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                      {compra.numeroNotaFiscal ? (
                        <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                          {compra.numeroNotaFiscal}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Descrição */}
                    <td className="py-2 px-3 font-semibold text-slate-100 text-xs">
                      {compra.descricao}
                    </td>

                    {/* Categoria */}
                    <td className="py-2 px-3 text-[11px] text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400/90 font-mono text-[10px]">
                        {compra.categoria}
                      </span>
                    </td>

                    {/* Fornecedor */}
                    <td className="py-2 px-3 text-[11px] text-slate-300 font-mono">
                      {compra.fornecedorLoja}
                    </td>

                    {/* Qtd */}
                    <td className="py-2 px-3 text-right font-mono text-slate-200 tabular-nums text-[11px]">
                      {compra.quantidade} {compra.unidade}
                    </td>

                    {/* Unitário */}
                    <td className="py-2 px-3 text-right font-mono text-slate-300 tabular-nums text-[11px]">
                      {formatNumberBR(compra.valorUnitario)}
                    </td>

                    {/* Total */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums text-xs">
                      {formatNumberBR(compra.valorTotal)}
                    </td>

                    {/* Forma de Pagamento */}
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {compra.formaPagamento.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
