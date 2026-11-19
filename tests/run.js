#!/usr/bin/env node
// GE2 Caravan test runner. Wraps the existing Playwright scripts without changing them.
//   node tests/run.js local   → everything that runs offline (stub class server on :8897, pages on :8899)
//   node tests/run.js live    → scripts that talk to PRODUCTION (Cloudflare room server). BLOCKED unless CARAVAN_LIVE=1.
//   node tests/run.js all
// Verdicts: PASS (exit 0, no PAGEERROR) · PASS-WARN (exit 0 but PAGEERROR lines) · FAIL (non-zero / timeout)
//           UNVERIFIED (prerequisite missing, e.g. Studio not built) · BLOCKED (live test, not authorised)
// Logs: build/tmp/logs/<id>.log, summary build/tmp/results.json. Tests run one at a time (they all bind the same ports).
const { spawnSync } = require("child_process"), fs = require("fs"), path = require("path");
const P = require("./paths.js");
const TIMEOUT = +(process.env.CARAVAN_TEST_TIMEOUT || 300) * 1000;

const TESTS = [
  // ---- local: no production service is needed; the class server is a stub, pages are served from the repo with n8n's sandbox CSP
  { id: "quests/uitest",       file: "caravan/quests/uitest.js",           tier: "local", what: "Fort, Rally, Dhow played through on phone viewports; bank-exam variant" },
  { id: "quests/uitest_d",     file: "caravan/quests/uitest_d.js",         tier: "local", what: "Dhow failure path" },
  { id: "games/classgames",    file: "caravan/games/uitest_classgames.js", tier: "local", what: "Two Windows + 2 Legends: read-first stage and questions" },
  { id: "games/studio",        file: "caravan/games/uitest_studio.js",     tier: "local", needs: "studio", what: "Studio: teacher login, play tab cards, teacher host buttons" },
  { id: "games/bank",          file: "caravan/games/uitest_bank.js",       tier: "local", needs: "studio", what: "Studio: saved-exam (bank) → play → reader → question" },
  { id: "games/read",          file: "caravan/games/uitest_read.js",       tier: "local", needs: "studio", what: "Studio: exam → play → read-first → question, landscape + portrait" },
  { id: "games/full",          file: "caravan/games/uitest_full.js",       tier: "local", needs: "studio", what: "Studio: full reading + listening paper" },
  { id: "games/full2",         file: "caravan/games/uitest_full2.js",      tier: "local", needs: "studio", what: "Studio: full paper, variant 2" },
  { id: "writing/uitest",      file: "caravan/writing/uitest_writing.js",  tier: "local", needs: "studio", what: "Studio: writing tab, photo upload, feedback render, result call" },
  { id: "games/dumpprompt",    file: "caravan/games/dumpprompt.js",        tier: "local", needs: "studio", what: "Studio: buildExamPrompt() runs and dumps the prompt" },
  { id: "smoke/pages",         file: "tests/smoke_pages.js",               tier: "local", needs: "studio", what: "Every slot page loads with no page error; all non-loopback requests blocked" },
  // ---- Khareef Rally 3D (slot 9) contract tests — Phase 2B. The adapter/content tests are node:test files; the other two drive the shipped page.
  { id: "rally/adapter",       file: "tests/rally/adapter.test.js",        tier: "local", runner: "node-test", what: "RALLY_BRIDGE contract: hash parsing, exam/bank/mine requests, result payload, grades, cadence rules" },
  { id: "rally/content",       file: "tests/rally/content.test.js",        tier: "local", runner: "node-test", what: "docs/content.json in sync with rally3d/index.html + content invariants" },
  { id: "rally/acceptance",    file: "tests/rally/acceptance.js",          tier: "local", what: "19 scenarios on the shipped 3D page via its debug hooks: stops, photos, checkpoints, signs, radio, fuel, shop, finish, persistence" },
  { id: "rally/mobile",        file: "tests/rally/mobile.js",              tier: "local", what: "Pixel 7 / Galaxy S9+ touch pads, desktop keys, fps sample, fuel burn, driving into the first stop" },
  { id: "rally/gfx",           file: "tests/rally/gfx.js",                 tier: "local", what: "graphics layer: tiers by hash, button/G/F, adaptive step-down, no-WebGL message" },
  // ---- live: these open rooms on the PRODUCTION Durable Objects server (ge2-caravan-server). Never run without authorisation.
  { id: "games/snake",         file: "caravan/games/uitest_snake.js",      tier: "live",  what: "Wadi Snakes host + 3 phones against the production room server (creates a room)" },
  { id: "server/snaketest",    file: "caravan/server/snaketest.js",        tier: "live",  what: "Wadi Snakes bots against production (creates a room)" },
  { id: "server/wstest2",      file: "caravan/server/wstest2.js",          tier: "live",  what: "Word Royale websocket flow against production (creates a room)" },
  { id: "server/wstest3",      file: "caravan/server/wstest3.js",          tier: "live",  what: "Word Royale timing flow against production (creates a room)" },
  { id: "server/wstest",       file: "caravan/server/wstest.mjs",          tier: "live",  what: "Word Royale room create + websockets from Node against production (creates a room)" },
];
// Helpers that need arguments and are not run automatically: caravan/games/validate40.js <exam.json>, caravan/verify_live.py <rows.json>

