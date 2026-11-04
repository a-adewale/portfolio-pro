const API_BASE = 'https://api.jolpi.ca/ergast/f1/';
const USER_AGENT = 'TouchecodesF1Lab/1.0 (+https://adewalesportfolio.vercel.app)';
const PAGE_SIZE = 100;
const MAX_STOPS = 500;

async function jolpica(path, parameters = {}) {
    const url = new URL(path, API_BASE);
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
    const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Jolpica returned ${response.status}`);
    const payload = await response.json();
    if (!payload || typeof payload.MRData !== 'object') throw new Error('Invalid Jolpica response');
    return payload.MRData;
}

function raceTimestamp(race) {
    if (!race.date) return NaN;
    return Date.parse(`${race.date}T${race.time || '23:59:59Z'}`);
}

export function summarizeCalendar(races, now = Date.now()) {
    return races
        .filter(race => Number.isFinite(raceTimestamp(race)) && raceTimestamp(race) >= now)
        .sort((a, b) => raceTimestamp(a) - raceTimestamp(b))
        .slice(0, 4)
        .map(race => ({
            round: race.round,
            name: race.raceName,
            circuit: race.Circuit?.circuitName || null,
            location: [race.Circuit?.Location?.locality, race.Circuit?.Location?.country].filter(Boolean).join(', '),
            country: race.Circuit?.Location?.country || null,
            date: race.date,
            time: race.time || null
        }));
}

function driverName(driver) {
    return [driver?.givenName, driver?.familyName].filter(Boolean).join(' ') || 'Unknown driver';
}

async function calendar() {
    const data = await jolpica('current/races.json', { limit: PAGE_SIZE });
    const races = data.RaceTable?.Races;
    if (!Array.isArray(races)) throw new Error('Race calendar is unavailable');
    return { season: data.RaceTable?.season || null, races: summarizeCalendar(races) };
}

async function driverForm() {
    const data = await jolpica('current/driverstandings.json', { limit: PAGE_SIZE });
    const standings = data.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    const leaders = standings.slice(0, 3);
    const histories = await Promise.allSettled(leaders.map(entry => {
        const id = entry.Driver?.driverId;
        if (!id || !/^[a-z0-9_-]+$/i.test(id)) throw new Error('Invalid driver identifier');
        return jolpica(`current/drivers/${encodeURIComponent(id)}/results.json`, { limit: PAGE_SIZE });
    }));

    const drivers = leaders.map((entry, index) => {
        const history = histories[index];
        const races = history.status === 'fulfilled' ? history.value.RaceTable?.Races || [] : [];
        const recent = races.slice(-5).reverse().map(race => {
            const result = race.Results?.[0] || {};
            return { race: race.raceName, round: race.round, position: result.positionText || result.position || '—', status: result.status || null };
        });
        return {
            driverId: entry.Driver?.driverId || null,
            name: driverName(entry.Driver),
            number: entry.Driver?.permanentNumber || null,
            nationality: entry.Driver?.nationality || null,
            team: entry.Constructors?.[0]?.name || null,
            position: entry.position,
            points: entry.points,
            recent,
            historyAvailable: history.status === 'fulfilled'
        };
    });

    return { season: data.StandingsTable?.season || null, drivers, partial: histories.some(result => result.status === 'rejected') };
}

async function latest() {
    const calendarData = await jolpica('current/races.json', { limit: PAGE_SIZE });
    const season = Number(calendarData.RaceTable?.season) || new Date().getUTCFullYear();
    const scheduled = calendarData.RaceTable?.Races || [];
    const next = summarizeCalendar(scheduled)[0] || null;
    const lastScheduled = Math.max(...scheduled.map(raceTimestamp).filter(Number.isFinite));
    const championSeason = Number.isFinite(lastScheduled) && lastScheduled < Date.now() ? season : season - 1;
    const [resultData, standingsData, championData] = await Promise.all([
        jolpica('current/last/results.json', { limit: PAGE_SIZE }),
        jolpica('current/driverstandings.json', { limit: PAGE_SIZE }),
        jolpica(`${championSeason}/driverstandings/1.json`, { limit: 1 })
    ]);
    const lastRace = resultData.RaceTable?.Races?.[0];
    const leader = standingsData.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0];
    const champion = championData.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0];
    return {
        season,
        next,
        lastRace: lastRace ? {
            name: lastRace.raceName,
            date: lastRace.date,
            winner: driverName(lastRace.Results?.[0]?.Driver),
            podium: (lastRace.Results || []).slice(0, 3).map(result => ({ position: Number(result.position), name: driverName(result.Driver), team: result.Constructor?.name || null }))
        } : null,
        leader: leader ? { name: driverName(leader.Driver), points: Number(leader.points), wins: Number(leader.wins), team: leader.Constructors?.[0]?.name || null } : null,
        champion: champion ? { season: championSeason, name: driverName(champion.Driver), team: champion.Constructors?.[0]?.name || null } : null
    };
}

export function durationSeconds(value) {
    if (typeof value !== 'string' || !/^\d+(?::\d{1,2})?(?:\.\d+)?$/.test(value)) return null;
    const parts = value.split(':').map(Number);
    const result = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
    return Number.isFinite(result) && result > 0 ? result : null;
}

export function summarizeStops(stops) {
    const usable = stops.map(stop => ({ ...stop, seconds: durationSeconds(stop.duration) }))
        .filter(stop => stop.seconds !== null)
        .sort((a, b) => a.seconds - b.seconds);
    if (!usable.length) return { count: 0, medianSeconds: null, fastest: [] };
    const middle = Math.floor(usable.length / 2);
    const medianSeconds = usable.length % 2 ? usable[middle].seconds : (usable[middle - 1].seconds + usable[middle].seconds) / 2;
    return { count: usable.length, medianSeconds, fastest: usable.slice(0, 3) };
}

async function pitStops() {
    const first = await jolpica('current/last/pitstops.json', { limit: PAGE_SIZE, offset: 0 });
    const race = first.RaceTable?.Races?.[0];
    if (!race) return { race: null, count: 0, medianSeconds: null, fastest: [], complete: true };

    const stops = [...(race.PitStops || [])];
    const total = Number(first.total) || stops.length;
    for (let offset = PAGE_SIZE; offset < total && offset < MAX_STOPS; offset += PAGE_SIZE) {
        const page = await jolpica('current/last/pitstops.json', { limit: PAGE_SIZE, offset });
        stops.push(...(page.RaceTable?.Races?.[0]?.PitStops || []));
    }

    let names = {};
    if (/^\d{4}$/.test(String(race.season)) && /^\d+$/.test(String(race.round))) {
        try {
            const results = await jolpica(`${race.season}/${race.round}/results.json`, { limit: PAGE_SIZE });
            names = Object.fromEntries((results.RaceTable?.Races?.[0]?.Results || []).map(result => [result.Driver?.driverId, driverName(result.Driver)]));
        } catch (error) {
            console.warn('F1 driver names unavailable:', error.message);
        }
    }

    const summary = summarizeStops(stops);
    return {
        race: { name: race.raceName, season: race.season, round: race.round, country: race.Circuit?.Location?.country || null },
        count: summary.count,
        medianSeconds: summary.medianSeconds,
        fastest: summary.fastest.map(stop => ({ driverId: stop.driverId || null, driver: names[stop.driverId] || (stop.driverId || 'Unknown driver').replace(/_/g, ' '), lap: stop.lap, duration: stop.duration, seconds: stop.seconds })),
        complete: stops.length >= total
    };
}

const views = { calendar, form: driverForm, pitstops: pitStops, latest };

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const view = request.query?.view;
    if (typeof view !== 'string' || !Object.hasOwn(views, view)) {
        return response.status(400).json({ error: 'Choose calendar, form, pitstops, or latest.' });
    }

    try {
        const data = await views[view]();
        response.setHeader('Cache-Control', data.partial ? 'public, max-age=0, s-maxage=60' : 'public, max-age=60, s-maxage=900, stale-while-revalidate=3600');
        return response.status(200).json({ view, generatedAt: new Date().toISOString(), source: 'Jolpica F1', data });
    } catch (error) {
        console.error(`F1 ${view} error:`, error.message);
        response.setHeader('Cache-Control', 'no-store');
        return response.status(503).json({ error: 'F1 data is temporarily unavailable. Please try again shortly.' });
    }
}
