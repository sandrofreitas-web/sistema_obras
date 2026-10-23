import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Store,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  RefreshCw,
  Eye,
  FileCode,
  Check,
} from 'lucide-react';
import { Projeto, NotaFiscalExtraida, ItemNotaFiscalExtraido, ItemProjeto, CompraReal } from '../types';
import { storageService } from '../services/storageService';

interface InvoiceIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
}

type Step = 'upload' | 'processing' | 'review';

export const InvoiceIngestionModal: React.FC<InvoiceIngestionModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onProjectUpdated,
}) => {
  if (!isOpen || !activeProject) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do fluxo
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('Iniciando análise agêntica...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dados extraídos da NF
  const [extractedData, setExtractedData] = useState<NotaFiscalExtraida>({
    sucesso: true,
    metodoExtracao: 'ia_multimodal',
    fornecedorNome: '',
    cnpj: '',
    numeroNf: '',
    serie: '',
    chaveAcesso: '',
    dataCompra: new Date().toISOString().split('T')[0],
    valorTotal: 0,
    valorFrete: 0,
    valorDesconto: 0,
    formaPagamentoSugerida: 'cartao_credito',
    itens: [],
    confiancaGeral: 0.95,
  });

  const [parcelas, setParcelas] = useState<number>(1);

  // Lista de itens planejados do cenário ativo para conciliação ("De-Para")
  const currentScenario =
    activeProject.cenarios.find((c) => c.id === activeProject.cenarioAtivoId) ||
    activeProject.cenarios[0];
  const plannedItems: ItemProjeto[] = currentScenario ? currentScenario.itens : [];

  // Reset do modal
  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setErrorMessage(null);
    setExtractedData({
      sucesso: true,
      metodoExtracao: 'ia_multimodal',
      fornecedorNome: '',
      dataCompra: new Date().toISOString().split('T')[0],
      valorTotal: 0,
      formaPagamentoSugerida: 'cartao_credito',
      itens: [],
      confiancaGeral: 0.95,
    });
    setParcelas(1);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);

    // Gera preview local se for imagem
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    // Inicia processamento agêntico
    processFile(file);
  };

  const processFile = async (file: File) => {
    setStep('processing');
    setProcessingStatus('Enviando documento para o Agente Multimodal...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (activeProject) {
        formData.append('projeto_id', activeProject.id);
      }

      setProcessingStatus('Executando extração de dados fiscais (DANFE / NFC-e / SAT)...');

      // Tenta chamar o endpoint no backend
      let response: Response | null = null;
      try {
        response = await fetch('/api/financeiro/compras/ingest-nf', {
          method: 'POST',
          body: formData,
        });
      } catch (networkErr) {
        // Fallback para localhost direto se proxy não estiver ativo
        try {
          response = await fetch('http://localhost:8080/api/financeiro/compras/ingest-nf', {
            method: 'POST',
            body: formData,
          });
        } catch {
          response = null;
        }
      }

      if (response) {
        if (response.ok) {
          setProcessingStatus('Reconciliando itens com a WBS e EAP da obra...');
          const data = await response.json();
          setExtractedData({
            sucesso: data.sucesso,
            metodoExtracao: data.metodo_extracao,
            fornecedorNome: data.fornecedor_nome || 'Fornecedor Local',
            cnpj: data.cnpj || '',
            numeroNf: data.numero_nf || '',
            serie: data.serie || '',
            chaveAcesso: data.chave_acesso || '',
            dataCompra: data.data_compra || new Date().toISOString().split('T')[0],
            valorTotal: data.valor_total || 0,
            valorFrete: data.valor_frete || 0,
            valorDesconto: data.valor_desconto || 0,
            formaPagamentoSugerida: data.forma_pagamento_sugerida || 'cartao_credito',
            itens: (data.itens || []).map((it: any, idx: number) => ({
              id: it.id || `item-${idx + 1}`,
              descricao: it.descricao || 'Item Faturado',
              quantidade: it.quantidade || 1,
              unidade: it.unidade || 'un',
              valorUnitario: it.valor_unitario || 0,
              valorTotal: it.valor_total || 0,
              codigoProduto: it.codigo_produto,
              ncm: it.ncm,
              categoriaSugerida: it.categoria_sugerida || 'Materiais',
              itemProjetoIdSugerido: it.item_projeto_id_sugerido || '',
              itemProjetoNomeSugerido: it.item_projeto_nome_sugerido || '',
              confiancaMatching: it.confianca_matching || 0,
            })),
            confiancaGeral: data.confianca_geral || 0.95,
            observacoes: data.observacoes || '',
            arquivoNome: file.name,
          });
          setStep('review');
          return;
        } else {
          let errorDetail = `Erro HTTP ${response.status}`;
          try {
            const errJson = await response.json();
            if (errJson.detail) errorDetail = errJson.detail;
          } catch {}
          throw new Error(errorDetail);
        }
      }

      // Se não houver servidor acessível
      throw new Error('Servidor backend indisponível para processamento da Nota Fiscal.');
      setExtractedData(fallbackResult);
      setStep('review');
    } catch (err: any) {
      console.error('Erro na ingestão:', err);
      setErrorMessage(`Não foi possível processar automaticamente o arquivo: ${err.message || 'Erro desconhecido'}`);
      setStep('upload');
    }
  };

  // Motor de Contingência Client-Side se a API estiver offline
  const simulateClientSideExtraction = (file: File, itemsWbs: ItemProjeto[]): NotaFiscalExtraida => {
    const fName = file.name.toLowerCase();
    let forn = 'Fornecedor Local';
    if (fName.includes('telhanorte')) forn = 'Telhanorte';
    else if (fName.includes('sodimac')) forn = 'Sodimac';
    else if (fName.includes('jer')) forn = 'JER Materiais de Construção';
    else if (fName.includes('leroy')) forn = 'Leroy Merlin';

    const mockItems: ItemNotaFiscalExtraido[] = [
      {
        id: 'item-1',
        descricao: `Material faturado ref. ${file.name.replace(/\.[^/.]+$/, '')}`,
        quantidade: 1,
        unidade: 'un',
        valorUnitario: 0,
        valorTotal: 0,
        categoriaSugerida: 'Materiais',
        itemProjetoIdSugerido: itemsWbs[0]?.id || '',
        itemProjetoNomeSugerido: itemsWbs[0]?.materialNome || '',
        confiancaMatching: 0.8,
      },
    ];

    return {
      sucesso: true,
      metodoExtracao: 'fallback',
      fornecedorNome: forn,
      cnpj: '61.748.125/0001-90',
      numeroNf: `NF-${Math.floor(100000 + Math.random() * 900000)}`,
      dataCompra: new Date().toISOString().split('T')[0],
      valorTotal: 0,
      valorFrete: 0,
      valorDesconto: 0,
      formaPagamentoSugerida: 'cartao_credito',
      itens: mockItems,
      confiancaGeral: 0.75,
      observacoes: 'Documento importado no canteiro. Ajuste os valores finais antes de confirmar.',
      arquivoNome: file.name,
    };
  };

  // Atualizações no formulário de conferência
  const handleItemChange = (index: number, field: keyof ItemNotaFiscalExtraido, value: any) => {
    const updatedItens = [...extractedData.itens];
    const current = { ...updatedItens[index], [field]: value };

    // Recalcula valor total se alterar quantidade ou valor unitário
    if (field === 'quantidade' || field === 'valorUnitario') {
      const q = field === 'quantidade' ? Number(value) : current.quantidade;
      const u = field === 'valorUnitario' ? Number(value) : current.valorUnitario;
      current.valorTotal = Math.round(q * u * 100) / 100;
    }

    updatedItens[index] = current;

    // Atualiza valor total da nota se for a soma dos itens
    const newTotal = updatedItens.reduce((sum, it) => sum + (it.valorTotal || 0), 0);

    setExtractedData({
      ...extractedData,
      itens: updatedItens,
      valorTotal: Math.round((newTotal + (extractedData.valorFrete || 0) - (extractedData.valorDesconto || 0)) * 100) / 100,
    });
  };

  const handleAddItem = () => {
    const newItem: ItemNotaFiscalExtraido = {
      id: `manual-item-${Date.now()}`,
      descricao: '',
      quantidade: 1,
      unidade: 'un',
      valorUnitario: 0,
      valorTotal: 0,
      categoriaSugerida: 'Materiais',
    };
    setExtractedData({
      ...extractedData,
      itens: [...extractedData.itens, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItens = extractedData.itens.filter((_, i) => i !== index);
    const newTotal = updatedItens.reduce((sum, it) => sum + (it.valorTotal || 0), 0);
    setExtractedData({
      ...extractedData,
      itens: updatedItens,
      valorTotal: Math.round((newTotal + (extractedData.valorFrete || 0) - (extractedData.valorDesconto || 0)) * 100) / 100,
    });
  };

  // Confirmação final e persistência
  const handleConfirmPurchase = async () => {
    if (!extractedData.fornecedorNome || extractedData.valorTotal <= 0) {
      alert('Por favor, informe o fornecedor e o valor total da compra.');
      return;
    }

    // 1. Tenta sincronizar com o backend
    try {
      await fetch('/api/financeiro/compras/confirm-nf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto_id: activeProject.id,
          fornecedor_nome: extractedData.fornecedorNome,
          cnpj: extractedData.cnpj,
          numero_nf: extractedData.numeroNf,
          data_compra: extractedData.dataCompra,
          valor_total: extractedData.valorTotal,
          valor_frete: extractedData.valorFrete || 0,
          valor_desconto_geral: extractedData.valorDesconto || 0,
          forma_pagamento: extractedData.formaPagamentoSugerida,
          quantidade_parcelas: parcelas,
          observacoes: extractedData.observacoes,
          itens: extractedData.itens,
        }),
      });
    } catch {
      // Ignora erro de rede e continua no storage local
    }

    // 2. Persistência local garantida no storageService
    const novaCompra: Omit<CompraReal, 'id'> = {
      projetoId: activeProject.id,
      descricao: `NF ${extractedData.numeroNf || 'S/N'} • ${extractedData.fornecedorNome} (${extractedData.itens.length} itens)`,
      categoria: extractedData.itens[0]?.categoriaSugerida || 'Materiais',
      fornecedorLoja: extractedData.fornecedorNome,
      data: extractedData.dataCompra,
      quantidade: extractedData.itens.reduce((acc, it) => acc + (it.quantidade || 1), 0),
      unidade: 'un',
      valorUnitario: extractedData.valorTotal,
      valorTotal: extractedData.valorTotal,
      valorPlanejado: extractedData.valorTotal,
      numeroNotaFiscal: extractedData.numeroNf || undefined,
      formaPagamento: extractedData.formaPagamentoSugerida,
      status: 'pago',
      observacoes: extractedData.observacoes,
      chaveAcesso: extractedData.chaveAcesso,
      valorFrete: extractedData.valorFrete,
      valorDesconto: extractedData.valorDesconto,
      itensFaturados: extractedData.itens,
    };

    const updatedProject = storageService.addRealPurchase(activeProject.id, novaCompra);

    if (updatedProject) {
      // Marca os itens da WBS vinculados como comprados
      const matchedIds = new Set(
        extractedData.itens
          .map((it) => it.itemProjetoIdSugerido)
          .filter((id): id is string => Boolean(id))
      );

      if (matchedIds.size > 0) {
        const updatedCenarios = updatedProject.cenarios.map((cen) => ({
          ...cen,
          itens: cen.itens.map((it) =>
            matchedIds.has(it.id) ? { ...it, comprado: true } : it
          ),
        }));
        const finalProject = { ...updatedProject, cenarios: updatedCenarios };
        storageService.saveProject(finalProject);
        onProjectUpdated(finalProject);
      } else {
        onProjectUpdated(updatedProject);
      }
    }

    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 selection:bg-amber-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header do Modal */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Ingestão Agêntica de Notas & Cupons Fiscais
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  Multimodal IA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extração automática de DANFE, cupom térmico (NFC-e / SAT) e XML com conciliação na WBS
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/70 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Conteúdo Dinâmico por Etapa */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ETAPA 1: UPLOAD / DRAG & DROP */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-amber-400 bg-amber-400/5 scale-[0.99]'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-amber-400 shadow-inner">
                  <UploadCloud className="w-7 h-7 stroke-[2.2]" />
                </div>

                <h3 className="text-sm font-bold text-slate-100 mb-1">
                  Arraste a Nota Fiscal / Cupom ou clique para selecionar
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Suporta <strong>PDFs de DANFE</strong>, <strong>fotos de bobina térmica (NFC-e / SAT)</strong> tiradas no canteiro e arquivos <strong>XML</strong> oficiais da SEFAZ.
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-mono text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Formatos: PDF, JPG, PNG, WEBP, XML</span>
                </div>
              </div>

              {/* Badges dos Fornecedores Homologados */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 text-xs">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                  Formatos e Lojas Pré-calibrados:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <Store className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Telhanorte (NF-e/PDF)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <Store className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Sodimac (DANFE/Cupom)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <Store className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>JER Materiais (Cupom SAT)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>XML SEFAZ (Direto)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: PROCESSAMENTO DO AGENTE MULTIMODAL */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 animate-pulse">
                  <Sparkles className="w-8 h-8 fill-amber-400 animate-spin duration-1000" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Processando Documento com IA</h3>
                <p className="text-xs text-amber-300 font-mono animate-pulse">{processingStatus}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 3: CONFERÊNCIA & AUDITORIA DOS DADOS (HUMAN-IN-THE-LOOP) */}
          {step === 'review' && (
            <div className="space-y-5">
              {/* Banner de Origem da Extração */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    Extraído via{' '}
                    <strong className="text-white uppercase font-mono">
                      {extractedData.metodoExtracao === 'xml_sefaz'
                        ? 'XML Oficial SEFAZ'
                        : 'Agente Multimodal IA'}
                    </strong>
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  Precisão: {(extractedData.confiancaGeral * 100).toFixed(0)}%
                </span>
              </div>

              {/* Grid de Metadados Principais da NF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 text-xs">
                {/* Fornecedor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Fornecedor / Loja *
                  </label>
                  <input
                    type="text"
                    value={extractedData.fornecedorNome}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, fornecedorNome: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold outline-none focus:border-amber-400"
                  />
                </div>

                {/* Número da NF / Cupom */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Número NF / Cupom
                  </label>
                  <input
                    type="text"
                    value={extractedData.numeroNf || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, numeroNf: e.target.value })
                    }
                    placeholder="Ex: 001.294"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* Data de Emissão */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={extractedData.dataCompra}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, dataCompra: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Forma de Pagamento
                  </label>
                  <select
                    value={extractedData.formaPagamentoSugerida}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        formaPagamentoSugerida: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="pix">PIX (À Vista)</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="transferencia">Transferência</option>
                    <option value="dinheiro">Dinheiro em Espécie</option>
                  </select>
                </div>

                {/* Parcelas */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Parcelamento
                  </label>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value={1}>1x (À Vista)</option>
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={4}>4x</option>
                    <option value={5}>5x</option>
                    <option value={6}>6x</option>
                    <option value={10}>10x</option>
                  </select>
                </div>

                {/* Valor Total da Nota */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 font-mono">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.valorTotal || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, valorTotal: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-amber-400/60 rounded-lg px-2.5 py-1.5 text-sm font-black text-amber-400 outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Tabela de Itens Faturados com De-Para WBS */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                      Itens Faturados ({extractedData.itens.length})
                    </span>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="text-[11px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Adicionar Linha</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Item / Descrição da NF</th>
                        <th className="py-2 px-2 text-center w-16">Qtd</th>
                        <th className="py-2 px-2 text-center w-14">Un</th>
                        <th className="py-2 px-3 text-right w-24">V. Unit</th>
                        <th className="py-2 px-3 text-right w-28">Total</th>
                        <th className="py-2 px-3 w-52">Vínculo WBS (De-Para)</th>
                        <th className="py-2 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {extractedData.itens.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.descricao}
                              onChange={(e) => handleItemChange(idx, 'descricao', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-400 text-xs text-slate-200 outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              step="0.01"
                              value={it.quantidade}
                              onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                              className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-white font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="text"
                              value={it.unidade}
                              onChange={(e) => handleItemChange(idx, 'unidade', e.target.value)}
                              className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-300 font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={it.valorUnitario}
                              onChange={(e) => handleItemChange(idx, 'valorUnitario', e.target.value)}
                              className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs text-white font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 tabular-nums">
                            R$ {it.valorTotal.toFixed(2)}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={it.itemProjetoIdSugerido || ''}
                              onChange={(e) =>
                                handleItemChange(idx, 'itemProjetoIdSugerido', e.target.value)
                              }
                              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-400"
                            >
                              <option value="">-- Compra Avulsa / Geral --</option>
                              {plannedItems.map((pi) => (
                                <option key={pi.id} value={pi.id}>
                                  {pi.materialNome} (Orçado: R$ {pi.precoTotal.toFixed(2)})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remover linha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botões de Ação Final */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Trocar Documento</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPurchase}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar e Lançar no Caixa da Obra</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
