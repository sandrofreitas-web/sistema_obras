-- Script de Inserção da Lista de Materiais Brutos - Reforma Banheiro Casa Pastoral
-- Projeto: 627293a8-1f22-46d4-af28-821bec6b9725
-- Ambiente: 59068f34-8688-4d30-a75f-cb9c14e2f17b (Banheiro Casa Pastoral)
-- Cenário: b0786118-9a21-46ca-8536-ec4be7a376c1 (Cenário Standard)

BEGIN;

-- 1. Categorias de Estrutura, Alvenaria, Madeiramento e Aço
INSERT INTO categoria (classe, tipo, unidade_padrao) VALUES
  ('Bruto / Estrutura', 'Bloco de Concreto / Alvenaria Estrutural', 'un'),
  ('Bruto / Estrutura', 'Tijolinho Maciço Comum', 'pct'),
  ('Bruto / Estrutura', 'Canaleta de Concreto U', 'm'),
  ('Bruto / Estrutura', 'Tábua de Madeira Pinus 30cm', 'peça'),
  ('Bruto / Estrutura', 'Sarrafo de Madeira Pinus 15cm', 'peça'),
  ('Bruto / Estrutura', 'Pontalete de Eucalipto 3m', 'peça'),
  ('Bruto / Estrutura', 'Coluna Armada Pronta 9x15', 'un'),
  ('Bruto / Estrutura', 'Barra de Ferro CA-50 3/8 (10mm)', 'barra'),
  ('Bruto / Estrutura', 'Arame Recozido nº 18', 'kg'),
  ('Bruto / Estrutura', 'Prego com Cabeça 18x27', 'kg'),
  ('Caçambas & Infra', 'Saco de Ráfia para Entulho 50kg', 'un')
ON CONFLICT DO NOTHING;

-- 2. Materiais no Catálogo
INSERT INTO material (id, categoria_id, descricao, fabricante, modelo_sku, unidade_venda, fator_embalagem, criado_em) VALUES
  ('mat-br-areia-media', (SELECT id FROM categoria WHERE tipo = 'Areia Média Lavada' LIMIT 1), 'Areia Média Lavada de Rio a Granel', 'Depósito Local', 'Areia Média Lavada m³', 'm³', 1.0, NOW()),
  ('mat-br-pedra-brita', (SELECT id FROM categoria WHERE tipo = 'Pedra Brita nº 1' LIMIT 1), 'Pedra Brita nº 1 Graduada 19mm', 'Depósito Local', 'Pedra Brita 1 m³', 'm³', 1.0, NOW()),
  ('mat-br-cimento-cp2', (SELECT id FROM categoria WHERE tipo = 'Cimento CP II-Z-32' LIMIT 1), 'Cimento CP II-Z-32 (Sacos 50kg)', 'Votoran / Itaú', 'CP II-Z-32 50kg', 'saco', 50.0, NOW()),
  ('mat-br-bloco-370', (SELECT id FROM categoria WHERE tipo LIKE '%Bloco%' LIMIT 1), 'Bloco de Concreto / Alvenaria de Vedação', 'Blocos União', 'Bloco Estrutural / Vedação', 'un', 1.0, NOW()),
  ('mat-br-tijolinho-pct', (SELECT id FROM categoria WHERE tipo LIKE '%Tijolinho%' LIMIT 1), 'Tijolinho Comum Maciço para Requadração', 'Cerâmica Local', 'Tijolo Maciço Feixe/Pct', 'pct', 1.0, NOW()),
  ('mat-br-canaleta-540', (SELECT id FROM categoria WHERE tipo LIKE '%Canaleta%' LIMIT 1), 'Canaleta de Concreto U para Viga de Respaldo', 'Blocos União', 'Canaleta U Concreto', 'm', 1.0, NOW()),
  ('mat-br-tabua-30', (SELECT id FROM categoria WHERE tipo LIKE '%Tábua%' LIMIT 1), 'Tábua de Madeira Pinus 30cm x 3,00m para Caixaria', 'Madereira Local', 'Tábua Pinus 30cm', 'peça', 1.0, NOW()),
  ('mat-br-sarrafo-15', (SELECT id FROM categoria WHERE tipo LIKE '%Sarrafo%' LIMIT 1), 'Sarrafo de Pinus 15cm x 3,00m para Travamento', 'Madereira Local', 'Sarrafo Pinus 15cm', 'peça', 1.0, NOW()),
  ('mat-br-pontalete-euc', (SELECT id FROM categoria WHERE tipo LIKE '%Pontalete%' LIMIT 1), 'Pontalete de Eucalipto 7x7cm x 3,00m para Escoramento', 'Madereira Local', 'Pontalete Eucalipto 3m', 'peça', 1.0, NOW()),
  ('mat-br-coluna-9x15', (SELECT id FROM categoria WHERE tipo LIKE '%Coluna Armada%' LIMIT 1), 'Coluna Armada Pronta 9x15cm (Estribos 5/16 a cada 20cm, Barra 3m)', 'Gerdau / ArcelorMittal', 'Coluna Armada 9x15 3m', 'un', 1.0, NOW()),
  ('mat-br-ferro-3-8', (SELECT id FROM categoria WHERE tipo LIKE '%Barra de Ferro CA-50%' LIMIT 1), 'Barra de Ferro Aço CA-50 3/8 (10mm) com 12 Metros', 'Gerdau', 'Barra CA-50 3/8 12m', 'barra', 1.0, NOW()),
  ('mat-br-arame-recoz', (SELECT id FROM categoria WHERE tipo LIKE '%Arame Recozido%' LIMIT 1), 'Arame Recozido nº 18 para Armação de Ferragens', 'Gerdau / Belgo', 'Arame Recozido nº 18', 'kg', 1.0, NOW()),
  ('mat-br-prego-18x27', (SELECT id FROM categoria WHERE tipo LIKE '%Prego com Cabeça%' LIMIT 1), 'Prego com Cabeça 18x27 (2.1/2 x 10) para Caixaria', 'Gerdau', 'Prego 18x27 Polido', 'kg', 1.0, NOW()),
  ('mat-cac-saco-entulho', (SELECT id FROM categoria WHERE tipo LIKE '%Saco de Ráfia%' LIMIT 1), 'Saco de Ráfia Reforçado para Entulho 50kg', 'Embalagens São Paulo', 'Saco Entulho Ráfia 50kg', 'un', 1.0, NOW())
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fabricante = EXCLUDED.fabricante,
  unidade_venda = EXCLUDED.unidade_venda;

