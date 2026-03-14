// ── Shared constants and helpers — extracted from v5 frontend/index.html ──

export const WLTP_CORRECTION = { EV: 1.20, Hybrid: 1.12, ICE: 1.08 };
export const EEA_TARGETS     = { EV: 0, Hybrid: 100, ICE: 95 };

export const STATE_GRIDS = {
  "ANDHRA PRADESH": 0.8190, "ASSAM": 0.6432, "BIHAR": 0.9852, "CHHATTISGARH": 0.8686,
  "DELHI": 0.72, "GOA": 0.70, "GUJARAT": 0.78, "HARYANA": 0.81, "HIMACHAL PRADESH": 0.12,
  "JHARKHAND": 0.9482, "KARNATAKA": 0.53, "KERALA": 0.42, "MADHYA PRADESH": 0.89,
  "MAHARASHTRA": 0.79, "MANIPUR": 0.40, "MEGHALAYA": 0.55, "MIZORAM": 0.38,
  "NAGALAND": 0.42, "ODISHA": 0.9162, "PUDUCHERRY": 0.85, "PUNJAB": 0.6940,
  "RAJASTHAN": 0.8340, "SIKKIM": 0.20, "TAMIL NADU": 0.7065, "TELANGANA": 0.9011,
  "TRIPURA": 0.6792, "UTTAR PRADESH": 0.8723, "UTTARAKHAND": 0.35,
  "WEST BENGAL": 0.8805, "JAMMU AND KASHMIR": 0.28,
};

export const COLORS   = ["#c8f542", "#6bffcf", "#ffaa66", "#ff6b6b", "#a78bfa"];
export const TYPE_COL = { EV: "#c8f542", Hybrid: "#6bffcf", ICE: "#ffaa66" };

export const EQUIVS = [
  { icon: "🌳", label: "Trees planted",    fn: kg => Math.round(kg / 21) },
  { icon: "✈️", label: "Flight hours",     fn: kg => (kg / 90).toFixed(1) },
  { icon: "🏠", label: "Months home elec", fn: kg => (kg / 150).toFixed(1) },
  { icon: "🥩", label: "kg beef equiv",    fn: kg => Math.round(kg / 27) },
];

export function typeBadge(t) { return t === "EV" ? "ev-b" : t === "Hybrid" ? "hy-b" : "ic-b"; }
export function typeColor(t)  { return TYPE_COL[t] || "#c8f542"; }

export async function apiFetch(path, opts = {}) {
  try {
    const r = await fetch(path, opts);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
