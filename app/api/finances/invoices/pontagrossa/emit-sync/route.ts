import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';
import { emitirLoteRpsSincrono, resolvePontaGrossaConfig, type EmitirLoteRpsSincronoInput } from '@/lib/nfse/ponta-grossa';

type EmitRequestBody = EmitirLoteRpsSincronoInput;

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const body = (await request.json()) as EmitRequestBody;
    const result = await emitirLoteRpsSincrono({
      ...body,
      config: resolvePontaGrossaConfig(body.config),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ponta Grossa emit route error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao emitir NFS-e síncrona na Prefeitura.' },
      { status: 500 }
    );
  }
}
