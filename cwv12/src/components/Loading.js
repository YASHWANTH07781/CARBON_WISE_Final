import React from "react";

export default function Loading() {
  return (
    <div className="ov">
      <div className="ov-box">
        <div className="spin" />
        <div className="spin-txt">Calculating Emissions…</div>
      </div>
    </div>
  );
}
