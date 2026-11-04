# Adewale Adeogun — Software Engineering Portfolio

[Live site](https://adewalesportfolio.vercel.app/) · [Resume](Adewale_Adeogun_Software_Engineer.pdf)

A portfolio covering software engineering, automation, data work, and interactive F1 analysis. The site is static HTML, CSS, and JavaScript with Vercel serverless APIs for Spotify, WakaTime, and F1 data.

## Project layout

- `index.html`, `styles.css`, and the other root CSS/JS files: portfolio interface
- `api/`: Vercel serverless endpoints
- `images/` and `fonts/`: site assets
- `scripts/`: backend tests and local integration helpers
- `.env.example`: names of required local environment variables; real values stay in ignored `.env.local`

Deploy this repository from its root directory in Vercel. Run the F1 backend tests with `node --test scripts/f1.test.js scripts/f1-lab.test.js`.
## F1 Intelligence

The F1 folder opens a small data lab backed by the public [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) and historical [OpenF1](https://openf1.org/docs/) data. The current features need no API key or additional environment variables.

- **Calendar** shows up to four upcoming races and converts confirmed start times to the visitor's local time.
- **Driver form** joins the championship's top three drivers to their five most recent recorded race results. Missing driver histories are handled individually.
- **Race Lab** graphs indicative clean-lap race pace, official qualifying order, and qualifying telemetry from the most recent completed race. When OpenF1's full car trace is unavailable, it shows recorded speed-trap readings and sector times instead.
- **Latest F1** summarizes the most recent race winner, championship leader, reigning champion from the latest completed season, and next Grand Prix in a compact graphical panel.

`api/f1.js` exposes `GET /api/f1?view=calendar`, `view=form`, and `view=latest` (the legacy `pitstops` endpoint remains available). The endpoint validates the requested view, sends Jolpica a named user agent, sets request timeouts, normalizes its responses, and avoids caching failed requests. Successful responses are cached on Vercel's edge for 15 minutes, with a one-hour stale revalidation window; partial driver histories receive a shorter cache. Each response includes the time it was generated.

`api/f1-lab.js` exposes `GET /api/f1-lab?view=pace|qualifying|telemetry`. It selects the most recent completed OpenF1 race, excludes sessions within OpenF1's paid live window, returns chart-sized summaries, and caches successful responses. `scripts/f1-lab.test.js` verifies the pace filter, qualifying order, and route validation. `scripts/f1-lab-smoke.mjs` can check the public upstream APIs manually. OpenF1 historical data is free without authentication; live sessions need an OpenF1 subscription. FastF1 is a separate Python analysis library, and Sportradar requires a product-enabled API key; neither is required by the current deployed lab.

The folder and dialog are implemented in `index.html`, `script.js`, `f1-lab.js`, `play-console-fixes.css`, and `f1-enhancements.css`. The dialog includes an attribution link and handles empty, loading, and unavailable data. Jolpica's [terms of use](https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md) license its data under CC BY-NC-SA 4.0 and specify non-commercial use.

The enhanced view uses country flag SVGs from the public-domain [country-flags project](https://github.com/hampusborgos/country-flags). The racing-style typography is Titillium Web under the SIL Open Font License; its license is in `fonts/OFL.txt`. The extracted Formula 1 proprietary typeface is intentionally not bundled. Driver portraits currently come from the supplied Formula1.com archive; verify publication rights before using them on a public site.

Run the backend checks with Node.js 20 or newer:

```sh
node --test scripts/f1.test.js scripts/f1-lab.test.js
```

Run the site and serverless endpoints locally using `npx vercel dev`.

