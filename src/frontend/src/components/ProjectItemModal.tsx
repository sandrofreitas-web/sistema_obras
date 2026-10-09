import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Calculator,
  Search,
  Building,
  Layers,
  Tag,
  AlertCircle,
  Package,
  Sparkles,
  Percent,
  Store,
  MapPin,
  Plus,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { Material, TaxonomiaClasse, Ambiente, ItemProjeto, UnidadeMedida } from '../types';

interface ProjectItemModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  itemToEdit?: ItemProjeto | null;
  initialData?: ItemProjeto | null;
  preselectedClasse?: string;
  preselectedGroup?: string;
  preselectedCategoria?: string;
  preselectedCategory?: string;
  preselectedAmbienteId?: string;
  materials: Material[];
  taxonomia: TaxonomiaClasse[];
  ambientes: Ambiente[];
  onClose: () => void;
  onSave: (itemData: {
    id?: string;
    materialId: string;
    materialNome: string;
    fabricante: string;
    classe: string;
    categoria: string;
    tipo: string;
    unidade: UnidadeMedida | string;
    quantidadeBase: number;
    perdaTecnicaPercent: number;
    quantidadeComPerda: number;
    precoUnitario: number;
    precoTotal: number;
    ambienteId: string;
    lojaReferencia?: string;
    observacoes?: string;
    comprado?: boolean;
  }) => void;
}

const UNIDADES_COMUNS: UnidadeMedida[] = [
  'm²',
  'un',
  'cx',
  'kg',
  'saco',
  'm',
  'litro',
  'rolo',
  'par',
  'lata',
  'peça',
];

