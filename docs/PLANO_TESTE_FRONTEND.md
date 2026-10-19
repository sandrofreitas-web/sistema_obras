# 🧪 Plano de Testes do Frontend v2.0 — Sistema de Obras (ICENV 2026)

## 1. Objetivo e Escopo

Garantir a confiabilidade operacional, a estabilidade visual e a ergonomia de uso do **Frontend Web Desktop & Mobile PWA** do Sistema de Obras antes da entrada em produção e da integração do pipeline N8N/WhatsApp (Fase 6).

### 🎯 Metas de Qualidade:
1. **Fidelidade Físico-Financeira:** Apresentação exata dos números do piloto ICENV 2026 (Teto R$ 53.800,00, Mão de Obra Wagner R$ 32.500,00 e Faturas de 17-18/10 R$ 14.926,20).
2. **Operação de Balcão (A4 Print-Ready):** Garantir que a lista de compras para cotação presencial seja impressa sem quebras desnecessárias, com fontes nítidas e colunas para preenchimento manual do vendedor.
3. **Controle de Projetos & Plantas:** Rastreamento seguro das revisões de pranchas (ARQ-01 e HID-01) com isolamento de responsabilidades (Arquiteto autor vs Gestor aprovador).
4. **Ergonomia Mobile Macro:** No celular, a interface deve atuar como painel executivo e captura rápida, sem sobrecarregar o gestor em campo com tabelas complexas.

---

## 2. Ambientes de Teste

| Ambiente | Host / URL | Configuração / Container |
| :--- | :--- | :--- |
| **Local / Dev** | `http://localhost:3080` ou `http://localhost:5173` | Node.js / Vite Server |
| **HomeLab (Ubuntu Server)** | `http://192.168.15.176:3080` ou `http://ubuntu-server.tail01de12.ts.net:3080` | Container Docker `sistema-obras-frontend` |
| **Mobile PWA** | Smartphone via rede local / Tailscale | Chrome Mobile / Safari iOS (Add to Home Screen) |

---

## 3. Matriz de Casos de Teste (Test Suites)

### 📈 Suite 1: Cockpit Executivo & Curva S (Gerencial vs Cliente)
**Componente:** `ExecutiveDashboardScreen.tsx`

| ID | Cenário | Passos de Execução | Resultado Esperado | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | **Consolidação de KPIs no Cockpit** | 1. Acessar a aba *Cockpit & Relatórios*.<br/>2. Verificar cards superiores. | Exibir: Teto Aprovado **R$ 53.800,00**, Comprometido **R$ 47.426,20** (88,1%), Mão de Obra Wagner **R$ 32.500,00**, Saldo Livre **R$ 6.373,80** e Semáforo *DENTRO DO TETO* em verde. | [ ] |
| **TC-02** | **Alternância de Visão (Gerencial / Cliente)** | 1. Clicar no botão seletor *Visão do Cliente*.<br/>2. Alternar de volta para *Visão Gerencial*. | Transição suave; modo cliente oculta detalhes contratuais e simplifica a linguagem para prestação de contas. | [ ] |
| **TC-03** | **Curva S das 5 Semanas** | 1. Inspecionar o gráfico de barras da Curva S.<br/>2. Conferir semanas 1 e 2. | Semana 1 deve exibir demolição 100% concluída (R$ 5.006 Zumkeller); Semana 2 marcada como `[ATUAL]` com avanço das NFs de 17-18/10. | [ ] |
| **TC-04** | **Tabela de Faturamentos Reais (17-18/10)** | 1. Rolar até a tabela de notas fiscais.<br/>2. Verificar as 4 linhas de compras. | Listar exatamente: Sodimac (R$ 4.264,41 em 6x), Telhanorte NFC-e (R$ 3.261,79), Telhanorte 005578 (R$ 6.536,46) e Telhanorte 005576 (R$ 863,54). Total R$ 14.926,20. | [ ] |
| **TC-05** | **Cronograma de Parcelamento Futuro** | 1. Inspecionar os 6 cards de parcelamento (Nov/26 a Abr/27). | Card Nov/26 exibe o montante de entrada; Dez/26 a Abr/27 exibem exatamente R$ 710,73 das janelas CRV da Sodimac. | [ ] |
| **TC-06** | **Modal Relatório Cliente PDF** | 1. Clicar no botão *Relatório Cliente PDF*.<br/>2. Verificar modal e clicar em *Imprimir Relatório*. | Abre janela nativa de impressão (`window.print()`) formatada em A4 com cabeçalho da Igreja Cristã Evangélica e balanço auditado. | [ ] |

---

### 🛒 Suite 2: Emissão da Lista de Balcão A4 (Cotação em Loja)
**Componente:** `PrintBalcaoModal.tsx`

| ID | Cenário | Passos de Execução | Resultado Esperado | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-07** | **Abertura do Modal de Balcão** | 1. Clicar no botão *Balcão A4* no Header superior ou no Dashboard. | Modal abre exibindo a folha pautada de compras com instruções de balcão. | [ ] |
| **TC-08** | **Filtro por Fornecedor Homologado** | 1. Selecionar filtro *JER Depósito*.<br/>2. Selecionar *Telhanorte*.<br/>3. Selecionar *Sodimac*.<br/>4. Retornar para *Todos*. | A tabela filtra dinamicamente exibindo apenas os insumos correspondentes a cada parceiro comercial. | [ ] |
| **TC-09** | **Verificação de Embalagem e Perda Técnica** | 1. Localizar item *Porcelanato Eliane 90x90*.<br/>2. Localizar item *Argamassa AC-III 20kg*. | Exibir quantidade calculada em caixas/sacos fechados (9 cx = 21,87 m² com margem de +10% e 13 sacos AC-III). | [ ] |
| **TC-10** | **Campos de Preenchimento Manual para Vendedor** | 1. Inspecionar colunas em branco da folha de balcão. | Colunas *Preço Praticado (R$)*, *Marca/SKU Disponível* e *Visto do Vendedor* presentes com linhas pautadas para anotação a caneta. | [ ] |
| **TC-11** | **Disparo de Impressão `@media print`** | 1. Clicar em *Imprimir Lista A4*.<br/>2. Visualizar preview de impressão do navegador. | Layout ajustado para 100% largura de página, sem botões de interface, cabeçalho limpo em preto/branco com alto contraste. | [ ] |

