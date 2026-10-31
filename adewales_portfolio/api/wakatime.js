const HEARTBEATS_URL = 'https://api.wakatime.com/api/v1/users/current/heartbeats';

function sendJson(response, status, body) {
    response.status(status).json(body);
}

function lagosDate() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

function relativeTime(timestamp) {
    const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
    if (seconds < 60) return 'Active moments ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Active ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    return 'Recent coding activity';
}

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const accessToken = process.env.WAKATIME_ACCESS_TOKEN;
    if (!accessToken) {
        response.setHeader('Cache-Control', 'no-store');
        return sendJson(response, 503, { error: 'WakaTime is not configured' });
    }

    try {
        const url = new URL(HEARTBEATS_URL);
        url.searchParams.set('date', lagosDate());
        const apiResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
        });

        if (!apiResponse.ok) throw new Error(`WakaTime request failed (${apiResponse.status})`);
        const payload = await apiResponse.json();
        const latest = [...(payload.data || [])].sort((a, b) => b.time - a.time)[0];

        if (!latest) {
            response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
            return sendJson(response, 200, {
                isActive: false,
                project: null,
                language: null,
                category: null,
                relativeTime: 'No activity today',
                profileUrl: 'https://wakatime.com/dashboard'
            });
        }

        const ageSeconds = Date.now() / 1000 - latest.time;
        response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        return sendJson(response, 200, {
            isActive: ageSeconds <= 15 * 60,
            project: latest.project || null,
            language: latest.language || null,
            category: latest.category || null,
            relativeTime: relativeTime(latest.time),
            profileUrl: 'https://wakatime.com/dashboard'
        });
    } catch (error) {
        console.error('WakaTime endpoint error:', error.message);
        response.setHeader('Cache-Control', 'no-store');
        return sendJson(response, 503, { error: 'WakaTime activity is temporarily unavailable' });
    }
}
