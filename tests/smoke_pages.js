#!/usr/bin/env node
// Smoke test: every slot page opens in headless Chromium behind n8n's sandbox CSP (the gallery without it, as in production) with the class server stubbed,
// and raises no page error. EVERY request that is not to 127.0.0.1 is aborted and recorded, so this test can never
// reach n8n, Supabase or Cloudflare — and the report shows which production hosts each page would have contacted.
// Screenshots: build/tmp/smoke_<page>.png. Exit 1 if any page throws.
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const P = require("./paths.js");
const EX = JSON.parse(fs.readFileSync(path.join(P.ROOT, "caravan/quests/stub15.json"), "utf8"));
const S = "studenttoken12345~S1~student~Salwa%20Malik~Salwa", T = "teachertoken1234~MAHERKASHOOB~teacher~Maher%20Kashoob~Mr%20Maher";

// stub class server (same shape as the stubs in the existing uitest scripts)
const hook = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => {
  res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end();
  let j = {}; try { j = JSON.parse(b); } catch (e) { } let out = { ok: true };
  if (j.kind === "login") out = { ok: true, token: "studenttoken12345", id: j.id, role: "student", name: "Test Student", short: "Test", pin_set: true };
  if (j.kind === "exam") out = { ok: true, text: JSON.stringify(EX) };
  if (j.kind === "profile") out = { ok: true, profile: { xp: 10, level: 1, title: "Caravan Apprentice", badges: [], unlocks: [], rank: 5, students: 26 }, board: [], today: { exams: 0, limit: 12, writings: 0, wlimit: 5 } };
  if (j.kind === "tasks") out = { ok: true, tasks: [] };
  if (j.kind === "bank") out = { ok: true, spec: EX, id: 1, title: EX.title || "Bank exam", by: "Test" };
  res.setHeader("content-type", "application/json"); res.end(JSON.stringify(out)); }); }).listen(8897);
// page server: repo root, n8n sandbox CSP; /studio.html = the built Studio with its hook pointed at the stub
const studio = fs.existsSync(P.STUDIO) ? fs.readFileSync(P.STUDIO, "utf8").replace('window.CLASS_HOOK_URL="https://ge2-caravan-api.ge2-caravan.workers.dev/"', 'window.CLASS_HOOK_URL="http://127.0.0.1:8897/webhook/ge2-studio"') : null;
// n8n serves the 11 slot pages under a sandbox CSP, so those get it here too. The gallery has its own Cloudflare worker (no sandbox),
// and assets (textures, images) are plain same-origin files — a sandboxed page has origin "null", so assets also get a CORS header.
const srv = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (/\.html$/.test(u) && !u.startsWith("/caravan/gallery/")) res.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads");
  res.setHeader("access-control-allow-origin", "*");
  if (u === "/studio.html") { if (!studio) { res.statusCode = 404; return res.end("no studio build"); } res.setHeader("content-type", "text/html; charset=utf-8"); return res.end(studio); }
  const f = path.join(P.ROOT, u.replace(/^\//, "")); if (!f.startsWith(P.ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("no"); }
  res.setHeader("content-type", /\.html$/.test(f) ? "text/html; charset=utf-8" : /\.js$/.test(f) ? "text/javascript" : /\.css$/.test(f) ? "text/css" : /\.(jpe?g)$/.test(f) ? "image/jpeg" : /\.png$/.test(f) ? "image/png" : "application/octet-stream");
  res.end(fs.readFileSync(f)); }).listen(8899);

