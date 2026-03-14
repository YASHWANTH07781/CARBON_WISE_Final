import React, { useState, useEffect } from "react";
import SBadge from "../components/SBadge";
import Loading from "../components/Loading";
import { STATE_GRIDS, apiFetch, typeBadge, typeColor } from "../utils";

// ── Curated demo vehicles for instant recommendation (verified in EPA dataset) ──
const DEMO_FLEET = [
  // EVs
  { model: "Model 3 Long Range AWD",  type: "EV",     make: "Tesla",   icon: "⚡" },
  { model: "Model Y Long Range AWD",  type: "EV",     make: "Tesla",   icon: "⚡" },
  { model: "Kona Electric",           type: "EV",     make: "Hyundai", icon: "⚡" },
  { model: "Leaf",                    type: "EV",     make: "Nissan",  icon: "⚡" },
  { model: "Ioniq Electric",          type: "EV",     make: "Hyundai", icon: "⚡" },
  // Hybrids
  { model: "Prius",                   type: "Hybrid", make: "Toyota",  icon: "♻️" },
  { model: "Accord Hybrid",           type: "Hybrid", make: "Honda",   icon: "♻️" },
  { model: "Civic Hybrid",            type: "Hybrid", make: "Honda",   icon: "♻️" },
  { model: "Insight",                 type: "Hybrid", make: "Honda",   icon: "♻️" },
  // ICE
  { model: "Civic",                   type: "ICE",    make: "Honda",   icon: "⛽" },
  { model: "Corolla",                 type: "ICE",    make: "Toyota",  icon: "⛽" },
  { model: "Camry",                   type: "ICE",    make: "Toyota",  icon: "⛽" },
  { model: "Accord",                  type: "ICE",    make: "Honda",   icon: "⛽" },
];

const TYPE_LABEL = { EV: "⚡ Electric", Hybrid: "♻️ Hybrid", ICE: "⛽ Petrol/Diesel" };

const USAGE_PROFILES = [
  { label: "Low (city commuter)", km: 20, desc: "< 20 km/day · Short daily trips" },
  { label: "Average (daily driver)", km: 40, desc: "~40 km/day · Typical usage" },
  { label: "High (long commuter)", km: 80, desc: "~80 km/day · Long daily drive" },
  { label: "Very high (road tripper)", km: 150, desc: "150+ km/day · Extensive driving" },
];

