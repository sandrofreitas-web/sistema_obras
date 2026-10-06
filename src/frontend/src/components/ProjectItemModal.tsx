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
} from 'lucide-react';
import { Material, TaxonomiaClasse, Ambiente, ItemProjeto, UnidadeMedida } from '../types';

interface ProjectItemModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  itemToEdit?: ItemProjeto | null;
  preselectedClasse?: string;
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
  preselectedClasse,
  materials,
  taxonomia,
  ambientes,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  // Search inside materials catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  // Form Fields
  const [materialNome, setMaterialNome] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [classe, setClasse] = useState(preselectedClasse || taxonomia[0]?.nome || 'Revestimento');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('');
  const [unidade, setUnidade] = useState<string>('un');
  const [ambienteId, setAmbienteId] = useState<string>(ambientes[0]?.id || '');
  const [quantidadeBase, setQuantidadeBase] = useState<number>(1);
  const [perdaPercent, setPerdaPercent] = useState<number>(5);
  const [precoUnitario, setPrecoUnitario] = useState<number>(0);
  const [lojaReferencia, setLojaReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [comprado, setComprado] = useState(false);

  // Initialize data depending on mode
  useEffect(() => {
    if (mode === 'edit' && itemToEdit) {
      setSelectedMaterialId(itemToEdit.materialId || '');
      setMaterialNome(itemToEdit.materialNome);
      setFabricante(itemToEdit.fabricante || '');
      setClasse(itemToEdit.classe);
      setCategoria(itemToEdit.categoria);
      setTipo(itemToEdit.tipo || '');
      setUnidade(itemToEdit.unidade);
      setAmbienteId(itemToEdit.ambienteId);
      setQuantidadeBase(itemToEdit.quantidadeBase);
      setPerdaPercent(itemToEdit.perdaTecnicaPercent);
      setPrecoUnitario(itemToEdit.precoUnitario);
      setLojaReferencia(itemToEdit.lojaReferencia || '');
      setObservacoes(itemToEdit.observacoes || '');
      setComprado(!!itemToEdit.comprado);
    } else {
      // Create mode
      const defaultClasse = preselectedClasse || taxonomia[0]?.nome || 'Revestimento';
      const targetTaxClass = taxonomia.find((t) => t.nome === defaultClasse);
      const defaultCat = targetTaxClass?.categorias[0]?.nome || '';
      const defaultTipo = targetTaxClass?.categorias[0]?.tipos[0]?.nome || '';

      setSelectedMaterialId('');
      setMaterialNome('');
      setFabricante('');
      setClasse(defaultClasse);
      setCategoria(defaultCat);
      setTipo(defaultTipo);
      setUnidade('un');
      setAmbienteId(ambientes[0]?.id || '');
      setQuantidadeBase(1);
      setPerdaPercent(defaultClasse.toLowerCase().includes('revest') ? 10 : 5);
      setPrecoUnitario(0);
      setLojaReferencia('');
      setObservacoes('');
      setComprado(false);
      setCatalogSearch('');
    }
  }, [mode, itemToEdit, preselectedClasse, taxonomia, ambientes, isOpen]);

  // Available categories for selected classe
  const availableCategorias = useMemo(() => {
    const foundClass = taxonomia.find((t) => t.nome === classe);
    return foundClass ? foundClass.categorias : [];
  }, [taxonomia, classe]);

  // Filtered materials from catalog for quick selection
  const filteredCatalogMaterials = useMemo(() => {
    if (!catalogSearch.trim()) return materials.slice(0, 8);
    const q = catalogSearch.toLowerCase();
    return materials
      .filter(
        (m) =>
          m.nome.toLowerCase().includes(q) ||
          m.fabricante.toLowerCase().includes(q) ||
          m.modelo.toLowerCase().includes(q) ||
          m.classe.toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [materials, catalogSearch]);

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

    // Suggested technical loss
    const isRevest = mat.classe.toLowerCase().includes('revest') || mat.categoria.toLowerCase().includes('piso');
    setPerdaPercent(isRevest ? 10 : 5);

    // Auto-fill quantity if m² and environment selected
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
      alert('Por favor, informe a descrição ou nome do material.');
      return;
    }
    if (!ambienteId) {
      alert('Por favor, selecione um ambiente do projeto.');
      return;
    }
    if (quantidadeBase <= 0) {
      alert('A quantidade base deve ser maior que zero.');
      return;
    }

    onSave({
      id: mode === 'edit' && itemToEdit ? itemToEdit.id : undefined,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base sm:text-lg">
                {mode === 'create' ? 'Incluir Item no Orçamento' : 'Alterar Item do Orçamento'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'create'
                  ? 'Escolha da base de materiais ou cadastre uma especificação sob medida'
                  : `Editando: ${itemToEdit?.materialNome}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Quick Picker from Catalog (Only in Create mode or when searching) */}
          {mode === 'create' && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Preencher a partir da Base de Materiais
                </label>
                <span className="text-[11px] text-slate-400">
                  {materials.length} materiais cadastrados
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, marca ou categoria (ex: Porcelanato, Argamassa, Tubo, Celite)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
              </div>

              {/* Suggestions chips / list */}
              {catalogSearch.trim() && (
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-900">
                  {filteredCatalogMaterials.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Nenhum material encontrado com "{catalogSearch}". Você pode preencher os campos abaixo manualmente.
                    </div>
                  ) : (
                    filteredCatalogMaterials.map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => handleSelectCatalogMaterial(mat)}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between gap-3 hover:bg-slate-800/80 transition-colors ${
                          selectedMaterialId === mat.id ? 'bg-amber-400/10' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                              {mat.classe}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                              {mat.fabricante}
                            </span>
                          </div>
                          <p className="font-bold text-white truncate text-xs mt-0.5">{mat.nome}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-extrabold text-emerald-400 text-xs block">
                            R$ {mat.precoAtual.toFixed(2)} / {mat.unidade}
                          </span>
                          <span className="text-[10px] text-slate-400">{mat.lojaAtual}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Classification: Grupo (Classe) and Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Grupo do Material (Classe) *
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
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium outline-none focus:border-amber-400"
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
              <label className="block text-xs font-bold text-slate-300 mb-1">
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium outline-none focus:border-amber-400"
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
          </div>

          {/* Item Description and Manufacturer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Descrição do Material / Especificação *
              </label>
              <input
                type="text"
                required
                value={materialNome}
                onChange={(e) => setMaterialNome(e.target.value)}
                placeholder="Ex: Porcelanato Retificado 60x60 White Polido"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Fabricante / Marca
              </label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                placeholder="Ex: Portobello / Tigre"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Environment & Room selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium outline-none focus:border-amber-400"
              >
                {ambientes.map((amb) => (
                  <option key={amb.id} value={amb.id}>
                    {amb.nome} {amb.areaPisoM2 > 0 ? `(${amb.areaPisoM2} m² piso)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Loja de Referência / Cotação
              </label>
              <input
                type="text"
                value={lojaReferencia}
                onChange={(e) => setLojaReferencia(e.target.value)}
                placeholder="Ex: Leroy Merlin Interlagos / Obramax"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Quantitative & Pricing Block */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-3.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Quantitativo & Cálculo de Perda Técnica
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Quantidade Base */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Qtd Base *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quantidadeBase}
                  onChange={(e) => setQuantidadeBase(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Unidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Unidade *
                </label>
                <select
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-white outline-none focus:border-amber-400"
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
                  <label className="text-xs font-semibold text-amber-400">
                    Perda %
                  </label>
                  <span className="text-[10px] text-slate-400">margem</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={perdaPercent}
                    onChange={(e) => setPerdaPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-white outline-none focus:border-amber-400"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* Preço Unitário */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preço Unitário (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-emerald-400 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Quick Perda % Chips */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400">Atalhos de perda técnica:</span>
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPerdaPercent(pct)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    perdaPercent === pct
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>

            {/* Live Subtotal Callout */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-300">
                  Quantidade Final com Perda (+{perdaPercent}%):
                </span>
                <strong className="text-sm font-bold text-white block mt-0.5">
                  {quantidadeComPerda} {unidade}
                </strong>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-500/20">
                <span className="text-xs text-slate-300 block">Subtotal Calculado:</span>
                <strong className="text-lg sm:text-xl font-black text-amber-300">
                  R$ {precoTotal.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          {/* Status & Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Observações Técnicas / Aplicação
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Assentar com junta de 1,5mm e dupla colagem"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={comprado}
                  onChange={(e) => setComprado(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200">
                  Item Já Comprado?
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{mode === 'create' ? 'Incluir no Orçamento' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
