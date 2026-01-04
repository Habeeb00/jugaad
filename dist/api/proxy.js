/**
 * Vercel Serverless CORS Proxy
 * Fetches TinkerHub event pages and returns the HTML content
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the URL to fetch
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Validate URL is from TinkerHub (security measure)
    try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.includes('tinkerhub.org')) {
            return res.status(403).json({ error: 'Only TinkerHub URLs are allowed' });
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Add2Cal/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Failed to fetch: ${response.statusText}`
            });
        }

        const html = await response.text();

        // Return the HTML content
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache for 5 min
        return res.status(200).send(html);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch page',
            details: error.message
        });
    }
}
