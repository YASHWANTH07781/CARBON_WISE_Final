import React, { useState, useEffect } from "react";
import SBadge from "../components/SBadge";
import DataSourcesPanel from "../components/DataSourcesPanel";

export default function HomePage({ onNav }) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const slides = [
    { bg: "#0a0a08", icon: "🚗", badge: "ELECTRIC VEHICLE",  name: "Zero Tailpipe.\nReal Lifecycle Cost.", co2: "~8–16t",  col: "#c8f542" },
    { bg: "#0d1a0d", icon: "🚙", badge: "HYBRID",            name: "Best of Both.\nOr Neither?",         co2: "~7–12t",  col: "#6bffcf" },
    { bg: "#1a0e0a", icon: "🚕", badge: "PETROL / DIESEL",   name: "Lower Upfront.\nHigher Long-Term.",   co2: "~20–40t", col: "#ffaa66" },
  ];

  const tickerItems = [
    "49,580 EPA Records", "EEA Fleet CO₂ Targets 2024", "CEA India Grid (35 States)",
    "ICCT LCA Methodology", "Carbon Nutrition Label", "React 18 + D3.js v7 + Chart.js 4.4",
    "Total Carbon Cost Calculator", "5-Factor Greenwash Detection",
    "Manufacturing + Disposal + Operations", "WLTP vs EPA Normalisation",
    "Python Flask + Node.js Backend",
  ];

  return (
    <div className="page">
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-l">
          <div className="hero-iss">Issue 01 · Sustainable Mobility · 2025</div>
          <h1 className="hero-h1">The Carbon<br /><em>Nutritional</em><br />Label.</h1>
          <p className="hero-sub">
            Manufacturing + Fuel + Battery Disposal. Not just tailpipe. The only apples-to-apples
            lifecycle comparison built on 49,580 real EPA records — with EEA greenwash detection.
          </p>
          <div className="hero-btns">
            <button className="btn-blk" onClick={() => onNav("recommend")}>⭐ Get My Recommendation →</button>
            <button className="btn-ol"  onClick={() => onNav("compare")}>Compare Vehicles</button>
            <button className="btn-ol"  onClick={() => onNav("greenwash")}>Detect Greenwashing</button>
            <button className="btn-ol"  onClick={() => onNav("payback")}>Carbon Payback</button>
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: ".52rem", lineHeight: 1.7,
            color: "var(--fog)", maxWidth: 460, marginBottom: "1rem",
            padding: ".6rem .9rem", borderLeft: "3px solid var(--acid)",
            background: "rgba(200,245,66,.05)"
          }}>
            "Carbon-Wise is like <strong style={{ color: "var(--ink)" }}>Google Flights for sustainable cars</strong> — it compares lifecycle emissions of EVs, hybrids, and petrol vehicles and recommends the lowest-carbon option based on how you actually drive."
          </div>
          <div className="sb-row" style={{ marginBottom: "1rem" }}>
            <SBadge t="epa"  txt="49,580 EPA Records" />
            <SBadge t="eea"  txt="EEA Fleet Targets" />
            <SBadge t="cea"  txt="35+ India State Grids" />
            <SBadge t="icct" txt="ICCT LCA Method" />
          </div>
          <div className="hero-stats">
            <div><div className="hn">49k+</div><div className="hl">EPA vehicles<br />in database</div></div>
            <div><div className="hn">84</div><div className="hl">EPA data<br />columns used</div></div>
            <div><div className="hn">35+</div><div className="hl">India state<br />grid factors</div></div>
            <div><div className="hn">5</div><div className="hl">Greenwash<br />detection factors</div></div>
          </div>
        </div>

        <div className="hero-r">
          {slides.map((s, i) => (
            <div key={i} className="slide" style={{
              opacity: i === slideIdx ? 1 : 0,
              background: s.bg,
              pointerEvents: i === slideIdx ? "auto" : "none",
            }}>
              <div style={{ fontSize: "5.5rem", marginBottom: "1.3rem", animation: "fl 4s ease-in-out infinite" }}>
                {s.icon}
              </div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: ".44rem", letterSpacing: ".28em",
                textTransform: "uppercase", padding: "2px 10px",
                color: s.col, border: `1px solid ${s.col}44`, marginBottom: ".8rem",
              }}>
                {s.badge}
              </div>
              <div style={{
                fontFamily: "var(--serif)", fontSize: "1.45rem", fontWeight: 700,
                color: "#f5f2ec", textAlign: "center", marginBottom: ".45rem",
                whiteSpace: "pre-line", letterSpacing: "-.4px",
              }}>
                {s.name}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: ".58rem", color: "#8a9080", textAlign: "center" }}>
                Lifecycle: <span style={{ color: s.col, fontSize: ".95rem" }}>{s.co2}</span> CO₂
              </div>
            </div>
          ))}
          <div className="slide-dots">
            {slides.map((_, i) => (
              <button key={i} className={`sdot${i === slideIdx ? " on" : ""}`} onClick={() => setSlideIdx(i)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div className="ticker">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="ti">{t} <span style={{ color: "rgba(200,245,66,.28)" }}>·</span></span>
          ))}
        </div>
      </div>

      {/* ── FEATURE GRID ── */}
      <div className="feat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="fc" style={{ background: "var(--ink)", borderRight: "1px solid rgba(200,245,66,.15)" }}>
          <div className="fc-n" style={{ color: "rgba(200,245,66,.5)" }}>00 — Recommend</div>
          <div className="fc-h" style={{ color: "var(--acid)" }}>Find Your<br />Best Vehicle</div>
          <div className="fc-b" style={{ color: "rgba(245,242,236,.45)" }}>Enter daily km + location. Engine calculates lifecycle CO₂ for EV, Hybrid, and ICE vehicles and recommends the lowest-carbon option for your exact profile.</div>
          <div className="sb-row" style={{ marginTop: ".7rem" }}>
            <SBadge t="epa" txt="13 vehicles" /><SBadge t="icct" txt="LCA ranked" />
          </div>
          <button onClick={() => onNav("recommend")} style={{ marginTop: ".8rem", background: "var(--acid)", color: "var(--ink)", fontFamily: "var(--mono)", fontSize: ".5rem", letterSpacing: ".1em", textTransform: "uppercase", border: "none", padding: ".5rem 1rem", cursor: "pointer" }}>
            Try Now →
          </button>
        </div>
        <div className="fc">
          <div className="fc-n">01 — Standardise</div>
          <div className="fc-h">LCA Engine</div>
          <div className="fc-b">Normalises 49,580 EPA records across fuel types using WLTP correction. Manufacturing + operational + battery disposal in one comparable t CO₂ number.</div>
          <div className="sb-row" style={{ marginTop: ".7rem" }}>
            <SBadge t="epa" txt="EPA Data" /><SBadge t="icct" txt="ICCT LCA" />
          </div>
        </div>
        <div className="fc dark">
          <div className="fc-n">02 — Detect</div>
          <div className="fc-h">Greenwash<br />Detector</div>
          <div className="fc-b">5-factor flagging: EEA targets, WLTP gaps, dirty-grid EVs, battery mfg costs. Shows manufacturer claim vs lifecycle reality side by side.</div>
          <div className="sb-row" style={{ marginTop: ".7rem" }}>
            <SBadge t="eea" txt="EEA 2024" /><SBadge t="cea" txt="CEA Grid" />
          </div>
        </div>
        <div className="fc">
          <div className="fc-n">03 — Decide</div>
          <div className="fc-h">Nutrition<br />Label</div>
          <div className="fc-b">Per-vehicle Carbon Nutrition Label: upfront vs long-term split, EEA target comparison, WLTP estimate, grid intensity, and source tag on every data point.</div>
          <div className="sb-row" style={{ marginTop: ".7rem" }}>
            <SBadge t="epa" txt="EPA Data" /><SBadge t="eea" txt="EEA Standards" />
          </div>
        </div>
      </div>

      {/* ── INLINE LCA TABLE ── */}
      <div style={{ margin: "0 3rem 3rem", padding: "1.5rem", background: "var(--ink)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--acid)", marginBottom: ".9rem" }}>
          Standardised LCA Output — All Figures in t CO₂e
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: ".54rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,242,236,.12)" }}>
                {["Vehicle", "Manufacturing", "Usage / 10yr", "Disposal", "Total", "Data Source"].map((h, i) => (
                  <th key={i} style={{ padding: ".45rem .7rem", textAlign: i > 0 ? "right" : "left", color: "var(--fog)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["⚡ EV",      "6.5–8.0 t",  "~5 t (grid-dependent)", "0.3–0.4 t", "12–18 t", "EPA + CEA + ICCT"],
                ["♻️ Hybrid",  "7.2–9.0 t",  "~8 t (petrol)",         "0.4 t",     "16–18 t", "EPA + IPCC + ICCT"],
                ["⛽ ICE",     "7.2–8.8 t",  "12–25 t (petrol)",      "0.4 t",     "20–35 t", "EPA + IPCC"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(245,242,236,.06)" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: ".4rem .7rem", textAlign: j > 0 ? "right" : "left",
                      color: j === 0 ? "var(--acid)" : j === 4 ? "#fff" : "rgba(245,242,236,.55)",
                      fontWeight: j === 4 ? 600 : 400 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "rgba(245,242,236,.28)", marginTop: ".6rem" }}>
          Assumptions: 40 km/day · 365 days · 10 years · Maharashtra grid 0.790 kgCO₂/kWh. EV: 15 kWh/100km. ICE: EPA co2TailpipeGpm. Sources: EPA FuelEconomy.gov · CEA V21.0 · ICCT 2021 · IPCC 2006.
        </div>
      </div>

      {/* ── DATA SOURCES PANEL ── */}
      <DataSourcesPanel />
    </div>
  );
}
