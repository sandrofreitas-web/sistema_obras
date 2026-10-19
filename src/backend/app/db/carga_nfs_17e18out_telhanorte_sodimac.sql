-- Ingestão das 3 Novas Notas Fiscais / Pedidos Faturados (17 e 18 de Outubro de 2026)
-- 1. Sodimac Dicico Tietê (Construdecor S/A) - Ordem de Venda Nº 1918242567 (18/10/2026) - R$ 4.264,41
-- 2. Telhanorte Marginal Tietê (Saint-Gobain) - NFC-e Nº 53813 Série 55 (17/10/2026) - R$ 3.261,79
-- 3. Telhanorte Marginal Tietê (Saint-Gobain) - Pedido Entrega 005576 Fachada (17/10/2026) - R$ 863,54
-- 4. Telhanorte Marginal Tietê (Saint-Gobain) - Pedido Entrega 005578 Revestimentos/Louças (17/10/2026) - R$ 6.536,46
-- Projeto: 627293a8-1f22-46d4-af28-821bec6b9725 (1ª Fase: Banheiro Casa Pastoral)
-- Cenário: b0786118-9a21-46ca-8536-ec4be7a376c1 (Cenário Standard)
-- Ambiente Banheiro: 59068f34-8688-4d30-a75f-cb9c14e2f17b
-- Ambiente Área Externa: 7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c

BEGIN;

-- 1. Homologação dos Fornecedores
INSERT INTO fornecedor (
  nome, tipo_parceiro, especialidade, cnpj, telefone_contato, endereco, status, criado_em
) VALUES 
  (
    'Sodimac Dicico Tietê (Construdecor S/A)',
    'Home Center',
    'Esquadrias, Janelas, Madeiras e Acabamentos',
    '03.439.316/0011-44',
    '(11) 3616-5000',
    'Av. Pres. Castelo Branco, 4800 - Pari - São Paulo - SP',
    'Homologado',
    NOW()
  ),
  (
    'Telhanorte Marginal Tietê (Saint-Gobain Distribuição Brasil LTDA)',
    'Home Center',
    'Revestimentos, Porcelanatos, Louças, Metais, Hidráulica Tigre e Argamassas',
    '03.840.926/0010-97',
    '(11) 3404-4000',
    'Av. Pres. Castelo Branco, 6201 - Ponte Grande - São Paulo - SP',
    'Homologado',
    NOW()
  )
ON CONFLICT (nome) DO UPDATE SET
  cnpj = EXCLUDED.cnpj,
  telefone_contato = EXCLUDED.telefone_contato,
  endereco = EXCLUDED.endereco;

