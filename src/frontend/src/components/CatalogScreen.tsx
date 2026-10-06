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
  Eye,
  LayoutGrid,
  List,
  Sparkles,
  Barcode,
  Package,
  SlidersHorizontal,
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
  // Visual técnico por padrão: tabela densa de engenharia
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
        return new Date(b.atualizadoEm || 0).getTime() - new Date(a.atualizadoEm || 0).getTime();
      });
  }, [materials, search, selectedClasse, selectedLoja, sortBy]);

  return (
    <div className="space-y-4 pb-20">
      {/* Barra de Ferramentas Técnica Integrada (Engineering Toolbar) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Busca com contagem inline */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar insumo por especificação, marca, modelo, SKU ou código de barras..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-16 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400/80 transition-colors font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            {/* Seletor de Modo: Tabela Técnica vs Grade */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tabela técnica tabular (alta densidade)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela Técnica</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualização em grade"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grade</span>
              </button>
            </div>

            {/* Captura de Etiqueta com IA */}
            <button
              onClick={onOpenCapture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Capturar Etiqueta</span>
            </button>
          </div>
        </div>

        {/* Filtros em Linha: Grupos / Classes, Lojas, Ordenação e Métricas */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80 text-xs">
          {/* Seletor de Grupo/Classe */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <button
              onClick={() => setSelectedClasse('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedClasse === 'all'
                  ? 'bg-slate-700/80 text-amber-300 border border-amber-400/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Todos ({materials.length})
            </button>
            {taxonomia.map((c) => {
              const count = materials.filter((m) => m.classe === c.nome).length;
              if (count === 0 && selectedClasse !== c.nome) return null;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClasse(c.nome)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedClasse === c.nome
                      ? 'bg-slate-700/80 text-amber-300 border border-amber-400/30'
                      : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {c.nome} <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Filtros Secundários de Loja e Ordenação */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Loja */}
            <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-slate-300">
              <Store className="w-3 h-3 text-slate-400 mr-1.5 flex-shrink-0" />
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

            {/* Ordenação */}
            <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-slate-300">
              <ArrowUpDown className="w-3 h-3 text-slate-400 mr-1.5 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
              >
                <option value="recent" className="bg-slate-900">Recentes</option>
                <option value="price_asc" className="bg-slate-900">Menor Preço</option>
                <option value="price_desc" className="bg-slate-900">Maior Preço</option>
                <option value="name" className="bg-slate-900">Alfabética</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-500 font-mono pl-1 hidden lg:inline">
              {filteredMaterials.length} itens
            </span>
          </div>
        </div>
      </div>

      {/* Exibição dos Dados: Tabela Técnica ou Grade */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum insumo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não encontramos itens com os filtros atuais. Limpe a busca ou registre uma nova etiqueta de loja.
          </p>
          <button
            onClick={onOpenCapture}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 mt-2"
          >
            <Camera className="w-3.5 h-3.5" />
            Fotografar Etiqueta Agora
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* VISUAL TÉCNICO DE ENGENHARIA (TABULAR COMPACTO) */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Versão Desktop / Tablet em Tabela Densa */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-slate-800 tracking-wider uppercase">
                  <th className="py-2.5 px-3 w-10 text-center">Ref</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Insumo / Especificação Técnica</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Fabricante</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Grupo & Categoria</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Loja Atual</th>
                  <th className="py-2.5 px-3 text-right min-w-[110px]">Preço Unit.</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Embalagem</th>
                  <th className="py-2.5 px-3 text-center min-w-[70px]">Cotações</th>
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {filteredMaterials.map((mat, idx) => {
                  const quotationsCount = (mat.historicoPrecos || []).length;

                  return (
                    <tr
                      key={mat.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Miniatura Técnica ou Índice */}
                      <td className="py-2 px-3 text-center align-middle">
                        {mat.fotoPrincipal ? (
                          <button
                            onClick={() => onSelectMaterial(mat)}
                            className="w-8 h-8 rounded border border-slate-700/80 overflow-hidden bg-slate-950 block mx-auto hover:border-amber-400 transition-colors"
                            title="Ver foto da etiqueta"
                          >
                            <img
                              src={mat.fotoPrincipal}
                              alt={mat.nome}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                        )}
                      </td>

                      {/* Especificação do Insumo */}
                      <td className="py-2 px-3 align-middle">
                        <button
                          onClick={() => onSelectMaterial(mat)}
                          className="text-left group-hover:text-amber-300 font-bold text-slate-100 transition-colors line-clamp-1 block text-xs"
                          title={mat.modelo || mat.nome}
                        >
                          {mat.modelo || mat.nome}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                          {mat.codigoBarras && (
                            <span className="flex items-center gap-1 bg-slate-950 px-1 rounded border border-slate-800 text-slate-400">
                              <Barcode className="w-2.5 h-2.5" />
                              {mat.codigoBarras}
                            </span>
                          )}
                          <span>{mat.tipo}</span>
                        </div>
                      </td>

                      {/* Fabricante */}
                      <td className="py-2 px-3 align-middle">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-400/90 font-mono text-[10px] font-semibold uppercase tracking-wider border border-slate-700/60">
                          {mat.fabricante || '—'}
                        </span>
                      </td>

                      {/* Grupo & Categoria */}
                      <td className="py-2 px-3 align-middle text-[11px] text-slate-300">
                        <div className="truncate max-w-[170px]" title={`${mat.classe} › ${mat.categoria}`}>
                          <span className="text-slate-400">{mat.classe}</span>
                          <span className="text-slate-500 mx-1">›</span>
                          <span className="font-medium text-slate-200">{mat.categoria}</span>
                        </div>
                      </td>

                      {/* Loja */}
                      <td className="py-2 px-3 align-middle text-slate-300 text-[11px]">
                        <span className="truncate block max-w-[130px]" title={mat.lojaAtual}>
                          {mat.lojaAtual}
                        </span>
                      </td>

                      {/* Preço Unitário */}
                      <td className="py-2 px-3 text-right align-middle">
                        <span className="font-mono font-bold text-emerald-400 text-xs tabular-nums">
                          R$ {mat.precoAtual.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-mono">
                          /{mat.unidade}
                        </span>
                      </td>

                      {/* Fator de Embalagem */}
                      <td className="py-2 px-3 align-middle text-[11px] font-mono text-slate-300">
                        {mat.precoPorEmbalagem ? (
                          <div>
                            <span className="text-slate-200">R$ {mat.precoPorEmbalagem.toFixed(2)}</span>
                            {mat.coberturaPorEmbalagem && (
                              <span className="text-slate-500 text-[10px] block">
                                {mat.coberturaPorEmbalagem} {mat.unidade}/cx
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Granel / Unit.</span>
                        )}
                      </td>

                      {/* Cotações */}
                      <td className="py-2 px-3 text-center align-middle">
                        {quotationsCount > 1 ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30"
                            title={`${quotationsCount} cotações salvas em lojas diferentes`}
                          >
                            <History className="w-2.5 h-2.5" />
                            {quotationsCount}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">1</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-2 px-3 text-right align-middle whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => onSelectMaterial(mat)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                          title="Ver ficha técnica completa e histórico"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => onOpenAddToProject(mat)}
                          className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition-colors inline-flex items-center gap-1 active:scale-95"
                          title="Inserir no detalhamento da obra"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+ Orçar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM GRADE TÉCNICA COMPACTA (MENOS CARDS PINTEREST, MAIS FICHA COMPACTA) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMaterials.map((mat) => {
            const hasMultipleQuotations = (mat.historicoPrecos || []).length > 1;

            return (
              <div
                key={mat.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between group space-y-2.5"
              >
                {/* Header compacto do item */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 uppercase tracking-wider font-mono">
                        {mat.fabricante}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mat.classe}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectMaterial(mat)}
                      className="text-left font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-300 transition-colors mt-1 line-clamp-2 block"
                    >
                      {mat.modelo || mat.nome}
                    </button>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {mat.lojaAtual} {mat.codigoBarras && `• SKU: ${mat.codigoBarras}`}
                    </p>
                  </div>

                  {/* Thumbnail compacto lateral se houver foto */}
                  {mat.fotoPrincipal && (
                    <button
                      onClick={() => onSelectMaterial(mat)}
                      className="w-12 h-12 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 flex-shrink-0"
                    >
                      <img
                        src={mat.fotoPrincipal}
                        alt={mat.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                  )}
                </div>

                {/* Linha de Preços e Ações */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
                        R$ {mat.precoAtual.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">/{mat.unidade}</span>
                    </div>
                    {mat.precoPorEmbalagem && (
                      <p className="text-[10px] text-slate-500 font-mono">
                        R$ {mat.precoPorEmbalagem.toFixed(2)} cx
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasMultipleQuotations && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {mat.historicoPrecos.length} cot.
                      </span>
                    )}
                    <button
                      onClick={() => onOpenAddToProject(mat)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 active:scale-95"
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
      )}
    </div>
  );
};
