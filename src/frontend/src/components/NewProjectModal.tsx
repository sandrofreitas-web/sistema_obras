import React, { useState } from 'react';
import { X, FolderPlus, Plus, Trash2, Check } from 'lucide-react';
import { Projeto, Ambiente } from '../types';
import { storageService } from '../services/storageService';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Projeto) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cliente, setCliente] = useState('');
  const [areaTotalM2, setAreaTotalM2] = useState<number | ''>(65);
  const [dataPrevisao, setDataPrevisao] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [contingenciaPercent, setContingenciaPercent] = useState<number>(10);

  // Environments
  const [ambientes, setAmbientes] = useState<Array<{ nome: string; areaPisoM2: number }>>([
    { nome: 'Sala de Estar / Jantar', areaPisoM2: 24 },
    { nome: 'Cozinha & Lavanderia', areaPisoM2: 12 },
    { nome: 'Banheiro Social', areaPisoM2: 4.5 },
    { nome: 'Dormitório 1', areaPisoM2: 14 },
  ]);

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomArea, setNewRoomArea] = useState<number | ''>(10);

  if (!isOpen) return null;

  const handleAddRoom = () => {
    if (!newRoomName || newRoomArea === '') return;
    setAmbientes([...ambientes, { nome: newRoomName, areaPisoM2: Number(newRoomArea) }]);
    setNewRoomName('');
    setNewRoomArea(10);
  };

  const handleRemoveRoom = (index: number) => {
    setAmbientes(ambientes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    const projectId = `proj-${Date.now()}`;
    const cenarioPadraoId = `cenario-padrao-${Date.now()}`;
    const cenarioEcoId = `cenario-eco-${Date.now()}`;

    const formattedAmbientes: Ambiente[] = ambientes.map((a, idx) => ({
      id: `amb-${Date.now()}-${idx}`,
      projetoId: projectId,
      nome: a.nome,
      areaPisoM2: a.areaPisoM2,
    }));

    const newProject: Projeto = {
      id: projectId,
      nome,
      descricao: descricao || 'Projeto de reforma e especificação de materiais',
      cliente: cliente || undefined,
      areaTotalM2: Number(areaTotalM2) || 60,
      dataInicio: new Date().toISOString().split('T')[0],
      dataPrevisao,
      status: 'planejamento',
      contingenciaPercent,
      cenarioAtivoId: cenarioPadraoId,
      ambientes: formattedAmbientes,
      cenarios: [
        {
          id: cenarioPadraoId,
          projetoId: projectId,
          nome: 'Cenário Padrão / Custo-Benefício',
          itens: [],
        },
        {
          id: cenarioEcoId,
          projetoId: projectId,
          nome: 'Cenário Econômico',
          itens: [],
        },
      ],
      etapas: [
        {
          id: `etapa-1-${projectId}`,
          projetoId: projectId,
          nome: '1. Demolição & Limpeza',
          ordem: 1,
          percentualAvanco: 0,
          status: 'nao_iniciada',
          fotosDiario: [],
        },
        {
          id: `etapa-2-${projectId}`,
          projetoId: projectId,
          nome: '2. Infraestrutura (Elétrica & Hidráulica)',
          ordem: 2,
          percentualAvanco: 0,
          status: 'nao_iniciada',
          fotosDiario: [],
        },
        {
          id: `etapa-3-${projectId}`,
          projetoId: projectId,
          nome: '3. Revestimentos & Pisos',
          ordem: 3,
          percentualAvanco: 0,
          status: 'nao_iniciada',
          fotosDiario: [],
        },
        {
          id: `etapa-4-${projectId}`,
          projetoId: projectId,
          nome: '4. Pintura & Acabamentos',
          ordem: 4,
          percentualAvanco: 0,
          status: 'nao_iniciada',
          fotosDiario: [],
        },
      ],
      compras: [],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    storageService.saveProject(newProject);
    storageService.setActiveProjectId(newProject.id);
    onProjectCreated(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Novo Projeto de Reforma / Obra</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nome e Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Projeto *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Reforma Apto Pinheiros 80m²"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cliente / Proprietário
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ex: Família Souza"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Área Total e Margem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Área Total (m²) *
              </label>
              <input
                type="number"
                required
                value={areaTotalM2}
                onChange={(e) => setAreaTotalM2(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Previsão de Término
              </label>
              <input
                type="date"
                value={dataPrevisao}
                onChange={(e) => setDataPrevisao(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                Margem Contingência (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={contingenciaPercent}
                onChange={(e) => setContingenciaPercent(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Ambientes list */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 block">
              Ambientes da Reforma ({ambientes.length})
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {ambientes.map((amb, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs"
                >
                  <span className="text-white font-medium">{amb.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{amb.areaPisoM2} m² de piso</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add room inline */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Novo ambiente (ex: Varanda Gourmet)..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <input
                type="number"
                value={newRoomArea}
                onChange={(e) => setNewRoomArea(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="m²"
                className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddRoom}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
