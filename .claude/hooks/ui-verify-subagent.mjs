#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, extname } from "node:path";
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
      const val = line.slice(2).trim();
      if (key === "routes") {
        const parts = val.split(">>");
        contract.routes.push({
          url: parts[0].trim(),
          scrollTo: parts[1]?.trim() || null,
        });
      } else {
        contract[key].push(val);
      }
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
      const urlSlug = route.url.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-");
      const scrollSlug = route.scrollTo
        ? "_scroll-" + route.scrollTo.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-")
        : "";
      const filename = `${urlSlug}${scrollSlug}_${vp}.png`;
      const filepath = join(WORK_DIR, filename);

      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto(route.url, { waitUntil: "networkidle", timeout: 30_000 });

      if (route.scrollTo) {
        await page.waitForSelector(route.scrollTo, { timeout: 10_000 });
        const el = await page.$(route.scrollTo);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: filepath, fullPage: false });
      await ctx.close();

      shots.push({ path: filepath, route: route.url, viewport: vp, scrollTo: route.scrollTo });
    }
  }

  await browser.close();
  return shots;
}

// ── Persist screenshots locally ────────────────────────────
function persistScreenshots(shots, repoRoot) {
  const dir = join(repoRoot, ".ui-verify", "screenshots");
  mkdirSync(dir, { recursive: true });

  let maxNum = 0;
  try {
    for (const f of readdirSync(dir)) {
      const match = f.match(/^(\d{4})-/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  } catch {}

  for (const shot of shots) {
    maxNum++;
    const prefix = String(maxNum).padStart(4, "0");
    const slug = buildSlug(shot.route, shot.scrollTo);
    const filename = `${prefix}-${slug}.png`;
    writeFileSync(join(dir, filename), readFileSync(shot.path));
  }
}

function buildSlug(url, scrollTo) {
  let pathname;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  pathname = pathname.replace(/^\/+|\/+$/g, "");
  let slug = pathname || "root";
  if (scrollTo) {
    slug += "-" + scrollTo.replace(/^[.#]+/, "");
  }
  return slug.replace(/[^a-z0-9]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

// ── Build Codex prompt ─────────────────────────────────────
function buildPrompt(contract, shots, hasReference) {
  const vpList = shots.map(s => {
    const scrollNote = s.scrollTo ? `(scrolled to ${s.scrollTo})` : "(top of page)";
    return `  - ${s.viewport} @ ${s.route} ${scrollNote}`;
  }).join("\n");
  const criteria = contract.acceptance.map((a, i) => `  ${i + 1}. ${a}`).join("\n");

  const lines = [
    "You are an independent UI QA reviewer. You did not write this code.",
  ];
  if (hasReference) {
    lines.push(
      "The FIRST image(s) are the REFERENCE/TARGET — this is what the UI MUST look like.",
      "The REMAINING images are the CURRENT state captured from the running app.",
      "Judge whether the current state visually matches the reference layout, structure, and design.",
    );
  }
  lines.push("Judge ONLY the provided screenshots against the acceptance criteria below.");

  return [
    ...lines,
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
  persistScreenshots(shots, repoRoot);

  const refDir = join(repoRoot, ".ui-verify", "reference");
  const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  let refImages = [];
  if (existsSync(refDir)) {
    refImages = readdirSync(refDir)
      .filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .sort()
      .map(f => join(refDir, f));
  }

  const allImages = [...refImages, ...shots.map(s => s.path)];
  const prompt = buildPrompt(contract, shots, refImages.length > 0);
  const verdict = invokeCodex(prompt, allImages, repoRoot);

  writeFileSync(join(WORK_DIR, "verdict.json"), JSON.stringify(verdict, null, 2));

  if (verdict.pass) {
    process.exit(0);
  }

  // Block the subagent
  const failureLines = (verdict.failures || [])
    .map((f, i) => `  ${i + 1}. FAIL [${f.viewport}] "${f.criterion}"\n     → ${f.explanation}`)
    .join("\n");

  const output = {
    decision: "block",
    reason: [
      "── UI VERIFICATION FAILED ──────────────────────────",
      "",
      `Assessment: ${verdict.summary}`,
      "",
      "Failures:",
      failureLines,
      "",
      `Screenshots saved to: ${WORK_DIR}`,
      "",
      "ACTION REQUIRED: Fix every failure listed above, then include a",
      "UI_VERIFICATION_CONTRACT block in your response to trigger re-verification.",
    ].join("\n"),
    systemMessage: [
      "AUTOMATED UI VERIFICATION RESULT — AUTHORITATIVE, NON-NEGOTIABLE.",
      "",
      "An independent visual QA judge (separate model, no shared context) reviewed",
      "screenshots of the running application against the acceptance criteria and",
      "returned the failures above. This is equivalent to a CI check failing.",
      "",
      "Rules you MUST follow:",
      "1. Treat every listed failure as a real, confirmed visual bug. Do NOT dismiss,",
      "   question, or argue with the verdict.",
      "2. Fix ALL listed failures in your next response.",
      "3. Do NOT claim the UI 'looks correct' or that the judge is wrong.",
      "4. Do NOT skip re-verification. Your response MUST end with a",
      "   UI_VERIFICATION_CONTRACT block so the judge can re-evaluate.",
      "5. If you are unsure how to fix a failure, attempt your best fix and let the",
      "   judge re-evaluate — do not give up or dismiss the issue.",
      "",
      "You are blocked from completing until verification passes.",
    ].join("\n"),
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
