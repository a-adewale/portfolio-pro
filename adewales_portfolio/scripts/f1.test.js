import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { durationSeconds, summarizeCalendar, summarizeStops } from '../api/f1.js';

function responseRecorder() {
    return {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

function upstream(data, status = 200) {
    return { ok: status >= 200 && status < 300, status, json: async () => ({ MRData: data }) };
}

test('calendar chooses upcoming races in chronological order and preserves date-only races', () => {
    const races = [
        { raceName: 'Later', date: '2030-06-03', time: '12:00:00Z' },
        { raceName: 'Finished', date: '2030-05-01', time: '12:00:00Z' },
        { raceName: 'Next', date: '2030-06-01' }
    ];
    const result = summarizeCalendar(races, Date.parse('2030-05-15T00:00:00Z'));
    assert.deepEqual(result.map(race => race.name), ['Next', 'Later']);
    assert.equal(result[0].time, null);
});

test('pit stop summaries parse minute durations, reject invalid values and calculate a median', () => {
    assert.equal(durationSeconds('1:02.500'), 62.5);
    assert.equal(durationSeconds('invalid'), null);
    assert.equal(durationSeconds('0'), null);
    const result = summarizeStops([{ duration: '25.000' }, { duration: '20.000' }, { duration: '1:02.500' }, { duration: 'bad' }]);
    assert.equal(result.count, 3);
    assert.equal(result.medianSeconds, 25);
    assert.equal(result.fastest[0].seconds, 20);
});

test('endpoint validates requests and caches normalized calendar responses', async t => {
    const original = globalThis.fetch;
    t.after(() => { globalThis.fetch = original; });
    let options;
    globalThis.fetch = async (url, requestOptions) => {
        options = requestOptions;
        assert.match(String(url), /current\/races\.json/);
        return upstream({ RaceTable: { season: '2099', Races: [{ raceName: 'Future GP', round: '1', date: '2099-06-01', time: '12:00:00Z' }] } });
    };
    const invalid = responseRecorder();
    await handler({ method: 'GET', query: { view: '../secret' } }, invalid);
    assert.equal(invalid.statusCode, 400);
    const method = responseRecorder();
    await handler({ method: 'POST', query: { view: 'calendar' } }, method);
    assert.equal(method.statusCode, 405);
    const response = responseRecorder();
    await handler({ method: 'GET', query: { view: 'calendar' } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.races[0].name, 'Future GP');
    assert.match(response.headers['Cache-Control'], /s-maxage=900/);
    assert.match(options.headers['User-Agent'], /TouchecodesF1Lab/);
});

test('driver form joins standings to recent results and handles one failed history', async t => {
    const original = globalThis.fetch;
    t.after(() => { globalThis.fetch = original; });
    globalThis.fetch = async url => {
        const path = new URL(url).pathname;
        if (path.includes('driverstandings')) return upstream({ StandingsTable: { season: '2025', StandingsLists: [{ DriverStandings: [
            { position: '1', points: '250', Driver: { driverId: 'one', givenName: 'Alex', familyName: 'One', permanentNumber: '44' }, Constructors: [{ name: 'Team A' }] },
            { position: '2', points: '200', Driver: { driverId: 'two', givenName: 'Sam', familyName: 'Two' }, Constructors: [] }
        ] }] } });
        if (path.includes('/one/')) return upstream({ RaceTable: { Races: Array.from({ length: 6 }, (_, i) => ({ raceName: `Race ${i + 1}`, round: String(i + 1), Results: [{ positionText: String(i + 1), status: 'Finished' }] })) } });
        return upstream({}, 503);
    };
    const response = responseRecorder();
    await handler({ method: 'GET', query: { view: 'form' } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.drivers[0].recent.length, 5);
    assert.equal(response.body.data.drivers[0].recent[0].race, 'Race 6');
    assert.equal(response.body.data.drivers[0].number, '44');
    assert.equal(response.body.data.drivers[1].historyAvailable, false);
    assert.equal(response.body.data.partial, true);
    assert.match(response.headers['Cache-Control'], /s-maxage=60/);
});

test('pit stop endpoint follows pagination and handles upstream failures', async t => {
    const original = globalThis.fetch;
    t.after(() => { globalThis.fetch = original; });
    const calls = [];
    globalThis.fetch = async url => {
        const parsed = new URL(url);
        calls.push(parsed);
        if (parsed.pathname.includes('results')) return upstream({ RaceTable: { Races: [{ Results: [{ Driver: { driverId: 'one', givenName: 'Alex', familyName: 'One' } }] }] } });
        const offset = Number(parsed.searchParams.get('offset'));
        const stops = offset ? [{ driverId: 'one', lap: '20', duration: '19.000' }] : Array.from({ length: 100 }, () => ({ driverId: 'one', lap: '10', duration: '25.000' }));
        return upstream({ total: '101', RaceTable: { Races: [{ raceName: 'Test GP', season: '2025', round: '3', PitStops: stops }] } });
    };
    const response = responseRecorder();
    await handler({ method: 'GET', query: { view: 'pitstops' } }, response);
    assert.equal(response.body.data.count, 101);
    assert.equal(response.body.data.complete, true);
    assert.equal(response.body.data.fastest[0].driver, 'Alex One');
    assert.equal(response.body.data.fastest[0].seconds, 19);
    assert.equal(calls.filter(call => call.pathname.includes('pitstops')).length, 2);

    globalThis.fetch = async () => upstream({}, 429);
    const failed = responseRecorder();
    await handler({ method: 'GET', query: { view: 'calendar' } }, failed);
    assert.equal(failed.statusCode, 503);
    assert.equal(failed.headers['Cache-Control'], 'no-store');
});
