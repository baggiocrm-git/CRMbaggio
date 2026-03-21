-- Migration: Add painting services (16.00 PINTURA)
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
-- 16.00 PINTURA
('16.01', 'PINTURA', 'PINTURA DE FAIXAS DEMARCATORIAS EPOXI', 'ML', 0.00, 32.66, 0.00, 25, 41.91, 50.08),
('16.02', 'PINTURA', 'REPARO DE TRINCAS', 'ML', 0.00, 34.03, 0.00, 25, 43.28, 51.45),
('16.03', 'PINTURA', 'PINTURA DE TAMPA UTILIDADES', 'Und.', 0.00, 54.43, 0.00, 25, 76.20, 100.70),
('16.04', 'PINTURA', 'IMPERMEABILIZAÇÃO - VEDAPREN OU SIMILAR', 'M2', 0.00, 133.36, 0.00, 25, 172.83, 280.61),
('16.05', 'PINTURA', 'PINTURAS DE DUTOS DE AR CONDICIONADO', 'M2', 0.00, 40.56, 0.00, 25, 50.90, 60.70),
('16.06', 'PINTURA', 'APLICAÇÃO DE MASSA CORRIDA ACRILICA', 'M2', 0.00, 30.22, 0.00, 25, 37.84, 45.46),
('16.07', 'PINTURA', 'APLICAÇÃO DE MASSA CORRIDA PVA', 'M2', 0.00, 26.95, 0.00, 25, 33.75, 40.56),
('16.08', 'PINTURA', 'PINTURA DE LATEX ACRILICO EM PAREDES / PISOS', 'M2', 0.00, 46.27, 0.00, 25, 58.53, 70.76),
('16.09', 'PINTURA', 'PINTURA DE PISO EM TINTA EPOXI', 'M2', 0.00, 182.35, 0.00, 25, 217.73, 247.40)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
