const BASE = 'https://api.openf1.org/v1/';
const VALID_VIEWS = new Set(['pace', 'qualifying', 'telemetry']);
const JOLPICA = 'https://api.jolpi.ca/ergast/f1/';

export const config = { maxDuration: 30 };

async function openF1(path, parameters) {
    const url = new URL(path, BASE);
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
    for (let attempt = 0; attempt < 3; attempt++) {
        const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
        if (response.status === 429 && attempt < 2) {
            const wait = Math.min(3000, Math.max(1200, (Number(response.headers.get('retry-after')) || 1) * 1000));
            await new Promise(resolve => setTimeout(resolve, wait));
            continue;
        }
        if (!response.ok) throw new Error(`OpenF1 returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unexpected OpenF1 response');
        return data;
    }
}

async function jolpica(path) {
    const response = await fetch(new URL(path, JOLPICA), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error(`Jolpica returned ${response.status}`);
    return response.json();
}

function completed(session, now) {
    const end = Date.parse(session.date_end);
    return !session.is_cancelled && Number.isFinite(end) && end < now - 30 * 60 * 1000;
}

async function latestRace() {
    const now = Date.now();
    for (const year of [new Date(now).getUTCFullYear(), new Date(now).getUTCFullYear() - 1]) {
        const sessions = await openF1('sessions', { year });
        const races = sessions.filter(session => session.session_type === 'Race' && completed(session, now))
            .sort((a, b) => Date.parse(b.date_end) - Date.parse(a.date_end));
        if (races.length) return { race: races[0], sessions };
    }
    throw new Error('No completed race available');
}

function driverMap(drivers) {
    return new Map(drivers.map(driver => [Number(driver.driver_number), {
        name: driver.full_name || driver.name_acronym || `Driver ${driver.driver_number}`,
        number: Number(driver.driver_number),
        team: driver.team_name || null,
        colour: /^[0-9a-f]{6}$/i.test(driver.team_colour || '') ? `#${driver.team_colour}` : '#ef3338'
    }]));
}

