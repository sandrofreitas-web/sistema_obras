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
} from 'lucide-react';
import { Projeto, ItemProjeto, Material, TaxonomiaClasse } from '../types';
import { storageService } from '../services/storageService';
import { ProjectItemModal } from './ProjectItemModal';

interface BudgetScreenProps {
  project: Projeto | null;
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
  const laborBudget = project.orcamentoMaoObra ?? 32500;
  const globalProjectBudget = materialsWithContingency + laborBudget;
  const costPerM2 = project.areaTotalM2 > 0 ? globalProjectBudget / project.areaTotalM2 : 0;

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

  // --- CRUD ACTIONS ---

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

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['PROJETO', project.nome],
      ['PASTA DOCUMENTOS', project.pastaDocumentos || ''],
      ['DATA EXPORTACAO', new Date().toLocaleDateString('pt-BR')],
      [],
      [
        'Grupo / Classe',
        'Categoria',
        'Material / Descrição',
        'Fabricante',
        'Ambiente',
        'Qtd Base',
        'Perda %',
        'Qtd Final',
        'Unidade',
        'Preço Unitário (R$)',
        'Total (R$)',
        'Status',
      ],
    ];

    groupedData.forEach((g) => {
      Object.values(g.categorias).forEach((cat) => {
        cat.itens.forEach((item) => {
          const room = project.ambientes.find((a) => a.id === item.ambienteId)?.nome || 'Geral';
          rows.push([
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
            item.comprado ? 'Comprado' : 'Planejado',
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
    link.setAttribute('download', `detalhamento_obra_${project.nome.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Project Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider">
                {project.status === 'em_andamento' ? 'Obra em Andamento' : 'Planejamento Executivo'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Área Total: <strong className="text-white">{project.areaTotalM2} m²</strong>
              </span>
              {project.pastaDocumentos && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                  <FolderOpen className="w-3 h-3 text-amber-400" />
                  {project.pastaDocumentos}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-2">
              {project.nome}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              {project.descricao}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => handleOpenAddItem()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Incluir Item no Orçamento</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
              title="Exportar Planilha Excel/CSV Detalhada"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onOpenPrintBudget}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
              title="Visualizar Impressão ou Gerar PDF"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Executive Financial Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Subtotal Materiais */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Subtotal Materiais (Lista Mestra)</span>
          <div className="text-lg sm:text-2xl font-black text-white mt-1">
            R$ {rawTotalActive.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {items.length} itens orçados em {groupedData.length} grupos
          </span>
        </div>

        {/* Contingência / Reserva Slider */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Contingência / Reserva</span>
            <span className="text-xs font-bold text-amber-400">{contingencyPercent}%</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-300 mt-1">
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
            title="Ajustar margem de contingência"
          />
        </div>

        {/* Total Materiais com Margem */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Materiais com Margem</span>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">
            R$ {materialsWithContingency.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            + Mão de Obra: R$ {laborBudget.toFixed(2)}
          </span>
        </div>

        {/* Custo Global da Obra */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-amber-950/20">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Custo Global da Obra</span>
          <div className="text-xl sm:text-3xl font-black text-white mt-1">
            R$ {globalProjectBudget.toFixed(2)}
          </div>
          <span className="text-[11px] text-amber-300/80 mt-1 block">
            Média: R$ {costPerM2.toFixed(2)} / m² ({project.areaTotalM2} m²)
          </span>
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
              placeholder="Filtrar itens por nome, fabricante, categoria ou ambiente..."
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
              <option value="planejado">Planejados</option>
              <option value="comprado">Já Comprados</option>
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
                Por Grupos & Categorias
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
            <strong className="text-white">{items.length}</strong> itens orçados
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

      {/* MAIN VIEW: BY GROUPS & CATEGORIES */}
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
                  <div className="p-4 sm:p-5 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                    <button
                      onClick={() => toggleGroup(group.grupoNome)}
                      className="flex items-center gap-3 text-left group flex-1"
                    >
                      <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        {getGroupIcon(group.grupoNome)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
                            {group.grupoNome}
                          </h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                            {group.totalItens} {group.totalItens === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Representa {groupPercent.toFixed(1)}% do orçamento de materiais
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Subtotal do Grupo:</span>
                        <strong className="text-base sm:text-lg font-black text-amber-400">
                          R$ {group.subtotal.toFixed(2)}
                        </strong>
                      </div>

                      <button
                        onClick={() => handleOpenAddItem(group.grupoNome)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
                        title={`Adicionar novo item no grupo ${group.grupoNome}`}
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Item</span>
                      </button>
                    </div>
                  </div>

                  {/* Grupo Content: Categories & Items */}
                  {isExpanded && (
                    <div className="p-3 sm:p-5 bg-slate-950/40 space-y-4">
                      {Object.values(group.categorias).map((cat) => (
                        <div
                          key={cat.categoriaNome}
                          className="border border-slate-800/90 rounded-xl overflow-hidden bg-slate-900/70"
                        >
                          {/* Categoria Header */}
                          <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
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

                          {/* Items Table / Responsive Rows */}
                          <div className="divide-y divide-slate-800/60">
                            {cat.itens.map((item) => {
                              const room = project.ambientes.find((a) => a.id === item.ambienteId);

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                                >
                                  {/* Left: Item Info */}
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-amber-400">
                                        {item.fabricante || 'Genérico'}
                                      </span>
                                      {item.tipo && (
                                        <span className="text-[11px] text-slate-400">
                                          • {item.tipo}
                                        </span>
                                      )}
                                      {room && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                                          📍 {room.nome}
                                        </span>
                                      )}
                                      {item.comprado ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Comprado
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          Planejado
                                        </span>
                                      )}
                                    </div>

                                    <h5 className="font-bold text-sm text-white">{item.materialNome}</h5>

                                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                      <span>
                                        Base: <strong>{item.quantidadeBase} {item.unidade}</strong>
                                      </span>
                                      <span className="text-amber-300/90 font-medium">
                                        +{item.perdaTecnicaPercent}% perda técnica ={' '}
                                        <strong className="text-white">
                                          {item.quantidadeComPerda} {item.unidade}
                                        </strong>
                                      </span>
                                      {item.lojaReferencia && (
                                        <span className="text-slate-500 text-[11px]">
                                          Cotado em: {item.lojaReferencia}
                                        </span>
                                      )}
                                    </div>

                                    {item.observacoes && (
                                      <p className="text-[11px] text-slate-400 italic">
                                        Obs: {item.observacoes}
                                      </p>
                                    )}
                                  </div>

                                  {/* Right: Pricing and Action Buttons */}
                                  <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                                    <div className="text-right">
                                      <span className="text-[11px] text-slate-400 block">
                                        R$ {item.precoUnitario.toFixed(2)} / {item.unidade}
                                      </span>
                                      <span className="text-sm sm:text-base font-black text-white">
                                        R$ {item.precoTotal.toFixed(2)}
                                      </span>
                                    </div>

                                    {/* Action Buttons: Alterar & Excluir */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditItem(item)}
                                        className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Alterar este item"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id, item.materialNome)}
                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                                        title="Excluir este item do orçamento"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
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

      {/* ALTERNATIVE VIEW: BY ENVIRONMENTS (ROOMS) */}
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
                <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
                  <button
                    onClick={() => toggleRoom(ambiente.id)}
                    className="flex items-center gap-3 text-left group flex-1"
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
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {ambiente.areaPisoM2} m² piso
                          </span>
                        )}
                      </div>
                      {ambiente.observacoes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ambiente.observacoes}</p>
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
                      onClick={() => handleOpenAddItem()}
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
                      <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                        <p>Nenhum item adicionado a este ambiente com os filtros atuais.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
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
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {item.categoria}
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
                                  Qtd: <strong>{item.quantidadeBase} {item.unidade}</strong>
                                </span>
                                <span className="text-amber-300 font-medium">
                                  +{item.perdaTecnicaPercent}% perda ={' '}
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

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800"
                                  title="Alterar este item"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.materialNome)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                                  title="Remover do orçamento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
