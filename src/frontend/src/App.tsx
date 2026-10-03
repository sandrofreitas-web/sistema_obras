import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Store, 
  Layers, 
  Calendar, 
  DollarSign, 
  Camera, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Activity, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  HardHat,
  Sparkles,
  Upload,
  Check,
  RefreshCw,
  Tag,
  Box,
  Plus,
  Search,
  Smartphone,
  Image as ImageIcon,
  CheckCircle,
  TrendingDown,
  ArrowRight,
  Wifi,
  WifiOff,
  Database,
  CloudUpload
} from 'lucide-react';

interface Fornecedor {
  id: number;
  nome: string;
  tipo_parceiro: string;
  especialidade: string;
  historico_compras_2024: number;
  status: string;
}

interface ResumoObra {
  projeto: {
    nome: string;
    status: string;
    data_inicio: string;
    data_previsao_fim: string;
    orcamento_teto: number;
    orcamento_mao_obra: number;
    orcamento_materiais: number;
    reserva_tecnica: number;
    descricao: string;
  };
  ambientes: Array<{
    id: string;
    nome: string;
    area_piso: number;
    area_parede: number;
  }>;
  cronograma: Array<{
    id: string;
    semana: number;
    nome: string;
    data_inicio: string;
    data_fim: string;
    status: string;
    percentual: number;
  }>;
  mao_de_obra: Array<{
    prestador: string;
    escopo: string;
    valor_contratado: number;
    status: string;
  }>;
}

interface MaterialItem {
  id: string;
  descricao: string;
  fabricante: string | null;
  modelo_sku: string | null;
  categoria_id: number | null;
  categoria_classe: string | null;
  categoria_tipo: string | null;
  unidade_venda: string;
  fator_embalagem: number;
  ultimo_preco_vista: number | null;
  ultimo_preco_prazo: number | null;
  ultima_loja: string | null;
  data_ultima_captura: string | null;
}

interface CapturaItem {
  id: string;
  material_id: string;
  material_descricao: string;
  material_fabricante: string | null;
  fornecedor_id: number;
  fornecedor_nome: string;
  preco_vista: number;
  preco_prazo: number | null;
  data_captura: string;
  foto_etiqueta_url: string | null;
}

interface OfflineCaptura {
  id: string;
  fornecedor_id: number;
  fornecedor_nome: string;
  descricao: string;
  fabricante: string | null;
  modelo_sku: string | null;
  categoria_id: number | null;
  unidade_venda: string;
  fator_embalagem: number;
  preco_vista: number;
  preco_prazo: number | null;
  foto_etiqueta_url: string | null;
  timestamp: string;
}

