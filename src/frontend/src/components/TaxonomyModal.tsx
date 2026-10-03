import React, { useState } from 'react';
import {
  ListTree,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  FolderPlus,
  RotateCcw,
  Check,
} from 'lucide-react';
import { TaxonomiaClasse } from '../types';
import { storageService } from '../services/storageService';
import { DEFAULT_TAXONOMIA } from '../data/initialData';

interface TaxonomyModalProps {
  taxonomia: TaxonomiaClasse[];
  onTaxonomiaUpdated: (newTax: TaxonomiaClasse[]) => void;
}

export const TaxonomyModal: React.FC<TaxonomyModalProps> = ({
  taxonomia,
  onTaxonomiaUpdated,
}) => {
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({
    'classe-revestimento': true,
    'classe-pintura': true,
  });

  const [newClassName, setNewClassName] = useState('');
  const [newCatName, setNewCatName] = useState<Record<string, string>>({});
  const [newTypeName, setNewTypeName] = useState<Record<string, string>>({});

  const toggleClass = (id: string) => {
    setExpandedClasses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Add new class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: TaxonomiaClasse = {
      id: `classe-${Date.now()}`,
      nome: newClassName.trim(),
      categorias: [
        {
          id: `cat-${Date.now()}`,
          nome: 'Geral',
          tipos: [{ id: `tipo-${Date.now()}`, nome: 'Padrão' }],
        },
      ],
    };

    const updated = [...taxonomia, newClass];
    storageService.saveTaxonomia(updated);
    onTaxonomiaUpdated(updated);
    setNewClassName('');
    setExpandedClasses((prev) => ({ ...prev, [newClass.id]: true }));
  };

  // Add new category to class
  const handleAddCategory = (classId: string) => {
    const catName = newCatName[classId]?.trim();
    if (!catName) return;

    const updated = taxonomia.map((cl) => {
      if (cl.id === classId) {
        return {
          ...cl,
          categorias: [
            ...cl.categorias,
            {
              id: `cat-${Date.now()}`,
              nome: catName,
              tipos: [{ id: `tipo-${Date.now()}`, nome: 'Padrão' }],
            },
          ],
        };
      }
      return cl;
    });

    storageService.saveTaxonomia(updated);
    onTaxonomiaUpdated(updated);
    setNewCatName((prev) => ({ ...prev, [classId]: '' }));
  };

  // Add new type to category
  const handleAddType = (classId: string, catId: string) => {
    const key = `${classId}-${catId}`;
    const typeName = newTypeName[key]?.trim();
    if (!typeName) return;

    const updated = taxonomia.map((cl) => {
      if (cl.id === classId) {
        return {
          ...cl,
          categorias: cl.categorias.map((cat) => {
            if (cat.id === catId) {
              return {
                ...cat,
                tipos: [...cat.tipos, { id: `tipo-${Date.now()}`, nome: typeName }],
              };
            }
            return cat;
          }),
        };
      }
      return cl;
    });

    storageService.saveTaxonomia(updated);
    onTaxonomiaUpdated(updated);
    setNewTypeName((prev) => ({ ...prev, [key]: '' }));
  };

  // Delete class
  const handleDeleteClass = (classId: string) => {
    if (confirm('Deseja excluir esta classe inteira da taxonomia?')) {
      const updated = taxonomia.filter((cl) => cl.id !== classId);
      storageService.saveTaxonomia(updated);
      onTaxonomiaUpdated(updated);
    }
  };

  // Delete category
  const handleDeleteCategory = (classId: string, catId: string) => {
    const updated = taxonomia.map((cl) => {
      if (cl.id === classId) {
        return {
          ...cl,
          categorias: cl.categorias.filter((cat) => cat.id !== catId),
        };
      }
      return cl;
    });
    storageService.saveTaxonomia(updated);
    onTaxonomiaUpdated(updated);
  };

  // Delete type
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
    storageService.saveTaxonomia(updated);
    onTaxonomiaUpdated(updated);
  };

  const handleResetDefaults = () => {
    if (confirm('Restaurar taxonomia padrão da construção civil?')) {
      storageService.saveTaxonomia(DEFAULT_TAXONOMIA);
      onTaxonomiaUpdated(DEFAULT_TAXONOMIA);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ListTree className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Taxonomia e Categorização de Materiais
            </h1>
            <p className="text-xs text-slate-400">
              Estrutura hierárquica configurável: <strong>Classe &rarr; Categoria &rarr; Tipo</strong> (conforme Seção 4)
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 self-start sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Padrão
        </button>
      </div>

      {/* Form Add New Class */}
      <form
        onSubmit={handleAddClass}
        className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3"
      >
        <FolderPlus className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Adicionar nova Classe principal (ex: Climatização, Automação, Paisagismo)..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 shadow active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Criar Classe
        </button>
      </form>

      {/* Classes list */}
      <div className="space-y-4">
        {taxonomia.map((classe) => {
          const isExpanded = !!expandedClasses[classe.id];

          return (
            <div
              key={classe.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Class Header row */}
              <div className="p-4 bg-slate-900/90 flex items-center justify-between border-b border-slate-800/80">
                <button
                  onClick={() => toggleClass(classe.id)}
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
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {classe.nome}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {classe.categorias.length} categorias cadastradas
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteClass(classe.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="Excluir classe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Class Body: Categories & Types */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-4 bg-slate-950/40">
                  {/* Category cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classe.categorias.map((cat) => {
                      const typeInputKey = `${classe.id}-${cat.id}`;
                      return (
                        <div
                          key={cat.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <span className="font-bold text-xs text-amber-300">
                              {cat.nome}
                            </span>
                            <button
                              onClick={() => handleDeleteCategory(classe.id, cat.id)}
                              className="text-slate-600 hover:text-rose-400 p-1"
                              title="Remover categoria"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Types pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {cat.tipos.map((t) => (
                              <span
                                key={t.id}
                                className="group inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md text-[11px]"
                              >
                                <span>{t.nome}</span>
                                <button
                                  onClick={() => handleDeleteType(classe.id, cat.id, t.id)}
                                  className="text-slate-500 group-hover:text-rose-400"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>

                          {/* Add type input */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={newTypeName[typeInputKey] || ''}
                              onChange={(e) =>
                                setNewTypeName((prev) => ({
                                  ...prev,
                                  [typeInputKey]: e.target.value,
                                }))
                              }
                              placeholder="Adicionar tipo..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-white outline-none focus:border-amber-400"
                            />
                            <button
                              onClick={() => handleAddType(classe.id, cat.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-md"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new Category to this Class */}
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newCatName[classe.id] || ''}
                      onChange={(e) =>
                        setNewCatName((prev) => ({ ...prev, [classe.id]: e.target.value }))
                      }
                      placeholder={`Nova categoria dentro de ${classe.nome}...`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleAddCategory(classe.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
                    >
                      + Categoria
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
