import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Informe um nome ou empresa para pesquisar.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return NextResponse.json(
        {
          error:
            'Pesquisa Google não configurada. Defina GOOGLE_SEARCH_API_KEY e GOOGLE_SEARCH_ENGINE_ID nas variáveis de ambiente.',
        },
        { status: 500 }
      );
    }

    const url = new URL('https://customsearch.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', '5');
    url.searchParams.set('hl', 'pt-BR');
    url.searchParams.set('gl', 'br');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || 'Falha ao consultar o Google.' },
        { status: response.status }
      );
    }

    const results = Array.isArray(payload.items)
      ? payload.items.map((item: Record<string, unknown>) => ({
          title: String(item.title || ''),
          link: String(item.link || ''),
          snippet: String(item.snippet || ''),
          displayLink: String(item.displayLink || ''),
        }))
      : [];

    return NextResponse.json({
      query,
      results,
      totalResults: payload?.searchInformation?.totalResults || '0',
    });
  } catch (error: unknown) {
    console.error('Contacts AI Search API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao pesquisar no Google.' },
      { status: 500 }
    );
  }
}