const PAGES = [
  { slot: 1, name: "studio",       url: "/studio.html",                                   vp: [1280, 900], expect: "#xid" },
  { slot: 2, name: "two_windows",  url: "/caravan/games/two_windows.html#play&s=" + S,    vp: [400, 820] },
  { slot: 3, name: "legends",      url: "/caravan/games/legends.html#play&s=" + S,        vp: [400, 820] },
  { slot: 4, name: "royale_host",  url: "/caravan/games/royale_host.html#teacher&s=" + T, vp: [1280, 800] },
  { slot: 5, name: "royale_play",  url: "/caravan/games/royale_play.html#play&s=" + S,    vp: [400, 820] },
  { slot: 6, name: "snake_play",   url: "/caravan/games/snake_play.html#play&s=" + S,     vp: [400, 820] },
  { slot: 7, name: "snake_host",   url: "/caravan/games/snake_host.html#teacher&s=" + T,  vp: [1280, 800] },
  { slot: 8, name: "fort",         url: "/caravan/quests/fort.html#play&s=" + S,          vp: [400, 820], expect: "#app" },
  { slot: "8-3d", name: "fort_adventure", url: "/caravan/quests/fort_adventure.html#play&s=" + S, vp: [1280, 720], expect: "#app" },
  { slot: 9, name: "rally",        url: "/caravan/quests/rally.html#play&s=" + S,         vp: [860, 400], expect: "#app" },
  { slot: 10, name: "dhow",        url: "/caravan/quests/dhow.html#play&s=" + S,          vp: [400, 820], expect: "#app" },
  { slot: 11, name: "brew_haha",   url: null, note: "no page source in the repo: slot 11 is built elsewhere (publish.sh reads Slot-11-Brew-Haha.html from CARAVAN_OUT)" },
  { slot: "gallery", name: "gallery", url: "/caravan/gallery/index.html",                 vp: [1024, 768], expect: "#stage" },
];
(async () => {
  const b = await chromium.launch(); const rows = []; let fails = 0;
  for (const pg of PAGES) {
    if (!pg.url) { rows.push({ ...pg, verdict: "UNVERIFIED" }); console.log(`[UNVERIFIED] slot ${pg.slot} ${pg.name}: ${pg.note}`); continue; }
    if (pg.name === "studio" && !studio) { rows.push({ ...pg, verdict: "UNVERIFIED" }); console.log("[UNVERIFIED] slot 1 studio: build missing"); continue; }
    const ctx = await b.newContext({ viewport: { width: pg.vp[0], height: pg.vp[1] }, isMobile: pg.vp[0] < 900, hasTouch: pg.vp[0] < 900 });
    const blocked = new Set(), errors = [], consoleErrs = [];
    await ctx.route("**/*", r => { const h = new URL(r.request().url()).hostname; if (h === "127.0.0.1" || h === "localhost") return r.continue(); blocked.add(h); r.abort("blockedbyclient"); });
    await ctx.addInitScript(() => { window.CARAVAN_HOOK = "http://127.0.0.1:8897/hook"; });
    const p = await ctx.newPage();
    p.on("pageerror", e => errors.push(String(e.message).slice(0, 200)));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR_/.test(m.text())) consoleErrs.push(m.text().slice(0, 160)); });
    let shown = false;
    try { await p.goto("http://127.0.0.1:8899" + pg.url, { waitUntil: "load", timeout: 30000 }); await p.waitForTimeout(2500);
      shown = pg.expect ? await p.isVisible(pg.expect) : (await p.evaluate(() => document.body && document.body.innerText.trim().length > 0));
      await p.screenshot({ path: P.shot("smoke_" + pg.name + ".png") }); } catch (e) { errors.push("navigation: " + e.message.split("\n")[0]); }
    const verdict = errors.length ? "FAIL" : shown ? "PASS" : "FAIL";
    if (verdict === "FAIL") fails++;
    rows.push({ slot: pg.slot, name: pg.name, verdict, errors, consoleErrs, blockedHosts: [...blocked], shown });
    console.log(`[${verdict}] slot ${String(pg.slot).padEnd(7)} ${pg.name.padEnd(12)} rendered=${shown} pageErrors=${errors.length} consoleErrors=${consoleErrs.length} blockedHosts=${[...blocked].join(",") || "-"}`);
    for (const e of errors) console.log("    PAGEERROR " + e); for (const e of consoleErrs.slice(0, 3)) console.log("    console: " + e);
    await ctx.close();
  }
  await b.close(); hook.close(); srv.close();
  fs.writeFileSync(P.tmp("smoke_results.json"), JSON.stringify(rows, null, 1));
  console.log(`\n${fails ? "FAIL" : "PASS"}: ${rows.filter(r => r.verdict === "PASS").length} pages ok, ${fails} failed, ${rows.filter(r => r.verdict === "UNVERIFIED").length} unverified`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error("RUNNER ERROR", e); process.exit(1); });
