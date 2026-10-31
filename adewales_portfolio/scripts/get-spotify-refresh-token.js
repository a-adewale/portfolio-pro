import http from 'node:http';
import crypto from 'node:crypto';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';
const scopes = ['user-read-currently-playing', 'user-read-recently-played'];

if (!clientId || !clientSecret) {
    console.error('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local first.');
    process.exit(1);
}

const callbackUrl = new URL(redirectUri);
if (callbackUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(callbackUrl.hostname)) {
    console.error('SPOTIFY_REDIRECT_URI must be a local HTTP URL for this setup helper.');
    process.exit(1);
}

const state = crypto.randomBytes(24).toString('hex');
const authorizeUrl = new URL('https://accounts.spotify.com/authorize');
authorizeUrl.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state,
    show_dialog: 'true'
}).toString();

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, redirectUri);
    if (requestUrl.pathname !== callbackUrl.pathname) {
        response.writeHead(404).end('Not found');
        return;
    }

    if (requestUrl.searchParams.get('state') !== state) {
        response.writeHead(400).end('Invalid OAuth state. Close this tab and try again.');
        server.close();
        return;
    }

    const code = requestUrl.searchParams.get('code');
    if (!code) {
        response.writeHead(400).end(`Spotify authorization failed: ${requestUrl.searchParams.get('error') || 'missing code'}`);
        server.close();
        return;
    }

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.refresh_token) {
            throw new Error(tokenData.error_description || tokenData.error || 'No refresh token returned');
        }

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end('<h1>Spotify connected</h1><p>You can close this tab and return to your terminal.</p>');
        console.log('\nAdd this value to .env.local and to your hosting environment:');
        console.log(`\nSPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}\n`);
    } catch (error) {
        response.writeHead(500).end('Could not exchange the authorization code. Check the terminal.');
        console.error(error.message);
    } finally {
        server.close();
    }
});

server.listen(Number(callbackUrl.port) || 80, callbackUrl.hostname, () => {
    console.log('\n1. Confirm this exact Redirect URI is registered in your Spotify app:');
    console.log(`   ${redirectUri}`);
    console.log('\n2. Open this URL in your browser and approve access:\n');
    console.log(authorizeUrl.toString());
    console.log('\nWaiting for Spotify to redirect back...');
});
