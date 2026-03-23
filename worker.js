export default {
  async fetch(request, env) {
    const CORS_HEADERS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, Authorization, Accept',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('target');

    // GitHub API proxy — GET and PUT requests
    if (target === 'github') {
      const ghPath = url.searchParams.get('path') || '';
      const ghUrl = 'https://api.github.com' + ghPath;
      const authHeader = request.headers.get('Authorization');

      const res = await fetch(ghUrl, {
        method: request.method,
        headers: {
          'Authorization': authHeader || '',
          'Accept': request.headers.get('Accept') || 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'clean-vibe-proxy',
        },
        body: request.method !== 'GET' ? await request.text() : undefined,
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Anthropic API proxy — POST only
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const body = await request.text();
    const apiKey = request.headers.get('x-api-key');
    const anthropicVersion = request.headers.get('anthropic-version') || '2023-06-01';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'x-api-key header required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': anthropicVersion,
      },
      body,
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
};
