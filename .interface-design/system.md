# ObraCerta — Design System & Interface Guidelines

## 1. Direction & Intent
- **Domain:** Engenharia civil corporativa, orçamento de obras (WBS / EAP), formação de preço, BDI, tabelas SINAPI, suprimentos e cronograma físico-financeiro.
- **Vibe / Feel:** Enterprise Engineering Workbench (híbrido Sienge / Mais Controle + ergonomia Linear). Viewport fluido de 100% sem limites artificiais de largura (`max-w-7xl` banido da área de trabalho), alta densidade informativa, precisão cirúrgica e foco analítico contínuo.
- **Focal Point:** Grade WBS hierárquica em árvore com telemetria financeira em tempo real (`tabular-nums`) e painel inspetor lateral acoplado.

## 2. Layout & Aproveitamento de Tela
- **Full Viewport Shell:** Ocupação de 100% da largura e altura da janela (`h-screen w-screen overflow-hidden`).
- **Sidebar Ultra-Compacta (64px):** Menu vertical à esquerda com ícones de 20px, expansão hover suave para 224px, liberando mais de 95% do monitor para a planilha analítica.
- **Top Context Header (54px):** Identificação da obra ativa com cliente/local, base de custos oficial (`SINAPI SP 2026`), status em andamento, switch de permissão de edição e ações rápidas.
- **Sub-Tabs Strip (40px):** Navegação horizontal entre módulos do projeto (`Orçamento WBS`, `Proposta Comercial`, `Mapa de Cotação`).

## 3. Depth Strategy & Surfaces
- **Depth Strategy:** Borders-only com sutis transparências (`border-slate-800`, `rgba(255,255,255,0.06-0.10)`).
- **Backgrounds:**
  - Base Canvas: `#060911` (Deep Charcoal)
  - Sidebar & Top Header: `#070a12` / `#090d16`
  - WBS Macro-Row (Nível 1): `#0e1424` (Aço técnico com realce em azul escuro)
  - WBS Sub-Row (Nível 2): `#060911` alternando com `rgba(255,255,255,0.02)` no hover
  - Inspector Drawer (Opção 2): `#090d16` com borda lateral `#1e293b`
  - Sticky Footer Dock (Opção 1): `#090d16/95` com `backdrop-blur-md`
  - Control Hover: `rgba(255, 255, 255, 0.05)`

## 4. Typography & Numbers
- **Font Stack:**
  - UI Sans: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Data / Monospace: `'JetBrains Mono', ui-monospace, monospace`
- **Tabular Numbers:** Todo valor financeiro, SKU, código de barras, metragem e percentual de BDI utiliza obrigatoriamente `font-mono tabular-nums`.

## 5. Key Component Patterns
- **WBS Hierarchical Tree Table:** Tabela analítica de 2 níveis (Nível 1: Macro-Etapas sintéticas numeradas como `1.0`, `2.0` com subtotais e BDI; Nível 2: Insumos analíticos numerados como `1.1`, `1.2` com quantidade, perdas, custo unitário e preço de venda).
- **Lateral Item Inspector (Opção 2):** Painel lateral slide-over (380px–420px) acionado pelo clique em qualquer linha da planilha, exibindo foto, comparativo de lojas, memória de cálculo com perda técnica, status de compra e notas de campo.
- **Sticky Footer Summary Dock (Opção 1):** Barra de rodapé executiva de 56px permanentemente visível na base da tela com botões de inserção de etapa e resumo em tempo real: Custo Total Direto, BDI Global (com edição inline rápida 📝) e Preço Global de Venda.
- **Engineering Toolbar:** Barra de ferramentas compacta de 40px com busca rápida, alternância de agrupamento (Macro-Etapas vs. Ambientes), filtro de status e controle de expandir/recolher todas as seções.
