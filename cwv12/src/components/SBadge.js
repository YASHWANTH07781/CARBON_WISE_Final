import React from "react";
export default function SBadge({ t, txt }) {
  return <span className={`sbadge sb-${t}`}>{txt}</span>;
}
