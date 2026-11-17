// Studio: exam -> Play it -> read-first stage (highlights required) -> question with text beside it. Phone landscape + portrait.
const http = require('http'), fs = require('fs');
const { chromium } = require('playwright');
const EXAM = fs.readFileSync(__dirname + "/khareef_exam.json", "utf8");
const hook = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end(); let j = {}; try { j = JSON.parse(b); } catch (e) { } let out = { ok: true };
  if (j.kind === "login") out = { ok: true, token: "livetesttoken1234", id: j.id, role: "student", name: "Test Student", short: "Test", pin_set: true };
  if (j.kind === "exam") out = { ok: true, text: EXAM, left: 5 }; if (j.kind === "profile") out = { ok: true, profile: { xp: 20, level: 1, badges: "", unlocks: "race,penalty" } }; if (j.kind === "board") out = { ok: true, board: [] }; if (j.kind === "tasks") out = { ok: true, tasks: [] };
  if (j.kind === "result") console.log("RESULT", JSON.stringify(j).slice(0, 200));
  res.setHeader("content-type", "application/json"); res.end(JSON.stringify(out)); }); }).listen(8897);
const page = fs.readFileSync("/mnt/user-data/outputs/GE2-Game-Studio-CLASS-n8n.html", "utf8").replace('window.CLASS_HOOK_URL="https://ge2-caravan-api.ge2-caravan.workers.dev/"', 'window.CLASS_HOOK_URL="http://127.0.0.1:8897/webhook/ge2-studio"');
const srv = http.createServer((req, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); res.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); res.end(page); }).listen(8899);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 860, height: 400 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on("pageerror", e => console.log("PAGEERROR", e.message)); p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) console.log("CONSOLE", m.text().slice(0, 200)); });
  await p.goto("http://127.0.0.1:8899/webhook/ge2-studio-app#exam"); await p.waitForTimeout(600);
  await p.fill("#xid", "TEST001"); await p.fill("#xpin", "0000"); await p.click("#xsend"); await p.waitForTimeout(900);
  // pick a topic source and make the exam
  const topicBtn = await p.$("[data-src=topic], button:has-text('Topic'), label:has-text('topic')"); if (topicBtn) await topicBtn.click();
  const t = await p.$("#xtopic"); if (t) await t.fill("the khareef season in Salalah");
  await p.click('#xskills [data-sk="r_tfng"]'); await p.click('#xskills [data-sk="r_abc"]'); await p.click('#xsrc [data-src="topic"]').catch(() => {}); const t2 = await p.$("#xtopic"); if (t2) await t2.fill("the khareef season in Salalah");
  console.log("fullscreenEnabled:", await p.evaluate(() => document.fullscreenEnabled));
  await p.click("#xmake"); await p.waitForTimeout(2500);
  console.log("prog:", await p.textContent("#xprog"));
  const play = await p.$("#xout button:has-text('Play it')"); if (!play) { console.log("no Play it button; out=", (await p.textContent("#xout")).slice(0, 300)); }
  await play.click(); await p.waitForTimeout(900);
  await p.screenshot({ path: "/tmp/read_title.png" });
  const go = await p.$('#panel [data-act="go"]'); await go.click(); await p.waitForTimeout(600);
  console.log("read stage shown:", !!(await p.$("#panel .readstage")), "start disabled:", await p.evaluate(() => { const b = document.querySelector("#startbtn"); return b && b.disabled; }));
  await p.screenshot({ path: "/tmp/read_stage.png" });
  // tap 3 facts: "Salalah", "June", "Dhofar"
  for (const w of ["Salalah", "June", "Dhofar"]) { const el = await p.$('#panel .readstage .w:text-is("' + w + '")') || await p.$('#panel .readstage .w:has-text("' + w + '")'); if (el) await el.click(); }
  await p.waitForTimeout(200); console.log("count:", await p.textContent("#hlc"), "start disabled:", await p.evaluate(() => document.querySelector("#startbtn").disabled));
  await p.screenshot({ path: "/tmp/read_stage2.png" });
  // refusal test
  const bad = await p.$('#panel .readstage .w:text-is("the")'); if (bad) { await bad.click(); console.log("refused msg:", (await p.textContent("#hlc")).slice(0, 60)); }
  await p.click("#startbtn"); await p.waitForTimeout(600);
  for (let i = 0; i < 4; i++) { const b = await p.$("#panel [data-hq]"); if (!b) break; const q = await p.textContent("#panel h2"); await b.click(); console.log("hq:", q.slice(0, 60), "→", (await p.textContent("#hqmsg")).slice(0, 30)); await p.waitForTimeout(1100); }
  await p.waitForTimeout(1500); console.log("slog scan:", await p.evaluate(() => (G.slog || []).filter(x => x.skill === "r_scan").length), "qRight", await p.evaluate(() => G.qRight));
  // trigger a question by waiting for the game to ask (race asks on distance) — force via askQuestion()
  await p.evaluate(() => { if (typeof askQuestion === "function") askQuestion(); }); await p.waitForTimeout(1200);
  const hasText = await p.evaluate(() => { const l = document.querySelector("#panel .side .letter"); return l ? { visible: l.offsetParent !== null, hl: l.querySelectorAll(".w.hl").length, words: l.querySelectorAll(".w").length } : null; });
  console.log("question text panel:", JSON.stringify(hasText));
  await p.screenshot({ path: "/tmp/read_question.png" });
  // tap one more word during the question
  const w2 = await p.$('#panel .side .w:has-text("Ocean")'); if (w2) await w2.click(); console.log("hl after tap:", await p.evaluate(() => document.querySelectorAll("#panel .side .w.hl").length));
  await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