export default function RecommendPage() {
  // Step 1 — User profile inputs
  const [step,       setStep]       = useState(1); // 1=inputs, 2=results
  const [km,         setKm]         = useState(40);
  const [years,      setYears]      = useState(10);
  const [state,      setState]      = useState("MAHARASHTRA");
  const [typeFilter, setTypeFilter] = useState(["EV", "Hybrid", "ICE"]);
  const [loading,    setLoading]    = useState(false);
  const [results,    setResults]    = useState([]);
  const [error,      setError]      = useState(null);

  const gf = STATE_GRIDS[state] || 0.82;
  const gridCategory = gf < 0.5 ? "Clean" : gf < 0.8 ? "Moderate" : "Coal-heavy";
  const gridColor    = gf < 0.5 ? "var(--good)" : gf < 0.8 ? "var(--warn)" : "var(--bad)";

  const toggleType = (t) => {
    setTypeFilter(prev =>
      prev.includes(t)
        ? prev.length > 1 ? prev.filter(x => x !== t) : prev
        : [...prev, t]
    );
  };

  const run = async () => {
    const fleet = DEMO_FLEET.filter(v => typeFilter.includes(v.type));
    if (!fleet.length) return;
    setLoading(true);
    setError(null);
    try {
      const models = fleet.map(v => v.model);
      const res = await apiFetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models, state, daily_km: km, years, standard: "EPA" }),
      });
      if (!res) throw new Error("Backend not available");
      const valid = (res.results || []).filter(r => !r.error).map(r => ({
        ...r,
        icon: fleet.find(v => v.model === r.model)?.icon || "🚗",
        make: fleet.find(v => v.model === r.model)?.make || "",
      }));
      valid.sort((a, b) => a.emissions.total - b.emissions.total);
      setResults(valid);
      setStep(2);
    } catch (e) {
      setError("Could not connect to backend. Start Flask: python backend/app.py");
    }
    setLoading(false);
  };

  const reset = () => { setStep(1); setResults([]); setError(null); };

  const best  = results[0];
  const worst = results[results.length - 1];
  const savedKg = best && worst ? worst.emissions.total - best.emissions.total : 0;

  return (
    <div className="page">
      {loading && <Loading />}

      {/* ── HERO ── */}
      <div style={{
        background: "var(--ink)", color: "var(--paper)",
        padding: "3rem 3rem 2.5rem", borderBottom: "3px solid var(--acid)",
      }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".5rem", letterSpacing: ".28em", textTransform: "uppercase", color: "rgba(200,245,66,.5)", marginBottom: ".7rem" }}>
          Carbon-Wise · Recommendation Engine
        </div>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 900, letterSpacing: "-2px", lineHeight: .9, marginBottom: ".9rem" }}>
          Find Your<br /><em style={{ color: "var(--acid)" }}>Lowest-Carbon</em><br />Vehicle.
        </h1>
        <p style={{ fontSize: ".82rem", color: "rgba(245,242,236,.5)", lineHeight: 1.75, maxWidth: 480, marginBottom: "1.2rem" }}>
          Enter your daily mileage, ownership period, and location. The engine calculates
          full lifecycle CO₂ — manufacturing + fuel + disposal — and recommends the best option for you.
        </p>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
          <SBadge t="epa"  txt="49,580 EPA Records" />
          <SBadge t="cea"  txt="CEA India Grid V21.0" />
          <SBadge t="icct" txt="ICCT LCA 2021" />
          <SBadge t="eea"  txt="EEA Standards" />
        </div>
      </div>

      {/* ── STEP 1: INPUTS ── */}
      {step === 1 && (
        <div style={{ padding: "2.5rem 3rem", maxWidth: 820 }}>

          {/* Usage profile quick-pick */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".52rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".8rem" }}>
              1 — Your driving profile
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: ".6rem", marginBottom: "1rem" }}>
              {USAGE_PROFILES.map((p, i) => (
                <div key={i}
                  onClick={() => setKm(p.km)}
                  style={{
                    padding: ".8rem 1rem", cursor: "pointer",
                    border: `2px solid ${km === p.km ? "var(--acid)" : "rgba(10,10,8,.1)"}`,
                    background: km === p.km ? "rgba(200,245,66,.08)" : "var(--paper)",
                    transition: "all .15s",
                  }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: ".52rem", fontWeight: 600, marginBottom: ".2rem",
                    color: km === p.km ? "var(--acid-dk)" : "var(--ink)" }}>
                    {p.label}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)" }}>{p.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".8rem" }}>
              <div>
                <label className="fl">Or enter exact daily km</label>
                <input className="fi" type="number" value={km} min={1} max={500}
                  onChange={e => setKm(Math.max(1, +e.target.value))} />
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: "3px" }}>
                  = {Math.round(km * 365).toLocaleString()} km/year
                </div>
              </div>
              <div>
                <label className="fl">Ownership years</label>
                <input className="fi" type="number" value={years} min={1} max={30}
                  onChange={e => setYears(Math.max(1, +e.target.value))} />
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: "3px" }}>
                  = {Math.round(km * 365 * years).toLocaleString()} km total
                </div>
              </div>
              <div>
                <label className="fl">State / Grid Region <SBadge t="cea" txt="CEA" /></label>
                <select className="fs" value={state} onChange={e => setState(e.target.value)}>
                  {Object.keys(STATE_GRIDS).sort().map(s => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: gridColor, marginTop: "3px" }}>
                  {gf.toFixed(3)} kgCO₂/kWh · {gridCategory}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle type filter */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".52rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".8rem" }}>
              2 — Vehicle types to compare
            </div>
            <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginBottom: ".6rem" }}>
              {["EV", "Hybrid", "ICE"].map(t => (
                <button key={t}
                  onClick={() => toggleType(t)}
                  style={{
                    fontFamily: "var(--mono)", fontSize: ".54rem", letterSpacing: ".1em",
                    padding: ".55rem 1.2rem", cursor: "pointer", border: "2px solid",
                    borderColor: typeFilter.includes(t) ? typeColor(t) : "rgba(10,10,8,.15)",
                    background:  typeFilter.includes(t) ? `${typeColor(t)}18` : "transparent",
                    color: typeFilter.includes(t) ? "var(--ink)" : "var(--fog)",
                    transition: "all .15s",
                  }}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)" }}>
              Comparing {DEMO_FLEET.filter(v => typeFilter.includes(v.type)).length} vehicles
              ({DEMO_FLEET.filter(v => typeFilter.includes(v.type) && v.type === "EV").length} EV ·{" "}
              {DEMO_FLEET.filter(v => typeFilter.includes(v.type) && v.type === "Hybrid").length} Hybrid ·{" "}
              {DEMO_FLEET.filter(v => typeFilter.includes(v.type) && v.type === "ICE").length} ICE)
              from {DEMO_FLEET.filter(v => typeFilter.includes(v.type)).length > 0
                ? [...new Set(DEMO_FLEET.filter(v => typeFilter.includes(v.type)).map(v => v.make))].join(", ")
                : "—"}
            </div>
          </div>

          {/* Grid context */}
          {gf >= 0.85 && typeFilter.includes("EV") && (
            <div style={{ padding: ".7rem 1rem", background: "rgba(232,41,28,.05)", border: "1px solid rgba(232,41,28,.2)", marginBottom: "1.5rem", fontFamily: "var(--mono)", fontSize: ".48rem", color: "var(--fog)" }}>
              ⚠ Your selected state has a <strong style={{ color: "var(--bad)" }}>coal-heavy grid</strong> ({gf.toFixed(3)} kgCO₂/kWh).
              EV operational emissions will be higher than states with cleaner grids (e.g. Kerala 0.420, Himachal Pradesh 0.120).
              The recommendation will still find the lowest lifecycle option for your specific state.
            </div>
          )}

          {error && (
            <div style={{ padding: ".7rem 1rem", background: "rgba(232,41,28,.07)", border: "1px solid rgba(232,41,28,.25)", marginBottom: "1rem", fontFamily: "var(--mono)", fontSize: ".5rem", color: "var(--bad)" }}>
              {error}
            </div>
          )}

          <button onClick={run} style={{
            background: "var(--ink)", color: "var(--acid)", fontFamily: "var(--mono)",
            fontSize: ".6rem", letterSpacing: ".12em", textTransform: "uppercase",
            border: "none", padding: ".9rem 2.5rem", cursor: "pointer", transition: ".2s",
          }}
            onMouseOver={e => { e.target.style.background = "var(--acid)"; e.target.style.color = "var(--ink)"; }}
            onMouseOut={e  => { e.target.style.background = "var(--ink)";  e.target.style.color = "var(--acid)"; }}>
            Find My Best Vehicle →
          </button>
        </div>
      )}

      {/* ── STEP 2: RESULTS ── */}
      {step === 2 && results.length > 0 && (
        <div style={{ padding: "2rem 3rem" }}>

          {/* WINNER CARD */}
          <div style={{
            background: "var(--ink)", color: "var(--paper)",
            padding: "1.8rem 2rem", marginBottom: "1.5rem",
            borderLeft: "5px solid var(--acid)",
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", letterSpacing: ".24em", textTransform: "uppercase", color: "var(--acid)", marginBottom: ".5rem" }}>
              🏆 Best Vehicle for Your Usage
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: ".4rem" }}>{best.icon}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", letterSpacing: ".12em", textTransform: "uppercase",
                  color: typeColor(best.vehicle_type), marginBottom: ".2rem" }}>
                  {best.vehicle_type}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, letterSpacing: "-.4px", marginBottom: ".3rem" }}>
                  {best.make} {best.model}
                </div>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: ".7rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".38rem", color: "rgba(245,242,236,.4)", textTransform: "uppercase" }}>Total Lifecycle CO₂</div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", fontWeight: 900, color: "var(--acid)" }}>
                      {(best.emissions.total / 1000).toFixed(2)} t
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".38rem", color: "rgba(245,242,236,.4)", textTransform: "uppercase" }}>Saves vs Worst Option</div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", fontWeight: 900, color: "var(--good)" }}>
                      {(savedKg / 1000).toFixed(1)} t CO₂
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".38rem", color: "rgba(245,242,236,.4)", textTransform: "uppercase" }}>For Your Profile</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".6rem", fontWeight: 600, color: "rgba(245,242,236,.8)" }}>
                      {km} km/day · {years} yr · {state.charAt(0) + state.slice(1).toLowerCase()}
                    </div>
                  </div>
                </div>
                <ReasonBox r={best} km={km} years={years} state={state} gf={gf} savedKg={savedKg} worst={worst} />
              </div>
            </div>
          </div>

          {/* FULL RANKED LIST */}
          <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".8rem" }}>
            All vehicles — ranked lowest carbon first
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "1.5rem" }}>
            {results.map((r, i) => (
              <RankedCard key={i} r={r} rank={i} best={best} worst={worst} km={km} years={years} />
            ))}
          </div>

          {/* COMPARISON TABLE */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".6rem" }}>
              Lifecycle breakdown — manufacturing · operations · disposal
            </div>
            <table className="qtbl" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Rank</th><th>Vehicle</th><th>Type</th>
                  <th>Manufacturing</th><th>Operational</th><th>Disposal</th>
                  <th>Total CO₂</th><th>vs Best</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const diff = r.emissions.total - best.emissions.total;
                  return (
                    <tr key={i} className={i === 0 ? "winner" : ""}>
                      <td>{i === 0 ? "🏆" : i + 1}</td>
                      <td><strong>{r.make} {r.model}</strong></td>
                      <td><span className={`vbadge ${typeBadge(r.vehicle_type)}`}>{r.vehicle_type}</span></td>
                      <td>{(r.emissions.manufacturing / 1000).toFixed(2)} t</td>
                      <td>{(r.emissions.operational   / 1000).toFixed(2)} t</td>
                      <td>{(r.emissions.end_of_life   / 1000).toFixed(2)} t</td>
                      <td><strong>{(r.emissions.total / 1000).toFixed(2)} t</strong></td>
                      <td style={{ color: diff === 0 ? "var(--good)" : "var(--bad)" }}>
                        {diff === 0 ? "✓ Best" : `+${(diff/1000).toFixed(1)} t`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* DATA SOURCES */}
          <div style={{ padding: ".7rem 1rem", background: "var(--cream)", border: "1px solid rgba(10,10,8,.08)", fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)", lineHeight: 1.8 }}>
            <strong style={{ color: "var(--ink)" }}>Calculation method:</strong>{" "}
            Total lifecycle CO₂ = Manufacturing (ICCT 2021 + IEA 2023, scaled by vehicle class)
            + Operational (EPA FuelEconomy.gov co2TailpipeGpm / combE + CEA India grid {gf.toFixed(3)} kgCO₂/kWh)
            + Battery disposal (ICCT 2021 + EU Battery Reg 2023).
            WLTP correction available on Compare page.
            <span style={{ marginLeft: ".6rem" }}>
              <SBadge t="epa" txt="EPA" />{" "}
              <SBadge t="cea" txt="CEA" />{" "}
              <SBadge t="icct" txt="ICCT" />
            </span>
          </div>

          <button onClick={reset} style={{
            marginTop: "1.2rem", background: "transparent", color: "var(--ink)",
            fontFamily: "var(--mono)", fontSize: ".54rem", letterSpacing: ".1em",
            textTransform: "uppercase", border: "1px solid rgba(10,10,8,.2)",
            padding: ".65rem 1.5rem", cursor: "pointer",
          }}>
            ← Start Over
          </button>
        </div>
      )}
    </div>
  );
}