const which = process.argv[2] || "local";
if (!["local", "live", "all"].includes(which)) { console.error("usage: node tests/run.js local|live|all"); process.exit(2); }
const sel = TESTS.filter(t => which === "all" || t.tier === which);
const logs = path.join(P.TMP, "logs"); fs.mkdirSync(logs, { recursive: true });
const results = [];
for (const t of sel) {
  let verdict, note = "", ms = 0;
  if (t.tier === "live" && process.env.CARAVAN_LIVE !== "1") { verdict = "BLOCKED"; note = "production service; set CARAVAN_LIVE=1 only with explicit authorisation"; }
  else if (t.needs === "studio" && !fs.existsSync(P.STUDIO)) { verdict = "UNVERIFIED"; note = "Studio build missing — npm run build:studio"; }
  else {
    const t0 = Date.now();
    const args = t.runner === "node-test" ? ["--test", path.join(P.ROOT, t.file)] : [path.join(P.ROOT, t.file)];
    const r = spawnSync(process.execPath, args, { cwd: P.ROOT, timeout: TIMEOUT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CARAVAN_OUT: P.OUT, CARAVAN_TMP: P.TMP } });
    ms = Date.now() - t0;
    const out = (r.stdout || "") + (r.stderr || "");
    fs.writeFileSync(path.join(logs, t.id.replace(/\//g, "_") + ".log"), out);
    const pageErrors = (out.match(/^PAGEERROR.*$/gm) || []);
    if (r.error && r.error.code === "ETIMEDOUT") { verdict = "FAIL"; note = "timeout after " + TIMEOUT / 1000 + "s"; }
    else if (r.status === 3) { verdict = "UNVERIFIED"; note = out.trim().split("\n").pop(); }
    else if (r.status !== 0) { verdict = "FAIL"; note = "exit " + r.status + (r.signal ? " signal " + r.signal : "") + " — " + (out.trim().split("\n").filter(Boolean).pop() || "").slice(0, 160); }
    else if (pageErrors.length) { verdict = "PASS-WARN"; note = pageErrors.length + " PAGEERROR line(s): " + pageErrors[0].slice(0, 120); }
    else verdict = "PASS";
  }
  results.push({ id: t.id, tier: t.tier, verdict, note, seconds: Math.round(ms / 1000), what: t.what });
  console.log(`[${verdict.padEnd(10)}] ${t.id.padEnd(18)} ${ms ? (ms / 1000).toFixed(0) + "s " : ""}${note}`);
}
fs.writeFileSync(path.join(P.TMP, "results.json"), JSON.stringify({ when: new Date().toISOString(), which, results }, null, 1));
const count = v => results.filter(r => r.verdict === v).length;
console.log(`\nPASS ${count("PASS")}  PASS-WARN ${count("PASS-WARN")}  FAIL ${count("FAIL")}  UNVERIFIED ${count("UNVERIFIED")}  BLOCKED ${count("BLOCKED")}   (logs: ${logs})`);
process.exit(count("FAIL") ? 1 : 0);
