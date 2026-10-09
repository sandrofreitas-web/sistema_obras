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
  ListChecks,
  Sliders,
  TrendingUp,
  Percent,
  Check,
  X,
  FileText,
  Eye
} from 'lucide-react';
import { Projeto, ItemProjeto, Material, TaxonomiaClasse } from '../types';
import { storageService } from '../services/storageService';
import { ProjectItemModal } from './ProjectItemModal';
import { WbsItemInspector } from './WbsItemInspector';

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
  editModeEnabled?: boolean;
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

// Formatação brasileira pt-BR
const formatCurrencyBR = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatNumberBR = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  editModeEnabled = true,
}) => {
  if (!project) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p>Nenhum projeto de obra selecionado.</p>
      </div>
    );
  }

  // Active scenario is the primary budget container
  const currentScenario =
    project.cenarios.find((c) => c.id === project.cenarioAtivoId) || project.cenarios[0];

  const items = currentScenario?.itens || [];

  // Sub-aba ativa dentro da visão de Orçamento
  const [subTab, setSubTab] = useState<'wbs' | 'proposta' | 'compras'>('wbs');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('todos');
  const [selectedAmbienteFilter, setSelectedAmbienteFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'planejado' | 'comprado'>('todos');
  const [groupingMode, setGroupingMode] = useState<'etapas' | 'ambientes'>('etapas');

  // Accordion Expanded State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Item Modal State (Create / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit'>('create');
  const [itemToEdit, setItemToEdit] = useState<ItemProjeto | null>(null);
  const [preselectedGroupForNewItem, setPreselectedGroupForNewItem] = useState<string>('');
  const [preselectedCategoryForNewItem, setPreselectedCategoryForNewItem] = useState<string>('');
  const [preselectedAmbienteForNewItem, setPreselectedAmbienteForNewItem] = useState<string>('');

  // Item Inspetor State (Opção 2 - Lateral Drawer)
  const [selectedInspectorItem, setSelectedInspectorItem] = useState<ItemProjeto | null>(null);
  const [selectedItemCode, setSelectedItemCode] = useState<string>('');

  // BDI Inline Editing State
  const [isEditingBdi, setIsEditingBdi] = useState(false);
  const [tempBdi, setTempBdi] = useState<string>(String(project.contingenciaPercent ?? 10));

  // Toggle Section
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
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

  // Filter items according to search and filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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

      if (selectedGroupFilter !== 'todos' && item.classe !== selectedGroupFilter) {
        return false;
      }

      if (selectedAmbienteFilter !== 'todos' && item.ambienteId !== selectedAmbienteFilter) {
        return false;
      }

      if (selectedStatusFilter === 'comprado' && !item.comprado) return false;
      if (selectedStatusFilter === 'planejado' && item.comprado) return false;

      return true;
    });
  }, [items, searchTerm, selectedGroupFilter, selectedAmbienteFilter, selectedStatusFilter, project.ambientes]);

  // Estrutura Analítica WBS (Nível 1: Macro-Etapas / Classes)
  const wbsEtapasData = useMemo(() => {
    const map: Record<string, { id: string; nome: string; itens: ItemProjeto[]; subtotal: number }> = {};

    // Mapeia classes ordenadas por fluxo construtivo
    const ordemClasses: string[] = [
      'Caçambas & Serviços',
      'Bruto / Estrutura',
      'Hidráulica',
      'Elétrica',
      'Revestimento',
      'Gesso & Drywall',
      'Louças & Metais',
      'Marmoraria & Divisórias',
      'Pintura'
    ];

    filteredItems.forEach((item) => {
      const cName = item.classe || 'Geral';
      if (!map[cName]) {
        map[cName] = {
          id: cName,
          nome: cName,
          itens: [],
          subtotal: 0,
        };
      }
      map[cName].itens.push(item);
      map[cName].subtotal += item.precoTotal;
    });

    return Object.values(map).sort((a, b) => {
      const idxA = ordemClasses.indexOf(a.nome);
      const idxB = ordemClasses.indexOf(b.nome);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.subtotal - a.subtotal;
    });
  }, [filteredItems]);

  // Estrutura por Ambientes
  const wbsAmbientesData = useMemo(() => {
    const map: Record<string, { id: string; nome: string; itens: ItemProjeto[]; subtotal: number }> = {};

    project.ambientes.forEach((amb) => {
      map[amb.id] = {
        id: amb.id,
        nome: amb.nome,
        itens: [],
        subtotal: 0,
      };
    });

    filteredItems.forEach((item) => {
      const ambId = item.ambienteId || 'geral';
      if (!map[ambId]) {
        map[ambId] = {
          id: ambId,
          nome: 'Área Geral / Comum',
          itens: [],
          subtotal: 0,
        };
      }
      map[ambId].itens.push(item);
      map[ambId].subtotal += item.precoTotal;
    });

    return Object.values(map).filter((a) => a.itens.length > 0 || selectedAmbienteFilter === a.id);
  }, [filteredItems, project.ambientes, selectedAmbienteFilter]);

  // Expand / Collapse All
  const handleExpandAll = () => {
    const m: Record<string, boolean> = {};
    wbsEtapasData.forEach((e) => (m[e.id] = true));
    wbsAmbientesData.forEach((a) => (m[a.id] = true));
    setExpandedSections(m);
  };

  const handleCollapseAll = () => {
    const m: Record<string, boolean> = {};
    wbsEtapasData.forEach((e) => (m[e.id] = false));
    wbsAmbientesData.forEach((a) => (m[a.id] = false));
    setExpandedSections(m);
  };

  // --- CRUD ACTIONS ---

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

    // Atualiza item selecionado no inspetor se for o mesmo
    if (selectedInspectorItem && selectedInspectorItem.id === itemId) {
      setSelectedInspectorItem({ ...selectedInspectorItem, comprado: !currentStatus });
    }
  };

  const handleOpenAddItem = (
    preselectedClasse?: string,
    preselectedCategoria?: string,
    preselectedAmbienteId?: string
  ) => {
    setItemModalMode('create');
    setItemToEdit(null);

    // Prioriza classe passada, senão herda filtro de grupo ativo se não for 'todos'
    const targetClasse =
      preselectedClasse || (selectedGroupFilter !== 'todos' ? selectedGroupFilter : '');

    // Prioriza ambiente passado, senão herda filtro de ambiente ativo se não for 'todos'
    const targetAmbiente =
      preselectedAmbienteId || (selectedAmbienteFilter !== 'todos' ? selectedAmbienteFilter : '');

    setPreselectedGroupForNewItem(targetClasse);
    setPreselectedCategoryForNewItem(preselectedCategoria || '');
    setPreselectedAmbienteForNewItem(targetAmbiente);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: ItemProjeto) => {
    setItemModalMode('edit');
    setItemToEdit(item);
    setPreselectedGroupForNewItem(item.classe);
    setPreselectedCategoryForNewItem(item.categoria);
    setPreselectedAmbienteForNewItem(item.ambienteId);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentScenario) return;
    if (!window.confirm('Deseja excluir este item do orçamento da obra?')) return;

    const updatedItens = currentScenario.itens.filter((it) => it.id !== itemId);
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

    if (selectedInspectorItem?.id === itemId) {
      setSelectedInspectorItem(null);
    }
  };

  const handleSaveItem = (itemData: any) => {
    if (!currentScenario) return;

    let updatedItens: ItemProjeto[];

    if (itemModalMode === 'edit' && itemData.id) {
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
      const newItem: ItemProjeto = {
        ...itemData,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cenarioId: currentScenario.id,
      };
      updatedItens = [...currentScenario.itens, newItem];
    }

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
    setIsItemModalOpen(false);

    if (selectedInspectorItem && selectedInspectorItem.id === itemData.id) {
      setSelectedInspectorItem({ ...selectedInspectorItem, ...itemData });
    }
  };

  // Salvar BDI Global
  const handleSaveBdi = () => {
    const parsed = parseFloat(tempBdi);
    if (isNaN(parsed) || parsed < 0) {
      alert('Informe um valor de BDI válido.');
      return;
    }
    const updatedProject: Projeto = {
      ...project,
      contingenciaPercent: parsed,
      atualizadoEm: new Date().toISOString(),
    };
    storageService.saveProject(updatedProject);
    onProjectUpdated(updatedProject);
    setIsEditingBdi(false);
  };

  // Exportar Planilha CSV
  const handleExportCSV = () => {
    const rows = [
      ['DETALHAMENTO EXECUTIVO DO ORÇAMENTO WBS — ' + project.nome],
      ['CLIENTE / RESPONSÁVEL', project.cliente || 'ICENV 2026'],
      ['BASE OFICIAL', 'SINAPI SP 2026 / PRÓPRIA'],
      ['DATA EMISSÃO', new Date().toLocaleDateString('pt-BR')],
      ['BDI GLOBAL', `${contingencyPercent}%`],
      [],
      [
        'Item',
        'Etapa / Classe',
        'Descrição do Material / Composição',
        'Fabricante',
        'Ambiente',
        'Qtd Base',
        'Perda %',
        'Qtd Final Compra',
        'Unidade',
        'Custo Unitário (R$)',
        'Custo Total (R$)',
        'BDI %',
        'Preço Unit. Venda (R$)',
        'Preço Total Venda (R$)',
        'Status',
        'Loja Referência',
      ],
    ];

    let macroIndex = 1;
    wbsEtapasData.forEach((etapa) => {
      rows.push([
        `${macroIndex}.0`,
        `"${etapa.nome.toUpperCase()}"`,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        etapa.subtotal.toFixed(2),
        `${contingencyPercent}%`,
        '',
        (etapa.subtotal * (1 + contingencyPercent / 100)).toFixed(2),
        '',
        '',
      ]);

      etapa.itens.forEach((it, subIdx) => {
        const room = project.ambientes.find((a) => a.id === it.ambienteId)?.nome || 'Geral';
        const precoUnitVenda = it.precoUnitario * (1 + contingencyPercent / 100);
        const precoTotVenda = it.precoTotal * (1 + contingencyPercent / 100);

        rows.push([
          `${macroIndex}.${subIdx + 1}`,
          `"${it.classe}"`,
          `"${it.materialNome}"`,
          `"${it.fabricante || ''}"`,
          `"${room}"`,
          String(it.quantidadeBase),
          `${it.perdaTecnicaPercent}%`,
          String(it.quantidadeComPerda),
          it.unidade,
          it.precoUnitario.toFixed(2),
          it.precoTotal.toFixed(2),
          `${contingencyPercent}%`,
          precoUnitVenda.toFixed(2),
          precoTotVenda.toFixed(2),
          it.comprado ? 'COMPRADO' : 'PLANEJADO',
          `"${it.lojaReferencia || ''}"`,
        ]);
      });
      macroIndex++;
    });

    rows.push([]);
    rows.push(['TOTAL CUSTO DIRETO', '', '', '', '', '', '', '', '', '', rawTotalActive.toFixed(2)]);
    rows.push(['BDI GLOBAL (%)', '', '', '', '', '', '', '', '', '', `${contingencyPercent}%`]);
    rows.push(['MÃO DE OBRA CONTRATADA', '', '', '', '', '', '', '', '', '', laborBudget.toFixed(2)]);
    rows.push(['PREÇO GLOBAL DA PROPOSTA', '', '', '', '', '', '', '', '', '', globalProjectBudget.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `orcamento_wbs_${project.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeSections = groupingMode === 'etapas' ? wbsEtapasData : wbsAmbientesData;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none relative bg-[#060911]">
      {/* 1. Barra de Sub-Abas do Projeto (Estilo ERP Sienge/Mais Controle da Referência) */}
      <div className="h-10 bg-[#090d16] border-b border-slate-800/90 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 h-full">
          <button
            onClick={() => setSubTab('wbs')}
            className={`h-full px-3.5 flex items-center gap-2 text-xs font-bold transition-all relative ${
              subTab === 'wbs'
                ? 'text-sky-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Orçamento (WBS)</span>
            {subTab === 'wbs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-sm shadow-sky-400/50" />
            )}
          </button>

          <button
            onClick={() => setSubTab('proposta')}
            className={`h-full px-3.5 flex items-center gap-2 text-xs font-bold transition-all relative ${
              subTab === 'proposta'
                ? 'text-sky-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Proposta Comercial</span>
            {subTab === 'proposta' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-sm shadow-sky-400/50" />
            )}
          </button>

          <button
            onClick={() => setSubTab('compras')}
            className={`h-full px-3.5 flex items-center gap-2 text-xs font-bold transition-all relative ${
              subTab === 'compras'
                ? 'text-sky-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Mapa de Cotação</span>
            {subTab === 'compras' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-sm shadow-sky-400/50" />
            )}
          </button>
        </div>

        {/* Seletor de Fase Sequencial da Obra */}
        {projects && projects.length > 1 && onSelectProject && (
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Fase da Obra:</span>
            {projects.map((p, idx) => {
              const isActive = p.id === project.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {idx + 1}ª Fase ({p.id.includes('pastoral') ? 'Casa Pastoral' : 'Banheiro Masculino'})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Barra de Filtros & Controle de Visualização da Grade (38px Compacta) */}
      <div className="h-10 bg-[#080c14] border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 flex-shrink-0 text-xs">
        {/* Esquerda: Busca rápida e filtros */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl min-w-0">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar insumo, fabricante ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d121e] border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
            />
          </div>

          {/* Toggle de Agrupamento WBS: Por Etapa vs Por Ambiente */}
          <div className="flex items-center bg-[#0d121e] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setGroupingMode('etapas')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                groupingMode === 'etapas'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Por Macro-Etapas
            </button>
            <button
              onClick={() => setGroupingMode('ambientes')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                groupingMode === 'ambientes'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Por Ambientes
            </button>
          </div>

          {/* Filtro Status */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="bg-[#0d121e] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 outline-none cursor-pointer"
          >
            <option value="todos">Status: Todos</option>
            <option value="planejado">Apenas Planejados</option>
            <option value="comprado">Apenas Comprados</option>
          </select>
        </div>

        {/* Direita: Totalizadores de itens, Exportar CSV e Expandir/Recolher */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px] flex-shrink-0">
          <span className="hidden sm:inline">
            <strong className="text-white font-mono">{filteredItems.length}</strong> itens exibidos
          </span>

          <div className="flex items-center gap-1.5 font-medium">
            <button
              onClick={handleExpandAll}
              className="hover:text-sky-400 transition-colors"
            >
              Expandir
            </button>
            <span>•</span>
            <button
              onClick={handleCollapseAll}
              className="hover:text-sky-400 transition-colors"
            >
              Recolher
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors font-semibold"
            title="Exportar Planilha Orçamentária WBS em CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3. Área Central: Grade WBS Hierárquica em Árvore (Full Width) + Painel Inspetor Lateral */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden pb-14">
        {/* TABELA WBS 100% LARGURA */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            {/* Header Corporativo (Inspirado no Sienge / Mais Controle) */}
            <thead className="bg-[#0b101c] text-slate-300 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider sticky top-0 z-10 select-none shadow-sm">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">Item</th>
                <th className="py-2.5 px-3">Descrição do Insumo / Composição</th>
                <th className="py-2.5 px-3 w-32">Ambiente</th>
                <th className="py-2.5 px-3 w-20 text-right">Qtde</th>
                <th className="py-2.5 px-3 w-14 text-center">Un.</th>
                <th className="py-2.5 px-3 w-28 text-right">Custo Unit.</th>
                <th className="py-2.5 px-3 w-32 text-right">Custo Total</th>
                <th className="py-2.5 px-3 w-20 text-center">BDI</th>
                <th className="py-2.5 px-3 w-28 text-right">Preço Unit.</th>
                <th className="py-2.5 px-3 w-32 text-right">Preço Total</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
                <th className="py-2.5 px-3 w-20 text-center">Ações</th>
              </tr>
            </thead>

            {/* Linhas da WBS */}
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {activeSections.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-500">
                    <p className="font-semibold">Nenhum item encontrado com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                activeSections.map((section, sIdx) => {
                  const isExpanded = Boolean(expandedSections[section.id]); // Padrão: recolhido (conforme solicitado pelo usuário)
                  const macroCode = `${sIdx + 1}.0`;
                  const macroBdi = contingencyPercent;
                  const macroCustoTotal = section.subtotal;
                  const macroPrecoTotal = macroCustoTotal * (1 + macroBdi / 100);

                  return (
                    <React.Fragment key={section.id}>
                      {/* LINHA DE MACRO-ETAPA / NÍVEL 1 (SINTÉTICA) */}
                      <tr className="bg-[#0e1424] hover:bg-[#121a2f] border-t-2 border-b border-slate-700/80 transition-colors font-bold text-white">
                        <td className="py-2.5 px-3 text-center font-mono text-sky-400 font-extrabold">
                          {macroCode}
                        </td>
                        <td className="py-2.5 px-3" colSpan={2}>
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="flex items-center gap-2.5 text-left w-full group focus:outline-none"
                          >
                            <span className="p-0.5 rounded text-slate-400 group-hover:text-amber-400 transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </span>
                            <span className="font-black tracking-tight text-white group-hover:text-sky-300 transition-colors uppercase text-xs sm:text-[13px]">
                              {section.nome}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-normal">
                              {section.itens.length} {section.itens.length === 1 ? 'item' : 'itens'}
                            </span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">—</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-100 font-bold tabular-nums">
                          R$ {formatNumberBR(macroCustoTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-sky-400 tabular-nums">
                          {macroBdi.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-sky-400 font-black tabular-nums">
                          R$ {formatNumberBR(macroPrecoTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">—</td>
                        <td className="py-2.5 px-3 text-center">
                          {editModeEnabled && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (groupingMode === 'etapas') {
                                  handleOpenAddItem(
                                    section.nome,
                                    undefined,
                                    selectedAmbienteFilter !== 'todos' ? selectedAmbienteFilter : undefined
                                  );
                                } else {
                                  handleOpenAddItem(
                                    selectedGroupFilter !== 'todos' ? selectedGroupFilter : undefined,
                                    undefined,
                                    section.id
                                  );
                                }
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-colors text-[11px] font-semibold"
                              title={`Adicionar item em ${section.nome}`}
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span className="hidden sm:inline">Adicionar</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* SUB-ITENS / NÍVEL 2 (ANALÍTICA) */}
                      {isExpanded &&
                        section.itens.map((item, itemIdx) => {
                          const itemCode = `${sIdx + 1}.${itemIdx + 1}`;
                          const isSelected = selectedInspectorItem?.id === item.id;
                          const roomName =
                            project.ambientes.find((a) => a.id === item.ambienteId)?.nome || 'Geral';
                          const precoUnitVenda = item.precoUnitario * (1 + contingencyPercent / 100);
                          const precoTotVenda = item.precoTotal * (1 + contingencyPercent / 100);

                          return (
                            <tr
                              key={item.id}
                              onClick={() => {
                                setSelectedInspectorItem(item);
                                setSelectedItemCode(itemCode);
                              }}
                              className={`cursor-pointer transition-colors group ${
                                isSelected
                                  ? 'bg-sky-500/15 border-y border-sky-500/40 text-white'
                                  : 'hover:bg-slate-800/40 text-slate-300'
                              }`}
                            >
                              {/* Código do Item */}
                              <td className="py-2 px-3 text-center font-mono text-slate-400 font-semibold group-hover:text-white">
                                {itemCode}
                              </td>

                              {/* Descrição do Insumo / Fabricante */}
                              <td className="py-2 px-3">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
                                    {item.materialNome}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                                    {item.fabricante && (
                                      <span className="text-amber-400/90 font-medium">
                                        Fab: {item.fabricante}
                                      </span>
                                    )}
                                    {item.lojaReferencia && (
                                      <span>• Ref: {item.lojaReferencia}</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Ambiente */}
                              <td className="py-2 px-3">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 truncate max-w-[120px]">
                                  {roomName}
                                </span>
                              </td>

                              {/* Qtde */}
                              <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-200">
                                {formatNumberBR(item.quantidadeComPerda)}
                              </td>

                              {/* Unidade */}
                              <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                                {item.unidade}
                              </td>

                              {/* Custo Unitário */}
                              <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300">
                                {formatNumberBR(item.precoUnitario)}
                              </td>

                              {/* Custo Total */}
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-100">
                                {formatNumberBR(item.precoTotal)}
                              </td>

                              {/* BDI % */}
                              <td className="py-2 px-3 text-center font-mono text-slate-400 tabular-nums">
                                {contingencyPercent.toFixed(1)}%
                              </td>

                              {/* Preço Unitário Venda */}
                              <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400">
                                {formatNumberBR(precoUnitVenda)}
                              </td>

                              {/* Preço Total Venda */}
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-sky-400">
                                {formatNumberBR(precoTotVenda)}
                              </td>

                              {/* Status Compra Pill */}
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleItemComprado(item.id, !!item.comprado);
                                  }}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-transform active:scale-95 ${
                                    item.comprado
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                  }`}
                                  title="Clique para alternar status de compra"
                                >
                                  {item.comprado ? 'Comprado' : 'Planejado'}
                                </button>
                              </td>

                              {/* Ações */}
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {editModeEnabled && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditItem(item);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                                        title="Editar item"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteItem(item.id);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                                        title="Excluir item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {/* Linha inline de inclusão rápida ao final da etapa expandida */}
                      {editModeEnabled && isExpanded && (
                        <tr className="bg-[#090e1c]/70 border-b border-slate-800/80">
                          <td colSpan={12} className="py-2 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (groupingMode === 'etapas') {
                                  handleOpenAddItem(
                                    section.nome,
                                    undefined,
                                    selectedAmbienteFilter !== 'todos' ? selectedAmbienteFilter : undefined
                                  );
                                } else {
                                  handleOpenAddItem(
                                    selectedGroupFilter !== 'todos' ? selectedGroupFilter : undefined,
                                    undefined,
                                    section.id
                                  );
                                }
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 py-1.5 px-3 rounded-lg hover:bg-sky-500/10 transition-colors border border-dashed border-sky-500/30 hover:border-sky-500/60"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>+ Incluir insumo em {section.nome}</span>
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAINEL INSPETOR LATERAL (Slide-over da Opção 2) */}
        {selectedInspectorItem && (
          <WbsItemInspector
            item={selectedInspectorItem}
            itemCode={selectedItemCode}
            ambienteNome={
              project.ambientes.find((a) => a.id === selectedInspectorItem.ambienteId)?.nome || 'Geral'
            }
            bdiPercent={contingencyPercent}
            onClose={() => setSelectedInspectorItem(null)}
            onToggleComprado={handleToggleItemComprado}
            onEditItem={(it) => {
              handleOpenEditItem(it);
            }}
            onAddItemInStage={(classe, categoria, ambienteId) => {
              handleOpenAddItem(classe, categoria, ambienteId);
            }}
          />
        )}
      </div>

      {/* 4. STICKY FOOTER SUMMARY DOCK (Barra de Rodapé Executiva da Opção 1) */}
      <footer className="h-14 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 px-4 flex items-center justify-between absolute bottom-0 left-0 right-0 z-30 select-none shadow-2xl">
        {/* Esquerda: Ações Rápidas de Inclusão */}
        <div className="flex items-center gap-2">
          {editModeEnabled && (
            <>
              <button
                onClick={() =>
                  handleOpenAddItem(
                    selectedGroupFilter !== 'todos' ? selectedGroupFilter : undefined,
                    undefined,
                    selectedAmbienteFilter !== 'todos' ? selectedAmbienteFilter : undefined
                  )
                }
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Inserir Etapa / Item</span>
              </button>

              <button
                onClick={onOpenCatalog}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Do Catálogo</span>
              </button>
            </>
          )}
        </div>

        {/* Direita: Resumo Executivo Consolidado */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider hidden lg:block font-bold">
            Resumo da Obra:
          </div>

          {/* Custo Total Direto */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Custo Total:</span>
            <strong className="text-white font-mono text-sm sm:text-base font-extrabold tabular-nums">
              {formatCurrencyBR(rawTotalActive)}
            </strong>
          </div>

          {/* BDI Global Editável Inline */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400">BDI:</span>
            {isEditingBdi ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={tempBdi}
                  onChange={(e) => setTempBdi(e.target.value)}
                  className="w-14 bg-slate-950 border border-sky-400 rounded px-1 text-xs font-mono text-white text-center outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveBdi}
                  className="p-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                  title="Salvar BDI"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsEditingBdi(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                  title="Cancelar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempBdi(String(contingencyPercent));
                  setIsEditingBdi(true);
                }}
                className="flex items-center gap-1 font-mono font-bold text-sky-400 hover:underline"
                title="Clique para editar taxa de BDI"
              >
                <span>{contingencyPercent.toFixed(1)}%</span>
                <span className="text-[10px]">📝</span>
              </button>
            )}
          </div>

          {/* Preço Global da Proposta */}
          <div className="flex items-baseline gap-1.5 bg-emerald-950/20 px-3 py-1 rounded-lg border border-emerald-800/40">
            <span className="text-[11px] text-emerald-400/90 font-medium">Preço Venda:</span>
            <strong className="text-emerald-400 font-mono text-sm sm:text-base font-black tabular-nums">
              {formatCurrencyBR(globalProjectBudget)}
            </strong>
          </div>
        </div>
      </footer>

      {/* Modal de Criação / Edição de Item */}
      <ProjectItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        mode={itemModalMode}
        itemToEdit={itemToEdit}
        initialData={itemToEdit}
        ambientes={project.ambientes}
        taxonomia={taxonomia}
        materials={materials}
        preselectedClasse={preselectedGroupForNewItem}
        preselectedGroup={preselectedGroupForNewItem}
        preselectedCategoria={preselectedCategoryForNewItem}
        preselectedCategory={preselectedCategoryForNewItem}
        preselectedAmbienteId={preselectedAmbienteForNewItem}
        onSave={handleSaveItem}
      />
    </div>
  );
};
