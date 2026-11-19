// Acceptance tests for the CURRENT Khareef Rally 3D (rally3d/index.html) — behaviour as shipped, before any rebuild.
// How: the page is served locally with the adapter's hard-coded API URL rewritten to a stub on :8897 (the file itself is
// untouched), every non-loopback request is intercepted (textures answered from rally3d/tex_s, everything else aborted),
// and the game is driven through the debug hooks the bundle itself exposes (window.__quiz, __drive, __dg, __skipIntro).
// The quiz object works from the garage, so most scenarios never build the 3D world (which headless software WebGL renders
// at < 1 fps); A03 builds it once to prove the real start path. Each scenario is independent: fresh context + localStorage.
// Run: node tests/rally/acceptance.js   (exit 1 if any scenario fails). Logs go to stdout; screenshots to build/tmp.
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const P = require("../paths.js");
const C = JSON.parse(fs.readFileSync(path.join(P.ROOT, "caravan/rally/docs/content.json"), "utf8"));
const EX = JSON.parse(fs.readFileSync(path.join(P.ROOT, "caravan/quests/stub15.json"), "utf8"));
const PROD_API = "https://ge2-caravan-api.ge2-caravan.workers.dev/", STUB = "http://127.0.0.1:8897/hook";
const page0 = fs.readFileSync(path.join(P.ROOT, "rally3d/index.html"), "utf8");
if (!page0.includes('const API="' + PROD_API + '"')) throw new Error("adapter API constant not found — the page changed");
const pageHtml = page0.replace('const API="' + PROD_API + '"', 'const API="' + STUB + '"');

// ---- stub class server: records every payload, answers like the Edge Function
let posts = [], examReply = () => ({ ok: true, text: JSON.stringify(EX) });
const hook = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => {
  res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end();
  let j = {}; try { j = JSON.parse(b); } catch (e) { } posts.push(j); let out = { ok: true };
  if (j.kind === "exam") out = examReply(j); if (j.kind === "bank") out = { ok: true, spec: EX, id: 1, title: EX.title };
  res.setHeader("content-type", "application/json"); res.end(JSON.stringify(out)); }); }).listen(8897);
const srv = http.createServer((req, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); if (!/nocsp=1/.test(req.url)) res.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); res.end(pageHtml); }).listen(8899);

