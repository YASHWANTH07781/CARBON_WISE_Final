import React, { useState, useEffect, useCallback } from "react";
import SBadge        from "../components/SBadge";
import Loading       from "../components/Loading";
import NutritionLabel from "../components/NutritionLabel";
import ULPanel       from "../components/ULPanel";
import DataSourcesPanel from "../components/DataSourcesPanel";
import NormalizationBanner from "../components/NormalizationBanner";
import TradeoffChart from "../components/TradeoffChart";
import FlagList      from "../components/FlagList";
import VehicleSlot   from "../components/VehicleSlot";
import { BarChart, StackedBarChart, LineChart, D3Treemap, D3Donut, D3Breakeven } from "../components/Charts";
import { STATE_GRIDS, COLORS, EQUIVS, apiFetch, typeBadge, typeColor } from "../utils";

const PRESETS = {
  ev_vs_ice:    ["Model 3 Long Range AWD", "Camry"],
  ev_vs_hybrid: ["Model 3 Long Range AWD", "Prius"],
  ev_shootout:  ["Model 3 Long Range AWD", "Model Y Long Range AWD", "Kona Electric"],
  ice_shootout: ["Camry", "Accord", "Corolla"],
  full4:        ["Model 3 Long Range AWD", "Prius", "Civic", "Camry"],
};

