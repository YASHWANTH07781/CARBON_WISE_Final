#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Carbon-Wise v5.0 — Start Script
# Starts Flask backend + React dev server (hot-reload)
# Press Ctrl+C to stop both.
# ─────────────────────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "🌿 Carbon-Wise v5.0 — Lifecycle Vehicle Carbon Engine"
echo "   React 18 · D3.js v7 · Chart.js 4.4 · Python Flask"
echo "──────────────────────────────────────────────────────"

# ── Python check ────────────────────────────────────────────
PY=$(command -v python3 2>/dev/null || command -v python 2>/dev/null || true)
if [ -z "$PY" ]; then echo "❌ Python not found — install Python 3.8+"; exit 1; fi

# ── Install Python deps ──────────────────────────────────────
echo "📦 Installing Python dependencies..."
$PY -m pip install -r "$ROOT/requirements.txt" -q

# ── Start Flask backend ──────────────────────────────────────
echo "🐍 Starting Flask backend on http://localhost:5000..."
cd "$ROOT/backend" && $PY app.py &
FLASK_PID=$!
cd "$ROOT"
sleep 2

# ── Install Node deps if needed ──────────────────────────────
if [ ! -d "$ROOT/node_modules" ]; then
  echo "📦 Installing Node.js dependencies (first run)..."
  npm install
fi

# ── Start React dev server ───────────────────────────────────
echo "⚛️  Starting React app on http://localhost:3000..."
echo ""
echo "   Open:  http://localhost:3000"
echo "   API:   http://localhost:5000"
echo ""
echo "   Press Ctrl+C to stop."
echo "──────────────────────────────────────────────────────"

trap "kill $FLASK_PID 2>/dev/null; echo ''; echo 'Both servers stopped.'" EXIT
npm start