const S = "studenttoken12345~000S0000~student~Salwa%20Malik~Salwa", T = "teachertoken1234~MAHERKASHOOB~teacher~Maher%20Kashoob~Mr%20Maher";
const results = []; let browser;
// quiz methods await a human choice; when a scenario ends with one pending, its evaluate rejects on context close — not a failure
process.on("unhandledRejection", e => { if (/closed|Execution context was destroyed/i.test(String(e && e.message))) return; console.error("UNHANDLED", e); process.exit(1); });
const ONLY = process.argv.slice(2);
async function scenario(name, hash, fn, opts = {}) {
  if (ONLY.length && !ONLY.some(k => name.startsWith(k))) return;
  posts = []; const ctx = await browser.newContext({ viewport: { width: opts.w || 800, height: opts.h || 500 }, isMobile: !!opts.mobile, hasTouch: !!opts.mobile, deviceScaleFactor: 1 });
  const blocked = new Set();
  await ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue();
    if (u.hostname === "ge2-caravan-rally.ge2-caravan.workers.dev" && u.pathname.startsWith("/tex/")) { const f = path.join(P.ROOT, "rally3d/tex_s", u.pathname.slice(5)); if (fs.existsSync(f)) return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": /\.png$/.test(f) ? "image/png" : "image/jpeg", "access-control-allow-origin": "*" } }); return r.fulfill({ status: 200, body: JSON.stringify({ ok: true, files: [] }), headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); }
    blocked.add(u.hostname); r.abort("blockedbyclient"); });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", e => errors.push(String(e.message).slice(0, 200)));
  const t0 = Date.now(); let verdict = "PASS", note = "";
  try { await p.goto("http://127.0.0.1:8899/webhook/ge2-studio-app?p=9" + (opts.nocsp ? "&nocsp=1" : "") + hash, { waitUntil: "load", timeout: 60000 });
    await p.waitForFunction(() => window.__ready === true && !!window.__quiz, null, { timeout: 60000 });
    await fn(p, { posts: () => posts, blocked }); if (errors.length) { verdict = "FAIL"; note = "page errors: " + errors.join(" | "); } }
  catch (e) { verdict = "FAIL"; note = String(e.message || e).split("\n")[0].slice(0, 220); try { await p.screenshot({ path: P.shot("rally_fail_" + name.replace(/\W+/g, "_") + ".png") }); } catch (_) { } }
  results.push({ name, verdict, note, seconds: ((Date.now() - t0) / 1000).toFixed(1), blocked: [...blocked] });
  console.log(`[${verdict}] ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)${note ? " — " + note : ""}${blocked.size ? "  blocked:" + [...blocked].join(",") : ""}`);
  await ctx.close();
}
const assert = (cond, msg) => { if (!cond) throw new Error("assertion failed: " + msg); };
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
// answer helpers against the quiz panel DOM
async function answerAbc(p, idx) { await p.waitForSelector("#qpanel .qopt", { timeout: 15000 }); await p.click(`#qpanel .qopt[data-i="${idx}"]`); await p.waitForSelector("#qcont", { timeout: 5000 }); const ok = await p.$eval("#qpanel .qtitle", e => e.classList.contains("ok")); await p.click("#qcont"); return ok; }
async function answerOne(p, text) { await p.waitForSelector("#qans", { timeout: 15000 }); await p.fill("#qans", text); await p.click("#qgo"); await p.waitForSelector("#qcont", { timeout: 5000 }); const ok = await p.$eval("#qpanel .qtitle", e => e.classList.contains("ok")); await p.click("#qcont"); return ok; }
async function clickV(p, v) { await p.waitForSelector(`#qpanel [data-v="${v}"]`, { timeout: 15000 }); await p.click(`#qpanel [data-v="${v}"]`); }
const state = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__quiz.S)));
const stored = p => p.evaluate(() => JSON.parse(localStorage.getItem("orq_ge2_v1") || "null"));
async function answerLandmark(p, id, rightCount) { // answers the landmark's own questions, first `rightCount` correctly
  const lm = C.landmarks.find(l => l.id === id); const qs = lm.stone ? lm.qs : lm.qs.slice(0, 2); const oks = [];
  for (let i = 0; i < qs.length; i++) { const q = qs[i], right = i < rightCount; oks.push(q.type === "abc" ? await answerAbc(p, right ? q.a : (q.a + 1) % 3) : await answerOne(p, right ? q.a[0] : "zzz")); }
  return oks;
}

