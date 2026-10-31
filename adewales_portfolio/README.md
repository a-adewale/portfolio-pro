# Adewales Portfolio

## Live Spotify setup

The Spotify card shows the account's currently playing track. When nothing is
playing, it falls back to the most recently played track. Spotify credentials
are used only by `api/spotify.js`; they are never sent to the browser.

### 1. Create the Spotify app

1. Sign in at https://developer.spotify.com/dashboard with the Premium account.
2. Create an app and copy its **Client ID** and **Client secret**.
3. In the app settings, add this exact Redirect URI:

   `http://127.0.0.1:8888/callback`

The integration requests only these read-only scopes:

- `user-read-currently-playing`
- `user-read-recently-played`

### 2. Generate the refresh token once

Node.js 20 or newer is required for the setup helper.

1. Copy `.env.example` to `.env.local`.
2. Put the Client ID and Client secret in `.env.local`.
3. From this directory, run `npm run spotify:auth`.
4. Open the printed Spotify authorization URL and approve access.
5. Copy the refresh token printed in the terminal into `.env.local`.

Do not commit `.env.local`. It is already excluded by `.gitignore`.

### 3. Deploy on Vercel

Import this directory as a Vercel project and add these three environment
variables in Project Settings > Environment Variables:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

Deploy again after saving the variables. `SPOTIFY_REDIRECT_URI` is needed only
by the local authorization helper and does not need to be deployed.

For local page development, use `vercel dev` rather than opening `index.html`
directly, because `/api/spotify` is a serverless route.

### Files used by the integration

- `api/spotify.js` — secure serverless endpoint and Spotify fallback logic
- `scripts/get-spotify-refresh-token.js` — one-time OAuth helper
- `.env.example` — safe environment-variable template
- `vercel.json` — deployment and API security-header configuration
- `index.html`, `styles.css`, and `script.js` — listening-card interface

A first original portfolio build inspired by:
- a structured, readable engineering portfolio flow
- dark interactive dashboard-style cards
- a typewriter welcome screen

## Files

- index.html
- styles.css
- script.js
- images/

## Included interactions

- Typewriter welcome screen with blinking caret and roll-in message
- Sticky desktop side navigation
- Mobile slide-out navigation
- Interactive tilt cards without cursor glare
- Play cards for palette, font, vibes, and focus mode
- Project filters
- Project detail modal
- Live clock card
- Toast notifications
- Responsive layout

## Notes

Replace placeholder contact links in `index.html`:
- gmail
- GitHub URL
- LinkedIn URL


## v2 changes

- Loading/typewriter screen now waits for user click before entering.
- Typewriter text is slower, smaller, and includes trailing dots.
- Added white palette mode.
- Rewrote hero headline to be more professional.
- Metric numbers animate upward when visible.
- Replaced single local-time note with Local, UK, and US clocks.


## v3 changes

- Changed name to Adewale ADEOGUN(formatting).
- Updated email, GitHub, and LinkedIn links.
- Replaced social text links with icons.
- Added animated hover ring around social icons.
- Removed white from palette card and added a dedicated white-mode toggle.
- Added rolling applications/tool strip.
- Added Michael-style large email CTA.
- Widened content layout to use more screen space.


## v4 changes

- Moved dark/white mode toggle to the right.
- Added Naija Pidgin toggle.
- Improved professional contact CTA with email label.
- Made GitHub, LinkedIn, and Gmail icons visible in dark mode.
- Adjusted sidebar left position and icon spacing.
- Replaced applications description with professional wording.
- Removed interactivity from the rolling applications carousel.
- Blended carousel edges into dark/white backgrounds.
- Replaced P logo with brown-skinned developer emoji.
- White mode now supports palette changes.


## v5 changes

- Removed the visible line above the Applications section.
- Improved responsiveness for tablet and mobile.
- Reworked mobile top controls so White Mode, Naija Pidgin, and hamburger fit better.
- Improved mobile card grids, hero text sizing, application carousel, contact section, and sidebar menu.


## v6 changes

- Rebuilt the welcome page into a Matrix-style sequence.
- First types "welcome neo ...", then asks what to call the visitor.
- Visitor enters their name, then sees "Welcome [name] to my compendium..."
- The visitor clicks Enter compendium before the welcome screen slides left.
- Added mobile homepage brand `touchecodes` so the identity is visible before opening the hamburger.
- Added a build progress bar that animates from 0% to 80%.
- Removed the visible line/indicator from the Applications item in the menu.


