-- Script de Inserção da Lista Detalhada de Materiais Requisitados - Banheiro Casa Pastoral
-- Data: 2026-10-17
-- Projeto: 627293a8-1f22-46d4-af28-821bec6b9725 (Obra ICENV 2026 - Banheiro Pastoral e Bloco Masculino)
-- Ambiente: 59068f34-8688-4d30-a75f-cb9c14e2f17b (Banheiro Casa Pastoral)
-- Cenário: b0786118-9a21-46ca-8536-ec4be7a376c1 (Cenário Standard)
-- Solicitante: Mestre de Obras / Wagner

BEGIN;

-- 1. Materiais no Catálogo
INSERT INTO material (id, categoria_id, descricao, fabricante, modelo_sku, unidade_venda, fator_embalagem, criado_em) VALUES
  ('mat-hid-te-sold-50', 10, 'Tê Soldável 90° PVC Água Fria 50mm', 'Krona / Tigre', 'Tê 90 Soldável 50mm Marrom', 'un', 1.0, NOW()),
  ('mat-hid-te-red-50-25', 10, 'Tê de Redução Soldável 90° PVC Água Fria 50mm x 25mm (3/4")', 'Krona / Tigre', 'Tê Redução 50x25mm Marrom', 'un', 1.0, NOW()),
  ('mat-hid-red-50-25', 10, 'Bucha de Redução Soldável PVC Água Fria 50mm x 25mm (3/4")', 'Krona / Tigre', 'Bucha Redução Longa 50x25mm', 'un', 1.0, NOW()),
  ('mat-hid-joelho-50', 10, 'Cotovelo / Joelho 90° Soldável PVC Água Fria 50mm', 'Krona / Tigre', 'Joelho 90 Soldável 50mm', 'un', 1.0, NOW()),
  ('mat-hid-luva-50', 10, 'Luva Soldável PVC Água Fria 50mm', 'Krona / Tigre', 'Luva Soldável 50mm Marrom', 'un', 1.0, NOW()),
  ('mat-hid-reg-pvc-50', 10, 'Registro de Esfera PVC Soldável Monobloco 50mm (PC)', 'Krona / Tigre', 'Registro Esfera PVC 50mm Soldável', 'un', 1.0, NOW()),
  ('mat-hid-reg-gaveta-50', 10, 'Registro de Gaveta Bruto Metal 1.1/2" (50mm) c/ 2 Adaptadores 50mm', 'Docol / Deca / Krona', 'Registro Gaveta Metal 1.1/2 c/ Adaptadores 50mm', 'un', 1.0, NOW()),
  ('mat-hid-reg-pressao-3-4', 10, 'Registro de Pressão 3/4" Chuveiro c/ Adaptador e Luva Azul Bucha Latão', 'Docol / Deca / Krona', 'Registro Pressão 3/4 c/ Conexões Transição Latão', 'un', 1.0, NOW()),
  ('mat-hid-joelho-25', 10, 'Cotovelo / Joelho 90° Soldável PVC Água Fria 25mm (3/4")', 'Krona / Tigre', 'Joelho 90 Soldável 25mm Marrom', 'un', 1.0, NOW()),
  ('mat-hid-joelho-azul-25-1-2', 10, 'Cotovelo / Joelho 90° Azul com Bucha de Latão 25mm x 1/2" (3/4" x 1/2")', 'Krona / Tigre', 'Joelho 90 Azul Bucha Latão 25x1/2', 'un', 1.0, NOW()),
  ('mat-hid-luva-azul-25-1-2', 10, 'Luva Azul com Bucha de Latão Soldável c/ Rosca 25mm x 1/2" (3/4" x 1/2")', 'Krona / Tigre', 'Luva Azul Bucha Latão 25x1/2', 'un', 1.0, NOW()),
  ('mat-hid-te-25', 10, 'Tê 90° Soldável PVC Água Fria 25mm (3/4")', 'Krona / Tigre', 'Tê 90 Soldável 25mm Marrom', 'un', 1.0, NOW()),
  ('mat-hid-luva-25', 10, 'Luva Soldável PVC Água Fria 25mm (3/4")', 'Krona / Tigre', 'Luva Soldável 25mm Marrom', 'un', 1.0, NOW()),
  ('mat-hid-te-esg-100-ligafacil', 11, 'Tê Sanitário / Inspeção Liga Fácil com Bolsa de Correr Esgoto 100mm', 'Krona / Tigre', 'Tê Sanitário Liga Fácil 100mm', 'un', 1.0, NOW()),
  ('mat-hid-joelho-esg-100-90', 11, 'Cotovelo / Joelho 90° PVC Esgoto Primário 100mm', 'Krona / Tigre', 'Joelho 90 Esgoto 100mm Branco', 'un', 1.0, NOW()),
  ('mat-hid-joelho-esg-100-45', 11, 'Joelho / Curva 45° PVC Esgoto Primário 100mm', 'Krona / Tigre', 'Joelho 45 Esgoto 100mm Branco', 'un', 1.0, NOW()),
  ('mat-hid-juncao-y-100-50', 11, 'Junção Simples (Y) de Redução PVC Esgoto 100mm x 50mm', 'Krona / Tigre', 'Junção 45 Esgoto 100x50mm', 'un', 1.0, NOW()),
  ('mat-hid-joelho-esg-50-90', 11, 'Cotovelo / Joelho 90° PVC Esgoto Secundário 50mm', 'Krona / Tigre', 'Joelho 90 Esgoto 50mm Branco', 'un', 1.0, NOW()),
  ('mat-hid-joelho-esg-50-45', 11, 'Joelho / Curva 45° PVC Esgoto Secundário 50mm', 'Krona / Tigre', 'Joelho 45 Esgoto 50mm Branco', 'un', 1.0, NOW()),
  ('mat-hid-juncao-y-50', 11, 'Junção Simples (Y) 45° PVC Esgoto 50mm x 50mm', 'Krona / Tigre', 'Junção 45 Esgoto 50x50mm', 'un', 1.0, NOW()),
  ('mat-hid-joelho-esg-40-90', 11, 'Cotovelo / Joelho 90° PVC Esgoto 40mm', 'Krona / Tigre', 'Joelho 90 Esgoto 40mm Branco', 'un', 1.0, NOW()),
  ('mat-hid-joelho-esg-40-45', 11, 'Joelho / Curva 45° PVC Esgoto 40mm', 'Krona / Tigre', 'Joelho 45 Esgoto 40mm Branco', 'un', 1.0, NOW()),
  ('mat-hid-juncao-y-40', 11, 'Junção Simples (Y) 45° PVC Esgoto 40mm x 40mm', 'Krona / Tigre', 'Junção 45 Esgoto 40x40mm', 'un', 1.0, NOW()),
  ('mat-hid-caixa-ralo-100', 11, 'Caixa Sifonada 100x100x50mm com Grelha Redonda Branca / Inox', 'Tigre / Krona', 'Caixa Sifonada 100x100x50mm c/ Grelha', 'un', 1.0, NOW()),
  ('mat-fer-folha-serra', 1, 'Folha de Serra Manual Aço Rápido Bimetal 12" (Starrett)', 'Starrett', 'Folha de Serra Manual 12" 24 Dentes', 'un', 1.0, NOW()),
  ('mat-pin-lixa-100', 17, 'Folha de Lixa para Massa / Alvenaria Grão 100', 'Norton / Atlas', 'Lixa Massa nº 100', 'folha', 1.0, NOW()),
  ('mat-hid-cola-pvc-pincel', 10, 'Adesivo Plástico para Tubos e Conexões de PVC com Pincel 175g', 'Tigre / Krona', 'Adesivo Plástico PVC com Pincel 175g', 'frasco', 1.0, NOW()),
  ('mat-pin-plastico-3x4', 17, 'Lona / Plástico de Proteção para Pintura e Piso 3x4m (12m²)', 'Atlas / Roma', 'Plástico Lona Proteção 3x4m', 'un', 1.0, NOW()),
  ('mat-pin-massa-corrida-lata', 17, 'Massa Corrida PVA para Interior Balde/Lata 18L (25kg)', 'Suvinil / Coral / Irajá', 'Massa Corrida PVA Interior 18L', 'lata', 1.0, NOW()),
  ('mat-pin-rolo-brasileirinho', 17, 'Rolo de Lã Antirrespingo Brasileirinho 23cm Atlas', 'Atlas', 'Rolo Antirrespingo Brasileirinho 23cm', 'un', 1.0, NOW()),
  ('mat-pin-pincel-trincha', 17, 'Trincha / Pincel para Pintura 2" / 2.1/2" Cerdas Gris Atlas', 'Atlas', 'Trincha Cerdas Gris 2"', 'un', 1.0, NOW()),
  ('mat-ele-conduite-25mm', 12, 'Eletroduto Corrugado Flexível Amarelo 3/4" (25mm) Metro', 'Tigre / Krona', 'Eletroduto Corrugado Flexível 3/4" (25mm)', 'm', 1.0, NOW()),
  ('mat-ele-caixa-luz-4x2', 12, 'Caixa de Luz 4x2 Amarela Embutir Tigre / Amanco', 'Tigre / Amanco', 'Caixa de Embutir 4x2 Amarela', 'un', 1.0, NOW()),
  ('mat-est-grade-teto-laje', 1, 'Grade / Grelha de Ventilação para Teto / Forro Padrão de Laje', 'Metalúrgica / Plásticos Local', 'Grade de Ventilação para Laje', 'un', 1.0, NOW())
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fabricante = EXCLUDED.fabricante,
  modelo_sku = EXCLUDED.modelo_sku,
  unidade_venda = EXCLUDED.unidade_venda;

