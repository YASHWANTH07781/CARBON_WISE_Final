import React from "react";
import SBadge from "./SBadge";

function GWAlert({ flag, result }) {
  const icons = {
    DIRTY_GRID_EV:    "⚡",
    EXCEEDS_EEA:      "📊",
    WLTP_GAP:         "🔬",
    HYBRID_MFG_COST:  "🏭",
    MILD_HYBRID_LABEL:"🌱",
  };
  const lifecycle = result?.emissions?.total
    ? (result.emissions.total / 1000).toFixed(1) + " tCO₂"
    : null;

  return (
    <div className={`gw-alert ${flag.level}`}>
      <div className="gw-hdr">
        <span className="gw-icon">{icons[flag.code] || "⚠"}</span>
        <span className="gw-title">⚠ Greenwashing Alert — {flag.title}</span>
        <span className={`sev-pill sp-${flag.level}`}>{flag.level} RISK</span>
      </div>

      {flag.code === "DIRTY_GRID_EV" && lifecycle && (
        <div className="gw-claim">
          <div className="gw-claim-box">
            <div className="gw-claim-lbl">Advertised as</div>
            <div className="gw-claim-val ok">Zero Emissions</div>
          </div>
          <div className="gw-arrow">≠</div>
          <div className="gw-claim-box">
            <div className="gw-claim-lbl">Lifecycle reality</div>
            <div className="gw-claim-val bad">{lifecycle}</div>
          </div>
        </div>
      )}

      {flag.code === "EXCEEDS_EEA" && (
        <div className="gw-claim">
          <div className="gw-claim-box">
            <div className="gw-claim-lbl">EEA Target</div>
            <div className="gw-claim-val ok">95 g/km</div>
          </div>
          <div className="gw-arrow">vs</div>
          <div className="gw-claim-box">
            <div className="gw-claim-lbl">This vehicle</div>
            <div className="gw-claim-val bad">&gt;142 g/km</div>
          </div>
        </div>
      )}

      {flag.code === "WLTP_GAP" && (
        <div className="gw-claim">
          <div className="gw-claim-box">
            <div className="gw-claim-lbl">EPA rated</div>
            <div className="gw-claim-val ok">Optimistic</div>
          </div>
          <div className="gw-arrow">→</div>
          <div className="gw-claim-box">
            <div className="gw-claim-lbl">WLTP real-world</div>
            <div className="gw-claim-val bad">+8–20% higher</div>
          </div>
        </div>
      )}

      <div className="gw-detail">{flag.detail}</div>
      <div className="sb-row" style={{ marginTop: ".35rem" }}>
        <SBadge t="eea" txt="EEA 2024" />
        {flag.code === "DIRTY_GRID_EV" && <SBadge t="cea" txt="CEA Grid" />}
      </div>
    </div>
  );
}

export default function FlagList({ flags, result }) {
  if (!flags || !flags.length) {
    return (
      <div style={{
        fontFamily: "var(--mono)", fontSize: ".58rem", color: "var(--good)",
        padding: ".65rem", background: "rgba(34,197,94,.05)", border: "1px solid rgba(34,197,94,.18)",
      }}>
        ✓ No greenwashing flags detected for this configuration.
      </div>
    );
  }
  return <div>{flags.map((f, i) => <GWAlert key={i} flag={f} result={result} />)}</div>;
}
