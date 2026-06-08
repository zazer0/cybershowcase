#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";

const CONTRACT_MARKER = "UI_VERIFICATION_CONTRACT";

const VERDICT_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["pass", "failures", "summary"],
  properties: {
    pass: { type: "boolean", description: "true if ALL acceptance criteria are met in the screenshots" },
    summary: { type: "string", description: "One-sentence overall assessment" },
    failures: {
      type: "array",
      items: {
        type: "object",
        required: ["criterion", "explanation", "viewport"],
        properties: {
          criterion: { type: "string", description: "The acceptance criterion that failed, verbatim from the contract" },
          explanation: { type: "string", description: "What is wrong in the screenshot and what the correct state should be" },
          viewport: { type: "string", description: "Which viewport the failure was observed in, if viewport-specific" },
        },
        additionalProperties: false,
      },
      description: "Empty array when pass is true",
    },
  },
  additionalProperties: false,
};

const CONFIG_DEFAULTS = {
  devServerUrl: "http://localhost:5173",
  screenshotWaitMs: 500,
  defaultViewports: ["1440x900", "390x844"],
  judge: {
    model: null,
    extraInstructions: null,
    timeoutMs: 180_000,
  },
  navigationWaitUntil: "networkidle",
  playwrightLaunchOptions: {},
  workDir: `${tmpdir()}/ui-verify`,
};

// ── Config ────────────────────────────────────────────────
function loadConfig(repoRoot) {
  const configPath = join(repoRoot, ".ui-verify", "config.json");
  let userConfig = {};
  if (existsSync(configPath)) {
    try {
      userConfig = JSON.parse(readFileSync(configPath, "utf8"));
    } catch (e) {
      console.error(`ui-verify: failed to parse config.json: ${e.message}`);
    }
  }
  const config = { ...CONFIG_DEFAULTS, ...userConfig };
  config.judge = { ...CONFIG_DEFAULTS.judge, ...(userConfig.judge || {}) };

  if (typeof config.workDir === "string" && config.workDir.includes("${TMPDIR}")) {
    config.workDir = config.workDir.replace("${TMPDIR}", tmpdir());
  }
  return config;
}

// ── Read stdin ────────────────────────────────────────────
function readHookInput() {
  return JSON.parse(readFileSync("/dev/stdin", "utf8"));
}

// ── Dependency checks ─────────────────────────────────────
async function checkDependencies(config) {
  try {
    await import("playwright");
  } catch {
    console.error("ui-verify: playwright not installed, skipping verification");
    return false;
  }

  try {
    execSync("which codex", { stdio: "ignore" });
  } catch {
    console.error("ui-verify: codex CLI not found on PATH, skipping verification");
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(config.devServerUrl, { signal: controller.signal });
    clearTimeout(timeout);
  } catch {
    console.error(`ui-verify: dev server not reachable at ${config.devServerUrl}, skipping verification`);
    return false;
  }

  return true;
}

// ── Scroll-targets registry ──────────────────────────────
function loadScrollTarget(repoRoot) {
  const activeFile = join(repoRoot, ".ui-verify", "active-target");
  const registryFile = join(repoRoot, ".ui-verify", "scroll-targets.json");

  if (!existsSync(activeFile) || !existsSync(registryFile)) return null;

  const key = readFileSync(activeFile, "utf8").trim();
  if (!key) return null;

  const registry = JSON.parse(readFileSync(registryFile, "utf8"));
  if (!(key in registry)) return null;

  return registry[key];
}

// ── Parse contract ────────────────────────────────────────
function parseContract(text, config) {
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
        let url = parts[0].trim();
        if (url.startsWith("/")) {
          const base = config.devServerUrl.replace(/\/+$/, "");
          url = base + url;
        }
        contract.routes.push({ url, scrollTo: parts[1]?.trim() || null });
      } else {
        contract[key].push(val);
      }
    } else {
      break;
    }
  }

  if (!contract.routes.length || !contract.acceptance.length) return null;
  if (!contract.viewports.length) contract.viewports = [...config.defaultViewports];
  return contract;
}