// ── Recommendation reason ───────────────────────────────────────
function ReasonBox({ r, km, years, state, gf, savedKg, worst }) {
  const opsPerYear = (r.emissions.operational / years).toFixed(0);
  const mfgT       = (r.emissions.manufacturing / 1000).toFixed(1);
  const totalT     = (r.emissions.total / 1000).toFixed(2);
  const annualKm   = km * 365;

  const reasons = [];
  if (r.vehicle_type === "EV") {
    reasons.push(`Lowest lifecycle footprint at ${totalT} t CO₂ over ${years} years / ${(annualKm * years).toLocaleString()} km.`);
    reasons.push(`At ${km} km/day on ${state.charAt(0) + state.slice(1).toLowerCase()} grid (${gf.toFixed(3)} kgCO₂/kWh), EV operational emissions are just ${Number(opsPerYear).toLocaleString()} kg/yr.`);
    if (gf >= 0.85) reasons.push(`⚠ Coal-heavy grid detected — EV advantage is narrower than on clean grids. Consider switching state to see impact.`);
  } else if (r.vehicle_type === "Hybrid") {
    reasons.push(`Best lifecycle balance for your ${km} km/day profile — lower manufacturing debt than EV, lower fuel emissions than ICE.`);
    reasons.push(`Total ${totalT} t CO₂ over ${years} years. Manufacturing ${mfgT} t + operational ${Number(opsPerYear).toLocaleString()} kg/yr.`);
  } else {
    reasons.push(`Lowest total lifecycle for this comparison at ${totalT} t CO₂ over ${years} years.`);
    reasons.push(`At ${km} km/day: ${Number(opsPerYear).toLocaleString()} kg/yr operational emissions.`);
  }
  if (savedKg > 0) reasons.push(`Saves ${(savedKg/1000).toFixed(1)} t CO₂ vs ${worst?.make} ${worst?.model} over the ownership period.`);

  return (
    <div>
      {reasons.map((reason, i) => (
        <div key={i} style={{ display: "flex", gap: ".5rem", marginBottom: ".25rem", alignItems: "flex-start" }}>
          <span style={{ color: "var(--acid)", fontSize: ".7rem", lineHeight: 1.4, flexShrink: 0 }}>›</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: ".5rem", color: "rgba(245,242,236,.65)", lineHeight: 1.6 }}>{reason}</span>
        </div>
      ))}
      <div style={{ marginTop: ".5rem" }}>
        <SBadge t="epa" txt="EPA Data" />{" "}
        <SBadge t="cea" txt="CEA Grid" />{" "}
        <SBadge t="icct" txt="ICCT LCA" />
      </div>
    </div>
  );
}

