-- Add Saturday and Sunday/Holiday price columns to tcpo_insumos
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_insumos' AND column_name='preco_sabado') THEN
    ALTER TABLE tcpo_insumos ADD COLUMN preco_sabado NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_insumos' AND column_name='preco_domingo_feriado') THEN
    ALTER TABLE tcpo_insumos ADD COLUMN preco_domingo_feriado NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Insert the new labor items with their respective prices
INSERT INTO tcpo_insumos (id, descricao, unidade, preco_unitario, preco_sabado, preco_domingo_feriado, tipo)
VALUES 
('11.01', 'Mão de obra oficial', 'h', 73.08, 109.62, 146.16, 'mo'),
('11.02', 'Mão de obra ajudante', 'h', 52.20, 78.30, 104.40, 'mo'),
('11.03', 'Mão de obra encarregado', 'h', 125.28, 187.92, 250.56, 'mo'),
('11.04', 'Mão de obra mestre de obras', 'h', 167.04, 250.56, 334.08, 'mo'),
('11.05', 'Mão de obra engenheiro', 'h', 250.56, 375.84, 501.12, 'mo')
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  preco_unitario = EXCLUDED.preco_unitario,
  preco_sabado = EXCLUDED.preco_sabado,
  preco_domingo_feriado = EXCLUDED.preco_domingo_feriado,
  tipo = EXCLUDED.tipo;
