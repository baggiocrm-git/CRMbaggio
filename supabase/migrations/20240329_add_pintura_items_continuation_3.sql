-- Migration: Add more painting services (16.00 PINTURA - Continuation 3)
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
-- 16.00 PINTURA (Continuação 3)
('16.30', 'PINTURA', 'REPINTURA DE GUIAS C/LATEX ACR ACABADO', 'ML', 0.00, 14.70, 0.00, 25, 18.51, 22.32),
('16.31', 'PINTURA', 'PINT CALHA C/GALV+TINTA ESM SINT ACAB', 'ML', 0.00, 40.56, 0.00, 25, 50.90, 62.05),
('16.32', 'PINTURA', 'PINT SINALIZ HORIZ COR TINTA PADRAO DER ACAB', 'ML', 0.00, 19.60, 0.00, 25, 24.23, 29.39),
('16.33', 'PINTURA', 'MAO DE OBRA ASSISTENTE', 'H', 0.00, 65.10, 0.00, 25, 97.65, 130.20),
('16.34', 'PINTURA', 'MAO DE OBRA PINTOR', 'H', 0.00, 90.14, 0.00, 25, 135.21, 180.28)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