function raceDetails(race) {
    return { name: `${race.location || race.country_name} Grand Prix`, country: race.country_name, circuit: race.circuit_short_name, date: race.date_start, year: race.year };
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizePace(laps, drivers) {
    const byDriver = new Map();
    for (const lap of laps) {
        const duration = Number(lap.lap_duration);
        const number = Number(lap.driver_number);
        if (!Number.isFinite(duration) || duration < 50 || duration > 240 || lap.is_pit_out_lap || Number(lap.lap_number) <= 1) continue;
        if (!byDriver.has(number)) byDriver.set(number, []);
        byDriver.get(number).push(duration);
    }
    const names = driverMap(drivers);
    return [...byDriver].map(([number, values]) => {
        const best = Math.min(...values);
        const clean = values.filter(value => value <= best * 1.1);
        return clean.length >= 5 ? { ...names.get(number), number, median: median(clean), laps: clean.length } : null;
    }).filter(Boolean).sort((a, b) => a.median - b.median).slice(0, 6);
}

function qualifyingSession(sessions, race) {
    return sessions.filter(session => session.meeting_key === race.meeting_key && session.session_type === 'Qualifying' && completed(session, Date.now()))
        .sort((a, b) => Date.parse(b.date_end) - Date.parse(a.date_end))[0] || null;
}

function bestDuration(value) {
    const times = (Array.isArray(value) ? value : [value]).map(Number).filter(number => Number.isFinite(number) && number > 30 && number < 240);
    return times.length ? Math.min(...times) : null;
}

export function summarizeQualifying(results, drivers) {
    const names = driverMap(drivers);
    return results.filter(result => Number.isFinite(Number(result.position)) && !result.dsq)
        .sort((a, b) => Number(a.position) - Number(b.position)).slice(0, 6)
        .map(result => ({ ...names.get(Number(result.driver_number)), number: Number(result.driver_number), position: Number(result.position), bestLap: bestDuration(result.duration) }));
}

function parseLapTime(value) {
    if (!value || typeof value !== 'string') return null;
    const match = /^(\d+):(\d{2})\.(\d{3})$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 1000 : null;
}

export function normalizeJolpicaQualifying(race, openDrivers = []) {
    const byNumber = driverMap(openDrivers);
    return (race?.QualifyingResults || []).filter(result => Number.isFinite(Number(result.position)))
        .sort((a, b) => Number(a.position) - Number(b.position)).slice(0, 6)
        .map(result => {
            const number = Number(result.number);
            const driver = result.Driver || {};
            return {
                ...byNumber.get(number), number, position: Number(result.position),
                name: [driver.givenName, driver.familyName].filter(Boolean).join(' ') || byNumber.get(number)?.name || `Driver ${number}`,
                driverId: driver.driverId || null, team: result.Constructor?.name || byNumber.get(number)?.team || null,
                code: driver.code || null,
                bestLap: parseLapTime(result.Q3) ?? parseLapTime(result.Q2) ?? parseLapTime(result.Q1),
                phases: [result.Q1, result.Q2, result.Q3].map(parseLapTime)
            };
        });
}

export function matchQualifyingSectors(drivers, laps) {
    return drivers.map(driver => {
        const match = Number.isFinite(driver.bestLap) ? laps.find(lap =>
            Number(lap.driver_number) === driver.number &&
            Math.abs(Number(lap.lap_duration) - driver.bestLap) <= 0.015 &&
            [lap.duration_sector_1, lap.duration_sector_2, lap.duration_sector_3].every(value => Number.isFinite(Number(value)) && Number(value) > 0)
        ) : null;
        return {
            ...driver,
            sectors: match ? [match.duration_sector_1, match.duration_sector_2, match.duration_sector_3].map(Number) : null,
            topSpeed: match && Number.isFinite(Number(match.st_speed)) ? Number(match.st_speed) : null
        };
    });
}

async function officialQualifying(context, session) {
    const lastResult = await jolpica(`${context.race.year}/last/results/?limit=1`);
    const lastRace = lastResult.MRData?.RaceTable?.Races?.[0];
    if (!lastRace || Math.abs(Date.parse(lastRace.date) - Date.parse(context.race.date_start)) > 2 * 86400000) {
        throw new Error('Jolpica and OpenF1 latest races do not match');
    }
    const [qualifying, drivers] = await Promise.all([
        jolpica(`${lastRace.season}/${lastRace.round}/qualifying/?limit=100`),
        openF1('drivers', { session_key: session.session_key })
    ]);
    const race = qualifying.MRData?.RaceTable?.Races?.[0];
    if (!race || race.round !== lastRace.round) throw new Error('Official qualifying result is unavailable');
    return { drivers: normalizeJolpicaQualifying(race, drivers), race };
}

async function loadPace(context) {
    const [laps, drivers] = await Promise.all([
        openF1('laps', { session_key: context.race.session_key }),
        openF1('drivers', { session_key: context.race.session_key })
    ]);
    return { race: raceDetails(context.race), drivers: summarizePace(laps, drivers), method: 'Median of at least five timed laps per driver; excludes first laps, pit-out laps, and laps over 110% of that driver’s quickest recorded lap. Safety-car and traffic effects may remain.' };
}

async function loadQualifying(context) {
    const session = qualifyingSession(context.sessions, context.race);
    if (!session) return { race: raceDetails(context.race), drivers: [] };
    const official = await officialQualifying(context, session);
    let drivers = official.drivers;
    try {
        const laps = await openF1('laps', { session_key: session.session_key });
        drivers = matchQualifyingSectors(drivers, laps);
    } catch (error) {
        console.warn('Qualifying sector data unavailable:', error.message);
    }
    return { race: raceDetails(context.race), drivers, source: 'Jolpica F1 classification · OpenF1 matched-lap sectors' };
}

async function loadTelemetry(context) {
    const session = qualifyingSession(context.sessions, context.race);
    if (!session) return { race: raceDetails(context.race), trace: [] };
    const pole = (await officialQualifying(context, session)).drivers[0];
    if (!pole) return { race: raceDetails(context.race), trace: [] };
    const laps = await openF1('laps', { session_key: session.session_key, driver_number: pole.number });
    const timed = laps.filter(lap => Number(lap.lap_duration) > 30 && Number(lap.lap_duration) < 240 && !lap.is_pit_out_lap && Date.parse(lap.date_start));
    const fastest = timed.sort((a, b) => Number(a.lap_duration) - Number(b.lap_duration))[0];
    if (!fastest) return { race: raceDetails(context.race), driver: pole, trace: [] };
    const start = new Date(Date.parse(fastest.date_start) - 1000).toISOString();
    const end = new Date(Date.parse(fastest.date_start) + Number(fastest.lap_duration) * 1000 + 2000).toISOString();
    let points = [];
    try {
        points = await openF1('car_data', { session_key: session.session_key, driver_number: pole.number, 'date>=': start, 'date<': end });
    } catch (error) {
        console.warn('OpenF1 car trace unavailable:', error.message);
    }
    const usable = points.filter(point => Number.isFinite(Number(point.speed)) && Number(point.speed) > 0).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const step = Math.max(1, Math.ceil(usable.length / 90));
    const sectorSpeeds = [
        { label: 'Intermediate 1', speed: Number(fastest.i1_speed) || null },
        { label: 'Intermediate 2', speed: Number(fastest.i2_speed) || null },
        { label: 'Speed trap', speed: Number(fastest.st_speed) || null }
    ].filter(item => item.speed);
    return {
        race: raceDetails(context.race),
        driver: pole,
        lap: Number(fastest.lap_duration),
        trace: usable.filter((_, index) => index % step === 0).map(point => ({ speed: Number(point.speed), throttle: Number(point.throttle) || 0, brake: Number(point.brake) || 0 })),
        sectorSpeeds,
        sectorTimes: [fastest.duration_sector_1, fastest.duration_sector_2, fastest.duration_sector_3].map(value => Number(value) || null),
        note: usable.length ? 'Speed, throttle, and braking samples from the pole sitter’s quickest recorded qualifying lap. Samples are shown in time order; track distance is not inferred.' : 'Full car trace is unavailable for this session. The three speed trap readings and sector times below come from the recorded qualifying lap.'
    };
}

const loaders = { pace: loadPace, qualifying: loadQualifying, telemetry: loadTelemetry };

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Method not allowed' });
    }
    const view = request.query?.view;
    if (typeof view !== 'string' || !VALID_VIEWS.has(view)) return response.status(400).json({ error: 'Choose pace, qualifying, or telemetry.' });
    try {
        const context = await latestRace();
        const data = await loaders[view](context);
        response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=1800, stale-while-revalidate=3600');
        return response.status(200).json({ view, source: view === 'qualifying' ? 'Jolpica F1 + OpenF1' : view === 'telemetry' ? 'Jolpica F1 + OpenF1' : 'OpenF1', generatedAt: new Date().toISOString(), data });
    } catch (error) {
        console.error(`F1 lab ${view} error:`, error.message);
        response.setHeader('Cache-Control', 'no-store');
        return response.status(503).json({ error: 'Race Lab data is temporarily unavailable.' });
    }
}
