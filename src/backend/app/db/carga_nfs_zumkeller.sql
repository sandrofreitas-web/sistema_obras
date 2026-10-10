-- Carga Completa das Notas Fiscais Zumkeller (NF-e 86.007 e NF-e 86.006)
-- Data: 2026-10-10
-- Projeto: 627293a8-1f22-46d4-af28-821bec6b9725 (Reforma ICENV 2026 - Banheiro Pastoral e Bloco Masculino)
-- Ambientes: 
--   - 59068f34-8688-4d30-a75f-cb9c14e2f17b (Banheiro Casa Pastoral)
--   - 7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c (Área Externa)
-- Cenário: b0786118-9a21-46ca-8536-ec4be7a376c1 (Cenário Standard)
-- Fornecedor ID: 8 (Depósito Zumkeller)

BEGIN;

-- 1. Categorias Adicionais
INSERT INTO categoria (classe, tipo, unidade_padrao) VALUES
  ('Pintura', 'Tinta Pintura Emborrachada Impermeabilizante', 'balde'),
  ('Elétrica', 'Plafon LED Sobrepor 24W Bivolt 6400K Quadrado', 'un'),
  ('Bruto / Estrutura', 'Lajota Cerâmica para Laje H8', 'un'),
  ('Bruto / Estrutura', 'Viga Treliçada H8 Armada Metro', 'm'),
  ('Caçambas & Infra', 'Frete e Transporte Canteiro de Obras', 'un')
ON CONFLICT DO NOTHING;

-- 2. Materiais Adicionais no Catálogo
INSERT INTO material (id, categoria_id, descricao, fabricante, modelo_sku, unidade_venda, fator_embalagem, criado_em) VALUES
  ('mat-tint-iraja-20kg', (SELECT id FROM categoria WHERE tipo LIKE '%Tinta Pintura Emborrachada%' LIMIT 1), 'Tinta Pintura Emborrachada Branco Neve Balde 20kg', 'Irajá', 'Tinta Emborrachada 20kg Branco Neve', 'balde', 20.0, NOW()),
  ('mat-ele-plafon-24w', (SELECT id FROM categoria WHERE tipo LIKE '%Plafon LED Sobrepor 24W%' LIMIT 1), 'Plafon LED Sobrepor 24W Bivolt 6400K Quadrado Luz Branca', 'Ourolux', 'Plafon Sobrepor 24W 6400K Quad', 'un', 1.0, NOW()),
  ('mat-est-lajota-h8', (SELECT id FROM categoria WHERE tipo LIKE '%Lajota Cerâmica%' LIMIT 1), 'Lajota Cerâmica H8 Avulsa para Laje Pré-Moldada', 'Cerâmica Local', 'Lajota H8 Avulso', 'un', 1.0, NOW()),
  ('mat-est-trelica-h8', (SELECT id FROM categoria WHERE tipo LIKE '%Viga Treliçada H8%' LIMIT 1), 'Viga Treliça H8 Avulsa Metro para Laje', 'Blocos União / Zumkeller', 'Viga Treliça H8 Metro', 'm', 1.0, NOW()),
  ('mat-sv-frete-zumkeller', (SELECT id FROM categoria WHERE tipo LIKE '%Frete e Transporte%' LIMIT 1), 'Frete de Entrega no Canteiro de Obras (Depósito Zumkeller)', 'Depósito Zumkeller', 'Serviço Frete Canteiro', 'un', 1.0, NOW())
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fabricante = EXCLUDED.fabricante,
  modelo_sku = EXCLUDED.modelo_sku,
  unidade_venda = EXCLUDED.unidade_venda;

-- Atualizar especificações dos materiais existentes da Zumkeller
UPDATE material SET 
  descricao = 'Bloco / Tijolo Cerâmico 6 Furos 11,5x14x24cm (25 p/ m²)',
  fabricante = 'Cerâmica Local / Zumkeller',
  modelo_sku = 'Tijolo 11,5x14x24 Peça 6 Furo'
WHERE id = 'mat-br-bloco-370';

UPDATE material SET 
  descricao = 'Pedra Britada Ensacada 20kg (Graduada)',
  unidade_venda = 'saco',
  fator_embalagem = 20.0
WHERE id = 'mat-br-pedra-brita';

UPDATE material SET 
  descricao = 'Pontalete de Pinus 3,00m para Escoramento',
  fabricante = 'Madereira Local',
  modelo_sku = 'Pontalete Pinus 3m'
WHERE id = 'mat-br-pontalete-euc';

UPDATE material SET 
  descricao = 'Coluna Armada 4F 3/8 Estribo 9x15 a cada 20cm (Encomenda por Metro)',
  unidade_venda = 'm'
