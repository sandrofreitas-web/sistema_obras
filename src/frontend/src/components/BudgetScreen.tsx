import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Printer,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Building,
  Tag,
  Droplets,
  Zap,
  Bath,
  Hammer,
  Maximize2,
  Paintbrush,
  Trash,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  FolderOpen,
  ShoppingBag,
  ListChecks,
  Download,
  Check,
} from 'lucide-react';
import { Projeto, ItemProjeto, Material, TaxonomiaClasse } from '../types';
import { storageService } from '../services/storageService';
import { ProjectItemModal } from './ProjectItemModal';

interface BudgetScreenProps {
  project: Projeto | null;
  projects?: Projeto[];
  onSelectProject?: (id: string) => void;
  materials: Material[];
  taxonomia: TaxonomiaClasse[];
  onProjectUpdated: (project: Projeto) => void;
  onOpenCatalog: () => void;
  onOpenPrintBudget: () => void;
  onOpenAddMaterialToRoom?: (ambienteId: string) => void;
}

// Icon helper for groups
const getGroupIcon = (classeNome: string) => {
  const norm = classeNome.toLowerCase();
  if (norm.includes('bruto') || norm.includes('estrutura')) return <Building className="w-4 h-4 text-amber-400" />;
  if (norm.includes('revestimento')) return <Layers className="w-4 h-4 text-emerald-400" />;
  if (norm.includes('hidr')) return <Droplets className="w-4 h-4 text-sky-400" />;
  if (norm.includes('elét') || norm.includes('elet')) return <Zap className="w-4 h-4 text-yellow-400" />;
  if (norm.includes('louça') || norm.includes('metal')) return <Bath className="w-4 h-4 text-cyan-400" />;
  if (norm.includes('marmor') || norm.includes('divisór')) return <Hammer className="w-4 h-4 text-stone-300" />;
  if (norm.includes('gesso') || norm.includes('forro') || norm.includes('drywall')) return <Maximize2 className="w-4 h-4 text-teal-400" />;
  if (norm.includes('pint')) return <Paintbrush className="w-4 h-4 text-rose-400" />;
  if (norm.includes('caçamb') || norm.includes('entulho') || norm.includes('serviço')) return <Trash className="w-4 h-4 text-orange-400" />;
  return <Tag className="w-4 h-4 text-slate-400" />;
};

