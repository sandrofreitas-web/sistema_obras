import React, { useState } from 'react';
import { X, CloudUpload, RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { ItemFilaOffline } from '../types';
import { ocrService } from '../services/ocrService';
import { storageService } from '../services/storageService';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: ItemFilaOffline[];
  onQueueUpdated: () => void;
  onMaterialsRefreshed: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  onQueueUpdated,
  onMaterialsRefreshed,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncSummary, setSyncSummary] = useState<{ processed: number; errors: number } | null>(null);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncSummary(null);

    try {
      const result = await ocrService.syncOfflineQueue((current, total) => {
        setSyncProgress({ current, total });
      });

      setSyncSummary(result);
      onQueueUpdated();
      onMaterialsRefreshed();
    } catch (err: any) {
      alert(`Erro na sincronização: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleClear = () => {
    if (confirm('Deseja limpar todos os itens da fila offline?')) {
      storageService.clearOfflineQueue();
      onQueueUpdated();
    }
  };

  const pendingItems = queue.filter((q) => q.status === 'pendente' || q.status === 'erro');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Fila de Sincronização Offline</h3>
              <p className="text-xs text-slate-400">
                Fotos capturadas em lojas físicas sem conexão de internet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {syncSummary && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>
                Sincronização concluída: <strong>{syncSummary.processed}</strong> etiquetas processadas
                {syncSummary.errors > 0 && `, ${syncSummary.errors} com falha`}.
              </span>
            </div>
          )}

          {queue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <p className="text-sm font-semibold text-slate-200">Fila offline vazia!</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Todas as fotos tiradas nas lojas já foram processadas pela IA e catalogadas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>{queue.length} fotos salvas localmente</span>
                <button
                  onClick={handleClear}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Fila
                </button>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                {queue.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-900/50 flex items-center gap-3">
                    <img
                      src={item.imagemBase64}
                      alt="Etiqueta offline"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-950 flex-shrink-0 border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          Etiqueta #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            item.status === 'processado'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.status === 'processando'
                              ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                              : item.status === 'erro'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Capturada em: {new Date(item.dataCaptura).toLocaleTimeString('pt-BR')}
                        {item.lojaSugerida ? ` • ${item.lojaSugerida}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Fechar
          </button>

          {pendingItems.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? `Sincronizando (${syncProgress?.current}/${syncProgress?.total})...`
                  : `Sincronizar ${pendingItems.length} Itens com IA`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