-- 2. Materiais no Catálogo
INSERT INTO material (id, categoria_id, descricao, fabricante, modelo_sku, unidade_venda, fator_embalagem, criado_em) VALUES
  ('mat-esq-veneziana-100x150', 31, 'Veneziana 6 Folhas (2 Fixas) Vidro Liso Branca 100x150cm', 'CRV Portas e Janelas', '1701986 - 7898489290837', 'un', 1.0, NOW()),
  ('mat-esq-vitro-60x80', 31, 'Vitrô Basculante 1 Seção Alumínio Branco 60x80cm Vidro Boreal Top Sul', 'Top Sul', '0000001632868 - Vitro Basc 60x80', 'un', 1.0, NOW()),
  ('mat-rev-palavcorda-90x90', 2, 'Porcelanato Palavcorda Acetinado Retificado 90x90cm Cx 2,43m² Eliane', 'Eliane', '0000002630354 - Palavcorda 90x90', 'm²', 2.43, NOW()),
  ('mat-rev-fachada-mint', 3, 'Revestimento Fachada Piso Mint 7,5x25cm Cerâmica', 'Cerâmica Fachada', '0000002466112 - Revest Mint 7,5x25', 'm²', 1.0, NOW()),
  ('mat-rev-rejunte-acrilico-corda', 4, 'Rejunte Acrílico Antifungo Corda 1kg Quartzolit', 'Quartzolit', '0000001335162 - Rejunte Corda 1kg', 'un', 1.0, NOW()),
  ('mat-rev-espacador-1mm', 4, 'Espaçador Nivelador de Pisos 1,0mm Smart Cortag', 'Cortag', '0000001852710 - Espacador Smart 1mm', 'un', 1.0, NOW()),
  ('mat-rev-cunha-nivelador', 4, 'Cunha para Nivelamento de Pisos c/ 50 un Cortag', 'Cortag', '0000001397877 - Cunha Cortag 50un', 'un', 1.0, NOW()),
  ('mat-lou-bacia-smart-celite', 20, 'Kit Bacia Sanitária com Caixa Acoplada Smart Branca Celite', 'Celite', '0000001580582 - Kit Celite Smart', 'cj', 1.0, NOW()),
  ('mat-lou-cuba-apoio-icasa', 20, 'Cuba de Apoio Redonda 38x38cm Branca Icasa', 'Icasa', '0000000401323 - Cuba Apoio 38cm', 'un', 1.0, NOW()),
  ('mat-lou-docol-torneira-logg', 21, 'Torneira Lavatório Mesa Bica Alta 90° Nova Logg Cromada Docol', 'Docol', '0000002161705 - Docol Logg Bica Alta', 'un', 1.0, NOW()),
  ('mat-lou-docol-ducha-logg', 21, 'Ducha Higiênica com Registro Derivação Nova Logg Cromada Docol', 'Docol', '0000002161743 - Ducha Docol Logg', 'un', 1.0, NOW()),
  ('mat-lou-docol-porta-toalha', 21, 'Porta Toalhas Bastão Duplo Top Docol', 'Docol', '0000001426423 - Porta Toalha Top Docol', 'un', 1.0, NOW()),
  ('mat-lou-docol-cabide', 21, 'Cabide Chrome Top Docol', 'Docol', '0000001426461 - Cabide Top Docol', 'un', 1.0, NOW()),
  ('mat-lou-acab-reg-pequeno', 21, 'Acabamento para Registro Pequeno Docol/Deca C21 Cromado (1/2 e 3/4)', 'Docol / Deca', '0000000005736 - Acab C21 Pequeno', 'un', 1.0, NOW()),
  ('mat-lou-acab-reg-grande', 21, 'Acabamento para Registro Grande Docol/Deca C21 Cromado (1.1/2)', 'Docol / Deca', '0000000005743 - Acab C21 Grande', 'un', 1.0, NOW())
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fabricante = EXCLUDED.fabricante,
  modelo_sku = EXCLUDED.modelo_sku,
  unidade_venda = EXCLUDED.unidade_venda;

