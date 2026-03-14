import React, { useState } from "react";
import "./styles.css";

import HomePage       from "./pages/HomePage";
import RecommendPage  from "./pages/RecommendPage";
import ComparePage    from "./pages/ComparePage";
import GreenwashPage  from "./pages/GreenwashPage";
import PaybackPage    from "./pages/PaybackPage";
import MethodologyPage from "./pages/MethodologyPage";

const PAGES = [
  ["home",      "Home"],
  ["recommend", "Recommend ⭐"],
  ["compare",   "Compare"],
  ["greenwash", "Greenwashing"],
  ["payback",   "Payback"],
  ["about",     "Methodology"],
];

export default function App() {
  const [page, setPage] = useState("home");
  const nav = p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <>
      <nav className="nav">
        <div className="nav-logo" onClick={() => nav("home")}>
          Carbon<span style={{ color: "var(--fog)", fontWeight: 300 }}>—</span>Wise
          <sup>LCA ENGINE</sup>
        </div>
        <div className="nav-links">
          {PAGES.map(([p, l]) => (
            <button key={p} className={`nbtn${page === p ? " active" : ""}`} onClick={() => nav(p)}>{l}</button>
          ))}
        </div>
        <button className="ncta" onClick={() => nav("recommend")}>Get Recommendation →</button>
      </nav>

      {page === "home"      && <HomePage      onNav={nav} />}
      {page === "recommend" && <RecommendPage />}
      {page === "compare"   && <ComparePage   />}
      {page === "greenwash" && <GreenwashPage />}
      {page === "payback"   && <PaybackPage   />}
      {page === "about"     && <MethodologyPage />}
    </>
  );
}
