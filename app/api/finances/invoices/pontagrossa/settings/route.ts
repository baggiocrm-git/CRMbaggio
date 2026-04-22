import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';
import { DEFAULT_PONTA_GROSSA_CONFIG, type PontaGrossaConfig } from '@/lib/nfse/ponta-grossa-config';

const SETTINGS_TABLE = 'finance_nfse_settings';
const SETTINGS_ID = 'ponta-grossa';

type SettingsRow = {
  id: string;
  provider: string;
  payload: PontaGrossaConfig;
  created_at: string;
  updated_at: string;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are missing on the server.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sanitizeStoredConfig(config: Partial<PontaGrossaConfig>): PontaGrossaConfig {
  return {
    ...DEFAULT_PONTA_GROSSA_CONFIG,
    ...config,
    certPath: '',
    certPassword: '',
    webservicePassword: '',
  };
}

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.from(SETTINGS_TABLE).select('*').eq('id', SETTINGS_ID).maybeSingle();

    if (error) {
      const missingTable = error.code === '42P01' || error.message?.toLowerCase().includes('does not exist');
      if (missingTable) {
        return NextResponse.json({ enabled: false, missingTable: true, config: sanitizeStoredConfig({}) });
      }

      throw error;
    }

    const row = data as SettingsRow | null;
    return NextResponse.json({
      enabled: true,
      missingTable: false,
      config: sanitizeStoredConfig(row?.payload || {}),
    });
  } catch (error) {
    console.error('Ponta Grossa settings GET error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar a configuração compartilhada da NFS-e.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authorization = await authorizeRequest(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const body = (await request.json()) as { config?: Partial<PontaGrossaConfig> };
    const config = sanitizeStoredConfig(body.config || {});
    const supabaseAdmin = getSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from(SETTINGS_TABLE)
      .upsert(
        {
          id: SETTINGS_ID,
          provider: 'ponta-grossa',
          payload: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      enabled: true,
      config: sanitizeStoredConfig((data as SettingsRow).payload),
    });
  } catch (error) {
    console.error('Ponta Grossa settings PUT error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar a configuração compartilhada da NFS-e.' },
      { status: 500 }
    );
  }
}
