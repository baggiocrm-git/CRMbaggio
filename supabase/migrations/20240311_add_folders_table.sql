-- Migration to add folders support
-- 1. Create pastas table
CREATE TABLE IF NOT EXISTS pastas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    parent_id UUID REFERENCES pastas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Add pasta_id to documentos
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS pasta_id UUID REFERENCES pastas(id) ON DELETE SET NULL;

-- 3. Enable RLS for pastas
ALTER TABLE pastas ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for pastas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'pastas' AND policyname = 'Permitir tudo para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir tudo para usuários autenticados" ON pastas FOR ALL TO authenticated USING (true);
    END IF;
END $$;
