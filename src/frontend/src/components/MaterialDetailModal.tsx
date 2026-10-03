import React, { useState } from 'react';
import {
  X,
  History,
  Store,
  Calendar,
  Layers,
  Barcode,
  PlusCircle,
  Trash2,
  TrendingDown,
  TrendingUp,
  Tag,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { Material, Loja } from '../types';
import { storageService } from '../services/storageService';

interface MaterialDetailModalProps {
  material: Material | null;
  onClose: () => void;
  onDeleteMaterial: (id: string) => void;
  onOpenAddToProject: (material: Material) => void;
  onPriceUpdated: (material: Material) => void;
  lojas: Loja[];
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  material,
  onClose,
  onDeleteMaterial,
  onOpenAddToProject,
  onPriceUpdated,
  lojas,
}) => {
  const [showAddPriceForm, setShowAddPriceForm] = useState(false);
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newStore, setNewStore] = useState('');
  const [newObservations, setNewObservations] = useState('');

  if (!material) return null;

  const sortedHistory = [...(material.historicoPrecos || [])].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const lowestPrice = sortedHistory.length
    ? Math.min(...sortedHistory.map((h) => h.preco))
    : material.precoAtual;
  const highestPrice = sortedHistory.length
    ? Math.max(...sortedHistory.map((h) => h.preco))
    : material.precoAtual;
  const priceDiff = highestPrice - lowestPrice;

  const handleAddNewPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrice === '') return;

    const updated = storageService.addPricePoint(material.id, {
      preco: Number(newPrice),
      unidade: material.unidade,
      loja: newStore || 'Loja Física',
      data: new Date().toISOString(),
      observacoes: newObservations,
    });

    if (updated) {
      onPriceUpdated(updated);
      setShowAddPriceForm(false);
      setNewPrice('');
      setNewStore('');
      setNewObservations('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
              {material.classe} &rsaquo; {material.categoria}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] space-y-6">
          {/* Main Info Hero */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-full sm:w-44 h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
              {material.fotoPrincipal ? (
                <img
                  src={material.fotoPrincipal}
                  alt={material.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 text-xs">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span>Sem foto</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {material.fabricante}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {material.modelo}
              </h2>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  R$ {material.precoAtual.toFixed(2)}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  / {material.unidade}
                </span>
                {material.precoPorEmbalagem && (
                  <span className="text-xs text-slate-400 ml-2">
                    (R$ {material.precoPorEmbalagem.toFixed(2)} por embalagem)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md">
                  <Store className="w-3.5 h-3.5 text-slate-300" />
                  {material.lojaAtual}
                </span>
                {material.codigoBarras && (
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md">
                    <Barcode className="w-3.5 h-3.5 text-slate-300" />
                    {material.codigoBarras}
                  </span>
                )}
                {material.coberturaPorEmbalagem && (
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md text-amber-300">
                    Rendimento: {material.coberturaPorEmbalagem} {material.unidade}/caixa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Observações / Detalhes Técnicos */}
          {material.observacoes && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-slate-300 mb-1">Observações Técnicas</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{material.observacoes}</p>
            </div>
          )}

          {/* Histórico de Preços Comparativo por Loja (Seção 3.3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Histórico de Preços & Comparativo entre Lojas
                </h3>
              </div>
              <button
                onClick={() => setShowAddPriceForm(!showAddPriceForm)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {showAddPriceForm ? 'Fechar' : 'Cotar em Outra Loja'}
              </button>
            </div>

            {/* Quick summary metric */}
            {sortedHistory.length > 1 && (
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Menor preço cotado:</span>{' '}
                  <strong className="text-emerald-400">R$ {lowestPrice.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Maior preço:</span>{' '}
                  <strong className="text-rose-400">R$ {highestPrice.toFixed(2)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Diferença de economia:</span>{' '}
                  <strong className="text-amber-400">
                    R$ {priceDiff.toFixed(2)} ({Math.round((priceDiff / lowestPrice) * 100)}%)
                  </strong>
                </div>
              </div>
            )}

            {/* Form to add another store price */}
            {showAddPriceForm && (
              <form
                onSubmit={handleAddNewPrice}
                className="p-4 bg-slate-800/80 border border-amber-500/30 rounded-xl space-y-3"
              >
                <h4 className="text-xs font-bold text-amber-400">
                  Adicionar Nova Cotação / Preço de Outra Loja
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Loja *</label>
                    <input
                      type="text"
                      required
                      value={newStore}
                      onChange={(e) => setNewStore(e.target.value)}
                      placeholder="Ex: Obramax Mooca"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Observações</label>
                    <input
                      type="text"
                      value={newObservations}
                      onChange={(e) => setNewObservations(e.target.value)}
                      placeholder="Ex: Preço no PIX"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPriceForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Salvar Preço
                  </button>
                </div>
              </form>
            )}

            {/* Price points table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Loja</th>
                    <th className="py-2.5 px-3">Preço Unitário</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedHistory.map((point, idx) => {
                    const isLowest = point.preco === lowestPrice;
                    return (
                      <tr key={point.id || idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-200 font-medium">
                          {point.loja}
                          {idx === 0 && (
                            <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-normal">
                              atual
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-bold text-white">
                          R$ {point.preco.toFixed(2)}
                          {isLowest && (
                            <span className="ml-1.5 text-[10px] text-emerald-400 font-normal">
                              (Menor)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {new Date(point.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                          {point.observacoes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Deseja excluir "${material.nome}" do catálogo?`)) {
                onDeleteMaterial(material.id);
                onClose();
              }
            }}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Material
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onOpenAddToProject(material);
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar ao Orçamento do Projeto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
