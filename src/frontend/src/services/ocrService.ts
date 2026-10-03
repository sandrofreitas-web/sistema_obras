import { OCRResult } from '../types';
import { storageService } from './storageService';
import { SAMPLE_TAGS } from '../data/initialData';

export const ocrService = {
  /**
   * Processa uma imagem de etiqueta via backend Gemini Multimodal
   */
  async processTagImage(
    imageBase64: string,
    mimeType = 'image/jpeg',
    storeHint?: string
  ): Promise<OCRResult> {
    // 1. Verificar se é uma imagem de amostra rápida
    const matchedSample = SAMPLE_TAGS.find((s) => s.imagemUrl === imageBase64);
    if (matchedSample) {
      // Simula uma resposta imediata realista com os dados esperados
      await new Promise((r) => setTimeout(r, 600));
      return {
        ...matchedSample.expectedData,
        confianca: 0.96,
      };
    }

    // 2. Verificar conexão de rede do dispositivo
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Offline-first (Seção 3.3): Salva na fila de sincronização
      storageService.addToOfflineQueue({
        imagemBase64: imageBase64,
        lojaSugerida: storeHint,
      });
      throw new Error(
        'Dispositivo sem conexão de internet (offline na loja). A foto foi salva com segurança na sua Fila Offline para ser sincronizada assim que você reconectar!'
      );
    }

    try {
      const response = await fetch('/api/ocr-tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          storeHint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Erro no servidor: ${response.status}`);
      }

      const result: OCRResult = await response.json();
      return result;
    } catch (err: any) {
      console.warn('Falha na chamada OCR da API, checando se deve enfileirar offline:', err);
      // Se falhou por rede, enfileira
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        storageService.addToOfflineQueue({
          imagemBase64: imageBase64,
          lojaSugerida: storeHint,
        });
        throw new Error(
          'Sem sinal de rede na loja. Foto enfileirada na Fila Offline para processamento posterior.'
        );
      }
      throw err;
    }
  },

  /**
   * Processa itens pendentes na fila offline
   */
  async syncOfflineQueue(
    onProgress?: (current: number, total: number) => void
  ): Promise<{ processed: number; errors: number }> {
    const queue = storageService.getOfflineQueue().filter((q) => q.status === 'pendente' || q.status === 'erro');
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (onProgress) onProgress(i + 1, queue.length);

      storageService.updateOfflineQueueItem(item.id, { status: 'processando' });
      try {
        const ocr = await this.processTagImage(item.imagemBase64, 'image/jpeg', item.lojaSugerida);
        storageService.updateOfflineQueueItem(item.id, {
          status: 'processado',
          dadosExtraidos: {
            fabricante: ocr.fabricante,
            modelo: ocr.modelo,
            precoAtual: ocr.preco,
            unidade: ocr.unidade,
            lojaAtual: ocr.loja || item.lojaSugerida || 'Loja Física',
            classe: ocr.classeSugerida || 'Revestimento',
            categoria: ocr.categoriaSugerida || 'Geral',
            tipo: ocr.tipoSugerido || 'Material',
            observacoes: ocr.observacoes,
          },
        });
        processed++;
      } catch (err: any) {
        errors++;
        storageService.updateOfflineQueueItem(item.id, {
          status: 'erro',
          erroMensagem: err.message || 'Falha ao processar etiqueta',
        });
      }
    }

    return { processed, errors };
  },
};