-- 3. Inserir ou Atualizar Itens do Projeto no Cenário Standard
INSERT INTO item_projeto (
  id, ambiente_id, material_id, cenario_id, qtd_necessaria_liquida, margem_perda_pct, qtd_calculada_bruta, qtd_embalagem_fechada, preco_unitario_estimado
) VALUES
  -- Itens atualizados com compras
  ('item-db-pas-venezianas-dorm', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-esq-veneziana-100x150', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 1949.00),
  ('item-db-pas-vitro-60x80', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-esq-vitro-60x80', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 440.02),
  ('item-db-pas-porc-palavcorda', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-rev-palavcorda-90x90', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 21.87, 0.00, 21.87, 9, 145.04),
  ('item-db-pas-rev-fachada-mint', '7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c', 'mat-rev-fachada-mint', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 10.10, 0.00, 10.10, 10, 77.62),
  ('item-db-pas-rejunte-corda', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-rev-rejunte-acrilico-corda', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 0.00, 4.00, 4, 37.37),
  ('item-db-pas-espacador-smart', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-rev-espacador-1mm', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 49.53),
  ('item-db-pas-cunha-cortag', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-rev-cunha-nivelador', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 42.04),
  ('item-db-pas-bacia-smart', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-bacia-smart-celite', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 1404.53),
  ('item-db-pas-cuba-icasa', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-cuba-apoio-icasa', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 346.38),
  ('item-db-pas-torneira-docol', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-docol-torneira-logg', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 579.90),
  ('item-db-pas-ducha-docol', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-docol-ducha-logg', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 439.90),
  ('item-db-pas-porta-toalha', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-docol-porta-toalha', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 779.90),
  ('item-db-pas-cabide-docol', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-docol-cabide', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 194.90),
  ('item-db-pas-acab-reg-peq', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-acab-reg-pequeno', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 92.90),
  ('item-db-pas-acab-reg-grd', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-lou-acab-reg-grande', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 109.90)
ON CONFLICT (id) DO UPDATE SET
  preco_unitario_estimado = EXCLUDED.preco_unitario_estimado,
  qtd_necessaria_liquida = EXCLUDED.qtd_necessaria_liquida,
  qtd_embalagem_fechada = EXCLUDED.qtd_embalagem_fechada;

-- 4. Registro das 4 Compras
-- 4.1 Compra Sodimac 1918242567 (18/10/2026)
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES (
  'compra-sodimac-1918242567',
  (SELECT id FROM fornecedor WHERE cnpj = '03.439.316/0011-44' OR nome LIKE '%Sodimac%' LIMIT 1),
  'OV-1918242567',
  '2026-10-18',
  4264.41,
  0.00,
  366.41,
  'cartao_credito',
  6,
  'Sodimac_18Out.pdf',
  '2026-10-18 10:00:00'
)
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  valor_frete = EXCLUDED.valor_frete,
  data_compra = EXCLUDED.data_compra,
  foto_nf_url = EXCLUDED.foto_nf_url;

-- 4.2 Compra Telhanorte NFC-e 53813 (17/10/2026)
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES (
  'compra-telhanorte-53813',
  (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' OR nome LIKE '%Telhanorte%' LIMIT 1),
  '53.813',
  '2026-10-17',
  3261.79,
  0.00,
  0.00,
  'cartao_credito',
  1,
  'Telha Norte_17out.pdf',
  '2026-10-17 13:25:06'
)
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  data_compra = EXCLUDED.data_compra,
  foto_nf_url = EXCLUDED.foto_nf_url;

-- 4.3 Compra Telhanorte Pedido 005576 Fachada (17/10/2026)
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES (
  'compra-telhanorte-005576',
  (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' OR nome LIKE '%Telhanorte%' LIMIT 1),
  'PED-005576',
  '2026-10-17',
  863.54,
  0.04,
  79.54,
  'cartao_credito',
  1,
  'Telha Norte_17Out_2.pdf',
  '2026-10-17 13:30:00'
)
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  valor_frete = EXCLUDED.valor_frete,
  data_compra = EXCLUDED.data_compra,
  foto_nf_url = EXCLUDED.foto_nf_url;

-- 4.4 Compra Telhanorte Pedido 005578 Revestimentos/Louças (17/10/2026)
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES (
  'compra-telhanorte-005578',
  (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' OR nome LIKE '%Telhanorte%' LIMIT 1),
  'PED-005578',
  '2026-10-17',
  6536.46,
  0.20,
  540.34,
  'cartao_credito',
  1,
  'Telha Norte_17Out_2.pdf',
  '2026-10-17 13:35:00'
)
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  valor_frete = EXCLUDED.valor_frete,
  data_compra = EXCLUDED.data_compra,
  foto_nf_url = EXCLUDED.foto_nf_url;

-- 5. Parcelas de Pagamento
INSERT INTO parcela_pagamento (
  id, compra_id, numero_parcela, data_vencimento, valor_parcela, data_pagamento_efetivo, status
) VALUES 
  ('parc-sod-1918242567-01', 'compra-sodimac-1918242567', 1, '2026-10-18', 4264.41, '2026-10-18', 'Pago'),
  ('parc-tel-53813-01', 'compra-telhanorte-53813', 1, '2026-10-17', 3261.79, '2026-10-17', 'Pago'),
  ('parc-tel-005576-01', 'compra-telhanorte-005576', 1, '2026-10-17', 863.54, '2026-10-17', 'Pago'),
  ('parc-tel-005578-01', 'compra-telhanorte-005578', 1, '2026-10-17', 6536.46, '2026-10-17', 'Pago')
ON CONFLICT (id) DO UPDATE SET
  valor_parcela = EXCLUDED.valor_parcela,
  status = EXCLUDED.status,
  data_pagamento_efetivo = EXCLUDED.data_pagamento_efetivo;

-- 6. Itens de Compra
INSERT INTO item_compra (id, compra_id, item_projeto_id, material_id, qtd_comprada, preco_unitario_real) VALUES
  -- Sodimac
  ('ic-sod-01', 'compra-sodimac-1918242567', 'item-db-pas-venezianas-dorm', 'mat-esq-veneziana-100x150', 2.00, 1949.00),
  -- Telhanorte Pedido 005576
  ('ic-tel-5576-01', 'compra-telhanorte-005576', 'item-db-pas-rev-fachada-mint', 'mat-rev-fachada-mint', 10.10, 77.62),
  -- Telhanorte Pedido 005578
  ('ic-tel-5578-01', 'compra-telhanorte-005578', 'item-db-pas-porc-palavcorda', 'mat-rev-palavcorda-90x90', 21.87, 145.04),
  ('ic-tel-5578-02', 'compra-telhanorte-005578', 'item-db-pas-rejunte-corda', 'mat-rev-rejunte-acrilico-corda', 4.00, 37.37),
  ('ic-tel-5578-03', 'compra-telhanorte-005578', 'item-db-pas-espacador-smart', 'mat-rev-espacador-1mm', 1.00, 49.53),
  ('ic-tel-5578-04', 'compra-telhanorte-005578', 'item-db-pas-cunha-cortag', 'mat-rev-cunha-nivelador', 1.00, 42.04),
  ('ic-tel-5578-05', 'compra-telhanorte-005578', 'item-db-pas-bacia-smart', 'mat-lou-bacia-smart-celite', 1.00, 1404.53),
  ('ic-tel-5578-06', 'compra-telhanorte-005578', 'item-db-pas-cuba-icasa', 'mat-lou-cuba-apoio-icasa', 1.00, 346.38),
  ('ic-tel-5578-07', 'compra-telhanorte-005578', 'item-db-pas-vitro-60x80', 'mat-esq-vitro-60x80', 1.00, 440.02),
  -- Telhanorte NFC-e 53813 (Metais e Conexões Principais)
  ('ic-tel-53813-01', 'compra-telhanorte-53813', 'item-db-pas-torneira-docol', 'mat-lou-docol-torneira-logg', 1.00, 579.90),
  ('ic-tel-53813-02', 'compra-telhanorte-53813', 'item-db-pas-ducha-docol', 'mat-lou-docol-ducha-logg', 1.00, 439.90),
  ('ic-tel-53813-03', 'compra-telhanorte-53813', 'item-db-pas-porta-toalha', 'mat-lou-docol-porta-toalha', 1.00, 779.90),
  ('ic-tel-53813-04', 'compra-telhanorte-53813', 'item-db-pas-cabide-docol', 'mat-lou-docol-cabide', 1.00, 194.90),
  ('ic-tel-53813-05', 'compra-telhanorte-53813', 'item-db-pas-acab-reg-peq', 'mat-lou-acab-reg-pequeno', 1.00, 92.90),
  ('ic-tel-53813-06', 'compra-telhanorte-53813', 'item-db-pas-acab-reg-grd', 'mat-lou-acab-reg-grande', 1.00, 109.90)
ON CONFLICT (id) DO UPDATE SET
  qtd_comprada = EXCLUDED.qtd_comprada,
  preco_unitario_real = EXCLUDED.preco_unitario_real;

-- 7. Histórico de Preços de Mercado Capturados
INSERT INTO preco_captura (id, material_id, fornecedor_id, preco_vista, preco_prazo, data_captura, foto_etiqueta_url) VALUES
  ('pr-sod-veneziana', 'mat-esq-veneziana-100x150', (SELECT id FROM fornecedor WHERE cnpj = '03.439.316/0011-44' LIMIT 1), 1949.00, 1949.00, '2026-10-18', 'Sodimac_18Out.pdf'),
  ('pr-tel-palavcorda', 'mat-rev-palavcorda-90x90', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 145.04, 145.04, '2026-10-17', 'Telha Norte_17Out_2.pdf'),
  ('pr-tel-fachada-mint', 'mat-rev-fachada-mint', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 77.62, 77.62, '2026-10-17', 'Telha Norte_17Out_2.pdf'),
  ('pr-tel-vitro-60x80', 'mat-esq-vitro-60x80', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 440.02, 440.02, '2026-10-17', 'Telha Norte_17Out_2.pdf'),
  ('pr-tel-bacia-smart', 'mat-lou-bacia-smart-celite', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 1404.53, 1404.53, '2026-10-17', 'Telha Norte_17Out_2.pdf'),
  ('pr-tel-cuba-icasa', 'mat-lou-cuba-apoio-icasa', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 346.38, 346.38, '2026-10-17', 'Telha Norte_17Out_2.pdf'),
  ('pr-tel-torneira-docol', 'mat-lou-docol-torneira-logg', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 579.90, 579.90, '2026-10-17', 'Telha Norte_17out.pdf'),
  ('pr-tel-ducha-docol', 'mat-lou-docol-ducha-logg', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 439.90, 439.90, '2026-10-17', 'Telha Norte_17out.pdf'),
  ('pr-tel-porta-toalha', 'mat-lou-docol-porta-toalha', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 779.90, 779.90, '2026-10-17', 'Telha Norte_17out.pdf'),
  ('pr-tel-cabide-docol', 'mat-lou-docol-cabide', (SELECT id FROM fornecedor WHERE cnpj = '03.840.926/0010-97' LIMIT 1), 194.90, 194.90, '2026-10-17', 'Telha Norte_17out.pdf')
ON CONFLICT (id) DO UPDATE SET
  preco_vista = EXCLUDED.preco_vista,
  preco_prazo = EXCLUDED.preco_prazo,
  data_captura = EXCLUDED.data_captura;

COMMIT;
