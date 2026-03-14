import React, { useState } from "react";
import SBadge from "./SBadge";
import ModelAssumptions from "./ModelAssumptions";
import { typeBadge, WLTP_CORRECTION, EEA_TARGETS } from "../utils";

export default function NutritionLabel({ result }) {
  const [showSources, setShowSources] = useState(false);
  if (!result?.emissions) return null;

  const { manufacturing, operational, end_of_life, total } = result.emissions;
  const gf    = result.location?.emission_factor;
  const vtype = result.vehicle_type;
  const totalKm = result.distance?.total_km || 0;
  const ds    = result.data_sources || {};

  // Operational g/km
  const opPerKm = totalKm > 0 ? Math.round(operational / totalKm * 1000) : null;

  // WLTP-adjusted total
  const wltpFactor = WLTP_CORRECTION[vtype] || 1.10;
  const wltpTotal  = Math.round(manufacturing + operational * wltpFactor + end_of_life);
  const eeaTarget  = EEA_TARGETS[vtype];

  const phases = [
    {
      k: "Manufacturing CO₂",
      v: manufacturing,
      c: "rgba(10,10,8,.78)",
      src: ds.manufacturing?.source || "ICCT 2021 + IEA 2023",
      note: ds.manufacturing?.note || `Base × size factor`,
    },
    {
      k: "Operational CO₂",
      v: operational,
      c: "rgba(200,245,66,.85)",
      src: ds.operational?.source || "EPA FuelEconomy.gov",
      note: ds.operational?.note || (vtype === "EV" ? `Grid: ${gf?.toFixed(3)} kgCO₂/kWh (CEA V21.0)` : "EPA co2TailpipeGpm column"),
    },
    {
      k: "Battery / Disposal",
      v: end_of_life,
      c: "rgba(232,41,28,.55)",
      src: ds.end_of_life?.source || "ICCT 2021 + EU Battery Reg",
      note: ds.end_of_life?.note || "End-of-life recycling estimate",
    },
  ];

  const flags    = result.greenwash_flags || [];
  const highFlags = flags.filter(f => f.level === "HIGH");

  return (
    <div className="nlabel">
      {/* HEADER */}
      <div className="nl-head">
        <div>
          <div className="nl-name">{result.model}</div>
          <div className="nl-tag">Carbon Nutrition Label · {result.standard || "EPA"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
          <span className={`vbadge ${typeBadge(vtype)}`}>{vtype}</span>
          {highFlags.length > 0 && (
            <span style={{ fontFamily: "var(--mono)", fontSize: ".38rem", color: "var(--bad)" }}>
              ⚠ {highFlags.length} greenwash flag{highFlags.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="nl-body">
        {phases.map((p, i) => {
          const pct = total > 0 ? Math.round(p.v / total * 100) : 0;
          return (
            <div key={i}>
              <div className="nl-row">
                <span className="nl-k">{p.k}</span>
                <span className="nl-v">{(p.v / 1000).toFixed(2)} t</span>
              </div>
              <div className="nl-bar-wrap">
                <div className="nl-bar-bg">
                  <div className="nl-bar-fill" style={{ width: `${pct}%`, background: p.c }} />
                </div>
                <div className="nl-pct">{pct}%</div>
              </div>
              {showSources && (
                <div style={{ fontFamily: "var(--mono)", fontSize: ".38rem", color: "var(--fog)",
                  padding: "2px 6px", background: "rgba(10,10,8,.03)", marginBottom: ".2rem",
                  borderLeft: "2px solid rgba(10,10,8,.1)", lineHeight: 1.5 }}>
                  <strong>Source:</strong> {p.src}<br />
                  {p.note}
                </div>
              )}
            </div>
          );
        })}

        {/* TOTAL */}
        <div className="nl-row total">
          <span className="nl-k">TOTAL LIFECYCLE</span>
          <span className="nl-v">{(total / 1000).toFixed(2)} t CO₂</span>
        </div>

        {/* STATS GRID */}
        <div style={{ borderTop: "1px dashed rgba(10,10,8,.1)", marginTop: ".5rem", paddingTop: ".5rem",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".3rem" }}>

          {opPerKm !== null && (
            <div style={{ padding: ".3rem .4rem", background: "var(--cream)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".36rem", color: "var(--fog)", textTransform: "uppercase", letterSpacing: ".08em" }}>Ops g CO₂/km</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".62rem", fontWeight: 600 }}>{opPerKm} g/km</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".34rem", color: "var(--fog)" }}>EPA measured</div>
            </div>
          )}

          {eeaTarget !== undefined && (
            <div style={{ padding: ".3rem .4rem", background: eeaTarget !== null && opPerKm !== null && opPerKm > eeaTarget * 1.5 ? "rgba(232,41,28,.06)" : "rgba(200,245,66,.07)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".36rem", color: "var(--fog)", textTransform: "uppercase", letterSpacing: ".08em" }}>EEA Fleet Target</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".62rem", fontWeight: 600 }}>
                {eeaTarget === 0 ? "0 g/km" : `${eeaTarget} g/km`}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".34rem", color: "var(--fog)" }}>EU 2025 · EEA</div>
            </div>
          )}

          <div style={{ padding: ".3rem .4rem", background: "var(--cream)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".36rem", color: "var(--fog)", textTransform: "uppercase", letterSpacing: ".08em" }}>WLTP Est.</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".62rem", fontWeight: 600 }}>{(wltpTotal / 1000).toFixed(2)} t</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".34rem", color: "var(--fog)" }}>×{wltpFactor} correction</div>
          </div>

          {gf && (
            <div style={{ padding: ".3rem .4rem", background: gf > 0.85 ? "rgba(232,41,28,.06)" : gf < 0.5 ? "rgba(200,245,66,.08)" : "var(--cream)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".36rem", color: "var(--fog)", textTransform: "uppercase", letterSpacing: ".08em" }}>Grid kgCO₂/kWh</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".62rem", fontWeight: 600, color: gf > 0.85 ? "var(--bad)" : gf < 0.5 ? "var(--good)" : "inherit" }}>
                {gf.toFixed(3)}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".34rem", color: "var(--fog)" }}>CEA V21.0</div>
            </div>
          )}
        </div>

        {/* SOURCE TOGGLE */}
        <button onClick={() => setShowSources(s => !s)} style={{
          marginTop: ".4rem", width: "100%", fontFamily: "var(--mono)", fontSize: ".42rem",
          background: "none", border: "1px solid rgba(10,10,8,.1)", padding: ".3rem",
          cursor: "pointer", color: "var(--fog)", letterSpacing: ".06em",
        }}>
          {showSources ? "▲ Hide data sources" : "▼ Show data sources per row"}
        </button>
      </div>

      {/* FOOTER */}
      <div className="nl-foot" style={{ flexWrap: "wrap", gap: ".3rem" }}>
        <span className="nl-foot-txt">EPA · CEA India · ICCT LCA · IEA 2023</span>
        <div style={{ display: "flex", gap: ".3rem" }}>
          <SBadge t="epa"  txt="EPA" />
          <SBadge t="cea"  txt="CEA" />
          <SBadge t="icct" txt="ICCT" />
        </div>
      </div>

      {/* MODEL ASSUMPTIONS */}
      {result?.model_assumptions?.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(10,10,8,.06)" }}>
          <ModelAssumptions assumptions={result.model_assumptions} compact />
        </div>
      )}
    </div>
  );
}
