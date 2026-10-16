-- Ingestão da Nota Fiscal Longametragem Ferragens NF-e 92.041
-- Data: 2026-10-15
-- Fornecedor: Longametragem Ferragens LTDA (CNPJ: 53.073.730/0001-89)
-- Destino: Banheiro Casa Pastoral (Ambiente ID: 59068f34-8688-4d30-a75f-cb9c14e2f17b)
-- Projeto: 627293a8-1f22-46d4-af28-821bec6b9725
-- Cenário: b0786118-9a21-46ca-8536-ec4be7a376c1 (Cenário Standard)
-- Documento: 92041 - DANFE - IGREJA CRISTA EVANGELICA NOVA VIDA  ICEB.pdf (Chave de Acesso: 3526 1053 0737 3000 0189 5500 1000 0920 4112 6101 5142)

BEGIN;

-- 1. Homologar Fornecedor Longametragem Ferragens LTDA
INSERT INTO fornecedor (
  nome, tipo_parceiro, especialidade, cnpj, telefone_contato, endereco, status, criado_em
) VALUES (
  'Longametragem Ferragens LTDA',
  'Depósito / Ferragens',
  'Ferragens, Tijolos Canaletas e Arames',
  '53.073.730/0001-89',
  '(11) 2950-1635',
  'Rua Maria Cândida, 119, Loja - Vila Guilherme - São Paulo - SP - CEP 02071-010',
  'Homologado',
  NOW()
)
ON CONFLICT (nome) DO UPDATE SET
  cnpj = EXCLUDED.cnpj,
  telefone_contato = EXCLUDED.telefone_contato,
  endereco = EXCLUDED.endereco;

-- 2. Material no Catálogo
INSERT INTO material (id, categoria_id, descricao, fabricante, modelo_sku, unidade_venda, fator_embalagem, criado_em) VALUES
  ('mat-br-canaleta-guaru', 31, 'Guaru Tijolo Canaleta Baiano Econômico', 'Cerâmica Guarulhos (Guaru)', '793667 - Guaru Tijolo Canaleta Baiano Econ.', 'un', 1.0, NOW())
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fabricante = EXCLUDED.fabricante,
  modelo_sku = EXCLUDED.modelo_sku,
  unidade_venda = EXCLUDED.unidade_venda;

-- 3. Atualizar Item do Projeto no Cenário Standard (Banheiro Casa Pastoral)
UPDATE item_projeto SET
  material_id = 'mat-br-canaleta-guaru',
  qtd_necessaria_liquida = 24.00,
  margem_perda_pct = 0.00,
  qtd_calculada_bruta = 24.00,
  qtd_embalagem_fechada = 24,
  preco_unitario_estimado = 2.20
WHERE id = 'item-db-pas-canaletas';

-- 4. Registro da Compra (NF-e 92.041)
INSERT INTO compra (
  id, fornecedor_id, numero_nf, data_compra, valor_total, valor_desconto_geral, valor_frete, forma_pagamento, quantidade_parcelas, foto_nf_url, criado_em
) VALUES (
  'compra-longametragem-92041',
  (SELECT id FROM fornecedor WHERE cnpj = '53.073.730/0001-89' OR nome LIKE '%Longametragem%' LIMIT 1),
  '92.041',
  '2026-10-15',
  52.80,
  0.00,
  0.00,
  'dinheiro',
  1,
  '92041 - DANFE - IGREJA CRISTA EVANGELICA NOVA VIDA  ICEB.pdf',
  '2026-10-15 14:48:12'
)
ON CONFLICT (id) DO UPDATE SET
  valor_total = EXCLUDED.valor_total,
  valor_frete = EXCLUDED.valor_frete,
  data_compra = EXCLUDED.data_compra,
  foto_nf_url = EXCLUDED.foto_nf_url;

-- 5. Parcela de Pagamento (À Vista - Pago)
INSERT INTO parcela_pagamento (
  id, compra_id, numero_parcela, data_vencimento, valor_parcela, data_pagamento_efetivo, status
) VALUES (
  'parc-92041-01',
  'compra-longametragem-92041',
  1,
  '2026-10-15',
  52.80,
  '2026-10-15',
  'Pago'
)
ON CONFLICT (id) DO UPDATE SET
  valor_parcela = EXCLUDED.valor_parcela,
  status = EXCLUDED.status,
  data_pagamento_efetivo = EXCLUDED.data_pagamento_efetivo;

-- 6. Itens da Compra
INSERT INTO item_compra (id, compra_id, item_projeto_id, material_id, qtd_comprada, preco_unitario_real) VALUES
  ('ic-92041-01', 'compra-longametragem-92041', 'item-db-pas-canaletas', 'mat-br-canaleta-guaru', 24.00, 2.20)
ON CONFLICT (id) DO UPDATE SET
  qtd_comprada = EXCLUDED.qtd_comprada,
  preco_unitario_real = EXCLUDED.preco_unitario_real;

-- 7. Histórico de Preços Homologados
INSERT INTO preco_captura (id, material_id, fornecedor_id, preco_vista, preco_prazo, data_captura, foto_etiqueta_url) VALUES
  ('pr-92041-canaleta', 'mat-br-canaleta-guaru', (SELECT id FROM fornecedor WHERE cnpj = '53.073.730/0001-89' OR nome LIKE '%Longametragem%' LIMIT 1), 2.20, 2.20, '2026-10-15 14:48:12', '92041 - DANFE - IGREJA CRISTA EVANGELICA NOVA VIDA  ICEB.pdf')
ON CONFLICT (id) DO UPDATE SET
  preco_vista = EXCLUDED.preco_vista,
  preco_prazo = EXCLUDED.preco_prazo,
  data_captura = EXCLUDED.data_captura;

COMMIT;
