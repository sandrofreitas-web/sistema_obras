# Prontuário do Produto — App de Gestão de Materiais e Controle de Obras

## 1. Visão Geral e Contexto de Aplicação

**Objetivo do produto:** Aplicativo mobile/PWA para gestão integrada de suprimentos, orçamentos e custos de obras. Permite ao fiscal, arquiteto ou gestor fotografar etiquetas de materiais em depósitos físicos, extrair automaticamente dados técnicos e financeiros via OCR com inteligência artificial, catalogar itens com fator de conversão de embalagem, montar orçamentos comparativos por ambiente/cenário e controlar o fluxo de compras e medições no canteiro.

**Proposta de valor:** Eliminar anotações dispersas, orçamentos perdidos em fotos de WhatsApp e planilhas desconexas, estabelecendo uma esteira estruturada:  
**Captura em Depósito → Base Parametrizada → Simulação por Cenários → Lista de Compras/Desembolso → Execução (Real x Planejado)**.

**Projeto Piloto em Produção:** O sistema está sendo calibrado e validado diretamente na **Obra ICENV 2026**, com início oficial em **13/10/2026** (Reforma do Banheiro da Casa Pastoral e Bloco Masculino da Igreja).

---

## 2. Histórico e Aprendizados da Obra Anterior (Referência Real ICENV 2024)

Em 2024, a ICENV executou a reforma do **Banheiro de Acessibilidade**, reparo de vazamento de caixas d'água e substituição das esquadrias das salas de aula. A análise do fechamento financeiro dessa obra consolidou premissas cruciais para o desenho do aplicativo:

### 2.1 Números Consolidados da Obra 2024
* **Custo Total Executado e Pago:** **R$ 28.425,24**
  * Reforma Banheiro Acessibilidade: R$ 18.578,48
  * Troca de Janelas das Salas (4 unidades 150x120 em vidro): R$ 8.246,76
  * Vazamento e Reparos em Caixa D'água: R$ 1.600,00
* **Perfil de Desembolso:**
  * À Vista / Pix: R$ 23.525,11 (82,7%)
  * Parcelado em Cartão (1 a 3 parcelas): R$ 5.432,93 (17,3%)