export default function ComparePage() {
  const [makes,         setMakes]         = useState([]);
  const [states,        setStates]        = useState(Object.keys(STATE_GRIDS));
  const [state,         setState]         = useState("MAHARASHTRA");
  const [km,            setKm]            = useState(40);
  const [years,         setYears]         = useState(10);
  const [standard,      setStandard]      = useState("EPA");
  const [slots,         setSlots]         = useState([{ id: 1, model: "" }, { id: 2, model: "" }]);
  const [loading,       setLoading]       = useState(false);
  const [results,       setResults]       = useState(null);
  const [rec,           setRec]           = useState(null);
  const [backendOk,     setBackendOk]     = useState(false);
  const [filterType,    setFilterType]    = useState("all");
  const [searchQ,       setSearchQ]       = useState("");
  const [sortBy,        setSortBy]        = useState("carbon");
  const [totalVehicles, setTotalVehicles] = useState(49580);

  useEffect(() => {
    apiFetch("/api/states").then(d => { if (d) setStates(d.states || []); });
  }, []);

  useEffect(() => {
    const url = filterType && filterType !== "all"
      ? `/api/makes?fuel_type=${filterType}`
      : "/api/makes";
    apiFetch(url).then(d => {
      if (d) { setMakes(d.makes || []); setBackendOk(true); if (d.total) setTotalVehicles(d.total); }
    });
  }, [filterType]);

  const handleReady = useCallback((id, model) => {
    setSlots(s => s.map(sl => sl.id === id ? { ...sl, model } : sl));
  }, []);

  const addSlot    = () => { if (slots.length >= 4) return; setSlots(s => [...s, { id: Date.now(), model: "" }]); };
  const removeSlot = id => { if (slots.length <= 2) return; setSlots(s => s.filter(sl => sl.id !== id)); };
  const loadPreset = p  => { const ms = PRESETS[p] || []; setSlots(ms.map((m, i) => ({ id: i + 1, model: m }))); };

  const runCmp = async () => {
    const models = slots.map(s => s.model).filter(Boolean);
    if (models.length < 2) { alert("Select at least 2 vehicles"); return; }
    setLoading(true);
    const data = await apiFetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ models, state, daily_km: km, years, standard }),
    });
    setLoading(false);
    if (data) { setResults(data.results || []); setRec(data.recommendation || null); }
  };

  const validRes   = (results || []).filter(r => !r.error);
  const sortedRes  = [...validRes].sort((a, b) =>
    sortBy === "carbon" ? a.emissions.total - b.emissions.total : a.model.localeCompare(b.model)
  );
  const savings      = rec?.co2_saved_vs_worst || 0;
  const filteredMakes = searchQ ? makes.filter(m => m.toLowerCase().includes(searchQ.toLowerCase())) : makes;
  const gClass       = `vg g${Math.min(slots.length, 4)}`;

  return (
    <div className="page">
      {loading && <Loading />}

      {/* ── GOOGLE FLIGHTS-STYLE SEARCH BAR ── */}
      <div className="gf-searchbar">
        <div className="gf-title">Find Your Lowest-Carbon Vehicle</div>
        <div className="gf-sub">Search {totalVehicles.toLocaleString()} EPA records · Filter by type · Sort by lifecycle footprint</div>
        <div className="gf-row">
          <input className="gf-input" type="text"
            placeholder="🔍  Search make (Toyota, Tesla, BMW…)"
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <select className="gf-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="carbon">↑ Lowest Carbon</option>
            <option value="name">A–Z Name</option>
          </select>
        </div>
        <div className="gf-chips">
          {[["all", "All Types"], ["EV", "⚡ Electric"], ["Hybrid", "♻️ Hybrid"], ["ICE", "⛽ Petrol/Diesel"]].map(([f, l]) => (
            <button key={f} className={`chip${filterType === f ? " on" : ""}`} onClick={() => setFilterType(f)}>{l}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
            <SBadge t="epa" txt={`${totalVehicles.toLocaleString()} EPA Records`} />
            <SBadge t="eea" txt="EEA Fleet Targets" />
            <SBadge t="cea" txt="CEA India Grid" />
          </div>
        </div>
      </div>

      <div className="cmp-layout">
        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sb-title">Configuration</div>

          <div className="profile-box">
            <div className="pb-title">Your Driving Profile <span className="live-pill">LIVE</span></div>
            <div className="fg">
              <label className="fl">State / Grid Region <SBadge t="cea" txt="CEA V21.0" /></label>
              <select className="fs" value={state} onChange={e => setState(e.target.value)}>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {STATE_GRIDS[state] && (
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: STATE_GRIDS[state] > 0.85 ? "var(--bad)" : STATE_GRIDS[state] < 0.5 ? "var(--good)" : "var(--fog)", marginTop: "3px" }}>
                  Grid: {STATE_GRIDS[state].toFixed(3)} kgCO₂/kWh
                  {STATE_GRIDS[state] > 0.85 ? " ⚠ Coal-heavy" : STATE_GRIDS[state] < 0.5 ? " ✓ Clean" : ""}
                </div>
              )}
            </div>
            <div className="p2">
              <div>
                <label className="fl">Daily km</label>
                <input className="fi" type="number" value={km} min="1" max="500" onChange={e => setKm(+e.target.value)} />
              </div>
              <div>
                <label className="fl">Yearly km (est.)</label>
                <input className="fi ro" type="number" value={Math.round(km * 365 / 100) * 100} readOnly />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Ownership years</label>
              <input className="fi" type="number" value={years} min="1" max="30" onChange={e => setYears(+e.target.value)} />
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)", marginTop: ".5rem",
              padding: ".4rem .5rem", background: "rgba(200,245,66,.06)", border: "1px solid rgba(200,245,66,.18)" }}>
              Total distance: <strong style={{ color: "var(--ink)" }}>{(km * 365 * years).toLocaleString()} km</strong>
              {" "}over {years} yr{years > 1 ? "s" : ""}
            </div>
          </div>

          <div className="fdiv" />
          <div className="fg">
            <label className="fl">Emission Standard</label>
            <div className="toggle-row">
              <button className={`tbtn${standard === "EPA"  ? " on" : ""}`} onClick={() => setStandard("EPA")}>EPA</button>
              <button className={`tbtn${standard === "WLTP" ? " on" : ""}`} onClick={() => setStandard("WLTP")}>WLTP</button>
            </div>
          </div>
          <div className="fdiv" />
          <div className="fg"><label className="fl">Quick Presets</label></div>
          {[
            ["ev_vs_ice",    "⚡ EV vs ICE"],
            ["ev_vs_hybrid", "⚡ EV vs Hybrid"],
            ["ev_shootout",  "⚡ EV Shootout"],
            ["ice_shootout", "⛽ ICE Shootout"],
            ["full4",        "🔀 4-Way All Types"],
          ].map(([p, l]) => (
            <button key={p} className="preset-btn" onClick={() => loadPreset(p)}>{l}</button>
          ))}
          <div className="fdiv" />
          <button className="run-btn" onClick={runCmp}>↗ Compare Vehicles</button>
          <p className="sb-note">
            Total Carbon Cost = Manufacturing + Operational + Battery Disposal. Grid intensity applied by state.
            Sources: EPA FuelEconomy.gov · CEA India V21.0 · EEA 2024 Fleet Targets · ICCT LCA.
          </p>
        </div>

        {/* ── MAIN ── */}
        <div className="cmp-main">
          {!backendOk && (
            <div className="demo-note">
              ⏳ Start Flask backend: <code style={{ background: "rgba(10,10,8,.07)", padding: "1px 5px" }}>python backend/app.py</code>
            </div>
          )}

          <div className="slot-bar">
            <span style={{ fontFamily: "var(--mono)", fontSize: ".5rem", color: "var(--fog)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              Select vehicles to compare
            </span>
            {slots.length < 4 && <button className="add-btn" onClick={addSlot}>＋ Add Vehicle</button>}
          </div>

          <div className={gClass}>
            {slots.map(sl => (
              <VehicleSlot
                key={sl.id} slotId={sl.id} makes={filteredMakes}
                filterType={filterType} onRemove={slots.length > 2 ? removeSlot : null}
                onReady={handleReady}
              />
            ))}
          </div>

          {sortedRes.length >= 2 && (<>

            {/* NORMALIZATION BANNER — proves apples-to-apples, not just aggregation */}
            <NormalizationBanner standard={results[0]?.standard || "EPA"} results={sortedRes} />

            {/* RECOMMENDATION */}
            {rec && (
              <div className="rec-banner">
                <div className="rec-icon">🏆</div>
                <div style={{ flex: 1 }}>
                  <div className="rec-lbl">Carbon-Optimal Recommendation — Personalised to Your Profile</div>
                  <div className="rec-name">
                    {rec.best_model}{" "}
                    <span className={`vbadge ${typeBadge(rec.best_type)}`} style={{ fontSize: ".4rem", verticalAlign: "middle" }}>
                      {rec.best_type}
                    </span>
                  </div>
                  <div className="rec-desc">{rec.reason}</div>
                  {rec.scoring_formula && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: ".3rem" }}>
                      📊 {rec.scoring_formula}
                    </div>
                  )}
                  {/* Recommendation scoring explanation */}
                  <div style={{
                    marginTop: ".5rem", padding: ".4rem .7rem",
                    background: "rgba(200,245,66,.08)", border: "1px solid rgba(200,245,66,.2)",
                    fontFamily: "var(--mono)", fontSize: ".44rem", lineHeight: 1.7,
                  }}>
                    <strong style={{ color: "var(--acid-dk)" }}>Scoring formula:</strong>{" "}
                    Score = Total_lifecycle_CO₂ + (HIGH_greenwash_flags × 2,000 kg penalty).
                    Personalised by: your daily km, ownership years, and {rec.best_type === "EV" ? "India state grid intensity (CEA V21.0)" : "fuel emission factors (IPCC 2006)"}.
                  </div>
                  <div className="sb-row">
                    <SBadge t="epa" txt="EPA Data" /><SBadge t="eea" txt="EEA Standards" /><SBadge t="icct" txt="ICCT LCA" />
                  </div>
                </div>
              </div>
            )}

            {/* CARBON TRADEOFF — upfront cost vs long-term savings */}
            <TradeoffChart results={sortedRes} years={results[0]?.distance?.years || 10} />

            {/* CO₂ SAVINGS EQUIVALENTS */}
            {savings > 0 && (<>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".5rem" }}>
                Savings vs worst emitter equivalent to…
              </div>
              <div className="eq-strip">
                {EQUIVS.map((e, i) => (
                  <div key={i} className="eq-card">
                    <div className="eq-icon">{e.icon}</div>
                    <div className="eq-val">{e.fn(savings).toLocaleString()}</div>
                    <div className="eq-lbl">{e.label}</div>
                  </div>
                ))}
              </div>
            </>)}

            {/* CARBON NUTRITION LABELS */}
            <div className="rp">
              <div className="rp-title">Carbon Nutrition Label — Per Vehicle <SBadge t="epa" txt="EPA FuelEconomy.gov" /></div>
              <div className={`nl-grid n${Math.min(sortedRes.length, 4)}`}>
                {sortedRes.map((r, i) => <NutritionLabel key={i} result={r} />)}
              </div>
            </div>

            {/* UPFRONT VS LONG-TERM DETAIL */}
            <ULPanel results={sortedRes} />

            {/* BAR + STACKED BAR CHARTS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem", marginBottom: ".9rem" }}>
              <div className="rp">
                <div className="rp-title">Total Lifecycle CO₂ — Sorted Low→High <SBadge t="epa" txt="EPA" /></div>
                <BarChart
                  labels={sortedRes.map(r => r.model)}
                  data={sortedRes.map(r => r.emissions.total)}
                  colors={sortedRes.map(r => typeColor(r.vehicle_type))}
                />
              </div>
              <div className="rp">
                <div className="rp-title">Mfg · Ops · Disposal Breakdown <SBadge t="icct" txt="ICCT LCA" /></div>
                <StackedBarChart models={sortedRes.map(r => r.model)} sd={sortedRes.map(r => r.emissions)} />
              </div>
            </div>

            {/* LINE CHART */}
            <div className="rp">
              <div className="rp-title">Cumulative CO₂ Over Ownership Period</div>
              <LineChart datasets={sortedRes.map((r, i) => ({
                label: r.model, data: r.cumulative_curve || [],
                borderColor: COLORS[i % COLORS.length], backgroundColor: "transparent",
                borderWidth: 2, pointRadius: 0, tension: 0.4,
              }))} />
            </div>

            {/* D3 DONUT CHARTS */}
            <div className="rp">
              <div className="rp-title">Lifecycle Phase Breakdown — D3.js Donut Charts</div>
              <div className="donut-row">
                {sortedRes.map((r, i) => (
                  <div key={i} className="donut-card">
                    <D3Donut em={r.emissions} />
                    <div className="donut-lbl">{r.model}</div>
                    <div className="legend-row">
                      {[["Mfg", "rgba(10,10,8,.8)"], ["Ops", "rgba(200,245,66,.85)"], ["EoL", "rgba(232,41,28,.7)"]].map(([l, c]) => (
                        <span key={l} className="leg-item"><span className="leg-dot" style={{ background: c }} />{l}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D3 TREEMAP */}
            <div className="rp">
              <div className="rp-title">Emission Composition Treemap — D3.js</div>
              <D3Treemap results={sortedRes} />
            </div>

            {/* HEAD-TO-HEAD TABLE */}
            <div className="rp">
              <div className="rp-title">Head-to-Head — Ranked by Lowest Carbon Footprint <SBadge t="epa" txt="EPA Data" /></div>
              <table className="qtbl">
                <thead>
                  <tr><th>Rank</th><th>Model</th><th>Type</th><th>Manufacturing</th><th>Operational</th><th>End-of-Life</th><th>Total</th><th>GW Flags</th></tr>
                </thead>
                <tbody>
                  {sortedRes.map((r, i) => (
                    <tr key={i} className={rec && r.model === rec.best_model ? "winner" : ""}>
                      <td>{rec && r.model === rec.best_model ? "🏆" : i + 1}</td>
                      <td>{r.model}</td>
                      <td><span className={`vbadge ${typeBadge(r.vehicle_type)}`}>{r.vehicle_type}</span></td>
                      <td>{(r.emissions.manufacturing / 1000).toFixed(2)}t</td>
                      <td>{(r.emissions.operational   / 1000).toFixed(2)}t</td>
                      <td>{(r.emissions.end_of_life   / 1000).toFixed(2)}t</td>
                      <td><strong>{(r.emissions.total / 1000).toFixed(2)}t</strong></td>
                      <td>
                        {(r.greenwash_flags || []).length
                          ? <span style={{ color: "var(--rouge)" }}>{r.greenwash_flags.length} flag(s)</span>
                          : <span style={{ color: "var(--good)" }}>✓ Clean</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* D3 BREAKEVEN */}
            {rec?.breakeven && (
              <div className="rp">
                <div className="rp-title">EV vs ICE Carbon Breakeven — D3.js SVG <SBadge t="cea" txt="Grid-Adjusted" /></div>
                <D3Breakeven
                  beData={rec.breakeven}
                  evLabel={sortedRes.find(r => r.vehicle_type === "EV")?.model}
                  iceLabel={sortedRes.find(r => r.vehicle_type === "ICE")?.model}
                />
                {rec.breakeven.breakeven_year
                  ? <div style={{ fontFamily: "var(--mono)", fontSize: ".54rem", color: "var(--fog)", marginTop: ".4rem" }}>
                      Manufacturing carbon debt repaid at <strong style={{ color: "var(--ink)" }}>year {rec.breakeven.breakeven_year}</strong>
                    </div>
                  : <div style={{ fontFamily: "var(--mono)", fontSize: ".54rem", color: "var(--bad)", marginTop: ".4rem" }}>
                      ⚠ No crossover within 20-year projection on current grid.
                    </div>
                }
              </div>
            )}

            {/* GREENWASH FLAGS */}
            {sortedRes.some(r => (r.greenwash_flags || []).length > 0) && (
              <div className="rp">
                <div className="rp-title">Greenwashing Analysis <SBadge t="eea" txt="EEA Targets" /> <SBadge t="cea" txt="CEA Grid" /></div>
                {sortedRes.map((r, i) => (
                  <div key={i} style={{ marginBottom: "1rem" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".5rem", color: "var(--fog)", marginBottom: ".38rem", letterSpacing: ".07em", textTransform: "uppercase" }}>
                      {r.model}
                    </div>
                    <FlagList flags={r.greenwash_flags} result={r} />
                  </div>
                ))}
              </div>
            )}

          </>)}
        </div>
      </div>
      <DataSourcesPanel />
    </div>
  );
}
