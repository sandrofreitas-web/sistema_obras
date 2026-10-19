import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Layers,
  CheckCircle2,
  Clock,
  History,
  FileCode,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { PlantaProjeto, VersaoPlanta } from '../types';

interface BlueprintsScreenProps {
  projetoNome?: string;
  onOpenUploadModal?: () => void;
}

export const BlueprintsScreen: React.FC<BlueprintsScreenProps> = ({
  projetoNome = 'Reforma ICENV 2026',
}) => {
  // Pranchas oficiais cadastradas na Fase 1
  const [plantas, setPlantas] = useState<PlantaProjeto[]>([
    {
      id: 'planta-arq-01',
      projetoId: 'proj-icenv-pastoral',
      codigoPrancha: 'ARQ-01',
      titulo: 'Demolição, Layout e Especificações Executivas — Banheiro Casa Pastoral',
      disciplina: 'Arquitetura',
      arquivoUrl: 'plantas/ARQ-01_Pastoral_R01.pdf',
      revisaoVigente: 'R01',
      dataUltimaEmissao: '17/10/2026',
      versoes: [
        {
          id: 'v-arq-r01',
          plantaId: 'planta-arq-01',
          revisao: 'R01',
          dataEmissao: '17/10/2026',
          autorArquiteto: 'Arquiteto Parceiro',
          aprovadorGestor: 'Sandro Gestor',
          status: 'Vigente',
          notasAlteracao: 'Especificação executiva homologada: Porcelanato Eliane 90x90cm Palavcorda até o teto, metais Docol Nova Logg e Bacia Celite Smart.',
          metadadosExtracao: {
            area_piso: '3,30 m²',
            area_parede: '23,00 m²',
            perimetro: '7,40 m',
            pe_direito: '2,70 m',
            revestimento: 'Porcelanato Retificado Eliane 90x90cm Palavcorda (9 cx)',
          },
        },
        {
          id: 'v-arq-r00',
          plantaId: 'planta-arq-01',
          revisao: 'R00',
          dataEmissao: '13/10/2026',
          autorArquiteto: 'Arquiteto Parceiro',
          aprovadorGestor: 'Sandro Gestor',
          status: 'Superada',
          notasAlteracao: 'Emissão inicial de projeto e levantamento de áreas para estimativa preliminar.',
          metadadosExtracao: {
            area_piso: '3,30 m²',
            area_parede: '22,00 m²',
          },
        },
      ],
    },
    {
      id: 'planta-hid-01',
      projetoId: 'proj-icenv-pastoral',
      codigoPrancha: 'HID-01',
      titulo: 'Instalações Hidráulicas de Água Fria e Esgoto Sanitário — Banheiro Casa Pastoral',
      disciplina: 'Hidráulica',
      arquivoUrl: 'plantas/HID-01_Pastoral_R00.pdf',
      revisaoVigente: 'R00',
      dataUltimaEmissao: '17/10/2026',
      versoes: [
        {
          id: 'v-hid-r00',
          plantaId: 'planta-hid-01',
          revisao: 'R00',
          dataEmissao: '17/10/2026',
          autorArquiteto: 'Arquiteto Parceiro',
          aprovadorGestor: 'Sandro Gestor',
          status: 'Vigente',
          notasAlteracao: 'Isométrico aprovado com prumada de 50mm, ramais de água fria 25mm Tigre e ramais de esgoto 100mm/50mm/40mm.',
          metadadosExtracao: {
            pontos_agua: 4,
            pontos_esgoto: 3,
            tubulacao: 'PVC Soldável Tigre',
          },
        },
      ],
    },
  ]);

  const [selectedPlanta, setSelectedPlanta] = useState<PlantaProjeto>(plantas[0]);
  const [selectedVersao, setSelectedVersao] = useState<VersaoPlanta>(plantas[0].versoes[0]);
  const [isNewRevisionModalOpen, setIsNewRevisionModalOpen] = useState(false);
  const [newRevisaoCode, setNewRevisaoCode] = useState('R02');
  const [newNotas, setNewNotas] = useState('');

  const handleSelectPlanta = (planta: PlantaProjeto) => {
    setSelectedPlanta(planta);
    setSelectedVersao(planta.versoes[0]);
  };

  const handleSalvarRevisao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotas.trim()) return;

    const novaVersao: VersaoPlanta = {
      id: `v-${Date.now()}`,
      plantaId: selectedPlanta.id,
      revisao: newRevisaoCode,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      autorArquiteto: 'Arquiteto Titular',
      aprovadorGestor: 'Sandro Gestor',
      status: 'Vigente',
      notasAlteracao: newNotas,
      metadadosExtracao: selectedVersao.metadadosExtracao,
    };

    // Marca as anteriores como superadas
    const versoesAtualizadas = selectedPlanta.versoes.map((v) => ({
      ...v,
      status: 'Superada' as const,
    }));

    const plantaAtualizada: PlantaProjeto = {
      ...selectedPlanta,
      revisaoVigente: newRevisaoCode,
      dataUltimaEmissao: new Date().toLocaleDateString('pt-BR'),
      versoes: [novaVersao, ...versoesAtualizadas],
    };

    setPlantas(plantas.map((p) => (p.id === selectedPlanta.id ? plantaAtualizada : p)));
    setSelectedPlanta(plantaAtualizada);
    setSelectedVersao(novaVersao);
    setIsNewRevisionModalOpen(false);
    setNewNotas('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header da Tela */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              📐 Gestão de Plantas & Engenharia
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Versionamento R00, R01 e As-Built
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Pranchas, Memoriais e Controle de Revisões
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conexão direta entre os desenhos dos arquitetos e as listas de compras e quantitativos do gestor.
          </p>
        </div>

        <button
          onClick={() => setIsNewRevisionModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>+ Subir Nova Revisão</span>
        </button>
      </div>

      {/* Grid Principal: Lista de Pranchas (1/3) vs Detalhes da Revisão (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Pranchas Cadastradas */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Pranchas do Projeto Piloto ({plantas.length})
          </h2>

          {plantas.map((p) => {
            const isSelected = selectedPlanta.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPlanta(p)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100 font-mono">
                    {p.codigoPrancha}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Vigente: {p.revisaoVigente}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                  {p.titulo}
                </h3>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Disciplina: {p.disciplina}</span>
                  <span>{p.versoes.length} versão(ões)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna 2 e 3: Inspetor da Revisão Selecionada */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            {/* Cabeçalho do Inspetor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {selectedPlanta.disciplina} — {selectedPlanta.codigoPrancha}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedPlanta.titulo}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Revisão Selecionada:</span>
                <select
                  value={selectedVersao.id}
                  onChange={(e) => {
                    const v = selectedPlanta.versoes.find((x) => x.id === e.target.value);
                    if (v) setSelectedVersao(v);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedPlanta.versoes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.revisao} ({v.status}) — {v.dataEmissao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metadados da Versão */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs mb-4">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status da Revisão</span>
                <span className={`font-black ${selectedVersao.status === 'Vigente' ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {selectedVersao.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Data de Emissão</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedVersao.dataEmissao}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Arquiteto Autor</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedVersao.autorArquiteto || 'Arquiteto'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Homologado por</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedVersao.aprovadorGestor || 'Sandro Gestor'}</span>
              </div>
            </div>

            {/* Notas de Alteração / O que mudou */}
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-500" />
                <span>Notas Executivas da Revisão {selectedVersao.revisao}</span>
              </h3>
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedVersao.notasAlteracao}
              </div>
            </div>

            {/* Cotas e Áreas Extraídas por IA */}
            {selectedVersao.metadadosExtracao && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-blue-500" />
                  <span>Quadro de Áreas e Especificações Extraídas da Prancha</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(selectedVersao.metadadosExtracao).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">{key.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação de Nova Revisão */}
      {isNewRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Emitir Nova Revisão para {selectedPlanta.codigoPrancha}
              </h3>
              <button
                onClick={() => setIsNewRevisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarRevisao} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Código da Revisão
                </label>
                <input
                  type="text"
                  value={newRevisaoCode}
                  onChange={(e) => setNewRevisaoCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  O que mudou nesta revisão? (Notas do Arquiteto)
                </label>
                <textarea
                  rows={4}
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  placeholder="Ex: Alterada altura de revestimento cerâmico para 2,70m e ajustados pontos de tomada da pia..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Homologar Revisão Vigente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
