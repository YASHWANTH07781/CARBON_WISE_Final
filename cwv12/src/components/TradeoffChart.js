import React, { useRef, useEffect } from "react";
import SBadge from "./SBadge";
import { typeBadge, typeColor } from "../utils";

/**
 * TradeoffChart — the "Upfront Carbon Cost vs Long-Term Savings" visualization
 * Requirement 4 from the problem statement.
 * Shows manufacturing carbon debt (upfront) vs operational carbon over time,
 * making the tradeoff instantly visible at a glance.
 */
export default function TradeoffChart({ results = [], years = 10 }) {
  if (!results.length) return null;

  const maxTotal = Math.max(...results.map(r => r.emissions.total));

  return (
    <div style={{ background: "var(--paper)", border: "1px solid rgba(10,10,8,.1)", padding: "1.1rem", marginBottom: ".9rem" }}>
      <div className="rp-title" style={{ marginBottom: ".9rem" }}>
        Carbon Tradeoff — Upfront Cost vs Long-Term Savings
        <span style={{ marginLeft: ".5rem" }}><SBadge t="icct" txt="ICCT LCA" /></span>
      </div>

      {/* Side-by-side tradeoff bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: ".7rem", marginBottom: "1rem" }}>
        {results.map((r, i) => {
          const { manufacturing, operational, end_of_life, total } = r.emissions;
          const upfront = manufacturing + end_of_life;
          const upPct   = total > 0 ? (upfront / maxTotal * 100) : 0;
          const opPct   = total > 0 ? (operational / maxTotal * 100) : 0;
          const color   = typeColor(r.vehicle_type);

          return (
            <div key={i}>
              {/* Model label */}
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: ".5rem", fontWeight: 600 }}>{r.model}</span>
                <span className={`vbadge ${typeBadge(r.vehicle_type)}`}>{r.vehicle_type}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: ".48rem", color: "var(--fog)" }}>
                  Total: <strong style={{ color: "var(--ink)" }}>{(total/1000).toFixed(2)} t CO₂</strong>
                </span>
              </div>

              {/* Upfront bar */}
              <div style={{ marginBottom: ".2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--bad)" }}>
                    🏭 Upfront (Mfg + Disposal)
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)" }}>
                    {(upfront/1000).toFixed(2)}t · {Math.round(upfront/total*100)}%
                  </span>
                </div>
                <div style={{ height: "12px", background: "rgba(10,10,8,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${upPct}%`,
                    background: "rgba(232,41,28,.65)", borderRadius: 2,
                    transition: "width 1s cubic-bezier(.25,1,.5,1)",
                  }} />
                </div>
              </div>

              {/* Operational bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--acid-dk)" }}>
                    ⚡ Long-Term Ops ({years} yrs fuel/energy)
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)" }}>
                    {(operational/1000).toFixed(2)}t · {Math.round(operational/total*100)}%
                  </span>
                </div>
                <div style={{ height: "12px", background: "rgba(10,10,8,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${opPct}%`,
                    background: color, borderRadius: 2, opacity: 0.75,
                    transition: "width 1s cubic-bezier(.25,1,.5,1)",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight: who wins upfront vs long-term */}
      <InsightRow results={results} />

      <div style={{ fontFamily: "var(--mono)", fontSize: ".42rem", color: "var(--fog)", marginTop: ".6rem" }}>
        Bars scaled to highest total. Upfront = manufacturing + battery disposal. Long-term = fuel or grid energy over {years} years.
        Source: ICCT 2021 LCA · EPA FuelEconomy.gov · CEA India V21.0.
      </div>
    </div>
  );
}

function InsightRow({ results }) {
  if (results.length < 2) return null;
  const sortedByUpfront = [...results].sort((a, b) =>
    (a.emissions.manufacturing + a.emissions.end_of_life) - (b.emissions.manufacturing + b.emissions.end_of_life)
  );
  const sortedByOps = [...results].sort((a, b) => a.emissions.operational - b.emissions.operational);
  const lowestUpfront = sortedByUpfront[0];
  const lowestOps     = sortedByOps[0];
  const sameWinner    = lowestUpfront.model === lowestOps.model;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: sameWinner ? "1fr" : "1fr 1fr",
      gap: ".6rem", marginTop: ".5rem",
    }}>
      <div style={{
        padding: ".55rem .8rem",
        background: "rgba(232,41,28,.05)", border: "1px solid rgba(232,41,28,.18)",
      }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".4rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--bad)", marginBottom: ".2rem" }}>
          Lowest upfront carbon
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".56rem", fontWeight: 600 }}>
          {lowestUpfront.model}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)", marginTop: ".15rem" }}>
          {((lowestUpfront.emissions.manufacturing + lowestUpfront.emissions.end_of_life)/1000).toFixed(2)}t upfront CO₂
        </div>
      </div>
      {!sameWinner && (
        <div style={{
          padding: ".55rem .8rem",
          background: "rgba(200,245,66,.06)", border: "1px solid rgba(200,245,66,.25)",
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: ".4rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--acid-dk)", marginBottom: ".2rem" }}>
            Lowest long-term ops
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: ".56rem", fontWeight: 600 }}>
            {lowestOps.model}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--fog)", marginTop: ".15rem" }}>
            {(lowestOps.emissions.operational/1000).toFixed(2)}t operational CO₂
          </div>
        </div>
      )}
      {sameWinner && (
        <div style={{ fontFamily: "var(--mono)", fontSize: ".44rem", color: "var(--acid-dk)" }}>
          ✓ {lowestUpfront.model} wins on both upfront AND long-term carbon — clear lifecycle winner.
        </div>
      )}
    </div>
  );
}
