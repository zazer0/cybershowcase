#!/bin/sh
# setup-opencode-gemma.sh
#
# Run this ONCE while you still have internet — ideally with LM Studio already
# running and the Gemma 4 model loaded. After it finishes, OpenCode works fully
# offline (e.g. on a plane) against your local LM Studio server.
#
# POSIX /bin/sh compatible (no bashisms).

set -u

# ---- Settings you can tweak (or pass as env vars) --------------------------
# IMPORTANT: MODEL_ID must match EXACTLY what LM Studio reports. Verify with:
#   curl http://127.0.0.1:1234/v1/models
# For the MLX build it is often something like:
#   lmstudio-community/gemma-4-26b-a4b-it-mlx-4bit
MODEL_ID="${MODEL_ID:-gemma-4-26b-a4b}"
BASE_URL="${BASE_URL:-http://127.0.0.1:1234/v1}"
CONTEXT="${CONTEXT:-131072}"          # Gemma 4 26B-A4B supports long context
OUTPUT="${OUTPUT:-8192}"
CONFIG_DIR="${HOME}/.config/opencode"
CONFIG_FILE="${CONFIG_DIR}/opencode.json"
# ---------------------------------------------------------------------------

log()  { printf '==> %s\n' "$1"; }
warn() { printf '[!] %s\n' "$1" >&2; }
error_exit() { printf '[ERROR] %s\n' "$1" >&2; exit 1; }

# 1. curl is required
if ! command -v curl >/dev/null 2>&1; then
  error_exit "curl is required but not found. Please install it and re-run this script."
fi

# 2. Install OpenCode (skip if already present)
if command -v opencode >/dev/null 2>&1; then
  log "OpenCode already installed: $(opencode --version 2>/dev/null || echo present)"
else
  log "Installing OpenCode..."
  if ! curl -fsSL https://opencode.ai/install | bash; then
    error_exit "Failed to install OpenCode via curl. Please check your connection and try again."
  fi
fi

# 2b. Make sure this shell can see the binary (installer uses ~/.opencode/bin)
if ! command -v opencode >/dev/null 2>&1; then
  if [ -x "${HOME}/.opencode/bin/opencode" ]; then
    PATH="${HOME}/.opencode/bin:${PATH}"
    export PATH
    warn "Added ~/.opencode/bin to PATH for this run."
    warn "Add this line to your shell profile (~/.zshrc or ~/.profile):"
    warn '  export PATH="$HOME/.opencode/bin:$PATH"'
  else
    error_exit "OpenCode installed but not on PATH. Open a new terminal, then re-run."
  fi
fi

# 3. Write the LM Studio provider config
log "Writing config to ${CONFIG_FILE}"
if ! mkdir -p "${CONFIG_DIR}"; then
  error_exit "Failed to create directory ${CONFIG_DIR}. Check permissions."
fi

cat > "${CONFIG_FILE}" <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "provider": {
    "lmstudio": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LM Studio (local)",
      "options": {
        "baseURL": "${BASE_URL}",
        "apiKey": "lm-studio"
      },
      "models": {
        "${MODEL_ID}": {
          "name": "Gemma 4 26B-A4B (local)",
          "limit": { "context": ${CONTEXT}, "output": ${OUTPUT} }
        }
      }
    }
  }
}
EOF

if [ $? -ne 0 ]; then
  error_exit "Failed to write configuration file ${CONFIG_FILE}."
fi

# 4. Warm the provider cache while online.
#    OpenCode downloads the @ai-sdk/openai-compatible package the first time the
#    provider runs. Triggering it NOW is what makes the offline session work.
log "Checking LM Studio at ${BASE_URL} ..."
if curl -fsS "${BASE_URL}/models" >/dev/null 2>&1; then
  log "LM Studio reachable. Warming OpenCode provider cache..."
  if ! opencode run -m "lmstudio/${MODEL_ID}" "Respond with the single word: ready"; then
    warn "Auto warm-up didn't complete — do the manual interactive run below before flying."
  fi
else
  warn "LM Studio server not reachable yet."
  warn "Start it: LM Studio -> Developer tab -> load Gemma model -> set server to Running."
  warn "Then, while still online, run:"
  warn "  opencode run -m \"lmstudio/${MODEL_ID}\" \"ready\""
fi

cat <<'DONE'

--------------------------------------------------------------------
Setup complete. BEFORE you lose internet, confirm offline-readiness:

  1. LM Studio: Developer tab -> Gemma 4 model loaded -> server Running.
  2. Run OpenCode interactively once, ONLINE:
         opencode
     Then:  /model  -> pick "Gemma 4 26B-A4B (local)"  -> send "hi"
     If it replies, the SDK provider is cached and you are plane-ready.

On the plane:
  - Open LM Studio, load the model, start the server (Developer tab).
  - cd into your project, then run:  opencode
--------------------------------------------------------------------
DONE
