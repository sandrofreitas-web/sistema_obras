---
name: obras-gestor
description: Skill completa de operação agêntica para o gestor e arquiteto de obras civis. Permite dimensionamento paramétrico com perdas técnicas (+10%), emissão de listas de compras pautadas A4 para balcão, ingestão de faturas/compras reais, controle e versionamento de pranchas (R00, R01) e processamento de mensagens de canteiro do WhatsApp via N8N.
---

# 🏗️ Skill: Obras Gestor (v2.0)

Esta skill orienta o Agente de IA para a operação diária do **Sistema de Obras**, permitindo executar requisições operacionais via Terminal CLI, IDE e Chat, mantendo o repositório como a fonte única da verdade (Single Source of Truth).

---

## 🎯 Quando Ativar Esta Skill

Ative esta skill sempre que o usuário:
1. Pedir para **dimensionar materiais** a partir de plantas, medidas ($m^2$ de piso, $m^2$ de parede) ou memoriais.
2. Solicitar **geração ou impressão de Lista de Compras / Cotação para balcão de depósitos** (JER, Telhanorte, Sodimac).
3. Solicitar **ingestão ou conciliação de faturas, NFs, cupons ou pedidos faturados**.
4. Querer consultar o **status financeiro consolidado, Curva S, saldo em caixa ou parcelas a vencer no cartão**.
5. Precisar **subir nova revisão de prancha de arquitetura/engenharia (`R00`, `R01`, `R_ASBUILT`)** e verificar o impacto nos quantitativos.
6. Processar **mensagens de áudio ou texto recebidas de mestres de obra (Wagner) pelo WhatsApp**.

---

## 🛠️ Comandos Rápidos da CLI (`obras-cli`)

O gestor pode executar diretamente no terminal:

```bash
# 1. Consultar balanço financeiro, orçado x realizado e parcelas de cartão
python -m cli.obras status

# 2. Gerar folha de compras A4 pautada pronta para impressão no navegador
python -m cli.obras print-lista --fornecedor "JER"
python -m cli.obras print-lista --fornecedor "Telhanorte"
python -m cli.obras print-lista --no-open

# 3. Dimensionamento paramétrico por ambiente com fator de perda (+10%)
python -m cli.obras dimensionar --tipo "banheiro" --piso 3.3 --parede 23.0 --cenario "standard"
python -m cli.obras dimensionar --tipo "banheiro" --piso 3.3 --parede 23.0 --cenario "premium"

# 4. Processamento de áudios/textos informais de mestres de obras
python -m cli.obras mensagem "Wagner: preciso de 10 joelhos 25mm e 5 sacos de cimento"

# 5. Listagem de pranchas de projeto e revisões vigentes
python -m cli.obras plantas
```

---

## 📐 Operação Estratificada por Nível de Conhecimento do Arquiteto

1. **Arquiteto Nível 1 (Chat em Linguagem Natural)**:
   - Se o usuário enviar mensagens coloquiais ou anexar plantas em PDF:
     - Extrair metadados da prancha (selo, código, título, revisão).
     - Extrair cotas e áreas de piso e parede.
     - Calcular quantitativos com perdas técnicas (+10% pisos, +5% argamassas/bruto).
     - Responder com um **Memorial Descritivo Amigável** e solicitar confirmação para o Gestor.
2. **Arquiteto Nível 2 (IDE com Slash Commands)**:
   - Utilizar slash commands guiados (`/prancha-upload`, `/especificar-ambiente`).
   - Gerar visualizações de diff lado a lado entre versões (`R00` vs `R01`).
3. **Gestor Nível 3 (Terminal de Alta Performance)**:
   - Utilizar a CLI diretamente para operações em lote, conciliação contábil e emissão de listas.

---

## 🛡️ Regras Invioláveis de Negócio (Guardrails)

1. **Fator de Embalagem Obrigatório**:
   - Nunca orçar frações de caixas de piso ou de sacos de cimento.
   - Sempre arredondar para cima caixas fechadas ($21,87\text{ m}^2 = 9\text{ caixas}$ de $2,43\text{ m}^2$).
2. **Perda Técnica Obrigatória**:
   - Pisos e revestimentos: aplicar sempre margem de quebra e corte de **+10%**.
   - Alvenaria e insumos brutos: aplicar margem de **+5%**.
3. **Proteção de Dados Financeiros Sensíveis**:
   - Arquitetos podem alterar pranchas, ambientes, cotas e acabamentos.
   - Apenas o **Gestor** pode validar compras reais, aprovar contratos de mão de obra (Wagner), conciliar números de NF e alterar parcelas bancárias.
