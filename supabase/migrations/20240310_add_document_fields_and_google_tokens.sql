-- Migration to add missing columns to documentos table and create google_tokens table
-- This fixes the issue where document uploads fail because of missing database columns

-- 1. Add missing columns to documentos
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "Categoria" TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "data" DATE;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "file_path" TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'Vigente';
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "Ano" TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "Google_Drive_id" TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS "area" TEXT;

-- 2. Create google_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS google_tokens (
    id BIGINT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date TEXT, -- Stored as date string YYYY-MM-DD
    scope TEXT,
    token_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS for google_tokens and documentos
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for google_tokens (Allow all for authenticated for now, as per app logic)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'google_tokens' AND policyname = 'Permitir tudo para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir tudo para usuários autenticados" ON google_tokens FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 5. Create policy for documentos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'documentos' AND policyname = 'Permitir tudo para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir tudo para usuários autenticados" ON documentos FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 6. Add trigger for updated_at on google_tokens
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_google_tokens_updated_at') THEN
        CREATE TRIGGER update_google_tokens_updated_at
            BEFORE UPDATE ON google_tokens
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
