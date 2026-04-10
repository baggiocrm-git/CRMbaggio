CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select system_settings for authenticated" ON public.system_settings;
CREATE POLICY "Allow select system_settings for authenticated"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert system_settings for authenticated" ON public.system_settings;
CREATE POLICY "Allow insert system_settings for authenticated"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update system_settings for authenticated" ON public.system_settings;
CREATE POLICY "Allow update system_settings for authenticated"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
