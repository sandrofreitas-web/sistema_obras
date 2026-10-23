import React, { useState, useMemo, useEffect } from 'react';
import {
  HardHat,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  Camera,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Receipt,
  ArrowUpRight,
  Store,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Check,
  Loader2,
} from 'lucide-react';
import { Projeto, EtapaObra, FotoDiario, ItemProjeto, RequisicaoCampo } from '../types';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

interface MobileCanteiroScreenProps {
  project: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
  onNavigateTab: (tab: any) => void;
}

export const MobileCanteiroScreen: React.FC<MobileCanteiroScreenProps> = ({
  project,
  onProjectUpdated,
  onNavigateTab,
}) => {
  if (!project) {
    return (
      <div className="p-6 text-center text-slate-400">
        <HardHat className="w-12 h-12 mx-auto text-amber-400 mb-2 opacity-50" />
        <p className="text-sm font-semibold">Nenhuma obra selecionada.</p>
      </div>
    );
  }

  // Estado de Lightbox para fotos do RDO
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<FotoDiario | null>(null);

  // Requisições recebidas do campo via WhatsApp / N8N
  const [requisicoes, setRequisicoes] = useState<RequisicaoCampo[]>([]);
  const [loadingRequisicoes, setLoadingRequisicoes] = useState<boolean>(false);

  const fetchRequisicoes = async () => {
    setLoadingRequisicoes(true);
    try {
      const data = await apiService.getRequisicoesCampo(project.id);
      setRequisicoes(data);
    } catch (e) {
      console.warn('Erro ao carregar requisições:', e);
    } finally {
      setLoadingRequisicoes(false);
    }
  };

  useEffect(() => {
    fetchRequisicoes();
    const interval = setInterval(fetchRequisicoes, 15000);
    return () => clearInterval(interval);
  }, [project.id]);

  const handleApproveRequisicao = async (reqId: string) => {
    const success = await apiService.updateRequisicaoStatus(reqId, 'Aprovado');
    if (success) {
      setRequisicoes((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'Aprovado' } : r))
      );
    }
  };

  // Checkbox local para checklist de conferência de materiais no canteiro
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`canteiro_checklist_${project.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheckItem = (itemId: string) => {
    const next = { ...checkedItems, [itemId]: !checkedItems[itemId] };
    setCheckedItems(next);
    try {
      localStorage.setItem(`canteiro_checklist_${project.id}`, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  // Cálculo do progresso físico global
  const etapas = project.etapas || [];
  const percentualFisico = etapas.length > 0
    ? Math.round(etapas.reduce((acc, e) => acc + (e.percentualAvanco || 0), 0) / etapas.length)
    : 0;

  // Etapa ativa da semana
  const etapaAtiva = etapas.find((e) => e.status === 'em_andamento') || etapas[0] || null;

  // Cálculos financeiros consolidados
  const totalOrcado = project.orcamentoTeto || (project.orcamentoMateriais || 0) + (project.orcamentoMaoObra || 0) || 53825;
  const totalRealizado = (project.compras || []).reduce((acc, c) => acc + (c.valorTotal || 0), 0);
  const percentualFinanceiro = totalOrcado > 0 ? Math.min(Math.round((totalRealizado / totalOrcado) * 100), 100) : 0;
  const saldoDisponivel = Math.max(0, totalOrcado - totalRealizado);

  // Status do Semáforo Orçamentário
  const statusSemaforo = useMemo(() => {
    const desvio = percentualFinanceiro - percentualFisico;
    if (desvio > 15) {
      return {
        cor: 'bg-rose-500 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-500',
        texto: 'Atenção: Desembolso adiantado frente ao físico',
        grau: 'vermelho',
      };
    }
    if (desvio > 5) {
      return {
        cor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
        texto: 'Atenção aos próximos lotes de acabamento',
        grau: 'amarelo',
      };
    }
    return {
      cor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
      texto: 'Orçamento sob controle e margem técnica de 10% preservada',
      grau: 'verde',
    };
  }, [percentualFinanceiro, percentualFisico]);

  // Atualização rápida do avanço da etapa pelo encarregado
  const handleUpdateEtapaAvanco = (etapaId: string, percent: number) => {
    const updatedEtapas = etapas.map((e) => {
      if (e.id === etapaId) {
        return {
          ...e,
          percentualAvanco: percent,
          status: percent === 100 ? ('concluida' as const) : percent > 0 ? ('em_andamento' as const) : ('nao_iniciada' as const),
        };
      }
      return e;
    });

    const updated = { ...project, etapas: updatedEtapas };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
  };

  // Coleta de todas as fotos de diário das etapas
  const fotosRdo = useMemo(() => {
    const fotos: FotoDiario[] = [];
    etapas.forEach((et) => {
      if (et.fotosDiario && et.fotosDiario.length > 0) {
        fotos.push(...et.fotosDiario);
      }
    });
    return fotos;
  }, [etapas]);

  // Itens de materiais do cenário ativo para o checklist de canteiro
  const cenarioAtivo = project.cenarios?.find((c) => c.id === project.cenarioAtivoId) || project.cenarios?.[0];
  const itensChecklist = cenarioAtivo?.itens?.slice(0, 8) || [];

  return (
    <div className="space-y-4 pb-24 text-slate-100 max-w-lg mx-auto">
      {/* 1. Header do Canteiro: Frente Ativa & Identificação */}
      <div className="bg-gradient-to-br from-slate-900 to-[#0e1726] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                Canteiro de Obras Ativo
              </span>
            </div>
            <h1 className="text-lg font-black text-white tracking-tight leading-snug">
              {project.nome}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {project.cliente || 'ICENV 2026'} • Frente: Casa Pastoral & Banheiros
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('projetos')}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            <span>Trocar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mestre de Obras & Previsão */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
              W
            </div>
            <span className="text-slate-300 font-semibold">Encarregado: Wagner</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-mono">Entrega: 24/11/2026</span>
          </div>
        </div>
      </div>

      {/* 2. Termômetro Executivo: Físico vs Financeiro */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Termômetro da Obra
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {percentualFisico}% Físico • {percentualFinanceiro}% Pago
          </span>
        </div>

        {/* Barras de Comparação Visual */}
        <div className="space-y-2">
          {/* Barra de Avanço Físico */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400">Avanço Físico Concluído</span>
              <span className="text-amber-400 font-mono font-bold">{percentualFisico}%</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${percentualFisico}%` }}
              />
            </div>
          </div>

          {/* Barra de Desembolso Financeiro */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400">Desembolso Realizado (NFs)</span>
              <span className="text-sky-400 font-mono font-bold">
                R$ {totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percentualFinanceiro}%)
              </span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${percentualFinanceiro}%` }}
              />
            </div>
          </div>
        </div>

        {/* Semáforo de Risco Orçamentário */}
        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${statusSemaforo.cor}`}>
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusSemaforo.dot}`} />
          <p className="leading-tight text-[11px]">{statusSemaforo.texto}</p>
        </div>

        {/* Métricas Rápidas: Teto, Realizado, Saldo */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
          <div className="bg-slate-950/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Teto Orçado</span>
            <span className="text-xs font-bold font-mono text-slate-200">
              R$ {(totalOrcado / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Gasto Real</span>
            <span className="text-xs font-bold font-mono text-amber-400">
              R$ {(totalRealizado / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Saldo em Conta</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              R$ {(saldoDisponivel / 1000).toFixed(1)}k
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 Requisições do Canteiro (WhatsApp / N8N Pipeline em Tempo Real) */}
      <div className="bg-gradient-to-br from-slate-900 to-[#0a151d] border border-emerald-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  WhatsApp Canteiro (IA Inbound)
                </h2>
              </div>
              <p className="text-[10px] text-slate-400">Grupo Oficial Obra ICENV</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-bold">
              {requisicoes.length} {requisicoes.length === 1 ? 'pedido' : 'pedidos'}
            </span>
            <button
              onClick={fetchRequisicoes}
              disabled={loadingRequisicoes}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
              title="Atualizar mensagens do WhatsApp"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRequisicoes ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {requisicoes.length === 0 ? (
          <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Nenhuma requisição pendente no momento.
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Mensagens ou áudios do encarregado enviados no grupo do WhatsApp aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {requisicoes.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-800/50 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {req.remetente_nome || 'Mestre de Obras'}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {req.canal || 'WhatsApp'}
                      </span>
                    </div>
                    {req.criado_em && (
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {new Date(req.criado_em).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'Aprovado'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Mensagem original transcrita */}
                <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60 text-xs text-slate-300 italic">
                  "{req.texto_original}"
                </div>

                {/* Itens estruturados extraídos pela IA */}
                {req.itens && req.itens.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">
                      Itens Identificados pela IA:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {req.itens.map((it, idx) => (
                        <div
                          key={it.id || idx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-xs font-medium text-emerald-200"
                        >
                          <span className="font-mono font-bold text-emerald-400">
                            {it.qtd_solicitada} {it.unidade_solicitada || 'un'}
                          </span>
                          <span>•</span>
                          <span className="text-slate-200">{it.descricao_informal}</span>
                          {it.loja_sugerida_nome && (
                            <span className="text-[10px] text-amber-300 font-mono">
                              ({it.loja_sugerida_nome})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                {req.status !== 'Aprovado' && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleApproveRequisicao(req.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Homologar Pedido</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Frente Ativa da Semana com Ajuste Touch de Avanço */}
      {etapaAtiva && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Frente Ativa da Semana
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
              Etapa {etapaAtiva.ordem} de {etapas.length}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white leading-snug">
              {etapaAtiva.nome}
            </h3>
            {etapaAtiva.observacoes && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {etapaAtiva.observacoes}
              </p>
            )}
          </div>

          {/* Seletor Rápido Touch de Avanço com 1 Toque */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Atualizar avanço da semana:</span>
              <strong className="text-amber-400 font-mono">{etapaAtiva.percentualAvanco || 0}%</strong>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 25, 50, 75, 100].map((val) => {
                const isSelected = (etapaAtiva.percentualAvanco || 0) === val;
                return (
                  <button
                    key={val}
                    onClick={() => handleUpdateEtapaAvanco(etapaAtiva.id, val)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {val}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Diário de Obra (RDO Fotográfico do Canteiro) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Diário de Obra (RDO)
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('etapas')}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
          >
            <span>Ver Todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {fotosRdo.length === 0 ? (
          <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center">
            <Camera className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400 font-medium">
              Fotos da obra são sincronizadas via WhatsApp / Drive de canteiro.
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Assim que o mestre Wagner enviar registros de evolução, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {fotosRdo.slice(0, 4).map((foto) => (
              <div
                key={foto.id}
                onClick={() => setSelectedPhotoForLightbox(foto)}
                className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                <img
                  src={foto.fotoUrl}
                  alt={foto.legenda}
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                  <span className="text-[10px] text-slate-300 block truncate font-medium">
                    {foto.legenda}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {foto.data}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Checklist Touch de Materiais no Canteiro */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Checklist de Materiais no Canteiro
            </h2>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Toque para confirmar os itens que já foram descarregados no canteiro:
        </p>

        <div className="space-y-1.5">
          {itensChecklist.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">Nenhum insumo planejado no cenário ativo.</p>
          ) : (
            itensChecklist.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheckItem(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer active:scale-98 ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block truncate ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                        {item.materialNome}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {item.quantidadeComPerda} {item.unidade} • {item.lojaReferencia || 'Depósito'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 font-mono ${
                    isChecked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isChecked ? 'No Canteiro' : 'Aguardando'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Últimas NFs & Faturas Homologadas */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Últimas NFs & Recibos
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('execucao')}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
          >
            <span>Ver Todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {(project.compras || []).slice(0, 3).map((compra) => (
            <div
              key={compra.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-slate-200 block truncate">{compra.fornecedorLoja}</span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">
                  {compra.numeroNotaFiscal ? `NF ${compra.numeroNotaFiscal}` : 'Recibo'} • {compra.data}
                </span>
              </div>
              <span className="font-mono font-bold text-sky-400 whitespace-nowrap">
                R$ {compra.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal de Alta Resolução para o Canteiro */}
      {selectedPhotoForLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoForLightbox(null)}
        >
          <div
            className="max-w-md w-full bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-white block truncate">
                  {selectedPhotoForLightbox.legenda}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedPhotoForLightbox.data} • Registro RDO
                </span>
              </div>
              <button
                onClick={() => setSelectedPhotoForLightbox(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedPhotoForLightbox.fotoUrl}
              alt={selectedPhotoForLightbox.legenda}
              className="w-full max-h-[65vh] object-contain rounded-xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};
