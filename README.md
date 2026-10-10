# 🏗️ Sistema de Obras — App de Gestão de Materiais e Controle de Canteiro

Sistema modular para gestão integrada de suprimentos, orçamentos e acompanhamento de obras e reformas.

O produto nasce para resolver a dispersão de dados na construção civil, conectando o momento de **captura de etiquetas de preços em lojas físicas** (via OCR com visão computacional / IA multimodal) até o **controle de compras, desembolso financeiro e avanço físico no canteiro**.

---

## 🎯 Proposta de Valor e Fluxo Contínuo

```mermaid
graph LR
    A[📷 Captura em Loja<br/>OCR Multimodal] --> B[🏷️ Catálogo Homologado<br/>Fator Embalagem & Preços]
    B --> C[📊 Detalhamento em Tabela<br/>Grupos, Categorias & Perda %]
    C --> D[📋 Lista de Cotação & Compras<br/>Status Planejado x Comprado]
    D --> E[💰 Execução Financeira<br/>À Vista & Parcelado]
    E --> F[📋 Diário de Obra RDO<br/>Avanço Físico 5 Semanas]
```

1. **Captura em Loja Física:** Fotografar etiquetas em gôndolas e caixas de materiais, extraindo marca, SKU, preço à vista/prazo e unidade com auxílio de IA e confirmação humana.
2. **Catalogação Parametrizada:** Histórico de preços por loja e cálculo de fator de embalagem (conversão de m² de projeto para caixas fechadas, kg para sacos, etc.).
3. **Detalhamento do Projeto em Tabela:** Estruturação hierárquica por Grupos (Classes) e Categorias, com visual compacto em tabela de engenharia, cálculo automático de perda técnica (+5% a +15%) e subtotais dinâmicos.
4. **Gestão de Aquisições e Cotações:** Acompanhamento do status de compra (Planejado vs Comprado com 1 clique), métricas de desembolso pendente e exportação de **Lista de Cotação (CSV)** para levar a depósitos.
5. **Execução Financeira:** Controle de compras com comprovantes fiscais e gestão de fluxo de caixa (à vista vs parcelado no cartão).
6. **Acompanhamento Físico (RDO):** Cronograma de execução sequencial e diário de obra com registro fotográfico.

---

## 🏛️ Projeto Piloto em Produção: Obra ICENV 2026

O sistema opera com o caso real da **Igreja Cristã Evangélica Nova Vida**, estruturado em duas fases sequenciais:
* **Fase 1 (Em Execução Inicial — Início: 13/10/2026):**
  * `1ª Fase: Banheiro Casa Pastoral — Obra ICENV 2026`
  * Mão de Obra Wagner: R$ 17.000,00 | Materiais: R$ 8.500,00 (Área: 3,3 m² piso / 23 m² paredes).
  * Prazo: 3 semanas (13/10 a 02/11/2026).
* **Fase 2 (Sequencial — Início Previsto: 03/11/2026):**
  * `2ª Fase: Banheiro Masculino Igreja — Obra ICENV 2026`
  * Mão de Obra Wagner: R$ 15.500,00 | Materiais: R$ 12.825,00 (Área: 10 m² piso / 37 m² paredes).
  * Prazo: 3 semanas (03/11 a 24/11/2026).
* **Pasta Oficial de Dados:** `H:\Meu Drive\01. ICENV\Obras_2026`
* **Orçamento Teto Consolidado:** **R$ 53.825,00** (Mão de Obra: R$ 32.500,00 | Materiais: R$ 21.325,00).

---

## 📱 Acesso Mobile & PWA Offline-First no Celular

O aplicativo é um **PWA (Progressive Web App) Offline-First**, projetado para que **o celular funcione 100% de forma autônoma mesmo sem conexão à internet e com backend indisponível**:

* **Hospedagem 24/7:** Executado no **Home Lab (Notebook Dell)** (`192.168.15.176`), preservando integralmente os recursos da VPS Oracle-SGM para outras demandas.
* **Operação Externa em Lojas/Canteiro:** O objetivo em trânsito é **exclusivamente a captura ágil de informações** (fotos de etiquetas, preços à vista/a prazo e anotações de quantitativos), gravadas localmente no dispositivo (IndexedDB/Service Worker). Não é exigida conectividade síncrona instantânea.
* **Acesso Remoto Sob Demanda:** Por se tratar de um sistema para uso pessoal/interno, o acesso ao backend fora da rede Wi-Fi residencial pode ser realizado pontualmente via **Tailscale** (`100.x.y.z`).
* **Desafio Técnico (HTTPS para Upgrades):** Para permitir o registro de Service Workers, instalação como aplicativo e, principalmente, **atualização transparente de novas versões (upgrade de bundles do PWA)**, navegadores mobile exigem HTTPS estrito. A terminação SSL no Home Lab é configurada via certificados Tailscale (`tailscale cert`), Caddy/Nginx com SSL ou Cloudflare Tunnel.
* **Acesso na Rede Local (Wi-Fi de Casa):** `http://192.168.15.176:3080`
* **Swagger / Documentação da API:** `http://192.168.15.176:8080/docs`

