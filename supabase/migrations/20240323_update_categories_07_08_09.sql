-- Migration: Update categories 07, 08, and 09 to match the new spreadsheet
-- Categories: 07.00 FECHAMENTO EXTERNO, 08.00 VIDRAÇARIA, 09.00 COBERTURA

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
-- 07.00 FECHAMENTO EXTERNO
('07.01', 'FECHAMENTO EXTERNO', 'Alambrado tela galvanizada malha 2"x2" fio 10 galvanizado', 'm', 147.73, 47.57, 0.00, 25, 292.95, 390.60),
('07.02', 'FECHAMENTO EXTERNO', 'Alambrado tela galvanizada malha 2"x2" fio 10 plastificado', 'm', 195.30, 35.05, 0.00, 25, 345.53, 460.71),
('07.03', 'FECHAMENTO EXTERNO', 'Arame farpado para alambrado', 'm', 7.51, 7.51, 0.00, 25, 22.53, 30.05),
('07.04', 'FECHAMENTO EXTERNO', 'Arame liso galvanizado fio 10', 'm', 7.51, 8.77, 0.00, 25, 24.43, 32.57),
('07.05', 'FECHAMENTO EXTERNO', 'Arame liso plastificado fio 10', 'm', 8.77, 8.77, 0.00, 25, 26.32, 35.10),
('07.06', 'FECHAMENTO EXTERNO', 'Postes pré fabricados de concreto p/ alambrado curvo', 'pç', 115.18, 147.73, 0.00, 25, 394.36, 525.81),
('07.07', 'FECHAMENTO EXTERNO', 'Postes pré fabricados de concreto p/ alambrado', 'pç', 98.02, 135.21, 0.00, 25, 349.85, 466.46),

-- 08.00 VIDRAÇARIA
('08.01', 'VIDRAÇARIA', 'Vidro liso e=4mm colocado laminado', 'm2', 976.51, 100.15, 0.00, 25, 1615.00, 2153.33),
('08.02', 'VIDRAÇARIA', 'Vidro liso e=4mm colocado comum cristal', 'm2', 115.18, 100.15, 0.00, 25, 323.00, 430.67),
('08.03', 'VIDRAÇARIA', 'Vidro liso e=6mm colocado laminado', 'm2', 1051.63, 100.15, 0.00, 25, 1727.67, 2303.56),
('08.04', 'VIDRAÇARIA', 'Vidro liso e=6mm colocado comum cristal', 'm2', 200.31, 100.15, 0.00, 25, 450.70, 600.93),
('08.05', 'VIDRAÇARIA', 'Vidro aramado colocado', 'm2', 363.06, 100.15, 0.00, 25, 694.82, 926.43),
('08.06', 'VIDRAÇARIA', 'Instalação de pelicula protetora transparente em vidros', 'm2', 181.54, 200.31, 0.00, 25, 572.78, 763.70),
('08.07', 'VIDRAÇARIA', 'Instalação de pelicula protetora colorida em vidros', 'm2', 217.84, 200.31, 0.00, 25, 627.22, 836.29),

-- 09.00 COBERTURA
('09.01', 'COBERTURA', 'Execução de estrutura metálica para cobertura vão até 10m', 'm2', 300.46, 375.58, 0.00, 25, 1014.07, 1352.09),
('09.02', 'COBERTURA', 'Execução de estrutura metálica para fechamento lateral até 2m', 'm2', 275.43, 325.50, 0.00, 25, 901.39, 1201.86),
('09.03', 'COBERTURA', 'Execução de madeira para cobertura', 'm2', 152.41, 161.12, 0.00, 25, 470.29, 627.06),
('09.04', 'COBERTURA', 'Fornecimento e instalação de telha TPR 40 trapezoidal galvalume 0,5mm', 'm2', 175.27, 100.15, 0.00, 25, 413.14, 550.85),
('09.05', 'COBERTURA', 'Fornecimento e instalação de telha de concreto tradicional', 'm2', 165.47, 87.09, 0.00, 25, 378.85, 505.13),
('09.06', 'COBERTURA', 'Feltro FSR 32 isolamento térmico / acústico', 'm2', 107.67, 62.60, 0.00, 25, 255.39, 340.53),
('09.07', 'COBERTURA', 'Calhas em chapa galalume corte 40cm', 'm', 300.46, 300.46, 0.00, 25, 901.39, 1201.86),
('09.08', 'COBERTURA', 'Rufos em chapa galvalume corte 25cm', 'm', 187.79, 187.79, 0.00, 25, 563.37, 751.16),
('09.09', 'COBERTURA', 'Remoção de telha de aluminio zipada', 'm2', 0.00, 450.70, 0.00, 25, 676.05, 901.39),
('09.10', 'COBERTURA', 'Limpeza de calha', 'm', 18.16, 40.06, 0.00, 25, 87.33, 116.44)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
