(() => {
    const dialog = document.getElementById('f1Dialog');
    const closeButton = document.getElementById('f1DialogClose');
    const title = document.getElementById('f1DialogTitle');
    const content = document.getElementById('f1DialogContent');
    const updated = document.getElementById('f1DialogUpdated');
    const folderToggle = document.getElementById('f1FolderToggle');
    const tabs = [...document.querySelectorAll('[data-f1-tab]')];
    const cards = [...document.querySelectorAll('[data-f1-view]')];
    if (!dialog || !closeButton || !title || !content || !updated || !folderToggle) return;

    const titles = { calendar: 'Race calendar', form: 'Driver form', lab: 'Race Lab' };
    const countryCodes = {
        Australia: 'au', Austria: 'at', Azerbaijan: 'az', Bahrain: 'bh', Belgium: 'be', Brazil: 'br', Canada: 'ca', China: 'cn', Denmark: 'dk', France: 'fr', Germany: 'de', Hungary: 'hu', Italy: 'it', Japan: 'jp', Monaco: 'mc', Mexico: 'mx', Netherlands: 'nl', Qatar: 'qa', 'Saudi Arabia': 'sa', Singapore: 'sg', Spain: 'es', USA: 'us', 'United States': 'us', UK: 'gb', 'United Kingdom': 'gb', UAE: 'ae', 'United Arab Emirates': 'ae', Dutch: 'nl', British: 'gb', Monegasque: 'mc', Australian: 'au', Italian: 'it', French: 'fr', Spanish: 'es', German: 'de', Brazilian: 'br', Canadian: 'ca', Danish: 'dk', Japanese: 'jp', Chinese: 'cn', Mexican: 'mx', Austrian: 'at'
    };
    const driverAssets = {
        colapinto: '2026alpinefracol01', gasly: '2026alpinepiegas01',
        alonso: '2026astonmartinferalo01', stroll: '2026astonmartinlanstr01',
        bortoleto: '2026audigabbor01', hulkenberg: '2026audinichul01',
        perez: '2026cadillacserper01', bottas: '2026cadillacvalbot01',
        leclerc: '2026ferrarichalec01', hamilton: '2026ferrarilewham01',
        ocon: '2026haasf1teamestoco01', bearman: '2026haasf1teamolibea01',
        norris: '2026mclarenlannor01', piastri: '2026mclarenoscpia01',
        antonelli: '2026mercedesandant01', russell: '2026mercedesgeorus01',
        lindblad: '2026racingbullsarvlin01', lawson: '2026racingbullslialaw01',
        hadjar: '2026redbullracingisahad01', max_verstappen: '2026redbullracingmaxver01',
        verstappen: '2026redbullracingmaxver01', albon: '2026williamsalealb01',
        sainz: '2026williamscarsai01', sainz_jr: '2026williamscarsai01'
    };
    let requestController = null;
    let opener = null;

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = String(text);
        return node;
    }

    function message(text) {
        content.replaceChildren(element('p', 'f1-message', text));
    }

    function flag(name) {
        const code = countryCodes[name];
        if (!code) return null;
        const image = element('img', 'f1-country-flag');
        image.src = `images/flags/${code}.svg`;
        image.alt = `${name} flag`;
        image.loading = 'lazy';
        return image;
    }

    function dateLabel(race) {
        const timestamp = Date.parse(`${race.date}T${race.time || '12:00:00Z'}`);
        if (!Number.isFinite(timestamp)) return race.date || 'Date to be confirmed';
        const options = race.time
            ? { dateStyle: 'medium', timeStyle: 'short' }
            : { dateStyle: 'medium', timeZone: 'UTC' };
        return new Intl.DateTimeFormat(undefined, options).format(new Date(timestamp));
    }

    function renderCalendar(data) {
        if (!data.races?.length) return message('No upcoming races are listed for the current season yet.');
        const list = element('div', 'f1-data-list');
        data.races.forEach((race, index) => {
            const card = element('article', 'f1-data-card');
            card.classList.add('f1-race-card');
            const place = element('div', 'f1-race-place');
            const countryFlag = flag(race.country);
            if (countryFlag) place.append(countryFlag);
            place.append(element('span', '', race.country || 'Location to be confirmed'));
            card.append(place);
            card.append(element('p', 'f1-data-eyebrow', `${index === 0 ? 'Next race' : 'Coming up'} · Round ${race.round || '—'}`));
            card.append(element('h3', 'f1-data-title', race.name || 'Race to be confirmed'));
            card.append(element('p', 'f1-data-detail', [race.circuit, race.location].filter(Boolean).join(' · ')));
            card.append(element('p', 'f1-data-value', `${dateLabel(race)}${race.time ? ' · local time' : ''}`));
            list.append(card);
        });
        content.replaceChildren(list);
    }

    function renderForm(data) {
        if (!data.drivers?.length) return message('The current season has no driver standings yet.');
        const list = element('div', 'f1-data-list');
        list.append(element('p', 'f1-data-intro', 'Championship top three · latest five recorded race results'));
        data.drivers.forEach(driver => {
            const card = element('article', 'f1-data-card');
            card.classList.add('f1-driver-card');
            const header = element('div', 'f1-driver-header');
            const asset = driverAssets[driver.driverId];
            if (asset) {
                const image = element('img', 'f1-driver-photo');
                image.src = `images/drivers/${asset}right.webp`;
                image.alt = `Portrait of ${driver.name}`;
                image.loading = 'lazy';
                header.append(image);
            } else {
                header.append(element('span', 'f1-driver-monogram', (driver.name || '?').split(' ').map(part => part[0]).slice(0, 2).join('')));
            }
            const bio = element('div', 'f1-driver-bio');
            bio.append(element('p', 'f1-data-eyebrow', `Championship P${driver.position || '—'} · ${driver.points || '0'} points`));
            bio.append(element('h3', 'f1-data-title', driver.name));
            const meta = element('div', 'f1-driver-meta');
            const nationalityFlag = flag(driver.nationality);
            if (nationalityFlag) meta.append(nationalityFlag);
            if (driver.nationality) meta.append(element('span', '', driver.nationality));
            if (driver.team) meta.append(element('span', 'f1-team-name', driver.team));
            bio.append(meta);
            header.append(bio);
            if (asset || driver.number) {
                const number = element('div', 'f1-driver-number');
                if (asset) {
                    const image = element('img', '', '');
                    image.src = `images/drivers/${asset}numberwhitefrless.webp`;
                    image.alt = `${driver.name} car number`;
                    image.loading = 'lazy';
                    number.append(image);
                } else {
                    number.append(element('span', '', driver.number));
                }
                header.append(number);
            }
            card.append(header);
            if (!driver.historyAvailable) {
                card.append(element('p', 'f1-data-detail', 'Recent results are temporarily unavailable.'));
            } else if (!driver.recent.length) {
                card.append(element('p', 'f1-data-detail', 'No race results available yet.'));
            } else {
                const results = element('ul', 'f1-form-results');
                driver.recent.forEach(result => {
                    const item = element('li', 'f1-form-result');
                    const position = /^\d+$/.test(String(result.position)) ? `P${result.position}` : result.position;
                    item.append(element('strong', 'f1-result-position', position));
                    const raceName = result.race || `Round ${result.round}`;
                    const status = result.status && result.status !== 'Finished' ? ` · ${result.status}` : '';
                    item.append(element('span', 'f1-result-race', `${raceName}${status}`));
                    if (result.status) item.title = result.status;
                    results.append(item);
                });
                card.append(results);
            }
            list.append(card);
        });
        content.replaceChildren(list);
    }

    function renderPitStops(data) {
        if (!data.race || !data.count) return message('No recorded pit stops are available for the latest race yet.');
        const wrapper = element('div', 'f1-data-list');
        const summary = element('article', 'f1-data-card');
        summary.append(element('p', 'f1-data-eyebrow', `Latest available race · ${data.race.season || ''}`));
        const countryFlag = flag(data.race.country);
        if (countryFlag) {
            const place = element('div', 'f1-pitstop-place');
            place.append(countryFlag, element('span', '', data.race.country));
            summary.append(place);
        }
        summary.append(element('h3', 'f1-data-title', data.race.name));
        summary.append(element('p', 'f1-data-value', `${data.count} recorded ${data.count === 1 ? 'stop' : 'stops'} · median ${data.medianSeconds.toFixed(3)}s`));
        if (!data.complete) summary.append(element('p', 'f1-data-detail', 'Summary uses the available sample of stops.'));
        wrapper.append(summary);

        const fastest = element('article', 'f1-data-card');
        fastest.append(element('p', 'f1-data-eyebrow', 'Shortest recorded durations'));
        const list = element('ol', 'f1-stop-results');
        data.fastest.forEach(stop => {
            const row = element('li', 'f1-stop-result');
            const identity = element('span', 'f1-stop-driver');
            const asset = driverAssets[stop.driverId];
            if (asset) {
                const image = element('img', 'f1-stop-photo');
                image.src = `images/drivers/${asset}right.webp`;
                image.alt = '';
                image.loading = 'lazy';
                identity.append(image);
            }
            identity.append(element('span', '', `${stop.driver} · lap ${stop.lap || '—'}`));
            row.append(identity);
            row.append(element('strong', '', `${stop.seconds.toFixed(3)}s`));
            list.append(row);
        });
        fastest.append(list);
        fastest.append(element('p', 'f1-data-note', 'Recorded pit stop durations may include time in the pit lane and are not necessarily stationary tyre-change times.'));
        wrapper.append(fastest);
        content.replaceChildren(wrapper);
    }

    function lapTime(seconds) {
        if (!Number.isFinite(Number(seconds))) return 'Time unavailable';
        const value = Number(seconds);
        return `${Math.floor(value / 60)}:${(value % 60).toFixed(3).padStart(6, '0')}`;
    }

    function labHeading(data, subtitle) {
        const head = element('div', 'f1-lab-head');
        head.append(element('p', 'f1-data-eyebrow', `${data.race?.year || ''} / ${data.race?.circuit || 'Latest completed race'}`));
        head.append(element('h3', 'f1-data-title', data.race?.name || 'Latest completed race'));
        head.append(element('p', 'f1-data-detail', subtitle));
        return head;
    }

    function comparisonRows(drivers, mode) {
        const chart = element('div', 'f1-comparison-chart');
        const values = drivers.map(driver => mode === 'pace' ? driver.median : driver.bestLap).filter(Number.isFinite);
        const fastest = Math.min(...values);
        const spread = Math.max(0.5, Math.max(...values) - fastest);
        drivers.forEach((driver, index) => {
            const value = mode === 'pace' ? driver.median : driver.bestLap;
            const row = element('div', 'f1-comparison-row');
            row.append(element('span', 'f1-comparison-rank', mode === 'pace' ? String(index + 1).padStart(2, '0') : `P${driver.position}`));
            row.append(element('span', 'f1-comparison-name', driver.name || `Driver ${driver.number}`));
            const track = element('div', 'f1-comparison-track');
            const bar = element('span', 'f1-comparison-bar');
            bar.style.width = Number.isFinite(value) ? `${Math.max(32, 100 - ((value - fastest) / spread) * 65)}%` : '0';
            bar.style.backgroundColor = driver.colour || '#ef3338';
            track.append(bar);
            row.append(track);
            row.append(element('strong', 'f1-comparison-time', Number.isFinite(value) ? lapTime(value) : '—'));
            chart.append(row);
        });
        return chart;
    }

    function renderPace(data) {
        const list = element('div', 'f1-data-list');
        list.append(labHeading(data, 'Fastest indicative race pace from the latest completed Grand Prix. Longer bars mean quicker median laps.'));
        if (data.drivers?.length) {
            const winner = data.drivers[0];
            list.append(element('p', 'f1-lab-highlight', `${winner.name} had the quickest sampled median: ${lapTime(winner.median)} across ${winner.laps} laps.`));
            list.append(comparisonRows(data.drivers, 'pace'));
        } else list.append(element('p', 'f1-message', 'There are not enough recorded laps for a pace comparison yet.'));
        list.append(element('p', 'f1-data-note', data.method));
        return list;
    }

    function renderQualifying(data) {
        const list = element('div', 'f1-data-list');
        list.append(labHeading(data, 'Jolpica qualifying classification, with Q1, Q2 and Q3 times.'));
        if (data.drivers?.length) {
            const podium = element('div', 'f1-quali-podium');
            const top = data.drivers.slice(0, 3);
            const sectorBests = [0, 1, 2].map(index => Math.min(...top.map(driver => driver.sectors?.[index]).filter(Number.isFinite)));
            top.forEach(driver => {
                const card = element('article', 'f1-quali-driver');
                card.style.setProperty('--driver-colour', driver.colour || '#ef3338');
                const head = element('div', 'f1-quali-driver-head');
                const asset = driverAssets[driver.driverId];
                if (asset) {
                    const photo = element('img', 'f1-quali-photo');
                    photo.src = `images/drivers/${asset}right.webp`;
                    photo.alt = '';
                    photo.loading = 'lazy';
                    head.append(photo);
                }
                const identity = element('div', 'f1-quali-identity');
                identity.append(element('span', 'f1-quali-rank', `P${driver.position} · #${driver.number}`), element('h4', '', driver.name), element('strong', '', lapTime(driver.bestLap)));
                head.append(identity);
                card.append(head);
                const phases = element('div', 'f1-quali-phases');
                ['Q1', 'Q2', 'Q3'].forEach((phase, index) => phases.append(element('span', '', `${phase} ${Number.isFinite(driver.phases?.[index]) ? lapTime(driver.phases[index]) : '—'}`)));
                card.append(phases);
                const sectors = element('div', 'f1-quali-sectors');
                if (driver.sectors?.length === 3) {
                    driver.sectors.forEach((seconds, index) => {
                        const sector = element('div', 'f1-quali-sector');
                        if (Math.abs(seconds - sectorBests[index]) < 0.001) sector.classList.add('is-fastest');
                        const delta = Math.max(0, seconds - sectorBests[index]);
                        sector.append(element('span', 'f1-quali-sector-label', `S${index + 1}`));
                        const track = element('span', 'f1-quali-sector-track');
                        const fill = element('span', 'f1-quali-sector-fill');
                        fill.style.width = `${Math.max(35, 100 - delta * 180)}%`;
                        track.append(fill);
                        sector.append(track, element('strong', '', `${seconds.toFixed(3)}s`));
                        sectors.append(sector);
                    });
                    if (Number.isFinite(driver.topSpeed)) card.append(element('span', 'f1-quali-speed', `Speed trap ${driver.topSpeed} km/h`));
                } else {
                    sectors.append(element('p', 'f1-quali-unavailable', 'Matched sector timing unavailable for this lap.'));
                }
                card.append(sectors);
                podium.append(card);
            });
            list.append(podium);
            list.append(comparisonRows(data.drivers, 'qualifying'));
        } else list.append(element('p', 'f1-message', 'Qualifying results are not available for this race yet.'));
        list.append(element('p', 'f1-data-note', 'Mini sectors use OpenF1 timing only when the lap matches Jolpica’s listed qualifying time. Highlighted sectors are the quickest among the three drivers shown. Bar length shows their relative sector pace.'));
        return list;
    }

    function renderLatest() {
        const section = element('section', 'f1-live-brief');
        const heading = element('div', 'f1-live-heading');
        const intro = element('div', '');
        intro.append(element('p', 'f1-live-kicker', 'Latest F1 / current season'), element('h3', '', 'The grid at a glance.'));
        heading.append(intro, element('span', 'f1-live-source', 'Data: Jolpica F1'));
        const grid = element('div', 'f1-live-grid');
        grid.setAttribute('aria-live', 'polite');
        grid.append(element('p', 'f1-live-loading', 'Loading the latest race and standings…'));
        section.append(heading, grid);
        window.F1Latest?.load(grid);
        return section;
    }

    function renderTelemetry(data) {
        const list = element('div', 'f1-data-list');
        list.append(labHeading(data, 'A real speed trace from the pole sitter’s quickest qualifying lap.'));
        if (!data.trace?.length) {
            if (!data.sectorSpeeds?.length) {
                list.append(element('p', 'f1-message', 'Telemetry for this qualifying lap is not available yet.'));
                return list;
            }
            list.append(element('p', 'f1-lab-highlight', `${data.driver?.name || 'Pole sitter'} · ${lapTime(data.lap)} qualifying lap`));
            const chart = element('div', 'f1-sector-chart');
            const maximum = Math.max(...data.sectorSpeeds.map(item => item.speed));
            data.sectorSpeeds.forEach((item, index) => {
                const row = element('div', 'f1-sector-row');
                row.append(element('span', '', item.label));
                const track = element('div', 'f1-comparison-track');
                const bar = element('span', 'f1-comparison-bar');
                bar.style.width = `${item.speed / maximum * 100}%`;
                track.append(bar);
                row.append(track, element('strong', '', `${item.speed} km/h`));
                if (Number.isFinite(data.sectorTimes?.[index])) row.append(element('small', '', `${data.sectorTimes[index].toFixed(3)}s sector`));
                chart.append(row);
            });
            list.append(chart, element('p', 'f1-data-note', data.note));
            return list;
        }
        const maxSpeed = Math.max(...data.trace.map(point => point.speed));
        list.append(element('p', 'f1-lab-highlight', `${data.driver?.name || 'Pole sitter'} · ${lapTime(data.lap)} lap · ${maxSpeed} km/h peak in these samples`));
        const chart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chart.setAttribute('class', 'f1-telemetry-chart');
        chart.setAttribute('viewBox', '0 0 640 180');
        chart.setAttribute('preserveAspectRatio', 'none');
        chart.setAttribute('role', 'img');
        chart.setAttribute('aria-label', 'Speed across the sampled qualifying lap, from start to finish');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('points', data.trace.map((point, index) => `${(index / Math.max(1, data.trace.length - 1) * 620 + 10).toFixed(1)},${(160 - point.speed / Math.max(1, maxSpeed) * 135).toFixed(1)}`).join(' '));
        chart.append(line);
        list.append(element('p', 'f1-telemetry-label', 'Speed / km/h'), chart);
        const inputs = element('div', 'f1-inputs');
        [['Throttle', 'throttle'], ['Brake', 'brake']].forEach(([label, key]) => {
            const row = element('div', 'f1-input-row');
            row.append(element('span', '', label));
            const bars = element('div', `f1-input-bars f1-input-${key}`);
            data.trace.forEach(point => {
                const bar = element('i', '');
                bar.style.height = `${Math.max(2, Math.min(100, Number(point[key]) || 0))}%`;
                bars.append(bar);
            });
            row.append(bars);
            inputs.append(row);
        });
        list.append(inputs, element('p', 'f1-data-note', data.note));
        return list;
    }

    async function loadLabView(mode) {
        requestController?.abort();
        const controller = new AbortController();
        requestController = controller;
        const shell = element('div', 'f1-lab-shell');
        const nav = element('div', 'f1-lab-tabs');
        [['latest', 'Latest F1'], ['pace', 'Race pace'], ['qualifying', 'Qualifying'], ['telemetry', 'Telemetry']].forEach(([value, label]) => {
            const button = element('button', '', label);
            button.type = 'button';
            button.setAttribute('aria-pressed', String(value === mode));
            button.addEventListener('click', () => loadLabView(value));
            nav.append(button);
        });
        const result = element('div', 'f1-lab-result');
        result.append(element('p', 'f1-message', 'Loading completed-session data…'));
        shell.append(nav, result);
        content.replaceChildren(shell);
        updated.textContent = '';
        if (mode === 'latest') {
            result.replaceChildren(renderLatest());
            return;
        }
        try {
            const response = await fetch(`/api/f1-lab?view=${mode}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Race Lab data unavailable');
            const payload = await response.json();
            if (controller.signal.aborted || !dialog.open) return;
            result.replaceChildren(mode === 'pace' ? renderPace(payload.data) : mode === 'qualifying' ? renderQualifying(payload.data) : renderTelemetry(payload.data));
            const stamp = new Date(payload.generatedAt);
            if (Number.isFinite(stamp.getTime())) updated.textContent = `${payload.source} · Data refreshed ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(stamp)}`;
        } catch (error) {
            if (error.name === 'AbortError') return;
            const retry = element('button', 'f1-retry', 'Try again');
            retry.type = 'button';
            retry.addEventListener('click', () => loadLabView(mode));
            result.replaceChildren(element('p', 'f1-message', 'Race Lab data is temporarily unavailable.'), retry);
        }
    }

    async function loadView(view) {
        if (!Object.hasOwn(titles, view)) return;
        requestController?.abort();
        const controller = new AbortController();
        requestController = controller;
        title.textContent = titles[view];
        tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.f1Tab === view)));
        if (view === 'lab') {
            loadLabView('latest');
            return;
        }
        updated.textContent = '';
        message('Loading F1 data…');

        try {
            const response = await fetch(`/api/f1?view=${encodeURIComponent(view)}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('F1 data is temporarily unavailable.');
            const payload = await response.json();
            if (controller.signal.aborted || !dialog.open) return;
            if (view === 'calendar') renderCalendar(payload.data);
            else if (view === 'form') renderForm(payload.data);
            else renderPitStops(payload.data);
            const fetched = new Date(payload.generatedAt);
            if (Number.isFinite(fetched.getTime())) updated.textContent = `Data refreshed ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(fetched)}`;
        } catch (error) {
            if (error.name === 'AbortError') return;
            const note = element('p', 'f1-message', 'F1 data is temporarily unavailable. Please try again.');
            const retry = element('button', 'f1-retry', 'Try again');
            retry.type = 'button';
            retry.addEventListener('click', () => loadView(view));
            content.replaceChildren(note, retry);
        }
    }

    cards.forEach(card => card.addEventListener('click', () => {
        opener = card;
        if (!dialog.open) {
            dialog.showModal();
            document.body.classList.add('f1-dialog-open');
        }
        loadView(card.dataset.f1View);
    }));

    tabs.forEach(tab => tab.addEventListener('click', () => loadView(tab.dataset.f1Tab)));
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
        requestController?.abort();
        document.body.classList.remove('f1-dialog-open');
        const target = opener && opener.getAttribute('aria-hidden') !== 'true' ? opener : folderToggle;
        target.focus({ preventScroll: true });
    });
})();
