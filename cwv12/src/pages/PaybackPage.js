import React, { useState, useEffect, useMemo } from "react";
import SBadge  from "../components/SBadge";
import Loading from "../components/Loading";
import ModelAssumptions from "../components/ModelAssumptions";
import { D3Breakeven } from "../components/Charts";
import { STATE_GRIDS, apiFetch } from "../utils";

export default function PaybackPage() {
  const [states,     setStates]     = useState(Object.keys(STATE_GRIDS));
  const [evMakes,    setEvMakes]    = useState([]);
  const [iceMakes,   setIceMakes]   = useState([]);
  const [evMake,     setEvMake]     = useState("");
  const [iceMake,    setIceMake]    = useState("");
  const [evModels,   setEvModels]   = useState([]);
  const [iceModels,  setIceModels]  = useState([]);
  const [evModel,    setEvModel]    = useState("");
  const [iceModel,   setIceModel]   = useState("");
  const [pbState,    setPbState]    = useState("MAHARASHTRA");
  const [km,         setKm]         = useState(40);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [evLoading,  setEvLoading]  = useState(false);
  const [iceLoading, setIceLoading] = useState(false);

  // Load states + makes on mount
  useEffect(() => {
    apiFetch("/api/states").then(d => { if (d) setStates(d.states || []); });
    apiFetch("/api/makes?fuel_type=EV").then(d => { if (d) setEvMakes(d.makes || []); });
    apiFetch("/api/makes?fuel_type=ICE").then(d => { if (d) setIceMakes(d.makes || []); });
  }, []);

  // Load EV models when evMake changes
  useEffect(() => {
    setEvModel(""); setEvModels([]);
    if (!evMake) return;
    setEvLoading(true);
    apiFetch(`/api/models?make=${encodeURIComponent(evMake)}&fuel_type=EV`)
      .then(d => { if (d) setEvModels(d.models || []); setEvLoading(false); });
  }, [evMake]);

  // Load ICE models when iceMake changes
  useEffect(() => {
    setIceModel(""); setIceModels([]);
    if (!iceMake) return;
    setIceLoading(true);
    apiFetch(`/api/models?make=${encodeURIComponent(iceMake)}&fuel_type=ICE`)
      .then(d => { if (d) setIceModels(d.models || []); setIceLoading(false); });
  }, [iceMake]);

  // Demo breakeven shown before backend call
  // Uses updated ICCT 2021 + IEA 2023 base values: EV=13,000 kg, ICE=7,200 kg
  // Applies grid decarbonisation trajectory (IEA India NZE 2023) and battery replacement
  const clientBE = useMemo(() => {
    if (result) return null;
    const gf = STATE_GRIDS[pbState] || 0.82;
    const evMfg = 13000, iceMfg = 7200;
    // EV: 15 kWh/100km × 1.12 charging loss | ICE: 170 g/km baseline
    const evOpsPerYrBase = km * 365 * (15 / 100) * 1.12 * gf;
    const iceOpsPerYr    = km * 365 * 0.170;
    // Grid decarb multipliers (IEA NZE 2023 simplified)
    const gridMult = (yr) => Math.max(0.317, 1.0 - yr * 0.034);
    const BATTERY_BUMP = 0.30 * 3500; // expected value at yr 11
    const data = [];
    let be = null, evCum = evMfg, iceCum = iceMfg;
    for (let y = 0; y <= 20; y++) {
      if (y > 0) { evCum += evOpsPerYrBase * gridMult(y); iceCum += iceOpsPerYr; }
      if (y === 11) evCum += BATTERY_BUMP;
      const evPt = evCum + (y === 20 ? 400 : 0);
      const icePt = iceCum + (y === 20 ? 300 : 0);
      data.push({ year: y, ev: Math.round(evPt), ice: Math.round(icePt) });
      if (!be && y > 0 && evPt <= icePt) be = y;
    }
    return { data, breakeven_year: be, model_notes: null };
  }, [result, pbState, km]);

  const run = async () => {
    if (!evModel || !iceModel) { alert("Select both an EV and an ICE model"); return; }
    setLoading(true);
    const data = await apiFetch(
      `/api/breakeven?ev_model=${encodeURIComponent(evModel)}&ice_model=${encodeURIComponent(iceModel)}&state=${pbState}&daily_km=${km}`
    );
    setLoading(false);
    if (data) setResult(data);
  };

  const beData  = result?.breakeven || clientBE;
  const gf      = STATE_GRIDS[pbState] || 0.82;
  const beYear  = beData?.breakeven_year;
  const evMfgKg = beData?.data?.[0]?.ev || 9000;
  const annualSavingKg = beData && beData.data.length > 1
    ? Math.max(0, (beData.data[1]?.ice || 0) - (beData.data[1]?.ev || 0))
    : null;

  const metrics = [
    {
      lbl: "Carbon Payback",
      val: beYear ? `Year ${beYear}` : "No crossover",
      sub: beYear
        ? `EV becomes cleaner than ICE after ${beYear} year${beYear > 1 ? "s" : ""}`
        : "EV may not break even within 20 yrs on this grid",
      good: !!beYear,
    },
    {
      lbl: "EV Carbon Debt",
      val: `${(evMfgKg / 1000).toFixed(1)} t`,
      sub: "Manufacturing overhead vs ICE at Year 0",
      good: null,
    },
    {
      lbl: "Annual CO₂ Saving",
      val: annualSavingKg !== null ? `${(annualSavingKg / 1000).toFixed(2)} t/yr` : "—",
      sub: "EV operational savings vs selected ICE",
      good: null,
    },
    {
      lbl: "Grid Intensity",
      val: `${gf.toFixed(3)} kgCO₂/kWh`,
      sub: `${pbState.charAt(0) + pbState.slice(1).toLowerCase()} · CEA V21.0`,
      good: gf < 0.5 ? true : gf > 0.85 ? false : null,
    },
  ];

  return (
    <div className="page">
      {loading && <Loading />}

      {/* HERO */}
      <div className="pb-hero">
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: ".54rem", letterSpacing: ".26em", textTransform: "uppercase", color: "var(--fog)" }}>
            Carbon Payback Analysis
          </div>
          <h1 className="pb-h1">When Does<br /><em>the EV</em><br />Actually Win?</h1>
          <p className="pb-sub">
            EVs carry a manufacturing carbon debt from battery production. This calculator shows
            the exact year it's repaid — personalised to your state grid and driving distance.
          </p>
          <div className="sb-row" style={{ marginTop: "1rem" }}>
            <SBadge t="epa"  txt="EPA FuelEconomy.gov" />
            <SBadge t="cea"  txt="CEA India Grid V21.0" />
            <SBadge t="icct" txt="ICCT LCA 2021" />
          </div>
        </div>
        <div className="pb-formula">
          Total_CO₂(yr) = Mfg_CO₂ + (Ops_per_yr × yr)<br />
          Breakeven: EV_CO₂(yr) = ICE_CO₂(yr)<br />
          EV_Ops/yr = daily_km × 365 × kWh/km × grid_EF<br />
          ICE_Ops/yr = daily_km × 365 × co2TailpipeGpm<br />
          ──────────────────────────────────────────<br />
          Sources: EPA FuelEconomy.gov · CEA India V21.0
        </div>
      </div>

      <div className="pb-content">

        {/* FORM — make → model cascade for both vehicles */}
        <div className="pb-form" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "start" }}>
          {/* EV side */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--acid)", marginBottom: ".1rem" }}>
              ⚡ EV / Hybrid <SBadge t="epa" txt="EPA DB" />
            </div>
            <div>
              <label className="fl">Make</label>
              <select className="fs" value={evMake} onChange={e => setEvMake(e.target.value)}>
                <option value="">{evMakes.length ? "— Select Make —" : "⏳ Loading…"}</option>
                {evMakes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="fl">Model {evMake && evModels.length > 0 && <span style={{ fontSize: ".38rem", color: "var(--fog)" }}>({evModels.length} available)</span>}</label>
              <select className="fs" value={evModel} onChange={e => setEvModel(e.target.value)} disabled={!evMake || evLoading}>
                <option value="">
                  {!evMake ? "← Pick make first" : evLoading ? "Loading…" : evModels.length ? "— Select Model —" : "No EV models for this make"}
                </option>
                {evModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* VS divider */}
          <div className="pb-vs" style={{ paddingTop: "1.4rem" }}>VS</div>

          {/* ICE side */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".1rem" }}>
              ⛽ ICE Reference Vehicle
            </div>
            <div>
              <label className="fl">Make</label>
              <select className="fs" value={iceMake} onChange={e => setIceMake(e.target.value)}>
                <option value="">{iceMakes.length ? "— Select Make —" : "⏳ Loading…"}</option>
                {iceMakes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="fl">Model {iceMake && iceModels.length > 0 && <span style={{ fontSize: ".38rem", color: "var(--fog)" }}>({iceModels.length} available)</span>}</label>
              <select className="fs" value={iceModel} onChange={e => setIceModel(e.target.value)} disabled={!iceMake || iceLoading}>
                <option value="">
                  {!iceMake ? "← Pick make first" : iceLoading ? "Loading…" : iceModels.length ? "— Select Model —" : "No ICE models for this make"}
                </option>
                {iceModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Driving profile */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: ".6rem", marginTop: ".8rem", alignItems: "flex-end" }}>
          <div>
            <label className="fl">State / Grid Region <SBadge t="cea" txt="CEA" /></label>
            <select className="fs" value={pbState} onChange={e => setPbState(e.target.value)}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: "3px" }}>
              Grid: {gf.toFixed(3)} kgCO₂/kWh
            </div>
          </div>
          <div>
            <label className="fl">Daily km driven</label>
            <input className="fi" type="number" value={km} min="1" max="500" onChange={e => setKm(+e.target.value)} />
            <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: "3px" }}>
              Annual: {Math.round(km * 365).toLocaleString()} km
            </div>
          </div>
          <div>
            <label className="fl">Ownership period</label>
            <input className="fi" type="text" value="20 years" readOnly style={{ opacity: .5 }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: "3px" }}>Fixed for projection</div>
          </div>
          <button className="btn-blk" onClick={run} style={{ padding: ".63rem 1.4rem", height: "36px" }}>
            Calculate →
          </button>
        </div>

        {/* METRIC CARDS */}
        {beData && (
          <div className="pb-metrics" style={{ marginTop: "1.2rem" }}>
            {metrics.map((m, i) => (
              <div key={i} className="pbm">
                <div className="pbm-lbl">{m.lbl}</div>
                <div className="pbm-val" style={
                  i === 0 && m.good === true  ? { color: "var(--good)" } :
                  i === 0 && m.good === false ? { color: "var(--bad)" } :
                  i === 3 && m.good === true  ? { color: "var(--good)", fontSize: ".75rem" } :
                  i === 3 && m.good === false ? { color: "var(--bad)",  fontSize: ".75rem" } :
                  i === 3 ? { fontSize: ".75rem" } : {}
                }>
                  {m.val}
                </div>
                <div className="pbm-sub">{m.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* PAYBACK INSIGHT BOX */}
        {beData && beYear && (
          <div style={{
            margin: "1rem 0", padding: "1rem 1.4rem",
            background: "rgba(200,245,66,.08)", border: "1px solid rgba(200,245,66,.3)",
            display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <div style={{ fontSize: "1.6rem" }}>🏆</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: ".88rem" }}>
                Carbon Payback at Year {beYear}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".52rem", color: "var(--fog)", marginTop: "2px" }}>
                The EV becomes cleaner than the ICE after <strong style={{ color: "var(--ink)" }}>{beYear} year{beYear > 1 ? "s" : ""}</strong> of ownership on {pbState.charAt(0) + pbState.slice(1).toLowerCase()} grid ({gf.toFixed(3)} kgCO₂/kWh).
                {annualSavingKg > 0 && ` After breakeven, you save ${(annualSavingKg / 1000).toFixed(2)} t CO₂/year.`}
              </div>
            </div>
          </div>
        )}

        {beData && !beYear && (
          <div style={{
            margin: "1rem 0", padding: "1rem 1.4rem",
            background: "rgba(232,41,28,.06)", border: "1px solid rgba(232,41,28,.25)",
            display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <div style={{ fontSize: "1.6rem" }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--bad)" }}>
                No Carbon Payback Within 20 Years
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".52rem", color: "var(--fog)", marginTop: "2px" }}>
                On {pbState.charAt(0) + pbState.slice(1).toLowerCase()} grid ({gf.toFixed(3)} kgCO₂/kWh), the EV's manufacturing carbon debt is not repaid within 20 years.
                A cleaner grid or higher mileage would reduce the payback period.
              </div>
            </div>
          </div>
        )}

        {/* BREAKEVEN CHART */}
        {beData && (
          <div className="rp">
            <div className="rp-title">
              Cumulative CO₂ — 20-Year Projection <SBadge t="cea" txt="Grid-Adjusted" /> <SBadge t="epa" txt="EPA Data" />
            </div>
            <D3Breakeven beData={beData} evLabel={evModel || "EV (demo)"} iceLabel={iceModel || "ICE (demo)"} />
            <div style={{ fontFamily: "var(--mono)", fontSize: ".5rem", color: "var(--fog)", marginTop: ".5rem" }}>
              Manufacturing carbon debt included at Year 0. Operational emissions accumulate annually.
              {beYear ? ` Crossover at Year ${beYear}.` : " No crossover within 20-year window."}
              {" "}Grid: {pbState} · {gf.toFixed(3)} kgCO₂/kWh (CEA V21.0).
            </div>

            {/* Grid decarb + battery replacement callouts */}
            <div style={{ marginTop: ".8rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
              <div style={{ padding: ".6rem .8rem", background: "rgba(200,245,66,.06)", border: "1px solid rgba(200,245,66,.2)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--acid-dk)", marginBottom: ".25rem" }}>
                  ⚡ Grid Decarbonisation
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", lineHeight: 1.6, color: "var(--fog)" }}>
                  EV ops improve as India's grid cleans up — IEA NZE 2023 projection applied:
                  today→0.82, 2030→0.55 kgCO₂/kWh. Modelled as declining multiplier per year.
                </div>
              </div>
              <div style={{ padding: ".6rem .8rem", background: "rgba(232,41,28,.04)", border: "1px solid rgba(232,41,28,.15)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--bad)", marginBottom: ".25rem" }}>
                  🔋 Battery Replacement
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", lineHeight: 1.6, color: "var(--fog)" }}>
                  +1,050 kg CO₂ expected value added at year 11 (0.30 probability × 3,500 kg replacement cost).
                  Source: IEA 2023 / BloombergNEF 2023.
                </div>
              </div>
            </div>

            {/* Model notes from backend */}
            {beData?.model_notes?.length > 0 && (
              <ModelAssumptions
                breakdownNotes={beData.model_notes}
                assumptions={[
                  "Static grid (today's intensity) used for demo mode before backend call.",
                  "ICCT class-average manufacturing used — individual battery size would improve accuracy.",
                  "Fuel price inflation and EV efficiency improvement not modelled.",
                  "US EPA vehicle efficiency data paired with India CEA grid: justified as EPA provides the most comprehensive public dataset.",
                ]}
              />
            )}
            {!beData?.model_notes && (
              <ModelAssumptions
                assumptions={[
                  "Demo mode: using default EV=9,000 kg / ICE=7,200 kg manufacturing estimates.",
                  "Grid decarbonisation: IEA India NZE 2023 trajectory applied (projection, not guaranteed).",
                  "Battery replacement: +1,050 kg expected value at year 11 (IEA 2023 / BloombergNEF).",
                  "Static grid shown until backend Calculate is run.",
                  "US EPA vehicle efficiency data + India CEA grid — EPA used as most comprehensive public dataset.",
                ]}
              />
            )}
          </div>
        )}

        {/* STATE GRID TABLE */}
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".7rem" }}>
            India State Grid Intensity <SBadge t="cea" txt="CEA V21.0" />
          </div>
          <table className="stbl">
            <thead>
              <tr><th>State</th><th>kgCO₂/kWh</th><th>Category</th><th>EV Verdict</th></tr>
            </thead>
            <tbody>
              {Object.entries(STATE_GRIDS).sort((a, b) => a[1] - b[1]).map(([s, ef]) => {
                const cat = ef < 0.5 ? "Clean" : ef < 0.8 ? "Moderate" : "Dirty";
                const col = ef < 0.5 ? "var(--good)" : ef < 0.8 ? "var(--warn)" : "var(--bad)";
                const v   = ef < 0.5 ? "✓ Strong EV advantage" : ef < 0.8 ? "~ Moderate advantage" : "⚠ Reduced EV advantage";
                const active = s === pbState;
                return (
                  <tr key={s} style={active ? { background: "rgba(200,245,66,.07)" } : {}}>
                    <td style={active ? { fontWeight: 600 } : {}}>{s.charAt(0) + s.slice(1).toLowerCase()} {active ? "◀" : ""}</td>
                    <td>
                      <span className="ef-bar" style={{ width: `${Math.round(ef / 1.2 * 100)}px`, background: col }} />
                      {ef.toFixed(3)}
                    </td>
                    <td style={{ color: col, fontWeight: 600 }}>{cat}</td>
                    <td style={{ fontSize: ".54rem", color: "var(--fog)" }}>{v}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
