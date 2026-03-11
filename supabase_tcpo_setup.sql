-- ===============================================================
-- TCPO (Pini) Catalog and Budgeting System Setup
-- ===============================================================

-- 1. Enable pg_trgm for fast partial search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. TCPO Catalog Table
CREATE TABLE IF NOT EXISTS tcpo_itens (
  id TEXT PRIMARY KEY,          -- e.g., "04.01.001"
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  custo_mo NUMERIC DEFAULT 0,   -- Mão de obra
  custo_mat NUMERIC DEFAULT 0,  -- Material
  custo_eq NUMERIC DEFAULT 0,   -- Equipamento
  bdi_padrao NUMERIC DEFAULT 25, -- BDI padrão (%)
  composicao JSONB DEFAULT '[]'::jsonb, -- Array of inputs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budgets Table
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  total_mo NUMERIC DEFAULT 0,
  total_mat NUMERIC DEFAULT 0,
  total_eq NUMERIC DEFAULT 0,
  total_geral NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budget Items Table
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  tcpo_id TEXT REFERENCES tcpo_itens(id),
  descricao_personalizada TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  unidade TEXT,
  custo_unit_mo NUMERIC DEFAULT 0,
  custo_unit_mat NUMERIC DEFAULT 0,
  custo_unit_eq NUMERIC DEFAULT 0,
  bdi NUMERIC DEFAULT 25,
  observacao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix: Ensure tcpo_id exists if table was created previously without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamento_itens' AND column_name='tcpo_id') THEN
    ALTER TABLE orcamento_itens ADD COLUMN tcpo_id TEXT REFERENCES tcpo_itens(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamento_itens' AND column_name='descricao_personalizada') THEN
    ALTER TABLE orcamento_itens ADD COLUMN descricao_personalizada TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamento_itens' AND column_name='custo_unit_mo') THEN
    ALTER TABLE orcamento_itens ADD COLUMN custo_unit_mo NUMERIC DEFAULT 0;
    ALTER TABLE orcamento_itens ADD COLUMN custo_unit_mat NUMERIC DEFAULT 0;
    ALTER TABLE orcamento_itens ADD COLUMN custo_unit_eq NUMERIC DEFAULT 0;
  END IF;
END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tcpo_descricao_trgm ON tcpo_itens USING gin (descricao gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tcpo_categoria ON tcpo_itens (categoria);

-- 6. Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tcpo_itens_updated_at BEFORE UPDATE ON tcpo_itens FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Sample TCPO Data
INSERT INTO tcpo_itens (id, categoria, descricao, unidade, custo_mo, custo_mat, custo_eq, bdi_padrao)
VALUES 
('01.01.001', 'Serviços Preliminares', 'Instalação de canteiro de obras', 'un', 1500.00, 3000.00, 500.00, 25),
('01.01.002', 'Serviços Preliminares', 'Locação de obra', 'm2', 5.50, 2.20, 0.00, 25),
('02.01.001', 'Movimentação de Terra', 'Escavação manual de valas', 'm3', 45.00, 0.00, 0.00, 25),
('02.01.002', 'Movimentação de Terra', 'Aterro manual apiloado', 'm3', 25.00, 15.00, 0.00, 25),
('03.01.001', 'Infraestrutura', 'Concreto simples para lastro e=5cm', 'm2', 12.00, 35.00, 2.00, 25),
('03.01.002', 'Infraestrutura', 'Sapata isolada em concreto armado 20MPa', 'm3', 180.00, 450.00, 15.00, 25),
('04.01.001', 'Estrutura', 'Laje maciça em concreto armado 25MPa', 'm3', 220.00, 580.00, 25.00, 25),
('04.01.002', 'Estrutura', 'Viga em concreto armado 25MPa', 'm3', 250.00, 620.00, 30.00, 25),
('04.01.003', 'Estrutura', 'Pilar em concreto armado 25MPa', 'm3', 280.00, 650.00, 35.00, 25),
('05.01.001', 'Alvenaria', 'Alvenaria de bloco cerâmico 14x19x29cm', 'm2', 35.00, 42.00, 0.00, 25),
('05.01.002', 'Alvenaria', 'Alvenaria de tijolo comum', 'm2', 48.00, 55.00, 0.00, 25),
('06.01.001', 'Revestimento', 'Chapisco de traço 1:3', 'm2', 4.50, 3.20, 0.00, 25),
('06.01.002', 'Revestimento', 'Emboço de traço 1:2:9', 'm2', 12.50, 8.40, 0.00, 25),
('06.01.003', 'Revestimento', 'Reboco de traço 1:2', 'm2', 15.00, 10.50, 0.00, 25),
('07.01.001', 'Pisos', 'Contrapiso em argamassa e=3cm', 'm2', 18.00, 22.00, 0.00, 25),
('07.01.002', 'Pisos', 'Piso cerâmico PEI-4', 'm2', 25.00, 45.00, 0.00, 25),
('08.01.001', 'Pintura', 'Pintura látex PVA duas demãos', 'm2', 12.00, 8.50, 0.00, 25),
('08.01.002', 'Pintura', 'Pintura acrílica sobre massa', 'm2', 15.00, 12.00, 0.00, 25)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mo = EXCLUDED.custo_mo,
  custo_mat = EXCLUDED.custo_mat,
  custo_eq = EXCLUDED.custo_eq,
  bdi_padrao = EXCLUDED.bdi_padrao;

-- 8. View for Analytical Budget
CREATE OR REPLACE VIEW vw_orcamento_analitico AS
SELECT 
  oi.id,
  oi.orcamento_id,
  oi.tcpo_id,
  COALESCE(oi.descricao_personalizada, t.descricao) as descricao,
  oi.quantidade,
  COALESCE(oi.unidade, t.unidade) as unidade,
  oi.custo_unit_mo,
  oi.custo_unit_mat,
  oi.custo_unit_eq,
  (oi.custo_unit_mo + oi.custo_unit_mat + oi.custo_unit_eq) as custo_unit_total,
  oi.bdi,
  ((oi.custo_unit_mo + oi.custo_unit_mat + oi.custo_unit_eq) * (1 + oi.bdi/100)) as preco_unit_com_bdi,
  (oi.quantidade * (oi.custo_unit_mo + oi.custo_unit_mat + oi.custo_unit_eq)) as subtotal_custo,
  (oi.quantidade * (oi.custo_unit_mo + oi.custo_unit_mat + oi.custo_unit_eq) * (1 + oi.bdi/100)) as subtotal_preco,
  oi.ordem
FROM orcamento_itens oi
LEFT JOIN tcpo_itens t ON oi.tcpo_id = t.id;
