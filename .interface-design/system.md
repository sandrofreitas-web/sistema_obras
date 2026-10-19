# ObraCerta — Design System & Interface Guidelines (v2.2)

## 1. Direction & Intent
- **Domain:** Engenharia civil corporativa, gestão executiva de obras, orçamento analítico (WBS / EAP), suprimentos e conciliação de notas fiscais reais, controle de pranchas arquitetônicas (R00/R01) e acompanhamento de campo no canteiro.
- **Vibe / Feel:** Enterprise Engineering Workbench (híbrido Linear + precisão industrial Trimble/Leica Geosystems). Viewport fluido de 100%, alta densidade informativa, superfícies escuras em grafite/ardósia, acentos pontuais em âmbar de segurança/canteiro (`#f59e0b` / `#fbbf24`), e numerais tabulares de precisão (`tabular-nums`).
- **Focal Point:** Termômetro Físico-Financeiro com Semáforo de Contingência e Grade WBS com telemetria financeira em tempo real.

## 2. Layout & Navegação Estratificada
- **Full Viewport Shell:** Ocupação de 100% da largura e altura da janela (`h-screen w-screen overflow-hidden`).
- **Sidebar Fixa Categorizada (256px / w-64):**
  - Largura fixa sem trepidação de hover.
  - Subcategorias técnicas com tipografia `text-[9px] font-mono tracking-widest uppercase text-slate-400 font-bold`:
    1. *Gestão & Diretoria* (Cockpit & Relatórios, Obras & Projetos, Painel de Canteiro [CAMPO])
    2. *Engenharia & Projetos* (Plantas & Revisões, Orçamento WBS, Cronograma Físico & RDO)
    3. *Suprimentos & Finanças* (Compras & NFs Reais, Lojas & Fornecedores, Catálogo de Insumos)
    4. *Tabelas & Normas* (Taxonomia & SINAPI SP 2026)
  - Micro-interação tátil `active:scale-[0.98]` e active state de alto contraste em âmbar sólido (`bg-amber-400 text-slate-950 font-black`).
- **Top Context Header (54px):** Identificação da obra ativa com cliente/local, base de custos oficial (`SINAPI SP 2026`), status em andamento e botão de recarga PWA instantânea.
- **Mobile Canteiro de Bolso (< 768px):**
  - Zero formulários pesados ou tabelas espremidas.
  - Cards macro: Termômetro Físico x Desembolso, Semáforo de Margem Técnica (10%), Frente Ativa com seletor touch de avanço em 1 toque (`0%`, `25%`, `50%`, `75%`, `100%`).
  - Feed fotográfico de Diário de Obra (RDO) com Lightbox ampliada em tela cheia.
  - Checklist touch-friendly de recebimento de materiais no canteiro.

## 3. Depth Strategy & Surfaces
- **Depth Strategy:** Borders-only com sutis transparências e elevações whisper-quiet (`border-slate-800/80`, `rgba(255,255,255,0.06)`).
- **Backgrounds:**
  - Base Canvas: `#060911` (Deep Charcoal)
  - Sidebar: `#070a12`
  - Top Header: `#090d16`
  - Cards Executivos & KPIs: `#0b0f19` com borda `border-slate-800/80`
  - Sub-Cards & Linhas Internas: `#06080e` / `#0f172a`
  - Control Hover: `rgba(255, 255, 255, 0.05)`

## 4. Typography & Numbers
- **Font Stack:**
  - UI Sans: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Data / Monospace: `'JetBrains Mono', ui-monospace, monospace`
- **Tabular Numbers Obrigatório:** Todo valor financeiro (R$), percentual (`%`), código de barras EAN, quantidade e número de NF utiliza obrigatoriamente `font-mono tabular-nums`.

## 5. Regra 60/30/10 de Cores
- **60% Estrutura:** Tons neutros escuros de ardósia e grafite (`#060911`, `#070a12`, `#0b0f19`, `slate-400`, `slate-500`).
- **30% Superfícies & Apoio:** Painéis de elevação `#0b0f19`, bordas suaves `border-slate-800`, texto primário branco/gelo.
- **10% Acentos Comunicativos:**
  - **Âmbar (`#f59e0b` / `#fbbf24`):** Identidade de obra, ações primárias, seleções e faturas.
  - **Esmeralda (`#10b981`):** Saldo em conta, conformidade do teto e etapas concluídas.
  - **Rubi / Rose (`#f43f5e`):** Alertas de estouro orçamentário e status crítico.