WHERE id = 'mat-br-coluna-9x15';

-- 3. Ambiente Área Externa
INSERT INTO ambiente (id, projeto_id, nome, area_piso) VALUES
  ('7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c', '627293a8-1f22-46d4-af28-821bec6b9725', 'Área Externa', 12.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Atualizar / Inserir Itens do Projeto no Cenário
-- 4.1 Atualizar os itens já existentes no Banheiro Pastoral com preços reais da NF
UPDATE item_projeto SET 
  preco_unitario_estimado = 290.61, 
  qtd_necessaria_liquida = 2.00,
  qtd_calculada_bruta = 2.00,
  qtd_embalagem_fechada = 2
WHERE id = 'item-db-pas-areia';

UPDATE item_projeto SET 
  preco_unitario_estimado = 6.56,
  qtd_necessaria_liquida = 35.00,
  qtd_calculada_bruta = 35.00,
  qtd_embalagem_fechada = 35
WHERE id = 'item-db-pas-brita';

UPDATE item_projeto SET 
  preco_unitario_estimado = 45.90,
  qtd_necessaria_liquida = 15.00,
  qtd_calculada_bruta = 15.00,
  qtd_embalagem_fechada = 15
WHERE id = 'item-db-pas-cimento';

UPDATE item_projeto SET 
  preco_unitario_estimado = 1.64,
  qtd_necessaria_liquida = 370.00,
  qtd_calculada_bruta = 370.00,
  qtd_embalagem_fechada = 370
WHERE id = 'item-db-pas-blocos';

UPDATE item_projeto SET 
  preco_unitario_estimado = 9.12,
  qtd_necessaria_liquida = 4.00,
  qtd_calculada_bruta = 4.00,
  qtd_embalagem_fechada = 4
WHERE id = 'item-db-pas-tijolinho';

UPDATE item_projeto SET 
  preco_unitario_estimado = 49.83,
  qtd_necessaria_liquida = 4.00,
  qtd_calculada_bruta = 4.00,
  qtd_embalagem_fechada = 4
WHERE id = 'item-db-pas-tabuas';

UPDATE item_projeto SET 
  preco_unitario_estimado = 22.70,
  qtd_necessaria_liquida = 5.00,
  qtd_calculada_bruta = 5.00,
  qtd_embalagem_fechada = 5
WHERE id = 'item-db-pas-sarrafos';

UPDATE item_projeto SET 
  preco_unitario_estimado = 27.52,
  qtd_necessaria_liquida = 3.00,
  qtd_calculada_bruta = 3.00,
  qtd_embalagem_fechada = 3
WHERE id = 'item-db-pas-pontaletes';

UPDATE item_projeto SET 
  preco_unitario_estimado = 59.85,
  qtd_necessaria_liquida = 12.00,
  qtd_calculada_bruta = 12.00,
  qtd_embalagem_fechada = 12
WHERE id = 'item-db-pas-colunas';

UPDATE item_projeto SET 
  preco_unitario_estimado = 55.01,
  qtd_necessaria_liquida = 3.00,
  qtd_calculada_bruta = 3.00,
  qtd_embalagem_fechada = 3
WHERE id = 'item-db-pas-ferro';

UPDATE item_projeto SET 
  preco_unitario_estimado = 18.57,
  qtd_necessaria_liquida = 1.00,
  qtd_calculada_bruta = 1.00,
  qtd_embalagem_fechada = 1
WHERE id = 'item-db-pas-arame';

UPDATE item_projeto SET 
  preco_unitario_estimado = 20.54,
  qtd_necessaria_liquida = 1.00,
  qtd_calculada_bruta = 1.00,
  qtd_embalagem_fechada = 1
WHERE id = 'item-db-pas-prego';

UPDATE item_projeto SET 
  preco_unitario_estimado = 2.25,
  qtd_necessaria_liquida = 20.00,
  qtd_calculada_bruta = 20.00,
  qtd_embalagem_fechada = 20
WHERE id = 'item-db-pas-sacolixo';

-- 4.2 Inserir os Itens Extras do Banheiro e da Área Externa no Orçamento
INSERT INTO item_projeto (
  id, ambiente_id, material_id, cenario_id, qtd_necessaria_liquida, margem_perda_pct, qtd_calculada_bruta, qtd_embalagem_fechada, preco_unitario_estimado
) VALUES
  -- Área Externa: Tinta Emborrachada e Plafon LED
  ('item-db-ext-tinta', '7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c', 'mat-tint-iraja-20kg', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 311.91),
  ('item-db-ext-plafon', '7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c', 'mat-ele-plafon-24w', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 46.45),
  -- Banheiro Pastoral: Lajes/Vigotas e Frete
  ('item-db-pas-lajota', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-est-lajota-h8', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 40.00, 0.00, 40.00, 40, 2.42),
  ('item-db-pas-trelica', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-est-trelica-h8', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 12.00, 0.00, 12.00, 12, 19.38),
  ('item-db-pas-frete', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-sv-frete-zumkeller', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 50.00)
ON CONFLICT (id) DO UPDATE SET
  preco_unitario_estimado = EXCLUDED.preco_unitario_estimado,
  qtd_necessaria_liquida = EXCLUDED.qtd_necessaria_liquida,
  qtd_embalagem_fechada = EXCLUDED.qtd_embalagem_fechada;

-- 5. Registrar as 2 Compras na Tabela `compra`
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES
  ('compra-zumkeller-86007', 8, '86.007', '2026-10-10', 4196.59, 0.00, 50.00, 'dinheiro', 1, 'Zunkler_10OUT26.pdf (Pág 1)', NOW()),
  ('compra-zumkeller-86006', 8, '86.006', '2026-10-10', 46.45, 0.00, 0.00, 'dinheiro', 1, 'Zunkler_10OUT26.pdf (Pág 2)', NOW())
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  valor_frete = EXCLUDED.valor_frete;

-- 6. Registrar os 17 Itens em `item_compra`
INSERT INTO item_compra (id, compra_id, item_projeto_id, material_id, qtd_comprada, preco_unitario_real) VALUES
  -- Itens da NF 86.007
  ('ic-86007-01', 'compra-zumkeller-86007', 'item-db-ext-tinta', 'mat-tint-iraja-20kg', 1.00, 311.91),
  ('ic-86007-02', 'compra-zumkeller-86007', 'item-db-pas-sacolixo', 'mat-cac-saco-entulho', 20.00, 2.25),
  ('ic-86007-03', 'compra-zumkeller-86007', 'item-db-pas-areia', 'mat-br-areia-media', 2.00, 290.61),
  ('ic-86007-04', 'compra-zumkeller-86007', 'item-db-pas-brita', 'mat-br-pedra-brita', 35.00, 6.56),
  ('ic-86007-05', 'compra-zumkeller-86007', 'item-db-pas-cimento', 'mat-br-cimento-cp2', 15.00, 45.90),
  ('ic-86007-06', 'compra-zumkeller-86007', 'item-db-pas-tijolinho', 'mat-br-tijolinho-pct', 4.00, 9.12),
  ('ic-86007-07', 'compra-zumkeller-86007', 'item-db-pas-tabuas', 'mat-br-tabua-30', 4.00, 49.83),
  ('ic-86007-08', 'compra-zumkeller-86007', 'item-db-pas-sarrafos', 'mat-br-sarrafo-15', 5.00, 22.70),
  ('ic-86007-09', 'compra-zumkeller-86007', 'item-db-pas-pontaletes', 'mat-br-pontalete-euc', 3.00, 27.52),
  ('ic-86007-10', 'compra-zumkeller-86007', 'item-db-pas-colunas', 'mat-br-coluna-9x15', 12.00, 59.85),
  ('ic-86007-11', 'compra-zumkeller-86007', 'item-db-pas-ferro', 'mat-br-ferro-3-8', 3.00, 55.01),
  ('ic-86007-12', 'compra-zumkeller-86007', 'item-db-pas-arame', 'mat-br-arame-recoz', 1.00, 18.57),
  ('ic-86007-13', 'compra-zumkeller-86007', 'item-db-pas-prego', 'mat-br-prego-18x27', 1.00, 20.54),
  ('ic-86007-14', 'compra-zumkeller-86007', 'item-db-pas-blocos', 'mat-br-bloco-370', 370.00, 1.64),
  ('ic-86007-15', 'compra-zumkeller-86007', 'item-db-pas-lajota', 'mat-est-lajota-h8', 40.00, 2.42),
  ('ic-86007-16', 'compra-zumkeller-86007', 'item-db-pas-trelica', 'mat-est-trelica-h8', 12.00, 19.38),
  ('ic-86007-17', 'compra-zumkeller-86007', 'item-db-pas-frete', 'mat-sv-frete-zumkeller', 1.00, 50.00),
  -- Item da NF 86.006
  ('ic-86006-01', 'compra-zumkeller-86006', 'item-db-ext-plafon', 'mat-ele-plafon-24w', 1.00, 46.45)
ON CONFLICT (id) DO UPDATE SET
  qtd_comprada = EXCLUDED.qtd_comprada,
  preco_unitario_real = EXCLUDED.preco_unitario_real;

COMMIT;
