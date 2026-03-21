-- Migration: Add more painting services (16.00 PINTURA - Continuation)
-- Category: 16.00 PINTURA

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
-- 16.00 PINTURA (Continuação)
('16.10', 'PINTURA', 'PINTURA DE SUPERFICIE C/ ESMALTE SINT', 'M2', 0.00, 51.71, 0.00, 25, 65.32, 78.93),
('16.11', 'PINTURA', 'PINTURA DE TUBULAÇÕES ATE 3"', 'ML', 0.00, 32.66, 0.00, 25, 43.55, 51.71),
('16.12', 'PINTURA', 'PINTURA DE TUBULAÇÕES ACIMA DE 3"', 'ML', 0.00, 40.56, 0.00, 25, 51.45, 59.33),
('16.13', 'PINTURA', 'PINTURA ESMALTE SINT PADR ZEBRADO(FAIXA)', 'ML', 0.00, 21.51, 0.00, 25, 26.95, 32.40),
('16.14', 'PINTURA', 'PINT C/LATEX ACR/RET DE MASSA FORRO PROD', 'M2', 0.00, 57.15, 0.00, 25, 78.93, 95.26),
('16.15', 'PINTURA', 'APLICAÇÃO DE GRAFIATO', 'M2', 0.00, 95.26, 0.00, 25, 119.75, 144.24),
('16.16', 'PINTURA', 'PINTURA DE GRAMADOS (CAMPO DE FUTEBOL)', 'ML', 0.00, 20.42, 0.00, 25, 25.87, 30.76),
('16.17', 'PINTURA', 'DEMARCAÇÃO DE EXTINTOR C/ ESMALTE SINT.', 'PÇ', 0.00, 92.53, 0.00, 25, 136.08, 179.63),
('16.18', 'PINTURA', 'PINTURA EM TINTA ADEPOXI', 'M2', 0.00, 84.37, 0.00, 25, 125.19, 163.30),
('16.19', 'PINTURA', 'PINTURA LATEX ACRILICO DIVISORIA GESSO', 'M2', 0.00, 46.27, 0.00, 25, 58.53, 70.76)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
