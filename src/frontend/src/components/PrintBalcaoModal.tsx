import React, { useState } from 'react';
import { Printer, Store, Filter, X, CheckSquare, FileText } from 'lucide-react';
import { Projeto } from '../types';

interface PrintBalcaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Projeto | null;
}

export const PrintBalcaoModal: React.FC<PrintBalcaoModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [selectedLoja, setSelectedLoja] = useState<string>('todos');

  if (!isOpen) return null;

  // Base mestra de itens para cotação e compra presencial de balcão
  const itensMestres = [
    { codigo: 'CIM-01', descricao: 'Cimento CP II-E-32 50kg Votoran / Cauê', fabricante: 'Votoran', unidade: 'saco 50kg', fator: 50.0, qtd: 10, precoRef: 34.50, loja: 'JER Depósito de Mat. Construção' },
    { codigo: 'ARG-03', descricao: 'Argamassa Colante AC-III Cinza 20kg Externa', fabricante: 'Quartzolit', unidade: 'saco 20kg', fator: 20.0, qtd: 13, precoRef: 37.84, loja: 'JER Depósito de Mat. Construção' },
    { codigo: 'EL-9090', descricao: 'Porcelanato Palavcorda Acetinado 90x90cm Cx 2,43m²', fabricante: 'Eliane', unidade: 'caixa (9 cx = 21,87m²)', fator: 2.43, qtd: 9, precoRef: 145.04, loja: 'Telhanorte' },
    { codigo: 'HID-50', descricao: 'Tê Soldável 90° PVC Água Fria 50mm (Prumada)', fabricante: 'Tigre', unidade: 'un', fator: 1.0, qtd: 1, precoRef: 14.50, loja: 'Telhanorte' },
    { codigo: 'HID-25L', descricao: 'Cotovelo 90° Azul c/ Bucha Latão 25mm x 1/2" (Pontos)', fabricante: 'Tigre', unidade: 'un', fator: 1.0, qtd: 10, precoRef: 7.90, loja: 'Telhanorte' },
    { codigo: 'SAN-100', descricao: 'Cotovelo 90° PVC Esgoto Primário 100mm (Bacia)', fabricante: 'Tigre', unidade: 'un', fator: 1.0, qtd: 4, precoRef: 8.50, loja: 'Telhanorte' },
    { codigo: 'BAC-CEL', descricao: 'Kit Bacia Sanitária com Caixa Acoplada Smart Branca', fabricante: 'Celite', unidade: 'conjunto', fator: 1.0, qtd: 1, precoRef: 1404.53, loja: 'Telhanorte' },
    { codigo: 'TOR-DOC', descricao: 'Torneira Lavatório Mesa Bica Alta Nova Logg', fabricante: 'Docol', unidade: 'un', fator: 1.0, qtd: 1, precoRef: 579.90, loja: 'Telhanorte' },
    { codigo: 'JAN-CRV', descricao: 'Veneziana 6 Folhas 100x150cm Vidro Liso Alumínio Branco', fabricante: 'CRV', unidade: 'un', fator: 1.0, qtd: 2, precoRef: 1949.00, loja: 'Sodimac Dicico Tietê' },
  ];

  const itensFiltrados = selectedLoja === 'todos'
    ? itensMestres
    : itensMestres.filter((it) => it.loja.toLowerCase().includes(selectedLoja.toLowerCase()));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl print:border-none print:shadow-none print:max-h-full print:p-0">
        
        {/* Barra Superior - Ocultada na Impressão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 print:hidden">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-500" />
              <span>Folha de Cotação e Compras de Balcão (A4 Print-Ready)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Formatação limpa com checkboxes e linhas pautadas para anotações em depósitos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro por Loja */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedLoja}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="todos">Todos os Depósitos</option>
                <option value="JER">JER Depósito (Bruto / Cimento)</option>
                <option value="Telhanorte">Telhanorte (Acabamentos/Hidráulica)</option>
                <option value="Sodimac">Sodimac (Esquadrias/Janelas)</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ÁREA DA FOLHA DE IMPRESSÃO (ESTILIZADA PARA PAPEL A4) */}
        {/* ========================================================================= */}
        <div className="text-slate-900 font-sans print:text-black">
          {/* Cabeçalho da Folha */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">
                📋 Lista de Cotação & Aquisição de Balcão
              </h1>
              <div className="text-xs text-slate-600 font-medium">
                {project?.nome || 'Reforma ICENV 2026 — Casa Pastoral & Bloco Masculino'}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              Data de Emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong><br/>
              Depósito: <strong>{selectedLoja === 'todos' ? 'Geral / Múltiplas Lojas' : selectedLoja}</strong>
            </div>
          </div>

          {/* Dados de Canteiro e Condição */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded-md text-[11px] mb-4 print:bg-slate-50 print:border print:border-slate-300">
            <div><strong>Responsável / Comprador:</strong> Sandro Gestor</div>
            <div><strong>Condição:</strong> Cartão Corporativo (até 6x) / Pix à Vista</div>
            <div><strong>Local de Entrega:</strong> ICENV Nova Vida (São Paulo - SP)</div>
          </div>

          {/* Tabela Pautada de Balcão */}
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold print:bg-slate-800">
                <th className="p-2 text-center w-8">Conf</th>
                <th className="p-2 text-center w-8">Item</th>
                <th className="p-2">Descrição Técnica & Marca Homologada</th>
                <th className="p-2 text-center w-24">Qtd Compra</th>
                <th className="p-2 text-right w-20">Preço Ref.</th>
                <th className="p-2 text-center w-24">Preço Real Loja</th>
                <th className="p-2 text-center w-24">Subtotal Real</th>
                <th className="p-2 text-center w-24">Visto / NF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itensFiltrados.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 text-center">
                    <div className="w-3.5 h-3.5 border border-slate-700 mx-auto rounded-sm"></div>
                  </td>
                  <td className="p-2 text-center font-bold text-slate-500 text-[11px]">{idx + 1}</td>
                  <td className="p-2">
                    <div className="font-bold text-slate-900">{it.descricao}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Marca: {it.fabricante} | Sugestão: {it.loja}
                    </div>
                  </td>
                  <td className="p-2 text-center font-black text-slate-800">{it.qtd} {it.unidade}</td>
                  <td className="p-2 text-right text-slate-600 font-mono">
                    R$ {it.precoRef.toFixed(2)}
                  </td>
                  <td className="p-2 border-b border-dotted border-slate-400"></td>
                  <td className="p-2 border-b border-dotted border-slate-400"></td>
                  <td className="p-2 border-b border-dotted border-slate-400"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Rodapé da Folha */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end text-[10px] text-slate-500">
            <div className="max-w-md">
              <strong>Orientações de Recebimento no Canteiro:</strong><br/>
              • Conferir integridade física de embalagens e lotes cerâmicos na descarga.<br/>
              • Enviar cupom fiscal ou NF-e no grupo oficial da obra para registro contábil e garantia.
            </div>
            <div className="text-center w-48 border-t border-slate-900 pt-1 text-slate-800 font-bold">
              Assinatura / Carimbo do Balcão
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
