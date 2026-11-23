# Cubiko (React)

3x3 speedcubing timer, bot races and solve statistics. Same layout and look as CubeLab v5, rebuilt with React and Vite, installable as an offline app.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ (needed to test the PWA / offline mode)
```
Node 18+.

## Host on GitHub Pages
1. Create a repo and push this folder to the `main` branch.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml` and publishes `dist/`.

No repo-name config is needed: `vite.config.js` uses `base: './'` and the app routes with the URL hash (`#timer`, `#race`, …), so it works at `user.github.io/repo/` or a custom domain.

## Install as an app
Open the hosted site in Chrome/Edge/Safari and use **Install app** / **Add to Home Screen**. After the first load it works offline (fonts are bundled, nothing is fetched from a CDN). Updates install automatically on the next visit.

## Project structure
```
cubelab/
├─ index.html
├─ vite.config.js            Vite + React + PWA (manifest, service worker)
├─ package.json
├─ public/
│  ├─ favicon.svg
│  └─ icons/                 192, 512, maskable-512, apple-touch-icon
├─ .github/workflows/deploy.yml
└─ src/
   ├─ main.jsx               entry (fonts + styles)
   ├─ App.jsx                providers + hash router shell
   ├─ styles/
   │  ├─ style.css           your v5 stylesheet, unchanged
   │  └─ additions.css       solve details panel, backup dialogs, race options
   ├─ lib/                   plain JS, no React
   │  ├─ scramble.js  cube.js  stats.js  audio.js  confetti.js
   │  ├─ settingsConfig.js   defaults, accents, settings sanitising
   │  └─ backup.js           JSON backup, restore/merge, CSV export
   ├─ hooks/
   │  ├─ useSolveTimer.js    stopwatch + inspection state machine (Timer and Race share it)
   │  ├─ useRace.jsx         match state, bot, both race modes
   │  ├─ useSolves.jsx  useSettings.jsx  useToast.jsx  useHashRoute.js
   ├─ components/            Sidebar, CubeNet, StatsStrip, Toast, Controls,
   │                         ConfirmDialog, SolveDetail, ImportDialog
   └─ pages/                 TimerPage, RacePage, TrainerPage, StatisticsPage, SettingsPage
```

## New in this version
**Backup, restore, export** (Settings → Data & backup)
- *Download backup*: JSON with every solve, note and your settings.
- *Restore*: pick a backup file, then **Merge** (adds solves you don't have, matched by id) or **Replace**. Also reads a bare solve list. Settings restore is optional.
- *Export CSV*: date, time, penalty, final time, scramble, note. Opens in Excel/Sheets.
- The app asks the browser to keep its storage from being evicted, and shows when you last made a backup.

**Solve details**: click a row in the history. Shows the cube preview (even if previews are off in Settings), date, time, and the Ao5 and Ao12 as they were right after that solve, a Copy scramble button, a note, +2/DNF/Delete, and ‹ › (or arrow keys) to step through solves. Rows with a note get a small dot.

**Race options** (Settings → Race, and on the race setup screen)
- *Race mode*: **Take turns** (original: you, then the bot) or **Solve together** (the bot's timer starts the moment yours does).
- *Hide bot time*: the bot's clock shows dots while it solves; in Solve together, if it finishes first it shows "Finished" and its time is revealed when you stop.

## Data notes
- Storage keys are unchanged from v5 (`cubelab-solves-v1`, `cubelab-settings-v1`). The same origin keeps its data; a new domain starts empty, so move your data by restoring a backup (a bare solve list also works).
- Solves still live only in the browser. Back up now and then.
