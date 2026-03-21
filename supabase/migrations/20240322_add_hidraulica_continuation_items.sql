-- Migration: Add continuation of Hidraulica items (06.38 to 06.55)
-- Category: 06.00 HIDRÁULICA

-- Ensure columns exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_itens' AND column_name='custo_sabado') THEN
    ALTER TABLE tcpo_itens ADD COLUMN custo_sabado NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_itens' AND column_name='custo_domingo_feriado') THEN
    ALTER TABLE tcpo_itens ADD COLUMN custo_domingo_feriado NUMERIC DEFAULT 0;
  END IF;
END $$;

INSERT INTO tcpo_itens (id, categoria, descricao, unidade, custo_mat, custo_mo, custo_eq, bdi_padrao, custo_sabado, custo_domingo_feriado)
VALUES 
('06.38', 'HIDRÁULICA', 'Execução de caixa de inspeção em alvenaria 3/4" revestida com argamassa internamente e tampa em concreto e=5cm dimensões 60x60x60cm', 'un', 846.31, 1715.15, 0.00, 25, 3842.19, 5122.92),
('06.39', 'HIDRÁULICA', 'Execução de caixa de inspeção em alvenaria 3/4" revestida com argamassa internamente e tampa em concreto e=5cm dimensões 80x80x60cm', 'un', 1126.74, 2298.55, 0.00, 25, 5137.94, 6850.59),
('06.40', 'HIDRÁULICA', 'Fornec. e aplic. de brita 3 e 4', 'm3', 180.28, 97.65, 0.00, 25, 416.89, 555.86),
('06.41', 'HIDRÁULICA', 'Fornec. assent. berço met. cantoneira para tampa fºfº', 'm', 60.09, 82.63, 0.00, 25, 214.08, 285.44),
('06.42', 'HIDRÁULICA', 'Reparo civil de fundo de caixas de passagem de esgoto', 'pç', 651.01, 651.01, 0.00, 25, 1953.02, 2604.03),
('06.43', 'HIDRÁULICA', 'Fornecimento e instalação de lavatório Deca monte carlo branco gelo cód. L81.17 com coluna suspensa CS.1.17', 'pç', 1101.70, 250.39, 0.00, 25, 2028.14, 2704.18),
('06.44', 'HIDRÁULICA', 'Fornecimento e instalação de bacia sanitária convencional Deca monte carlo branco gelo', 'pç', 1006.56, 250.39, 0.00, 25, 1885.41, 2513.89),
('06.45', 'HIDRÁULICA', 'Fornecimento e instalação de bacia sanitária Deca monte carlo branco gelo p/ caixa acoplada', 'pç', 1372.12, 250.39, 0.00, 25, 2433.76, 3245.02),
('06.46', 'HIDRÁULICA', 'Fornecimento e instalação de caixa acoplada para bacia sanitária Deca monte carlo branco gelo', 'pç', 846.31, 250.39, 0.00, 25, 1645.04, 2193.39),
('06.47', 'HIDRÁULICA', 'Fornecimento e instalação de torneira p/ lavatório de mesa Decalux cod. 1180C', 'pç', 4206.50, 250.39, 0.00, 25, 6685.33, 8913.78),
('06.48', 'HIDRÁULICA', 'Fornecimento e instalação de assento plástico Deca Monte Carlo gelo AP80', 'pç', 563.37, 62.60, 0.00, 25, 938.95, 1251.94),
('06.49', 'HIDRÁULICA', 'Fornecimento e instalação de Mictório de louça Deca M712', 'pç', 2316.08, 250.39, 0.00, 25, 3849.70, 5132.93),
('06.50', 'HIDRÁULICA', 'Fornecimento e instalação de valvula p/ Mictório decalux com sensor', 'pç', 4957.66, 250.39, 0.00, 25, 7812.08, 10416.10),
('06.51', 'HIDRÁULICA', 'Fornecimento e instalação de saboneteira docolmatic', 'pç', 1001.55, 250.39, 0.00, 25, 1877.90, 2503.87),
('06.52', 'HIDRÁULICA', 'Fornecimento e instalação de ligação flexível 40cm Deca cod. 4606.C.040', 'pç', 175.27, 125.19, 0.00, 25, 450.70, 600.93),
('06.53', 'HIDRÁULICA', 'Fornecimento e instalação de sifão plástico flexível cromado', 'pç', 90.14, 62.60, 0.00, 25, 229.10, 305.47),
('06.54', 'HIDRÁULICA', 'Parafusos para fixação de lavatório Deca SP.13.01', 'pç', 55.09, 0.00, 0.00, 25, 82.63, 110.17),
('06.55', 'HIDRÁULICA', 'Fornecimento e instalação de tampo granito juparaná clássico e=2cm', 'm2', 2253.48, 500.77, 0.00, 25, 4131.39, 5508.52)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
