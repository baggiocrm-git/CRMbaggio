-- Migration: Update Hidraulica items to match the new spreadsheet
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
('06.01', 'HIDRÁULICA', 'Lastro de areia', 'm3', 167.02, 160.25, 0.00, 25, 490.90, 654.53),
('06.02', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto branco 40mm', 'm', 44.33, 24.04, 0.00, 25, 102.55, 136.73),
('06.03', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto branco 50mm', 'm', 61.86, 33.31, 0.00, 25, 142.75, 190.34),
('06.04', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto branco 75mm', 'm', 91.14, 49.08, 0.00, 25, 210.33, 280.43),
('06.05', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto branco 100mm', 'm', 102.66, 55.09, 0.00, 25, 236.62, 315.49),
('06.06', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto branco 150mm', 'm', 159.51, 85.89, 0.00, 25, 368.10, 490.80),
('06.07', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto branco 200mm', 'm', 265.41, 145.22, 0.00, 25, 615.95, 821.27),
('06.08', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto vinilfort 150mm', 'm', 207.82, 85.89, 0.00, 25, 440.57, 587.43),
('06.09', 'HIDRÁULICA', 'Fornecimento e instalação de conexões pvc esgoto 40 a 100mm', 'pç', 70.11, 50.08, 0.00, 25, 180.28, 240.37),
('06.10', 'HIDRÁULICA', 'Fornecimento e instalação de conexões pvc esgoto 150 a 200mm', 'pç', 390.60, 65.10, 0.00, 25, 683.56, 911.41),
('06.11', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto série R 40mm', 'm', 45.07, 28.81, 0.00, 25, 110.81, 147.75),
('06.12', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto série R 50mm', 'm', 58.59, 40.06, 0.00, 25, 147.98, 197.30),
('06.13', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto série R 75mm', 'm', 75.12, 60.09, 0.00, 25, 202.81, 270.42),
('06.14', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto série R 100mm', 'm', 116.94, 67.60, 0.00, 25, 276.82, 369.09),
('06.15', 'HIDRÁULICA', 'Fornec, assent, tubo PVC esgoto série R 150mm', 'm', 249.39, 100.15, 0.00, 25, 524.31, 699.08),
('06.16', 'HIDRÁULICA', 'Fornecimento e instalação de grelha alumínio abre/fecha 100mm', 'pç', 63.86, 50.08, 0.00, 25, 170.91, 227.87),
('06.17', 'HIDRÁULICA', 'Fornecimento e instalação de grelha alumínio abre/fecha 150mm', 'pç', 162.75, 62.60, 0.00, 25, 338.02, 450.70),
('06.18', 'HIDRÁULICA', 'Fornecimento e instalação de conexões pvc esgoto série R 40 a 75mm', 'pç', 115.18, 50.08, 0.00, 25, 247.88, 330.51),
('06.19', 'HIDRÁULICA', 'Fornecimento e instalação de conexões pvc esgoto série R 100 a 150mm', 'pç', 423.15, 65.10, 0.00, 25, 732.38, 976.51),
('06.20', 'HIDRÁULICA', 'Corpo caixa sifonada 150x185x75', 'pç', 115.18, 75.12, 0.00, 25, 285.44, 380.59),
('06.21', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões pvc sold. marrom 25mm', 'm', 33.81, 73.88, 0.00, 25, 161.53, 215.38),
('06.22', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões pvc sold. marrom 32mm', 'm', 70.87, 83.89, 0.00, 25, 232.14, 309.52),
('06.23', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões pvc sold. marrom 40mm', 'm', 106.43, 92.64, 0.00, 25, 298.60, 398.14),
('06.24', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões pvc sold. marrom 50mm', 'm', 100.15, 110.17, 0.00, 25, 315.49, 420.65),
('06.25', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões pvc sold. marrom 60mm', 'm', 201.81, 130.20, 0.00, 25, 498.02, 664.03),
('06.26', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões cpvc sold. aquaterm 22mm', 'm', 105.16, 87.64, 0.00, 25, 289.20, 385.60),
('06.27', 'HIDRÁULICA', 'Fornec, assent, tubos e conexões cpvc sold. aquaterm 28mm', 'm', 169.02, 120.19, 0.00, 25, 433.81, 578.42),
('06.28', 'HIDRÁULICA', 'Fornec, assent, tubo concreto simples - 300mm', 'm', 170.26, 77.62, 0.00, 25, 371.82, 495.77),
('06.29', 'HIDRÁULICA', 'Fornec, assent, tubo concreto simples PS1 - 400mm', 'm', 225.35, 77.62, 0.00, 25, 454.45, 605.94),
('06.30', 'HIDRÁULICA', 'Fornec, assent, tubo concreto armado PA1 - 400mm', 'm', 375.58, 77.62, 0.00, 25, 679.80, 906.40),
('06.31', 'HIDRÁULICA', 'Fornec, assent, tubo concreto simples PS1 - 600mm', 'm', 450.70, 150.23, 0.00, 25, 901.39, 1201.86),
('06.32', 'HIDRÁULICA', 'Fornec, assent, tubo concreto armado PA1 - 600mm', 'm', 656.01, 150.23, 0.00, 25, 1209.37, 1612.49),
('06.33', 'HIDRÁULICA', 'Fornec, assent, tubo concreto armado PA1 - 800mm', 'm', 1089.18, 200.31, 0.00, 25, 1934.24, 2578.99),
('06.34', 'HIDRÁULICA', 'Fornec, assent, tubo concreto armado PA1 - 1000mm', 'm', 1690.11, 300.46, 0.00, 25, 2985.87, 3981.15),
('06.35', 'HIDRÁULICA', 'Fornec, assent, tubo concreto armado PA1 - 1200mm', 'm', 2533.92, 450.70, 0.00, 25, 4476.92, 5969.23),
('06.36', 'HIDRÁULICA', 'Fornec, assent, tubo concreto armado PA1 - 1500mm', 'm', 3568.02, 651.01, 0.00, 25, 6328.53, 8438.04),
('06.37', 'HIDRÁULICA', 'Fornec. e assent. de tampão de ferro fundido p/ carga até 30 tn.', 'pç', 1061.64, 698.58, 0.00, 25, 2640.33, 3520.44)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