export const ProjectItemModal: React.FC<ProjectItemModalProps> = ({
  isOpen,
  mode,
  itemToEdit,
  initialData,
  preselectedClasse,
  preselectedGroup,
  preselectedCategoria,
  preselectedCategory,
  preselectedAmbienteId,
  materials,
  taxonomia,
  ambientes,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const editingItem = itemToEdit || initialData;

  // Search inside materials catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('todas');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Form Fields
  const [materialNome, setMaterialNome] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [classe, setClasse] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('');
  const [unidade, setUnidade] = useState<string>('un');
  const [ambienteId, setAmbienteId] = useState<string>('');
  const [quantidadeBase, setQuantidadeBase] = useState<number>(1);
  const [perdaPercent, setPerdaPercent] = useState<number>(5);
  const [precoUnitario, setPrecoUnitario] = useState<number>(0);
  const [lojaReferencia, setLojaReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [comprado, setComprado] = useState(false);

  // Initialize data depending on mode and pre-selected context
  useEffect(() => {
    if (mode === 'edit' && editingItem) {
      setSelectedMaterialId(editingItem.materialId || '');
      setMaterialNome(editingItem.materialNome);
      setFabricante(editingItem.fabricante || '');
      setClasse(editingItem.classe);
      setCategoria(editingItem.categoria);
      setTipo(editingItem.tipo || '');
      setUnidade(editingItem.unidade);
      setAmbienteId(editingItem.ambienteId);
      setQuantidadeBase(editingItem.quantidadeBase);
      setPerdaPercent(editingItem.perdaTecnicaPercent);
      setPrecoUnitario(editingItem.precoUnitario);
      setLojaReferencia(editingItem.lojaReferencia || '');
      setObservacoes(editingItem.observacoes || '');
      setComprado(!!editingItem.comprado);
      setIsCustomMode(true);
    } else {
      // Create mode: herda estritamente Grupo, Categoria e Ambiente do acionamento
      const targetClasse =
        preselectedClasse ||
        preselectedGroup ||
        (taxonomia[0]?.nome || 'Revestimento');

      const foundTaxClass = taxonomia.find(
        (t) => t.nome.toLowerCase() === targetClasse.toLowerCase()
      ) || taxonomia[0];

      const resolvedClasse = foundTaxClass ? foundTaxClass.nome : targetClasse;

      const targetCat =
        preselectedCategoria ||
        preselectedCategory ||
        foundTaxClass?.categorias[0]?.nome ||
        '';

      const targetAmbiente =
        preselectedAmbienteId && ambientes.some((a) => a.id === preselectedAmbienteId)
          ? preselectedAmbienteId
          : ambientes[0]?.id || 'geral';

      const targetTipo =
        foundTaxClass?.categorias.find((c) => c.nome === targetCat)?.tipos[0]?.nome || '';

      setSelectedMaterialId('');
      setMaterialNome('');
      setFabricante('');
      setClasse(resolvedClasse);
      setCategoria(targetCat);
      setTipo(targetTipo);
      setUnidade('un');
      setAmbienteId(targetAmbiente);
      setQuantidadeBase(1);
      setPerdaPercent(resolvedClasse.toLowerCase().includes('revest') ? 10 : 5);
      setPrecoUnitario(0);
      setLojaReferencia('');
      setObservacoes('');
      setComprado(false);
      setCatalogSearch('');
      setActiveCategoryFilter(targetCat ? targetCat : 'todas');
      setIsCustomMode(false);
    }
  }, [
    mode,
    editingItem,
    preselectedClasse,
    preselectedGroup,
    preselectedCategoria,
    preselectedCategory,
    preselectedAmbienteId,
    taxonomia,
    ambientes,
    isOpen,
  ]);

  // Available categories for selected classe
  const availableCategorias = useMemo(() => {
    const foundClass = taxonomia.find(
      (t) => t.nome.toLowerCase() === classe.toLowerCase()
    );
    return foundClass ? foundClass.categorias : [];
  }, [taxonomia, classe]);

  // Materiais CADASTRADOS que pertencem a este grupo (classe)
  const registeredGroupMaterials = useMemo(() => {
    if (!classe) return [];
    return materials.filter(
      (m) => m.classe.toLowerCase().trim() === classe.toLowerCase().trim()
    );
  }, [materials, classe]);

  // Materiais filtrados da lista do grupo (por busca e/ou categoria do grupo)
  const displayedGroupMaterials = useMemo(() => {
    return registeredGroupMaterials.filter((m) => {
      // Filtro de categoria selecionada
      if (activeCategoryFilter !== 'todas' && m.categoria !== activeCategoryFilter) {
        return false;
      }
      // Filtro de busca textual
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const matchesName = m.nome.toLowerCase().includes(q);
        const matchesFab = m.fabricante.toLowerCase().includes(q);
        const matchesMod = (m.modelo || '').toLowerCase().includes(q);
        const matchesCat = m.categoria.toLowerCase().includes(q);
        return matchesName || matchesFab || matchesMod || matchesCat;
      }
      return true;
    });
  }, [registeredGroupMaterials, activeCategoryFilter, catalogSearch]);

  // Handle selecting a material from catalog
  const handleSelectCatalogMaterial = (mat: Material) => {
    setSelectedMaterialId(mat.id);
    setMaterialNome(mat.nome);
    setFabricante(mat.fabricante);
    setClasse(mat.classe);
    setCategoria(mat.categoria);
    setTipo(mat.tipo);
    setUnidade(mat.unidade);
    setPrecoUnitario(mat.precoAtual);
    setLojaReferencia(mat.lojaAtual || '');

    // Sugestão de perda técnica por tipo de material
    const isRevest =
      mat.classe.toLowerCase().includes('revest') ||
      mat.categoria.toLowerCase().includes('piso') ||
      mat.categoria.toLowerCase().includes('azulejo');
    setPerdaPercent(isRevest ? 10 : 5);

    // Auto-preenchimento de quantidade se for m² e o ambiente tiver área calculada
    const selectedAmb = ambientes.find((a) => a.id === ambienteId);
    if (mat.unidade === 'm²' && selectedAmb && selectedAmb.areaPisoM2 > 0) {
      setQuantidadeBase(selectedAmb.areaPisoM2);
    }
  };

  // Calculations
  const quantidadeComPerda = useMemo(() => {
    const base = Number(quantidadeBase) || 0;
    const loss = Number(perdaPercent) || 0;
    return Math.round(base * (1 + loss / 100) * 100) / 100;
  }, [quantidadeBase, perdaPercent]);

  const precoTotal = useMemo(() => {
    const unitPrice = Number(precoUnitario) || 0;
    return Math.round(quantidadeComPerda * unitPrice * 100) / 100;
  }, [quantidadeComPerda, precoUnitario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!materialNome.trim()) {
      alert('Por favor, informe a descrição ou selecione um insumo da lista cadastrada.');
      return;
    }
    if (!ambienteId && ambientes.length > 0) {
      alert('Por favor, selecione um ambiente do projeto.');
      return;
    }
    if (quantidadeBase <= 0) {
      alert('A quantidade base deve ser maior que zero.');
      return;
    }

    onSave({
      id: mode === 'edit' && editingItem ? editingItem.id : undefined,
      materialId: selectedMaterialId || `mat-custom-${Date.now()}`,
      materialNome: materialNome.trim(),
      fabricante: fabricante.trim() || 'Genérico / Conforme Projeto',
      classe: classe || 'Geral',
      categoria: categoria || 'Geral',
      tipo: tipo || 'Padrão',
      unidade: unidade || 'un',
      quantidadeBase: Number(quantidadeBase),
      perdaTecnicaPercent: Number(perdaPercent),
      quantidadeComPerda,
      precoUnitario: Number(precoUnitario),
      precoTotal,
      ambienteId,
      lojaReferencia: lojaReferencia.trim(),
      observacoes: observacoes.trim(),
      comprado,
    });
  };

  const selectedAmbienteObj = ambientes.find((a) => a.id === ambienteId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl max-h-[94vh]">
        {/* Header com Contexto do Acionamento */}
        <div className="px-5 py-3.5 border-b border-slate-800/90 bg-[#0e1424] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20 flex-shrink-0">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  {mode === 'create' ? 'Incluir Insumo no Orçamento' : 'Alterar Insumo do Orçamento'}
                </h2>
                {/* Badges de Contexto do Acionamento */}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Etapa: {classe}
                </span>
                {selectedAmbienteObj && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Ambiente: {selectedAmbienteObj.nome}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {mode === 'create'
                  ? `Selecione um insumo cadastrado em "${classe}" ou especifique um novo item sob medida.`
                  : `Editando insumo: ${editingItem?.materialNome}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* SEÇÃO 1: LISTA CADASTRADA DO GRUPO ACIONADO (Disponível em create mode) */}
          {mode === 'create' && (
            <div className="bg-[#070b14] border border-slate-800/90 rounded-xl p-3.5 space-y-3 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Insumos Cadastrados em {classe}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                    {registeredGroupMaterials.length} {registeredGroupMaterials.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Alternância para Modo Sob Medida */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(!isCustomMode);
                    if (!isCustomMode) {
                      setSelectedMaterialId('');
                    }
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    isCustomMode
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {isCustomMode ? '✓ Digitação Manual Ativa' : '+ Criar Item Sob Medida (Sem Selecionar da Lista)'}
                </button>
              </div>

              {!isCustomMode && (
                <>
                  {/* Filtro por Subcategoria e Campo de Busca dentro do Grupo */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    {/* Campo de Busca Rápida no Grupo */}
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder={`Buscar em ${classe} (ex: marca, modelo, tipo)...`}
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="w-full bg-[#0c1220] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filtros em Pills das Subcategorias */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryFilter('todas')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                          activeCategoryFilter === 'todas'
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        Todas ({registeredGroupMaterials.length})
                      </button>
                      {availableCategorias.map((cat) => {
                        const countInCat = registeredGroupMaterials.filter(
                          (m) => m.categoria === cat.nome
                        ).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategoryFilter(cat.nome)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                              activeCategoryFilter === cat.nome
                                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {cat.nome} ({countInCat})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lista de Insumos do Grupo para Seleção com 1 Toque */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                    {displayedGroupMaterials.length === 0 ? (
                      <div className="py-6 px-4 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-2">
                        <Package className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="font-medium text-xs">
                          {registeredGroupMaterials.length === 0
                            ? `Nenhum insumo pré-cadastrado no catálogo em "${classe}".`
                            : `Nenhum insumo encontrado para o filtro atual.`}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Preencha a especificação nos campos abaixo para incluir este item no orçamento.
                        </p>
                      </div>
                    ) : (
                      displayedGroupMaterials.map((mat) => {
                        const isSelected = selectedMaterialId === mat.id;
                        return (
                          <div
                            key={mat.id}
                            onClick={() => handleSelectCatalogMaterial(mat)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/30'
                                : 'bg-[#0b101c] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-extrabold text-white text-xs truncate">
                                  {mat.nome}
                                </span>
                                {isSelected && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-900/50 px-1.5 py-0.2 rounded font-mono">
                                    <Check className="w-3 h-3 stroke-[3]" /> Selecionado
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                                <span className="text-amber-400 font-semibold">
                                  {mat.fabricante}
                                </span>
                                <span>• {mat.categoria}</span>
                                {mat.lojaAtual && (
                                  <span className="truncate max-w-[140px] text-slate-400">
                                    • Ref: {mat.lojaAtual}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Preço e Botão de Ação */}
                            <div className="text-right flex items-center gap-3 flex-shrink-0">
                              <div>
                                <strong className="text-xs font-black text-emerald-400 font-mono block tabular-nums">
                                  R$ {mat.precoAtual.toFixed(2)}
                                </strong>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  por {mat.unidade}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCatalogMaterial(mat);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-sky-400 text-slate-950'
                                    : 'bg-slate-800 text-slate-200 hover:bg-amber-400 hover:text-slate-950'
                                }`}
                              >
                                {isSelected ? 'Escolhido' : 'Escolher'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* SEÇÃO 2: FORMULÁRIO DE ESPECIFICAÇÃO TÉCNICA E QUANTIFICAÇÃO */}
          <div className="space-y-3.5 bg-[#0e1424] p-3.5 sm:p-4 rounded-xl border border-slate-800">
            {/* Linha 1: Descrição e Fabricante */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Descrição do Insumo / Composição *
                </label>
                <input
                  type="text"
                  required
                  value={materialNome}
                  onChange={(e) => setMaterialNome(e.target.value)}
                  placeholder="Ex: Porcelanato Retificado 60x60 White Polido"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Fabricante / Marca
                </label>
                <input
                  type="text"
                  value={fabricante}
                  onChange={(e) => setFabricante(e.target.value)}
                  placeholder="Ex: Portobello / Tigre"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Linha 2: Grupo (Classe), Categoria e Ambiente (Herança Automática) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Grupo de Material (Etapa WBS) *
                </label>
                <select
                  value={classe}
                  onChange={(e) => {
                    const newClasse = e.target.value;
                    setClasse(newClasse);
                    const foundClass = taxonomia.find((t) => t.nome === newClasse);
                    if (foundClass && foundClass.categorias[0]) {
                      setCategoria(foundClass.categorias[0].nome);
                      setTipo(foundClass.categorias[0].tipos[0]?.nome || '');
                      setActiveCategoryFilter('todas');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-400 font-bold outline-none focus:border-amber-400"
                >
                  {taxonomia.map((tax) => (
                    <option key={tax.id} value={tax.nome}>
                      {tax.nome}
                    </option>
                  ))}
                  {!taxonomia.some((t) => t.nome === classe) && (
                    <option value={classe}>{classe}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategoria(newCat);
                    const foundCat = availableCategorias.find((c) => c.nome === newCat);
                    if (foundCat && foundCat.tipos[0]) {
                      setTipo(foundCat.tipos[0].nome);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-400"
                >
                  {availableCategorias.map((cat) => (
                    <option key={cat.id} value={cat.nome}>
                      {cat.nome}
                    </option>
                  ))}
                  {categoria && !availableCategorias.some((c) => c.nome === categoria) && (
                    <option value={categoria}>{categoria}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ambiente de Aplicação *
                </label>
                <select
                  value={ambienteId}
                  onChange={(e) => {
                    const ambId = e.target.value;
                    setAmbienteId(ambId);
                    const amb = ambientes.find((a) => a.id === ambId);
                    if (amb && unidade === 'm²' && amb.areaPisoM2 > 0) {
                      setQuantidadeBase(amb.areaPisoM2);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-sky-300 font-bold outline-none focus:border-amber-400"
                >
                  {ambientes.length === 0 && (
                    <option value="geral">Área Geral / Comum</option>
                  )}
                  {ambientes.map((amb) => (
                    <option key={amb.id} value={amb.id}>
                      {amb.nome} {amb.areaPisoM2 > 0 ? `(${amb.areaPisoM2} m² piso)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 3: Quantitativo, Unidade, Perda Técnica e Preço Unitário */}
            <div className="bg-[#080d19] border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  Cálculo de Quantitativo e Perda Técnica
                </span>
                <span className="text-amber-400 font-mono">
                  Qtd Final = Base × (1 + Perda%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Quantidade Base */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Qtd Base *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={quantidadeBase}
                    onChange={(e) => setQuantidadeBase(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 font-mono tabular-nums"
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Unidade *
                  </label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 font-mono"
                  >
                    {UNIDADES_COMUNS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Perda Técnica % */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-amber-400">
                      Perda Técnica %
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={perdaPercent}
                      onChange={(e) => setPerdaPercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 font-mono"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                {/* Preço Unitário */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 outline-none focus:border-amber-400 font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Resultado Consolidado em Destaque */}
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">QTD FINAL COM PERDA (+{perdaPercent}%):</span>
                    <strong className="text-sm font-bold text-white font-mono tabular-nums">
                      {quantidadeComPerda} {unidade}
                    </strong>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-400/20">
                  <span className="text-[10px] text-slate-400 block font-mono">CUSTO TOTAL DO INSUMO:</span>
                  <strong className="text-base sm:text-lg font-black text-amber-300 font-mono tabular-nums">
                    R$ {precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>

            {/* Linha 4: Loja de Referência & Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Loja Referência / Cotação
                </label>
                <input
                  type="text"
                  value={lojaReferencia}
                  onChange={(e) => setLojaReferencia(e.target.value)}
                  placeholder="Ex: Obramax / Leroy Merlin"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Observações Técnicas de Instalação / Aplicação
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Assentar com argamassa AC-III e junta 1,5mm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={comprado}
                onChange={(e) => setComprado(e.target.checked)}
                className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-300">
                Marcar como Já Comprado
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {mode === 'create'
                    ? `Incluir no Orçamento (R$ ${precoTotal.toFixed(2)})`
                    : 'Salvar Alterações'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