// ── Screenshot with Playwright ────────────────────────────
async function captureScreenshots(contract, registryTarget, config) {
  mkdirSync(config.workDir, { recursive: true });
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, ...config.playwrightLaunchOptions });
  const shots = [];

  for (const route of contract.routes) {
    const scrollTo = registryTarget !== null ? registryTarget.scrollTo : route.scrollTo;

    for (const vp of contract.viewports) {
      const [w, h] = vp.split("x").map(Number);
      const urlSlug = route.url.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-");
      const scrollSlug = scrollTo
        ? "_scroll-" + String(scrollTo).replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-")
        : "";
      const filename = `${urlSlug}${scrollSlug}_${vp}.png`;
      const filepath = join(config.workDir, filename);

      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto(route.url, { waitUntil: config.navigationWaitUntil, timeout: 30_000 });

      if (scrollTo === "__BOTTOM__") {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(config.screenshotWaitMs);
      } else if (scrollTo) {
        await page.waitForSelector(scrollTo, { timeout: 10_000 });
        const el = await page.$(scrollTo);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(config.screenshotWaitMs);
      }

      await page.screenshot({ path: filepath, fullPage: false });
      await ctx.close();

      shots.push({ path: filepath, route: route.url, viewport: vp, scrollTo });
    }
  }

  await browser.close();
  return shots;
}

// ── Persist screenshots ───────────────────────────────────
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

// ── Build Codex prompt ────────────────────────────────────
function buildPrompt(contract, shots, hasReference, config) {
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

  const parts = [
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
  ];

  if (config.judge.extraInstructions) {
    parts.push("", "ADDITIONAL PROJECT CONTEXT:", config.judge.extraInstructions);
  }

  parts.push("", "Return your structured verdict per the output schema.");
  return parts.join("\n");
}

// ── Invoke Codex CLI ──────────────────────────────────────
function invokeCodex(prompt, imagePaths, config, repoRoot) {
  const schemaPath = join(config.workDir, "verdict.schema.json");
  const verdictPath = join(config.workDir, "verdict.json");

  writeFileSync(schemaPath, JSON.stringify(VERDICT_SCHEMA, null, 2));

  const args = [
    "exec",
    "--ephemeral",
    "--sandbox", "read-only",
    "-C", repoRoot,
    "--image", imagePaths.join(","),
    "--output-schema", schemaPath,
    "-o", verdictPath,
  ];
  if (config.judge.model) {
    args.push("-m", config.judge.model);
  }
  args.push(prompt);

  execFileSync("codex", args, {
    timeout: config.judge.timeoutMs,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return JSON.parse(readFileSync(verdictPath, "utf8"));
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const hookInput = readHookInput();
  const lastMessage = hookInput.last_assistant_message || "";
  const repoRoot = hookInput.cwd || process.cwd();

  const config = loadConfig(repoRoot);
  const contract = parseContract(lastMessage, config);
  if (!contract) {
    process.exit(0);
  }

  const depsOk = await checkDependencies(config);
  if (!depsOk) {
    process.exit(0);
  }

  const registryTarget = loadScrollTarget(repoRoot);
  const shots = await captureScreenshots(contract, registryTarget, config);
  persistScreenshots(shots, repoRoot);

  const activeTargetPath = join(repoRoot, ".ui-verify", "active-target");
  if (!existsSync(activeTargetPath)) {
    const msg = JSON.stringify({ decision: "block", reason: "ERROR: no active target set. Write a scroll-target key to .ui-verify/active-target before emitting a verification contract." });
    process.stdout.write(msg + "\n");
    process.exit(1);
  }
  const activeTargetKey = readFileSync(activeTargetPath, "utf8").trim();

  const refDir = join(repoRoot, ".ui-verify", "reference");
  const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  let refImages = [];
  if (existsSync(refDir)) {
    refImages = readdirSync(refDir)
      .filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .filter(f => {
        const underscoreIdx = f.indexOf("_");
        if (underscoreIdx === -1) return true;
        const prefix = f.slice(0, underscoreIdx);
        return prefix === activeTargetKey;
      })
      .sort()
      .map(f => join(refDir, f));
  }

  const allImages = [...refImages, ...shots.map(s => s.path)];
  const prompt = buildPrompt(contract, shots, refImages.length > 0, config);
  const verdict = invokeCodex(prompt, allImages, config, repoRoot);

  writeFileSync(join(config.workDir, "verdict.json"), JSON.stringify(verdict, null, 2));

  if (verdict.pass) {
    process.exit(0);
  }

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
      `Screenshots saved to: ${config.workDir}`,
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
