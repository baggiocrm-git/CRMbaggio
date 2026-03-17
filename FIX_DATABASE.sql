-- =====================================================================
-- INSTRUÇÕES IMPORTANTES:
-- 1. Copie TODO o código abaixo.
-- 2. Vá para o seu Dashboard do Supabase (https://app.supabase.com/).
-- 3. Selecione o seu projeto.
-- 4. Clique em "SQL Editor" no menu lateral esquerdo.
-- 5. Clique em "+ New query".
-- 6. Cole o código e clique no botão "Run" (ou pressione Cmd/Ctrl + Enter).
-- =====================================================================

-- 1. Criar a tabela de RDOs (Relatório Diário de Obra) se não existir
CREATE TABLE IF NOT EXISTS rdos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  clima_manha TEXT,
  clima_tarde TEXT,
  mao_de_obra JSONB DEFAULT '[]'::jsonb,
  equipamentos JSONB DEFAULT '[]'::jsonb,
  atividades TEXT,
  ocorrencias TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  assinatura_responsavel TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar a coluna cliente_id na tabela projetos se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projetos' AND column_name='cliente_id') THEN
    ALTER TABLE projetos ADD COLUMN cliente_id UUID;
  END IF;
END $$;

-- 3. Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_rdos_projeto_id ON rdos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_rdos_data ON rdos(data);
CREATE INDEX IF NOT EXISTS idx_projetos_cliente_id ON projetos(cliente_id);

-- 4. FORÇAR RECARREGAMENTO DO CACHE DO POSTGREST (Isso resolve o erro 400)
NOTIFY pgrst, 'reload schema';

-- 5. Verificar se a coluna foi criada (Opcional, apenas para confirmação no log)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projetos' AND column_name = 'cliente_id';
