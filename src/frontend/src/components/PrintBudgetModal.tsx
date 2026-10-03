import React from 'react';
import { X, Printer, Download, HardHat } from 'lucide-react';
import { Projeto, Cenario } from '../types';

interface PrintBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Projeto | null;
}

export const PrintBudgetModal: React.FC<PrintBudgetModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen || !project) return null;

  const currentScenario =
    project.cenarios.find((c) => c.id === project.cenarioAtivoId) || project.cenarios[0];

  const rawTotal = (currentScenario?.itens || []).reduce((acc, i) => acc + i.precoTotal, 0);
  const contingency = (rawTotal * (project.contingenciaPercent ?? 10)) / 100;
  const grandTotal = rawTotal + contingency;
  const costPerM2 = project.areaTotalM2 > 0 ? grandTotal / project.areaTotalM2 : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl print:border-none print:shadow-none print:max-w-none print:max-h-none print:bg-white print:text-black">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Visualização de Impressão / PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans print:p-4 space-y-6">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                  <HardHat className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-slate-950">
                  Obra<span className="text-amber-600">Certa</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Relatório Executivo de Orçamento de Materiais
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600">
              <p>
                <strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}
              </p>
              <p>
                <strong>Cenário:</strong> {currentScenario?.nome}
              </p>
            </div>
          </div>

          {/* Project Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Projeto:</span>
              <strong className="text-slate-900 font-bold text-sm">{project.nome}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Cliente:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {project.cliente || 'Particular'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Área Total:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {project.areaTotalM2} m²
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Previsão de Término:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {new Date(project.dataPrevisao).toLocaleDateString('pt-BR')}
              </strong>
            </div>
          </div>

          {/* Rooms and Items Table */}
          <div className="space-y-6">
            {project.ambientes.map((amb) => {
              const items = (currentScenario?.itens || []).filter((i) => i.ambienteId === amb.id);
              const ambSubtotal = items.reduce((acc, i) => acc + i.precoTotal, 0);

              if (items.length === 0) return null;

              return (
                <div key={amb.id} className="space-y-2">
                  <div className="flex justify-between items-baseline border-b border-slate-300 pb-1">
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                      {amb.nome} ({amb.areaPisoM2} m² de piso)
                    </h3>
                    <span className="text-xs font-bold text-slate-800">
                      Subtotal: R$ {ambSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                        <th className="py-1.5 px-2">Material / Modelo</th>
                        <th className="py-1.5 px-2">Fabricante</th>
                        <th className="py-1.5 px-2 text-center">Qtd Base</th>
                        <th className="py-1.5 px-2 text-center">Perda %</th>
                        <th className="py-1.5 px-2 text-center">Qtd Final</th>
                        <th className="py-1.5 px-2 text-right">Unitário</th>
                        <th className="py-1.5 px-2 text-right">Total (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-2 font-medium text-slate-900">
                            {item.materialNome}
                          </td>
                          <td className="py-1.5 px-2 text-slate-600">{item.fabricante}</td>
                          <td className="py-1.5 px-2 text-center text-slate-600">
                            {item.quantidadeBase} {item.unidade}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-600">
                            +{item.perdaTecnicaPercent}%
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold text-slate-900">
                            {item.quantidadeComPerda} {item.unidade}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-700">
                            R$ {item.precoUnitario.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                            R$ {item.precoTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Consolidated Financial Summary */}
          <div className="border-t-2 border-slate-900 pt-4 flex justify-end">
            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Bruto de Materiais:</span>
                <span className="font-semibold text-slate-900">R$ {rawTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Margem de Contingência ({project.contingenciaPercent}%):</span>
                <span className="font-semibold text-slate-900">R$ {contingency.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
                <span>TOTAL ESTIMADO:</span>
                <span className="text-amber-700">R$ {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Custo Médio por m²:</span>
                <span>R$ {costPerM2.toFixed(2)} / m²</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Responsável Técnico / Arquiteto(a)</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Cliente / Proprietário(a)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
