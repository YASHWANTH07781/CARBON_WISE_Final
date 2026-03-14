import React, { useState } from "react";
import SBadge from "./SBadge";

const SOURCES = [
  {
    tag: "epa",
    name: "EPA FuelEconomy.gov",
    subtitle: "Vehicle Dataset — Official US Federal Data",
    records: "49,580 vehicles · 1984–2026",
    fields: ["co2TailpipeGpm (g/mile)", "combE (kWh/100mi)", "comb08 (MPG combined)", "atvType (EV/Hybrid/ICE)", "VClass (size category)", "ghgScore, feScore"],
    usedFor: "All vehicle efficiency, CO₂ tailpipe, and EV energy data",
    url: "https://fueleconomy.gov/feg/download.shtml",
    color: "#1a4e8a",
    bg: "rgba(26,78,138,.07)",
  },
  {
    tag: "eea",
    name: "EEA Fleet CO₂ Monitoring 2024",
    subtitle: "European Environment Agency — Fleet Targets",
    records: "EU 2025 fleet CO₂ targets",
    fields: ["ICE fleet target: 95 g/km", "Hybrid fleet target: 100 g/km", "EV tailpipe target: 0 g/km", "WLTP EU Regulation 2017/1151", "EU Regulation 2023/851 (2025 targets)"],
    usedFor: "Greenwash detection thresholds & WLTP normalisation factors",
    url: "https://eea.europa.eu/en/analysis/publications/fleet-targets",
    color: "#1a6b3a",
    bg: "rgba(26,107,58,.07)",
  },
  {
    tag: "cea",
    name: "India CEA CO₂ Baseline V21.0",
    subtitle: "Central Electricity Authority — Ministry of Power",
    records: "35+ Indian states · 2024–25",
    fields: ["kgCO₂/kWh per state", "Himachal Pradesh: 0.120 (cleanest)", "Bihar: 0.985 (highest)", "National average: 0.820", "Updated annually from Ember India"],
    usedFor: "EV operational emissions — grid intensity multiplied by kWh consumed",
    url: "https://cea.nic.in/cdm-co2-baseline-database/",
    color: "#4a6000",
    bg: "rgba(200,245,66,.08)",
  },
  {
    tag: "icct",
    name: "ICCT Lifecycle Analysis 2021",
    subtitle: "International Council on Clean Transportation",
    records: "Global LCA benchmarks",
    fields: ["ICE manufacturing: 7,200 kgCO₂", "EV manufacturing: 6,500 kgCO₂ base", "Battery disposal: 5% of mfg CO₂", "20 vehicle class size-scaling factors", "Upfront vs long-term carbon split"],
    usedFor: "Manufacturing emissions, end-of-life costs, LCA framework",
    url: "https://theicct.org/publication/a-global-comparison-of-the-life-cycle-greenhouse-gas-emissions-of-combustion-engine-and-electric-passenger-cars/",
    color: "#6b21a8",
    bg: "rgba(100,0,150,.06)",
  },
  {
    tag: "epa",
    name: "IPCC 2006 Guidelines",
    subtitle: "Fuel Emission Factors (Fallback)",
    records: "IPCC NGGIP Tier 1 values",
    fields: ["Petrol/Gasoline: 2.348 kgCO₂/L", "Diesel: 2.690 kgCO₂/L", "Used only when EPA co2TailpipeGpm = 0", "Conversion: MPG → L/100km → kgCO₂/km"],
    usedFor: "ICE fallback calculation when direct EPA emissions data is absent",
    url: "https://ipcc-nggip.iges.or.jp/",
    color: "#1a4e8a",
    bg: "rgba(26,78,138,.04)",
  },
];

