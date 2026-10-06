# ObraCerta — Design System & Interface Guidelines

## 1. Direction & Intent
- **Domain:** Gestão técnica de suprimentos, engenharia civil, orçamentos executivos de obras e reformas prediais.
- **Vibe / Feel:** Técnico, preciso, denso, prancheta executiva de engenharia (Engineering Workbench / Linear / CAD). Menos "cards de e-commerce", mais tabelas analíticas e barras de telemetria integradas.
- **Focal Point:** Tabelas analíticas de insumos e balanço financeiro em tempo real com `tabular-nums`.

## 2. Depth Strategy & Surfaces
- **Depth Strategy:** Borders-only com sutis transparências (`border-slate-800`, `rgba(255,255,255,0.06-0.10)`).
- **Backgrounds:**
  - Base: `#020617` (Slate 950)
  - Surface 1 (Containers & Tables): `#0f172a` (Slate 900)
  - Surface 2 (Toolbars & Inset Fields): `#090d16` / `#020617`
  - Control Hover: `rgba(255, 255, 255, 0.04)`

## 3. Typography & Numbers
- **Font Stack:**
  - UI Sans: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Data / Monospace: `'JetBrains Mono', ui-monospace, monospace`
- **Tabular Numbers:** Todo valor financeiro, SKU, código de barras e percentual utiliza `font-mono tabular-nums`.

## 4. Key Component Patterns
- **Engineering Toolbar:** Barra de ferramentas compacta de 36px com busca rápida, pills de classes com contagem de itens, selects de loja e ordenação integrados.
- **Consolidated Telemetry Strip:** Barra horizontal contínua dividida por linhas verticais sutis (sem cards quadrados isolados), exibindo Subtotal, Margem de Perda, Total com Margem, Mão de Obra e Teto Global.
- **Technical Insumos Table:** Tabela de engenharia de alta densidade com miniatura técnica de 32x32px, badges compactos de fabricante, fator de embalagem calculado e ações de 1 clique (`+ Orçar`).
- **Fiscal Purchases Table:** Grade detalhada de notas fiscais com colunas analíticas (`Nº NF`, `Data`, `Fornecedor`, `Qtd`, `Unitário`, `Total Pago`).