### 📲 Como Instalar e Usar 100% Offline no Celular:
1. Abra o link no navegador do celular (Chrome no Android ou Safari no iOS).
2. Toque no menu do navegador e selecione **"Adicionar à Tela Inicial"** ou **"Instalar Aplicativo"**.
3. O ícone oficial do **ObraCerta** será criado na tela inicial do celular.
4. **Pronto!** O Service Worker salva todo o código, telas e catálogo na memória local. Você pode consultar materiais, editar tabelas de detalhamento da obra, alternar entre os projetos e registrar cotações mesmo em modo avião ou sem sinal!

---

## 🏠 Operação e Infraestrutura no Home Lab (`ubuntu-server`)

O sistema roda containerizado 24/7 no **Notebook Dell (Home Lab)** com persistência de dados em disco local dedicado:

### 📊 Mapeamento de Serviços e Portas
| Serviço | Container | Porta Externa | Porta Interna | Volume Persistente |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend PWA** | `obras_frontend` | `3080` | `5173` | Build / App React |
| **Backend API** | `obras_backend` | `8080` | `8000` | `/srv/dados/obras/uploads` |
| **PostgreSQL 16** | `obras_db` | `5435` | `5432` | `/srv/dados/obras/pgdata` |

### 🛠️ Comandos de Gestão Operacional via SSH
```bash
# Conectar no servidor
ssh homelab

# Navegar até o diretório da aplicação
cd /srv/dados/obras/app

# Subir / reiniciar todos os serviços
docker compose -f docker-compose.homelab.yml up -d

# Visualizar logs em tempo real
docker compose -f docker-compose.homelab.yml logs -f

# Fazer backup do banco de dados PostgreSQL
docker exec obras_db pg_dump -U obras_user -d obras_db --clean --if-exists > /srv/dados/obras/data/obras_db_backup.sql
```

---

## 🧭 Estrutura do Repositório

| Diretório | Descrição |
| :--- | :--- |
| [`📁 docs/`](./docs/) | Prontuário do produto, especificações funcionais e modelo de dados detalhado. |
| [`📁 vault/`](./vault/) | Base de conhecimento (Vault) com histórico de decisões, benchmarking 2024 e premissas. |
| [`📁 data/`](./data/) | Seeds e esquemas iniciais de dados (lojas homologadas, taxonomia de materiais). |
| [`📁 src/`](./src/) | Código-fonte da aplicação (PWA / Frontend / Backend). |

---

## 🚀 Status de Desenvolvimento

* [x] **v1.0:** Prontuário inicial de produto e requisitos de alto nível.
* [x] **v1.1:** Separação do repositório dedicado, incorporação do benchmarking 2024, criação do Vault e expansão do modelo relacional.
* [x] **v1.2:** Implementação do **Módulo 1 (Captura & Cadastro Inteligente)**:
  - PWA Mobile-First instalável no smartphone para uso no corredor de lojas e depósitos.
  - OCR Multimodal assistido com extração automática de marca, SKU, preço à vista e a prazo.
  - Conversor dinâmico de fator de embalagem.
* [x] **v2.0:** Módulo de **Detalhamento Executivo de Projetos**:
  - Separação da obra em duas fases sequenciais com alternância rápida (Casa Pastoral e Banheiro Masculino).
  - Tabela compacta de quantitativos por grupos e categorias com cálculo de perda técnica (+5% a +15%).
  - CRUD completo de itens integrado à base homologada de materiais.
  - Painel de evolução das aquisições com alternância de status Planejado x Comprado em 1 clique.
  - Exportação de Lista de Cotação para lojas (CSV) e Orçamento Executivo (CSV/PDF).
* [ ] **v3.0:** Módulo 4 (Controle de Execução Financeira / Notas Fiscais) e Módulo 5 (RDO com fotos datadas).