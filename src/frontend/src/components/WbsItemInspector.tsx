import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Building,
  Store,
  Tag,
  Calculator,
  Percent,
  FileText,
  Edit2,
  PackageCheck,
  AlertCircle,
  ExternalLink,
  Plus
} from 'lucide-react';
import { ItemProjeto, Loja } from '../types';

interface WbsItemInspectorProps {
  item: ItemProjeto | null;
  onClose: () => void;
  onToggleComprado: (itemId: string, currentStatus: boolean) => void;
  onEditItem: (item: ItemProjeto) => void;
  onAddItemInStage?: (classe: string, categoria?: string, ambienteId?: string) => void;
  bdiPercent: number;
  ambienteNome?: string;
  itemCode?: string;
}

export const WbsItemInspector: React.FC<WbsItemInspectorProps> = ({
  item,
  onClose,
  onToggleComprado,
  onEditItem,
  onAddItemInStage,
  bdiPercent,
  ambienteNome = 'Geral',
  itemCode = '1.1'
}) => {
  // ESC key listener to close inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const custoTotal = item.precoTotal || 0;
  const precoVendaTotal = custoTotal * (1 + (bdiPercent || 10) / 100);
  const precoUnitarioVenda = item.precoUnitario * (1 + (bdiPercent || 10) / 100);

  return (
    <aside className="w-[380px] sm:w-[420px] bg-[#090d16] border-l border-slate-800 flex flex-col h-full shadow-2xl z-20 flex-shrink-0 animate-fade-in text-slate-100 select-none">
      {/* 1. Header do Inspetor */}
      <div className="p-4 bg-[#0c111e] border-b border-slate-800/80 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950">
              ITEM {itemCode}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              {item.classe} • {item.categoria}
            </span>
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight line-clamp-2 leading-snug">
            {item.materialNome}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Ambiente: <strong className="text-slate-200">{ambienteNome}</strong></span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          title="Fechar painel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Conteúdo com Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Status de Aquisição com Toggle Direto */}
        <div className="p-3 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
            Status de Aquisição no Canteiro
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.comprado ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Já Comprado / No Local</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Planejado / A Comprar</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onToggleComprado(item.id, !!item.comprado)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                item.comprado
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {item.comprado ? 'Desmarcar Compra' : 'Confirmar Compra'}
            </button>
          </div>
        </div>

        {/* Card Financeiro: Custo Direto vs Preço de Venda com BDI */}
        <div className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Formação de Preço & BDI
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              BDI {bdiPercent.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Custo Unitário */}
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Custo Unitário:</span>
              <strong className="text-white font-mono text-sm block tabular-nums">
                R$ {item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[10px] text-slate-500 font-mono">por {item.unidade}</span>
            </div>

            {/* Preço Unitário Venda */}
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Preço Unit. Venda:</span>
              <strong className="text-sky-400 font-mono text-sm block tabular-nums">
                R$ {precoUnitarioVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[10px] text-slate-500 font-mono">c/ BDI aplicado</span>
            </div>

            {/* Custo Total Direto */}
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Custo Total Direto:</span>
              <strong className="text-white font-mono text-base block tabular-nums">
                R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {/* Preço Total Venda */}
            <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[10px] text-emerald-400/80 block">Preço Total Proposta:</span>
              <strong className="text-emerald-400 font-mono text-base font-black block tabular-nums">
                R$ {precoVendaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        {/* Memória de Cálculo & Quantitativo */}
        <div className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            Quantitativo & Margem de Perda
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Qtd Base</span>
              <strong className="text-white font-mono text-sm tabular-nums">
                {item.quantidadeBase}
              </strong>
              <span className="text-[10px] text-slate-500 block">{item.unidade}</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Perda Técnica</span>
              <strong className="text-amber-400 font-mono text-sm tabular-nums">
                +{item.perdaTecnicaPercent}%
              </strong>
              <span className="text-[10px] text-slate-500 block">reserva</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Qtd Compra</span>
              <strong className="text-emerald-400 font-mono text-sm font-bold tabular-nums">
                {item.quantidadeComPerda}
              </strong>
              <span className="text-[10px] text-slate-500 block">{item.unidade}</span>
            </div>
          </div>
        </div>

        {/* Fornecedor & Cotação */}
        <div className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            Fornecedor & Fabricante
          </span>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Fabricante:</span>
              <strong className="text-white">{item.fabricante || 'Não informado'}</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Loja Referência:</span>
              <strong className="text-amber-400">{item.lojaReferencia || 'Obramax / Geral'}</strong>
            </div>
          </div>
        </div>

        {/* Observações de Campo */}
        {item.observacoes && (
          <div className="p-3 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              Observações Técnicas
            </span>
            <p className="text-slate-300 text-xs leading-relaxed italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              "{item.observacoes}"
            </p>
          </div>
        )}
      </div>

      {/* 3. Rodapé do Inspetor com Ação de Edição e Inclusão na Etapa */}
      <div className="p-3 bg-[#0c111e] border-t border-slate-800/80 space-y-2">
        {onAddItemInStage && (
          <button
            onClick={() => onAddItemInStage(item.classe, item.categoria, item.ambienteId)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30 transition-all hover:border-sky-500/60"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Novo Insumo em {item.classe}</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditItem(item)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Editar Item</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </aside>
  );
};
