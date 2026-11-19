// Harness for The Big Shopping Run (slot 12): stub class server on :8897 (records every POST; answers exam requests with a
// stub bank), page server on :8899 serving caravan/games under n8n's sandbox CSP, every other host aborted.
const http = require("http"), fs = require("fs"), path = require("path");
const P = require("../paths.js");
const GAMES = path.join(P.ROOT, "caravan/games");
const EX = JSON.parse(fs.readFileSync(path.join(P.ROOT, "caravan/quests/stub15.json"), "utf8"));
function start() {
  const posts = [];
  const hook = http.createServer((q, r) => { let b = ""; q.on("data", c => b += c); q.on("end", () => {
    r.setHeader("access-control-allow-origin", "*"); r.setHeader("access-control-allow-headers", "*"); if (q.method === "OPTIONS") return r.end();
    let j = {}; try { j = JSON.parse(b); } catch (e) { } posts.push(j); let out = { ok: true };
    if (j.kind === "exam") out = { ok: true, text: JSON.stringify(EX) };
    r.setHeader("content-type", "application/json"); r.end(JSON.stringify(out)); }); }).listen(8897);
  const srv = http.createServer((q, r) => { const rel = q.url.split("?")[0].slice(1); const f = path.join(GAMES, rel); if (!f.startsWith(GAMES) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end("no"); }
    r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(fs.readFileSync(f)); }).listen(8899);
  return { hook, srv, posts, close: () => { hook.close(); srv.close(); } };
}
const HASH = "#play&s=studenttoken12345~000S0000~student~Salwa%20Malik~Salwa";
async function context(browser, opts = {}) {
  const ctx = await browser.newContext(opts); await ctx.addInitScript(() => { window.CARAVAN_HOOK = "http://127.0.0.1:8897/hook"; });
  await ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue(); r.abort("blockedbyclient"); });
  return ctx;
}
async function open(p, hash = HASH) { await p.goto("http://127.0.0.1:8899/shopping.html" + hash, { waitUntil: "load" }); await p.waitForFunction(() => !!window.__sr, null, { timeout: 15000 }); }
// title → (story) → map → level: returns once the level is in "play"
async function toLevel(p, idx = 0, hero = "man") {
  await p.click(hero === "man" ? "#pm" : "#pw"); await p.fill("#nm", "Salwa"); await p.click("#start");
  for (let k = 0; k < 6; k++) { const b = await p.$("#intro:not([hidden]) #snext"); if (!b) break; await b.click(); await p.waitForTimeout(60); }
  await p.waitForSelector("#map:not([hidden])"); await p.click(`#map .lvl[data-l="${idx}"]`);
  await p.waitForFunction(() => window.__sr.G.state === "play", null, { timeout: 8000 });
}
module.exports = { start, context, open, toLevel, HASH };
