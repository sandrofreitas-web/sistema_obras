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
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider">
                Módulo 5 • Acompanhamento Físico
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Cronograma & Diário de Obra
            </h1>
            <p className="text-xs text-slate-400">
              Controle de avanço físico por etapas estruturais e registros fotográficos datados
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center sm:text-right min-w-[180px]">
            <span className="text-xs font-semibold text-slate-400">Avanço Físico Global</span>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {overallPhysicalProgress}%
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-2">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${overallPhysicalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Etapas Cards */}
      <div className="space-y-4">
        {etapas.map((etapa) => {
          const isDone = etapa.percentualAvanco === 100;
          const isInProgress = etapa.percentualAvanco > 0 && etapa.percentualAvanco < 100;

          return (
            <div
              key={etapa.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              {/* Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isInProgress
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : etapa.ordem}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{etapa.nome}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDone
                          ? 'text-emerald-400'
                          : isInProgress
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {isDone ? 'Concluída' : isInProgress ? 'Em Andamento' : 'Não Iniciada'}
                    </span>
                  </div>
                </div>

                {/* Progress Controls */}
                <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-300 font-semibold">Progresso:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={etapa.percentualAvanco}
                    onChange={(e) => handleUpdateProgress(etapa.id, parseInt(e.target.value, 10))}
                    className="accent-amber-400 cursor-pointer w-28 sm:w-36"
                  />
                  <strong className="text-sm font-black text-amber-400 min-w-[45px] text-right">
                    {etapa.percentualAvanco}%
                  </strong>
                </div>
              </div>

              {/* Stage Observations */}
              {etapa.observacoes && (
                <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  {etapa.observacoes}
                </p>
              )}

              {/* Photo Diary (Diário Fotográfico) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Diário Fotográfico desta Etapa ({etapa.fotosDiario?.length || 0} fotos)
                  </span>
                  <button
                    onClick={() => setSelectedEtapaForPhoto(etapa.id)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Foto
                  </button>
                </div>

                {/* Gallery */}
                {etapa.fotosDiario && etapa.fotosDiario.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {etapa.fotosDiario.map((foto) => (
                      <div
                        key={foto.id}
                        className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group"
                      >
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={foto.fotoUrl}
                            alt={foto.legenda}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] bg-slate-950/80 px-1.5 py-0.2 rounded text-slate-300">
                            {foto.data}
                          </span>
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] text-slate-300 truncate" title={foto.legenda}>
                            {foto.legenda}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Nenhuma foto registrada para esta etapa ainda.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Photo to Stage */}
      {selectedEtapaForPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">
              Adicionar Foto ao Diário de Obra
            </h3>
            <form onSubmit={handleAddPhoto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL da Foto (ou Unsplash) *
                </label>
                <input
                  type="url"
                  required
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Legenda / Observação
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Ex: Assentamento do contrapiso concluído"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Sample quick photos */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1">Ou use uma foto de exemplo:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrl(
                        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 text-amber-300 hover:bg-slate-700"
                  >
                    Demolição
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrl(
                        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 text-amber-300 hover:bg-slate-700"
                  >
                    Instalações
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrl(
                        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 text-amber-300 hover:bg-slate-700"
                  >
                    Revestimento
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEtapaForPhoto(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
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