export const BudgetScreen: React.FC<BudgetScreenProps> = ({
  project,
  projects,
  onSelectProject,
  materials,
  taxonomia,
  onProjectUpdated,
  onOpenCatalog,
  onOpenPrintBudget,
}) => {
  if (!project) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p>Nenhum projeto selecionado.</p>
      </div>
    );
  }

  // Active scenario is the primary budget container
  const currentScenario =
    project.cenarios.find((c) => c.id === project.cenarioAtivoId) || project.cenarios[0];

  const items = currentScenario?.itens || [];

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('todos');
  const [selectedAmbienteFilter, setSelectedAmbienteFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'planejado' | 'comprado'>('todos');
  const [viewMode, setViewMode] = useState<'grupos' | 'ambientes'>('grupos');

  // Accordion Expanded State for Groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  // Accordion Expanded State for Rooms
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  // Item Modal State (Create / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit'>('create');
  const [itemToEdit, setItemToEdit] = useState<ItemProjeto | null>(null);
  const [preselectedGroupForNewItem, setPreselectedGroupForNewItem] = useState<string>('');

  // Toggle group accordion
  const toggleGroup = (grupoNome: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [grupoNome]: prev[grupoNome] === undefined ? false : !prev[grupoNome],
    }));
  };

  // Toggle room accordion
  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: prev[roomId] === undefined ? false : !prev[roomId],
    }));
  };

  // Financial calculations
  const rawTotalActive = useMemo(() => {
    return items.reduce((acc, item) => acc + item.precoTotal, 0);
  }, [items]);

  const contingencyPercent = project.contingenciaPercent ?? 10;
  const contingencyValue = (rawTotalActive * contingencyPercent) / 100;
  const materialsWithContingency = rawTotalActive + contingencyValue;
  const laborBudget = project.orcamentoMaoObra ?? 17000;
  const globalProjectBudget = materialsWithContingency + laborBudget;
  const costPerM2 = project.areaTotalM2 > 0 ? globalProjectBudget / project.areaTotalM2 : 0;

  // Acquisition Evolution & Shopping List Stats
  const compradosCount = useMemo(() => items.filter((i) => i.comprado).length, [items]);
  const totalComprado = useMemo(
    () => items.filter((i) => i.comprado).reduce((acc, i) => acc + i.precoTotal, 0),
    [items]
  );
  const totalPendente = useMemo(
    () => items.filter((i) => !i.comprado).reduce((acc, i) => acc + i.precoTotal, 0),
    [items]
  );
  const percentComprado = items.length > 0 ? (compradosCount / items.length) * 100 : 0;

  // Filter items according to search and filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.materialNome.toLowerCase().includes(q);
        const matchesFab = (item.fabricante || '').toLowerCase().includes(q);
        const matchesCat = item.categoria.toLowerCase().includes(q);
        const matchesTipo = (item.tipo || '').toLowerCase().includes(q);
        const roomName = project.ambientes.find((a) => a.id === item.ambienteId)?.nome || '';
        const matchesRoom = roomName.toLowerCase().includes(q);

        if (!matchesName && !matchesFab && !matchesCat && !matchesTipo && !matchesRoom) {
          return false;
        }
      }

      // Group filter
      if (selectedGroupFilter !== 'todos' && item.classe !== selectedGroupFilter) {
        return false;
      }

      // Room filter
      if (selectedAmbienteFilter !== 'todos' && item.ambienteId !== selectedAmbienteFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'comprado' && !item.comprado) return false;
      if (selectedStatusFilter === 'planejado' && item.comprado) return false;

      return true;
    });
  }, [items, searchTerm, selectedGroupFilter, selectedAmbienteFilter, selectedStatusFilter, project.ambientes]);

  // Group items by Grupo (Classe) -> Categoria
  const groupedData = useMemo(() => {
    const groupsMap: Record<
      string,
      {
        grupoNome: string;
        subtotal: number;
        totalItens: number;
        categorias: Record<string, { categoriaNome: string; subtotal: number; itens: ItemProjeto[] }>;
      }
    > = {};

    filteredItems.forEach((item) => {
      const gName = item.classe || 'Geral';
      if (!groupsMap[gName]) {
        groupsMap[gName] = {
          grupoNome: gName,
          subtotal: 0,
          totalItens: 0,
          categorias: {},
        };
      }

      groupsMap[gName].subtotal += item.precoTotal;
      groupsMap[gName].totalItens += 1;

      const cName = item.categoria || 'Geral';
      if (!groupsMap[gName].categorias[cName]) {
        groupsMap[gName].categorias[cName] = {
          categoriaNome: cName,
          subtotal: 0,
          itens: [],
        };
      }

      groupsMap[gName].categorias[cName].subtotal += item.precoTotal;
      groupsMap[gName].categorias[cName].itens.push(item);
    });

    return Object.values(groupsMap).sort((a, b) => b.subtotal - a.subtotal);
  }, [filteredItems]);

  // Unique list of groups present in items or taxonomy for dropdown
  const allGroups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.classe));
    taxonomia.forEach((t) => set.add(t.nome));
    return Array.from(set).sort();
  }, [items, taxonomia]);

  // --- CRUD & STATUS ACTIONS ---

  // Direct toggle for status Comprado / Planejado
  const handleToggleItemComprado = (itemId: string, currentStatus: boolean) => {
    if (!currentScenario) return;

    const updatedItens = currentScenario.itens.map((it) => {
      if (it.id === itemId) {
        return { ...it, comprado: !currentStatus };
      }
      return it;
    });

    const updatedCenarios = project.cenarios.map((cen) => {
      if (cen.id === currentScenario.id) {
        return { ...cen, itens: updatedItens };
      }
      return cen;
    });

    const updatedProject: Projeto = {
      ...project,
      cenarios: updatedCenarios,
      atualizadoEm: new Date().toISOString(),
    };

    storageService.saveProject(updatedProject);
    onProjectUpdated(updatedProject);
  };

  // Open modal to add item
  const handleOpenAddItem = (preselectedClasse?: string) => {
    setItemModalMode('create');
    setItemToEdit(null);
    setPreselectedGroupForNewItem(preselectedClasse || '');
    setIsItemModalOpen(true);
  };

  // Open modal to edit item
  const handleOpenEditItem = (item: ItemProjeto) => {
    setItemModalMode('edit');
    setItemToEdit(item);
    setPreselectedGroupForNewItem(item.classe);
    setIsItemModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveItem = (itemData: any) => {
    if (!currentScenario) return;

    let updatedItens: ItemProjeto[];

    if (itemModalMode === 'edit' && itemData.id) {
      // Update existing item
      updatedItens = currentScenario.itens.map((it) => {
        if (it.id === itemData.id) {
          return {
            ...it,
            ...itemData,
          };
        }
        return it;
      });
    } else {
      // Create new item
      const newItem: ItemProjeto = {
        ...itemData,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cenarioId: currentScenario.id,
      };
      updatedItens = [...currentScenario.itens, newItem];
    }

    const updatedCenarios = project.cenarios.map((cen) => {
      if (cen.id === currentScenario.id) {
        return {
          ...cen,
          itens: updatedItens,
        };
      }
      return cen;
    });

    const updatedProject: Projeto = {
      ...project,
      cenarios: updatedCenarios,
      atualizadoEm: new Date().toISOString(),
    };

    storageService.saveProject(updatedProject);
    onProjectUpdated(updatedProject);
    setIsItemModalOpen(false);
  };

  // Delete item
  const handleDeleteItem = (itemId: string, itemNome: string) => {
    if (!confirm(`Deseja realmente remover o item "${itemNome}" do orçamento da obra?`)) {
      return;
    }

    if (!currentScenario) return;

    const updatedItens = currentScenario.itens.filter((i) => i.id !== itemId);
    const updatedCenarios = project.cenarios.map((cen) => {
      if (cen.id === currentScenario.id) {
        return {
          ...cen,
          itens: updatedItens,
        };
      }
      return cen;
    });

    const updatedProject: Projeto = {
      ...project,
      cenarios: updatedCenarios,
      atualizadoEm: new Date().toISOString(),
    };

    storageService.saveProject(updatedProject);
    onProjectUpdated(updatedProject);
  };

  // Update contingency margin
  const handleUpdateContingency = (newVal: number) => {
    const updated: Projeto = {
      ...project,
      contingenciaPercent: newVal,
      atualizadoEm: new Date().toISOString(),
    };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
  };

  // Expand / Collapse all
  const handleExpandAll = () => {
    const expandedMap: Record<string, boolean> = {};
    groupedData.forEach((g) => {
      expandedMap[g.grupoNome] = true;
    });
    setExpandedGroups(expandedMap);

    const roomsMap: Record<string, boolean> = {};
    project.ambientes.forEach((a) => {
      roomsMap[a.id] = true;
    });
    setExpandedRooms(roomsMap);
  };

  const handleCollapseAll = () => {
    const collapsedMap: Record<string, boolean> = {};
    groupedData.forEach((g) => {
      collapsedMap[g.grupoNome] = false;
    });
    setExpandedGroups(collapsedMap);

    const roomsMap: Record<string, boolean> = {};
    project.ambientes.forEach((a) => {
      roomsMap[a.id] = false;
    });
    setExpandedRooms(roomsMap);
  };

  // --- EXPORT FUNCTIONS ---

  // Exportar Lista de Aquisição e Cotação de Fornecedores (CSV)
  const handleExportCotacaoCSV = (onlyPending = false) => {
    const listItems = onlyPending ? items.filter((i) => !i.comprado) : items;

    const rows = [
      ['LISTA DE COMPRAS E MAPA DE COTAÇÃO DE MATERIAIS — OBRA ICENV 2026'],
      ['PROJETO', project.nome],
      ['PASTA DOCUMENTAL', project.pastaDocumentos || ''],
      ['DATA EMISSÃO', new Date().toLocaleDateString('pt-BR')],
      ['FILTRO', onlyPending ? 'APENAS ITENS PENDENTES (A COMPRAR)' : 'TODOS OS ITENS'],
      [],
      [
        'Status',
        'Grupo / Classe',
        'Categoria',
        'Descrição do Material / Especificação',
        'Fabricante Sugerido',
        'Ambiente',
        'Qtd Base',
        'Perda %',
        'Qtd a Comprar (c/ Perda)',
        'Unidade',
        'Preço Ref. Estimado (R$)',
        'Total Estimado (R$)',
        'Fornecedor / Loja Referência',
        'Preço Cotado Real (R$)',
        'Fornecedor Escolhido',
        'Nº Pedido / NF',
        'Observações de Compra',
      ],
    ];

    listItems.forEach((item) => {
      const room = project.ambientes.find((a) => a.id === item.ambienteId)?.nome || 'Geral';
      rows.push([
        item.comprado ? 'COMPRADO' : 'PLANEJADO / A COMPRAR',
        `"${item.classe}"`,
        `"${item.categoria}"`,
        `"${item.materialNome}"`,
        `"${item.fabricante || ''}"`,
        `"${room}"`,
        String(item.quantidadeBase),
        `${item.perdaTecnicaPercent}%`,
        String(item.quantidadeComPerda),
        item.unidade,
        item.precoUnitario.toFixed(2),
        item.precoTotal.toFixed(2),
        `"${item.lojaReferencia || ''}"`,
        '', // Coluna em branco para cotação na loja
        '', // Coluna em branco para fornecedor
        '', // Coluna em branco para nota fiscal
        `"${item.observacoes || ''}"`,
      ]);
    });

    const totalEstimado = listItems.reduce((acc, i) => acc + i.precoTotal, 0);
    rows.push([]);
    rows.push(['TOTAL GERAL ESTIMADO', '', '', '', '', '', '', '', '', '', '', totalEstimado.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `lista_cotacao_${onlyPending ? 'pendentes_' : ''}${project.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar Planilha Completa Detalhada do Orçamento (CSV)
  const handleExportCSV = () => {
    const rows = [
      ['DETALHAMENTO EXECUTIVO DO ORÇAMENTO — OBRA ICENV 2026'],
      ['PROJETO', project.nome],
      ['PASTA DOCUMENTOS', project.pastaDocumentos || ''],
      ['DATA EXPORTACAO', new Date().toLocaleDateString('pt-BR')],
      [],
      [
        'Status',
        'Grupo / Classe',
        'Categoria',
        'Material / Descrição',
        'Fabricante',
        'Ambiente',
        'Qtd Base',
        'Perda %',
        'Qtd Compra (Final)',
        'Unidade',
        'Preço Unitário (R$)',
        'Total (R$)',
        'Loja Referência',
        'Observações',
      ],
    ];

    groupedData.forEach((g) => {
      Object.values(g.categorias).forEach((cat) => {
        cat.itens.forEach((item) => {
          const room = project.ambientes.find((a) => a.id === item.ambienteId)?.nome || 'Geral';
          rows.push([
            item.comprado ? 'Comprado' : 'Planejado',
            `"${g.grupoNome}"`,
            `"${cat.categoriaNome}"`,
            `"${item.materialNome}"`,
            `"${item.fabricante || ''}"`,
            `"${room}"`,
            String(item.quantidadeBase),
            `${item.perdaTecnicaPercent}%`,
            String(item.quantidadeComPerda),
            item.unidade,
            item.precoUnitario.toFixed(2),
            item.precoTotal.toFixed(2),
            `"${item.lojaReferencia || ''}"`,
            `"${item.observacoes || ''}"`,
          ]);
        });
      });
    });

    rows.push([]);
    rows.push(['SUBTOTAL MATERIAIS', '', '', '', '', '', '', '', '', '', rawTotalActive.toFixed(2)]);
    rows.push([`CONTINGENCIA / RESERVA (${contingencyPercent}%)`, '', '', '', '', '', '', '', '', '', contingencyValue.toFixed(2)]);
    rows.push(['TOTAL MATERIAIS COM MARGEM', '', '', '', '', '', '', '', '', '', materialsWithContingency.toFixed(2)]);
    rows.push(['MAO DE OBRA WAGNER', '', '', '', '', '', '', '', '', '', laborBudget.toFixed(2)]);
    rows.push(['CUSTO GLOBAL DA OBRA', '', '', '', '', '', '', '', '', '', globalProjectBudget.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orcamento_executivo_${project.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Sequential Phase Switcher Bar */}
      {projects && projects.length > 1 && onSelectProject && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mr-1 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Execução Sequencial:
            </span>
            {projects.map((p, idx) => {
              const isActive = p.id === project.id;
              const isPastoral = p.id.includes('pastoral') || p.nome.includes('Pastoral');
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black scale-[1.02]'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isPastoral ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                  <span>{idx + 1}ª Fase: {isPastoral ? 'Banheiro Casa Pastoral' : 'Banheiro Masculino'}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isActive ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {isPastoral ? 'Fase Inicial (Em Andamento)' : 'Fase 2 (Sequencial)'}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            🎯 Início: <strong>13/10/2026</strong> pela Casa Pastoral
          </span>
        </div>
      )}

      {/* Painel Executivo do Projeto — Estilo Técnico de Engenharia */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider font-mono">
                {project.status === 'em_andamento' ? 'Fase 1 — Em Execução' : 'Fase 2 — Sequencial'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Área: <strong className="text-white">{project.areaTotalM2} m²</strong>
              </span>
              {project.pastaDocumentos && (
                <span className="text-[11px] text-amber-400/90 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
                  <FolderOpen className="w-3 h-3 text-amber-400" />
                  {project.pastaDocumentos}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {project.nome}
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {project.descricao}
            </p>
          </div>

          {/* Botões de Ação Rápidos Compactos */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => handleOpenAddItem()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Incluir Item</span>
            </button>

            <button
              onClick={() => handleExportCotacaoCSV(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors"
              title="Exportar Lista para Cotação e Compras em Lojas"
            >
              <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lista de Cotação</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors"
              title="Exportar Planilha Completa do Orçamento"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-300" />
              <span>Orçamento CSV</span>
            </button>

            <button
              onClick={onOpenPrintBudget}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors"
              title="Visualizar Impressão ou Gerar PDF Executivo"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Telemetria Financeira e Aquisições Integrada (Menos cards, mais dados em linha) */}
        <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-800 rounded-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800/80 bg-slate-950/70 text-xs">
          {/* 1. Subtotal Insumos */}
          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              1. Insumos Base
            </span>
            <div className="text-base sm:text-lg font-black text-white font-mono tabular-nums">
              R$ {rawTotalActive.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              {items.length} itens • {groupedData.length} grupos
            </span>
          </div>

          {/* 2. Reserva Técnica */}
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider">
                2. Margem Técnica
              </span>
              <span className="text-[10px] font-bold text-amber-400 font-mono">
                {contingencyPercent}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-300 font-mono tabular-nums">
              + R$ {contingencyValue.toFixed(2)}
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="5"
              value={contingencyPercent}
              onChange={(e) => handleUpdateContingency(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1 cursor-pointer block"
              title="Ajustar margem técnica"
            />
          </div>

          {/* 3. Materiais c/ Margem */}
          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              3. Insumos c/ Margem
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono tabular-nums">
              R$ {materialsWithContingency.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              Previsão de materiais
            </span>
          </div>

          {/* 4. Mão de Obra Wagner */}
          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              4. Mão de Obra Wagner
            </span>
            <div className="text-base sm:text-lg font-black text-sky-400 font-mono tabular-nums">
              R$ {laborBudget.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              Contrato empreitada
            </span>
          </div>

          {/* 5. Custo Global Teto */}
          <div className="p-3 space-y-0.5 col-span-2 md:col-span-1 bg-amber-500/5">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
              5. Teto Global
            </span>
            <div className="text-base sm:text-xl font-black text-amber-300 font-mono tabular-nums">
              R$ {globalProjectBudget.toFixed(2)}
            </div>
            <span className="text-[10px] text-amber-400/70 font-mono block">
              R$ {costPerM2.toFixed(2)}/m²
            </span>
          </div>
        </div>

        {/* Faixa Técnica de Status das Aquisições */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-semibold text-slate-300">
              Evolução das Compras:
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {compradosCount} de {items.length} itens ({percentComprado.toFixed(0)}%)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Comprado: <strong className="text-emerald-400">R$ {totalComprado.toFixed(2)}</strong> • Pendente: <strong className="text-amber-400">R$ {totalPendente.toFixed(2)}</strong>
            </span>
          </div>

          {/* Mini Barra de Progresso e Ação */}
          <div className="flex items-center gap-3">
            <div className="w-24 sm:w-32 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(percentComprado, 100)}%` }}
              />
            </div>
            {totalPendente > 0 && (
              <button
                onClick={() => handleExportCotacaoCSV(true)}
                className="text-[11px] font-mono font-bold text-amber-400 hover:underline flex items-center gap-1"
                title="Exportar apenas itens pendentes"
              >
                <Download className="w-3 h-3" />
                Baixar Pendentes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailing Control Bar: Search, Filters & View Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Pesquisar por item, fabricante, categoria ou ambiente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>

          {/* Filters & View Switches */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Group */}
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-400"
            >
              <option value="todos">Todos os Grupos</option>
              {allGroups.map((g) => (
                <option key={g} value={g}>
                  Grupo: {g}
                </option>
              ))}
            </select>

            {/* Filter by Room */}
            <select
              value={selectedAmbienteFilter}
              onChange={(e) => setSelectedAmbienteFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-400"
            >
              <option value="todos">Todos os Ambientes</option>
              {project.ambientes.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.nome}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-400"
            >
              <option value="todos">Status: Todos</option>
              <option value="planejado">Apenas Planejados / A Comprar</option>
              <option value="comprado">Apenas Já Comprados</option>
            </select>

            {/* View Mode Toggle: Grupos vs Ambientes */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grupos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grupos'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Grupos
              </button>
              <button
                onClick={() => setViewMode('ambientes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'ambientes'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Ambientes
              </button>
            </div>
          </div>
        </div>

        {/* Counter and Expand/Collapse Bar */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Exibindo <strong className="text-white">{filteredItems.length}</strong> de{' '}
            <strong className="text-white">{items.length}</strong> itens
            {filteredItems.length > 0 && (
              <span className="ml-2 text-emerald-400 font-semibold">
                (Subtotal filtrado: R${' '}
                {filteredItems.reduce((acc, i) => acc + i.precoTotal, 0).toFixed(2)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              Expandir Todos
            </button>
            <span>•</span>
            <button
              onClick={handleCollapseAll}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              Recolher Todos
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW: BY GROUPS & CATEGORIES (COMPACT TABLE FORMAT) */}
      {viewMode === 'grupos' && (
        <div className="space-y-4">
          {groupedData.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">Nenhum item encontrado para os filtros selecionados.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGroupFilter('todos');
                  setSelectedAmbienteFilter('todos');
                  setSelectedStatusFilter('todos');
                }}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            groupedData.map((group) => {
              const isExpanded = expandedGroups[group.grupoNome] !== false; // expanded by default
              const groupPercent = rawTotalActive > 0 ? (group.subtotal / rawTotalActive) * 100 : 0;

              return (
                <div
                  key={group.grupoNome}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  {/* Grupo Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                    <button
                      onClick={() => toggleGroup(group.grupoNome)}
                      className="flex items-center gap-2.5 text-left group flex-1"
                    >
                      <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                        {getGroupIcon(group.grupoNome)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
                            {group.grupoNome}
                          </h3>
                          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
                            {group.totalItens} {group.totalItens === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Representa {groupPercent.toFixed(1)}% do total de materiais
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Subtotal do Grupo:</span>
                        <strong className="text-base sm:text-lg font-black text-amber-400">
                          R$ {group.subtotal.toFixed(2)}
                        </strong>
                      </div>

                      <button
                        onClick={() => handleOpenAddItem(group.grupoNome)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow"
                        title={`Adicionar novo item no grupo ${group.grupoNome}`}
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Item</span>
                      </button>
                    </div>
                  </div>

                  {/* Grupo Content: Compact Tables per Category */}
                  {isExpanded && (
                    <div className="p-2 sm:p-4 bg-slate-950/40 space-y-3">
                      {Object.values(group.categorias).map((cat) => (
                        <div
                          key={cat.categoriaNome}
                          className="border border-slate-800/90 rounded-xl overflow-hidden bg-slate-900/80 shadow-sm"
                        >
                          {/* Categoria Subheader */}
                          <div className="px-3.5 py-2 bg-slate-800/50 border-b border-slate-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                {cat.categoriaNome}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                ({cat.itens.length} {cat.itens.length === 1 ? 'item' : 'itens'})
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-400">
                              R$ {cat.subtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Dense Table View for Quantitativos */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 select-none">
                                  <th className="py-2 px-3 font-extrabold w-28">Status</th>
                                  <th className="py-2 px-3 font-extrabold min-w-[200px]">Item / Especificação</th>
                                  <th className="py-2 px-2.5 font-extrabold">Ambiente</th>
                                  <th className="py-2 px-2.5 font-extrabold text-right">Qtd Base</th>
                                  <th className="py-2 px-2 font-extrabold text-center">Perda</th>
                                  <th className="py-2 px-2.5 font-extrabold text-right text-amber-300">Qtd Compra</th>
                                  <th className="py-2 px-2 font-extrabold">Unid</th>
                                  <th className="py-2 px-3 font-extrabold text-right">Preço Unit</th>
                                  <th className="py-2 px-3 font-extrabold text-right text-white">Subtotal</th>
                                  <th className="py-2 px-3 font-extrabold hidden lg:table-cell">Loja / Cotação</th>
                                  <th className="py-2 px-2.5 font-extrabold text-center w-20">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {cat.itens.map((item) => {
                                  const room = project.ambientes.find((a) => a.id === item.ambienteId);

                                  return (
                                    <tr
                                      key={item.id}
                                      className="hover:bg-slate-800/40 transition-colors group"
                                    >
                                      {/* Status Interactive Toggle */}
                                      <td className="py-2 px-3 whitespace-nowrap">
                                        <button
                                          onClick={() => handleToggleItemComprado(item.id, !!item.comprado)}
                                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                            item.comprado
                                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-400/50 hover:text-amber-300'
                                          }`}
                                          title="Clique para alternar entre Planejado e Comprado"
                                        >
                                          {item.comprado ? (
                                            <>
                                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                              <span>Comprado</span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="w-3 h-3 text-slate-400" />
                                              <span>Planejado</span>
                                            </>
                                          )}
                                        </button>
                                      </td>

                                      {/* Item Description, Brand & Specs */}
                                      <td className="py-2 px-3">
                                        <div className="font-bold text-white text-xs leading-snug">
                                          {item.materialNome}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                                          <span className="text-amber-400 font-semibold">{item.fabricante || 'Genérico'}</span>
                                          {item.tipo && <span>• {item.tipo}</span>}
                                          {item.observacoes && (
                                            <span className="italic text-slate-400">• {item.observacoes}</span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Room Badge */}
                                      <td className="py-2 px-2.5 whitespace-nowrap">
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                          {room?.nome ? (room.nome.includes('Pastoral') ? 'Casa Pastoral' : room.nome.includes('Masculino') ? 'Banheiro Masc.' : room.nome) : 'Geral'}
                                        </span>
                                      </td>

                                      {/* Qtd Base */}
                                      <td className="py-2 px-2.5 text-right font-medium text-slate-300 whitespace-nowrap font-mono text-[11px]">
                                        {item.quantidadeBase}
                                      </td>

                                      {/* Technical Loss Margin % */}
                                      <td className="py-2 px-2 text-center text-[10px] text-amber-400 whitespace-nowrap font-bold">
                                        {item.perdaTecnicaPercent > 0 ? `+${item.perdaTecnicaPercent}%` : '—'}
                                      </td>

                                      {/* Qtd Compra / Final */}
                                      <td className="py-2 px-2.5 text-right font-black text-amber-300 whitespace-nowrap font-mono text-[11px]">
                                        {item.quantidadeComPerda}
                                      </td>

                                      {/* Unit */}
                                      <td className="py-2 px-2 text-[10px] text-slate-400 whitespace-nowrap font-medium">
                                        {item.unidade}
                                      </td>

                                      {/* Unit Price */}
                                      <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap font-mono text-[11px]">
                                        R$ {item.precoUnitario.toFixed(2)}
                                      </td>

                                      {/* Subtotal */}
                                      <td className="py-2 px-3 text-right font-black text-white whitespace-nowrap font-mono text-xs">
                                        R$ {item.precoTotal.toFixed(2)}
                                      </td>

                                      {/* Reference Store / Quotation */}
                                      <td
                                        className="py-2 px-3 text-[10px] text-slate-400 truncate max-w-[130px] hidden lg:table-cell"
                                        title={item.lojaReferencia || 'Não informado'}
                                      >
                                        {item.lojaReferencia || '—'}
                                      </td>

                                      {/* Action Buttons: Alterar & Excluir */}
                                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            onClick={() => handleOpenEditItem(item)}
                                            className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                                            title="Alterar este item"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteItem(item.id, item.materialNome)}
                                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                                            title="Excluir este item do orçamento"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ALTERNATIVE VIEW: BY ENVIRONMENTS (ROOMS) - COMPACT TABLE */}
      {viewMode === 'ambientes' && (
        <div className="space-y-4">
          {project.ambientes.map((ambiente) => {
            const isExpanded = expandedRooms[ambiente.id] !== false;
            const roomItems = filteredItems.filter((i) => i.ambienteId === ambiente.id);
            const roomTotal = roomItems.reduce((acc, i) => acc + i.precoTotal, 0);

            return (
              <div
                key={ambiente.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Room Header row */}
                <div className="p-3.5 bg-slate-900 flex items-center justify-between border-b border-slate-800">
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
                        {ambiente.areaPisoM2 > 0 && (
                          <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                            {ambiente.areaPisoM2} m² piso
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          ({roomItems.length} {roomItems.length === 1 ? 'item' : 'itens'})
                        </span>
                      </div>
                      {ambiente.observacoes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ambiente.observacoes}</p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block sm:inline mr-1">Subtotal:</span>
                      <strong className="text-sm sm:text-base font-extrabold text-emerald-400">
                        R$ {roomTotal.toFixed(2)}
                      </strong>
                    </div>

                    <button
                      onClick={() => handleOpenAddItem()}
                      className="p-1 sm:px-2.5 sm:py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow transition-transform active:scale-95"
                      title="Adicionar material a este ambiente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">+ Item</span>
                    </button>
                  </div>
                </div>

                {/* Room Items in Table */}
                {isExpanded && (
                  <div className="p-2 sm:p-4 bg-slate-950/40">
                    {roomItems.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                        <p>Nenhum item adicionado a este ambiente com os filtros atuais.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/80">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                                <th className="py-2 px-3 font-extrabold w-28">Status</th>
                                <th className="py-2 px-3 font-extrabold">Material / Especificação</th>
                                <th className="py-2 px-2.5 font-extrabold">Grupo / Classe</th>
                                <th className="py-2 px-2.5 font-extrabold text-right">Qtd Base</th>
                                <th className="py-2 px-2 font-extrabold text-center">Perda</th>
                                <th className="py-2 px-2.5 font-extrabold text-right text-amber-300">Qtd Compra</th>
                                <th className="py-2 px-2 font-extrabold">Unid</th>
                                <th className="py-2 px-3 font-extrabold text-right">Preço Unit</th>
                                <th className="py-2 px-3 font-extrabold text-right text-white">Subtotal</th>
                                <th className="py-2 px-2.5 font-extrabold text-center w-20">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {roomItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                  {/* Status */}
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <button
                                      onClick={() => handleToggleItemComprado(item.id, !!item.comprado)}
                                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                        item.comprado
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-400/50 hover:text-amber-300'
                                      }`}
                                    >
                                      {item.comprado ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>Comprado</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          <span>Planejado</span>
                                        </>
                                      )}
                                    </button>
                                  </td>

                                  {/* Item */}
                                  <td className="py-2 px-3">
                                    <div className="font-bold text-white text-xs">{item.materialNome}</div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      <span className="text-amber-400 font-semibold">{item.fabricante || 'Genérico'}</span>
                                      {item.categoria && <span>• {item.categoria}</span>}
                                    </div>
                                  </td>

                                  {/* Classe */}
                                  <td className="py-2 px-2.5 whitespace-nowrap text-[10px] font-semibold text-slate-300">
                                    {item.classe}
                                  </td>

                                  {/* Qtd Base */}
                                  <td className="py-2 px-2.5 text-right font-medium text-slate-300 whitespace-nowrap font-mono text-[11px]">
                                    {item.quantidadeBase}
                                  </td>

                                  {/* Perda */}
                                  <td className="py-2 px-2 text-center text-[10px] text-amber-400 whitespace-nowrap font-bold">
                                    {item.perdaTecnicaPercent > 0 ? `+${item.perdaTecnicaPercent}%` : '—'}
                                  </td>

                                  {/* Qtd Compra */}
                                  <td className="py-2 px-2.5 text-right font-black text-amber-300 whitespace-nowrap font-mono text-[11px]">
                                    {item.quantidadeComPerda}
                                  </td>

                                  {/* Unidade */}
                                  <td className="py-2 px-2 text-[10px] text-slate-400 whitespace-nowrap font-medium">
                                    {item.unidade}
                                  </td>

                                  {/* Preço Unit */}
                                  <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap font-mono text-[11px]">
                                    R$ {item.precoUnitario.toFixed(2)}
                                  </td>

                                  {/* Subtotal */}
                                  <td className="py-2 px-3 text-right font-black text-white whitespace-nowrap font-mono text-xs">
                                    R$ {item.precoTotal.toFixed(2)}
                                  </td>

                                  {/* Ações */}
                                  <td className="py-2 px-2.5 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditItem(item)}
                                        className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id, item.materialNome)}
                                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Project Item Modal (Inclusão e Alteração) */}
      <ProjectItemModal
        isOpen={isItemModalOpen}
        mode={itemModalMode}
        itemToEdit={itemToEdit}
        preselectedClasse={preselectedGroupForNewItem}
        materials={materials}
        taxonomia={taxonomia}
        ambientes={project.ambientes}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
};