(async () => {
  browser = await chromium.launch();

  await scenario("A01 load: garage renders, WebGL canvases, no page error, only the texture host contacted", "#play&s=" + S, async (p, x) => {
    assert(await p.isVisible("#garage"), "#garage visible"); assert(await p.$("#iActs button"), "garage action button");
    const canvases = await p.evaluate(() => [...document.querySelectorAll("canvas")].filter(c => { try { return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }).length);
    assert(canvases >= 1, "at least one WebGL canvas"); eq([...x.blocked], [], "no host other than the texture worker is contacted on load"); eq(x.posts().length, 0, "no class-server call before the player starts");
    await p.screenshot({ path: P.shot("rally_garage.png") });
  });

  await scenario("A02 intro: with a session the intro offers 'Fresh from Claude' (checked) and 'Built-in question pack'", "#play&s=" + S, async p => {
    p.evaluate(() => window.__quiz.intro()); await p.waitForSelector("#qpanel input[name=qsrc]", { timeout: 20000 });
    eq(await p.$$eval("#qpanel input[name=qsrc]", es => es.map(e => [e.value, e.checked])), [["claude", true], ["offline", false]], "source radios");
    eq(await p.inputValue("#qname"), "Salwa", "name prefilled from the hash short name"); assert(await p.$('#qpanel [data-v="new"]'), "Start driving button");
  });

  await scenario("A03 start via the real Drive path: world builds, intro, exam POST contract, pool, HUD shown, state saved", "#play&s=" + S, async (p, x) => {
    const t0 = Date.now(); await p.evaluate(() => { window.__drive("pickup"); }); await p.waitForSelector('#qpanel [data-v="new"]', { timeout: 300000 }); const build = ((Date.now() - t0) / 1000).toFixed(1);
    await clickV(p, "new"); await p.waitForFunction(() => window.__quiz.pool.src === "claude" && window.__dg.active, null, { timeout: 60000 });
    const ex = x.posts().filter(q => q.kind === "exam"); eq(ex.length, 1, "exactly one exam call");
    const q = ex[0]; eq([q.kind, q.token, q.student, q.device, q.len, q.game, q.style, q.awl, q.fast], ["exam", "studenttoken12345", "Salwa Malik", "GAME", 15, "Khareef Rally", true, true, false], "exam payload"); eq(q.skills, ["r_abc", "r_word"], "skills");
    const usable = EX.questions.filter(q => ["abc", "mcq", "one", "short", "table", "box", "gap", "note", "word"].includes(String(q.type).toLowerCase())).length;
    const pool = await p.evaluate(() => window.__quiz.pool.cp.length); eq(pool, usable + 16, `usable Claude items (${usable} of ${EX.questions.length}; tfng etc. are dropped) prepended to the 16 built-in checkpoint items`);
    assert(await p.isVisible("#hud"), "HUD visible"); assert(!(await p.isVisible("#garage")), "garage hidden");
    const st = await state(p); eq([st.v, st.started, st.done, st.source, st.name, st.veh], [1, true, false, "claude", "Salwa", "pickup"], "in-memory state after start"); eq(Math.round(st.fuel), 100, "pickup tank full at start (a frame may already have burned a few millilitres)");
    const ls = await p.evaluate(() => { try { return "readable:" + !!localStorage.getItem("orq_ge2_v1"); } catch (e) { return "throws:" + e.name; } }); eq(ls, "throws:SecurityError", "under n8n's sandbox CSP (no allow-same-origin) localStorage throws, so save() is a silent no-op");
    results.push({ name: "A03.info world build time (headless, software WebGL)", verdict: "INFO", note: build + " s", seconds: build, blocked: [] }); console.log("[INFO] world build " + build + " s");
  });

  await scenario("A04 bank source: x=bank.25. → kind bank with len 25; x=mine → title", "#play&s=" + S + "&x=bank.25.", async (p, x) => {
    p.evaluate(() => window.__quiz.intro()); await clickV(p, "new"); await p.waitForFunction(() => window.__quiz.pool.src === "claude", null, { timeout: 20000 });
    eq(x.posts().map(q => q.kind), ["bank"], "only a bank call"); eq(x.posts()[0].data, { skills: ["r_abc", "r_word"], len: 25 }, "bank request");
  });

  await scenario("A05 offline: without a session nothing is posted, intro explains, built-in pack used", "#play", async (p, x) => {
    p.evaluate(() => window.__quiz.intro()); await p.waitForSelector("#qpanel .muted", { timeout: 20000 });
    assert((await p.textContent("#qpanel")).includes("Built-in question pack"), "intro text"); eq(await p.$$eval("#qpanel input[name=qsrc]", es => es.length), 0, "no source choice without a session");
    await clickV(p, "new"); await p.waitForTimeout(800); eq(x.posts().length, 0, "no network call"); eq((await state(p)).source, "offline", "source offline");
  });

  await scenario("A06 knowledge stop (Al Baleed): verbatim text, 3 questions, 3/3 → stone + badge + 80 XP + cutscene + result POST", "#play&s=" + S, async (p, x) => {
    const lm = C.landmarks.find(l => l.id === "baleed"); const before = await state(p);
    const done = p.evaluate(() => window.__quiz.visit("baleed", null));
    await p.waitForSelector("#qpanel .rtext", { timeout: 15000 }); eq(await p.textContent("#qpanel .rtext"), lm.text, "landmark text shown verbatim");
    assert((await p.textContent("#qpanel")).includes("Knowledge Stop"), "titled Knowledge Stop"); assert((await p.textContent("#qpanel")).includes("answer 3 questions"), "3 questions announced");
    await clickV(p, "go"); const oks = await answerLandmark(p, "baleed", 3); eq(oks, [true, true, true], "all three judged correct");
    for (let i = 0; i < 3; i++) { await p.waitForSelector("#qpanel .comic", { timeout: 10000 }); const cap = await p.textContent("#qpanel .caption"); eq(cap, lm.scene[i], "cutscene panel " + (i + 1)); await clickV(p, "ok"); }
    eq(await done, true, "visit resolves true");
    const after = await state(p); eq(after.stones, ["baleed"], "stone recorded"); eq(after.badges, ["stone_baleed"], "badge"); eq(after.xp - before.xp, 80, "3×10 + 50 XP"); eq(after.coins - before.coins, 80, "coins mirror XP");
    await p.waitForTimeout(500);
    const r = x.posts().filter(q => q.kind === "result"); eq(r.length, 1, "one result POST after the stop");
    eq([r[0].type, r[0].exam, r[0].right, r[0].total, r[0].grade, r[0].score, r[0].won, r[0].device], ["Quest", "Khareef Rally", 3, 3, "A", 30, false, "GAME"], "result payload (not final → no stone bonus, never won)");
    eq(r[0].skills, [{ id: "r_abc", name: "A, B or C questions", r: 2, n: 2 }, { id: "r_one", name: "One word or a number", r: 1, n: 1 }], "skills"); eq(r[0].badges, ["stone_baleed"], "badges in result");
  });

  await scenario("A07 knowledge stop failed (1/3): no stone, +15 s roadworks penalty, XP only for the right answer", "#play&s=" + S, async p => {
    const before = await state(p); const done = p.evaluate(() => window.__quiz.visit("taqah", null)); await clickV(p, "go"); await answerLandmark(p, "taqah", 1);
    await p.waitForSelector("#qpanel .qtitle.no", { timeout: 10000 }); assert((await p.textContent("#qpanel")).includes("Roadworks delay"), "roadworks panel"); await clickV(p, "ok");
    eq(await done, false, "visit resolves false"); const after = await state(p); eq(after.stones, [], "no stone"); eq(after.penalty - before.penalty, 15, "penalty"); eq(after.xp - before.xp, 10, "one right answer");
  });
  await scenario("A07b knowledge stop 2/3 is enough for the stone", "#play&s=" + S, async p => {
    const done = p.evaluate(() => window.__quiz.visit("darbat", null)); await clickV(p, "go"); await answerLandmark(p, "darbat", 2); for (let i = 0; i < 3; i++) await clickV(p, "ok");
    eq(await done, true, "2 of 3 wins the stone"); eq((await state(p)).stones, ["darbat"], "stone");
  });

  await scenario("A08 photo stop (Razat): 2 questions, both right → photo in album, +40 XP, polaroid; one wrong → blurry", "#play&s=" + S, async p => {
    const before = await state(p); let done = p.evaluate(() => window.__quiz.visit("razat", null)); await p.waitForSelector("#qpanel .rtext");
    assert((await p.textContent("#qpanel")).includes("Photo mode"), "photo mode title"); await clickV(p, "go"); await answerLandmark(p, "razat", 2);
    await p.waitForSelector("#qpc", { timeout: 10000 }); await clickV(p, "ok"); eq(await done, true, "resolves true");
    let after = await state(p); eq(after.photos, ["razat"], "photo"); eq(after.xp - before.xp, 40, "2×10 + 20");
    done = p.evaluate(() => window.__quiz.visit("tawi", null)); await clickV(p, "go"); await answerLandmark(p, "tawi", 1); eq(await done, false, "blurry"); after = await state(p); eq(after.photos, ["razat"], "no new photo");
  });

  await scenario("A09 checkpoint: correct → +35% of tank and +10 XP; wrong → nothing; fuel capped at tank", "#play&s=" + S, async p => {
    await p.evaluate(() => { window.__quiz.S.fuel = 20; window.__quiz.S.source = "offline"; window.__quiz.resetPool(); });
    let item = await p.evaluate(() => window.__quiz.pool.cp[window.__quiz.pool.cp.length - 1]); let done = p.evaluate(() => window.__quiz.checkpoint()); await p.waitForSelector("#qpanel .rtext");
    eq(await p.textContent("#qpanel .rtext"), item.text, "checkpoint notice text verbatim");
    const ok = item.type === "abc" ? await answerAbc(p, item.a) : await answerOne(p, item.a[0]); assert(ok && await done, "correct"); let s = await state(p); eq(s.fuel, 55, "20 + 35");
    await p.evaluate(() => { window.__quiz.S.fuel = 90; }); item = await p.evaluate(() => window.__quiz.pool.cp[window.__quiz.pool.cp.length - 1]); done = p.evaluate(() => window.__quiz.checkpoint());
    if (item.type === "abc") await answerAbc(p, item.a); else await answerOne(p, item.a[0]); await done; eq((await state(p)).fuel, 100, "capped at tank 100");
    item = await p.evaluate(() => window.__quiz.pool.cp[window.__quiz.pool.cp.length - 1]); done = p.evaluate(() => window.__quiz.checkpoint()); if (item.type === "abc") await answerAbc(p, (item.a + 1) % 3); else await answerOne(p, "zzz"); eq(await done, false, "wrong"); eq((await state(p)).fuel, 100, "unchanged");
  });

  await scenario("A10 road sign gate: typed word opens it (+10 XP, gate stored); case/articles ignored; wrong keeps it closed", "#play&s=" + S, async p => {
    let sign = await p.evaluate(() => window.__quiz.pool.signs[window.__quiz.pool.signs.length - 1]); let done = p.evaluate(() => window.__quiz.sign("taqah_road")); await p.waitForSelector("#qans");
    assert((await p.textContent("#qpanel")).includes("It starts with"), "hint shown"); eq(await p.getAttribute("#qans", "placeholder"), `Starts with “${sign.hint}”`, "placeholder hint");
    assert(await answerOne(p, "  " + sign.a[0].toUpperCase() + " "), "uppercase + spaces accepted"); eq(await done, true, "gate opens"); let s = await state(p); eq(s.gates, { taqah_road: true }, "gate stored");
    sign = await p.evaluate(() => window.__quiz.pool.signs[window.__quiz.pool.signs.length - 1]); done = p.evaluate(() => window.__quiz.sign("samhan_road")); assert(!(await answerOne(p, "zzz")), "wrong"); eq(await done, false, "stays closed"); eq((await state(p)).gates, { taqah_road: true }, "unchanged");
  });

  await scenario("A11 one-word matcher: number words, digits, articles, apostrophes", "#play&s=" + S, async p => {
    const tryAns = async (answers, typed) => { const d = p.evaluate(a => window.__quiz.ask({ type: "one", q: "q", a }), answers); const ok = await answerOne(p, typed); await d; return ok; };
    eq(await tryAns(["2000"], "two thousand"), false, "number words only map single words"); eq(await tryAns(["ten"], "10"), true, "digit for number word"); eq(await tryAns(["10"], "ten"), true, "number word for digit");
    eq(await tryAns(["the sea"], "sea"), true, "articles ignored"); eq(await tryAns(["o'clock"], "oclock"), true, "apostrophe ignored"); eq(await tryAns(["petrol", "gas", "fuel"], "Fuel."), true, "alternatives + trailing punctuation");
    eq(await tryAns(["frankincense"], "frankincens"), false, "no fuzzy match");
  });

  await scenario("A12 out of fuel: stranded question; correct → tank 30%, wrong → 12%", "#play&s=" + S, async p => {
    await p.evaluate(() => { window.__quiz.S.fuel = 0; window.__quiz.S.source = "offline"; window.__quiz.resetPool(); });
    let item = await p.evaluate(() => window.__quiz.pool.cp[window.__quiz.pool.cp.length - 1]); let d = p.evaluate(() => window.__quiz.stranded()); await p.waitForSelector("#qpanel .qtitle");
    assert((await p.textContent("#qpanel")).includes("Out of fuel"), "title"); if (item.type === "abc") await answerAbc(p, item.a); else await answerOne(p, item.a[0]); await d; eq((await state(p)).fuel, 30, "30% of 100");
    await p.evaluate(() => { window.__quiz.S.fuel = 0; }); item = await p.evaluate(() => window.__quiz.pool.cp[window.__quiz.pool.cp.length - 1]); d = p.evaluate(() => window.__quiz.stranded()); if (item.type === "abc") await answerAbc(p, (item.a + 1) % 3); else await answerOne(p, "zzz"); await d; eq((await state(p)).fuel, 12, "12% consolation");
  });

  await scenario("A13 radio: clip label, 40 s timer, correct → +10 XP (+20 with upgrade), 5 right → badge; wrong shows the script", "#play&s=" + S, async p => {
    await p.evaluate(() => window.__quiz.startRadio()); assert(!(await p.isHidden("#qradio")), "radio label shown"); const lbl = await p.textContent("#qradio"); const clip0 = await p.evaluate(() => window.__quiz.radio.pending.clip); assert(lbl.includes("Khareef FM") || lbl.includes(clip0) || lbl.includes("Question soon"), "label is 'Khareef FM · listen…' (speech), the clip as a ticker, or already 'Question soon' when speech ends at once (headless has no voices); got: " + lbl.slice(0, 60));
    for (let i = 0; i < 5; i++) { const item = await p.evaluate(() => window.__quiz.radio.pending || window.__quiz.nextRadio()); await p.evaluate(() => { window.__quiz.radio.pending = window.__quiz.radio.pending || window.__quiz.pool.radio[window.__quiz.pool.radio.length - 1]; });
      const pend = await p.evaluate(() => window.__quiz.radio.pending); const d = p.evaluate(() => window.__quiz.radioQuestion()); await p.waitForSelector("#qtbar", { timeout: 10000 }); if (i === 0) assert((await p.textContent("#qpanel")).includes("Khareef FM"), "intro mentions the radio");
      if (pend.type === "abc") await answerAbc(p, pend.a); else await answerOne(p, pend.a[0]); await d; }
    const s = await state(p); eq(s.radioRight, 5, "five right"); eq(s.badges, ["radio"], "Radio Star"); eq(s.xp, 50, "5 × 10");
    await p.evaluate(() => { window.__quiz.S.upg.radio = true; window.__quiz.radio.pending = window.__quiz.pool.radio[window.__quiz.pool.radio.length - 1]; }); let pend = await p.evaluate(() => window.__quiz.radio.pending); let d = p.evaluate(() => window.__quiz.radioQuestion());
    await p.waitForSelector("#qreplay", { timeout: 10000 }); if (pend.type === "abc") await answerAbc(p, pend.a); else await answerOne(p, pend.a[0]); await d; eq((await state(p)).xp, 70, "double XP with the better radio");
    await p.evaluate(() => { window.__quiz.radio.pending = window.__quiz.pool.radio[window.__quiz.pool.radio.length - 1]; }); pend = await p.evaluate(() => window.__quiz.radio.pending); d = p.evaluate(() => window.__quiz.radioQuestion()); if (pend.type === "abc") await answerAbc(p, (pend.a + 1) % 3); else await answerOne(p, "zzz");
    await p.waitForSelector("#qpanel .rtext", { timeout: 10000 }); eq(await p.textContent("#qpanel .rtext"), pend.clip, "script shown verbatim after a wrong answer"); await clickV(p, "ok"); await d;
  });

  await scenario("A14 garage: four vehicles (no camel), prices, buy disabled when poor, buying deducts coins, upgrades", "#play&s=" + S, async p => {
    await p.evaluate(() => window.__quiz.shop()); await p.waitForSelector("#qpanel [data-buy]");
    eq(await p.$$eval("#qpanel [data-buy]", es => es.map(e => [e.dataset.buy, e.textContent.trim(), e.disabled])), [["pickup", "Driving", true], ["suv", "🪙 300", true], ["saloon", "🪙 600", true], ["minibus", "🪙 1000", true]], "vehicle rows with 0 coins");
    eq(await p.$$eval("#qpanel [data-upg]", es => es.map(e => [e.dataset.upg, e.textContent.trim(), e.disabled])), [["tyres", "🪙 200", true], ["tank", "🪙 250", true], ["radio", "🪙 300", true], ["lights", "🪙 350", true]], "upgrade rows");
    await p.evaluate(() => { window.__quiz.S.coins = 550; window.__quiz.shop(); }); await p.click('#qpanel [data-buy="suv"]'); await p.waitForTimeout(200);
    let s = await state(p); eq([s.coins, s.owned, s.veh], [250, ["pickup", "suv"], "suv"], "bought and selected the 4x4"); eq(s.fuel, 100, "fuel is clamped to the new tank (120) and only raised when below 30% of it");
    await p.click('#qpanel [data-upg="tank"]'); await p.waitForTimeout(200); s = await state(p); eq([s.coins, s.upg], [0, { tank: true }], "tank upgrade"); eq(await p.evaluate(() => window.__quiz.tankCap()), 180, "120 × 1.5");
    eq(await p.evaluate(() => window.__quiz.level()), 1, "level = floor(xp/200)+1");
  });

  await scenario("A15 finish: result POST is final — score right×10 + stones×20, won iff ≥60%; best time stored; 'Drive again' keeps XP/coins/vehicles/badges", "#play&s=" + S, async (p, x) => {
    await p.evaluate(() => { const q = window.__quiz; q.S.stones = ["baleed", "taqah"]; q.S.badges = ["stone_baleed", "stone_taqah"]; q.S.xp = 300; q.S.coins = 120; q.S.owned = ["pickup", "suv"]; q.S.upg = { tyres: true }; q.S.photos = ["razat"]; for (let i = 0; i < 7; i++) q.S.results.push({ skill: "r_abc", type: "abc", q: "q", ok: i < 5, ans: "a", t: 1 }); q.save(); });
    const d = p.evaluate(() => window.__quiz.finish("1:23.4", " · New best!")); await p.waitForSelector('#qpanel [data-v="again"]', { timeout: 10000 });
    assert((await p.textContent("#qpanel")).includes("2 of 5 caravan stones"), "partial finish text"); await clickV(p, "again"); await d; await p.waitForTimeout(500);
    const r = x.posts().filter(q => q.kind === "result"); eq(r.length, 1, "one final result"); eq([r[0].right, r[0].total, r[0].grade, r[0].score, r[0].won], [5, 7, "C", 50 + 40, true], "final payload"); eq(r[0].badges, ["stone_baleed", "stone_taqah"], "badges");
    let s = await state(p); eq([s.done, s.stones, s.results.length], [true, ["baleed", "taqah"], 7], "quiz.finish only marks the run done; the reset belongs to the game's finishRun");
    await p.evaluate(() => { const q = window.__quiz, t = q.S, o = { xp: t.xp, coins: t.coins, owned: t.owned, upg: t.upg, badges: t.badges, veh: t.veh }; q.newRun(); Object.assign(q.S, o, { started: true }); q.save(); }); // what finishRun does on "again"
    s = await state(p); eq([s.xp, s.coins, s.owned, s.upg, s.badges, s.stones, s.photos, s.results.length, s.done, s.started], [300, 120, ["pickup", "suv"], { tyres: true }, ["stone_baleed", "stone_taqah"], [], [], 0, false, true], "new run keeps progression, resets the journey");
  });

  await scenario("A16 result cadence: every 10 recorded answers triggers one result POST with exactly the new items", "#play&s=" + S, async (p, x) => {
    await p.evaluate(() => { const q = window.__quiz; for (let i = 0; i < 9; i++) q.record({ skill: "r_abc", type: "abc", q: "q" + i }, i % 2 === 0, "a"); }); await p.waitForTimeout(300); eq(x.posts().filter(q => q.kind === "result").length, 0, "nothing at 9");
    await p.evaluate(() => window.__quiz.record({ skill: "r_one", type: "one", q: "q9" }, true, "x")); await p.waitForFunction(() => window.__quiz.lastPosted === 10, null, { timeout: 10000 }); const r = x.posts().filter(q => q.kind === "result"); eq(r.length, 1, "one post at 10"); eq([r[0].right, r[0].total], [6, 10], "10 items");
    await p.evaluate(() => { for (let i = 0; i < 10; i++) window.__quiz.record({ skill: "r_abc", type: "abc", q: "r" + i }, true, "a"); }); await p.waitForFunction(() => window.__quiz.lastPosted === 20, null, { timeout: 10000 }); const r2 = x.posts().filter(q => q.kind === "result"); eq(r2.length, 2, "second post at 20"); eq([r2[1].right, r2[1].total], [10, 10], "only the 10 new items");
  });

  await scenario("A17 persistence WITHOUT the sandbox header: reload continues the run (Continue shows stones and XP); 'New run' keeps progression", "#play&s=" + S, async p => {
    await p.evaluate(() => { const q = window.__quiz; q.S.started = true; q.S.stones = ["baleed"]; q.S.xp = 123; q.S.coins = 123; q.S.pos = 400; q.save(); });
    await p.reload({ waitUntil: "load" }); await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    p.evaluate(() => window.__quiz.intro());
    await p.waitForSelector('#qpanel [data-v="cont"]', { timeout: 20000 }); assert((await p.textContent('#qpanel [data-v="cont"]')).includes("1/5 stones, 123 XP"), "continue button text");
    await clickV(p, "new"); await p.waitForTimeout(500); const s = await state(p); eq([s.xp, s.coins, s.stones, s.started], [123, 123, [], true], "new run keeps XP, clears stones");
    const st = await stored(p); eq([st.v, st.xp, st.stones], [1, 123, []], "saved to localStorage orq_ge2_v1");
  }, { nocsp: true });

  await scenario("A17b persistence UNDER the sandbox header (as n8n serves it): nothing survives a reload, no page error", "#play&s=" + S, async p => {
    await p.evaluate(() => { const q = window.__quiz; q.S.started = true; q.S.stones = ["baleed"]; q.S.xp = 123; q.save(); });
    await p.reload({ waitUntil: "load" }); await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    const s = await state(p); eq([s.started, s.stones, s.xp], [false, [], 0], "fresh state after reload: the save was swallowed by try/catch");
    p.evaluate(() => window.__quiz.intro()); await p.waitForSelector('#qpanel [data-v="new"]', { timeout: 20000 }); eq(await p.$$eval('#qpanel [data-v="cont"]', es => es.length), 0, "no Continue offered");
  });

  await scenario("A18 teacher session: same flow, result carries the teacher's name", "#play&s=" + T, async (p, x) => {
    await p.evaluate(() => { for (let i = 0; i < 10; i++) window.__quiz.record({ skill: "r_abc", type: "abc", q: "q" }, true, "a"); }); await p.waitForTimeout(500);
    const r = x.posts().filter(q => q.kind === "result"); eq([r[0].token, r[0].student], ["teachertoken1234", "Maher Kashoob"], "teacher token and name");
  });

  await scenario("A19 book: stones, photo album, badges (scan/camel hidden) and per-skill bars", "#play&s=" + S, async p => {
    await p.evaluate(() => { const q = window.__quiz; q.S.stones = ["baleed"]; q.S.photos = ["razat"]; q.S.badges = ["stone_baleed"]; q.record({ skill: "r_abc", type: "abc", q: "q" }, true, "a"); q.record({ skill: "g_sign", type: "one", q: "q" }, false, "a"); q.book(); });
    await p.waitForSelector("#qpanel .thumbs"); const txt = await p.textContent("#qpanel");
    eq(await p.$$eval("#qpanel .badge", es => es.length), 8, "10 badges minus scan and camel"); assert(txt.includes("Reading · A/B/C") && txt.includes("Road signs · vocabulary"), "skill names"); assert(txt.includes("1/1") && txt.includes("0/1"), "skill scores");
  });

  await browser.close(); hook.close(); srv.close();
  fs.writeFileSync(P.tmp("rally_acceptance.json"), JSON.stringify(results, null, 1));
  const fails = results.filter(r => r.verdict === "FAIL").length, n = results.filter(r => r.verdict !== "INFO").length;
  console.log(`\n${fails ? "FAIL" : "PASS"}: ${n - fails}/${n} scenarios passed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error("RUNNER ERROR", e); process.exit(1); });