export default function DataSourcesPanel({ compact = false }) {
  const [expanded, setExpanded] = useState(null);

  if (compact) {
    return (
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", alignItems: "center", padding: ".5rem 0" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)", letterSpacing: ".1em", textTransform: "uppercase" }}>Data:</span>
        {SOURCES.slice(0, 4).map((s, i) => (
          <SBadge key={i} t={s.tag} txt={s.name.split(" ")[0] + " " + s.name.split(" ")[1]} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 3rem 3rem", background: "var(--cream)" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".22em", textTransform: "uppercase", color: "var(--fog)", marginBottom: ".4rem" }}>
        Data Provenance
      </div>
      <div style={{ fontFamily: "var(--serif)", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-.5px", marginBottom: ".4rem" }}>
        Where Every Number Comes From
      </div>
      <p style={{ fontSize: ".78rem", color: "var(--fog)", lineHeight: 1.7, maxWidth: 600, marginBottom: "1.5rem" }}>
        No dummy data. Every emission figure is derived from real government and research datasets
        using verified LCA methodology.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1px", background: "rgba(10,10,8,.08)" }}>
        {SOURCES.map((s, i) => (
          <div key={i}
            style={{ background: "var(--paper)", padding: "1.2rem 1.4rem", cursor: "pointer", transition: "background .15s" }}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: ".6rem" }}>
              <SBadge t={s.tag} txt={s.tag.toUpperCase()} />
              <span style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)" }}>
                {expanded === i ? "▲ less" : "▼ details"}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: ".18rem" }}>{s.name}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: ".46rem", color: "var(--fog)", marginBottom: ".5rem" }}>{s.subtitle}</div>
            <div style={{
              display: "inline-block", fontFamily: "var(--mono)", fontSize: ".42rem",
              background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 2,
              border: `1px solid ${s.color}33`, marginBottom: ".5rem"
            }}>
              {s.records}
            </div>

            {expanded === i && (
              <div style={{ marginTop: ".6rem", borderTop: "1px solid rgba(10,10,8,.07)", paddingTop: ".6rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".4rem" }}>
                  Key fields used
                </div>
                {s.fields.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: ".4rem", marginBottom: ".22rem" }}>
                    <span style={{ color: s.color, fontSize: ".5rem", lineHeight: 1.4 }}>›</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: ".5rem", color: "var(--ink)", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
                <div style={{ marginTop: ".7rem", padding: ".5rem .7rem", background: s.bg, borderLeft: `2px solid ${s.color}` }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginBottom: ".15rem" }}>USED FOR</div>
                  <div style={{ fontSize: ".72rem", color: "var(--ink)", lineHeight: 1.5 }}>{s.usedFor}</div>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: ".5rem", fontFamily: "var(--mono)", fontSize: ".44rem", color: s.color, textDecoration: "none", letterSpacing: ".04em" }}
                  onClick={e => e.stopPropagation()}>
                  ↗ Official source
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LCA FORMULA TABLE */}
      <div style={{ marginTop: "1.5rem", padding: "1.2rem 1.4rem", background: "var(--ink)", color: "var(--paper)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".48rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--acid)", marginBottom: ".8rem" }}>
          Standardised LCA Formula — gCO₂eq / Lifecycle
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: ".52rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,242,236,.12)" }}>
                {["Vehicle", "Manufacturing (t)", "Usage / 10yr (t)", "Disposal (t)", "Total (t)", "Standard"].map((h, i) => (
                  <th key={i} style={{ padding: ".5rem .8rem", textAlign: i > 0 ? "right" : "left", color: "var(--fog)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["EV",     "6.5–8.0",  "~5 (grid-dep.)",  "0.3–0.4", "12–18", "EPA + CEA + ICCT"],
                ["Hybrid", "7.2–9.0",  "~8 (fuel)",       "0.4",     "16–18", "EPA + IPCC + ICCT"],
                ["ICE",    "7.2–8.8",  "12–25 (fuel)",    "0.4",     "20–35", "EPA + IPCC"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(245,242,236,.06)" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: ".45rem .8rem", textAlign: j > 0 ? "right" : "left", color: j === 0 ? "var(--acid)" : "rgba(245,242,236,.7)" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "rgba(245,242,236,.3)", marginTop: ".7rem" }}>
          All figures in tonnes CO₂ equivalent (tCO₂e). Usage = 40 km/day × 365 days × 10 years = 146,000 km. Grid: Maharashtra 0.790 kgCO₂/kWh.
        </div>
      </div>
    </div>
  );
}
