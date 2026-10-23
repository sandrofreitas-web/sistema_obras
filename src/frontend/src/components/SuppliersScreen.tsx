import React, { useState, useMemo } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Search,
  Filter,
  TrendingUp,
  FileText,
  Printer,
  ExternalLink,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Building,
  Truck,
  Layers,
} from 'lucide-react';
import { Loja, Projeto } from '../types';

interface SuppliersScreenProps {
  lojas: Loja[];
  project: Projeto | null;
  onNavigateTab: (tabId: any) => void;
}

export const SuppliersScreen: React.FC<SuppliersScreenProps> = ({
  lojas,
  project,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Base rica de fornecedores oficiais homologados no ecossistema ICENV
  const fornecedoresCompletos = useMemo(() => {
    const baseHomologada: (Loja & { especialidade: string; tipoParceiro: string; status: string; historico2024: number; volume2026: number; comprasCount: number })[] = [
      {
        id: 'loja-jer-deposito',
        nome: 'JER Depósito de Mat. Construção',
        rede: 'JER',
        tipoParceiro: 'Depósito de Bairro',
        especialidade: 'Cimento, areia, brita, blocos, argamassa e insumos brutos de pronta entrega',
        endereco: 'Rua Principal do Bairro, 150',
        cidade: 'São Paulo - SP',
        telefone: '(11) 5562-1200',
        status: 'Homologado',
        historico2024: 3479.25,
        volume2026: 0.00,
        comprasCount: 0,
      },
      {
        id: 'loja-telhanorte-marginal',
        nome: 'Telhanorte Marginal Tietê',
        rede: 'Telhanorte',
        tipoParceiro: 'Home Center',
        especialidade: 'Porcelanatos Eliane 90x90, louças Celite/Deca, hidráulica Tigre, metais Docol Nova Logg e tintas',
        endereco: 'Av. Pres. Castelo Branco, 6201 - Água Branca',
        cidade: 'São Paulo - SP',
        telefone: '(11) 3404-4000',
        status: 'Homologado',
        historico2024: 5808.48,
        volume2026: 10661.79, // 3.261,79 + 6.536,46 + 863,54
        comprasCount: 3,
      },
      {
        id: 'loja-sodimac-tiete',
        nome: 'Sodimac Dicico Tietê',
        rede: 'Sodimac',
        tipoParceiro: 'Home Center',
        especialidade: 'Esquadrias, janelas venezianas CRV 6 folhas, portas e acabamentos gerais',
        endereco: 'Av. Pres. Castelo Branco, 4800 - Marginal Tietê',
        cidade: 'São Paulo - SP',
        telefone: '(11) 3616-5000',
        status: 'Homologado',
        historico2024: 0.00,
        volume2026: 4264.41,
        comprasCount: 1,
      },
      {
        id: 'loja-zumkeller-mandaqui',
        nome: 'Depósito Zumkeller',
        rede: 'Zumkeller',
        tipoParceiro: 'Depósito & Caçambas',
        especialidade: 'Demolição, tubulações de PVC Krona, brita, cimento e caçambas de descarte',
        endereco: 'Avenida Zumkeller, 308 - Mandaqui',
        cidade: 'São Paulo - SP',
        telefone: '(11) 2231-1415',
        status: 'Homologado',
        historico2024: 0.00,
        volume2026: 4953.32, // 4.195,95 + 46,45 + 710,92
        comprasCount: 3,
      },
      {
        id: 'loja-longametragem-ferragens',
        nome: 'Longametragem Ferragens LTDA',
        rede: 'Longametragem',
        tipoParceiro: 'Ferragens & Fixação',
        especialidade: 'Canaletas baianas, vigas de respaldo, parafusos, buchas e ferragens estruturais',
        endereco: 'Av. Santa Inês, 780 - Mandaqui',
        cidade: 'São Paulo - SP',
        telefone: '(11) 2232-9080',
        status: 'Homologado',
        historico2024: 0.00,
        volume2026: 52.80,
        comprasCount: 1,
      },
      {
        id: 'loja-leroy-interlagos',
        nome: 'Leroy Merlin Interlagos',
        rede: 'Leroy Merlin',
        tipoParceiro: 'Home Center',
        especialidade: 'Ralos sifonados, registros Deca, chuveiros, plafons LED, torneiras elétricas e tintas',
        endereco: 'Av. Interlagos, 2255 - Interlagos',
        cidade: 'São Paulo - SP',
        telefone: '(11) 4007-1380',
        status: 'Homologado',
        historico2024: 1996.40,
        volume2026: 0.00,
        comprasCount: 0,
      },
      {
        id: 'loja-hiper-pedras',
        nome: 'Hiper Pedras',
        rede: 'Marmoraria',
        tipoParceiro: 'Marmoraria Especializada',
        especialidade: 'Soleiras, peitoris, divisórias de boxes e bancadas em granito cinza corumbá polido',
        endereco: 'Rua das Pedras, 120 - Zona Sul',
        cidade: 'São Paulo - SP',
        telefone: '(11) 5562-8899',
        status: 'Homologado',
        historico2024: 1151.46,
        volume2026: 0.00,
        comprasCount: 0,
      },
      {
        id: 'loja-gesso-mandaqui',
        nome: 'Gesso Mandaqui',
        rede: 'Gesso e Drywall',
        tipoParceiro: 'Forros e Drywall',
        especialidade: 'Placas drywall RU resistentes à umidade, perfis metálicos, cantoneiras e forros',
        endereco: 'Av. Direitos Humanos, 400 - Mandaqui',
        cidade: 'São Paulo - SP',
        telefone: '(11) 2231-5500',
        status: 'Homologado',
        historico2024: 100.00,
        volume2026: 0.00,
        comprasCount: 0,
      },
      {
        id: 'loja-andra-eletrica',
        nome: 'ANDRA Materiais Elétricos',
        rede: 'ANDRA',
        tipoParceiro: 'Distribuidora Elétrica',
        especialidade: 'Cabos flexíveis 750V, quadros de distribuição, disjuntores DIN e eletrodutos',
        endereco: 'Rua Santa Efigênia, 500 - Centro',
        cidade: 'São Paulo - SP',
        telefone: '(11) 3352-1000',
        status: 'Homologado',
        historico2024: 249.65,
        volume2026: 0.00,
        comprasCount: 0,
      },
      {
        id: 'loja-serralheria-parceira',
        nome: 'Serralheria Parceira',
        rede: 'Serralheria',
        tipoParceiro: 'Esquadrias & Vidros',
        especialidade: 'Janelas de vidro temperado, caixilhos de alumínio e ferragens sob medida',
        endereco: 'Rua das Esquadrias, 45 - Zona Norte',
        cidade: 'São Paulo - SP',
        telefone: '(11) 2234-7700',
        status: 'Homologado',
        historico2024: 3680.00,
        volume2026: 0.00,
        comprasCount: 0,
      },
    ];

    return baseHomologada;
  }, []);

  // Filtros de busca e categoria
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedoresCompletos.filter((f) => {
      const matchSearch =
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.endereco || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat =
        selectedCategory === 'todos' ||
        f.tipoParceiro.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchSearch && matchCat;
    });
  }, [fornecedoresCompletos, searchTerm, selectedCategory]);

  const totalHistorico2024 = fornecedoresCompletos.reduce((acc, f) => acc + f.historico2024, 0);
  const totalVolume2026 = fornecedoresCompletos.reduce((acc, f) => acc + f.volume2026, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Rede Credenciada ICENV
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Base Unificada de Fornecedores
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-amber-400" />
            <span>Lojas & Fornecedores Homologados</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rede de parceiros comerciais homologados com histórico consolidado de compras reais da obra.
          </p>
        </div>
      </div>

      {/* KPI Cards de Suprimentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Parceiros Homologados</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {fornecedoresCompletos.length} fornecedores
          </div>
          <div className="text-xs text-emerald-400 mt-2 font-semibold">
            100% com tabela auditada
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturado Obra 2026</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            R$ {totalVolume2026.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Zumkeller, Telhanorte, Sodimac e Longametragem
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Histórico Real 2024</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            R$ {totalHistorico2024.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Banheiro Acessibilidade e Esquadrias
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Acumulado Geral</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            R$ {(totalHistorico2024 + totalVolume2026).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Compras de materiais do ecossistema
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, especialidade ou endereço..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Categorias / Tipos */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { id: 'todos', label: 'Todos os Parceiros' },
            { id: 'home center', label: 'Home Centers' },
            { id: 'depósito', label: 'Depósitos' },
            { id: 'marmoraria', label: 'Marmoraria' },
            { id: 'elétrica', label: 'Elétrica' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {fornecedoresFiltrados.map((forn) => {
          const temCompras2026 = forn.volume2026 > 0;

          return (
            <div
              key={forn.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-700/50 mb-1.5">
                      {forn.tipoParceiro}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                      {forn.nome}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Homologado
                  </span>
                </div>

                {/* Especialidade */}
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {forn.especialidade}
                </p>

                {/* Metadados de Contato */}
                <div className="space-y-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 mb-4">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{forn.endereco}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{forn.telefone}</span>
                  </div>
                </div>

                {/* Financeiro Consolidado */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Histórico 2024</span>
                    <span className="font-bold text-slate-200">
                      R$ {forn.historico2024.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Compras 2026</span>
                    <span className={`font-bold ${temCompras2026 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      R$ {forn.volume2026.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigateTab('catalogo')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
                >
                  Ver Insumos
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