## v7 changes

- Welcome screen now shows only "welcome neo ..." first.
- Removed the "System access" text from the intro screen.
- Added a 2-second delay before asking for the visitor's name.
- After name entry, it returns to the previous build-lab style: "Welcome [name] to my build lab".
- Added "learn → test → break → fix → repeat" under the build-lab welcome.
- Made the progress bar larger, clearer, and professional on desktop/mobile.
- Removed the unwanted underline from Applications while keeping it styled like the other menu items.


## v8 changes

- Fixed the final welcome text so it no longer cuts off.
- Made the final welcome wrap professionally on desktop and mobile.
- Made the progress bar more visible and better balanced.
- Made the mobile homepage show `Adewale ADEOGUN`.
- Moved `touchecodes` into the hamburger/sidebar menu on mobile.
- Hard-reset the side navigation so Applications cannot show an extra underline or wrong line.
- Improved spacing around mobile controls and menu.


## v9 changes

- Removed the extra `touchecodes` pill from the hamburger menu.
- Kept the large `touchecodes` identity inside the mobile hamburger menu.
- Restyled the mobile homepage name so `Adewale ADEOGUN` looks like a proper brand, not a small tag.
- Forced the bottom Gmail CTA to stay on one line on mobile.


## v10 changes

- Removed the extra space in `welcome neo...`.
- Removed the repeated visible label under the name question.
- Added a constant blinking cursor while waiting for the visitor to enter their name.
- Added `images/dev-favicon.svg` so the browser tab no longer uses the old V-looking icon.
- Kept `Welcome [name] to my build lab` on one line on desktop.
- Made the desktop left sidebar scrollable and tightened spacing so the full menu can be seen.
- Added scroll-direction behaviour on mobile: name and top toggles fade while scrolling down and return when scrolling up.
- The beginning sequence lives in:
  - HTML: `index.html` inside `.welcome-screen`
  - CSS: `styles.css` Matrix/welcome sections
  - JS: `script.js`, functions `typeInto()` and `runMatrixWelcome()`


## v11 changes

- Removed desktop sidebar scrolling(made sense in my head).
- Reduced desktop left sidebar sizes/spacing so the full menu fits the viewport.
- Moved the blinking cursor to the end of `or what should I call you, traveller...`.
- Removed the blinking cursor from underneath the name input.
- Increased the build progress target from 80% to 90%.


## v12 changes

- Corrected the actual compressed JavaScript progress target from 80% to 90%.
- Mobile social icons now illuminate when the hamburger menu opens.
- Added rotating rings, glow, and staggered pulse animation to Email, GitHub, and LinkedIn icons.


## v13 changes

- Updated intelligent automation experience from 8+ to 4+ years.
- Updated healthcare automation experience from 6+ to 3+ years.
- Replaced the unverifiable $3.4M savings claim with the supported 25+ page extraction/restructuring project metric.
- Replaced the strong rotating social-icon effect with a subtler breathing glow.
- Rebuilt the progress bar with one continuous accent gradient so it no longer looks broken in the middle.


## v14 changes

- Fixed the Applications line at its actual source.
- The Applications label was wrapped in a second `<span>`, and the generic navigation span CSS turned it into another horizontal line.
- Added separate `.nav-line` and `.nav-label` elements to every menu item.
- Restored the stronger rotating social-icon ring and pulse design.
- Replaced the tab favicon with a clearer custom brown-skinned developer-with-glasses-and-laptop graphic.
- Enlarged the developer emoji beside the portfolio name.


## v15 changes

- Removed glow, shadow, and filter effects from the left navigation.
- Left navigation now only extends its marker line and boldens the selected/hovered label.
- Restored the original compact developer emoji beside the portfolio name.
- Kept the clearer custom developer-with-glasses-and-laptop icon for the browser tab.


## v16 changes

- The mobile `Adewale ADEOGUN` brand now sits behind the opened hamburger menu.
- The mobile brand is hidden while the navigation drawer is open.
- Replaced the three external SVG image files in the sidebar with inline SVG icons.
- Inline SVG icons are no longer affected by visited-link or browser page-restoration behaviour.
- Added `pageshow`, `focus`, and `visibilitychange` state restoration so icons remain visible after returning to the portfolio.
