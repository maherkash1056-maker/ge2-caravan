// Smoke test: Two Windows + 2 Legends with the reader (read-first + text beside questions), sandbox CSP, stand-in Claude.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const EXAM = fs.readFileSync(__dirname + "/khareef_exam.json", "utf8");
http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end(); let j = {}; try { j = JSON.parse(b); } catch (e) { } let out = { ok: true }; if (j.kind === "exam") out = { ok: true, text: EXAM }; if (j.kind === "result") console.log("RESULT", j.exam, j.right + "/" + j.total); res.setHeader("content-type", "application/json"); res.end(JSON.stringify(out)); }); }).listen(8897);
http.createServer((req, res) => { const f = path.join(__dirname, req.url.split("?")[0].replace(/^\//, "")); if (!fs.existsSync(f)) { res.statusCode = 404; return res.end("no"); } res.setHeader("content-type", "text/html; charset=utf-8"); res.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); res.end(fs.readFileSync(f)); }).listen(8899);
(async () => {
  const b = await chromium.launch();
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await ctx.addInitScript(() => { window.CARAVAN_HOOK = "http://127.0.0.1:8897/hook"; }); const p = await ctx.newPage(); p.on("pageerror", e => console.log("PAGEERROR", e.message)); p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) console.log("CONSOLE", m.text().slice(0, 160)); }); return p; };
  const H = "#play&s=studenttoken12345~S1~student~Salwa~Salwa";
  // ---- Two Windows
  let p = await mk(); await p.goto("http://127.0.0.1:8899/two_windows.html" + H); await p.waitForTimeout(800);
  console.log("TW buttons:", await p.evaluate(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent).map(b => b.textContent.trim()).slice(0, 6)));
  await p.click('#intro button[data-m="1"]'); await p.waitForTimeout(3500); console.log("TW modal:", await p.evaluate(() => (document.querySelector("#card") || {}).innerText.slice(0, 160)));
  console.log("TW story stage:", await p.evaluate(() => ({ words: document.querySelectorAll("#card .cv-w").length, btnDisabled: (document.querySelector("#card > button") || {}).disabled, count: (document.querySelector("#hlcount") || {}).textContent })));
  await p.screenshot({ path: "/tmp/tw_read.png" });
  for (const i of [0, 6, 12, 20]) { const els = await p.$$('#card .cv-w'); if (els[i]) await els[i].click(); }
  console.log("TW after taps:", await p.evaluate(() => ({ btnDisabled: (document.querySelector("#card > button") || {}).disabled, count: (document.querySelector("#hlcount") || {}).textContent })));
  await p.click("#card > button"); await p.waitForTimeout(500);
  // force a question
  await p.evaluate(() => { const s = stars.find(s => !s.done); ask(s, "L"); }); await p.waitForTimeout(600);
  console.log("TW question has text:", await p.evaluate(() => ({ text: !!document.querySelector("#card .cv-text"), hl: document.querySelectorAll("#card .cv-text .cv-w.hl").length, visible: document.querySelector("#modal").classList.contains("show") })));
  await p.screenshot({ path: "/tmp/tw_q.png" }); await p.context().close();
  // ---- 2 Legends
  p = await mk(); await p.goto("http://127.0.0.1:8899/legends.html" + H); await p.waitForTimeout(800);
  await p.click("#playBtn"); await p.waitForTimeout(2500);
  console.log("LG read-first:", await p.evaluate(() => ({ ovl: !!document.querySelector(".cv-ovl"), words: document.querySelectorAll(".cv-ovl .cv-w").length, btnDisabled: (document.querySelector(".cv-ovl button") || {}).disabled })));
  await p.screenshot({ path: "/tmp/lg_read.png" });
  for (const i of [0, 6, 12, 20, 30]) { const els = await p.$$('.cv-ovl .cv-w'); if (els[i]) await els[i].click(); }
  console.log("LG after taps:", await p.evaluate(() => (document.querySelector(".cv-ovl .cv-count") || {}).textContent));
  await p.click(".cv-ovl button"); await p.waitForTimeout(800);
  await p.waitForTimeout(5000);
  console.log("LG question has text:", await p.evaluate(() => ({ text: !!document.querySelector("#card .cv-text, .card .cv-text"), hl: document.querySelectorAll(".cv-text .cv-w.hl").length })));
  await p.screenshot({ path: "/tmp/lg_q.png" });
  await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
