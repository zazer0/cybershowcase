#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright";

const WORK_DIR = "/tmp/ccweb-verify";
const CONTRACT_MARKER = "UI_VERIFICATION_CONTRACT";

// ── Read stdin ─────────────────────────────────────────────
function readHookInput() {
  return JSON.parse(readFileSync("/dev/stdin", "utf8"));
}

// ── Parse UI_VERIFICATION_CONTRACT from last_assistant_message ──
// Returns { task, routes, viewports, acceptance } or null.
function parseContract(text) {
  const idx = text.indexOf(CONTRACT_MARKER);
  if (idx === -1) return null;

  const block = text.slice(idx + CONTRACT_MARKER.length);
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  const contract = { task: "", routes: [], viewports: [], acceptance: [] };
  let key = null;

  for (const line of lines) {
    if (line.startsWith("task:")) {
      contract.task = line.slice(5).trim();
      key = null;
    } else if (line === "routes:") {
      key = "routes";
    } else if (line === "viewports:") {
      key = "viewports";
    } else if (line === "acceptance:") {
      key = "acceptance";
    } else if (line.startsWith("- ") && key) {
      contract[key].push(line.slice(2).trim());
    } else {
      break; // end of contract block
    }
  }

  if (!contract.routes.length || !contract.acceptance.length) return null;
  if (!contract.viewports.length) contract.viewports = ["1440x900", "390x844"];
  return contract;
}

// ── Screenshot with Playwright ─────────────────────────────
// Returns array of { path, route, viewport }.
async function captureScreenshots(contract) {
  mkdirSync(WORK_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const shots = [];

  for (const route of contract.routes) {
    for (const vp of contract.viewports) {
      const [w, h] = vp.split("x").map(Number);
      const slug = route.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-");
      const filename = `${slug}_${vp}.png`;
      const filepath = join(WORK_DIR, filename);

      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto(route, { waitUntil: "networkidle", timeout: 30_000 });
      await page.screenshot({ path: filepath, fullPage: false });
      await ctx.close();

      shots.push({ path: filepath, route, viewport: vp });
    }
  }

  await browser.close();
  return shots;
}

// ── Build Codex prompt ─────────────────────────────────────
function buildPrompt(contract, shots) {
  const vpList = shots.map(s => `  - ${s.viewport} @ ${s.route}`).join("\n");
  const criteria = contract.acceptance.map((a, i) => `  ${i + 1}. ${a}`).join("\n");

  return [
    "You are an independent UI QA reviewer. You did not write this code.",
    "Judge ONLY the provided screenshots against the acceptance criteria below.",
    "",
    `TASK IMPLEMENTED: ${contract.task}`,
    "",
    "SCREENSHOTS PROVIDED:",
    vpList,
    "",
    "ACCEPTANCE CRITERIA (every item must pass):",
    criteria,
    "",
    "Fail for: missing UI elements, clipping, overlap, wrong responsive behavior,",
    "unreadable text, broken visual hierarchy, or evidence the screenshot is stale/blank.",
    "",
    "Return your structured verdict per the output schema.",
  ].join("\n");
}

// ── Invoke Codex CLI ───────────────────────────────────────
function invokeCodex(prompt, imagePaths, repoRoot) {
  const verdictPath = join(WORK_DIR, "verdict.json");
  const schemaPath = join(repoRoot, ".claude/ui-verifier/verdict.schema.json");

  execFileSync("codex", [
    "exec",
    "--ephemeral",
    "--sandbox", "read-only",
    "-C", repoRoot,
    "--image", imagePaths.join(","),
    "--output-schema", schemaPath,
    "-o", verdictPath,
    prompt,
  ], { timeout: 180_000, stdio: ["ignore", "pipe", "pipe"] });

  return JSON.parse(readFileSync(verdictPath, "utf8"));
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  const hookInput = readHookInput();
  const lastMessage = hookInput.last_assistant_message || "";
  const repoRoot = hookInput.cwd || process.cwd();

  const contract = parseContract(lastMessage);
  if (!contract) {
    process.exit(0); // No contract → not a UI task → allow through
  }

  const shots = await captureScreenshots(contract);
  const prompt = buildPrompt(contract, shots);
  const verdict = invokeCodex(prompt, shots.map(s => s.path), repoRoot);

  writeFileSync(join(WORK_DIR, "verdict.json"), JSON.stringify(verdict, null, 2));

  if (verdict.pass) {
    process.exit(0);
  }

  // Block the subagent
  const failureLines = (verdict.failures || [])
    .map(f => `- [${f.criterion}]: ${f.explanation}`)
    .join("\n");

  const output = {
    decision: "block",
    reason: [
      "UI VERIFICATION FAILED. Fix these issues before stopping.",
      "",
      verdict.summary,
      "",
      failureLines,
      "",
      `Screenshots: ${WORK_DIR}`,
      "",
      "After fixing, include the same UI_VERIFICATION_CONTRACT in your final message.",
    ].join("\n"),
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
