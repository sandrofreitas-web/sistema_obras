import React, { useState, useMemo } from 'react';
import {
  ListTree,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Tag,
  Building,
  Layers,
  Droplets,
  Zap,
  Bath,
  Hammer,
  Maximize2,
  Paintbrush,
  Trash,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Check,
  X,
} from 'lucide-react';
import { TaxonomiaClasse, TaxonomiaCategoria, TaxonomiaTipo } from '../types';
import { storageService } from '../services/storageService';
import { DEFAULT_TAXONOMIA } from '../data/initialData';

interface TaxonomyModalProps {
  taxonomia: TaxonomiaClasse[];
  onTaxonomiaUpdated: (newTax: TaxonomiaClasse[]) => void;
}

// Mapeamento de ícones por classe/grupo
const getGroupIcon = (classeNome: string) => {
  const norm = classeNome.toLowerCase();
  if (norm.includes('bruto') || norm.includes('estrutura')) return <Building className="w-4 h-4 text-amber-400" />;
  if (norm.includes('revestimento')) return <Layers className="w-4 h-4 text-emerald-400" />;
  if (norm.includes('hidr')) return <Droplets className="w-4 h-4 text-sky-400" />;
  if (norm.includes('elét') || norm.includes('elet')) return <Zap className="w-4 h-4 text-yellow-400" />;
  if (norm.includes('louça') || norm.includes('metal')) return <Bath className="w-4 h-4 text-cyan-400" />;
  if (norm.includes('marmor') || norm.includes('divisór')) return <Hammer className="w-4 h-4 text-stone-400" />;
  if (norm.includes('gesso') || norm.includes('forro') || norm.includes('drywall')) return <Maximize2 className="w-4 h-4 text-teal-400" />;
  if (norm.includes('pint')) return <Paintbrush className="w-4 h-4 text-rose-400" />;
  if (norm.includes('caçamb') || norm.includes('entulho') || norm.includes('serviço')) return <Trash className="w-4 h-4 text-orange-400" />;
  return <Tag className="w-4 h-4 text-slate-400" />;
};