* **Mão de Obra (MO):** Profissional Wagner (R$ 7.950 banheiro + R$ 2.450 janelas + R$ 1.000 caixa d'água).

### 2.2 Fornecedores Homologados do Ecossistema ICENV
A base de lojas do app já nasce pré-populada com os parceiros históricos da igreja:
1. **JER Depósito de Mat. Construção:** Fornecedor de cimento, areia, brita, blocos e materiais brutos de pronta entrega.
2. **Telhanorte:** Pisos, porcelanatos, louças, caixas acopladas, portas e barras de acessibilidade.
3. **Leroy Merlin:** Ralos sifonados, registros, chuveiros, tintas, plafons de LED e tomadas.
4. **Hiper Pedras:** Peitoris e soleiras em granito polido (parceiro estratégico para as divisórias de 2026).
5. **Gesso Mandaqui:** Forros, sancas e drywall.
6. **ANDRA:** Cabos flexíveis, eletrodutos, quadros e disjuntores DIN.
7. **Serralheria Parceira:** Esquadrias de alumínio/vidro temperado sob medida.

### 2.3 Lições Práticas Incorporadas ao App
1. **Controle de Parcelamento:** As igrejas e instituições utilizam compras à vista combinadas com cartão parcelado (2x a 6x) para equalizar o fluxo de caixa de doações/dízimos. O app deve registrar a forma de pagamento e o cronograma de parcelas.
2. **Fator de Embalagem:** O orçamento prevê m² de revestimento, mas a loja vende caixa de 2,14 m² ou 1,80 m²; cimento é saco de 50kg; areia é m³. O app precisa calcular automaticamente caixas fechadas com arredondamento seguro.
3. **Mão de Obra Integrada:** Sem controle de mão de obra (que representou ~40% do custo em 2024 e representa 60% em 2026), o acompanhamento financeiro fica incompleto.

---

## 3. Escopo e Fases de Entrega

| Fase | Entregável | Alinhamento com a Obra 2026 (Início: 13/10/2026) | Status |
|---|---|---|---|
| **Fase 1 — MVP de Campo** | Captura de etiquetas (OCR) + Catálogo de Materiais + Lojas | Homologação de preços nas lojas parceiras (JER, Leroy, Telhanorte) | Em Andamento |
| **Fase 2 — Orçamentos & Cenários** | Projetos por ambiente + Simulações Econômico vs Premium | Cenários para Casa Pastoral e Banheiro Masculino | Em Andamento |
| **Fase 3 — Execução Financeira** | Registro de compras reais, Notas Fiscais e Realizado vs Planejado | Acompanhamento a partir de 13/10/2026 | Planejado |
| **Fase 4 — Acompanhamento Físico** | Cronograma de 5 semanas, RDO integrado, checklist e fotos | Operação de canteiro durante as 5 semanas da obra | Planejado |

---

## 4. Módulo 1 — Captura e Cadastro Inteligente de Materiais

### 4.1 Fluxo de Captura
1. Usuário fotografa a etiqueta do produto na loja (etiqueta de gôndola, caixa ou código de barras).
2. OCR Multimodal extrai com precisão:
   - Marca/Fabricante (ex: Portobello, Tigre, Docol, Coral, Votoran)
   - Modelo/Referência/SKU
   - Preço à vista (Pix/dinheiro) e preço a prazo/cartão
   - Unidade de venda (un, m², caixa, kg, saco, lata 18L)
   - Metragem contida na embalagem (ex: 2,14 m²/cx)
   - Loja (seleção rápida entre lojas homologadas ou nova loja via GPS)
3. Tela de confirmação/revisão com preenchimento assistido (validação humana obrigatória).
4. Item salvo no catálogo local com sincronização em nuvem quando houver conexão.

### 4.2 Requisitos Técnicos
- **Offline-First:** Armazenamento local (IndexedDB / SQLite) com fila de sincronização assíncrona.
- **Deduplicação de Itens:** Identificação de mesmo SKU/modelo em lojas diferentes para alimentar histórico e comparativo de preços.

---

## 5. Módulo 2 — Base de Dados e Taxonomia Homologada

Estrutura hierárquica configurável: **Classe → Categoria → Tipo → Item**

Taxonomia padronizada compatível com a `Lista_Mestra_de_Materiais.md`:
* **Bruto / Estrutura:** Cimento CP II, areia lavada, pedra brita, blocos cerâmicos, argamassa AC-III, impermeabilizantes (Viaplus/Sika).
* **Revestimentos:** Pisos porcelanatos retificados, azulejos de parede, rejuntes epóxi/acrílico, soleiras em granito.
* **Hidráulica:** Tubos e conexões soldáveis água fria, esgoto série normal, registros de gaveta/pressão, ralos anti-odor.
* **Elétrica:** Cabos flexíveis antichama, eletrodutos corrugados, caixas 4x2/4x4, disjuntores DIN, luminárias LED.
* **Louças & Metais:** Bacias sanitárias com caixa acoplada 3/6L, cubas/lavatórios, torneiras antivandalismo/monocomando, chuveiros, mictórios.
* **Marmoraria:** Divisórias sob medida para sanitários masculinos, peitoris e bancadas.
* **Forro & Gesso:** Placas drywall RU (resistente à umidade), perfis F530, cantoneiras e acabamentos.
* **Pintura:** Tinta acrílica fosca premium lavável, massa acrílica, seladores e lixas.
* **Caçambas & Serviços:** Caçambas estacionárias 5 m³ e descarte de entulho.

---

## 6. Módulo 3 — Detalhamento Executivo do Projeto por Grupos e Categorias

### 6.1 Parametrização para a Obra ICENV 2026
* **Projeto Ativo:** `Obras ICENV 2026`
* **Pasta Oficial de Dados da Obra Piloto:** `H:\Meu Drive\01. ICENV\Obras_2026`
  * **Ambiente 1:** `Banheiro Casa Pastoral` (3,3 m² piso | 23 m² paredes revestidas | Mão de Obra: R$ 17.000,00)
  * **Ambiente 2:** `Banheiro Masculino Igreja` (~10 m² piso | 37 m² paredes revestidas | divisórias granito | Mão de Obra: R$ 15.500,00)
  * **Ambiente 3:** `Área Comum / Caçambas & Infra` (4 caçambas estacionárias 5m³)

### 6.2 Estrutura de Detalhamento e Gestão de Itens
- **Eliminação da Simulação Hipotética:** A tela de projetos foca diretamente no **Detalhamento Executivo**, estruturado por **Grupos (Classes)** e **Categorias**, espelhando a Lista Mestra de Materiais.
- **CRUD Completo de Itens:**
  - **Inclusão:** Conexão direta com a base homologada de materiais (catálogo), preenchendo automaticamente fabricante, preços e unidades, ou cadastro sob demanda.
  - **Alteração:** Edição de quantitativo base, percentual de perda técnica (+5% geral, +10% a +15% para cortes de revestimentos), ambiente de aplicação e preço unitário com recálculo instantâneo.
  - **Exclusão:** Remoção segura de itens com atualização em tempo real dos subtotais e da reserva de contingência.
- **Exportação:** Geração de relatórios executivos em PDF para canteiro e exportação de planilha detalhada em formato CSV compatível com Excel.

---

## 7. Módulo 4 — Controle de Execução e Financeiro

### 7.1 Gestão de Desembolso e Realizado
- **Conversão de Orçamento em Pedidos de Compra:** Agrupamento por fornecedor (ex: emitir lote para JER, lote para Hiper Pedras).
- **Registro Real de Compras:**
  - Número do pedido / Nota Fiscal com anexo da foto do comprovante.
  - Forma de pagamento: À Vista (Pix) ou Cartão Parcelado (valor de cada parcela e data de vencimento).
  - Loja de compra efetiva e valor real praticado.
- **Comparativo Planejado x Realizado:** Desvio absoluto (R$) e percentual (%) por grupo de materiais e consolidado.
- **Alerta de Tendência de Estouro:** Aviso visual quando o valor realizado projetar estouro da reserva técnica (R$ 3.000,00).

---

## 8. Módulo 5 — Acompanhamento Físico e Diário de Obra (RDO)

Integrado ao cronograma de 5 semanas com início em **13/10/2026**:
* **Cronograma de Etapas:**
  1. *Semana 1 (13/10 a 18/10):* Mobilização, caçambas, demolição de revestimentos e alvenaria Casa Pastoral.
  2. *Semana 2 (19/10 a 25/10):* Novas instalações hidráulicas e elétricas; testes de estanqueidade.
  3. *Semana 3 (26/10 a 01/11):* Regularização de contrapiso, impermeabilização 72h e início de pisos/azulejos.
  4. *Semana 4 (02/11 a 08/11):* Conclusão de revestimentos, forro de gesso, divisórias em granito Hiper Pedras.
  5. *Semana 5 (09/11 a 15/11):* Montagem de louças, torneiras, pintura, vistoria final e termo de entrega.
* **RDO Mobile:** Registro fotográfico diário datado com anotação de efetivo e impedimentos climáticos.

---

## 9. Modelo de Dados Atualizado (Entidades Relacionais)

- **Usuario** (`id`, `nome`, `cargo`, `permissao`)
- **Fornecedor / Loja** (`id`, `nome`, `tipo_parceiro`, `endereco`, `telefone`, `cnpj`, `coordenadas`)
- **Categoria** (`id`, `classe`, `categoria`, `tipo`, `unidade_padrao`)
- **Material** (`id`, `categoria_id`, `descricao`, `fabricante`, `modelo`, `sku`, `unidade_venda`, `fator_embalagem`, `foto_referencia_url`)
- **Preco_Captura** (`id`, `material_id`, `loja_id`, `preco_vista`, `preco_prazo`, `data_captura`, `usuario_id`)
- **Projeto** (`id`, `nome`, `status`, `data_inicio`, `orcamento_teto`)
- **Ambiente** (`id`, `projeto_id`, `nome`, `area_piso`, `area_parede`)
- **Cenario** (`id`, `projeto_id`, `nome`, `ativo`)
- **Item_Projeto** (`id`, `ambiente_id`, `material_id`, `cenario_id`, `qtd_calculada`, `qtd_embalagem_fechada`, `preco_estimado_unit`)
- **Servico_MaoDeObra** (`id`, `projeto_id`, `prestador_nome`, `descricao_etapa`, `valor_fechado`, `status_pagamento`)
- **Compra** (`id`, `fornecedor_id`, `numero_nf`, `data_compra`, `valor_total`, `forma_pagamento`, `num_parcelas`, `foto_comprovante_url`)
- **Item_Compra** (`id`, `compra_id`, `item_projeto_id`, `material_id`, `qtd_comprada`, `preco_pago_unit`)
- **Parcela_Pagamento** (`id`, `compra_id`, `numero_parcela`, `data_vencimento`, `valor_parcela`, `status_pago`)
- **Etapa_Obra** (`id`, `projeto_id`, `nome`, `semana_prevista`, `status`, `percentual_concluido`)
- **Diario_Obra_RDO** (`id`, `etapa_id`, `data`, `clima`, `efetivo_presente`, `relato_atividades`, `fotos_urls`)

---

## 10. Histórico de Evolução do Prontuário (Changelog)

| Versão | Data | Autor / Responsável | Alterações Realizadas |
| :---: | :---: | :---: | :--- |
| **v1.0** | Set/2026 | Equipe Técnica | Criação da concepção inicial e dos 5 módulos teóricos do produto. |
| **v1.1** | 30/09/2026 | Pair Programming / Antigravity | **Extração dos dados reais da Obra ICENV 2024** (R$ 28,4k executados, fornecedores homologados, mix de pagamento à vista/parcelado). |
| **v1.1** | 30/09/2026 | Pair Programming / Antigravity | **Parametrização oficial para a Obra ICENV 2026** (Início: 13/10/2026, 5 semanas, frentes Casa Pastoral + Banheiro Masculino). |
| **v1.1** | 30/09/2026 | Pair Programming / Antigravity | **Evolução do Modelo de Dados:** Inclusão de `Fator_Embalagem`, parcelamento de compras (`Parcela_Pagamento`) e entidade `Servico_MaoDeObra`. |
| **v1.2** | 03/10/2026 | Pair Programming / Antigravity | **Módulo 1 Mobile-First PWA:** Implementação do leitor de etiquetas com OCR multimodal assistido, conversor automático de embalagem em tempo real, endpoints REST (`/materiais`, `/captura/analisar`, `/captura/salvar`) e manifest PWA para instalação direta em celulares. |

