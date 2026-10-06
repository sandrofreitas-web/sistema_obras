import React, { useState } from 'react';
import {
  Hammer,
  CheckCircle2,
  Clock,
  Camera,
  Calendar,
  Plus,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Projeto, EtapaObra, FotoDiario } from '../types';
import { storageService } from '../services/storageService';

interface PhysicalTrackingScreenProps {
  project: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
}

export const PhysicalTrackingScreen: React.FC<PhysicalTrackingScreenProps> = ({
  project,
  onProjectUpdated,
}) => {
  if (!project) return null;

  const etapas = project.etapas || [];

  // Calculate overall physical progress
  const overallPhysicalProgress = etapas.length > 0
    ? Math.round(etapas.reduce((acc, e) => acc + (e.percentualAvanco || 0), 0) / etapas.length)
    : 0;

  // New photo modal state
  const [selectedEtapaForPhoto, setSelectedEtapaForPhoto] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Update stage advance %
  const handleUpdateProgress = (etapaId: string, newPercent: number) => {
    const updatedEtapas = etapas.map((e) => {
      if (e.id === etapaId) {
        return {
          ...e,
          percentualAvanco: newPercent,
          status: newPercent === 100 ? ('concluida' as const) : newPercent > 0 ? ('em_andamento' as const) : ('nao_iniciada' as const),
        };
      }
      return e;
    });

    const updated = { ...project, etapas: updatedEtapas };
    storageService.saveProject(updated);
    onProjectUpdated(updated);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEtapaForPhoto || !photoUrl) return;

    const newPhoto: FotoDiario = {
      id: `foto-${Date.now()}`,
      etapaId: selectedEtapaForPhoto,
      data: new Date().toISOString().split('T')[0],
      fotoUrl: photoUrl,
      legenda: photoCaption || 'Registro fotográfico da etapa',
    };

    const updatedEtapas = etapas.map((e) => {
      if (e.id === selectedEtapaForPhoto) {
        return {
          ...e,
          fotosDiario: [...(e.fotosDiario || []), newPhoto],
        };
      }
      return e;
    });

    const updated = { ...project, etapas: updatedEtapas };
    storageService.saveProject(updated);
    onProjectUpdated(updated);

    setSelectedEtapaForPhoto(null);
    setPhotoUrl('');
    setPhotoCaption('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Executivo & Telemetria do Cronograma */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider font-mono">
              Módulo 5 • Acompanhamento Físico
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Cronograma & Diário de Medição
          </h1>
          <p className="text-xs text-slate-400">
            Avanço físico sequencial por etapas de obra com registro fotográfico técnico.
          </p>
        </div>

        {/* Telemetria Global de Avanço */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Avanço Físico Global
            </span>
            <div className="text-xl font-black text-amber-400 font-mono tabular-nums leading-none mt-0.5">
              {overallPhysicalProgress}%
            </div>
          </div>
          <div className="w-20 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${overallPhysicalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grade Técnica de Etapas de Execução */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-800/80">
        <div className="px-4 py-2.5 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Etapas Sequenciais da Obra ({etapas.length} etapas)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Ajuste o percentual de avanço de cada frente
          </span>
        </div>

        {etapas.map((etapa) => {
          const isDone = etapa.percentualAvanco === 100;
          const isInProgress = etapa.percentualAvanco > 0 && etapa.percentualAvanco < 100;

          return (
            <div key={etapa.id} className="p-3 sm:p-4 hover:bg-slate-800/20 transition-colors space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isInProgress
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : `#${etapa.ordem}`}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-100">{etapa.nome}</h3>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          isDone
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isDone ? 'Concluída' : isInProgress ? 'Em Andamento' : 'Não Iniciada'}
                      </span>
                    </div>
                    {etapa.observacoes && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {etapa.observacoes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Controles de Progresso em Linha */}
                <div className="flex items-center gap-2.5 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Avanço:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={etapa.percentualAvanco}
                    onChange={(e) => handleUpdateProgress(etapa.id, parseInt(e.target.value, 10))}
                    className="accent-amber-400 cursor-pointer w-24 sm:w-32 h-1.5"
                  />
                  <strong className="text-xs font-mono font-bold text-amber-400 min-w-[38px] text-right tabular-nums">
                    {etapa.percentualAvanco}%
                  </strong>
                </div>
              </div>

              {/* Registro Fotográfico Técnico Compacto */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-amber-400" />
                  Fotos do Canteiro ({etapa.fotosDiario?.length || 0})
                </span>
                <button
                  onClick={() => setSelectedEtapaForPhoto(etapa.id)}
                  className="text-[11px] font-mono font-semibold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  + Anexar Foto
                </button>
              </div>

              {etapa.fotosDiario && etapa.fotosDiario.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {etapa.fotosDiario.map((foto) => (
                    <div
                      key={foto.id}
                      className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 group relative aspect-video"
                    >
                      <img
                        src={foto.fotoUrl}
                        alt={foto.legenda}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-slate-950/90 px-1 py-0.2 rounded text-slate-300">
                        {foto.data}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar Foto */}
      {selectedEtapaForPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              Anexar Foto ao Diário de Obra
            </h3>
            <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">URL da Imagem:</label>
                <input
                  type="url"
                  required
                  placeholder="https://exemplo.com/foto_canteiro.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs font-mono outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">Legenda Técnica:</label>
                <input
                  type="text"
                  placeholder="Ex: Conclusão do contrapiso com impermeabilização"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEtapaForPhoto(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Salvar Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
