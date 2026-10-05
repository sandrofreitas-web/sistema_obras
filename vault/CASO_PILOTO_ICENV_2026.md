# 🎯 Caso Piloto em Produção: Obra ICENV 2026

Este documento registra os parâmetros da obra real utilizada como piloto para testes, validação de regras de negócio e calibração de usabilidade do **Sistema de Obras**.

---

## 1. Ficha Técnica da Obra Piloto
* **Local:** Rua Luiz Antônio dos Santos, nº 54
* **Entidade:** Igreja Cristã Evangélica Nova Vida (ICENV)
* **Objeto:** Reforma Completa do Banheiro da Casa Pastoral + Bloco de Banheiros/Vestiário Masculino da Igreja.
* **Data Oficial de Início:** **13/10/2026**
* **Prazo Estimado:** 5 semanas (Término previsto: 17/11/2026)
* **Pasta de Documentos & Dados da Obra:** `H:\Meu Drive\01. ICENV\Obras_2026`
* **Orçamento Teto Consolidado:** **R$ 53.825,00**
  * Mão de Obra Contratada: R$ 32.500,00 (60,4%)
  * Materiais Estimados: R$ 21.325,00 (39,6%)

---

## 2. Separação dos Projetos em Fases Sequenciais

### Fase 1: Banheiro da Casa Pastoral (Em Execução — Início: 13/10/2026)
* **ID do Projeto:** `proj-icenv-pastoral`
* **Dimensões:** 3,00m (comprimento) x 1,10m (largura) x 2,80m (altura)
* **Área de Piso:** ~3,3 m² | **Área de Paredes:** ~23,0 m²
* **Mão de Obra Alocada:** R$ 17.000,00 (inclui demolição de beiral externo no quintal, regularização de janelas de dormitórios e alvenaria)
* **Materiais Estimados:** R$ 8.500,00 | Prazo: 3 semanas (13/10 a 02/11/2026)
* **Caçambas:** 2 caçambas estacionárias 5m³ dedicadas

### Fase 2: Banheiro Masculino da Igreja (Sequencial — Início: 03/11/2026)
* **ID do Projeto:** `proj-icenv-masculino`
* **Dimensões:** Bloco coletivo com boxes e mictórios
* **Área de Piso:** ~10,0 m² | **Área de Paredes:** ~37,0 m²
* **Mão de Obra Alocada:** R$ 15.500,00 (revisão hidráulica/elétrica completa, 2 bacias, 2 mictórios, divisórias de granito)
* **Materiais Estimados:** R$ 12.825,00 | Prazo: 3 semanas (03/11 a 24/11/2026)
* **Caçambas:** 2 caçambas estacionárias 5m³ dedicadas

---

## 3. Cronograma Sequencial Integrado

| Fase / Semana | Período | Frente de Trabalho | Status |
| :---: | :---: | :--- | :---: |
| **Fase 1 / S1** | 13/10 a 19/10 | Demolição do banheiro pastoral, remoção de beiral externo no quintal, janelas e caçambas | Em Execução |
| **Fase 1 / S2** | 20/10 a 26/10 | Nova rede de água fria/esgoto, eletrodutos, abertura de vão para nova janela e alvenaria | Planejado |
| **Fase 1 / S3** | 27/10 a 02/11 | Contrapiso, impermeabilização 72h, porcelanato, azulejo, forro gesso, louças e entrega Casa Pastoral | Planejado |
| **Fase 2 / S1** | 03/11 a 09/11 | Desativação, caçambas e demolição total de revestimentos e divisórias do banheiro masculino | Sequencial |
| **Fase 2 / S2** | 10/11 a 16/11 | Revisão hidráulica/elétrica, pontos de esgoto para 2 bacias e 2 mictórios, impermeabilização | Sequencial |
| **Fase 2 / S3** | 17/11 a 24/11 | Assentamento de porcelanato, forro gesso, montagem de divisórias de granito, louças e entrega final | Sequencial |

---

## 4. Metas de Validação do Software no Piloto

1. **Testar OCR de Etiquetas em Lojas Físicas:** Coletar cotações reais nas lojas JER, Telhanorte e Leroy Merlin antes do início das compras de cada semana.
2. **Validar Cálculo de Caixas Fechadas:** Confrontar o número de caixas sugerido pelo app com o pedido final de piso/azulejo.
3. **Controle Financeiro de Notas Fiscais:** Registrar cada cupom/NF emitido e comparar o desvio de preço unitário em relação ao orçado.
4. **Alimentação do RDO Diário:** Registrar fotos e o avanço físico no canteiro durante as 5 semanas de obra.