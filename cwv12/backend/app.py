"""
Carbon-Wise Backend API v3.0
Flask + Python | Full Technical Scope
- LCA Engine (EPA data)
- WLTP normalization
- EEA-aligned CO2 standards
- Breakeven calculator
- Greenwash detection engine
- Recommendation logic
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os, sys, math
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from carbon_engine import CarbonEngine, vehicles_df

app = Flask(__name__)
CORS(app)
engine = CarbonEngine()

# ── WLTP correction factor vs EPA (WLTP is ~20% stricter for EVs, ~10% for ICE)
WLTP_CORRECTION = {"EV": 1.20, "Hybrid": 1.12, "ICE": 1.08}

# ── EEA CO2 fleet targets (g/km) — used for greenwash flagging
EEA_TARGETS = {"EV": 0, "Hybrid": 100, "ICE": 95}  # EU 2025 targets gCO2/km

# ── WLTP avg real-world CO2 by type (gCO2/km) for comparison baseline
WLTP_BASELINE = {"EV": 0, "Hybrid": 120, "ICE": 170}

def detect_greenwash(vehicle_type, co2_gpm, operational_em, manufacturing_em,
                      grid_factor, total_km, model_name=""):
    """
    Multi-factor greenwash detection engine.
    Returns list of flags with severity levels.
    """
    flags = []
    co2_gkm = (co2_gpm / 1.60934) if co2_gpm > 0 else 0

    # Flag 1: EV on dirty grid — operational may exceed a comparable hybrid
    if vehicle_type == "EV" and grid_factor >= 0.85:
        equiv_hybrid_ops = total_km * (140 / 1000)  # 140g/km hybrid baseline
        if operational_em > equiv_hybrid_ops * 0.9:
            flags.append({
                "level": "HIGH",
                "code": "DIRTY_GRID_EV",
                "title": "EV on Coal Grid",
                "detail": f"Grid intensity {grid_factor:.2f} kgCO₂/kWh. This EV's operational emissions rival a hybrid in this region."
            })

    # Flag 2: ICE car marketed as "low emission" but exceeds EEA target
    if vehicle_type == "ICE" and co2_gkm > 0:
        eea_target = EEA_TARGETS["ICE"]
        if co2_gkm > eea_target * 1.5:
            flags.append({
                "level": "HIGH",
                "code": "EXCEEDS_EEA",
                "title": "Exceeds EEA CO₂ Target",
                "detail": f"Tailpipe: {co2_gkm:.0f} gCO₂/km vs EEA fleet target of {eea_target} gCO₂/km (EU 2025)."
            })

    # Flag 3: WLTP vs EPA gap — only meaningful when WLTP result significantly
    # exceeds the EEA fleet target (not just a trivial arithmetic difference).
    # Previous condition `wltp_corrected > co2_gkm * 1.05` was ALWAYS true because
    # WLTP corrections (1.08/1.12) are mathematically always > 1.05 — fixed below.
    if vehicle_type != "EV" and co2_gkm > 0:
        wltp_corrected = co2_gkm * WLTP_CORRECTION[vehicle_type]
        eea_target = EEA_TARGETS.get(vehicle_type, 95)
        gap_gkm = wltp_corrected - co2_gkm
        # Only flag when: (a) WLTP result meaningfully exceeds EEA target by >30%
        # AND (b) the absolute gap between EPA and WLTP is >12 g/km
        if wltp_corrected > eea_target * 1.3 and gap_gkm > 12:
            flags.append({
                "level": "MEDIUM",
                "code": "WLTP_GAP",
                "title": "EPA vs WLTP Discrepancy",
                "detail": (
                    f"EPA cycle: {co2_gkm:.0f} g/km → WLTP real-world est: {wltp_corrected:.0f} g/km "
                    f"(+{gap_gkm:.0f} g/km). Exceeds EEA {vehicle_type} target of {eea_target} g/km "
                    f"by {((wltp_corrected/eea_target)-1)*100:.0f}%."
                )
            })

    # Flag 4: Hybrid with very high manufacturing emissions (battery greenwash)
    if vehicle_type == "Hybrid" and manufacturing_em > 9000:
        flags.append({
            "level": "MEDIUM",
            "code": "HYBRID_MFG_COST",
            "title": "High Manufacturing Footprint",
            "detail": f"Manufacturing: {manufacturing_em:,.0f} kgCO₂. Battery production offsets early fuel savings."
        })

    # Flag 5: "Mild hybrid" label masking near-ICE emissions
    if vehicle_type == "Hybrid" and co2_gkm > WLTP_BASELINE["Hybrid"] * 1.2:
        flags.append({
            "level": "LOW",
            "code": "MILD_HYBRID_LABEL",
            "title": "Hybrid Label May Be Misleading",
            "detail": f"CO₂ output ({co2_gkm:.0f} gCO₂/km) is close to conventional ICE levels."
        })

    return flags


def compute_breakeven(ev_result, ice_result, daily_km):
    """
    Compute year-by-year cumulative CO₂ for EV vs ICE over 20 years.
    Improvements over naive model:
      • Grid decarbonisation: India grid intensity declines per IEA NZE 2023
        trajectory (0.82 → 0.55 kgCO₂/kWh by 2030, → 0.26 by 2040)
      • EV battery replacement: ~30% probability of 1 replacement at year 10-12
        adds ~3,500 kg CO₂ (half of EV mfg base, IEA 2023 second-life estimate)
      • Both curves include EoL disposal at year 20

    Model assumptions (shown in UI):
      - Operational emissions per year derived from calculate() with years=10
      - Grid decarb: IEA India NZE 2023 (not guaranteed — labelled as projection)
      - Battery replacement: modelled as expected value (0.30 × 3,500 kg = 1,050 kg at yr 11)
    """
    ev_mfg   = ev_result["emissions"]["manufacturing"]
    ice_mfg  = ice_result["emissions"]["manufacturing"]
    ev_eol   = ev_result["emissions"].get("end_of_life", 400)
    ice_eol  = ice_result["emissions"].get("end_of_life", 300)

    years_base = ev_result.get("distance", {}).get("years", 10) or 10
    ev_ops_yr  = ev_result["emissions"]["operational"]  / years_base
    ice_ops_yr = ice_result["emissions"]["operational"] / years_base

    # Grid decarbonisation multipliers (IEA India NZE 2023)
    # Interpolate linearly between anchor years
    DECARB_ANCHORS = [(0, 1.00), (3, 0.854), (7, 0.671), (10, 0.549), (15, 0.415), (20, 0.317)]
    def grid_mult(yr):
        for i in range(len(DECARB_ANCHORS) - 1):
            y0, m0 = DECARB_ANCHORS[i]
            y1, m1 = DECARB_ANCHORS[i + 1]
            if y0 <= yr <= y1:
                t = (yr - y0) / (y1 - y0)
                return m0 + t * (m1 - m0)
        return DECARB_ANCHORS[-1][1]

    # EV battery replacement: expected value 0.30 probability × 3,500 kg CO₂
    # Modelled as a step at year 11 (midpoint of likely replacement window yr 10-12)
    # Source: IEA 2023 battery second-life analysis; BloombergNEF 2023
    BATTERY_REPLACEMENT_KG = 0.30 * 3500  # = 1,050 kg expected value

    data = []
    breakeven_year = None
    ev_cum = ev_mfg
    ice_cum = ice_mfg

    for yr in range(0, 21):
        # EV: grid-adjusted ops (improves over time as grid decarbonises)
        if yr > 0:
            gm = grid_mult(yr)
            ev_cum  += ev_ops_yr * gm     # grid gets cleaner each year
            ice_cum += ice_ops_yr         # ICE stays the same

        # Battery replacement bump at year 11 (expected value)
        if yr == 11:
            ev_cum += BATTERY_REPLACEMENT_KG

        # Add EoL at year 20
        ev_pt  = ev_cum  + (ev_eol  if yr == 20 else 0)
        ice_pt = ice_cum + (ice_eol if yr == 20 else 0)

        data.append({"year": yr, "ev": round(ev_pt, 0), "ice": round(ice_pt, 0)})

        if breakeven_year is None and yr > 0 and ev_pt <= ice_pt:
            breakeven_year = yr

    return {
        "data": data,
        "breakeven_year": breakeven_year,
        "model_notes": [
            "Grid decarbonisation applied: IEA India NZE 2023 (0.82→0.55 kgCO₂/kWh by 2030, projection only)",
            f"EV battery replacement: +{BATTERY_REPLACEMENT_KG:,.0f} kg CO₂ expected value at yr 11 (IEA 2023 / BloombergNEF 2023)",
            "EoL disposal included at year 20",
            "ICE operational emissions: constant (no fuel efficiency improvement modelled)",
        ],
    }


# ════════════════════════════════════════
#  ROUTES
# ════════════════════════════════════════

@app.route("/")
def home():
    return jsonify({"message": "Carbon-Wise API v3.0", "features": [
        "LCA Engine", "WLTP Normalization", "EEA Standards",
        "Greenwash Detection", "Breakeven Calculator", "Recommendation Engine"
    ]})

@app.route("/api/makes")
def get_makes():
    fuel_type = request.args.get("fuel_type", "")
    df = vehicles_df.copy()
    if fuel_type and fuel_type.lower() != "all":
        df = _filter_by_fuel_type(df, fuel_type)
    makes = sorted(df["make"].dropna().unique().tolist())
    return jsonify({"makes": makes, "total": len(df)})

def _filter_by_fuel_type(df, fuel_type):
    """Filter DataFrame by vehicle type using atvType column (the correct field).
    fuelType1 never contains 'Hybrid' — hybrids use Regular/Premium Gasoline there.
    atvType is the authoritative field: 'EV', 'Hybrid', 'Plug-in Hybrid', etc.
    """
    ft = (fuel_type or "").strip().upper()
    if ft == "EV":
        return df[df["atvType"].fillna("").str.strip().str.upper() == "EV"]
    elif ft == "HYBRID":
        return df[df["atvType"].fillna("").str.strip().str.upper().isin(["HYBRID", "PLUG-IN HYBRID"])]
    elif ft == "ICE":
        non_ice = {"EV", "HYBRID", "PLUG-IN HYBRID", "FCV", "CNG", "BIFUEL (CNG)", "BIFUEL (LPG)"}
        return df[~df["atvType"].fillna("").str.strip().str.upper().isin(non_ice)]
    return df


@app.route("/api/models")
def get_models():
    make      = request.args.get("make", "")
    fuel_type = request.args.get("fuel_type", "")
    df = vehicles_df[vehicles_df["make"] == make].copy() if make else vehicles_df.copy()
    if fuel_type and fuel_type.lower() != "all":
        df = _filter_by_fuel_type(df, fuel_type)
    models = sorted(df["model"].dropna().unique().tolist())
    return jsonify({"models": models})

@app.route("/api/years")
def get_years():
    make = request.args.get("make", "")
    df = vehicles_df[vehicles_df["make"] == make] if make else vehicles_df
    years = sorted(df["year"].dropna().unique().astype(int).tolist(), reverse=True)
    return jsonify({"years": years})

@app.route("/api/vehicles")
def get_vehicles():
    make      = request.args.get("make", "")
    fuel_type = request.args.get("fuel_type", "")
    df = vehicles_df.copy()
    if make:
        df = df[df["make"] == make]
    if fuel_type and fuel_type.lower() != "all":
        df = _filter_by_fuel_type(df, fuel_type)
    cols = ["make","model","year","fuelType1","atvType","VClass","comb08","co2TailpipeGpm","combE"]
    result = df[cols].dropna(subset=["make","model"]).head(200)
    return jsonify({"vehicles": result.to_dict(orient="records")})

@app.route("/api/states")
def get_states():
    return jsonify({"states": engine.get_all_states()})

@app.route("/api/search_cities")
def search_cities():
    q = request.args.get("q", "")
    return jsonify({"cities": engine.search_cities(q)})

@app.route("/api/calculate")
def calculate():
    model    = request.args.get("model", "")
    state    = request.args.get("state", "MAHARASHTRA")
    daily_km = float(request.args.get("daily_km", 40))
    years    = int(request.args.get("years", 10))
    standard = request.args.get("standard", "EPA")  # EPA or WLTP

    if not model:
        return jsonify({"error": "model parameter required"}), 400
    try:
        result = engine.calculate(model, daily_km, years, state)

        # Apply WLTP correction if requested
        if standard == "WLTP":
            vtype = result["vehicle_type"]
            factor = WLTP_CORRECTION.get(vtype, 1.10)
            result["emissions"]["operational"] = round(result["emissions"]["operational"] * factor, 2)
            result["emissions"]["total"] = round(
                result["emissions"]["manufacturing"] +
                result["emissions"]["operational"] +
                result["emissions"]["end_of_life"], 2)
            result["standard"] = "WLTP"
        else:
            result["standard"] = "EPA"

        # Attach WLTP comparison values
        vtype = result["vehicle_type"]
        result["wltp_comparison"] = {
            "epa_total": result["emissions"]["total"] if standard == "EPA" else round(result["emissions"]["total"] / WLTP_CORRECTION.get(vtype,1.1), 2),
            "wltp_total": result["emissions"]["total"] if standard == "WLTP" else round(result["emissions"]["total"] * WLTP_CORRECTION.get(vtype,1.1), 2),
            "wltp_factor": WLTP_CORRECTION.get(vtype, 1.10),
            "eea_target_gkm": EEA_TARGETS.get(vtype),
            "wltp_baseline_gkm": WLTP_BASELINE.get(vtype)
        }

        # Greenwash analysis
        veh_row = vehicles_df[vehicles_df["model"] == model]
        co2_gpm = float(veh_row.iloc[0]["co2TailpipeGpm"]) if not veh_row.empty else 0
        result["greenwash_flags"] = detect_greenwash(
            vtype, co2_gpm,
            result["emissions"]["operational"],
            result["emissions"]["manufacturing"],
            result["location"]["emission_factor"],
            daily_km * 365 * years,
            model
        )

        # CO2 savings per year vs average ICE (170 g/km baseline)
        avg_ice_annual = daily_km * 365 * (170/1000)  # kg CO2/yr for avg ICE
        ops_per_year   = result["emissions"]["operational"] / years
        result["annual_savings_vs_avg_ice"] = round(avg_ice_annual - ops_per_year, 2)

        # Year-by-year cumulative data for line chart
        mfg = result["emissions"]["manufacturing"]
        ops_yr = result["emissions"]["operational"] / years
        result["cumulative_curve"] = [
            {"year": y, "total": round(mfg + ops_yr * y, 0)} for y in range(0, years + 1)
        ]

        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@app.route("/api/compare", methods=["POST"])
def compare():
    data     = request.get_json()
    models   = data.get("models", [])
    state    = data.get("state", "MAHARASHTRA")
    daily_km = float(data.get("daily_km", 40))
    years    = int(data.get("years", 10))
    standard = data.get("standard", "EPA")

    results = []
    for model in models:
        try:
            r = engine.calculate(model, daily_km, years, state)
            # WLTP correction
            if standard == "WLTP":
                factor = WLTP_CORRECTION.get(r["vehicle_type"], 1.10)
                r["emissions"]["operational"] = round(r["emissions"]["operational"] * factor, 2)
                r["emissions"]["total"] = round(
                    r["emissions"]["manufacturing"] + r["emissions"]["operational"] + r["emissions"]["end_of_life"], 2)
            r["standard"] = standard

            # Greenwash flags
            veh_row = vehicles_df[vehicles_df["model"] == model]
            co2_gpm = float(veh_row.iloc[0]["co2TailpipeGpm"]) if not veh_row.empty else 0
            r["greenwash_flags"] = detect_greenwash(
                r["vehicle_type"], co2_gpm,
                r["emissions"]["operational"], r["emissions"]["manufacturing"],
                r["location"]["emission_factor"], daily_km * 365 * years, model
            )

            # Year-by-year curve
            mfg    = r["emissions"]["manufacturing"]
            ops_yr = r["emissions"]["operational"] / years
            r["cumulative_curve"] = [
                {"year": y, "total": round(mfg + ops_yr * y, 0)} for y in range(0, years + 1)
            ]
            results.append(r)
        except Exception as e:
            results.append({"model": model, "error": str(e)})

    valid = [r for r in results if "error" not in r]

    # Recommendation: lowest total, but penalize high greenwash
    recommendation = None
    if valid:
        def score(r):
            penalty = len([f for f in r.get("greenwash_flags", []) if f["level"] == "HIGH"]) * 2000
            return r["emissions"]["total"] + penalty

        best       = min(valid, key=score)
        worst      = max(valid, key=lambda x: x["emissions"]["total"])
        savings    = worst["emissions"]["total"] - best["emissions"]["total"]
        best_score = score(best)
        best_flags = len([f for f in best.get("greenwash_flags", []) if f["level"] == "HIGH"])
        annual_km  = daily_km * 365
        total_km   = annual_km * years
        best_ops_yr  = best["emissions"]["operational"] / years if years > 0 else 0
        worst_ops_yr = worst["emissions"]["operational"] / years if years > 0 else 0

        vtype = best["vehicle_type"]
        if vtype == "EV":
            gf = best["location"]["emission_factor"]
            reason = (
                f"{best['model']} (EV) has the lowest lifecycle footprint at {best['emissions']['total']:,.0f} kg CO₂ "
                f"over {years} years / {total_km:,.0f} km. "
                f"On your grid ({gf:.3f} kgCO₂/kWh), EV ops are just {best_ops_yr:,.0f} kg/yr vs "
                f"{worst_ops_yr:,.0f} kg/yr for the highest emitter. "
                f"Total saving: {savings:,.0f} kg ({savings/1000:.1f}t) CO₂."
            )
        elif vtype == "Hybrid":
            reason = (
                f"{best['model']} (Hybrid) is optimal for your {daily_km:.0f} km/day, {years}-year profile. "
                f"Lower manufacturing debt than EV, lower operational emissions than ICE over {total_km:,.0f} km. "
                f"Saves {savings:,.0f} kg ({savings/1000:.1f}t) CO₂ vs worst option."
            )
        else:
            reason = (
                f"{best['model']} (ICE) has the lowest total lifecycle footprint in this comparison. "
                f"At {daily_km:.0f} km/day, operational: {best_ops_yr:,.0f} kg/yr. "
                f"Saves {savings:,.0f} kg ({savings/1000:.1f}t) vs worst option."
            )
        if best_flags > 0:
            reason += f" Note: {best_flags} HIGH greenwash flag(s) detected — penalty applied."

        recommendation = {
            "best_model":  best["model"],
            "best_type":   best["vehicle_type"],
            "total_co2_kg": best["emissions"]["total"],
            "co2_saved_vs_worst": round(savings, 0),
            "greenwash_flags_count": len(best.get("greenwash_flags", [])),
            "scoring_formula": f"Score = lifecycle_CO₂ + (HIGH_flags × 2,000 kg penalty). Winner scored: {best_score:,.0f} kg.",
            "reason": reason,
        }

        # Breakeven: EV vs ICE pair (if both types present)
        ev_results  = [r for r in valid if r["vehicle_type"] == "EV"]
        ice_results = [r for r in valid if r["vehicle_type"] == "ICE"]
        if ev_results and ice_results:
            recommendation["breakeven"] = compute_breakeven(ev_results[0], ice_results[0], daily_km)

    return jsonify({"results": results, "recommendation": recommendation, "standard": standard})


@app.route("/api/breakeven")
def breakeven():
    """Standalone breakeven: compare one EV model vs one ICE model."""
    ev_model  = request.args.get("ev_model", "")
    ice_model = request.args.get("ice_model", "")
    state     = request.args.get("state", "MAHARASHTRA")
    daily_km  = float(request.args.get("daily_km", 40))
    if not ev_model or not ice_model:
        return jsonify({"error": "ev_model and ice_model required"}), 400
    try:
        ev_r  = engine.calculate(ev_model,  daily_km, 20, state)
        ice_r = engine.calculate(ice_model, daily_km, 20, state)
        be    = compute_breakeven(ev_r, ice_r, daily_km)
        return jsonify({
            "ev_model": ev_model, "ice_model": ice_model,
            "ev_manufacturing":  ev_r["emissions"]["manufacturing"],
            "ice_manufacturing": ice_r["emissions"]["manufacturing"],
            "breakeven": be
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@app.route("/api/wltp_standards")
def wltp_standards():
    """Return WLTP/EEA reference data for display."""
    return jsonify({
        "wltp_correction_factors": WLTP_CORRECTION,
        "eea_fleet_targets_gkm":   EEA_TARGETS,
        "wltp_baselines_gkm":      WLTP_BASELINE,
        "source": "EEA Fleet CO2 Monitoring 2024 / WLTP Regulation EU 2017/1151",
        "note": "WLTP values are ~8-20% higher than EPA due to stricter test cycle."
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)