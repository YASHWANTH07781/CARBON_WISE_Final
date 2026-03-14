import React, { useState, useEffect } from "react";
import SBadge   from "../components/SBadge";
import Loading  from "../components/Loading";
import FlagList from "../components/FlagList";
import { D3BubbleGrid } from "../components/Charts";
import { STATE_GRIDS, WLTP_CORRECTION, EEA_TARGETS, apiFetch } from "../utils";

const CARDS = [
  {
    n: "01", icon: "⚡", title: "EV on Dirty Grid",
    body: "An EV on coal (>0.85 kgCO₂/kWh) can generate operational emissions rivalling a hybrid. \"Zero emission\" describes only the tailpipe — not the grid.",
    sev: "HIGH",
  },
  {
    n: "02", icon: "📊", title: "Exceeds EEA Target",
    body: "EU 2025 fleet CO₂ target: 95 g/km for ICE. Vehicles exceeding 142 g/km (150% of target) while marketed as efficient are immediately flagged.",
    sev: "HIGH",
  },
  {
    n: "03", icon: "🔬", title: "EPA vs WLTP Gap",
    body: "EPA test cycles are 8–20% more optimistic than WLTP. Manufacturers advertise EPA figures; real-world performance matches the stricter European standard.",
    sev: "MEDIUM",
  },
  {
    n: "04", icon: "🏭", title: "High Mfg Footprint",
    body: "Hybrid battery production can exceed 8,000 kg CO₂ — the very cost supposedly offset by fuel savings. Rarely disclosed in manufacturer marketing.",
    sev: "MEDIUM",
  },
  {
    n: "05", icon: "🌱", title: "Mild Hybrid Label",
    body: "A \"mild hybrid\" badge on a vehicle with near-ICE CO₂ output (>144 g/km) misuses the hybrid label to imply green credentials it doesn't deliver.",
    sev: "LOW",
  },
];

