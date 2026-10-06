import React, { useState } from 'react';
import { X, Receipt, Upload, DollarSign, Check, Store } from 'lucide-react';
import { Projeto, CompraReal, ItemProjeto } from '../types';
import { storageService } from '../services/storageService';

interface RegisterPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
}

export const RegisterPurchaseModal: React.FC<RegisterPurchaseModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onProjectUpdated,
}) => {
  if (!isOpen || !activeProject) return null;

  const currentScenario =
    activeProject.cenarios.find((c) => c.id === activeProject.cenarioAtivoId) ||
    activeProject.cenarios[0];

  const plannedItems: ItemProjeto[] = currentScenario ? currentScenario.itens : [];

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Revestimento');
  const [fornecedorLoja, setFornecedorLoja] = useState('');
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [quantidade, setQuantidade] = useState<number | ''>(1);
  const [unidade, setUnidade] = useState('un');
  const [valorTotal, setValorTotal] = useState<number | ''>('');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<CompraReal['formaPagamento']>('pix');
  const [status, setStatus] = useState<CompraReal['status']>('pago');
  const [observacoes, setObservacoes] = useState('');

  // When user selects a planned item from budget, autofill description, category, unit and expected price
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    if (!itemId) return;

    const item = plannedItems.find((i) => i.id === itemId);
    if (item) {
      setDescricao(item.materialNome);
      setCategoria(item.classe);
      setUnidade(item.unidade);
      setQuantidade(item.quantidadeComPerda);
      setValorTotal(item.precoTotal);
      if (item.lojaReferencia) {
        setFornecedorLoja(item.lojaReferencia);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || valorTotal === '') {
      alert('Por favor, informe a descrição e o valor pago.');
      return;
    }

    const qty = Number(quantidade) || 1;
    const total = Number(valorTotal);
    const unitPrice = qty > 0 ? total / qty : total;

    // Find planned item if any for planned vs actual calculation
    const matchedItem = plannedItems.find((i) => i.id === selectedItemId);

    const updated = storageService.addRealPurchase(activeProject.id, {
      projetoId: activeProject.id,
      itemProjetoId: selectedItemId || undefined,
      descricao,
      categoria,
      fornecedorLoja: fornecedorLoja || 'Fornecedor Local',
      data: dataCompra,
      quantidade: qty,
      unidade,
      valorUnitario: Math.round(unitPrice * 100) / 100,
      valorTotal: total,
      valorPlanejado: matchedItem ? matchedItem.precoTotal : total,
      numeroNotaFiscal: numeroNotaFiscal || undefined,
      formaPagamento,
      status,
      observacoes,
    });

    if (updated) {
      // Also mark item as comprado in the active scenario
      if (matchedItem) {
        const updatedCenarios = updated.cenarios.map((cen) => ({
          ...cen,
          itens: cen.itens.map((it) =>
            it.id === matchedItem.id ? { ...it, comprado: true } : it
          ),
        }));
        const finalProject = { ...updated, cenarios: updatedCenarios };
        storageService.saveProject(finalProject);
        onProjectUpdated(finalProject);
      } else {
        onProjectUpdated(updated);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">Registrar Compra Real da Obra</h3>
              <p className="text-xs text-slate-400">Controle de desembolso e comparativo orçado x realizado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Link to budget item (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vincular a um Item do Orçamento (Opcional):
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
            >
              <option value="">-- Compra avulsa / material geral / serviço --</option>
              {plannedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.materialNome} (Orçado: R$ {item.precoTotal.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição da Aquisição / Material *
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Porcelanato 84x84 Bianco di Lucca (19 caixas)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-emerald-400"
            />
          </div>

          {/* Fornecedor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fornecedor / Loja *
              </label>
              <input
                type="text"
                required
                value={fornecedorLoja}
                onChange={(e) => setFornecedorLoja(e.target.value)}
                placeholder="Ex: Leroy Merlin Morumbi"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data do Pagamento *
              </label>
              <input
                type="date"
                required
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Quantidade, Unidade e Valor Total */}
          <div className="grid grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Unidade
              </label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="m², un, cx"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                Valor Total Pago (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Nota Fiscal e Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Número NF-e / Cupom Fiscal
              </label>
              <input
                type="text"
                value={numeroNotaFiscal}
                onChange={(e) => setNumeroNotaFiscal(e.target.value)}
                placeholder="Ex: NF-e 001.294.881"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="pix">PIX (À Vista)</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações / Negociação
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Desconto de 5% obtido com o gerente, frete grátis."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
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
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Salvar Compra na Obra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
