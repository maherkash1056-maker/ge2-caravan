// Studio: exam -> Play it -> read-first stage (highlights required) -> question with text beside it. Phone landscape + portrait.
const http = require('http'), fs = require('fs');
const { chromium } = require('playwright');
const EXAM_R = fs.readFileSync(__dirname + "/full_R.json", "utf8"), EXAM_L = fs.readFileSync(__dirname + "/full_L.json", "utf8");
const hook = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end(); let j = {}; try { j = JSON.parse(b); } catch (e) { } let out = { ok: true };
  if (j.kind === "login") out = { ok: true, token: "livetesttoken1234", id: j.id, role: "student", name: "Test Student", short: "Test", pin_set: true };
  if (j.kind === "exam") { console.log("EXAM CALL len", j.len, "skills", (j.skills || []).join(","), /Listening script 2/.test(j.prompt) ? "LISTENING prompt" : "reading prompt"); out = { ok: true, text: j.len === 15 ? EXAM_L : EXAM_R, left: 5 }; } if (j.kind === "profile") out = { ok: true, profile: { xp: 20, level: 1, badges: "", unlocks: "race,penalty" } }; if (j.kind === "board") out = { ok: true, board: [] }; if (j.kind === "tasks") out = { ok: true, tasks: [] };
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
  await p.click('#xlen [data-len="20"]'); console.log("hint20:", (await p.textContent("#xlenhint")).slice(0,60), "| skills:", await p.evaluate(()=>[...document.querySelectorAll('#xskills [aria-pressed="true"]')].map(b=>b.dataset.sk).join(" ")));
  await p.click("#xmake"); await p.waitForTimeout(2000); console.log("prog20:", await p.textContent("#xprog"), "| order:", await p.evaluate(()=>XS.last.qs.map(q=>q.skill).join(" ")));
  await p.evaluate(()=>{ const c=[...document.querySelectorAll('#xskills [data-sk]')]; });
  await p.click('#xlen [data-len="15"]'); for (const k of ["r_tfng","r_abc","r_word","r_head","r_box","r_table","l_tf","l_abc","l_note"]) { const b=await p.$('#xskills [data-sk="'+k+'"]'); if(b) await b.click(); } console.log("ticked:", await p.evaluate(()=>XS.skills.length), await p.textContent("#xskn"));
  await p.click('#xlen [data-len="40"]'); await p.click('#xsrc [data-src="topic"]').catch(() => {}); await p.fill("#xtopic", "the khareef season in Salalah");
  await p.click("#xmake"); await p.waitForTimeout(2500); console.log("prog:", await p.textContent("#xprog"));
  console.log("order:", await p.evaluate(() => XS.last.qs.map(q => q.skill).join(" ")));
  console.log("part1:", await p.evaluate(() => { G.spec = XS.last; return tapePart(XS.last.texts[1].body, XS.last.qs.find(q => q.ans === "Bryant")); }));
  console.log("part2:", await p.evaluate(() => tapePart(XS.last.texts[2].body, XS.last.qs.find(q => q.ans === "7000"))));
  await (await p.$("#xout button:has-text('Play it')")).click(); await p.waitForTimeout(700);
  // normal mode first
  await p.click('#panel [data-act="go"]'); await p.waitForTimeout(500);
  for (const i of [0, 8, 16, 30, 40]) { const els = await p.$$('#panel .readstage .w'); if (els[i]) await els[i].click(); }
  await p.click("#startbtn"); await p.waitForTimeout(2500); await p.evaluate(() => askQuestion()); await p.waitForTimeout(900);
  console.log("normal listen q:", await p.evaluate(() => ({ btn: (document.querySelector('#panel [data-act="listen"]') || {}).textContent, q: document.querySelector("#panel .q .q, #panel div.q").textContent.slice(0, 60) })));
  await p.click('#panel [data-act="listen"]'); await p.waitForTimeout(300); console.log("after listen:", await p.textContent("#lplays"));
  await p.screenshot({ path: "/tmp/full_normal.png" });
  // hell mode
  await p.evaluate(() => { closePlay(); }); await p.waitForTimeout(300); await (await p.$("#xout button:has-text('Play it')")).click(); await p.waitForTimeout(700);
  await p.click('#panel [data-act="hell"]'); await p.waitForTimeout(300); await p.screenshot({ path: "/tmp/full_title.png" });
  await p.click('#panel [data-act="go"]'); await p.waitForTimeout(500);
  console.log("listen stage ready disabled:", await p.evaluate(() => document.querySelector("#lsgo").disabled));
  for (const b of await p.$$('#panel [data-act="lsplay"]')) await b.click();
  const ta = await p.$$("#panel .lsnotes"); await ta[0].fill("8:30 morning, 12 rials adults, guide BRYANT, lunch included"); await ta[1].fill("April cut, Hojari best, 7000 tourists, 9:00-6:00");
  await p.screenshot({ path: "/tmp/full_listen.png" }); console.log("ready disabled after play:", await p.evaluate(() => document.querySelector("#lsgo").disabled));
  await p.click("#lsgo"); await p.waitForTimeout(400); console.log("read stage next:", !!(await p.$("#startbtn")));
  for (const i of [0, 8, 16, 30, 40]) { const els = await p.$$('#panel .readstage .w'); if (els[i]) await els[i].click(); }
  await p.click("#startbtn"); await p.waitForTimeout(2500); await p.evaluate(() => askQuestion()); await p.waitForTimeout(900);
  console.log("hell q:", await p.evaluate(() => ({ listenBtn: !!document.querySelector('#panel [data-act="listen"]'), notes: (document.querySelector("#panel .side .letter") || {}).textContent })));
  await p.screenshot({ path: "/tmp/full_hell.png" });
  await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