export default function GreenwashPage() {
  const [vtype,      setVtype]      = useState("ICE");
  const [co2,        setCo2]        = useState(110);
  const [gwState,    setGwState]    = useState("MAHARASHTRA");
  const [gkm,        setGkm]        = useState(40);
  const [flags,      setFlags]      = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [makes,      setMakes]      = useState([]);
  const [make,       setMake]       = useState("");
  const [models,     setModels]     = useState([]);
  const [model,      setModel]      = useState("");
  const [modelsLoading, setModelsLoading] = useState(false);

  // Re-fetch makes when vtype changes
  useEffect(() => {
    setMake(""); setModel(""); setModels([]);
    apiFetch(`/api/makes?fuel_type=${vtype}`).then(d => {
      if (d) setMakes(d.makes || []);
    });
  }, [vtype]);

  // Re-fetch models when make changes
  useEffect(() => {
    setModel(""); setModels([]);
    if (!make) return;
    setModelsLoading(true);
    apiFetch(`/api/models?make=${encodeURIComponent(make)}&fuel_type=${vtype}`).then(d => {
      if (d) setModels(d.models || []);
      setModelsLoading(false);
    });
  }, [make, vtype]);

  const run = async () => {
    setLoading(true);
    let data = null;
    if (model) {
      data = await apiFetch(`/api/calculate?model=${encodeURIComponent(model)}&state=${gwState}&daily_km=${gkm}&years=10`);
    }
    if (data?.greenwash_flags) {
      setFlags(data.greenwash_flags);
      setCalcResult(data);
    } else {
      // Client-side demo flags
      const gf = STATE_GRIDS[gwState] || 0.82;
      const f = [];
      if (vtype === "EV" && gf >= 0.85)
        f.push({ level: "HIGH", code: "DIRTY_GRID_EV", title: "EV on Coal Grid",
          detail: `Grid: ${gf.toFixed(2)} kgCO₂/kWh. Operational emissions rival a hybrid in this region. "Zero emission" refers to the tailpipe only.` });
      if (vtype === "ICE" && co2 > 95 * 1.5)
        f.push({ level: "HIGH", code: "EXCEEDS_EEA", title: "Exceeds EEA CO₂ Target",
          detail: `${co2} gCO₂/km vs EEA fleet target 95 gCO₂/km (EU 2025). This vehicle is 50%+ above the regulatory limit.` });
      if (vtype !== "EV" && co2 > 0) {
        const w = Math.round(co2 * WLTP_CORRECTION[vtype]);
        const eeaTarget = EEA_TARGETS[vtype] || 95;
        const gap = Math.round(w - co2);
        if (w > eeaTarget * 1.3 && gap > 10)
          f.push({ level: "MEDIUM", code: "WLTP_GAP", title: "EPA vs WLTP Discrepancy",
            detail: `EPA cycle: ${co2} g/km → WLTP real-world est: ${w} g/km (+${gap} g/km). Exceeds EEA target of ${eeaTarget} g/km by ${Math.round((w / eeaTarget - 1) * 100)}%.` });
      }
      if (vtype === "Hybrid" && co2 > 144)
        f.push({ level: "LOW", code: "MILD_HYBRID_LABEL", title: "Hybrid Label May Be Misleading",
          detail: `CO₂ (${co2} g/km) is close to conventional ICE. WLTP baseline for hybrids: 120 g/km.` });
      if (f.length === 0)
        f.push(null); // signal "clean"
      setFlags(f.filter(Boolean));
      setCalcResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      {loading && <Loading />}

      <div className="gw-hero">
        <div className="gw-tag">⚠ Greenwashing Detection Engine</div>
        <h1 className="gw-h1">The Art of<br /><em>Misleading</em><br />Green Claims.</h1>
        <p className="gw-sub">
          5-factor engine cross-referencing EPA data, EEA fleet targets, WLTP cycles, and real
          Indian grid intensity to expose misleading marketing.
        </p>
        <div className="sb-row" style={{ marginTop: "1.5rem" }}>
          <SBadge t="epa"  txt="EPA FuelEconomy.gov" />
          <SBadge t="eea"  txt="EEA Fleet CO₂ 2024" />
          <SBadge t="cea"  txt="CEA Grid V21.0" />
          <SBadge t="icct" txt="ICCT LCA 2021" />
        </div>
      </div>

      <div className="gw-cards">
        {CARDS.map((c, i) => (
          <div key={i} className="gwc">
            <div className="gwc-n">{c.n}</div>
            <div className="gwc-icon">{c.icon}</div>
            <div className="gwc-title">{c.title}</div>
            <div className="gwc-body">{c.body}</div>
            <div className="gwc-sev"><span className={`sev-pill sp-${c.sev}`}>{c.sev} RISK</span></div>
          </div>
        ))}
        <div className="gwc" style={{ background: "var(--ink)" }}>
          <div className="gwc-icon">🔍</div>
          <div className="gwc-title" style={{ color: "var(--paper)" }}>Live Checker</div>
          <div className="gwc-body" style={{ color: "rgba(245,242,236,.4)" }}>
            Test any vehicle against all 5 factors using real EPA + EEA data in the form below.
          </div>
        </div>
      </div>

      {/* LIVE CHECKER */}
      <div className="gw-checker">
        <div className="gw-checker-h">Live Greenwash Checker</div>
        <div className="gw-checker-sub">
          Filter by type → pick make → pick model from 49,580 EPA vehicles. Checks 5 factors against EEA targets + CEA grid.
        </div>
        <div className="gw-form-row">
          {/* Type */}
          <div>
            <label className="fl">Type</label>
            <select className="fs" value={vtype} onChange={e => setVtype(e.target.value)}>
              <option value="EV">⚡ Electric (EV)</option>
              <option value="Hybrid">♻️ Hybrid</option>
              <option value="ICE">⛽ ICE (Petrol/Diesel)</option>
            </select>
          </div>

          {/* Make */}
          <div>
            <label className="fl">Make <SBadge t="epa" txt="EPA DB" /></label>
            <select className="fs" value={make} onChange={e => setMake(e.target.value)}>
              <option value="">{makes.length ? "— Any Make —" : "⏳ Loading…"}</option>
              {makes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="fl">
              Model {make && models.length > 0 && <span style={{ fontSize: ".38rem", color: "var(--fog)" }}>({models.length})</span>}
            </label>
            <select className="fs" value={model} onChange={e => setModel(e.target.value)} disabled={!make || modelsLoading}>
              <option value="">
                {!make ? "← Pick make first" : modelsLoading ? "Loading…" : models.length ? "— Select Model —" : `No ${vtype} models here`}
              </option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* CO2 manual */}
          <div>
            <label className="fl">Tailpipe CO₂ (g/km)</label>
            <input className="fi" type="number" value={co2} min="0" max="600" onChange={e => setCo2(+e.target.value)} />
            <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: "2px" }}>Used if no model selected</div>
          </div>

          {/* State */}
          <div>
            <label className="fl">State <SBadge t="cea" txt="CEA" /></label>
            <select className="fs" value={gwState} onChange={e => setGwState(e.target.value)}>
              {Object.keys(STATE_GRIDS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Daily km */}
          <div>
            <label className="fl">Daily km</label>
            <input className="fi" type="number" value={gkm} min="1" max="500" onChange={e => setGkm(+e.target.value)} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn-blk" style={{ width: "100%", padding: ".63rem 1rem" }} onClick={run}>
              Analyse →
            </button>
          </div>
        </div>

        {flags !== null && (
          <div style={{ marginTop: "1rem" }}>
            <FlagList flags={flags} result={calcResult} />
          </div>
        )}
      </div>

      {/* EEA STANDARDS TABLE */}
      <div style={{ padding: "2rem 3rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".8rem" }}>
          WLTP & EEA Reference Data <SBadge t="eea" txt="EEA 2024" />
        </div>
        <table className="stbl">
          <thead>
            <tr><th>Type</th><th>EEA Fleet Target</th><th>WLTP Baseline</th><th>WLTP Correction</th><th>Flag Threshold</th></tr>
          </thead>
          <tbody>
            <tr><td>EV</td><td>0 g/km tailpipe</td><td>0 g/km</td><td>×1.20</td><td>Grid ≥ 0.85 kgCO₂/kWh</td></tr>
            <tr><td>Hybrid</td><td>100 g/km</td><td>120 g/km</td><td>×1.12</td><td>Mfg &gt; 8,000 kg CO₂</td></tr>
            <tr><td>ICE Petrol/Diesel</td><td>95 g/km</td><td>170 g/km</td><td>×1.08</td><td>&gt;142 g/km (150% of target)</td></tr>
          </tbody>
        </table>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".5rem", color: "var(--fog)", marginTop: ".6rem" }}>
          Source: EEA Fleet CO₂ Monitoring 2024 · WLTP EU Regulation 2017/1151 · IPCC 2006 Fuel Factors
        </div>
      </div>

      {/* D3 BUBBLE GRID */}
      <div style={{ padding: "0 3rem 3rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".5rem" }}>
          India State Grid CO₂ Intensity — D3.js Force Layout <SBadge t="cea" txt="CEA V21.0" />
        </div>
        <D3BubbleGrid />
        <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", color: "var(--fog)", marginTop: ".45rem" }}>
          Bubble size = intensity (kgCO₂/kWh). Green = clean grid, Red = coal-heavy. Data: CEA CO₂ Baseline Database V21.0
        </div>
      </div>
    </div>
  );
}
