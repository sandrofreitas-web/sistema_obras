import React, { useState } from 'react';
import { X, Calculator, Plus, Check } from 'lucide-react';
import { Material, Projeto, ItemProjeto } from '../types';
import { storageService } from '../services/storageService';

interface AddItemToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  activeProject: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
}

export const AddItemToProjectModal: React.FC<AddItemToProjectModalProps> = ({
  isOpen,
  onClose,
  material,
  activeProject,
  onProjectUpdated,
}) => {
  if (!isOpen || !material || !activeProject) return null;

  // Defaults
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>(
    activeProject.ambientes[0]?.id || ''
  );
  const [selectedCenarioId, setSelectedCenarioId] = useState<string>(
    activeProject.cenarioAtivoId || activeProject.cenarios[0]?.id || ''
  );

  // Perda técnica default: 10% para revestimentos, 5% geral
  const defaultPerda = material.classe.toLowerCase().includes('revest') ? 10 : 5;
  const [perdaPercent, setPerdaPercent] = useState<number>(defaultPerda);

  // Suggested quantity based on environment area if unit is m²
  const selectedAmbiente = activeProject.ambientes.find((a) => a.id === selectedAmbienteId);
  const defaultQty =
    material.unidade === 'm²' && selectedAmbiente
      ? selectedAmbiente.areaPisoM2
      : 1;

  const [quantidadeBase, setQuantidadeBase] = useState<number>(defaultQty);

  // Calculations
  const quantidadeComPerda = Math.round((quantidadeBase * (1 + perdaPercent / 100)) * 100) / 100;
  const precoTotal = Math.round(quantidadeComPerda * material.precoAtual * 100) / 100;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: ItemProjeto = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ambienteId: selectedAmbienteId,
      cenarioId: selectedCenarioId,
      materialId: material.id,
      materialNome: material.nome,
      fabricante: material.fabricante,
      classe: material.classe,
      categoria: material.categoria,
      tipo: material.tipo,
      unidade: material.unidade,
      quantidadeBase: Number(quantidadeBase),
      perdaTecnicaPercent: Number(perdaPercent),
      quantidadeComPerda,
      precoUnitario: material.precoAtual,
      precoTotal,
      lojaReferencia: material.lojaAtual,
      comprado: false,
    };

    // Add item to specified scenario
    const updatedCenarios = activeProject.cenarios.map((cen) => {
      if (cen.id === selectedCenarioId) {
        return {
          ...cen,
          itens: [...(cen.itens || []), newItem],
        };
      }
      return cen;
    });

    const updatedProject: Projeto = {
      ...activeProject,
      cenarios: updatedCenarios,
      atualizadoEm: new Date().toISOString(),
    };

    storageService.saveProject(updatedProject);
    onProjectUpdated(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Adicionar ao Orçamento</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAdd} className="p-5 space-y-4">
          {/* Material summary preview */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3">
            {material.fotoPrincipal && (
              <img
                src={material.fotoPrincipal}
                alt={material.nome}
                className="w-12 h-12 rounded-lg object-cover bg-slate-950 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                {material.fabricante}
              </span>
              <h4 className="text-xs font-bold text-white truncate">{material.modelo}</h4>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                R$ {material.precoAtual.toFixed(2)} / {material.unidade}
              </p>
            </div>
          </div>

          {/* Select Environment (Ambiente) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ambiente do Projeto *
            </label>
            <select
              value={selectedAmbienteId}
              onChange={(e) => {
                const ambId = e.target.value;
                setSelectedAmbienteId(ambId);
                const amb = activeProject.ambientes.find((a) => a.id === ambId);
                if (amb && material.unidade === 'm²') {
                  setQuantidadeBase(amb.areaPisoM2);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
            >
              {activeProject.ambientes.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.nome} ({amb.areaPisoM2} m² de piso)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Technical Waste (% Perda) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantidade Base ({material.unidade}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantidadeBase}
                onChange={(e) => setQuantidadeBase(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-amber-400">
                  Perda Técnica %
                </label>
                <span className="text-[10px] text-slate-400">cortes/quebra</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={perdaPercent}
                  onChange={(e) => setPerdaPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Live Calculation summary */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Total com margem de perda (+{perdaPercent}%):</span>
              <strong className="text-white">
                {quantidadeComPerda} {material.unidade}
              </strong>
            </div>
            <div className="flex justify-between text-base font-extrabold text-amber-400 pt-1 border-t border-amber-500/20">
              <span>Subtotal estimado:</span>
              <span>R$ {precoTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar e Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