// ── Ranked vehicle card ─────────────────────────────────────────
function RankedCard({ r, rank, best, worst, km, years }) {
  const isWinner  = rank === 0;
  const isWorst   = r.model === worst?.model;
  const totalT    = (r.emissions.total / 1000).toFixed(2);
  const maxTotal  = worst?.emissions.total || 1;
  const barPct    = Math.round(r.emissions.total / maxTotal * 100);
  const mfgPct    = Math.round(r.emissions.manufacturing / r.emissions.total * 100);
  const opsPct    = Math.round(r.emissions.operational  / r.emissions.total * 100);
  const diff      = r.emissions.total - best.emissions.total;

  return (
    <div style={{
      padding: "1rem 1.2rem",
      border: isWinner ? "2px solid var(--acid)" : "1px solid rgba(10,10,8,.09)",
      background: isWinner ? "rgba(200,245,66,.04)" : "var(--paper)",
      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", alignItems: "center",
    }}>
      {/* Rank */}
      <div style={{ textAlign: "center", minWidth: "2rem" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: isWinner ? "1.5rem" : "1.1rem", fontWeight: 900,
          color: isWinner ? "var(--acid-dk)" : "var(--fog)" }}>
          {isWinner ? "🏆" : rank + 1}
        </div>
      </div>

      {/* Vehicle info + bar */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "1.1rem" }}>{r.icon}</span>
          <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{r.make} {r.model}</span>
          <span className={`vbadge ${typeBadge(r.vehicle_type)}`}>{r.vehicle_type}</span>
          {isWinner && (
            <span style={{ fontFamily: "var(--mono)", fontSize: ".38rem", background: "var(--acid)", color: "var(--ink)", padding: "2px 7px", fontWeight: 600 }}>
              ⭐ BEST OPTION
            </span>
          )}
          {isWorst && !isWinner && (
            <span style={{ fontFamily: "var(--mono)", fontSize: ".38rem", background: "rgba(232,41,28,.1)", color: "var(--bad)", padding: "2px 7px" }}>
              Highest carbon
            </span>
          )}
        </div>

        {/* Stacked bar: mfg (dark) + ops (accent) */}
        <div style={{ height: "8px", background: "rgba(10,10,8,.07)", borderRadius: 2, overflow: "hidden", marginBottom: ".3rem" }}>
          <div style={{ display: "flex", height: "100%", width: `${barPct}%`, transition: "width 1s" }}>
            <div style={{ width: `${mfgPct}%`, background: "rgba(10,10,8,.7)", height: "100%" }} />
            <div style={{ width: `${opsPct}%`, background: typeColor(r.vehicle_type), height: "100%", opacity: .75 }} />
            <div style={{ flex: 1, background: "rgba(232,41,28,.4)", height: "100%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", fontFamily: "var(--mono)", fontSize: ".4rem", color: "var(--fog)" }}>
          <span>🏭 Mfg: {(r.emissions.manufacturing/1000).toFixed(1)}t ({mfgPct}%)</span>
          <span>⚡ Ops: {(r.emissions.operational/1000).toFixed(1)}t ({opsPct}%)</span>
          <span>♻️ EoL: {(r.emissions.end_of_life/1000).toFixed(1)}t</span>
        </div>
      </div>

      {/* Total + diff */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-.3px",
          color: isWinner ? "var(--acid-dk)" : "var(--ink)" }}>
          {totalT} t
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: diff === 0 ? "var(--good)" : "var(--fog)", marginTop: "2px" }}>
          {diff === 0 ? "✓ Lowest" : `+${(diff/1000).toFixed(1)} t more`}
        </div>
      </div>
    </div>
  );
}
