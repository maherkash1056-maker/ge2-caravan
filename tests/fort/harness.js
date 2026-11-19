// Shared harness for Fort of Taqah tests: stub class server on :8897 (exam = stub15 questions filtered to the requested
// skills, padded to 18), quest pages served from caravan/quests on :8899 under n8n's sandbox CSP, every other host aborted.
const http = require("http"), fs = require("fs"), path = require("path");
const P = require("../paths.js");
const Q = path.join(P.ROOT, "caravan/quests"); const EX = JSON.parse(fs.readFileSync(path.join(Q, "stub15.json"), "utf8"));
const posts = [];
function start() {
  const hook = http.createServer((q, r) => { let b = ""; q.on("data", c => b += c); q.on("end", () => {
    r.setHeader("access-control-allow-origin", "*"); r.setHeader("access-control-allow-headers", "*"); if (q.method === "OPTIONS") return r.end();
    let j = {}; try { j = JSON.parse(b); } catch (e) { } posts.push(j); let out = { ok: true };
    if (j.kind === "exam") { const want = j.skills || []; const x = Object.assign({}, EX, { questions: EX.questions.filter(q => want.includes(q.skill)) }); while (x.questions.length < 18) x.questions = x.questions.concat(x.questions).slice(0, 18); out = { ok: true, text: JSON.stringify(x) }; }
    r.setHeader("content-type", "application/json"); r.end(JSON.stringify(out)); }); }).listen(8897);
  const srv = http.createServer((q, r) => { const rel = q.url.split("?")[0].slice(1); const f = path.join(Q, rel); if (!f.startsWith(Q) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end("no"); }
    r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(fs.readFileSync(f)); }).listen(8899);
  return { hook, srv, posts, close: () => { hook.close(); srv.close(); } };
}
const HASH = "#play&s=studenttoken12345~000S0000~student~Salwa%20Malik~Salwa";
async function context(browser, opts = {}) {
  const ctx = await browser.newContext(opts); await ctx.addInitScript(() => { window.CARAVAN_HOOK = "http://127.0.0.1:8897/hook"; });
  await ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue(); r.abort("blockedbyclient"); });
  return ctx;
}
// menu → fort → hero → exam → read-first overlay → stage
async function toStage(p, fortIndex = 0, hero = "commander") {
  await p.goto("http://127.0.0.1:8899/fort.html" + HASH, { waitUntil: "load" });
  await p.click(`[data-f="${fortIndex}"]`); await p.click(`.fcard[data-h="${hero}"]`); await p.click("#fsel");
  await p.waitForSelector(".cv-ovl", { timeout: 20000 }); const els = await p.$$(".cv-ovl .cv-w");
  for (let i = 0; i < els.length; i++) { await els[i].click(); if (/✓/.test(await p.textContent(".cv-count"))) break; }
  await p.click(".cv-ovl button");
  // highlight questions (up to 4) that follow the reading check
  for (let k = 0; k < 4; k++) { const b = await p.$(".cv-ovl [data-hq]"); if (!b) break; await b.click(); await p.waitForTimeout(1100); }
  await p.waitForSelector("#fqcard", { timeout: 10000 }); await p.waitForFunction(() => typeof F !== "undefined" && F.raiders.length > 0 && !!F.cur, null, { timeout: 10000 });
}
module.exports = { start, context, toStage, HASH, EX };
