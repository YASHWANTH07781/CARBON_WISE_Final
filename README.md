🌍 CARBON-WISE Lifecycle Carbon Intelligence Platform

IIT BHU Eco Hackathon – Round 2 Prototype Submission

🚀 Vision

Carbon-Wise transforms fragmented emission datasets into a standardized, region-aware lifecycle carbon intelligence framework for sustainable mobility decision-making.

It enables data-driven vehicle comparisons by integrating:

Manufacturing emissions

Operational emissions

End-of-life emissions

State-level electricity carbon intensity

🎯 Problem Statement

Current vehicle carbon comparisons are incomplete and often misleading because:

Manufacturing emissions are ignored

EV battery production impact is excluded

Grid carbon intensity varies significantly by region

No unified lifecycle comparison platform exists

This leads to inaccurate sustainability decisions.

💡 Our Solution

Carbon-Wise provides a modular lifecycle carbon modeling engine that:

✔ Standardizes lifecycle emission calculations ✔ Integrates state-specific electricity emission factors ✔ Supports ICE, Hybrid, and EV comparison ✔ Uses real-world vehicle datasets ✔ Visualizes lifecycle carbon breakdown dynamically

🧠 System Architecture

Layered Modular Carbon Computation Framework

User Input Layer ↓ Vehicle Dataset + State Grid Dataset ↓ Carbon Computation Engine ↓ Lifecycle Aggregation Logic ↓ Interactive Visualization Dashboard

⚙️ Technology Stack Layer Technology Frontend Streamlit Backend FastAPI Data Processing Pandas Visualization Plotly Language Python 📊 Features

Year-based vehicle filtering

ICE / Hybrid / EV classification

Manufacturer & model selection

State-level electricity emission integration

Lifecycle emissions breakdown visualization

Operational vs manufacturing impact comparison

Scalable architecture for future fleet-level analysis

🔬 Carbon Computation Logic Lifecycle Emissions =

Manufacturing Emissions

Operational Emissions

End-of-Life Emissions

For EVs:

Operational = Distance × Energy per km × State Grid Factor

For ICE/Hybrid:

Operational = Distance × Tailpipe CO₂ per km

🛠️ Setup Instructions 1️⃣ Clone Repository git clone https://github.com//carbon-wise-lifecycle-engine.git cd carbon-wise-lifecycle-engine 2️⃣ Install Dependencies pip install -r requirements.txt 3️⃣ Start Backend cd backend python -m uvicorn app:app --reload 4️⃣ Start Frontend cd .. python -m streamlit run streamlit_app.py

Open in browser:

http://localhost:8501 🧪 Proof of Concept

This prototype demonstrates:

Successful lifecycle carbon aggregation

Region-aware EV modeling

Dynamic vehicle filtering and comparison

Working backend API integration

🌱 Future Scope

Real-time electricity API integration

Carbon payback timeline modeling

Fleet-level emissions dashboard

ESG reporting integration

Policy simulation support

👨‍💻 Team Alpha – VIT

Backend & Data Engineering

System Architecture

Strategy & Implementation

UI/UX & Visualization

🎯 Why This README Is Strong

It shows:

Clarity

Technical depth

Architecture thinking

Scalability

Real-world relevance

Judges LOVE this structure.

🚀 PART 2 — GITHUB REPOSITORY SETUP (STEP-BY-STEP)

Now we set up GitHub professionally.

✅ STEP 1 — Go to Project Root

Make sure you are inside:

E:\IIT BHU\carbon-wise ✅ STEP 2 — Initialize Git

Run:

git init ✅ STEP 3 — Add All Files git add . ✅ STEP 4 — First Commit git commit -m "Round 2 Prototype Submission - Carbon Wise" ✅ STEP 5 — Create Repository on GitHub

Go to github.com

Click “New Repository”

Name it:

carbon-wise-lifecycle-engine

Make it Public

DO NOT add README (you already have one)

Click Create

✅ STEP 6 — Connect Local to GitHub

GitHub will show instructions.

Run:

git remote add origin https://github.com/YOUR_USERNAME/carbon-wise-lifecycle-engine.git git branch -M main git push -u origin main

Replace YOUR_USERNAME.

✅ STEP 7 — Verify Upload

Open your GitHub repository.

Check:

✔ README renders properly ✔ Folder structure is clean ✔ No debug files ✔ requirements.txt present ✔ backend folder visible

Demo Screenshot
