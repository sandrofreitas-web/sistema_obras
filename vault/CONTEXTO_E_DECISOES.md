# 🧠 Vault de Conhecimento: Contexto e Decisões de Arquitetura

Este documento consolida o histórico de decisões técnicas, premissas de projeto e direcionamentos estratégicos alinhados durante a concepção do **Sistema de Obras**. Ele serve como fonte da verdade e memória persistente para guiar o desenvolvimento das próximas fases.

---

## 1. Origem e Propósito do Projeto
* **Problema Central:** Obras institucionais (como de igrejas e reformas comerciais) sofrem com perda de histórico de cotações, orçamentos dispersos em mensagens de WhatsApp, anotações em papel e descontrole entre o que foi planejado e o que realmente foi pago em notas fiscais e parcelas de cartão.
* **Origem:** O pré-projeto nasceu documentado em `prontuario-app-materiais-construcao.md` no repositório de obras da igreja (`Obras_2026`), sendo posteriormente promovido a um repositório dedicado de software (`G:\Meu Drive\01 Projetos\sistema_de_obras`).
* **Decisão de Separação:** A pasta `Obras_2026` permanece como o repositório documental exclusivo da execução física do canteiro (plantas, RDO, medições locais), enquanto `sistema_de_obras` concentra a engenharia de software do produto digital.

---

## 2. Decisões Críticas de Arquitetura e Negócio

### D01 — Abordagem Offline-First para Captura em Loja
* **Decisão:** O aplicativo mobile/PWA deve operar em modo offline total durante a coleta de preços e fotos em lojas de materiais de construção.
* **Motivação:** Grandes depósitos de materiais de construção (galpões metálicos) e lojas no subsolo frequentemente possuem zonas sem cobertura 4G/5G. As fotos e os dados preenchidos devem ser gravados localmente (IndexedDB / SQLite) e sincronizados em segundo plano assim que houver conexão.

### D02 — Human-in-the-Loop na Extração por Visão Computacional (OCR)
* **Decisão:** A inteligência artificial (OCR / Vision multimodal) nunca deve persistir itens no catálogo definitivo sem uma tela prévia de confirmação e revisão manual pelo usuário.
* **Motivação:** Etiquetas de lojas brasileiras possuem enorme heterogeneidade: preços parcelados em fonte garrafal, preço à vista em tamanho reduzido, códigos de barras danificados e reflexos na embalagem. A validação assistida garante integridade total da base.

### D03 — Fator de Conversão de Embalagem (Projeto m² vs Venda Caixa)
* **Decisão:** O modelo de dados deve armazenar tanto a unidade consumível de projeto (m², metro linear, saco) quanto a unidade comercial de venda da loja (caixa, fardo), com o atributo `fator_embalagem` (ex: 2,14 m²/caixa).
* **Motivação:** Um projeto exige 35 m² de porcelanato. Uma loja vende em caixas de 2,14 m² e outra em caixas de 1,80 m². O sistema precisa calcular automaticamente o número inteiro de caixas fechadas necessárias, arredondando sempre para cima e prevendo a margem de quebra técnica (+10%).

### D04 — Gestão de Parcelamento e Fluxo Financeiro (À Vista vs Cartão)
* **Decisão:** O módulo financeiro deve contemplar nativamente a divisão entre pagamentos à vista/Pix e pagamentos parcelados no cartão corporativo (1x a 6x), com a entidade `parcela_pagamento`.
* **Motivação:** Identificado na análise da obra real de 2024 da ICENV que a igreja utilizou 82,7% à vista e 17,3% em cartão parcelado (3x) para proteger seu fluxo de caixa mensal perante a entrada de dízimos e ofertas.

### D05 — Inclusão de Mão de Obra e Visão Holística da Obra
* **Decisão:** Embora o foco inicial do app fosse cotação de materiais, o sistema foi expandido para incorporar a entidade `servico_mao_obra`.
* **Motivação:** Na obra real ICENV 2026, a mão de obra representa R$ 32.500,00 (60% do custo total de R$ 53.800,00). Um sistema que gerenciasse apenas materiais forneceria uma Curva S e um custo total incompletos para a diretoria.

### D06 — Simulações Comparativas por Cenários (A/B)
* **Decisão:** A entidade `cenario` permite vincular diferentes alternativas de acabamento (ex: Cenário Econômico vs Cenário Durabilidade Institucional) aos mesmos cômodos/ambientes da obra.
* **Motivação:** Facilita reuniões de comissão e aprovação de conselho, gerando relatórios instantâneos de comparação de custo por metro quadrado.

---

## 3. Marcos e Cronograma de Alinhamento
* **30/09/2026:** Análise e extração dos dados reais da obra anterior de 2024; homologação de 7 fornecedores parceiros históricos; atualização do modelo de dados para v1.1.
* **30/09/2026:** Migração formal para o repositório de produto `sistema_de_obras`.
* **13/10/2026:** Início oficial da obra piloto ICENV 2026 (Prazo: 5 semanas).