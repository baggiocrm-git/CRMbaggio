-- Migration: Add more painting services (16.00 PINTURA - Continuation 2)
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
-- 16.00 PINTURA (Continuação 2)
('16.20', 'PINTURA', 'PINTURA LATEX ACRILICO EM FORRO DE GESSO', 'M2', 0.00, 51.71, 0.00, 25, 65.32, 78.93),
('16.21', 'PINTURA', 'PINTURA COM VERNIZ', 'M2', 0.00, 51.71, 0.00, 25, 65.32, 78.93),
('16.22', 'PINTURA', 'PINTURA FAIXA DE SEGURANÇA COR PADRAO D.E.R.', 'ML', 0.00, 34.03, 0.00, 25, 48.99, 68.04),
('16.23', 'PINTURA', 'PINTURA TUB C/ TINTA A BASE POLIURETANO', 'ML', 0.00, 64.77, 0.00, 25, 81.10, 97.17),
('16.24', 'PINTURA', 'REPINTURA TUB C/ESMALTE SINT ACABADO', 'ML', 0.00, 35.12, 0.00, 25, 46.01, 54.17),
('16.25', 'PINTURA', 'PINTURA C/PRIME ANTI-CORROS EM SUP METAL', 'M2', 0.00, 43.28, 0.00, 25, 64.77, 86.55),
('16.26', 'PINTURA', 'PINTURA C/ESMALTE SINT EM SUP METAL ACAB', 'M2', 0.00, 54.17, 0.00, 25, 67.50, 81.10),
('16.27', 'PINTURA', 'PINT C/PRIME ANTI-CORROS MAQ E EQ ACAB', 'M2', 0.00, 43.28, 0.00, 25, 64.77, 86.55),
('16.28', 'PINTURA', 'PINT C/ESMALTE SINT EM MAQ E EQUIP ACAB', 'M2', 0.00, 54.17, 0.00, 25, 67.50, 81.10),
('16.29', 'PINTURA', 'PINTURA C/ESMALTE SINT EM CALHAS ACABADO', 'ML', 0.00, 26.95, 0.00, 25, 33.49, 40.56)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
