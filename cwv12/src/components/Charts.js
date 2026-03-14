import React, { useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import * as d3 from "d3";
import { COLORS, STATE_GRIDS } from "../utils";

Chart.register(...registerables);

// ── Bar Chart ─────────────────────────────────────────────────
export function BarChart({ id, data, labels, colors }) {
  const ref = useRef(null);
  const chart = useRef(null);
  useEffect(() => {
    if (!data || !ref.current) return;
    if (chart.current) chart.current.destroy();
    chart.current = new Chart(ref.current, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: colors || data.map((_, i) => COLORS[i % COLORS.length]), borderRadius: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${(c.raw / 1000).toFixed(2)} t CO₂` } } },
        scales: {
          y: { grid: { color: "rgba(10,10,8,.05)" }, ticks: { font: { family: "DM Mono", size: 10 }, callback: v => `${(v / 1000).toFixed(1)}t` } },
          x: { grid: { display: false }, ticks: { font: { family: "DM Mono", size: 9 } } },
        },
      },
    });
    return () => { if (chart.current) chart.current.destroy(); };
  }, [data, labels, colors]);
  return <div style={{ position: "relative", height: "210px" }}><canvas ref={ref} id={id} /></div>;
}

// ── Stacked Bar Chart ─────────────────────────────────────────
export function StackedBarChart({ id, models, sd }) {
  const ref = useRef(null);
  const chart = useRef(null);
  useEffect(() => {
    if (!sd || !ref.current) return;
    if (chart.current) chart.current.destroy();
    chart.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: models,
        datasets: [
          { label: "Manufacturing", data: sd.map(d => d.manufacturing), backgroundColor: "rgba(10,10,8,.75)" },
          { label: "Operational",   data: sd.map(d => d.operational),   backgroundColor: "rgba(200,245,66,.65)" },
          { label: "End-of-Life",   data: sd.map(d => d.end_of_life),   backgroundColor: "rgba(232,41,28,.45)" },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { family: "DM Mono", size: 9 }, boxWidth: 10 } } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { family: "DM Mono", size: 9 } } },
          y: { stacked: true, grid: { color: "rgba(10,10,8,.05)" }, ticks: { font: { family: "DM Mono", size: 10 }, callback: v => `${(v / 1000).toFixed(1)}t` } },
        },
      },
    });
    return () => { if (chart.current) chart.current.destroy(); };
  }, [sd, models]);
  return <div style={{ position: "relative", height: "210px" }}><canvas ref={ref} id={id} /></div>;
}

// ── Line Chart ────────────────────────────────────────────────
export function LineChart({ id, datasets, h = 110 }) {
  const ref = useRef(null);
  const chart = useRef(null);
  useEffect(() => {
    if (!datasets || !ref.current) return;
    if (chart.current) chart.current.destroy();
    chart.current = new Chart(ref.current, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        parsing: { xAxisKey: "year", yAxisKey: "total" },
        plugins: { legend: { labels: { font: { family: "DM Mono", size: 9 }, boxWidth: 10 } } },
        scales: {
          x: { type: "linear", min: 0, grid: { color: "rgba(10,10,8,.04)" }, ticks: { font: { family: "DM Mono", size: 9 } } },
          y: { grid: { color: "rgba(10,10,8,.04)" }, ticks: { font: { family: "DM Mono", size: 10 }, callback: v => `${(v / 1000).toFixed(1)}t` } },
        },
      },
    });
    return () => { if (chart.current) chart.current.destroy(); };
  }, [datasets]);
  return <div style={{ position: "relative", height: `${h}px` }}><canvas ref={ref} id={id} /></div>;
}

// ── D3 Treemap ────────────────────────────────────────────────
export function D3Treemap({ results }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!results || !results.length || !ref.current) return;
    const el = ref.current;
    const W = el.clientWidth || 460, H = 220;
    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).append("svg").attr("width", W).attr("height", H);
    const data = {
      name: "root",
      children: results.map(r => ({
        name: r.model,
        children: [
          { name: "Manufacturing", value: r.emissions.manufacturing },
          { name: "Operational",   value: r.emissions.operational },
          { name: "End-of-Life",   value: r.emissions.end_of_life },
        ],
      })),
    };
    const tc = { "Manufacturing": "rgba(10,10,8,.7)", "Operational": "rgba(200,245,66,.7)", "End-of-Life": "rgba(232,41,28,.5)" };
    const root = d3.treemap().size([W, H]).padding(2).paddingOuter(4)(
      d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value - a.value)
    );
    const cell = svg.selectAll("g").data(root.leaves()).enter().append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);
    cell.append("rect")
      .attr("width",  d => Math.max(0, d.x1 - d.x0))
      .attr("height", d => Math.max(0, d.y1 - d.y0))
      .attr("fill", d => tc[d.data.name] || "#999")
      .attr("stroke", "var(--paper)").attr("stroke-width", 1);
    cell.filter(d => (d.x1 - d.x0) > 50 && (d.y1 - d.y0) > 16)
      .append("text").attr("x", 4).attr("y", 12)
      .attr("fill", "var(--paper)").style("font-family", "DM Mono").style("font-size", "9px")
      .text(d => `${d.data.name} ${(d.data.value / 1000).toFixed(1)}t`);
  }, [results]);
  return <div ref={ref} style={{ width: "100%", height: 220 }} />;
}

// ── D3 Donut ──────────────────────────────────────────────────
export function D3Donut({ em }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!em || !ref.current) return;
    const W = 140, H = 140, R = 56;
    d3.select(ref.current).selectAll("*").remove();
    const svg = d3.select(ref.current).append("svg").attr("width", W).attr("height", H)
      .append("g").attr("transform", `translate(${W / 2},${H / 2})`);
    const slices = [
      { n: "Mfg", v: em.manufacturing, c: "rgba(10,10,8,.8)" },
      { n: "Ops", v: em.operational,   c: "rgba(200,245,66,.85)" },
      { n: "EoL", v: em.end_of_life,   c: "rgba(232,41,28,.7)" },
    ];
    const total = slices.reduce((s, d) => s + d.v, 0);
    const pie = d3.pie().value(d => d.v).sort(null);
    const arc = d3.arc().innerRadius(R * 0.55).outerRadius(R);
    svg.selectAll("path").data(pie(slices)).enter().append("path")
      .attr("d", arc).attr("fill", d => d.data.c)
      .attr("stroke", "var(--paper)").attr("stroke-width", 2);
    svg.append("text").attr("text-anchor", "middle").attr("dy", "-.15em")
      .style("font-family", "DM Mono").style("font-size", "9px").style("fill", "var(--fog)")
      .text((total / 1000).toFixed(1));
    svg.append("text").attr("text-anchor", "middle").attr("dy", "1em")
      .style("font-family", "DM Mono").style("font-size", "8px").style("fill", "var(--fog)")
      .text("t CO₂");
  }, [em]);
  return <div ref={ref} />;
}

// ── D3 Breakeven Curve ────────────────────────────────────────
export function D3Breakeven({ beData, evLabel, iceLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!beData || !ref.current) return;
    const el = ref.current;
    const W = el.clientWidth || 560, H = 260;
    const m = { top: 18, right: 18, bottom: 34, left: 54 };
    const iW = W - m.left - m.right, iH = H - m.top - m.bottom;
    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).append("svg").attr("width", W).attr("height", H)
      .append("g").attr("transform", `translate(${m.left},${m.top})`);
    const all = beData.data;
    const xS = d3.scaleLinear().domain([0, d3.max(all, d => d.year)]).range([0, iW]);
    const yS = d3.scaleLinear().domain([0, d3.max(all, d => Math.max(d.ev || 0, d.ice || 0)) * 1.05]).range([iH, 0]);
    svg.selectAll(".gl").data(yS.ticks(5)).enter().append("line")
      .attr("x1", 0).attr("x2", iW).attr("y1", d => yS(d)).attr("y2", d => yS(d))
      .attr("stroke", "rgba(10,10,8,.05)").attr("stroke-width", 1);
    if (beData.breakeven_year) {
      svg.append("line")
        .attr("x1", xS(beData.breakeven_year)).attr("x2", xS(beData.breakeven_year))
        .attr("y1", 0).attr("y2", iH)
        .attr("stroke", "var(--acid)").attr("stroke-width", 1.5).attr("stroke-dasharray", "4,3");
      svg.append("rect")
        .attr("x", xS(beData.breakeven_year) + 4).attr("y", 2)
        .attr("width", 86).attr("height", 17).attr("fill", "var(--acid)").attr("rx", 2);
      svg.append("text")
        .attr("x", xS(beData.breakeven_year) + 8).attr("y", 14)
        .attr("fill", "var(--ink)").style("font-family", "DM Mono").style("font-size", "8.5px").style("font-weight", "bold")
        .text(`Breakeven yr ${beData.breakeven_year}`);
    }
    const lEV  = d3.line().x(d => xS(d.year)).y(d => yS(d.ev  || 0)).curve(d3.curveMonotoneX);
    const lICE = d3.line().x(d => xS(d.year)).y(d => yS(d.ice || 0)).curve(d3.curveMonotoneX);
    svg.append("path").datum(all).attr("fill", "none").attr("stroke", "var(--acid)").attr("stroke-width", 2.5).attr("d", lEV);
    svg.append("path").datum(all).attr("fill", "none").attr("stroke", "var(--rouge)").attr("stroke-width", 2.5).attr("d", lICE);
    svg.append("g").attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(xS).ticks(10).tickSize(0))
      .selectAll("text").style("font-family", "DM Mono").style("font-size", "9px");
    svg.append("g")
      .call(d3.axisLeft(yS).ticks(5).tickFormat(v => `${(v / 1000).toFixed(0)}t`).tickSize(0))
      .selectAll("text").style("font-family", "DM Mono").style("font-size", "9px");
    [[`var(--acid)`, evLabel || "EV"], [`var(--rouge)`, iceLabel || "ICE"]].forEach(([col, lbl], i) => {
      svg.append("rect").attr("x", iW - 100).attr("y", i * 14).attr("width", 9).attr("height", 4).attr("fill", col);
      svg.append("text").attr("x", iW - 87).attr("y", i * 14 + 5)
        .style("font-family", "DM Mono").style("font-size", "9px").attr("fill", "var(--fog)").text(lbl);
    });
  }, [beData, evLabel, iceLabel]);
  return <div ref={ref} style={{ width: "100%" }} />;
}

// ── D3 Bubble Grid (State grids) ──────────────────────────────
export function D3BubbleGrid() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const W = el.clientWidth || 460, H = 260;
    d3.select(el).selectAll("*").remove();
    const states = Object.entries(STATE_GRIDS).map(([name, value]) => ({ name, value }));
    const svg = d3.select(el).append("svg").attr("width", W).attr("height", H);
    const rS   = d3.scaleSqrt().domain([0, 1.2]).range([5, 32]);
    const colS = d3.scaleSequential(t => d3.interpolateRgb("#22c55e", "#e8291c")(t)).domain([0, 1.2]);
    const sim  = d3.forceSimulation(states)
      .force("charge",    d3.forceManyBody().strength(-2))
      .force("center",    d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(d => rS(d.value) + 2));
    const g = svg.selectAll("g").data(states).enter().append("g");
    const circles = g.append("circle")
      .attr("r",    d => rS(d.value))
      .attr("fill", d => colS(d.value))
      .attr("opacity", 0.82)
      .attr("stroke",       d => colS(d.value))
      .attr("stroke-width", 1);
    const labels = g.filter(d => rS(d.value) > 13).append("text")
      .attr("text-anchor", "middle").attr("dy", ".35em")
      .style("font-family", "DM Mono").style("font-size", "7px")
      .attr("fill", "white")
      .text(d => d.value.toFixed(2));
    sim.on("tick", () => {
      circles.attr("cx", d => d.x).attr("cy", d => d.y);
      labels.attr("x",  d => d.x).attr("y",  d => d.y);
    });
  }, []);
  return <div ref={ref} style={{ width: "100%", height: 260 }} />;
}