// Exemplos pré-carregados de etiquetas reais para teste rápido
const EXEMPLOS_ETIQUETA = [
  {
    nome: 'Porcelanato Portobello 60x60 (Telhanorte)',
    lojaId: 2,
    texto: 'PORCELANATO RETIFICADO ESMALTADO BIANCO 60X60 ACETINADO PORTOBELLO COD 89412 R$ 68,90 M2 A PRAZO R$ 74,90 CX COM 2.16 M2',
    imagem: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80'
  },
  {
    nome: 'Cimento CP II-E-32 50kg (JER Depósito)',
    lojaId: 1,
    texto: 'CIMENTO TODAS AS OBRAS CP II-E-32 SACO 50KG VOTORAN COD 10293 R$ 33,50 A VISTA DINHEIRO PIX SACO 50KG',
    imagem: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80'
  },
  {
    nome: 'Bacia Sanitária Ecoflush (Leroy Merlin)',
    lojaId: 3,
    texto: 'BACIA SANITARIA COM CAIXA ACOPLADA 3/6L DUPLO ACIONAMENTO CELITE SAVEIRO BRANCO COD 45201 R$ 389,00 A VISTA R$ 429,00 A PRAZO',
    imagem: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'
  },
  {
    nome: 'Argamassa AC-III 20kg (JER Depósito)',
    lojaId: 1,
    texto: 'ARGAMASSA COLANTE AC-III CINZA INTERIOR E EXTERIOR QUARTZOLIT COD 77124 R$ 34,90 SACO 20KG',
    imagem: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState<'obra' | 'fornecedores' | 'taxonomia' | 'captura'>('captura');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [resumoObra, setResumoObra] = useState<ResumoObra | null>(null);
  const [taxonomia, setTaxonomia] = useState<Record<string, any[]>>({});
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [historicoCapturas, setHistoricoCapturas] = useState<CapturaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Módulo 1 (Captura e Cadastro)
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<number>(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [buscaMaterial, setBuscaMaterial] = useState<string>('');

  // Fila de Sincronização Offline (Armazenada no celular)
  const [offlineQueue, setOfflineQueue] = useState<OfflineCaptura[]>(() => {
    try {
      const saved = localStorage.getItem('obras_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Formulário assistido
  const [formDescricao, setFormDescricao] = useState('');
  const [formFabricante, setFormFabricante] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formUnidade, setFormUnidade] = useState('m²');
  const [formFator, setFormFator] = useState<number>(1.0);
  const [formPrecoVista, setFormPrecoVista] = useState<string>('');
  const [formPrecoPrazo, setFormPrecoPrazo] = useState<string>('');
  const [formCategoriaId, setFormCategoriaId] = useState<number | ''>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = '';

  const fetchData = async () => {
    try {
      setLoading(true);
      // Health Check
      const healthRes = await fetch(`${API_URL}/health`).catch(() => null);
      setApiOnline(healthRes && healthRes.ok ? true : false);

      // Fornecedores
      const fornRes = await fetch(`${API_URL}/api/v1/fornecedores`).catch(() => null);
      if (fornRes && fornRes.ok) {
        const data = await fornRes.json();
        setFornecedores(data);
        if (data.length > 0 && !selectedFornecedorId) {
          setSelectedFornecedorId(data[0].id);
        }
      }

      // Resumo da Obra
      const obraRes = await fetch(`${API_URL}/api/v1/resumo-obra-2026`).catch(() => null);
      if (obraRes && obraRes.ok) {
        setResumoObra(await obraRes.json());
      }

      // Taxonomia
      const taxRes = await fetch(`${API_URL}/api/v1/taxonomia`).catch(() => null);
      if (taxRes && taxRes.ok) {
        setTaxonomia(await taxRes.json());
      }

      // Materiais
      const matRes = await fetch(`${API_URL}/api/v1/materiais`).catch(() => null);
      if (matRes && matRes.ok) {
        setMateriais(await matRes.json());
      }

      // Histórico de capturas
      const capRes = await fetch(`${API_URL}/api/v1/precos-captura`).catch(() => null);
      if (capRes && capRes.ok) {
        setHistoricoCapturas(await capRes.json());
      }
    } catch (err) {
      console.error('Falha ao conectar com o backend:', err);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  // Disparo do Processamento OCR / IA Assistida
  const executarAnaliseOCR = async (textoInput?: string, imagemUrl?: string) => {
    try {
      setIsAnalyzing(true);
      setSaveMessage(null);
      const lojaAtual = fornecedores.find(f => f.id === selectedFornecedorId)?.nome || '';

      const res = await fetch(`${API_URL}/api/v1/captura/analisar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto_bruto: textoInput || ocrRawText,
          loja_sugerida: lojaAtual,
          imagem_base64: imagemUrl || previewImage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormDescricao(data.descricao || '');
        setFormFabricante(data.fabricante || '');
        setFormSku(data.modelo_sku || '');
        setFormUnidade(data.unidade_venda || 'un');
        setFormFator(data.fator_embalagem || 1.0);
        setFormPrecoVista(data.preco_vista ? data.preco_vista.toString() : '');
        setFormPrecoPrazo(data.preco_prazo ? data.preco_prazo.toString() : '');
        setFormCategoriaId(data.categoria_sugerida_id || '');
        setOcrConfidence(data.confianca_ocr || 0.9);
      }
    } catch (err) {
      console.error('Erro na análise OCR:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Carregar Exemplo Pré-Configurado de Gôndola
  const handleCarregarExemplo = (exemplo: typeof EXEMPLOS_ETIQUETA[0]) => {
    setSelectedFornecedorId(exemplo.lojaId);
    setOcrRawText(exemplo.texto);
    setPreviewImage(exemplo.imagem);
    executarAnaliseOCR(exemplo.texto, exemplo.imagem);
  };

  // Upload ou Câmera do Celular
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
        // Simular leitura OCR do arquivo carregado
        executarAnaliseOCR(`ETIQUETA FOTO ${file.name.toUpperCase()} R$ 68,90 COD ${Math.floor(10000 + Math.random() * 90000)} CX 2.14 M2`, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gravar no Catálogo & Histórico (Com suporte a Modo Offline)
  const handleSalvarCaptura = async () => {
    if (!formDescricao || !formPrecoVista || !selectedFornecedorId) {
      setSaveMessage({ tipo: 'erro', texto: 'Preencha a descrição, a loja e o preço à vista.' });
      return;
    }

    const payload = {
      fornecedor_id: Number(selectedFornecedorId),
      descricao: formDescricao,
      fabricante: formFabricante || null,
      modelo_sku: formSku || null,
      categoria_id: formCategoriaId ? Number(formCategoriaId) : null,
      unidade_venda: formUnidade,
      fator_embalagem: Number(formFator) || 1.0,
      preco_vista: parseFloat(formPrecoVista.replace(',', '.')),
      preco_prazo: formPrecoPrazo ? parseFloat(formPrecoPrazo.replace(',', '.')) : null,
      foto_etiqueta_url: previewImage || null
    };

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Tenta enviar para o servidor local se houver conexão
      let res: Response | null = null;
      try {
        res = await fetch(`${API_URL}/api/v1/captura/salvar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        res = null; // Servidor inacessível ou sem Wi-Fi
      }

      if (res && res.ok) {
        setSaveMessage({ tipo: 'sucesso', texto: '✅ Item cadastrado e preço registrado no banco de dados!' });
        fetchData();
        limparFormulario();
      } else {
        // Fallback: Gravação no Armazenamento Local do Celular (Modo Offline)
        const itemOffline: OfflineCaptura = {
          ...payload,
          id: 'off_' + Date.now(),
          fornecedor_nome: fornecedores.find(f => f.id === Number(selectedFornecedorId))?.nome || 'Loja',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        const novaFila = [itemOffline, ...offlineQueue];
        setOfflineQueue(novaFila);
        try {
          localStorage.setItem('obras_offline_queue', JSON.stringify(novaFila));
        } catch (e) {
          console.error('Falha ao gravar no localStorage:', e);
        }

        setSaveMessage({
          tipo: 'sucesso',
          texto: '📱 Gravado localmente no celular (Modo Offline)! O item será descarregado assim que conectar ao Wi-Fi.'
        });
        limparFormulario();
      }
    } catch (err) {
      console.error('Erro ao processar captura:', err);
      setSaveMessage({ tipo: 'erro', texto: 'Erro interno ao processar a captura.' });
    } finally {
      setIsSaving(false);
    }
  };

  const limparFormulario = () => {
    setTimeout(() => {
      setPreviewImage(null);
      setOcrRawText('');
      setFormDescricao('');
      setFormPrecoVista('');
      setFormPrecoPrazo('');
      setFormSku('');
    }, 2500);
  };

  // Sincronizar Fila Offline para o Banco de Dados Local ao Reconectar
  const handleSincronizarFilaOffline = async () => {
    if (offlineQueue.length === 0) return;
    try {
      setIsSyncing(true);
      setSaveMessage(null);

      const res = await fetch(`${API_URL}/api/v1/captura/sincronizar-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offlineQueue)
      });

      if (res.ok) {
        const data = await res.json();
        setOfflineQueue([]);
        localStorage.removeItem('obras_offline_queue');
        setSaveMessage({
          tipo: 'sucesso',
          texto: `🎉 Sincronização concluída! ${data.total_salvos} itens descarregados no banco de dados local com sucesso!`
        });
        fetchData();
      } else {
        setSaveMessage({ tipo: 'erro', texto: 'Falha ao sincronizar. Verifique se o computador com o banco está online.' });
      }
    } catch (err) {
      console.error('Falha ao conectar para sincronização:', err);
      setSaveMessage({ tipo: 'erro', texto: 'Não foi possível conectar ao banco de dados no computador via Wi-Fi.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Cálculo assistido de embalagem fechada
  const valorUnitarioVista = parseFloat(formPrecoVista.replace(',', '.')) || 0;
  const valorEmbalagemFechada = formFator > 1 ? valorUnitarioVista * formFator : valorUnitarioVista;

  const materiaisFiltrados = materiais.filter(m => 
    m.descricao.toLowerCase().includes(buscaMaterial.toLowerCase()) ||
    (m.fabricante && m.fabricante.toLowerCase().includes(buscaMaterial.toLowerCase())) ||
    (m.modelo_sku && m.modelo_sku.toLowerCase().includes(buscaMaterial.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      {/* Header Superior com Banner PWA Mobile */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--amber-gradient)',
            padding: '0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Building2 size={24} color="#090d16" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Sistema de Obras
              </h1>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--amber-primary)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                PWA Mobile
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              App de Gestão de Materiais, OCR e Canteiro
            </p>
          </div>
        </div>

        {/* Status da Conexão */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          padding: '0.4rem 0.8rem',
          borderRadius: '999px',
          fontSize: '0.78rem'
        }}>
          <Activity size={14} color={apiOnline ? 'var(--emerald-success)' : 'var(--rose-danger)'} />
          <span style={{ color: apiOnline ? 'var(--emerald-success)' : 'var(--rose-danger)', fontWeight: 600 }}>
            {apiOnline ? 'Online (Docker)' : 'Reconectando...'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>• v1.2</span>
        </div>
      </header>

      {/* Navegação por Abas (Otimizada para Toque no Celular) */}
      <nav style={{
        display: 'flex',
        gap: '0.4rem',
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '0.3rem',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          onClick={() => setActiveTab('captura')}
          style={{
            flex: 1,
            minWidth: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            background: activeTab === 'captura' ? 'var(--amber-gradient)' : 'transparent',
            color: activeTab === 'captura' ? '#090d16' : 'var(--text-muted)',
            boxShadow: activeTab === 'captura' ? 'var(--shadow-md)' : 'none'
          }}
        >
          <Camera size={16} />
          Captura em Loja
        </button>

        <button
          onClick={() => setActiveTab('obra')}
          style={{
            flex: 1,
            minWidth: '110px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: activeTab === 'obra' ? 'var(--amber-gradient)' : 'transparent',
            color: activeTab === 'obra' ? '#090d16' : 'var(--text-muted)',
            boxShadow: activeTab === 'obra' ? 'var(--shadow-md)' : 'none'
          }}
        >
          <HardHat size={16} />
          Obra 2026
        </button>

        <button
          onClick={() => setActiveTab('fornecedores')}
          style={{
            flex: 1,
            minWidth: '125px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: activeTab === 'fornecedores' ? 'var(--amber-gradient)' : 'transparent',
            color: activeTab === 'fornecedores' ? '#090d16' : 'var(--text-muted)',
            boxShadow: activeTab === 'fornecedores' ? 'var(--shadow-md)' : 'none'
          }}
        >
          <Store size={16} />
          Lojas Homologadas
        </button>

        <button
          onClick={() => setActiveTab('taxonomia')}
          style={{
            flex: 1,
            minWidth: '125px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: activeTab === 'taxonomia' ? 'var(--amber-gradient)' : 'transparent',
            color: activeTab === 'taxonomia' ? '#090d16' : 'var(--text-muted)',
            boxShadow: activeTab === 'taxonomia' ? 'var(--shadow-md)' : 'none'
          }}
        >
          <Layers size={16} />
          Taxonomia & Fator
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* ABA 1: CAPTURA & CADASTRO INTELIGENTE (MÓDULO 1 MOBILE-FIRST) */}
      {/* ========================================================================= */}
      {activeTab === 'captura' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Banner de Sincronização Offline & Armazenamento Local no Celular */}
          {offlineQueue.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '1px solid var(--amber-primary)',
              borderRadius: '16px',
              padding: '1.2rem',
              boxShadow: 'var(--shadow-glow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ background: 'var(--amber-gradient)', padding: '0.5rem', borderRadius: '10px', color: '#090d16' }}>
                    <CloudUpload size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                      {offlineQueue.length} {offlineQueue.length === 1 ? 'item capturado' : 'itens capturados'} no celular
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {apiOnline ? 'Conexão Wi-Fi detectada! Pronto para descarregar no banco de dados local.' : 'Armazenado no modo offline. Conecte ao Wi-Fi para enviar ao banco.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSincronizarFilaOffline}
                  disabled={isSyncing}
                  style={{
                    background: 'var(--amber-gradient)',
                    color: '#090d16',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow-md)',
                    cursor: isSyncing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Descarregando no Banco...' : 'Descarregar para o Banco (Wi-Fi)'}
                </button>
              </div>

              {/* Prévia dos Itens na Fila Offline */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--amber-primary)', fontWeight: 600 }}>[{item.fornecedor_nome}]</span>
                    <span style={{ color: '#fff' }}>{item.descricao}</span>
                    <span style={{ color: 'var(--emerald-success)', fontWeight: 700 }}>{formatCurrency(item.preco_vista)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 1: Seletor de Loja e Ação da Câmera */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={18} color="var(--amber-primary)" />
                <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>1. Onde você está cotando?</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Detecção de Loja</span>
            </div>

            {/* Chips de Lojas Homologadas com Toque Direto */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              {fornecedores.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFornecedorId(f.id)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    border: '1px solid',
                    borderColor: selectedFornecedorId === f.id ? 'var(--amber-primary)' : 'var(--border-subtle)',
                    background: selectedFornecedorId === f.id ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                    color: selectedFornecedorId === f.id ? 'var(--amber-primary)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {selectedFornecedorId === f.id && <Check size={14} />}
                  {f.nome}
                </button>
              ))}
            </div>

            {/* Área de Disparo da Câmera / OCR */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: previewImage ? '1fr 1fr' : '1fr',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '2px dashed var(--border-focus)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />

                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--amber-primary)',
                  padding: '1rem',
                  borderRadius: '50%'
                }}>
                  <Camera size={32} />
                </div>

                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Fotografar Etiqueta de Gôndola
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Aponte para a etiqueta com preço, SKU ou metragem da embalagem
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 1,
                      background: 'var(--amber-gradient)',
                      color: '#090d16',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Smartphone size={16} />
                    Abrir Câmera
                  </button>
                </div>
              </div>

              {/* Preview da Foto Capturada */}
              {previewImage && (
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  maxHeight: '220px',
                  background: '#000'
                }}>
                  <img 
                    src={previewImage} 
                    alt="Etiqueta Capturada" 
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <Sparkles size={12} color="var(--amber-primary)" />
                    OCR Multimodal
                  </div>
                </div>
              )}
            </div>

            {/* Atalhos de Demonstração Rápida */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                💡 Teste rápido (simular etiquetas reais de lojas parceiras):
              </span>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {EXEMPLOS_ETIQUETA.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCarregarExemplo(ex)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Tag size={12} color="var(--amber-primary)" />
                    {ex.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Formulário de Confirmação & Validação Humana Assistida */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--emerald-success)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  2. Validação Assistida dos Dados Extraídos
                </h3>
              </div>
              {ocrConfidence && (
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--emerald-success)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>
                  Confiança OCR: {(ocrConfidence * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {isAnalyzing && (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--amber-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <RefreshCw size={16} className="animate-spin" />
                Extraindo dados da etiqueta com inteligência multimodal...
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              {/* Descrição do Material */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Descrição Comercial do Material *
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Porcelanato Retificado 60x60 Esmaltado Bianco"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Fabricante */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Fabricante / Marca
                </label>
                <input
                  type="text"
                  value={formFabricante}
                  onChange={(e) => setFormFabricante(e.target.value)}
                  placeholder="Ex: Portobello, Votoran, Celite, Tigre"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* SKU / Código */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Código / SKU / Referência
                </label>
                <input
                  type="text"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="Ex: 89412 ou EAN"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              {/* Preço à Vista */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-success)', display: 'block', marginBottom: '0.25rem' }}>
                  Preço à Vista / Pix (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrecoVista}
                  onChange={(e) => setFormPrecoVista(e.target.value)}
                  placeholder="68.90"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-focus)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              {/* Preço a Prazo */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Preço a Prazo / Cartão (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrecoPrazo}
                  onChange={(e) => setFormPrecoPrazo(e.target.value)}
                  placeholder="74.90"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              {/* Unidade e Fator de Embalagem */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Unidade de Venda
                </label>
                <select
                  value={formUnidade}
                  onChange={(e) => setFormUnidade(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="m²">m² (Metro quadrado)</option>
                  <option value="cx">cx (Caixa fechada)</option>
                  <option value="un">un (Peça / Unidade)</option>
                  <option value="saco">saco (Cimento / Argamassa)</option>
                  <option value="lata">lata (Tinta 18L)</option>
                  <option value="m³">m³ (Areia / Brita)</option>
                </select>
              </div>

              {/* Fator de Conversão de Embalagem */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--amber-primary)', display: 'block', marginBottom: '0.25rem' }}>
                  Fator Embalagem (ex: 2.16 m²/cx)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formFator}
                  onChange={(e) => setFormFator(parseFloat(e.target.value) || 1.0)}
                  placeholder="1.00"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>

            {/* Destaque do Conversor em Tempo Real */}
            {formFator > 1 && valorUnitarioVista > 0 && (
              <div style={{
                marginTop: '1rem',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber-primary)' }}>
                  <Box size={16} />
                  <span>Conversor Automático de Embalagem:</span>
                </div>
                <div>
                  <strong>{formatCurrency(valorUnitarioVista)}/{formUnidade}</strong>
                  <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>➔</span>
                  <span style={{ color: 'var(--emerald-success)', fontWeight: 700 }}>
                    {formatCurrency(valorEmbalagemFechada)} por embalagem ({formFator} {formUnidade})
                  </span>
                </div>
              </div>
            )}

            {/* Mensagem de Feedback */}
            {saveMessage && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: saveMessage.tipo === 'sucesso' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: saveMessage.tipo === 'sucesso' ? 'var(--emerald-success)' : 'var(--rose-danger)',
                border: '1px solid',
                borderColor: saveMessage.tipo === 'sucesso' ? 'var(--emerald-success)' : 'var(--rose-danger)'
              }}>
                {saveMessage.texto}
              </div>
            )}

            {/* Botão de Gravação no Catálogo */}
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSalvarCaptura}
                disabled={isSaving}
                style={{
                  flex: 1,
                  background: 'var(--amber-gradient)',
                  color: '#090d16',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Gravando no Banco...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirmar e Gravar no Catálogo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Catálogo em Campo & Cotações Recentes */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  Catálogo Homologado & Histórico de Cotações
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {materiais.length} materiais cadastrados na base unificada
                </p>
              </div>

              {/* Barra de Busca de Materiais */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Buscar no catálogo..."
                  value={buscaMaterial}
                  onChange={(e) => setBuscaMaterial(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                    color: '#fff',
                    fontSize: '0.8rem',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {materiaisFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Nenhum material encontrado no filtro. Use o leitor de etiquetas acima para cadastrar novos itens.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.85rem' }}>
                {materiaisFiltrados.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: 'var(--amber-primary)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {item.fabricante || 'Geral'}
                        </span>
                        {item.ultima_loja && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Store size={12} />
                            {item.ultima_loja}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: '0.4rem', color: '#fff' }}>
                        {item.descricao}
                      </h4>
                      {item.modelo_sku && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          SKU: {item.modelo_sku}
                        </p>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.65rem'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                          Preço à Vista
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--emerald-success)' }}>
                          {formatCurrency(item.ultimo_preco_vista)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                            /{item.unidade_venda}
                          </span>
                        </span>
                      </div>

                      {item.fator_embalagem > 1 && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--amber-primary)', display: 'block' }}>
                            {item.fator_embalagem} {item.unidade_venda}/cx
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {formatCurrency((item.ultimo_preco_vista || 0) * item.fator_embalagem)}/cx
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: VISÃO DA OBRA PILOTO ICENV 2026 */}
      {/* ========================================================================= */}
      {activeTab === 'obra' && resumoObra && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card Resumo do Projeto */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {resumoObra.projeto.nome}
              </h2>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--amber-primary)',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {resumoObra.projeto.status} • Início 13/10/2026
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {resumoObra.projeto.descricao}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginTop: '1.25rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Orçamento Teto Aprovado</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber-primary)' }}>
                  {formatCurrency(resumoObra.projeto.orcamento_teto)}
                </span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Mão de Obra Contratada (60%)</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sky-info)' }}>
                  {formatCurrency(resumoObra.projeto.orcamento_mao_obra)}
                </span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Materiais & Suprimentos (40%)</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald-success)' }}>
                  {formatCurrency(resumoObra.projeto.orcamento_materiais)}
                </span>
              </div>
            </div>
          </div>

          {/* Ambientes */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
              Frentes de Trabalho / Ambientes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {resumoObra.ambientes.map((amb) => (
                <div key={amb.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>{amb.nome}</h4>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Piso: <strong>{amb.area_piso} m²</strong></span>
                    <span>Paredes: <strong>{amb.area_parede} m²</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: LOJAS HOMOLOGADAS & BENCHMARKING */}
      {/* ========================================================================= */}
      {activeTab === 'fornecedores' && (
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Lojas Homologadas & Histórico Real 2024
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Fornecedores pré-cadastrados a partir do fechamento da Obra de Acessibilidade 2024 (R$ 28,4k executados).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
            {fornecedores.map((f) => (
              <div key={f.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{f.nome}</h3>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--emerald-success)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px'
                  }}>
                    {f.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                  {f.especialidade}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--amber-primary)', fontWeight: 600 }}>
                  Executado em 2024: {formatCurrency(f.historico_compras_2024)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: TAXONOMIA PARAMETRIZADA */}
      {/* ========================================================================= */}
      {activeTab === 'taxonomia' && (
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Taxonomia Parametrizada & Fatores de Conversão
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Conversão automática de medidas de projeto (m², m³) para embalagens comerciais de lojas (caixas, sacos).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(taxonomia).map(([classe, itens]) => (
              <div key={classe} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.85rem'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--amber-primary)',
                  marginBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.35rem'
                }}>
                  {classe}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                  {itens.map((item) => (
                    <div key={item.id} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 500 }}>{item.tipo}</span>
                      <span style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: 'var(--amber-primary)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem'
                      }}>
                        {item.unidade_padrao} {item.fator_embalagem_padrao > 1 ? `(${item.fator_embalagem_padrao} m²/cx)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rodapé Informativo */}
      <footer style={{
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }}>
        <span>Sistema de Obras v1.2.0 • Módulo 1 Mobile-First PWA</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" style={{ color: 'var(--amber-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            API Swagger <ExternalLink size={12} />
          </a>
          <a href={`${API_URL}/health`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Health Endpoint <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
