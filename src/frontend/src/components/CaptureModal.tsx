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
  CloudUpload,
  Images,
  Trash2,
  Zap,
  Check
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
  onOfflineQueueUpdated?: () => void;
}

// Compressor de alta performance em Canvas para evitar estouro de LocalStorage no celular
const compressImageFile = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  taxonomia,
  lojas,
  onSaveMaterial,
  onPriceUpdated,
  onOfflineQueueUpdated,
}) => {
  // Steps:
  // 'capture': Escolha entre câmera e galeria
  // 'batch_preview': Pré-visualização de fotos da galeria / câmera para decidir se analisa agora ou guarda offline
  // 'processing': Execução do OCR com IA
  // 'confirm': Validação e cadastro final do item
  const [step, setStep] = useState<'capture' | 'batch_preview' | 'processing' | 'confirm'>('capture');

  const [selectedStoreHint, setSelectedStoreHint] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Armazenamento em lote de fotos selecionadas
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [batchSavedSuccess, setBatchSavedSuccess] = useState<number | null>(null);

  // Live camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Refs de inputs separados para Câmera e Galeria
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

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
      setSelectedPhotos([]);
      setActivePhotoIndex(0);
      setOcrError(null);
      setDuplicateMaterial(null);
      setBatchSavedSuccess(null);
      setSelectedStoreHint(lojas[0]?.nome || '');
      stopCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, lojas]);

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
      console.warn('Camera access stream fallback:', err);
      setIsCameraActive(false);
      // Fallback para input nativo com capture="environment"
      cameraInputRef.current?.click();
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
      setSelectedPhotos([dataUrl]);
      setActivePhotoIndex(0);
      setStep('batch_preview');
    }
  };

  // 1. Upload Direto pela Câmera Nativa (Fallback)
  const handleCameraNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    const compressed = await compressImageFile(file, 1200, 0.82);
    setIsCompressing(false);
    if (compressed) {
      setSelectedPhotos([compressed]);
      setActivePhotoIndex(0);
      setStep('batch_preview');
    }
    e.target.value = '';
  };

  // 2. Upload da GALERIA (Múltiplas Fotos, SEM capture)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const compressedList: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressed = await compressImageFile(file, 1200, 0.8);
      if (compressed) {
        compressedList.push(compressed);
      }
    }

    setIsCompressing(false);

    if (compressedList.length > 0) {
      setSelectedPhotos(compressedList);
      setActivePhotoIndex(0);
      setStep('batch_preview');
    }
    e.target.value = '';
  };

  // Ação Rápida de Loja: Salvar todas as fotos na Fila Offline sem esperar OCR
  const handleSaveAllToOfflineQueue = () => {
    if (selectedPhotos.length === 0) return;

    selectedPhotos.forEach((imgBase64) => {
      storageService.addToOfflineQueue({
        imagemBase64: imgBase64,
        lojaSugerida: selectedStoreHint || 'Loja Física',
      });
    });

    const count = selectedPhotos.length;
    setBatchSavedSuccess(count);

    if (onOfflineQueueUpdated) {
      onOfflineQueueUpdated();
    }

    // Fecha após breve feedback
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  // Iniciar Análise com IA da foto ativa
  const handleStartAnalysisForPhoto = (index = 0) => {
    const targetImg = selectedPhotos[index];
    if (!targetImg) return;
    processImage(targetImg);
  };

  // Main processing action: Call OCR Service
  const processImage = async (base64Img: string) => {
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

      // Check deduplication
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
      // Preenchimento manual de fallback
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
    const currentImg = selectedPhotos[activePhotoIndex] || undefined;

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
      fotoPrincipal: currentImg,
      fotos: currentImg ? [currentImg] : [],
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
          fotoEtiqueta: currentImg,
          confiancaOCR: ocrConfidence,
          observacoes: observacoes || 'Captura de etiqueta via OCR',
        },
      ],
      criadoEm: nowIso,
      atualizadoEm: nowIso,
    };

    storageService.saveMaterial(newMaterial);
    onSaveMaterial(newMaterial);

    // Se houver mais fotos no lote, avança para a próxima
    if (selectedPhotos.length > 1 && activePhotoIndex < selectedPhotos.length - 1) {
      const nextIdx = activePhotoIndex + 1;
      setActivePhotoIndex(nextIdx);
      setStep('batch_preview');
    } else {
      onClose();
    }
  };

  // Action: Duplicate detected, update existing price
  const handleUpdateExistingPrice = () => {
    if (!duplicateMaterial || preco === '') return;

    const priceNum = Number(preco);
    const currentImg = selectedPhotos[activePhotoIndex] || undefined;
    const updated = storageService.addPricePoint(duplicateMaterial.id, {
      preco: priceNum,
      unidade,
      precoPorEmbalagem: precoPorEmbalagem !== '' ? Number(precoPorEmbalagem) : undefined,
      coberturaPorEmbalagem: coberturaPorEmbalagem !== '' ? Number(coberturaPorEmbalagem) : undefined,
      loja: loja || duplicateMaterial.lojaAtual,
      data: new Date().toISOString(),
      fotoEtiqueta: currentImg,
      confiancaOCR: ocrConfidence,
      observacoes: `Novo preço registrado em ${loja || 'loja física'}.`,
    });

    if (updated) {
      if (onPriceUpdated) onPriceUpdated(updated);
      if (selectedPhotos.length > 1 && activePhotoIndex < selectedPhotos.length - 1) {
        const nextIdx = activePhotoIndex + 1;
        setActivePhotoIndex(nextIdx);
        setStep('batch_preview');
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0c101c] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                {step === 'capture' && 'Capturar / Enviar Etiquetas'}
                {step === 'batch_preview' && `Lote de Fotos da Loja (${selectedPhotos.length} fotos)`}
                {step === 'processing' && 'Analisando Etiqueta com IA...'}
                {step === 'confirm' && 'Conferência e Cadastro Técnico'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'capture' && 'Selecione fotos da galeria ou abra a câmera'}
                {step === 'batch_preview' && 'Guarde na fila offline sem esperar na loja ou analise com IA'}
                {step === 'processing' && 'Extraindo fabricante, preços, modelo e código de barras'}
                {step === 'confirm' && 'Valide os campos antes de registrar no catálogo'}
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* STEP 1: CAPTURE */}
          {step === 'capture' && (
            <div className="space-y-6">
              {/* Indicador de Compressão */}
              {isCompressing && (
                <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl flex items-center justify-center gap-2 text-sky-300 font-mono text-xs animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Otimizando fotos no celular para economia de dados...</span>
                </div>
              )}

              {/* Visor ao Vivo da Câmera (se ativado) */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-80 mx-auto flex items-center justify-center border-2 border-amber-400/60 shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-8 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-slate-950/80 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
                      Enquadre a etiqueta de preço aqui
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                    <button
                      onClick={stopCamera}
                      className="px-3.5 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={takePhotoFromCamera}
                      className="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4 stroke-[2.5]" />
                      Capturar Foto
                    </button>
                    <button
                      onClick={() => {
                        setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
                        stopCamera();
                        setTimeout(startCamera, 150);
                      }}
                      className="p-2.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800"
                      title="Girar câmera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* OPÇÃO 1: FOTOS DA GALERIA (CORREÇÃO DO BUG: SEM CAPTURE, COM MULTIPLE) */}
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="group border-2 border-dashed border-amber-400/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-lg"
                  >
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mb-3 shadow-md shadow-amber-400/20 group-hover:scale-105 transition-transform">
                      <Images className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 mb-1">
                      Recomendado no Celular
                    </span>
                    <h3 className="font-extrabold text-white text-base mb-1">
                      Selecionar Fotos da Galeria
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                      Escolha 1 ou <strong>várias fotos</strong> tiradas fora do app no rolo de fotos do celular.
                    </p>
                  </div>

                  {/* OPÇÃO 2: CÂMERA DO CELULAR */}
                  <div
                    onClick={startCamera}
                    className="group border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
                  >
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraNativeCapture}
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-300 group-hover:text-amber-400 flex items-center justify-center mb-3 transition-colors">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 mb-1">
                      Ao Vivo
                    </span>
                    <h3 className="font-bold text-white text-base mb-1">
                      Abrir Câmera Agora
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Aponte a câmera diretamente para uma etiqueta de preço na gôndola da loja.
                    </p>
                  </div>
                </div>
              )}

              {/* Loja de Referência para as Fotos */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Loja Onde Você Está (Opcional):</span>
                    <p className="text-[11px] text-slate-400">
                      Vinculará automaticamente todas as fotos a este fornecedor
                    </p>
                  </div>
                </div>
                <select
                  value={selectedStoreHint}
                  onChange={(e) => setSelectedStoreHint(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-amber-400 outline-none focus:border-amber-400"
                >
                  <option value="">Detectar automaticamente</option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.nome}>
                      {l.nome} ({l.cidade || 'SP'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amostras para Teste no Desktop */}
              <div className="border-t border-slate-800/80 pt-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Ou teste com etiquetas de exemplo:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_TAGS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        setSelectedPhotos([sample.imagemUrl]);
                        setActivePhotoIndex(0);
                        processImage(sample.imagemUrl);
                      }}
                      className="bg-[#0e1424] hover:bg-[#141d34] border border-slate-800 hover:border-amber-400/80 rounded-xl p-2.5 text-left transition-all flex items-start gap-2.5"
                    >
                      <img
                        src={sample.imagemUrl}
                        alt={sample.nome}
                        className="w-12 h-12 rounded-lg object-contain bg-white p-1 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-amber-400 block truncate">
                          {sample.loja}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">
                          {sample.nome}
                        </h4>
                        <p className="text-[11px] text-emerald-400 font-bold mt-0.5 font-mono">
                          R$ {sample.expectedData.preco.toFixed(2)} / {sample.expectedData.unidade}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 (NOVO): BATCH PREVIEW — RESOLVE O PROBLEMA DE SINAL E TEMPO NA LOJA */}
          {step === 'batch_preview' && (
            <div className="space-y-5">
              {/* Feedback de Sucesso se salvou na fila */}
              {batchSavedSuccess !== null ? (
                <div className="py-12 text-center space-y-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {batchSavedSuccess} {batchSavedSuccess === 1 ? 'Foto Salva' : 'Fotos Salvas'} com Sucesso!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    As fotos foram guardadas com segurança na sua <strong>Fila Offline</strong>. Você não precisa esperar na loja! Quando estiver no Wi-Fi, basta abrir a fila e sincronizar todas com IA.
                  </p>
                </div>
              ) : (
                <>
                  {/* Banner de Orientação para Loja com Sinal Ruim */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black flex-shrink-0 mt-0.5">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-amber-300">
                        {selectedPhotos.length} {selectedPhotos.length === 1 ? 'Foto Pronta' : 'Fotos Prontas'} para Processamento
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Se estiver dentro do depósito ou loja com sinal 4G/5G fraco, escolha <strong>"Guardar na Fila Offline"</strong>. O app salva tudo no celular instantaneamente para você analisar com IA depois no Wi-Fi sem perder tempo na loja!
                      </p>
                    </div>
                  </div>

                  {/* Grade de Miniaturas das Fotos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Fotos Selecionadas ({selectedPhotos.length}):</span>
                      <button
                        onClick={() => {
                          setSelectedPhotos([]);
                          setStep('capture');
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        Limpar e Escolher Outras
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-56 overflow-y-auto p-1">
                      {selectedPhotos.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border-2 bg-slate-950 group ${
                            activePhotoIndex === idx
                              ? 'border-amber-400 ring-2 ring-amber-400/20'
                              : 'border-slate-800'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-slate-950/80 text-[10px] font-mono text-white font-bold">
                            #{idx + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = selectedPhotos.filter((_, i) => i !== idx);
                              setSelectedPhotos(updated);
                              if (updated.length === 0) setStep('capture');
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-950/80 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Loja Vinculada */}
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      Loja Associada:
                    </span>
                    <strong className="text-amber-400 text-xs font-semibold">
                      {selectedStoreHint || 'Loja Física / Não especificada'}
                    </strong>
                  </div>

                  {/* DUAS AÇÕES PRINCIPAIS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* AÇÃO 1: GUARDAR OFFLINE (INSTANTÂNEO PARA O CANTEIRO) */}
                    <button
                      onClick={handleSaveAllToOfflineQueue}
                      className="p-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
                    >
                      <div className="flex items-center gap-2">
                        <CloudUpload className="w-5 h-5 stroke-[2.5]" />
                        <span>Guardar Todas na Fila Offline</span>
                      </div>
                      <span className="text-[11px] font-medium opacity-90">
                        1 segundo • Sem espera • Analisa depois no Wi-Fi
                      </span>
                    </button>

                    {/* AÇÃO 2: ANALISAR COM IA AGORA (SE TIVER INTERNET) */}
                    <button
                      onClick={() => handleStartAnalysisForPhoto(0)}
                      className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition-all text-center"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span>Analisar com IA Agora (Online)</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Requer sinal de internet estável
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin flex items-center justify-center" />
                <Sparkles className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Lendo dados da etiqueta com IA...</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Decodificando fabricante, modelo, preços à vista/parcelado, código de barras e unidade.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {ocrError && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Aviso:</span> {ocrError}
                  </div>
                </div>
              )}

              {/* Deduplication Alert */}
              {duplicateMaterial && (
                <div className="p-3.5 bg-sky-950/50 border border-sky-700/60 rounded-xl space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <History className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                        Item já existente no catálogo: "{duplicateMaterial.nome}"
                      </span>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Preço anterior: <strong className="text-emerald-400">R$ {duplicateMaterial.precoAtual.toFixed(2)}</strong> na loja <em>{duplicateMaterial.lojaAtual}</em>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateExistingPrice}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <History className="w-3.5 h-3.5" />
                    Registrar Novo Preço no Histórico
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Thumbnail */}
                <div className="md:col-span-4 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 text-center">
                    {selectedPhotos[activePhotoIndex] ? (
                      <img
                        src={selectedPhotos[activePhotoIndex]}
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
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 font-mono">
                      <span>Confiança IA:</span>
                      <strong className="text-emerald-400">{Math.round(ocrConfidence * 100)}%</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep('capture')}
                    className="w-full py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Fotografar / Selecionar Outra
                  </button>
                </div>

                {/* Form */}
                <div className="md:col-span-8 space-y-3.5">
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
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
                        placeholder="Ex: Obramax Mooca"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Modelo / Descrição / Dimensões *
                    </label>
                    <input
                      type="text"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Ex: Porcelanato Bianco di Lucca Polido 84x84cm"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-400 mb-1">
                        Preço Unitário (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-sm font-black text-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Unidade *
                      </label>
                      <select
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="m²">m²</option>
                        <option value="cx">cx</option>
                        <option value="un">un</option>
                        <option value="kg">kg</option>
                        <option value="litro">litro</option>
                        <option value="lata">lata</option>
                        <option value="saco">saco</option>
                        <option value="rolo">rolo</option>
                        <option value="m">m</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Preço Embalagem
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={precoPorEmbalagem}
                        onChange={(e) => setPrecoPorEmbalagem(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="R$ Opcional"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Rendimento/Cx
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={coberturaPorEmbalagem}
                        onChange={(e) => setCoberturaPorEmbalagem(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Ex: 1.96"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                          setCategoria(clObj?.categorias[0]?.nome || '');
                          setTipo(clObj?.categorias[0]?.tipos[0]?.nome || '');
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
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
                        Tipo
                      </label>
                      <input
                        type="text"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        placeholder="Ex: Porcelanato Polido"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Código de barras e Observações Técnicas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código de Barras / EAN
                      </label>
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
                        <Barcode className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          value={codigoBarras}
                          onChange={(e) => setCodigoBarras(e.target.value)}
                          placeholder="789..."
                          className="w-full bg-transparent text-xs text-white outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Observações Técnicas / Aplicação
                      </label>
                      <input
                        type="text"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Ex: Borda retificada, junta 1.5mm, pronta entrega"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0e1424] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Fechar
          </button>

          {step === 'confirm' && (
            <button
              type="button"
              onClick={handleSaveNewMaterial}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Material no Catálogo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
