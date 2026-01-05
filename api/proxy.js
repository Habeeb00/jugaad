/**
 * Vercel Serverless CORS Proxy (Edge Runtime)
 * Fetches TinkerHub event pages and returns the HTML content
 * Edge Runtime eliminates cold starts for this function
 */

export const config = {
    runtime: 'edge', // This is the magic key for no cold starts
};

export default async function handler(request) {
    // 1. Handle CORS and Options
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
    }

    // 2. Only allow GET
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    // 3. Parse URL parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    // 4. Validate URL
    try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.includes('tinkerhub.org')) {
            return new Response(JSON.stringify({ error: 'Only TinkerHub URLs are allowed' }), {
                status: 403,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid URL' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    try {
        // 5. Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Add2Cal/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: `Failed to fetch: ${response.statusText}` }), {
                status: response.status,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        const html = await response.text();

        // 6. Return the HTML content
        return new Response(html, {
            status: 200,
            headers: {
                ...headers,
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 's-maxage=300, stale-while-revalidate',
            }
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch page',
            details: error.message
        }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}