---

### 📐 Suite 3: Gestão e Versionamento de Plantas
**Componente:** `BlueprintsScreen.tsx`

| ID | Cenário | Passos de Execução | Resultado Esperado | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-12** | **Catálogo de Pranchas Oficiais** | 1. Acessar a aba *Plantas & Revisões* no menu lateral. | Listar pranchas `ARQ-01` (Arquitetura) e `HID-01` (Hidráulica Tigre) com tags de status *Vigente* e revisão `R01`. | [ ] |
| **TC-13** | **Histórico de Revisões e Diffs** | 1. Clicar no card da prancha `ARQ-01`.<br/>2. Expandir versão `R01` e comparar com `R00`. | Exibir metadados: Data 17/10/2026, Autor Arquiteto, Aprovador Sandro Gestor, e notas: ampliação do nicho para 70x35cm e realocação do duto Tigre 50mm. | [ ] |
| **TC-14** | **Modal de Upload de Nova Prancha** | 1. Clicar no botão *+ Enviar Nova Revisão*.<br/>2. Simular seleção de disciplina e código de prancha. | Modal abre validando campos obrigatórios (Código, Revisão, Autor, Notas de alteração). | [ ] |

---

### 💰 Suite 4: Orçamento Analítico (WBS / EAP) e Catálogo
**Componentes:** `BudgetScreen.tsx`, `CatalogScreen.tsx`, `Header.tsx`

| ID | Cenário | Passos de Execução | Resultado Esperado | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-15** | **Alternância de Cenários** | 1. Acessar a aba *Orçamento (WBS)*.<br/>2. Alternar entre cenários *Econômico*, *Standard* e *Premium*. | Totais recalculados instantaneamente de acordo com os acabamentos de cada cenário. | [ ] |
| **TC-16** | **Trava de Segurança (Edição vs Leitura)** | 1. No Header, alternar o botão *Edição Habilitada* para *Visualização*.<br/>2. Tentar alterar quantitativos na tabela WBS. | Inputs tornam-se somente leitura, prevenindo edições acidentais durante vistorias. | [ ] |
| **TC-17** | **Consulta do Catálogo e Histórico de Preços** | 1. Acessar a aba *Catálogo de Insumos*.<br/>2. Buscar por "Eliane" ou "Tigre".<br/>3. Clicar em um insumo. | Modal de detalhe exibe especificações, fator de embalagem e comparativo de preços entre lojas cadastradas. | [ ] |

---

### 📱 Suite 5: Ergonomia Mobile & PWA
**Componente:** `Navigation.tsx`, `App.tsx`

| ID | Cenário | Passos de Execução | Resultado Esperado | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-18** | **Comportamento Responsivo (< 768px)** | 1. Reduzir largura da tela para 390px (iPhone/Android). | Sidebar desktop colapsa; barra inferior fixa com 5 botões (*Cockpit*, *Projeto*, *Captura*, *Custos*, *Plantas*) assume o controle. | [ ] |
| **TC-19** | **Botão Central Flutuante de Captura** | 1. Clicar no botão circular de câmera no centro da barra inferior. | Abre instantaneamente o modal de OCR/Captura de etiqueta de loja para uso rápido no depósito. | [ ] |
| **TC-20** | **Ausência de Sobrecarga de Digitação no Mobile** | 1. Navegar por todas as abas no modo mobile. | Nenhuma tela exige digitação exaustiva de códigos de itens; foco em leitura de cards, avanço físico e fotos do RDO. | [ ] |

---

### 🔌 Suite 6: Resiliência Offline & PWA Cache
**Componentes:** `services/storageService.ts`, `OfflineQueueModal.tsx`

| ID | Cenário | Passos de Execução | Resultado Esperado | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-21** | **Detecção de Desconexão (Offline)** | 1. No DevTools (F12), habilitar modo *Offline* na aba Network. | Badge no Header muda para `Offline`; ações de captura são enfileiradas localmente sem perda de dados. | [ ] |
| **TC-22** | **Limpeza de Cache e Forçar Atualização** | 1. Clicar no botão de versão `v1.2.4` com ícone de recarga no Header. | O sistema limpa caches do Service Worker e recarrega a página garantindo a última versão. | [ ] |
| **TC-23** | **Persistência de Dados (LocalStorage)** | 1. Recarregar a página (`F5`). | Todos os dados da obra piloto ICENV 2026, faturas e pranchas permanecem intactos. | [ ] |

---

## 4. Roteiro Prático de Execução

1. **Acessar a Aplicação:** Abrir o frontend no navegador (`http://localhost:3080` ou IP do servidor HomeLab).
2. **Executar as 6 Suites Sequencialmente:** Preencher a coluna de status com `[OK]` ou apontar divergências.
3. **Verificar a Impressão Real:** Fazer teste com *Destino: Salvar como PDF* para a Lista de Balcão e para o Relatório do Cliente.
4. **Liberar Fase 6:** Confirmando o correto funcionamento da interface, avançar para a automação N8N e WhatsApp.
