import React, { useState } from "react";

/**
 * ModelAssumptions — transparent disclosure of what the LCA model
 * assumes for this specific vehicle calculation.
 * Shown on Carbon Label and Payback page.
 * Answers judge questions like "how did you calculate this?" proactively.
 */
export default function ModelAssumptions({ assumptions = [], breakdownNotes = [], compact = false }) {
  const [open, setOpen] = useState(false);

  const allNotes = [...(assumptions || []), ...(breakdownNotes || [])];
  if (!allNotes.length) return null;

  if (compact) {
    return (
      <div style={{ marginTop: ".4rem" }}>
        <button onClick={() => setOpen(o => !o)} style={{
          fontFamily: "var(--mono)", fontSize: ".42rem", background: "none",
          border: "1px solid rgba(10,10,8,.12)", padding: ".28rem .6rem",
          cursor: "pointer", color: "var(--fog)", letterSpacing: ".06em", width: "100%",
        }}>
          {open ? "▲ Hide model assumptions" : "▼ View model assumptions & limitations"}
        </button>
        {open && <AssumptionList notes={allNotes} />}
      </div>
    );
  }

  return (
    <div style={{
      marginTop: ".8rem", border: "1px solid rgba(10,10,8,.09)",
      background: "var(--paper)",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: ".6rem .9rem", fontFamily: "var(--mono)", fontSize: ".46rem",
        background: "rgba(10,10,8,.02)", border: "none", cursor: "pointer",
        letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fog)",
      }}>
        <span>📋 Model Assumptions & Limitations</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid rgba(10,10,8,.06)", padding: ".7rem .9rem" }}>
          <AssumptionList notes={allNotes} />
          <div style={{
            marginTop: ".6rem", padding: ".5rem .7rem",
            background: "rgba(200,245,66,.06)", border: "1px solid rgba(200,245,66,.2)",
            fontFamily: "var(--mono)", fontSize: ".44rem", lineHeight: 1.6,
          }}>
            <strong style={{ color: "var(--acid-dk)" }}>Hackathon note:</strong>{" "}
            We use ICCT lifecycle average estimates scaled by vehicle class. Individual model
            accuracy improves with battery size, manufacturing location, and supply chain data —
            improvements planned for a production version. All methodology documented on the Methodology page.
          </div>
        </div>
      )}
    </div>
  );
}

function AssumptionList({ notes }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
      {notes.map((note, i) => (
        <div key={i} style={{
          display: "flex", gap: ".5rem", alignItems: "flex-start",
          fontFamily: "var(--mono)", fontSize: ".46rem", lineHeight: 1.6,
          color: "var(--fog)", padding: ".2rem 0",
          borderBottom: i < notes.length - 1 ? "1px solid rgba(10,10,8,.04)" : "none",
        }}>
          <span style={{ color: "var(--fog)", opacity: .5, flexShrink: 0 }}>{i + 1}.</span>
          <span>{note}</span>
        </div>
      ))}
    </div>
  );
}
