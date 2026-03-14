# Carbon-Wise v5.0 — Lifecycle Vehicle Carbon Engine

**React 18 · D3.js v7 · Chart.js 4.4 · Python Flask · Node.js**

Merged from `carbon-wise-react` (proper React project scaffold) +
`carbon-wise-v5-bugfix` (complete JS logic + backend).

---

## Quick Start

```bash
# Terminal 1 — Flask backend (port 5000)
cd backend
pip install -r ../requirements.txt
python app.py

# Terminal 2 — React dev server (port 3000, hot-reload)
npm install
npm start
```

Open **http://localhost:3000** — API calls proxy automatically to port 5000
via the `"proxy"` field in `package.json`.

Or use the unified launcher:
```bash
chmod +x start.sh && ./start.sh
```

---

## Project Structure

```
carbon-wise/
│
├── public/
│   └── index.html              ← NO CDN scripts — React injects everything
│
├── src/
│   ├── index.js                ← ReactDOM.createRoot() entry point
│   ├── App.js                  ← Main router (5 pages)
│   ├── styles.css              ← All CSS (extracted from v5 HTML verbatim)
│   ├── utils.js                ← Shared constants + helpers (STATE_GRIDS, apiFetch…)
│   │
│   ├── components/
│   │   ├── SBadge.js           ← Source badge (EPA / EEA / CEA / ICCT)
│   │   ├── Loading.js          ← Loading overlay spinner
│   │   ├── Charts.js           ← BarChart, StackedBarChart, LineChart,
│   │   │                          D3Treemap, D3Donut, D3Breakeven, D3BubbleGrid
│   │   ├── NutritionLabel.js   ← Carbon Nutrition Label per vehicle
│   │   ├── ULPanel.js          ← Upfront vs Long-Term panel
│   │   ├── FlagList.js         ← Greenwash alert list (all 3 claim variants)
│   │   └── VehicleSlot.js      ← Make / model selector card
│   │
│   └── pages/
│       ├── HomePage.js         ← Hero + animated slides + ticker + feature grid
│       ├── ComparePage.js      ← Full comparison engine (all charts + tables)
│       ├── GreenwashPage.js    ← 5-factor greenwash detector + bubble grid
│       ├── PaybackPage.js      ← EV carbon payback + D3 breakeven curve
│       └── MethodologyPage.js  ← Data provenance + formula + tech stack
│
├── backend/
│   ├── app.py                  ← Flask REST API (11 endpoints)
│   ├── carbon_engine.py        ← LCA calculation engine (pandas)
│   └── data/
│       ├── vehicles.csv        ← 49,580 EPA vehicles, 84 columns
│       ├── state_grid_factors.csv ← 35+ India CEA grid factors
│       ├── manufacturing.json
│       ├── efficiency.json
│       ├── electricity.json
│       └── fuel.json
│
├── server/
│   └── server.js               ← Node.js production server (serves build/ + proxies /api/*)
│
├── package.json                ← react@18, chart.js@4.4, d3@7.8 — npm install
├── requirements.txt            ← Flask + pandas + flask-cors
└── start.sh                    ← Unified launcher (Flask + React dev server)
```

---

## Why This Is a Proper React Project

| Old CDN version (`v5fix/frontend/index.html`) | This version |
|---|---|
| `<script src="react.cdn.js">` loaded at runtime | `"react": "^18.2.0"` in `package.json` |
| `<script type="text/babel">` transpiles in browser | `npm run build` → optimised production bundle |
| 1,398-line single HTML file | 15 separate `.js` component files |
| No `npm install` step | `npm install` → proper dependency tree |
| Cannot deploy to Vercel / Netlify / Render | `npm run build` → deployable `build/` folder |

---

## npm Scripts

| Command | What it does |
|---|---|
| `npm start` | React dev server on :3000 with hot-reload |
| `npm run build` | Production bundle → `build/` folder |
| `npm run server` | Node.js server serving `build/` + Flask proxy |
| `npm run backend` | Start Flask on port 5000 |

---

## Data Sources

| Badge | Source | Records |
|---|---|---|
| EPA | EPA FuelEconomy.gov | 49,580 vehicles · 84 columns |
| EEA | EEA Fleet CO₂ 2024 | Fleet targets · WLTP correction |
| CEA | India CEA V21.0 | 35+ state grid factors |
| ICCT | ICCT LCA 2021 | Manufacturing benchmarks |
| IPCC | IPCC 2006 | Fuel emission factors |
