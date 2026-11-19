// UI test: host + 3 phone players in real browsers (n8n sandbox CSP header), live Cloudflare room server, local stand-in for Claude.
const P=require("../../tests/paths.js"); // portable build/tmp paths (see tests/paths.js)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ONES = []; for (let i = 0; i < 20; i++) ONES.push({ q: "One-liner " + i + ": choose the right word", options: ["alpha", "beta", "gamma"], answer: "ABC"[i % 3], why: "because", skill: ["v_awl", "g_tense", "g_modal"][i % 3] });
const DUELS = []; for (let i = 0; i < 8; i++) DUELS.push({ type: "tfng", text: "Salalah is a city in the south of Oman. The khareef brings mist from June to September. Many visitors come every year.", q: "Statement " + i + ": visitors come in winter.", options: ["True", "False", "Not Given"], answer: "ABC"[i % 3], why: "see text", skill: "r_tfng" });
const hook = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end(); let j = {}; try { j = JSON.parse(b); } catch (e) { } let out = { ok: true };
  if (j.kind === "exam") out = { ok: true, text: JSON.stringify({ title: "Test", oneliners: ONES, duels: DUELS }) }; if (j.kind === "bank") { console.log("BANK", JSON.stringify(j.data)); out = { ok: true, specs: [{ spec: { questions: [{ type: "tfng", q: "Bank statement one about Sur", answer: "True", evidence: "The town of Sur was one of the most important ports", why: "x", skill: "r_tfng" }, { type: "abc", q: "Bank abc", options: ["a", "b", "c"], answer: "B", evidence: "sailors from Sur built strong ships and", why: "", skill: "r_abc" }] } }] }; } if (j.kind === "profile") out = { ok: true, profile: { xp: 650 } }; if (j.kind === "result") { console.log("RESULT", JSON.stringify(j).slice(0, 300)); out = { ok: true, xp: 10 }; }
  res.setHeader("content-type", "application/json"); res.end(JSON.stringify(out)); }); }).listen(8897);
const pages = http.createServer((req, res) => { const f = path.join(__dirname, req.url.split("?")[0].replace(/^\//, "")); if (!fs.existsSync(f)) { res.statusCode = 404; return res.end("no"); } res.setHeader("content-type", "text/html; charset=utf-8"); res.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); res.end(fs.readFileSync(f)); }).listen(8899);
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" } });
  const mk = async (viewport, mobile) => { const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport, isMobile: !!mobile, hasTouch: !!mobile, deviceScaleFactor: 1 }); await ctx.addInitScript(() => { window.CARAVAN_HOOK = "http://127.0.0.1:8897/hook"; }); const p = await ctx.newPage(); p.on("pageerror", e => console.log("PAGEERROR", e.message)); p.on("console", m => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); }); return p; };
  const host = await mk({ width: 1280, height: 720 });
  await host.goto("http://127.0.0.1:8899/snake_host.html#teacher&s=teachertoken1234~MAHERKASHOOB~teacher~Maher%20Kashoob~Mr%20Maher");
  await host.click("#make"); await host.waitForSelector("#lobby:not(.hide)", { timeout: 30000 }); const code = (await host.textContent("#code")).trim(); console.log("room", code, "| pool:", await host.textContent("#qn"), "|", await host.textContent("#mkmsg"));
  const phones = []; const names = ["Salwa", "Rayan", "Durah"];
  for (let i = 0; i < 3; i++) { const p = await mk({ width: 390, height: 780 }, true); await p.goto("http://127.0.0.1:8899/snake_play.html?room=" + code + "#play&s=studenttoken12345~S" + i + "~student~" + names[i] + "~" + names[i]); await p.waitForTimeout(600); if (i === 0) { await p.click(".skin:nth-child(3)"); } await p.click("#go"); await p.waitForSelector("#wait:not(.hide)", { timeout: 10000 }); phones.push(p); }
  await host.waitForTimeout(800); await host.screenshot({ path: P.shot("snake_lobby.png") });
  await host.click("#start"); await host.waitForSelector("#stage:not(.hide)", { timeout: 10000 }); await phones[0].waitForSelector("#game:not(.hide)", { timeout: 10000 });
  // steer phones: tap around; phone 0 heads right, phone 1 heads to centre, phone 2 random
  const steerLoop = setInterval(async () => { try { for (const [i, p] of phones.entries()) { const me = await p.evaluate(() => { const m = snakes.get(myId); if (!m || !m.path.length) return null; const h = m.path[m.path.length - 1]; return [h[0], h[1]]; }); if (!me) continue; const a = Math.atan2(900 - me[1], 900 - me[0]); await p.touchscreen.tap(195 + Math.cos(a) * 120, 390 + Math.sin(a) * 120); } } catch (e) { } }, 250);
  let shots = 0; const shotLoop = setInterval(async () => { try { for (const [i, p] of phones.entries()) { if (shots < 3 && await p.$("#qov:not(.hide)")) { shots++; await p.screenshot({ path: P.shot("snake_q" + shots + ".png") }); } } } catch (e) { } }, 400);
  // answer any question that appears (always A)
  const ansLoop = setInterval(async () => { try { for (const p of phones) { const q = await p.$("#qov:not(.hide) .opt:not(:disabled)"); if (q) { await p.waitForTimeout(900); await q.click(); } const pw = await p.$("#pov:not(.hide) button"); if (pw) await pw.click(); } } catch (e) { } }, 700);
  await host.waitForTimeout(12000); await host.screenshot({ path: P.shot("snake_host.png") }); await phones[0].screenshot({ path: P.shot("snake_phone.png") });
  // force duels: wait more
  await host.waitForTimeout(18000); await phones[1].screenshot({ path: P.shot("snake_phone2.png") }); await host.screenshot({ path: P.shot("snake_host2.png") });
  const hud = await phones[0].evaluate(() => [document.querySelector("#hscore").textContent, document.querySelector("#hlen").textContent, document.querySelector("#hplace").textContent]); console.log("hud", hud);
  const feed = await host.textContent("#feed"); console.log("feed", feed.slice(0, 300));
  clearInterval(steerLoop); clearInterval(ansLoop); clearInterval(shotLoop);
  await host.click("#endb"); await host.waitForTimeout(300); await host.click("#endb"); await host.waitForSelector("#over:not(.hide)", { timeout: 10000 }); await host.screenshot({ path: P.shot("snake_over.png") }); await phones[0].waitForTimeout(1500); await phones[0].screenshot({ path: P.shot("snake_phone_end.png") });
  console.log("podium", (await host.textContent("#pod")).replace(/\s+/g, " ").slice(0, 300));
  await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
