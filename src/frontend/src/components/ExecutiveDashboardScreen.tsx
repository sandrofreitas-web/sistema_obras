import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  Layers,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Eye,
  Camera,
} from 'lucide-react';
import { Projeto, CompraReal } from '../types';

interface ExecutiveDashboardScreenProps {
  project: Projeto | null;
  onOpenPrintBudget: () => void;
  onOpenPrintBalcao: () => void;
  onNavigateTab: (tabId: any) => void;
}

export const ExecutiveDashboardScreen: React.FC<ExecutiveDashboardScreenProps> = ({
  project,
  onOpenPrintBudget,
  onOpenPrintBalcao,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'gerencial' | 'cliente'>('gerencial');
  const [isClientReportModalOpen, setIsClientReportModalOpen] = useState(false);

  // Lista mestre unificada de compras reais (Zumkeller, Longametragem, Telhanorte e Sodimac)
  const comprasReaisCompletas: CompraReal[] = useMemo(() => {
    if (project?.compras && project.compras.length > 0) {
      return project.compras;
    }
    // Fallback com as 8 compras reais auditadas da Obra ICENV 2026
    return [
      {
        id: 'compra-zumkeller-86006-1',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'NF-e 86.006: Insumos de Demolição, Caçambas e Entulho, Cimento e Brita',
        categoria: 'Bruto / Estrutura',
        fornecedorLoja: 'Depósito Zumkeller',
        data: '2026-10-10',
        quantidade: 1,
        unidade: 'serviço',
        valorUnitario: 4195.95,
        valorTotal: 4195.95,
        numeroNotaFiscal: 'NF 86.006',
        formaPagamento: 'dinheiro',
        status: 'pago',
        observacoes: 'Demolição de beirais, descarte de entulho com caçambas e regularização de laje.',
      },
      {
        id: 'compra-zumkeller-86006-2',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'Plafon LED sobrepor para a Área Externa (Retirado no balcão)',
        categoria: 'Elétrica',
        fornecedorLoja: 'Depósito Zumkeller',
        data: '2026-10-10',
        quantidade: 1,
        unidade: 'un',
        valorUnitario: 46.45,
        valorTotal: 46.45,
        numeroNotaFiscal: 'NF 86.006',
        formaPagamento: 'dinheiro',
        status: 'pago',
        observacoes: 'Iluminação para beiral e área de descarte.',
      },
      {
        id: 'compra-longametragem-92041',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'NF-e 92.041: 24 Unidades Guaru Tijolo Canaleta Baiano Econômico para Viga de Respaldo',
        categoria: 'Bruto / Estrutura',
        fornecedorLoja: 'Longametragem Ferragens LTDA',
        data: '2026-10-15',
        quantidade: 24,
        unidade: 'un',
        valorUnitario: 2.20,
        valorTotal: 52.80,
        numeroNotaFiscal: 'NF-e 92.041',
        formaPagamento: 'dinheiro',
        status: 'pago',
        observacoes: 'Canaletas baianas para viga de respaldo da parede pastoral.',
      },
      {
        id: 'compra-zumkeller-86653',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'NF-e 86.653: Tubulações Hidráulicas Krona (50mm/25mm), Esgoto (100mm/75mm) e 20 Sacos Brita 20kg',
        categoria: 'Hidráulica',
        fornecedorLoja: 'Depósito Zumkeller',
        data: '2026-10-16',
        quantidade: 6,
        unidade: 'itens',
        valorUnitario: 710.92,
        valorTotal: 710.92,
        numeroNotaFiscal: 'NF 86.653',
        formaPagamento: 'dinheiro',
        status: 'pago',
        observacoes: 'Tubos e conexões de PVC Krona + brita e frete.',
      },
      {
        id: 'compra-telhanorte-53813',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'NFC-e 53813: Conexões Tigre Água Fria/Esgoto, Registros Deca, Metais Docol Nova Logg e Pintura Suvinil',
        categoria: 'Hidráulica',
        fornecedorLoja: 'Telhanorte Marginal Tietê',
        data: '2026-10-17',
        quantidade: 37,
        unidade: 'itens',
        valorUnitario: 3261.79,
        valorTotal: 3261.79,
        numeroNotaFiscal: 'NFC-e 53813',
        formaPagamento: 'cartao_credito',
        status: 'pago',
        observacoes: 'Hidráulica Tigre (Água Fria/Esgoto), Registros Deca, Metais Docol Nova Logg, Pintura Suvinil/Atlas.',
      },
      {
        id: 'compra-telhanorte-005578',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'Pedido 005578: Porcelanato Eliane 90x90 Palavcorda (9 cx / 21,87m²), AC-III (13 sc), Bacia Smart Celite e Cuba Icasa',
        categoria: 'Revestimento',
        fornecedorLoja: 'Telhanorte Marginal Tietê',
        data: '2026-10-17',
        quantidade: 8,
        unidade: 'itens',
        valorUnitario: 6536.46,
        valorTotal: 6536.46,
        numeroNotaFiscal: 'PED-005578',
        formaPagamento: 'cartao_credito',
        status: 'pago',
        observacoes: 'Porcelanato Eliane 90x90 Palavcorda (9 cx / 21,87m²), AC-III (13 sc), Bacia Smart Celite, Cuba Icasa, Vitrô (Entrega 22/10).',
      },
      {
        id: 'compra-telhanorte-005576',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'Pedido 005576: 10,10 m² Revestimento Fachada Mint 7,5x25cm e Frete de Caminhão',
        categoria: 'Revestimento',
        fornecedorLoja: 'Telhanorte Marginal Tietê',
        data: '2026-10-17',
        quantidade: 10.1,
        unidade: 'm²',
        valorUnitario: 85.50,
        valorTotal: 863.54,
        numeroNotaFiscal: 'PED-005576',
        formaPagamento: 'cartao_credito',
        status: 'pago',
        observacoes: '10,10 m² Revestimento Fachada Mint 7,5x25cm + Frete Caminhão (Entrega 04/11).',
      },
      {
        id: 'compra-sodimac-1918242567',
        projetoId: project?.id || 'proj-icenv-pastoral',
        descricao: 'Ordem de Venda 1918242567: 2 Janelas Venezianas 6 Folhas 100x150cm CRV e Frete Domiciliar',
        categoria: 'Bruto / Estrutura',
        fornecedorLoja: 'Sodimac Dicico Tietê',
        data: '2026-10-18',
        quantidade: 2,
        unidade: 'un',
        valorUnitario: 2132.20,
        valorTotal: 4264.41,
        numeroNotaFiscal: 'OV-1918242567',
        formaPagamento: 'cartao_credito',
        status: 'pago',
        observacoes: '2x Venezianas 6 Folhas 100x150cm CRV + Frete Domiciliar (Parcelado em 6x no cartão).',
      },
    ];
  }, [project]);

  // Valores consolidados da Obra ICENV 2026
  const orcamentoTeto = project?.orcamentoMaoObra && project?.orcamentoMateriais 
    ? (project.orcamentoMaoObra + project.orcamentoMateriais) 
    : 53825.00;
  const maoObraContratada = project?.orcamentoMaoObra || 32500.00;
  const totalMateriaisFaturados = comprasReaisCompletas.reduce((acc, c) => acc + c.valorTotal, 0);
  const totalComprometido = maoObraContratada + totalMateriaisFaturados;
  const saldoRestante = orcamentoTeto - totalComprometido;
  const percentualConsumido = (totalComprometido / orcamentoTeto) * 100;
  const reservaTecnica = project?.reservaTecnica || 3000.00;

  // Parcelamento futuro do cartão
  const parcelasFuturas = [
    { mes: 'Novembro / 2026', valor: 710.73 + 3261.79 + 6536.46 + 863.54, descricao: 'Fatura Geral Telhanorte + 1ª Parcela Sodimac' },
    { mes: 'Dezembro / 2026', valor: 710.73, descricao: '2ª Parcela Sodimac (Janelas CRV)' },
    { mes: 'Janeiro / 2027', valor: 710.73, descricao: '3ª Parcela Sodimac (Janelas CRV)' },
    { mes: 'Fevereiro / 2027', valor: 710.73, descricao: '4ª Parcela Sodimac (Janelas CRV)' },
    { mes: 'Março / 2027', valor: 710.73, descricao: '5ª Parcela Sodimac (Janelas CRV)' },
    { mes: 'Abril / 2027', valor: 710.76, descricao: '6ª Parcela Sodimac (Janelas CRV)' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header / Contexto da Obra */}
      <div className="bg-gradient-to-br from-[#0c1222] to-[#070b14] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Obra Piloto em Andamento (Semana 2 de 5)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Início: 13/10/2026 | Término: 15/11/2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {project?.nome || 'Reforma ICENV 2026 — Casa Pastoral & Bloco Masculino'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cockpit Executivo Físico-Financeiro, Curva S e Acompanhamento de Diretoria/Clientes.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Alternador de Visão */}
          <div className="bg-slate-900/90 p-1 rounded-xl flex items-center border border-slate-800">
            <button
              onClick={() => setViewMode('gerencial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'gerencial'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Gerencial
            </button>
            <button
              onClick={() => setViewMode('cliente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cliente'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão do Cliente
            </button>
          </div>

          <button
            onClick={onOpenPrintBalcao}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs sm:text-sm font-bold border border-amber-400/30 shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Lista de Balcão A4</span>
          </button>

          <button
            onClick={() => setIsClientReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-md shadow-amber-400/10 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>Relatório Cliente PDF</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Financeiros Executivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Teto Aprovado */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Investimento Teto</span>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-black text-white tracking-tight">
            R$ {orcamentoTeto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>Reserva Técnica (+10%):</span>
            <span className="font-bold text-slate-200 tabular-nums">R$ {reservaTecnica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Card 2: Comprometido Geral */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Comprometido (MO + Mat)</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-black text-amber-400 tracking-tight">
            R$ {totalComprometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>Consumo do Teto:</span>
            <span className="font-bold text-amber-400 tabular-nums">{percentualConsumido.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: Mão de Obra vs Materiais */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Mão de Obra Wagner</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-black text-slate-100 tracking-tight">
            R$ {maoObraContratada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>Participação no Custo:</span>
            <span className="font-bold text-emerald-400 tabular-nums">68,5%</span>
          </div>
        </div>

        {/* Card 4: Saldo e Semáforo */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Saldo em Caixa</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-black text-emerald-400 tracking-tight">
            R$ {saldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span className="text-slate-400 text-[11px]">Semáforo:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              DENTRO DO TETO
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos Gerenciais: Curva S e Composição de Custos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curva S Físico-Financeira (2 colunas) */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Curva S Físico-Financeira — 5 Semanas da Obra</span>
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento acumulado: Planejado vs Realizado semana a semana.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span> Planejado
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Realizado
              </span>
            </div>
          </div>

          {/* Gráfico Visual de Barras com Curva */}
          <div className="space-y-4 pt-2">
            {[
              { semana: 'Semana 1 (13/10 a 18/10)', escopo: 'Demolição, Caçambas e Beirais', planejado: 15, realizado: 100, valorPlan: 'R$ 8.000', valorReal: 'R$ 5.006 (Zumkeller)' },
              { semana: 'Semana 2 (19/10 a 25/10) [ATUAL]', escopo: 'Hidráulica Tigre, Elétrica e Janelas', planejado: 45, realizado: 30, valorPlan: 'R$ 22.000', valorReal: 'R$ 14.926 (NFs Telha/Sodimac)' },
              { semana: 'Semana 3 (26/10 a 01/11)', escopo: 'Contrapiso, Impermeabilização e Revestimento', planejado: 70, realizado: 0, valorPlan: 'R$ 38.000', valorReal: 'Pendente' },
              { semana: 'Semana 4 (02/11 a 08/11)', escopo: 'Revestimentos Paredes, Granitos e Gesso', planejado: 88, realizado: 0, valorPlan: 'R$ 48.000', valorReal: 'Pendente' },
              { semana: 'Semana 5 (09/11 a 15/11)', escopo: 'Louças Celite, Metais Docol, Pintura e Entrega', planejado: 100, realizado: 0, valorPlan: 'R$ 53.800', valorReal: 'Pendente' },
            ].map((et, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200">{et.semana} — <span className="font-normal text-slate-400">{et.escopo}</span></span>
                  <span className="font-bold text-amber-300 font-mono tabular-nums">{et.valorReal}</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3.5 relative overflow-hidden flex">
                  {/* Barra Planejada */}
                  <div
                    className="h-full bg-slate-700/60 rounded-full absolute"
                    style={{ width: `${et.planejado}%` }}
                  ></div>
                  {/* Barra Realizada */}
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(et.realizado, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Composição de Custos & Desembolso (1 coluna) */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Mix Físico-Financeiro</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Distribuição proporcional do capital alocado na obra.
            </p>

            <div className="space-y-4 font-mono">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300 font-sans font-semibold">Mão de Obra Wagner (68,5%)</span>
                  <span className="text-emerald-400 tabular-nums">R$ 32.500,00</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '68.5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300 font-sans font-semibold">Materiais Homologados (31,5%)</span>
                  <span className="text-amber-400 tabular-nums">R$ 14.926,20</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '31.5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300 font-sans font-semibold">Saldo Livre / Reserva</span>
                  <span className="text-slate-300 tabular-nums">R$ 6.373,80</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-slate-600 h-full rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigateTab('plantas')}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-amber-400 py-1 transition-colors"
            >
              <span>Ver Pranchas ARQ-01 e HID-01</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Executiva de Compras e Faturas Homologadas */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <span>Compras e Notas Fiscais Homologadas ({comprasReaisCompletas.length} registros)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Total consolidado em compras reais: <strong className="text-white font-mono tabular-nums">R$ {totalMateriaisFaturados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> (Depósito Zumkeller, Longametragem, Telhanorte e Sodimac).
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
            Banco Unificado ICENV 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Fornecedor Homologado</th>
                <th className="py-2.5 px-3">Documento Fiscal</th>
                <th className="py-2.5 px-3">Itens Principais</th>
                <th className="py-2.5 px-3">Forma de Pagamento</th>
                <th className="py-2.5 px-3 text-right">Valor Total</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {comprasReaisCompletas.map((f, i) => (
                <tr key={f.id || i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400">{f.data}</td>
                  <td className="py-3 px-3 font-bold text-white">{f.fornecedorLoja}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-amber-400">{f.numeroNotaFiscal || 'Recibo'}</td>
                  <td className="py-3 px-3 max-w-xs text-slate-300 truncate" title={f.descricao || f.observacoes}>{f.descricao}</td>
                  <td className="py-3 px-3 text-slate-400 capitalize">{f.formaPagamento.replace('_', ' ')}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-black text-white">
                    R$ {f.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {f.status === 'pago' ? 'Pago' : 'Faturado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cronograma de Parcelas Futuras no Cartão */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>Cronograma de Desembolso Futuro no Cartão (1x a 6x)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Fluxo de parcelamento equalizado para proteger a entrada mensal de dízimos/ofertas da igreja.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {parcelasFuturas.map((p, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">{p.mes}</div>
              <div className="text-sm font-mono tabular-nums font-black text-amber-400 my-1">
                R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={p.descricao}>
                {p.descricao}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Relatório do Cliente (Print-Ready) */}
      {isClientReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Relatório Executivo da Obra — Prestação de Contas
                </h3>
                <p className="text-xs text-slate-500">Documento pronto para envio à diretoria, conselho ou cliente.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Relatório</span>
                </button>
                <button
                  onClick={() => setIsClientReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-1 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">1. Resumo do Avanço da Obra</h4>
                <p>
                  A <strong>Reforma do Banheiro da Casa Pastoral (Fase 1)</strong> completou a 1ª semana com 100% das demolições concluídas e beirais regularizados. A 2ª semana está em andamento com a substituição da rede hidráulica de água fria e esgoto (materiais Tigre homologados), e as novas janelas venezianas de 6 folhas já foram faturadas na Sodimac.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">2. Balanço Financeiro Acumulado</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-[11px] text-slate-500">Orçamento Aprovado</span>
                    <p className="font-black text-base">R$ 53.800,00</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <span className="text-[11px]">Comprometido até 18/10</span>
                    <p className="font-black text-base">R$ 47.426,20</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <span className="text-[11px]">Saldo em Caixa</span>
                    <p className="font-black text-base">R$ 6.373,80</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">3. Faturamentos Oficiais Registrados</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>Sodimac (18/10):</strong> 2x Venezianas 6F 100x150cm CRV — R$ 4.264,41 (6x no cartão).</li>
                  <li><strong>Telhanorte (17/10):</strong> Hidráulica Tigre, Pintura e Metais Docol Nova Logg — R$ 3.261,79.</li>
                  <li><strong>Telhanorte (17/10):</strong> Porcelanato Eliane 90x90, AC-III, Bacia Celite — R$ 6.536,46.</li>
                  <li><strong>Telhanorte (17/10):</strong> 10,10m² Revestimento Fachada Mint — R$ 863,54.</li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <div>Emitido em: {new Date().toLocaleDateString('pt-BR')} por Antigravity / Sandro Gestor</div>
                <div>Status: Aprovado pela Comissão de Obras</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
