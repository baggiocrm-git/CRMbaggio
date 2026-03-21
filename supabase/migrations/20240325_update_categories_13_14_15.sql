-- Migration: Update categories 13, 14, and 15 to match the new spreadsheet
-- Categories: 13.00 ARQUITETURA, 14.00 MOBILIZAÇÃO, 15.00 OUTROS SERVIÇOS

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
-- 13.00 ARQUITETURA
('13.01', 'ARQUITETURA', 'Projeto Arquitetônico', 'm2', 0.00, 155.24, 0.00, 25, 232.86, 310.48),
('13.02', 'ARQUITETURA', 'Projeto Estrutural em concreto armado', 'm2', 0.00, 87.64, 0.00, 25, 131.45, 175.27),
('13.03', 'ARQUITETURA', 'Projeto Prevenção Contra Incêndios', 'm2', 0.00, 75.12, 0.00, 25, 112.67, 150.23),
('13.04', 'ARQUITETURA', 'Projeto Hidráulico Sanitário', 'm2', 0.00, 75.12, 0.00, 25, 112.67, 150.23),
('13.05', 'ARQUITETURA', 'Projeto Elétrico / Telefônico / Lógica / SPDA', 'm2', 0.00, 87.64, 0.00, 25, 131.45, 175.27),

-- 14.00 MOBILIZAÇÃO
('14.01', 'MOBILIZAÇÃO', 'Escritório Curitiba (Un = Preço Homem por dia)', 'Un', 0.00, 776.20, 0.00, 25, 1164.30, 1552.40),
('14.02', 'MOBILIZAÇÃO', 'Regional Passo fundo (Un = Preço Homem por dia)', 'Un', 0.00, 1026.59, 0.00, 25, 1539.88, 2053.17),
('14.03', 'MOBILIZAÇÃO', 'Planta fabril Ponta Grossa (Un = Preço Homem por dia)', 'Un', 0.00, 625.97, 0.00, 25, 938.95, 1251.94),

-- 15.00 OUTROS SERVIÇOS
('15.01', 'OUTROS', 'Reparos em calçadas de concreto', 'm2', 67.60, 95.15, 0.00, 25, 244.13, 325.50),
('15.02', 'OUTROS', 'Reparos em escadas de granito e cerâmica', 'm2', 195.30, 195.30, 0.00, 25, 585.91, 781.21),
('15.03', 'OUTROS', 'Isolamento de área em tapume + lona plástica', 'm2', 82.63, 111.67, 0.00, 25, 291.45, 388.60),
('15.04', 'OUTROS', 'Isolamento com lona forte', 'm2', 42.57, 22.53, 0.00, 25, 97.65, 130.20),
('15.05', 'OUTROS', 'Reposição de grama', 'm2', 17.53, 17.53, 0.00, 25, 52.58, 70.11),
('15.06', 'OUTROS', 'Terra preta sobre grama replantada', 'm3', 180.28, 180.28, 0.00, 25, 540.84, 721.11),
('15.07', 'OUTROS', 'Eletroduto corrugado NBR 15715 6"', 'm', 94.15, 20.03, 0.00, 25, 171.26, 228.35),
('15.08', 'OUTROS', 'Eletroduto corrugado NBR 15715 4"', 'm', 57.59, 14.52, 0.00, 25, 108.17, 144.22),
('15.09', 'OUTROS', 'Eletroduto corrugado NBR 15715 2"', 'm', 42.57, 10.02, 0.00, 25, 52.58, 105.16),
('15.10', 'OUTROS', 'Envelope de concreto para proteção de tubos enterrados', 'm3', 813.76, 563.37, 0.00, 25, 2065.69, 2754.26),
('15.11', 'OUTROS', 'Locação de caminhão munck cap. 13 ton', 'h', 0.00, 450.70, 0.00, 25, 676.05, 901.39),
('15.12', 'OUTROS', 'Locação Guindaste MD30 cap. 25 ton.', 'dia', 0.00, 7511.61, 0.00, 25, 11267.42, 15023.22),
('15.13', 'OUTROS', 'Locação Guindaste QY50K cap. 50 ton.', 'dia', 0.00, 12519.35, 0.00, 25, 18779.03, 25038.70),
('15.14', 'OUTROS', 'Locação Guindaste QY60K cap. 50 ton.', 'dia', 0.00, 14021.67, 0.00, 25, 21032.51, 28043.35),
('15.15', 'OUTROS', 'Locação Guindaste QY130K cap. 130 ton.', 'dia', 0.00, 35054.19, 0.00, 25, 52581.28, 70108.37),
('15.16', 'OUTROS', 'Locação de empilhadeira cap. 2,5ton.', 'dia', 0.00, 5007.74, 0.00, 25, 7511.61, 10015.48),
('15.17', 'OUTROS', 'Locação de container 2,45x6,00 p/ depósito de obra', 'mês', 0.00, 2816.85, 0.00, 25, 4225.28, 5633.71),
('15.18', 'OUTROS', 'Locação de plataforma tipo tesoura h=8m', 'dia', 0.00, 870.91, 0.00, 25, 1306.37, 1741.82),
('15.19', 'OUTROS', 'Locação de plataforma tipo telescópica h=11,00m', 'dia', 0.00, 1741.82, 0.00, 25, 2612.73, 3483.65),
('15.20', 'OUTROS', 'Frete para transporte de equipamento leve até 130km', 'un', 0.00, 3483.65, 0.00, 25, 5225.47, 6967.29),
('15.21', 'OUTROS', 'Cura química para concreto', 'm2', 9.67, 9.67, 0.00, 25, 29.00, 38.67),
('15.22', 'OUTROS', 'Aplcação de mastique em juntas de piso 10x10mm', 'm', 80.12, 80.12, 0.00, 25, 240.37, 320.50),
('15.23', 'OUTROS', 'Tratamento de labio polimérico em juntas de piso de concreto', 'm', 162.75, 137.71, 0.00, 25, 450.70, 600.93),
('15.24', 'OUTROS', 'Alisamento mecânico em piso concreto (min. 34m²)', 'm2', 0.00, 37.56, 0.00, 25, 56.34, 75.12),
('15.25', 'OUTROS', 'Conserto de piso com argamassa epóxi e=0,4 a 1cm (RBE top4 + polifix RBE)', 'm2', 287.40, 287.40, 0.00, 25, 862.20, 1149.60),
('15.26', 'OUTROS', 'Conserto de trincas no piso com epóxi fluido (adepox AF)', 'm', 43.55, 43.55, 0.00, 25, 130.64, 174.18),
('15.27', 'OUTROS', 'Colmatação de microfissuras em piso de concreto (adepox colmatação)', 'm2', 39.19, 39.19, 0.00, 25, 117.57, 156.76),
('15.28', 'OUTROS', 'Labio polimérico com argamassa epóxi e selante dureza 80 (TLX 70 + poxcolor primer + EPX80)', 'm', 228.61, 228.61, 0.00, 25, 685.84, 914.46),
('15.29', 'OUTROS', 'Substituição de selante poliuretano por selante epóxi semi rígido (EPX80)', 'm', 71.85, 71.85, 0.00, 25, 215.55, 287.40),
('15.30', 'OUTROS', 'Estaca hélice continua monitorada D=40cm cap 150KN', 'm', 238.70, 328.22, 0.00, 25, 850.39, 1133.85)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
