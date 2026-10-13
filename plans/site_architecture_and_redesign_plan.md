# Tactical CMYK Site Architecture & Page Modernization Plan

## 1. Overview
The current [`index.html`](index.html) spans ~1,885 lines containing over 1,050 lines of embedded CSS and nearly 500 lines of inline JavaScript. By modularizing styles and scripts, we establish a clean, forward-looking architecture that allows all pages ([`projects.html`](projects.html), [`blog.html`](blog.html), [`contact.html`](contact.html), and [`tools/index.html`](tools/index.html)) to share the identical "tactical CMYK" design system, theme persistence, title bar colophon, and drawer navigation.

---

## 2. Directory Architecture & Clean URL Routing

For deployment on `derkyzer.com` via GitHub Pages, structuring routes as subfolders with `index.html` files provides clean, canonical URLs without `.html` extensions:
- `/` -> [`index.html`](index.html)
- `/projects/` -> `projects/index.html`
- `/blog/` -> `blog/index.html`
- `/contact/` -> `contact/index.html`
- `/tools/` -> [`tools/index.html`](tools/index.html)

### Target File Tree
```text
.
├── index.html
├── projects/
│   └── index.html
├── blog/
│   └── index.html
├── contact/
│   └── index.html
├── tools/
│   └── index.html
└── assets/
    ├── css/
    │   ├── theme.css        <-- CMYK tokens, Weber luminance, reset, fonts
    │   ├── components.css   <-- Header title-bar, drawer tray, tech panels, glow borders, footer
    │   └── pages/           <-- Specific page overrides
    │       ├── home.css
    │       ├── projects.css
    │       ├── blog.css
    │       ├── contact.css
    │       └── tools.css
    └── js/
        ├── core.js          <-- Theme toggle (dark/light), sound effects, drawer tray
        └── pages/           <-- Page-specific logic (RSS fetcher, GitHub API, 3D radar ring)
            ├── home.js
            ├── projects.js
            ├── blog.js
            ├── contact.js
            └── tools.js
```

---

## 3. Shared Design System Tokens
- **Calibrated CMYK Palette**:
  - Dark Mode: Cyan `#00FFFF`, Magenta `#FF00FF`, Yellow `#FFFF00`, Key Black `#050505`
  - Light Mode: Cyan `#008282`, Magenta `#b50085`, Yellow `#8f6e00`
- **Weber Stepped Luminance**: 5-step calibrated gray ramps
- **Tactical Aesthetic Elements**:
  - Grid background (24px by 24px)
  - Micro-colophons & telemetry tags (`SYS.ONLINE`, `FREQ: 144.200 MHz`)
  - Chromatic aberration hover states
  - Tech panels with corner brackets and glow borders
  - Monospace accents (`JetBrains Mono`) paired with `Inter`

---

## 4. Page Modernization Specifications

1. **Home (`/`)**:
   - Streamlined [`index.html`](index.html) referencing external CSS and JS.
   - Retains all existing modules (Hero, MOD.01 Logic, MOD.02 Kinetic, MOD.03 Artifacts, MOD.04 Transmission).

2. **Projects (`/projects/`)**:
   - Replaces old generic gray grid with tactical equipment racks (`MODULE // REPO`).
   - Fetches GitHub API repositories for user `derkyzer` with CMYK language badges, star counts, and tech specs.

3. **Blog (`/blog/`)**:
   - Upgrades Substack RSS reader to look like incoming tactical field transmissions (`TRANSMISSION // LOG`).
   - Clean date badges, CMYK excerpt borders, and responsive grid layout.

4. **Contact (`/contact/`)**:
   - Integrates 3D interactive ring / radar array directly into the tactical dark room layout.
   - Restyles Formspree communication modal into a tactical comms uplink terminal.

5. **Tools (`/tools/`)**:
   - Restyles existing folder tree and tool cards to use tactical borders, JetBrains Mono tags, and CMYK hover states.
   - Retains automatic GitHub API directory explorer.

---

## 5. Execution Steps
- **Step 1**: Modularize [`index.html`](index.html) into `assets/css/` and `assets/js/`.
- **Step 2**: Create shared `theme.css` and `components.css`.
- **Step 3**: Convert [`projects.html`](projects.html), [`blog.html`](blog.html), [`contact.html`](contact.html) into directory-based `index.html` structure.
- **Step 4**: Apply the tactical CMYK UI to each subpage.
- **Step 5**: Test theme synchronization and cross-navigation.