-- 2. Atualização dos quantitativos do Piso (5m²) e Azulejo (27m²)
UPDATE item_projeto
SET qtd_necessaria_liquida = 5.0, qtd_calculada_bruta = 5.0, qtd_embalagem_fechada = 5, margem_perda_pct = 0.0
WHERE id = 'item-pas-1' AND cenario_id = 'b0786118-9a21-46ca-8536-ec4be7a376c1';

UPDATE item_projeto
SET qtd_necessaria_liquida = 27.0, qtd_calculada_bruta = 27.0, qtd_embalagem_fechada = 27, margem_perda_pct = 0.0
WHERE id = 'item-pas-2' AND cenario_id = 'b0786118-9a21-46ca-8536-ec4be7a376c1';

-- 3. Inserção dos Itens Requisitados no Orçamento do Projeto (Banheiro Casa Pastoral)
INSERT INTO item_projeto (
  id, ambiente_id, material_id, cenario_id, qtd_necessaria_liquida, margem_perda_pct, qtd_calculada_bruta, qtd_embalagem_fechada, preco_unitario_estimado
) VALUES
  ('item-db-pas-te-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-te-sold-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 14.50),
  ('item-db-pas-te-red-50-3-4', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-te-red-50-25', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 18.90),
  ('item-db-pas-red-50-3-4', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-red-50-25', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 8.20),
  ('item-db-pas-cotovelo-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 11.50),
  ('item-db-pas-luva-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-luva-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 9.80),
  ('item-db-pas-reg-pvc-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-reg-pvc-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 48.00),
  ('item-db-pas-reg-gaveta-50-kit', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-reg-gaveta-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 135.00),
  ('item-db-pas-reg-pressao-3-4-kit', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-reg-pressao-3-4', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 95.00),
  ('item-db-pas-cotovelo-25', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-25', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 10.00, 0.00, 10.00, 10, 1.90),
  ('item-db-pas-cotovelo-azul-25-1-2', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-azul-25-1-2', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 10.00, 0.00, 10.00, 10, 7.90),
  ('item-db-pas-luva-azul-25-1-2', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-luva-azul-25-1-2', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 7.50),
  ('item-db-pas-te-25', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-te-25', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 5.00, 0.00, 5.00, 5, 2.80),
  ('item-db-pas-luva-25', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-luva-25', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 5.00, 0.00, 5.00, 5, 1.80),
  ('item-db-pas-te-esg-100-ligafacil', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-te-esg-100-ligafacil', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 38.00),
  ('item-db-pas-cotovelo-esg-100-90', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-esg-100-90', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 0.00, 4.00, 4, 8.50),
  ('item-db-pas-joelho-esg-100-45', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-esg-100-45', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 0.00, 4.00, 4, 9.20),
  ('item-db-pas-juncao-y-100-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-juncao-y-100-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 21.50),
  ('item-db-pas-cotovelo-esg-50-90', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-esg-50-90', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 4.80),
  ('item-db-pas-joelho-esg-50-45', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-esg-50-45', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 5.20),
  ('item-db-pas-juncao-y-50', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-juncao-y-50', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 11.80),
  ('item-db-pas-cotovelo-esg-40-90', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-esg-40-90', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 5.00, 0.00, 5.00, 5, 3.10),
  ('item-db-pas-joelho-esg-40-45', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-joelho-esg-40-45', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 5.00, 0.00, 5.00, 5, 3.50),
  ('item-db-pas-juncao-y-40', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-juncao-y-40', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 8.90),
  ('item-db-pas-caixa-ralo-100', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-caixa-ralo-100', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 32.00),
  ('item-db-pas-folha-serra', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-fer-folha-serra', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 12.00),
  ('item-db-pas-lixa-100', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-pin-lixa-100', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 4.00, 0.00, 4.00, 4, 2.50),
  ('item-db-pas-cola-pvc-pincel', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-hid-cola-pvc-pincel', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 18.90),
  ('item-db-pas-plastico-3x4', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-pin-plastico-3x4', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 14.00),
  ('item-db-pas-massa-corrida-lata', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-pin-massa-corrida-lata', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 78.00),
  ('item-db-pas-rolo-brasileirinho', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-pin-rolo-brasileirinho', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 28.00),
  ('item-db-pas-pincel-trincha', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-pin-pincel-trincha', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 2.00, 0.00, 2.00, 2, 9.50),
  ('item-db-pas-conduite-20m', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-ele-conduite-25mm', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 20.00, 0.00, 20.00, 20, 2.20),
  ('item-db-pas-caixa-luz-4x2', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-ele-caixa-luz-4x2', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 3.00, 0.00, 3.00, 3, 2.80),
  ('item-db-pas-grade-teto-laje', '59068f34-8688-4d30-a75f-cb9c14e2f17b', 'mat-est-grade-teto-laje', 'b0786118-9a21-46ca-8536-ec4be7a376c1', 1.00, 0.00, 1.00, 1, 35.00)
ON CONFLICT (id) DO UPDATE SET
  qtd_necessaria_liquida = EXCLUDED.qtd_necessaria_liquida,
  margem_perda_pct = EXCLUDED.margem_perda_pct,
  qtd_calculada_bruta = EXCLUDED.qtd_calculada_bruta,
  preco_unitario_estimado = EXCLUDED.preco_unitario_estimado;

COMMIT;
