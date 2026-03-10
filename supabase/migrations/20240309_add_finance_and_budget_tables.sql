-- Migration to add missing finance and budget tables
-- This ensures the app has all tables required by the current frontend implementation

-- 1. Contas a Receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id TEXT PRIMARY KEY, -- Using custom ID format like 202403-0001
  cliente TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  valor NUMERIC(15, 2) NOT NULL DEFAULT 0,
  valor_recebido NUMERIC(15, 2) NOT NULL DEFAULT 0,
  situacao TEXT NOT NULL DEFAULT 'Aberto' CHECK (situacao IN ('Aberto', 'Recebido', 'Em andamento')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Contas a Pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id TEXT PRIMARY KEY, -- Using custom ID format like 202403-0001
  fornecedor TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor NUMERIC(15, 2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(15, 2) NOT NULL DEFAULT 0,
  situacao TEXT NOT NULL DEFAULT 'Aberto' CHECK (situacao IN ('Aberto', 'Pago', 'Em andamento')),
  projeto_id UUID REFERENCES projetos(id),
  categoria_custo TEXT,
  etapa_obra TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Itens do Orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  codigo TEXT, -- Código TCPO/PINI
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  quantidade NUMERIC(15, 3) NOT NULL DEFAULT 0,
  preco_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total NUMERIC(15, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  categoria TEXT, -- e.g., Material, Mão de Obra, Equipamento
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sample data for Contas a Receber
INSERT INTO contas_receber (id, cliente, descricao, data_vencimento, valor, situacao)
VALUES 
('202403-0001', 'Acme Construções', 'Parcela 01/03 - Obra Skyline', '2024-03-15', 50000.00, 'Aberto'),
('202403-0002', 'Design Partners LLC', 'Consultoria Técnica', '2024-03-20', 12000.00, 'Em andamento');

-- Sample data for Contas a Pagar
INSERT INTO contas_pagar (id, fornecedor, descricao, data_vencimento, valor, situacao)
VALUES 
('202403-0001', 'BuildRight Suprimentos', 'Cimento e Agregados', '2024-03-10', 8500.00, 'Aberto'),
('202403-0002', 'Steel & Iron Co.', 'Vigas de Aço', '2024-03-12', 15000.00, 'Aberto');
