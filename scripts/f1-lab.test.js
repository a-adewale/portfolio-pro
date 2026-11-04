import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { summarizePace, normalizeJolpicaQualifying, matchQualifyingSectors } from '../api/f1-lab.js';

test('race pace compares clean medians and excludes pit and slow laps', () => {
    const laps = [
        ...[90, 91, 92, 93, 94, 200].map((lap_duration, index) => ({ driver_number: 1, lap_number: index + 2, lap_duration, is_pit_out_lap: false })),
        ...[91, 92, 93, 94, 95].map((lap_duration, index) => ({ driver_number: 2, lap_number: index + 2, lap_duration, is_pit_out_lap: false })),
        { driver_number: 1, lap_number: 10, lap_duration: 80, is_pit_out_lap: true }
    ];
    const drivers = [{ driver_number: 1, full_name: 'Driver One', team_colour: '123456' }, { driver_number: 2, full_name: 'Driver Two', team_colour: 'abcdef' }];
    const result = summarizePace(laps, drivers);
    assert.deepEqual(result.map(driver => driver.name), ['Driver One', 'Driver Two']);
    assert.equal(result[0].median, 92);
    assert.equal(result[0].laps, 5);
});

test('qualifying uses Jolpica position and Q3 times before earlier phases', () => {
    const race = { QualifyingResults: [
        { number: '63', position: '2', Driver: { givenName: 'George', familyName: 'Russell', driverId: 'russell' }, Q1: '1:17.000', Q2: '1:16.800', Q3: '1:16.523' },
        { number: '44', position: '1', Driver: { givenName: 'Lewis', familyName: 'Hamilton', driverId: 'hamilton' }, Q1: '1:17.100', Q2: '1:16.900', Q3: '1:16.514' }
    ] };
    const result = normalizeJolpicaQualifying(race, [{ driver_number: 44, team_colour: 'ff0000' }]);
    assert.deepEqual(result.map(driver => driver.name), ['Lewis Hamilton', 'George Russell']);
    assert.equal(result[0].bestLap, 76.514);
    assert.deepEqual(result[0].phases, [77.1, 76.9, 76.514]);
    assert.equal(result[0].colour, '#ff0000');
});

test('mini sectors are attached only to the matching qualifying lap', () => {
    const drivers = [{ number: 44, bestLap: 76.514 }, { number: 63, bestLap: 76.523 }];
    const laps = [
        { driver_number: 44, lap_duration: 76.953, duration_sector_1: 26, duration_sector_2: 30, duration_sector_3: 20 },
        { driver_number: 44, lap_duration: 76.514, duration_sector_1: 26.852, duration_sector_2: 30.030, duration_sector_3: 19.632, st_speed: 323 },
        { driver_number: 63, lap_duration: 76.6, duration_sector_1: 26.8, duration_sector_2: 30, duration_sector_3: 19.8 }
    ];
    const result = matchQualifyingSectors(drivers, laps);
    assert.deepEqual(result[0].sectors, [26.852, 30.03, 19.632]);
    assert.equal(result[0].topSpeed, 323);
    assert.equal(result[1].sectors, null);
});

test('Race Lab endpoint validates the requested view and method', async () => {
    const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
    const invalid = response();
    await handler({ method: 'GET', query: { view: 'secret' } }, invalid);
    assert.equal(invalid.code, 400);
    const method = response();
    await handler({ method: 'POST', query: { view: 'pace' } }, method);
    assert.equal(method.code, 405);
});
