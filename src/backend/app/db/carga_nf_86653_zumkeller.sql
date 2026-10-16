-- Ingestão da Nota Fiscal Zumkeller NF-e 86.653
-- Data: 2026-10-16
-- Fornecedor: Depósito Zumkeller (ID: 8)
-- Destino: Banheiro Casa Pastoral (Ambiente ID: 59068f34-8688-4d30-a75f-cb9c14e2f17b)
-- Projeto: 627293a8-1f22-46d4-af28-821bec6b9725
-- Cenário: b0786118-9a21-46ca-8536-ec4be7a376c1 (Cenário Standard)
-- Documento: Zunkler_16OUT26.pdf (Chave de Acesso: 3526 1062 3282 9900 0165 5500 1000 0866 5319 5053 6286)

BEGIN;

-- 1. Materiais no Catálogo
INSERT INTO material (id, categoria_id, descricao, fabricante, modelo_sku, unidade_venda, fator_embalagem, criado_em) VALUES
  ('mat-hid-krona-tubo-50', 10, 'Krona Tubo PVC Soldável Água Fria 50mm Metro', 'Krona', '19816 - Tubo PVC Soldável 50mm', 'm', 1.0, NOW()),
  ('mat-hid-krona-tubo-25', 10, 'Krona Tubo PVC Soldável Água Fria 25mm Metro (3/4)', 'Krona', '20524 - Tubo PVC Soldável 25mm', 'm', 1.0, NOW()),
  ('mat-hid-krona-tubo-esg-100', 11, 'Krona Tubo PVC Esgoto Primário 100mm Metro', 'Krona', '23119 - Tubo PVC Esgoto Prim 100mm', 'm', 1.0, NOW()),
  ('mat-hid-krona-tubo-esg-75', 11, 'Krona Tubo PVC Esgoto Secundário 75mm Metro', 'Krona', '26661 - Tubo PVC Esgoto 75mm', 'm', 1.0, NOW())
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fabricante = EXCLUDED.fabricante,
  modelo_sku = EXCLUDED.modelo_sku,
  unidade_venda = EXCLUDED.unidade_venda;

-- 2. Itens do Projeto no Cenário Standard (Banheiro Casa Pastoral)
INSERT INTO item_projeto (
  id, ambiente_id, material_id, cenario_id, qtd_necessaria_liquida, margem_perda_pct, qtd_calculada_bruta, qtd_embalagem_fechada, preco_unitario_estimado
) VALUES
  ('item-db-pas-brita-adicional', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-br-pedra-brita', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 20.00, 0.00, 20.00, 20, 6.28),
  ('item-db-pas-tubo-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-krona-tubo-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 15.00, 0.00, 15.00, 15, 22.94),
  ('item-db-pas-tubo-25', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-krona-tubo-25', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 6.00, 0.00, 6.00, 6, 3.41),
  ('item-db-pas-tubo-100', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-krona-tubo-esg-100', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 6.00, 0.00, 6.00, 6, 18.58),
  ('item-db-pas-tubo-75', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-krona-tubo-esg-75', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 19.76),
  ('item-db-pas-frete-16out', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-sv-frete-zumkeller', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 50.00)
ON CONFLICT (id) DO UPDATE SET
  preco_unitario_estimado = EXCLUDED.preco_unitario_estimado,
  qtd_necessaria_liquida = EXCLUDED.qtd_necessaria_liquida,
  qtd_embalagem_fechada = EXCLUDED.qtd_embalagem_fechada;

-- 3. Registro da Compra (NF-e 86.653)
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES (
  'compra-zumkeller-86653', 
  8, 
  '86.653', 
  '2026-10-16', 
  710.92, 
  0.00, 
  50.00, 
  'dinheiro', 
  1, 
  'Zunkler_16OUT26.pdf', 
  '2026-10-16 12:47:09'
)
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  valor_frete = EXCLUDED.valor_frete,
  data_compra = EXCLUDED.data_compra,
  foto_nf_url = EXCLUDED.foto_nf_url;

-- 4. Parcela de Pagamento (À Vista - Pago)
INSERT INTO parcela_pagamento (
  id, compra_id, numero_parcela, data_vencimento, valor_parcela, data_pagamento_efetivo, status
) VALUES (
  'parc-86653-01',
  'compra-zumkeller-86653',
  1,
  '2026-10-16',
  710.92,
  '2026-10-16',
  'Pago'
)
ON CONFLICT (id) DO UPDATE SET
  valor_parcela = EXCLUDED.valor_parcela,
  status = EXCLUDED.status,
  data_pagamento_efetivo = EXCLUDED.data_pagamento_efetivo;

-- 5. Itens da Compra
INSERT INTO item_compra (id, compra_id, item_projeto_id, material_id, qtd_comprada, preco_unitario_real) VALUES
  ('ic-86653-01', 'compra-zumkeller-86653', 'item-db-pas-brita-adicional', 'mat-br-pedra-brita', 20.00, 6.28),
  ('ic-86653-02', 'compra-zumkeller-86653', 'item-db-pas-tubo-50', 'mat-hid-krona-tubo-50', 15.00, 22.94),
  ('ic-86653-03', 'compra-zumkeller-86653', 'item-db-pas-tubo-25', 'mat-hid-krona-tubo-25', 6.00, 3.41),
  ('ic-86653-04', 'compra-zumkeller-86653', 'item-db-pas-tubo-100', 'mat-hid-krona-tubo-esg-100', 6.00, 18.58),
  ('ic-86653-05', 'compra-zumkeller-86653', 'item-db-pas-tubo-75', 'mat-hid-krona-tubo-esg-75', 3.00, 19.76),
  ('ic-86653-06', 'compra-zumkeller-86653', 'item-db-pas-frete-16out', 'mat-sv-frete-zumkeller', 1.00, 50.00)
ON CONFLICT (id) DO UPDATE SET
  qtd_comprada = EXCLUDED.qtd_comprada,
  preco_unitario_real = EXCLUDED.preco_unitario_real;

-- 6. Histórico de Preços Homologados da Zumkeller
INSERT INTO preco_captura (id, material_id, fornecedor_id, preco_vista, preco_prazo, data_captura, foto_etiqueta_url) VALUES
  ('pr-86653-brita', 'mat-br-pedra-brita', 8, 6.28, 6.28, '2026-10-16 12:47:09', 'Zunkler_16OUT26.pdf'),
  ('pr-86653-tubo-50', 'mat-hid-krona-tubo-50', 8, 22.94, 22.94, '2026-10-16 12:47:09', 'Zunkler_16OUT26.pdf'),
  ('pr-86653-tubo-25', 'mat-hid-krona-tubo-25', 8, 3.41, 3.41, '2026-10-16 12:47:09', 'Zunkler_16OUT26.pdf'),
  ('pr-86653-tubo-100', 'mat-hid-krona-tubo-esg-100', 8, 18.58, 18.58, '2026-10-16 12:47:09', 'Zunkler_16OUT26.pdf'),
  ('pr-86653-tubo-75', 'mat-hid-krona-tubo-esg-75', 8, 19.76, 19.76, '2026-10-16 12:47:09', 'Zunkler_16OUT26.pdf')
ON CONFLICT (id) DO UPDATE SET
  preco_vista = EXCLUDED.preco_vista,
  preco_prazo = EXCLUDED.preco_prazo,
  data_captura = EXCLUDED.data_captura;

COMMIT;
