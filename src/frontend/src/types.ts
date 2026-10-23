/**
 * Types according to the "Prontuário do Produto — App de Materiais de Construção e Reformas"
 */

export type UnidadeMedida = 'm²' | 'cx' | 'un' | 'kg' | 'litro' | 'm' | 'saco' | 'rolo' | 'par' | 'lata' | 'peça';

export interface PrecoCaptura {
  id: string;
  materialId: string;
  preco: number;
  unidade: UnidadeMedida | string;
  precoPorEmbalagem?: number;
  coberturaPorEmbalagem?: number;
  loja: string;
  cidade?: string;
  data: string; // ISO format
  fotoEtiqueta?: string;
  confiancaOCR?: number;
  observacoes?: string;
}

export interface Material {
  id: string;
  nome: string;
  fabricante: string;
  modelo: string;
  codigoBarras?: string;
  classe: string;       // ex: Revestimento, Hidráulica
  categoria: string;    // ex: Piso, Parede, Metais Sanitários
  tipo: string;         // ex: Porcelanato Polido, Argamassa ACIII
  unidade: UnidadeMedida | string;
  precoAtual: number;
  precoPorEmbalagem?: number;
  coberturaPorEmbalagem?: number; // m² por caixa ou m² por galão
  lojaAtual: string;
  fotoPrincipal?: string;
  fotos?: string[];
  especificacoes?: Record<string, string>;
  observacoes?: string;
  status: 'catalogo' | 'selecionado';
  historicoPrecos: PrecoCaptura[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface TaxonomiaTipo {
  id: string;
  nome: string;
}

export interface TaxonomiaCategoria {
  id: string;
  nome: string;
  tipos: TaxonomiaTipo[];
}

export interface TaxonomiaClasse {
  id: string;
  nome: string;
  icone?: string;
  categorias: TaxonomiaCategoria[];
}

export interface Loja {
  id: string;
  nome: string;
  rede?: string;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  tipoParceiro?: string;
  especialidade?: string;
  status?: string;
  historico2024?: number;
  cnpj?: string;
}

export interface ItemProjeto {
  id: string;
  ambienteId: string;
  cenarioId: string;
  materialId: string;
  materialNome: string;
  fabricante: string;
  classe: string;
  categoria: string;
  tipo: string;
  unidade: UnidadeMedida | string;
  quantidadeBase: number; // área bruta ou quantidade
  perdaTecnicaPercent: number; // ex: 10%
  quantidadeComPerda: number;
  precoUnitario: number;
  precoTotal: number;
  lojaReferencia?: string;
  observacoes?: string;
  etapaId?: string;
  comprado?: boolean;
}

export interface Cenario {
  id: string;
  projetoId: string;
  nome: string; // ex: "Econômico / Essencial", "Padrão / Custo-Benefício", "Premium / Alto Padrão"
  descricao?: string;
  corTag?: string; // hex ou tailwind color
  itens: ItemProjeto[];
}

export interface Ambiente {
  id: string;
  projetoId: string;
  nome: string; // ex: "Cozinha", "Banheiro Suíte", "Sala de Estar"
  areaPisoM2: number;
  areaParedesM2?: number;
  perimetroM?: number;
  observacoes?: string;
}

export interface CompraReal {
  id: string;
  projetoId: string;
  itemProjetoId?: string;
  descricao: string;
  categoria: string;
  ambienteId?: string;
  fornecedorLoja: string;
  data: string; // ISO YYYY-MM-DD
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  valorPlanejado?: number; // Para cálculo de desvio
  numeroNotaFiscal?: string;
  fotoComprovante?: string;
  formaPagamento: 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'dinheiro';
  status: 'pago' | 'agendado' | 'pendente';
  observacoes?: string;
  chaveAcesso?: string;
  valorFrete?: number;
  valorDesconto?: number;
  itensFaturados?: ItemNotaFiscalExtraido[];
}

export interface ItemNotaFiscalExtraido {
  id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  codigoProduto?: string;
  ncm?: string;
  categoriaSugerida?: string;
  itemProjetoIdSugerido?: string;
  itemProjetoNomeSugerido?: string;
  confiancaMatching?: number;
}

export interface NotaFiscalExtraida {
  sucesso: boolean;
  metodoExtracao: 'xml_sefaz' | 'ia_multimodal' | 'fallback';
  fornecedorNome: string;
  cnpj?: string;
  numeroNf?: string;
  serie?: string;
  chaveAcesso?: string;
  dataCompra: string; // YYYY-MM-DD
  valorTotal: number;
  valorFrete?: number;
  valorDesconto?: number;
  formaPagamentoSugerida: 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'dinheiro';
  itens: ItemNotaFiscalExtraido[];
  confiancaGeral: number;
  observacoes?: string;
  arquivoNome?: string;
}

export interface FotoDiario {
  id: string;
  etapaId: string;
  ambienteId?: string;
  data: string;
  fotoUrl: string;
  legenda: string;
}

export interface EtapaObra {
  id: string;
  projetoId: string;
  nome: string;
  ordem: number;
  percentualAvanco: number; // 0 a 100
  dataInicioEstimada?: string;
  dataFimEstimada?: string;
  status: 'nao_iniciada' | 'em_andamento' | 'concluida';
  observacoes?: string;
  fotosDiario: FotoDiario[];
}

export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  cliente?: string;
  pastaDocumentos?: string;
  orcamentoMaoObra?: number;
  orcamentoMateriais?: number;
  orcamentoTeto?: number;
  reservaTecnica?: number;
  areaTotalM2: number;
  dataInicio: string;
  dataPrevisao: string;
  status: 'planejamento' | 'em_andamento' | 'concluido' | 'pausado';
  contingenciaPercent: number; // ex: 10%
  cenarioAtivoId: string;
  cenarios: Cenario[];
  ambientes: Ambiente[];
  etapas: EtapaObra[];
  compras: CompraReal[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemFilaOffline {
  id: string;
  dataCaptura: string;
  imagemBase64: string;
  lojaSugerida?: string;
  status: 'pendente' | 'processando' | 'processado' | 'erro';
  erroMensagem?: string;
  dadosExtraidos?: Partial<Material>;
}

export interface OCRResult {
  fabricante: string;
  modelo: string;
  preco: number;
  unidade: string;
  precoPorEmbalagem?: number;
  coberturaPorEmbalagem?: number;
  codigoBarras?: string;
  loja?: string;
  classeSugerida?: string;
  categoriaSugerida?: string;
  tipoSugerido?: string;
  observacoes?: string;
  confianca?: number;
  isFallback?: boolean;
}

export interface VersaoPlanta {
  id: string;
  plantaId: string;
  revisao: string;
  dataEmissao: string;
  autorArquiteto?: string;
  aprovadorGestor?: string;
  status: 'Vigente' | 'Em Revisão' | 'Superada';
  arquivoPdfUrl?: string;
  notasAlteracao?: string;
  metadadosExtracao?: Record<string, any>;
}

export interface PlantaProjeto {
  id: string;
  projetoId: string;
  codigoPrancha: string;
  titulo: string;
  disciplina: string;
  arquivoUrl?: string;
  revisaoVigente: string;
  dataUltimaEmissao: string;
  versoes: VersaoPlanta[];
}

export interface ItemRequisicaoCampo {
  id: string;
  descricao_informal: string;
  qtd_solicitada: number;
  unidade_solicitada?: string;
  material_sugerido_id?: string;
  loja_sugerida_id?: number;
  loja_sugerida_nome?: string;
  status?: string;
}

export interface RequisicaoCampo {
  id: string;
  projeto_id?: string;
  remetente_nome: string;
  canal: string;
  texto_original: string;
  audio_url?: string;
  status: string;
  criado_em?: string;
  data_requisicao?: string;
  itens: ItemRequisicaoCampo[];
}

