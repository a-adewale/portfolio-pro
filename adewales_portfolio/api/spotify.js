const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const CURRENTLY_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

function sendJson(response, status, body) {
    response.status(status).json(body);
}

async function getAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Spotify environment variables are not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!tokenResponse.ok) {
        throw new Error(`Spotify token request failed (${tokenResponse.status})`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

async function spotifyGet(url, accessToken) {
    return fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
}

function normalizeTrack(track, isPlaying, playedAt = null) {
    return {
        isPlaying,
        title: track.name,
        artist: track.artists?.map(artist => artist.name).join(', ') || 'Unknown artist',
        album: track.album?.name || null,
        albumArt: track.album?.images?.[0]?.url || null,
        spotifyUrl: track.external_urls?.spotify || null,
        playedAt
    };
}

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    try {
        const accessToken = await getAccessToken();
        const currentResponse = await spotifyGet(CURRENTLY_PLAYING_URL, accessToken);

        if (currentResponse.status === 200) {
            const current = await currentResponse.json();
            if (current.item && current.currently_playing_type === 'track') {
                response.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
                return sendJson(response, 200, normalizeTrack(current.item, Boolean(current.is_playing)));
            }
        } else if (currentResponse.status !== 204) {
            throw new Error(`Spotify playback request failed (${currentResponse.status})`);
        }

        const recentResponse = await spotifyGet(RECENTLY_PLAYED_URL, accessToken);
        if (!recentResponse.ok) {
            throw new Error(`Spotify history request failed (${recentResponse.status})`);
        }

        const recent = await recentResponse.json();
        const latest = recent.items?.[0];
        if (!latest?.track) {
            return sendJson(response, 404, { error: 'No listening history found' });
        }

        response.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return sendJson(response, 200, normalizeTrack(latest.track, false, latest.played_at));
    } catch (error) {
        console.error('Spotify endpoint error:', error.message);
        response.setHeader('Cache-Control', 'no-store');
        return sendJson(response, 503, { error: 'Spotify listening status is temporarily unavailable' });
    }
}
