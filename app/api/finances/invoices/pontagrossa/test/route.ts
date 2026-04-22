import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';
import { consultarNfseServicoPrestado, resolvePontaGrossaConfig, type PontaGrossaConfig } from '@/lib/nfse/ponta-grossa';

type TestRequestBody = {
  config: PontaGrossaConfig;
  startDate?: string;
  endDate?: string;
  nfseNumber?: string;
  tomadorCnpj?: string;
  tomadorInscricaoMunicipal?: string;
  page?: number;
};

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const body = (await request.json()) as TestRequestBody;
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultEnd = now.toISOString().slice(0, 10);
    const config = resolvePontaGrossaConfig(body.config);

    const result = await consultarNfseServicoPrestado({
      config,
      startDate: body.startDate || defaultStart,
      endDate: body.endDate || defaultEnd,
      nfseNumber: body.nfseNumber,
      tomadorCnpj: body.tomadorCnpj,
      tomadorInscricaoMunicipal: body.tomadorInscricaoMunicipal,
      page: body.page || 1,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ponta Grossa test route error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao consultar notas no webservice da Prefeitura.' },
      { status: 500 }
    );
  }
}
