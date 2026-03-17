-- Migration to add RDO (Relatório Diário de Obra) functionality
-- and link projects to client users

-- 1. Create RDOs table
CREATE TABLE IF NOT EXISTS rdos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  clima_manha TEXT,
  clima_tarde TEXT,
  mao_de_obra JSONB DEFAULT '[]'::jsonb, -- [{funcao: string, quantidade: number}]
  equipamentos JSONB DEFAULT '[]'::jsonb, -- [{nome: string, quantidade: number, status: string}]
  atividades TEXT,
  ocorrencias TEXT,
  fotos JSONB DEFAULT '[]'::jsonb, -- [string] (URLs)
  assinatura_responsavel TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add cliente_id to projetos to link a client user
-- This will be the UUID of the user in auth.users
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS cliente_id UUID;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rdos_projeto_id ON rdos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_rdos_data ON rdos(data);
CREATE INDEX IF NOT EXISTS idx_projetos_cliente_id ON projetos(cliente_id);
