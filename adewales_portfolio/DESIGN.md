# Portfolio Design System

## Play Console

The Play Console uses one authoritative four-column desktop grid and one single-column mobile grid.

### Desktop (1051px and wider)

- Four equal columns.
- Two rows, each 220px high.
- Status spans columns 1–2; Spotify is column 3; Typeface is column 4.
- Palette, Vibes, F1 Intelligence, and Contrast occupy columns 1–4 on row 2.
- Grid gap: 12px. Outer grid padding: 12px.
- Card padding: 20px. Card radius: 18px.

### Tablet (561px–1050px)

- Two equal columns.
- Status and Spotify span both columns.
- Interactive cards occupy one column each.
- Cards size to content with a minimum height of 220px.

### Mobile (560px and narrower)

- One column.
- Grid gap: 10px. Outer grid padding: 8px.
- Live cards have a minimum height of 260px.
- Interactive cards have a minimum height of 250px.
- All text and actions align to the left.

### Card rhythm

Every interactive card follows: label → fixed visual zone → title → description → state/action.

- Label: 0.68rem uppercase.
- Visual zone: 56px high.
- Title spacing: 12px above, 5px below.
- Description: 0.78rem desktop; 0.95rem mobile.
- Cursor action: bottom-right, 24px.
- Text links: bottom-left with consistent pill padding.

### Motion

- Vibes owns ambient background light and all looping Play Console animation.
- States: Full ambient, Motion only, Still.
- `prefers-reduced-motion` disables looping animation.

## Mobile navigation

- Hamburger has no visible container, border, shadow, or background.
- Icon artwork is 36px square and theme-aware.
- White artwork is used in dark mode; black artwork is used in white mode.
- The name is visible only at the top on mobile. Theme and language fade while scrolling down and return when scrolling up.
