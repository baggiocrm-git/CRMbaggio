-- Migration para a seção de ORÇAMENTO
-- Este arquivo cria as tabelas necessárias para gerenciar orçamentos de obras

-- 1. Tabela de Orçamentos
-- Armazena o cabeçalho do orçamento vinculado a um projeto
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_total NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Itens do Orçamento
-- Armazena cada serviço/material detalhado por etapa da obra
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
    etapa TEXT NOT NULL, -- Ex: "Serviços Preliminares", "Fundações", etc.
    descricao TEXT NOT NULL,
    unidade TEXT, -- Ex: "m2", "m3", "un", "kg"
    quantidade NUMERIC(15, 3) DEFAULT 0,
    preco_unitario NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_orcamentos_projeto_id ON orcamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id ON orcamento_itens(orcamento_id);

-- 4. Configuração de RLS (Row Level Security)
-- Habilita a segurança por linha (padrão Supabase)
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso (Exemplo: Acesso total para usuários autenticados)
-- Nota: Ajuste conforme a necessidade de multi-inquilino (multi-tenant)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orcamentos' AND policyname = 'Permitir tudo para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir tudo para usuários autenticados" ON orcamentos FOR ALL TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orcamento_itens' AND policyname = 'Permitir tudo para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir tudo para usuários autenticados" ON orcamento_itens FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- Comentários nas tabelas para documentação no Supabase Dashboard
COMMENT ON TABLE orcamentos IS 'Cabeçalho dos orçamentos vinculados aos projetos de obras.';
COMMENT ON TABLE orcamento_itens IS 'Detalhamento dos itens (serviços e materiais) de cada orçamento, organizados por etapa.';