export const TaxonomyModal: React.FC<TaxonomyModalProps> = ({
  taxonomia,
  onTaxonomiaUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('todos');
  
  // Controle de adição rápida inline
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [newCatName, setNewCatName] = useState('');
  
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Adição inline de tipo para uma categoria específica
  const [addingTypeFor, setAddingTypeFor] = useState<{ classId: string; catId: string } | null>(null);
  const [newTypeNameInput, setNewTypeNameInput] = useState('');

  // Grupos colapsados (se o usuário quiser recolher)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Métricas de resumo
  const totalClasses = taxonomia.length;
  const totalCategorias = useMemo(
    () => taxonomia.reduce((acc, cl) => acc + cl.categorias.length, 0),
    [taxonomia]
  );
  const totalTipos = useMemo(
    () => taxonomia.reduce((acc, cl) => acc + cl.categorias.reduce((cAcc, cat) => cAcc + cat.tipos.length, 0), 0),
    [taxonomia]
  );

  // Filtragem
  const filteredTaxonomia = useMemo(() => {
    let result = taxonomia;

    if (selectedGroupFilter !== 'todos') {
      result = result.filter((cl) => cl.id === selectedGroupFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result
        .map((cl) => {
          const matchClass = cl.nome.toLowerCase().includes(term);
          const filteredCategories = cl.categorias.filter((cat) => {
            const matchCat = cat.nome.toLowerCase().includes(term);
            const matchType = cat.tipos.some((t) => t.nome.toLowerCase().includes(term));
            return matchCat || matchType || matchClass;
          });

          return {
            ...cl,
            categorias: matchClass ? cl.categorias : filteredCategories,
          };
        })
        .filter((cl) => cl.categorias.length > 0 || cl.nome.toLowerCase().includes(term));
    }

    return result;
  }, [taxonomia, selectedGroupFilter, searchTerm]);

  // Manipulação de dados
  const handleSaveTaxonomia = (updated: TaxonomiaClasse[]) => {
    storageService.saveTaxonomia(updated);
    onTaxonomiaUpdated(updated);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: TaxonomiaClasse = {
      id: `classe-${Date.now()}`,
      nome: newGroupName.trim(),
      categorias: [
        {
          id: `cat-${Date.now()}`,
          nome: 'Geral',
          tipos: [{ id: `tipo-${Date.now()}`, nome: 'Padrão' }],
        },
      ],
    };

    handleSaveTaxonomia([...taxonomia, newGroup]);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !targetClassId) return;

    const updated = taxonomia.map((cl) => {
      if (cl.id === targetClassId) {
        return {
          ...cl,
          categorias: [
            ...cl.categorias,
            {
              id: `cat-${Date.now()}`,
              nome: newCatName.trim(),
              tipos: [{ id: `tipo-${Date.now()}`, nome: 'Padrão' }],
            },
          ],
        };
      }
      return cl;
    });

    handleSaveTaxonomia(updated);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleAddTypeToCategory = (classId: string, catId: string) => {
    if (!newTypeNameInput.trim()) return;

    const updated = taxonomia.map((cl) => {
      if (cl.id === classId) {
        return {
          ...cl,
          categorias: cl.categorias.map((cat) => {
            if (cat.id === catId) {
              return {
                ...cat,
                tipos: [...cat.tipos, { id: `tipo-${Date.now()}`, nome: newTypeNameInput.trim() }],
              };
            }
            return cat;
          }),
        };
      }
      return cl;
    });

    handleSaveTaxonomia(updated);
    setNewTypeNameInput('');
    setAddingTypeFor(null);
  };

  const handleDeleteType = (classId: string, catId: string, typeId: string) => {
    const updated = taxonomia.map((cl) => {
      if (cl.id === classId) {
        return {
          ...cl,
          categorias: cl.categorias.map((cat) => {
            if (cat.id === catId) {
              return {
                ...cat,
                tipos: cat.tipos.filter((t) => t.id !== typeId),
              };
            }
            return cat;
          }),
        };
      }
      return cl;
    });

    handleSaveTaxonomia(updated);
  };

  const handleDeleteCategory = (classId: string, catId: string, catNome: string) => {
    if (confirm(`Remover a categoria "${catNome}" e todos os seus tipos associados?`)) {
      const updated = taxonomia.map((cl) => {
        if (cl.id === classId) {
          return {
            ...cl,
            categorias: cl.categorias.filter((cat) => cat.id !== catId),
          };
        }
        return cl;
      });
      handleSaveTaxonomia(updated);
    }
  };

  const handleDeleteGroup = (classId: string, groupNome: string) => {
    if (confirm(`Excluir o grupo/classe "${groupNome}" e todas as suas categorias?`)) {
      const updated = taxonomia.filter((cl) => cl.id !== classId);
      handleSaveTaxonomia(updated);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Restaurar a estrutura oficial da taxonomia padronizada da obra ICENV 2026?')) {
      storageService.saveTaxonomia(DEFAULT_TAXONOMIA);
      onTaxonomiaUpdated(DEFAULT_TAXONOMIA);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <ListTree className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Taxonomia: Grupos, Categorias & Tipos
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                Tabela Mestra
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Estrutura normalizada para classificação e inteligência artificial de leitura de etiquetas.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 self-start md:self-center">
          <button
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 hover:text-white transition-all shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            + Novo Grupo
          </button>
          <button
            onClick={() => {
              setTargetClassId(taxonomia[0]?.id || '');
              setIsAddingCategory(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Nova Categoria
          </button>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Restaurar taxonomia original da construção civil"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Grupos / Classes</span>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{totalClasses}</p>
          </div>
          <Building className="w-6 h-6 text-slate-700" />
        </div>
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Categorias</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{totalCategorias}</p>
          </div>
          <Layers className="w-6 h-6 text-slate-700" />
        </div>
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tipos Homologados</span>
            <p className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">{totalTipos}</p>
          </div>
          <Tag className="w-6 h-6 text-slate-700" />
        </div>
      </div>

      {/* Modais Inline de Cadastro Rápido */}
      {isAddingGroup && (
        <form
          onSubmit={handleCreateGroup}
          className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-200"
        >
          <FolderPlus className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nome do Novo Grupo / Classe (ex: Climatização, Impermeabilização, Paisagismo)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 shadow"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Salvar Grupo
          </button>
          <button
            type="button"
            onClick={() => setIsAddingGroup(false)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancelar
          </button>
        </form>
      )}

      {isAddingCategory && (
        <form
          onSubmit={handleCreateCategory}
          className="bg-sky-500/10 border border-sky-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">Grupo:</span>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-400 flex-1 max-w-xs"
            >
              {taxonomia.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nome da nova Categoria (ex: Torneiras, Ralos, Argamassas)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-400"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Salvar Categoria
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por grupo, categoria ou tipo de material..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="todos">Todos os Grupos ({totalClasses})</option>
            {taxonomia.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Grupos e Categorias */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-48">Grupo / Classe</th>
                <th className="py-3 px-4 w-56">Categoria</th>
                <th className="py-3 px-4">Tipos / Subitens Padronizados</th>
                <th className="py-3 px-4 w-28 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredTaxonomia.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Nenhuma categoria ou grupo encontrado para o filtro aplicado.
                  </td>
                </tr>
              ) : (
                filteredTaxonomia.map((classe) => {
                  const isCollapsed = !!collapsedGroups[classe.id];
                  const hasCategories = classe.categorias.length > 0;

                  return (
                    <React.Fragment key={classe.id}>
                      {/* Linha Cabeçalho de Grupo */}
                      <tr className="bg-slate-950/80 border-t border-slate-800 hover:bg-slate-950 transition-colors">
                        <td colSpan={4} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleGroupCollapse(classe.id)}
                              className="flex items-center gap-2 text-left font-bold text-sm text-white hover:text-amber-400 transition-colors group"
                            >
                              <div className="text-slate-500 group-hover:text-amber-400 transition-colors">
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                                {getGroupIcon(classe.nome)}
                              </div>
                              <span>{classe.nome}</span>
                              <span className="text-[11px] font-normal text-slate-400">
                                ({classe.categorias.length} {classe.categorias.length === 1 ? 'categoria' : 'categorias'})
                              </span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setTargetClassId(classe.id);
                                  setIsAddingCategory(true);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-amber-400" />
                                Adicionar Categoria
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(classe.id, classe.nome)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                                title="Excluir grupo inteiro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Linhas de Categorias do Grupo (se não estiver colapsado) */}
                      {!isCollapsed && (
                        <>
                          {!hasCategories ? (
                            <tr className="bg-slate-900/40">
                              <td className="py-3 px-4 text-slate-500 italic">Sem categorias</td>
                              <td colSpan={3} className="py-3 px-4 text-slate-500 text-[11px]">
                                Nenhuma categoria cadastrada neste grupo. Clique em "+ Adicionar Categoria" acima.
                              </td>
                            </tr>
                          ) : (
                            classe.categorias.map((cat, idx) => {
                              const isAddingThisType =
                                addingTypeFor?.classId === classe.id && addingTypeFor?.catId === cat.id;

                              return (
                                <tr
                                  key={cat.id}
                                  className="hover:bg-slate-800/40 transition-colors group"
                                >
                                  {/* Grupo Indicador */}
                                  <td className="py-3 px-4 align-top text-[11px] text-slate-400 border-r border-slate-800/40">
                                    <div className="flex items-center gap-1.5 pl-6 font-medium text-slate-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                      <span className="truncate">{classe.nome}</span>
                                    </div>
                                  </td>

                                  {/* Categoria */}
                                  <td className="py-3 px-4 align-top border-r border-slate-800/40">
                                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                                      <span>{cat.nome}</span>
                                      <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                        {cat.tipos.length}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Tipos Homologados */}
                                  <td className="py-3 px-4 align-top">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {cat.tipos.map((tipo) => (
                                        <span
                                          key={tipo.id}
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700/80 text-[11px] group/item hover:border-slate-600 transition-colors"
                                        >
                                          <span>{tipo.nome}</span>
                                          <button
                                            onClick={() => handleDeleteType(classe.id, cat.id, tipo.id)}
                                            className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                                            title="Remover tipo"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ))}

                                      {/* Inline Add Type Input / Button */}
                                      {isAddingThisType ? (
                                        <div className="inline-flex items-center gap-1 bg-slate-950 border border-amber-400/80 rounded-md p-0.5 animate-in fade-in">
                                          <input
                                            type="text"
                                            value={newTypeNameInput}
                                            onChange={(e) => setNewTypeNameInput(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTypeToCategory(classe.id, cat.id);
                                              } else if (e.key === 'Escape') {
                                                setAddingTypeFor(null);
                                              }
                                            }}
                                            placeholder="Nome do tipo..."
                                            className="bg-transparent text-[11px] text-white px-2 py-0.5 outline-none w-36"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => handleAddTypeToCategory(classe.id, cat.id)}
                                            className="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                                            title="Confirmar"
                                          >
                                            <Check className="w-3 h-3 stroke-[3]" />
                                          </button>
                                          <button
                                            onClick={() => setAddingTypeFor(null)}
                                            className="p-1 rounded text-slate-400 hover:text-slate-200"
                                            title="Cancelar"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setAddingTypeFor({ classId: classe.id, catId: cat.id });
                                            setNewTypeNameInput('');
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-400/90 hover:text-amber-300 border border-dashed border-amber-500/40 text-[11px] font-medium transition-colors"
                                          title="Adicionar novo tipo a esta categoria"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Tipo</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Ações da Categoria */}
                                  <td className="py-3 px-4 align-top text-center">
                                    <button
                                      onClick={() => handleDeleteCategory(classe.id, cat.id, cat.nome)}
                                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                                      title="Excluir categoria"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
