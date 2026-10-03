import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Tag,
  DollarSign,
  Barcode,
  Layers,
  HelpCircle,
  Image as ImageIcon,
  ArrowRight,
  TrendingDown,
  History,
} from 'lucide-react';
import { Material, Loja, TaxonomiaClasse, OCRResult, UnidadeMedida } from '../types';
import { ocrService } from '../services/ocrService';
import { storageService } from '../services/storageService';
import { SAMPLE_TAGS } from '../data/initialData';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomia: TaxonomiaClasse[];
  lojas: Loja[];
  onSaveMaterial: (material: Material) => void;
  onPriceUpdated?: (material: Material) => void;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  taxonomia,
  lojas,
  onSaveMaterial,
  onPriceUpdated,
}) => {
  // Steps: 'capture' (photo input) -> 'processing' (OCR loading) -> 'confirm' (human validation)
  const [step, setStep] = useState<'capture' | 'processing' | 'confirm'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedStoreHint, setSelectedStoreHint] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Live camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extracted and editable fields for Step 3
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [preco, setPreco] = useState<number | ''>('');
  const [unidade, setUnidade] = useState<string>('m²');
  const [precoPorEmbalagem, setPrecoPorEmbalagem] = useState<number | ''>('');
  const [coberturaPorEmbalagem, setCoberturaPorEmbalagem] = useState<number | ''>('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [loja, setLoja] = useState('');
  const [classe, setClasse] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'catalogo' | 'selecionado'>('selecionado');
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>(undefined);

  // Duplicate detection state
  const [duplicateMaterial, setDuplicateMaterial] = useState<Material | null>(null);

  // Available categories and types based on selected class
  const currentClasseObj = taxonomia.find((c) => c.nome === classe);
  const availableCategorias = currentClasseObj ? currentClasseObj.categorias : [];
  const currentCatObj = availableCategorias.find((cat) => cat.nome === categoria);
  const availableTipos = currentCatObj ? currentCatObj.tipos : [];

  // Reset modal state
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setCapturedImage(null);
      setOcrError(null);
      setDuplicateMaterial(null);
      setSelectedStoreHint(lojas[0]?.nome || '');
      stopCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Start live webcam / mobile camera
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setIsCameraActive(false);
      alert('Não foi possível acessar a câmera do dispositivo. Por favor, selecione uma foto da galeria.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const takePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      processImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Main processing action: Call OCR Service
  const processImage = async (base64Img: string) => {
    setCapturedImage(base64Img);
    setStep('processing');
    setOcrError(null);

    try {
      const result: OCRResult = await ocrService.processTagImage(
        base64Img,
        'image/jpeg',
        selectedStoreHint
      );

      // Populate confirmation form
      setFabricante(result.fabricante || '');
      setModelo(result.modelo || '');
      setPreco(result.preco ?? '');
      setUnidade(result.unidade || 'm²');
      setPrecoPorEmbalagem(result.precoPorEmbalagem ?? '');
      setCoberturaPorEmbalagem(result.coberturaPorEmbalagem ?? '');
      setCodigoBarras(result.codigoBarras || '');
      setLoja(result.loja || selectedStoreHint || 'Loja Física');
      setObservacoes(result.observacoes || '');
      setOcrConfidence(result.confianca);

      // Suggest taxonomy classes
      const matchedClasse = taxonomia.find(
        (c) => c.nome.toLowerCase() === (result.classeSugerida || '').toLowerCase()
      ) || taxonomia[0];
      setClasse(matchedClasse.nome);

      const matchedCat = matchedClasse.categorias.find(
        (cat) => cat.nome.toLowerCase() === (result.categoriaSugerida || '').toLowerCase()
      ) || matchedClasse.categorias[0];
      setCategoria(matchedCat?.nome || '');

      const matchedTipo = matchedCat?.tipos.find(
        (t) => t.nome.toLowerCase().includes((result.tipoSugerido || '').toLowerCase())
      ) || matchedCat?.tipos[0];
      setTipo(matchedTipo?.nome || result.tipoSugerido || '');

      // Check deduplication (Seção 3.3)
      const existing = storageService.checkDuplicateMaterial({
        codigoBarras: result.codigoBarras,
        fabricante: result.fabricante || '',
        modelo: result.modelo || '',
      });
      setDuplicateMaterial(existing);

      setStep('confirm');
    } catch (err: any) {
      console.error('Error during OCR processing:', err);
      setOcrError(err.message || 'Falha ao ler etiqueta. Tente novamente ou insira os dados manualmente.');
      // Still allow manual editing even if OCR failed
      setFabricante('');
      setModelo('Material capturado');
      setPreco('');
      setUnidade('un');
      setLoja(selectedStoreHint || 'Loja Física');
      setClasse(taxonomia[0]?.nome || 'Revestimento');
      setCategoria(taxonomia[0]?.categorias[0]?.nome || 'Geral');
      setTipo(taxonomia[0]?.categorias[0]?.tipos[0]?.nome || '');
      setStep('confirm');
    }
  };

  // Action: User confirms saving as a new material
  const handleSaveNewMaterial = () => {
    if (!modelo || preco === '') {
      alert('Por favor, informe ao menos o Modelo/Descrição e o Preço.');
      return;
    }

    const priceNum = Number(preco);
    const newMaterialId = `mat-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newMaterial: Material = {
      id: newMaterialId,
      nome: `${fabricante ? fabricante + ' - ' : ''}${modelo}`,
      fabricante: fabricante || 'Genérico',
      modelo,
      codigoBarras: codigoBarras || undefined,
      classe: classe || 'Revestimento',
      categoria: categoria || 'Geral',
      tipo: tipo || 'Padrão',
      unidade: unidade as UnidadeMedida,
      precoAtual: priceNum,
      precoPorEmbalagem: precoPorEmbalagem !== '' ? Number(precoPorEmbalagem) : undefined,
      coberturaPorEmbalagem: coberturaPorEmbalagem !== '' ? Number(coberturaPorEmbalagem) : undefined,
      lojaAtual: loja || 'Loja Física',
      fotoPrincipal: capturedImage || undefined,
      fotos: capturedImage ? [capturedImage] : [],
      observacoes,
      status,
      historicoPrecos: [
        {
          id: `preco-${Date.now()}`,
          materialId: newMaterialId,
          preco: priceNum,
          unidade,
          precoPorEmbalagem: precoPorEmbalagem !== '' ? Number(precoPorEmbalagem) : undefined,
          coberturaPorEmbalagem: coberturaPorEmbalagem !== '' ? Number(coberturaPorEmbalagem) : undefined,
          loja: loja || 'Loja Física',
          data: nowIso,
          fotoEtiqueta: capturedImage || undefined,
          confiancaOCR: ocrConfidence,
          observacoes: observacoes || 'Captura de etiqueta via OCR',
        },
      ],
      criadoEm: nowIso,
      atualizadoEm: nowIso,
    };

    storageService.saveMaterial(newMaterial);
    onSaveMaterial(newMaterial);
    onClose();
  };

  // Action: When duplicate detected, update price history of existing material
  const handleUpdateExistingPrice = () => {
    if (!duplicateMaterial || preco === '') return;

    const priceNum = Number(preco);
    const updated = storageService.addPricePoint(duplicateMaterial.id, {
      preco: priceNum,
      unidade,
      precoPorEmbalagem: precoPorEmbalagem !== '' ? Number(precoPorEmbalagem) : undefined,
      coberturaPorEmbalagem: coberturaPorEmbalagem !== '' ? Number(coberturaPorEmbalagem) : undefined,
      loja: loja || duplicateMaterial.lojaAtual,
      data: new Date().toISOString(),
      fotoEtiqueta: capturedImage || undefined,
      confiancaOCR: ocrConfidence,
      observacoes: `Novo preço registrado em ${loja || 'loja física'}.`,
    });

    if (updated) {
      if (onPriceUpdated) onPriceUpdated(updated);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">
                {step === 'capture' && 'Capturar Etiqueta de Material'}
                {step === 'processing' && 'Processando Imagem com IA...'}
                {step === 'confirm' && 'Confirmação e Validação dos Dados'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'capture' && 'Tire uma foto da etiqueta ou escolha uma amostra de loja'}
                {step === 'processing' && 'Visão computacional extraindo fabricante, preço e modelo'}
                {step === 'confirm' && 'O OCR nunca grava sem a sua confirmação — revise os campos'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content based on step */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* STEP 1: CAPTURE */}
          {step === 'capture' && (
            <div className="space-y-6">
              {/* Camera Preview or Selection Card */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-80 mx-auto flex items-center justify-center border-2 border-amber-500/40 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Camera overlay guide */}
                  <div className="absolute inset-8 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-slate-950/70 text-amber-300 text-xs px-2.5 py-1 rounded-full font-medium">
                      Enquadre a etiqueta de preço aqui
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 text-white text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={takePhotoFromCamera}
                      className="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Capturar Foto
                    </button>
                    <button
                      onClick={() => {
                        setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
                        stopCamera();
                        setTimeout(startCamera, 150);
                      }}
                      className="p-2 rounded-xl bg-slate-800/90 text-white hover:bg-slate-700"
                      title="Girar câmera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Action 1: Live camera */}
                  <button
                    onClick={startCamera}
                    className="group border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-800/40 hover:bg-amber-500/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 transition-colors">
                      <Camera className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">
                      Abrir Câmera do Celular
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Aponte diretamente para a etiqueta na prateleira da loja para captura rápida.
                    </p>
                  </button>

                  {/* Action 2: Gallery upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-800/40 hover:bg-amber-500/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-slate-700/50 group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-400 flex items-center justify-center mb-3 transition-colors">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">
                      Enviar Foto da Galeria
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Selecione uma imagem já salva no rolo de fotos do seu dispositivo.
                    </p>
                  </div>
                </div>
              )}

              {/* Loja identificada / sugestão */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Loja Atual (Opcional):</span>
                    <p className="text-[11px] text-slate-400">Ajuda a IA a calibrar a leitura da etiqueta</p>
                  </div>
                </div>
                <select
                  value={selectedStoreHint}
                  onChange={(e) => setSelectedStoreHint(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                >
                  <option value="">Detectar automaticamente da etiqueta</option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.nome}>
                      {l.nome} ({l.cidade || 'SP'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick sample tags for testing without a camera */}
              <div className="border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Ou teste agora com etiquetas de exemplo:
                  </span>
                  <span className="text-[11px] text-slate-400">Clique para testar o OCR</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SAMPLE_TAGS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => processImage(sample.imagemUrl)}
                      className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/80 rounded-xl p-3 text-left transition-all flex items-start gap-3"
                    >
                      <img
                        src={sample.imagemUrl}
                        alt={sample.nome}
                        className="w-14 h-14 rounded-lg object-contain bg-white p-1 flex-shrink-0 border border-slate-700"
                      />
                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 mb-1">
                          {sample.loja}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                          {sample.nome}
                        </h4>
                        <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                          R$ {sample.expectedData.preco.toFixed(2)} / {sample.expectedData.unidade}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING (AI Multimodal OCR) */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin flex items-center justify-center" />
                <Sparkles className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Analisando etiqueta com IA...</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Decodificando fabricante, modelo, dimensões, preços à vista/parcelado, código de barras e unidade de venda.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM & HUMAN VALIDATION */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {/* OCR Error notice if any */}
              {ocrError && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Aviso:</span> {ocrError}
                  </div>
                </div>
              )}

              {/* Deduplication Warning Alert Banner (Requisito Seção 3.3) */}
              {duplicateMaterial && (
                <div className="p-4 bg-blue-950/50 border border-blue-700/60 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                          Produto Já Cadastrado na sua Base!
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-800 text-blue-200">
                          Deduplicação Inteligente
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5">
                        O modelo <strong>"{duplicateMaterial.nome}"</strong> já existe cadastrado.
                        Preço anterior registrado: <strong className="text-emerald-400">R$ {duplicateMaterial.precoAtual.toFixed(2)}</strong> na loja <em>{duplicateMaterial.lojaAtual}</em>.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Novo preço capturado hoje: <strong>R$ {Number(preco || 0).toFixed(2)}</strong> em <em>{loja || 'loja física'}</em>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-800/40">
                    <button
                      type="button"
                      onClick={handleUpdateExistingPrice}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" />
                      Registrar no Histórico de Preços (Recomendado)
                    </button>
                    <span className="text-[11px] text-slate-400">ou preencha abaixo para salvar como item separado:</span>
                  </div>
                </div>
              )}

              {/* Grid: Image preview on side + Validation form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left col: Tag photo thumbnail */}
                <div className="md:col-span-4 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 text-center">
                    {capturedImage ? (
                      <img
                        src={capturedImage}
                        alt="Etiqueta capturada"
                        className="w-full max-h-56 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span>Sem imagem</span>
                      </div>
                    )}
                  </div>
                  {ocrConfidence !== undefined && (
                    <div className="flex items-center justify-between text-[11px] px-2 text-slate-400">
                      <span>Confiança da Leitura IA:</span>
                      <span className="font-semibold text-emerald-400">
                        {Math.round(ocrConfidence * 100)}%
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep('capture')}
                    className="w-full py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Fotografar Outra Etiqueta
                  </button>
                </div>

                {/* Right col: Form fields with human validation */}
                <div className="md:col-span-8 space-y-4">
                  {/* Fabricante e Loja */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Fabricante / Marca *
                      </label>
                      <input
                        type="text"
                        value={fabricante}
                        onChange={(e) => setFabricante(e.target.value)}
                        placeholder="Ex: Portobello, Tigre, Suvinil"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Loja onde foi encontrado *
                      </label>
                      <input
                        type="text"
                        value={loja}
                        onChange={(e) => setLoja(e.target.value)}
                        placeholder="Ex: Leroy Merlin Morumbi"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Modelo / Descrição completa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Modelo / Descrição / Dimensões *
                    </label>
                    <input
                      type="text"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Ex: Porcelanato Bianco di Lucca Polido 84x84cm Retificado"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  {/* Preços e Unidade */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                        Preço Unitário (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-sm font-bold text-amber-400 outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Unidade *
                      </label>
                      <select
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                      >
                        <option value="m²">m² (Metro quadrado)</option>
                        <option value="cx">cx (Caixa)</option>
                        <option value="un">un (Unidade / Peça)</option>
                        <option value="kg">kg (Quilograma)</option>
                        <option value="litro">litro</option>
                        <option value="lata">lata (18L / 3.6L)</option>
                        <option value="saco">saco (20kg / 50kg)</option>
                        <option value="rolo">rolo (100m)</option>
                        <option value="m">m (Metro linear)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Preço Caixa/Embalagem
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={precoPorEmbalagem}
                        onChange={(e) => setPrecoPorEmbalagem(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="R$ Opcional"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        m² / Peças por Cx
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={coberturaPorEmbalagem}
                        onChange={(e) => setCoberturaPorEmbalagem(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Ex: 1.96"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* Taxonomia Hierárquica: Classe -> Categoria -> Tipo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Classe *
                      </label>
                      <select
                        value={classe}
                        onChange={(e) => {
                          const newCl = e.target.value;
                          setClasse(newCl);
                          const clObj = taxonomia.find((c) => c.nome === newCl);
                          const firstCat = clObj?.categorias[0]?.nome || '';
                          setCategoria(firstCat);
                          const firstTipo = clObj?.categorias[0]?.tipos[0]?.nome || '';
                          setTipo(firstTipo);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                      >
                        {taxonomia.map((c) => (
                          <option key={c.id} value={c.nome}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={categoria}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setCategoria(newCat);
                          const catObj = availableCategorias.find((c) => c.nome === newCat);
                          setTipo(catObj?.tipos[0]?.nome || '');
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                      >
                        {availableCategorias.map((cat) => (
                          <option key={cat.id} value={cat.nome}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Tipo de Material
                      </label>
                      <input
                        type="text"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        placeholder="Ex: Porcelanato Polido"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Código de barras e Observações */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código de Barras / EAN
                      </label>
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2">
                        <Barcode className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          value={codigoBarras}
                          onChange={(e) => setCodigoBarras(e.target.value)}
                          placeholder="789..."
                          className="w-full bg-transparent text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Observações Técnicas / Detalhes
                      </label>
                      <input
                        type="text"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Ex: Borda retificada, junta 1.5mm, PEI 4, pronta entrega"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>

          {step === 'confirm' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveNewMaterial}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Material no Catálogo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
