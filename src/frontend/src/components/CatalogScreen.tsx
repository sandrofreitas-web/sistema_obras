import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Camera,
  Layers,
  Store,
  ArrowUpDown,
  History,
  PlusCircle,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import { Material, TaxonomiaClasse } from '../types';

interface CatalogScreenProps {
  materials: Material[];
  taxonomia: TaxonomiaClasse[];
  onOpenCapture: () => void;
  onSelectMaterial: (material: Material) => void;
  onOpenAddToProject: (material: Material) => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  materials,
  taxonomia,
  onOpenCapture,
  onSelectMaterial,
  onOpenAddToProject,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedLoja, setSelectedLoja] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'name'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Extract unique stores from current catalog
  const storeList = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.lojaAtual) set.add(m.lojaAtual);
      m.historicoPrecos?.forEach((h) => {
        if (h.loja) set.add(h.loja);
      });
    });
    return Array.from(set);
  }, [materials]);

  // Filtered & sorted materials
  const filteredMaterials = useMemo(() => {
    return materials
      .filter((mat) => {
        // Search
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          mat.nome.toLowerCase().includes(query) ||
          mat.fabricante.toLowerCase().includes(query) ||
          mat.modelo.toLowerCase().includes(query) ||
          (mat.codigoBarras && mat.codigoBarras.includes(query)) ||
          mat.lojaAtual.toLowerCase().includes(query);

        // Class filter
        const matchesClasse = selectedClasse === 'all' || mat.classe === selectedClasse;

        // Store filter
        const matchesLoja =
          selectedLoja === 'all' ||
          mat.lojaAtual === selectedLoja ||
          mat.historicoPrecos?.some((h) => h.loja === selectedLoja);

        return matchesSearch && matchesClasse && matchesLoja;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.precoAtual - b.precoAtual;
        if (sortBy === 'price_desc') return b.precoAtual - a.precoAtual;
        if (sortBy === 'name') return a.nome.localeCompare(b.nome);
        // default: most recently updated
        return new Date(b.atualizadoEm || 0).getTime() - new Date(a.atualizadoEm || 0).getTime();
      });
  }, [materials, search, selectedClasse, selectedLoja, sortBy]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por produto, marca (Portobello, Tigre, Suvinil), código de barras..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:border-amber-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Capture Button */}
          <button
            onClick={onOpenCapture}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex-shrink-0"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Fotografar Etiqueta</span>
          </button>
        </div>

        {/* Filters Row: Class Pills, Store Selector, Sort By */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Class pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              onClick={() => setSelectedClasse('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedClasse === 'all'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos ({materials.length})
            </button>
            {taxonomia.map((c) => {
              const count = materials.filter((m) => m.classe === c.nome).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClasse(c.nome)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedClasse === c.nome
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.nome} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {/* Controls: Store & Sorting */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Store filter */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <Store className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={selectedLoja}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Todas as Lojas</option>
                {storeList.map((st) => (
                  <option key={st} value={st} className="bg-slate-900">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
              >
                <option value="recent" className="bg-slate-900">Mais Recentes</option>
                <option value="price_asc" className="bg-slate-900">Menor Preço</option>
                <option value="price_desc" className="bg-slate-900">Maior Preço</option>
                <option value="name" className="bg-slate-900">Ordem Alfabética</option>
              </select>
            </div>

            {/* View mode toggle (Grid vs Table) */}
            <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grid' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Grade de cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'table' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Tabela de dados"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Materials List / Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum material encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não encontramos itens com os filtros atuais. Experimente limpar a busca ou fotografar uma nova etiqueta na loja!
          </p>
          <button
            onClick={onOpenCapture}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 mt-2"
          >
            <Camera className="w-4 h-4" />
            Fotografar Etiqueta Agora
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const hasMultipleQuotations = (mat.historicoPrecos || []).length > 1;

            return (
              <div
                key={mat.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image and Badges */}
                <div
                  onClick={() => onSelectMaterial(mat)}
                  className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden"
                >
                  {mat.fotoPrincipal ? (
                    <img
                      src={mat.fotoPrincipal}
                      alt={mat.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <Layers className="w-8 h-8 mb-1" />
                      <span className="text-[11px]">Sem foto</span>
                    </div>
                  )}

                  {/* Class & Category Badge */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 text-amber-400 backdrop-blur-sm border border-slate-700">
                      {mat.classe}
                    </span>
                  </div>

                  {/* Multiple Quotations Flag */}
                  {hasMultipleQuotations && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-900/90 text-blue-200 border border-blue-700 backdrop-blur-sm">
                      <History className="w-3 h-3" />
                      {mat.historicoPrecos.length} cotações
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div onClick={() => onSelectMaterial(mat)} className="cursor-pointer space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {mat.fabricante}
                    </span>
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {mat.modelo}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {mat.tipo} • {mat.lojaAtual}
                    </p>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-emerald-400">
                          R$ {mat.precoAtual.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400">/ {mat.unidade}</span>
                      </div>
                      {mat.precoPorEmbalagem && (
                        <p className="text-[10px] text-slate-400">
                          R$ {mat.precoPorEmbalagem.toFixed(2)} cx
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenAddToProject(mat)}
                      className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-slate-950 font-bold text-xs border border-amber-500/30 transition-all flex items-center gap-1 active:scale-95"
                      title="Adicionar ao projeto"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Orçar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60 font-semibold">
              <tr>
                <th className="py-3 px-4">Material / Modelo</th>
                <th className="py-3 px-4">Fabricante</th>
                <th className="py-3 px-4">Classe & Categoria</th>
                <th className="py-3 px-4">Loja Atual</th>
                <th className="py-3 px-4">Preço Unitário</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    <button
                      onClick={() => onSelectMaterial(mat)}
                      className="text-left hover:text-amber-400 transition-colors"
                    >
                      {mat.modelo}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{mat.fabricante}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {mat.classe} &rsaquo; {mat.categoria}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{mat.lojaAtual}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    R$ {mat.precoAtual.toFixed(2)} / {mat.unidade}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectMaterial(mat)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => onOpenAddToProject(mat)}
                      className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                    >
                      + Orçar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