-- 3. Inserção dos Itens no Orçamento do Projeto (Banheiro Casa Pastoral)
INSERT INTO item_projeto (
  id,
  ambiente_id,
  material_id,
  cenario_id,
  qtd_necessaria_liquida,
  margem_perda_pct,
  qtd_calculada_bruta,
  qtd_embalagem_fechada,
  preco_unitario_estimado
) VALUES
  ('item-db-pas-areia', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-areia-media', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 5.00, 2.10, 3, 160.00),
  ('item-db-pas-brita', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-pedra-brita', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 0.50, 5.00, 0.53, 1, 170.00),
  ('item-db-pas-cimento', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-cimento-cp2', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 15.00, 0.00, 15.00, 15, 38.00),
  ('item-db-pas-blocos', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-bloco-370', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 370.00, 10.00, 407.00, 407, 3.50),
  ('item-db-pas-tijolinho', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-tijolinho-pct', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 5.00, 4.20, 5, 45.00),
  ('item-db-pas-canaletas', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-canaleta-540', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 5.40, 5.00, 5.67, 6, 9.50),
  ('item-db-pas-tabuas', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-tabua-30', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 0.00, 4.00, 4, 38.00),
  ('item-db-pas-sarrafos', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-sarrafo-15', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 5.00, 0.00, 5.00, 5, 22.00),
  ('item-db-pas-pontaletes', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-pontalete-euc', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 28.00),
  ('item-db-pas-colunas', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-coluna-9x15', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 0.00, 4.00, 4, 68.00),
  ('item-db-pas-ferro', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-ferro-3-8', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 5.00, 3.15, 4, 58.00),
  ('item-db-pas-arame', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-arame-recoz', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 18.00),
  ('item-db-pas-prego', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-prego-18x27', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 24.00),
  ('item-db-pas-sacolixo', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-cac-saco-entulho', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 20.00, 0.00, 20.00, 20, 2.50)
ON CONFLICT (id) DO UPDATE SET
  qtd_necessaria_liquida = EXCLUDED.qtd_necessaria_liquida,
  margem_perda_pct = EXCLUDED.margem_perda_pct,
  qtd_calculada_bruta = EXCLUDED.qtd_calculada_bruta,
  preco_unitario_estimado = EXCLUDED.preco_unitario_estimado;

COMMIT;
