import React from "react";
import SBadge from "./SBadge";
import { typeBadge } from "../utils";

export default function ULPanel({ results }) {
  if (!results || results.length < 1) return null;
  return (
    <div className="ulp">
      <div className="rp-title">
        Upfront Carbon Cost vs Long-Term Operational <SBadge t="icct" txt="ICCT LCA" />
      </div>
      {results.map((r, i) => {
        const { manufacturing, operational, end_of_life, total } = r.emissions;
        const upfront = manufacturing + end_of_life;
        const upPct = Math.round(upfront / total * 100);
        const ltPct = Math.round(operational / total * 100);
        return (
          <div key={i} className="ulp-vehicle">
            <div className="ulp-model-row">
              {r.model}
              <span className={`vbadge ${typeBadge(r.vehicle_type)}`}>{r.vehicle_type}</span>
            </div>
            <div className="ulp-split">
              <div className="ulp-box up">
                <div className="ulp-lbl up">Upfront Carbon</div>
                <div className="ulp-val">{(upfront / 1000).toFixed(2)}t</div>
                <div className="ulp-sub">Manufacturing + Disposal</div>
              </div>
              <div className="ulp-arrow">→</div>
              <div className="ulp-box lt">
                <div className="ulp-lbl lt">Lifetime Operational</div>
                <div className="ulp-val">{(operational / 1000).toFixed(2)}t</div>
                <div className="ulp-sub">Fuel / Grid Energy</div>
              </div>
            </div>
            {[
              { n: "Manufacturing + Disposal (Upfront)",    v: upfront,    pct: upPct, c: "rgba(232,41,28,.5)" },
              { n: "Operational Fuel/Energy (Long-Term)",   v: operational, pct: ltPct, c: "rgba(200,245,66,.7)" },
            ].map((ph, j) => (
              <div key={j} className="prog-row">
                <div className="prog-hdr">
                  <span className="prog-name">{ph.n}</span>
                  <span className="prog-val">{(ph.v / 1000).toFixed(2)}t ({ph.pct}%)</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${ph.pct}%`, background: ph.c }} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
