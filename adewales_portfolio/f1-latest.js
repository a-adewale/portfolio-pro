(() => {
    function node(tag, className, value) {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (value !== undefined && value !== null) item.textContent = String(value);
        return item;
    }

    function card(label, value, detail, kind) {
        const item = node('article', `f1-live-item f1-live-${kind}`);
        item.append(node('p', 'f1-live-label', label), node('strong', 'f1-live-value', value), node('p', 'f1-live-detail', detail));
        return item;
    }

    async function load(grid) {
        try {
            const response = await fetch('/api/f1?view=latest', { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Latest F1 data unavailable');
            const { data, generatedAt } = await response.json();
            const nextDate = data.next?.date ? Date.parse(`${data.next.date}T${data.next.time || '12:00:00Z'}`) : NaN;
            const days = Number.isFinite(nextDate) ? Math.max(0, Math.ceil((nextDate - Date.now()) / 86400000)) : null;
            const race = card('Latest race / winner', data.lastRace?.winner || 'Awaiting result', data.lastRace?.name || 'No completed race yet', 'winner');
            if (data.lastRace?.podium?.length) {
                const podium = node('div', 'f1-live-podium');
                data.lastRace.podium.forEach((entry, index) => {
                    const position = node('span', `f1-live-podium-place f1-live-podium-${index + 1}`, `P${entry.position}`);
                    position.title = entry.name;
                    podium.append(position);
                });
                race.append(podium);
            }
            const leader = card('Championship leader', data.leader?.name || 'Standings pending', data.leader ? `${data.leader.points} points · ${data.leader.wins} wins` : 'Current season', 'leader');
            const champion = card('Reigning world champion', data.champion?.name || 'To be confirmed', data.champion ? `${data.champion.season} champion${data.champion.team ? ` · ${data.champion.team}` : ''}` : 'Last completed season', 'champion');
            const next = card('Next Grand Prix', data.next?.name || 'Calendar pending', days === null ? 'Date to be confirmed' : `${days} ${days === 1 ? 'day' : 'days'} to go · ${data.next.location}`, 'next');
            if (days !== null) next.prepend(node('span', 'f1-live-countdown', String(days).padStart(2, '0')));
            grid.replaceChildren(race, leader, champion, next);
            const source = grid.closest('.f1-live-brief')?.querySelector('.f1-live-source');
            const stamp = new Date(generatedAt);
            if (source && Number.isFinite(stamp.getTime())) source.textContent = `Jolpica F1 · Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(stamp)}`;
        } catch {
            grid.replaceChildren(node('p', 'f1-live-loading', 'Latest F1 data is temporarily unavailable. Please refresh to try again.'));
        }
    }

    window.F1Latest = { load };
})();
