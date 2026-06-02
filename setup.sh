#!/bin/sh
# hwverify - offline prep / dependency installer
#
# RUN THIS WHILE ONLINE (before your flight).
# The project source ships in this archive; this script installs every
# dependency into web/node_modules and api/.venv so you can build and
# iterate on the UI fully offline afterwards.
#
# POSIX sh compliant. Usage:  sh setup.sh   (or: chmod +x setup.sh && ./setup.sh)

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

note() { printf '\n==> %s\n' "$1"; }
warn() { printf '[warn] %s\n' "$1"; }
die()  { printf '[error] %s\n' "$1" >&2; exit 1; }

# ---------------------------------------------------------------- prereqs
note "Checking prerequisites"
command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node 22 LTS (>=20.11), then re-run."
command -v npm  >/dev/null 2>&1 || die "npm not found. Install Node.js (it bundles npm), then re-run."
command -v uv   >/dev/null 2>&1 || die "uv not found. Install it:  curl -LsSf https://astral.sh/uv/install.sh | sh   then re-run."
printf 'node %s / npm %s\n' "$(node --version)" "$(npm --version)"

# --------------------------------------------------------------- frontend
note "Installing frontend dependencies (web/node_modules)"
cd "$SCRIPT_DIR/web"
npm install

note "Caching Playwright Chromium binary (for offline e2e / screenshots)"
if npx --yes playwright install chromium; then
  :
else
  warn "Playwright browser download failed - re-run 'npx playwright install chromium' while online if you need it."
fi

# ---------------------------------------------------------------- backend
note "Setting up FastAPI backend (api/.venv)"
cd "$SCRIPT_DIR/api"
uv python install 3.12 || warn "Could not pre-install Python 3.12 via uv; using an available interpreter."
uv venv --python 3.12 || uv venv
uv pip install -r requirements.txt

# ------------------------------------------------------------------- done
note "Done. All dependencies are cached locally."
cat <<'TXT'

Next steps
----------
Run the two servers (two terminals):

  Terminal 1 (API):   cd api && uv run fastapi dev app/main.py     # http://localhost:8000
  Terminal 2 (web):   cd web && npm run dev                         # http://localhost:5173

The web dev server proxies /api -> :8000, so the page's health check should go green.

Verify OFFLINE before you fly:
  Turn wifi off, then start both servers above. If the page renders and the
  health check works with no network, your caches are warm and you're set.

Optional - add shadcn-svelte components (run ONLINE; answers a couple of prompts):
  cd web
  npx shadcn-svelte@latest init
  npx shadcn-svelte@latest add button card chart table tabs badge dialog input label select separator sonner tooltip
TXT
