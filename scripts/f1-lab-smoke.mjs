import f1Handler from '../api/f1.js';
import labHandler from '../api/f1-lab.js';


function recorder() {
    return {
        setHeader() {},
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}
'spent way too long on this'

for (const [handler, view] of [[f1Handler, 'latest'], [labHandler, 'pace'], [labHandler, 'qualifying'], [labHandler, 'telemetry']]) {
    const response = recorder();
    await handler({ method: 'GET', query: { view } }, response);
    console.log(JSON.stringify({ view, status: response.statusCode, race: response.body?.data?.race?.name, winner: response.body?.data?.lastRace?.winner, leader: response.body?.data?.leader?.name, champion: response.body?.data?.champion?.name, next: response.body?.data?.next?.name, first: response.body?.data?.drivers?.[0]?.name, rows: response.body?.data?.drivers?.length, matchedSectors: response.body?.data?.drivers?.filter(driver => driver.sectors?.length === 3).length, samples: response.body?.data?.trace?.length, traps: response.body?.data?.sectorSpeeds?.length, error: response.body?.error }));
    await new Promise(resolve => setTimeout(resolve, 1500));
}
