-- Add Saturday and Sunday/Holiday cost columns to tcpo_itens
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_itens' AND column_name='custo_sabado') THEN
    ALTER TABLE tcpo_itens ADD COLUMN custo_sabado NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_itens' AND column_name='custo_domingo_feriado') THEN
    ALTER TABLE tcpo_itens ADD COLUMN custo_domingo_feriado NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Update existing items with calculated values (50% and 100% extra on total)
UPDATE tcpo_itens 
SET 
  custo_sabado = (custo_mo + custo_mat + custo_eq) * 1.5,
  custo_domingo_feriado = (custo_mo + custo_mat + custo_eq) * 2;
