import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Copy,
  Printer,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle,
  Building,
  Sliders,
  Sparkles,
  ArrowRight,
  SplitSquareVertical,
} from 'lucide-react';
import { Projeto, Cenario, ItemProjeto, Ambiente, Material } from '../types';
import { storageService } from '../services/storageService';

interface BudgetScreenProps {
  project: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
  onOpenCatalog: () => void;
  onOpenPrintBudget: () => void;
  onOpenAddMaterialToRoom: (ambienteId: string) => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({
  project,
  onProjectUpdated,
  onOpenCatalog,
  onOpenPrintBudget,
  onOpenAddMaterialToRoom,
}) => {
  if (!project) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p>Nenhum projeto selecionado.</p>
      </div>
    );
  }

  // Active scenario
  const [activeCenarioId, setActiveCenarioId] = useState<string>(
    project.cenarioAtivoId || project.cenarios[0]?.id || ''
  );

  // Compare mode: Side-by-side simulation
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareCenarioId, setCompareCenarioId] = useState<string>(
    project.cenarios[1]?.id || project.cenarios[0]?.id || ''
  );

  // Expanded room accordions
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({
    'amb-1': true,
    'amb-2': true,
  });

  const toggleRoom = (id: string) => {
    setExpandedRooms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Find active and comparison scenarios
  const currentScenario =
    project.cenarios.find((c) => c.id === activeCenarioId) || project.cenarios[0];

  const secondaryScenario =
    project.cenarios.find((c) => c.id === compareCenarioId) || project.cenarios[1] || currentScenario;

  // Contingency margin
  const contingencyPercent = project.contingenciaPercent ?? 10;

  // Financial calculations for Active Scenario
  const rawTotalActive = useMemo(() => {
    return (currentScenario?.itens || []).reduce((acc, item) => acc + item.precoTotal, 0);
  }, [currentScenario]);

  const contingencyValue = (rawTotalActive * contingencyPercent) / 100;
  const grandTotalWithContingency = rawTotalActive + contingencyValue;
  const costPerM2 = project.areaTotalM2 > 0 ? grandTotalWithContingency / project.areaTotalM2 : 0;

  // Financial calculations for Compare Scenario
  const rawTotalCompare = useMemo(() => {
    return (secondaryScenario?.itens || []).reduce((acc, item) => acc + item.precoTotal, 0);
  }, [secondaryScenario]);
  const grandTotalCompare = rawTotalCompare * (1 + contingencyPercent / 100);
  const diffValue = grandTotalWithContingency - grandTotalCompare;

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    (currentScenario?.itens || []).forEach((item) => {
      map[item.classe] = (map[item.classe] || 0) + item.precoTotal;
    });
    return Object.entries(map).map(([classe, total]) => ({
      classe,
      total,
      percent: rawTotalActive > 0 ? (total / rawTotalActive) * 100 : 0,
    }));
  }, [currentScenario, rawTotalActive]);

  // Actions on Scenarios
  const handleSelectScenario = (id: string) => {
    setActiveCenarioId(id);
    const updated = { ...project, cenarioAtivoId: id };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
  };

  const handleDuplicateScenario = () => {
    if (!currentScenario) return;
    const newName = prompt(
      'Nome do novo cenário de simulação:',
      `${currentScenario.nome} (Cópia)`
    );
    if (!newName) return;

    const newId = `cenario-${Date.now()}`;
    const duplicated: Cenario = {
      ...currentScenario,
      id: newId,
      nome: newName,
      itens: currentScenario.itens.map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cenarioId: newId,
      })),
    };

    const updated = {
      ...project,
      cenarios: [...project.cenarios, duplicated],
      cenarioAtivoId: newId,
    };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
    setActiveCenarioId(newId);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Remover este item do orçamento do cenário?')) return;

    const updatedCenarios = project.cenarios.map((cen) => {
      if (cen.id === activeCenarioId) {
        return {
          ...cen,
          itens: cen.itens.filter((i) => i.id !== itemId),
        };
      }
      return cen;
    });

    const updated = { ...project, cenarios: updatedCenarios };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
  };

  const handleUpdateContingency = (newVal: number) => {
    const updated = { ...project, contingenciaPercent: newVal };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Projeto', project.nome],
      ['Cenario', currentScenario?.nome || ''],
      ['Ambiente', 'Material', 'Fabricante', 'Classe', 'Qtd Base', 'Perda %', 'Qtd Final', 'Unidade', 'Preco Unitario (R$)', 'Total (R$)'],
    ];

    (currentScenario?.itens || []).forEach((item) => {
      const room = project.ambientes.find((a) => a.id === item.ambienteId)?.nome || 'Geral';
      rows.push([
        room,
        `"${item.materialNome}"`,
        `"${item.fabricante}"`,
        `"${item.classe}"`,
        String(item.quantidadeBase),
        `${item.perdaTecnicaPercent}%`,
        String(item.quantidadeComPerda),
        item.unidade,
        item.precoUnitario.toFixed(2),
        item.precoTotal.toFixed(2),
      ]);
    });

    rows.push([]);
    rows.push(['Subtotal Bruto', '', '', '', '', '', '', '', '', rawTotalActive.toFixed(2)]);
    rows.push([`Margem Contingencia (${contingencyPercent}%)`, '', '', '', '', '', '', '', '', contingencyValue.toFixed(2)]);
    rows.push(['TOTAL GERAL COM CONTINGENCIA', '', '', '', '', '', '', '', '', grandTotalWithContingency.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orcamento_${project.nome.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Project Banner & Scenario Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider">
                {project.status === 'em_andamento' ? 'Obra em Andamento' : 'Planejamento'}
              </span>
              <span className="text-xs text-slate-400">
                Área Total: <strong className="text-white">{project.areaTotalM2} m²</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {project.nome}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">{project.descricao}</p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                compareMode
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" />
              <span>Simulação Comparativa</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200"
              title="Exportar Planilha Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={onOpenPrintBudget}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Scenarios Bar (Simulações Comparativas) */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Cenários:
            </span>
            {project.cenarios.map((cen) => {
              const isSelected = cen.id === activeCenarioId;
              const cenTotal = cen.itens.reduce((acc, i) => acc + i.precoTotal, 0);

              return (
                <button
                  key={cen.id}
                  onClick={() => handleSelectScenario(cen.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  <span>{cen.nome}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-900 text-emerald-400'
                    }`}
                  >
                    R$ {cenTotal.toFixed(0)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleDuplicateScenario}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
            title="Criar novo cenário baseado no atual"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicar Cenário</span>
          </button>
        </div>
      </div>

      {/* Side-by-side Comparative Simulation Box (when active) */}
      {compareMode && (
        <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SplitSquareVertical className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Simulação Comparativa Lado a Lado (Seção 5.3)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Comparar Cenário Ativo com:</span>
              <select
                value={compareCenarioId}
                onChange={(e) => setCompareCenarioId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400"
              >
                {project.cenarios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario 1 */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">{currentScenario?.nome}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentScenario?.itens.length} itens
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                R$ {grandTotalWithContingency.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400">
                Média: R$ {costPerM2.toFixed(2)} / m²
              </p>
            </div>

            {/* Scenario 2 */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">{secondaryScenario?.nome}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {secondaryScenario?.itens.length} itens
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                R$ {grandTotalCompare.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400">
                Média: R$ {(grandTotalCompare / project.areaTotalM2).toFixed(2)} / m²
              </p>
            </div>
          </div>

          {/* Differential Callout */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300">Diferença Financeira entre os dois cenários:</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-sm ${
                  diffValue <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {diffValue <= 0 ? 'Economia de' : 'Acréscimo de'} R$ {Math.abs(diffValue).toFixed(2)}
              </span>
              <span className="text-slate-400">
                ({Math.abs(Math.round((diffValue / (grandTotalCompare || 1)) * 100))}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards: Consolidated Budget Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Bruto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Subtotal de Materiais</span>
          <div className="text-lg sm:text-2xl font-extrabold text-white mt-1">
            R$ {rawTotalActive.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {currentScenario?.itens.length} itens orçados
          </span>
        </div>

        {/* Margem de Contingência Slider */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Contingência / Reserva</span>
            <span className="text-xs font-bold text-amber-400">{contingencyPercent}%</span>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-300 mt-1">
            + R$ {contingencyValue.toFixed(2)}
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="5"
            value={contingencyPercent}
            onChange={(e) => handleUpdateContingency(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400 mt-2 cursor-pointer"
          />
        </div>

        {/* Total Geral Consolidado */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-emerald-950/20">
          <span className="text-xs text-emerald-400 font-medium">Total com Margem (R$)</span>
          <div className="text-xl sm:text-3xl font-black text-emerald-400 mt-1">
            R$ {grandTotalWithContingency.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-300/80 mt-1 block">
            Orçamento executivo estimado
          </span>
        </div>

        {/* Custo Médio por m² */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Custo Médio por m²</span>
          <div className="text-lg sm:text-2xl font-extrabold text-white mt-1">
            R$ {costPerM2.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Base: {project.areaTotalM2} m² de área
          </span>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Distribuição de Custos por Categoria
          </h3>
          <div className="space-y-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.classe} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium">{cat.classe}</span>
                  <span className="text-slate-400">
                    <strong className="text-white">R$ {cat.total.toFixed(2)}</strong> ({cat.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(cat.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environments & Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <span>Itens por Ambiente da Obra</span>
          </h2>
          <span className="text-xs text-slate-400">
            {project.ambientes.length} ambientes configurados
          </span>
        </div>

        {project.ambientes.map((ambiente) => {
          const isExpanded = !!expandedRooms[ambiente.id];
          const roomItems = (currentScenario?.itens || []).filter(
            (i) => i.ambienteId === ambiente.id
          );
          const roomTotal = roomItems.reduce((acc, i) => acc + i.precoTotal, 0);

          return (
            <div
              key={ambiente.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Room Header row */}
              <div className="p-4 bg-slate-900/90 flex items-center justify-between border-b border-slate-800/80">
                <button
                  onClick={() => toggleRoom(ambiente.id)}
                  className="flex items-center gap-2.5 text-left group flex-1"
                >
                  <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {ambiente.nome}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {ambiente.areaPisoM2} m² piso
                      </span>
                    </div>
                    {ambiente.observacoes && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{ambiente.observacoes}</p>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block sm:inline mr-1">Subtotal:</span>
                    <strong className="text-sm sm:text-base font-extrabold text-emerald-400">
                      R$ {roomTotal.toFixed(2)}
                    </strong>
                  </div>

                  <button
                    onClick={() => onOpenAddMaterialToRoom(ambiente.id)}
                    className="p-1.5 sm:px-3 sm:py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow transition-transform active:scale-95"
                    title="Adicionar material a este ambiente"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Adicionar Item</span>
                  </button>
                </div>
              </div>

              {/* Room Items */}
              {isExpanded && (
                <div className="p-3 sm:p-5 bg-slate-950/40">
                  {roomItems.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      <p>Nenhum material adicionado a este ambiente neste cenário.</p>
                      <button
                        onClick={() => onOpenAddMaterialToRoom(ambiente.id)}
                        className="text-amber-400 hover:underline font-semibold mt-1 inline-block"
                      >
                        + Escolher material do catálogo
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                      {roomItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                                {item.classe}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                {item.fabricante}
                              </span>
                              {item.comprado && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                  Comprado
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-white">{item.materialNome}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>
                                Qtd Base: <strong>{item.quantidadeBase} {item.unidade}</strong>
                              </span>
                              <span className="text-amber-300 font-medium">
                                +{item.perdaTecnicaPercent}% perda técnica ={' '}
                                <strong>{item.quantidadeComPerda} {item.unidade}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 block">
                                R$ {item.precoUnitario.toFixed(2)} / {item.unidade}
                              </span>
                              <span className="text-sm font-extrabold text-white">
                                R$ {item.precoTotal.toFixed(2)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                              title="Remover do orçamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
