#!/usr/bin/env node
// The Big Shopping Run (slot 12) — acceptance tests in real Chromium. Run: node tests/shopping/acceptance.js [filter]
// Drives the page through its debug handle window.__sr (game state, input flags, tile helpers); the class server is a stub.
const { chromium, devices } = require("playwright");
const P = require("../paths.js"); const H = require("./harness.js");
const filter = process.argv[2] || ""; const results = [];
const ok = (id, name, pass, note) => { results.push({ id, name, pass: !!pass, note }); console.log((pass ? "PASS " : "FAIL ") + id + " " + name + (note ? " — " + note : "")); };
process.on("unhandledRejection", () => { });
const T = 16;
const st = p => p.evaluate(() => { const G = window.__sr.G, q = G.player; return { state: G.state, x: q && q.x, y: q && q.y, vy: q && q.vy, ground: q && q.ground, dead: q && q.dead, pstate: q && q.state, h: q && q.h, coins: G.coins, score: G.score, lives: G.lives, level: G.level, time: G.time, cp: G.checkpoint, flag: !!G.flagSeq, room: !!G.room, unlocked: window.__sr.SAVE.unlocked, basket: window.__sr.SAVE.basket.slice(), qTotal: window.__sr.SAVE.qTotal, qRight: window.__sr.SAVE.qRight, src: G.qSource }; });
const findTile = (p, ch, afterX = 0) => p.evaluate(([ch, afterX]) => { const G = window.__sr.G; for (let y = 0; y < G.grid.length; y++) { const row = G.grid[y]; for (let x = Math.floor(afterX / 16); x < row.length; x++) if (row[x] === ch) return [x, y]; } return null; }, [ch, afterX]);
// teleport helper; A? blocks left behind are marked done (the game kills a player who skips three of them, which S19 checks)
const put = (p, x, y) => p.evaluate(([x, y]) => { const G = window.__sr.G, q = G.player; q.x = x; q.y = y; q.vx = 0; q.vy = 0; G.cam = Math.max(0, x - 120); for (const qb of G.qBlocks) if (qb.tx * 16 + 56 < x) qb.done = true; }, [x, y]);
const keys = (p, o) => p.evaluate(o => Object.assign(window.__sr.IN, o), o);
const tick = (p, ms) => p.waitForTimeout(ms);
// answers the open question; resolves when the dialog closes OR the next question replaces it (checkpoint retries re-open it in the same task)
async function answer(p, correct) { await p.waitForSelector("#ask:not([hidden]) .qbtn", { timeout: 5000 }); const a = await p.evaluate(c => { const el = document.querySelector("#ask"); const q = window.__sr.Q; const txt = el.querySelector(".qq").textContent; const item = q.find(x => x.q === txt); const i = c ? item.a : (item.a + 1) % item.o.length; el.querySelectorAll(".qbtn")[i].click(); return { i, a: item.a, txt }; }, correct); await p.waitForFunction(t => { const el = document.querySelector("#ask"); return el.hidden || el.querySelector(".qq").textContent !== t; }, a.txt, { timeout: 5000 }); return a; }

async function desktop(browser) {
  const ctx = await H.context(browser, { viewport: { width: 960, height: 540 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await H.open(p);
  ok("S01", "title: hero picker + name; start → story → world map with only 1-1 unlocked", await p.$("#title:not([hidden]) #start") && await p.$eval("#pm.sel", () => true).catch(() => false) !== null, "");
  await p.click("#pw"); await p.fill("#nm", "Salwa"); await p.click("#start"); await p.waitForSelector("#intro:not([hidden]) .story");
  let clicks = 0; for (let k = 0; k < 6; k++) { const b = await p.$("#intro:not([hidden]) #snext"); if (!b) break; await b.click(); clicks++; await tick(p, 60); }
  await p.waitForSelector("#map:not([hidden])"); const lv = await p.$$eval("#map .lvl", els => els.map(e => e.classList.contains("lock")));
  ok("S02", "story has pages and the map lists 10 levels with 1-1 open", clicks >= 3 && lv.length === 10 && !lv[0] && lv.slice(1).every(Boolean), `pages=${clicks}`);
  await p.click('#map .lvl[data-l="0"]'); await p.waitForFunction(() => window.__sr.G.state === "play", null, { timeout: 8000 });
  let s = await st(p); const hero = await p.evaluate(() => window.__sr.SAVE.hero);
  ok("S03", "1-1 starts in play with the chosen hero (Maryam), 3 lives, 600 s", s.state === "play" && hero === "woman" && s.lives === 3 && s.time === 600 && s.src === "builtin", `src=${s.src}`);
  // movement + jump
  const x0 = s.x; await keys(p, { r: true }); await tick(p, 500); await keys(p, { r: false }); s = await st(p);
  ok("S04", "holding right moves the hero", s.x > x0 + 40, `dx=${Math.round(s.x - x0)}`);
  await keys(p, { jumpP: true, jump: true }); await tick(p, 120); const air = await st(p); await keys(p, { jump: false }); await tick(p, 700); const land = await st(p);
  ok("S05", "jump leaves the ground and lands again", air.vy < 0 && !air.ground && land.ground, `vy=${air.vy && air.vy.toFixed(1)}`);
  // coin
  let c = await findTile(p, "C", 100); await put(p, c[0] * T, c[1] * T); await tick(p, 150); s = await st(p);
  ok("S06", "touching a coin collects it (+1 coin, +200)", s.coins === 1 && s.score === 200, `coins=${s.coins} score=${s.score}`);
  // ? block from below
  c = await findTile(p, "?", 100); await put(p, c[0] * T + 2, (c[1] + 1) * T + 2); await p.evaluate(() => { window.__sr.G.player.vy = -5; }); await tick(p, 300);
  const used = await p.evaluate(([x, y]) => window.__sr.tile(x, y), c); s = await st(p);
  ok("S07", "hitting a ? block from below turns it used and pops a coin", used === "U" && s.coins === 2, `tile=${used} coins=${s.coins}`);
  // A? question block → correct answer → +500, coins, power-up
  c = await findTile(p, "Q", 100); await put(p, c[0] * T + 2, (c[1] + 1) * T + 2); await p.evaluate(() => { window.__sr.G.player.vy = -5; }); await tick(p, 250);
  const asked = await p.$("#ask:not([hidden]) .qbtn"); if (!asked) { const d = await p.evaluate(([x, y]) => { const G = window.__sr.G, q = G.player; return [G.state, q.x, q.y, q.vy, q.dead, q.ground, window.__sr.tile(x, y), q.skipped, document.querySelector("#ask").hidden, G.qBlocks.filter(b => !b.done).length].join(" "); }, c); ok("S08", "A? block asks a grammar question", false, "no question dialog: " + d); throw new Error("S08 stopped: " + d); } const a1 = await answer(p, true); await tick(p, 700); s = await st(p);
  ok("S08", "A? block asks a grammar question; a correct answer pays 500 + 5 coins and drops a power-up", !!asked && s.qTotal === 1 && s.qRight === 1 && s.score >= 700 && s.coins >= 6, `score=${s.score} coins=${s.coins}`);
  const chip = await p.evaluate(() => { const G = window.__sr.G; const e = G.ents.find(e => e.k === "chip" || e.k === "tool"); if (!e) return null; e.rise = 0; e.x = G.player.x; e.y = G.player.y; return e.k; }); await tick(p, 200); s = await st(p);
  ok("S09", "the super date grows the hero (state 1, taller hit box)", chip === "chip" && s.pstate === 1 && s.h === 28, `item=${chip} state=${s.pstate}`);
  // stomp a beetle (after a question the hero is briefly invincible and enemies are pushed back — wait for that to end)
  await p.waitForFunction(() => window.__sr.G.player.inv === 0, null, { timeout: 6000 });
  const bug = await p.evaluate(() => { const G = window.__sr.G; const e = G.ents.find(e => e.k === "bug" && !e.dead && e.x > G.player.x); if (!e) return null; G.player.x = e.x; G.player.y = e.y - 40; G.player.vy = 3; G.cam = Math.max(0, e.x - 120); return e.x; }); await p.waitForFunction(() => window.__sr.G.ents.some(e => e.k === "bug" && (e.hp < 2 || e.dead)), null, { timeout: 3000 }).catch(() => { });
  s = await st(p); const bugState = await p.evaluate(() => { const G = window.__sr.G; const q = G.player; q.y = 60; q.x -= 80; return G.ents.filter(e => e.k === "bug").map(e => e.hp + (e.dead ? "d" : "")).join(","); });
  ok("S10", "landing on a beetle stomps it (shell cracks: hp 2 → 1) and bounces, no damage", bug !== null && /1|d/.test(bugState) && s.pstate === 1 && !s.dead, `bugs=${bugState}`);
  // checkpoint question → three wrong answers still set the checkpoint
  c = await findTile(p, "K", 100); await put(p, c[0] * T, c[1] * T - 4); await tick(p, 200); for (let i = 0; i < 3; i++) await answer(p, false); await tick(p, 300); s = await st(p);
  ok("S11", "checkpoint flag asks (up to 3 tries) and is set even after wrong answers", s.cp && s.cp.x === c[0] * T && s.qTotal === 4 && s.qRight === 1, `cp=${JSON.stringify(s.cp)}`);
  // death → life lost → respawn at the checkpoint
  await p.evaluate(() => { window.__sr.G.player.y = 400; }); await p.waitForFunction(() => window.__sr.G.lives === 2, null, { timeout: 6000 }); await p.waitForFunction(() => window.__sr.G.state === "play", null, { timeout: 6000 }); s = await st(p);
  ok("S12", "falling costs a life and respawns at the checkpoint with brief invincibility", s.lives === 2 && Math.abs(s.x - c[0] * T) < 2 && s.level === 0, `x=${Math.round(s.x)} cp=${c[0] * T}`);
  // drop through a plank
  c = await findTile(p, "o", 100); let dropped = null; if (c) { await put(p, c[0] * T + 2, c[1] * T - 20); await tick(p, 200); const y0 = (await st(p)).y; await keys(p, { d: true, jumpP: true, jump: true }); await tick(p, 250); await keys(p, { d: false, jump: false }); dropped = (await st(p)).y - y0; }
  ok("S13", "Down + Jump drops through a one-way plank", c && dropped > 12, c ? `fell ${Math.round(dropped)} px` : "no plank in this level");
  // flag → course clear → result posted through the bridge
  c = await findTile(p, "F", 100); await put(p, c[0] * T - 40, 12 * T - 28); await keys(p, { r: true }); await p.waitForSelector("#clear:not([hidden])", { timeout: 15000 }); await keys(p, { r: false }); s = await st(p);
  const res = H.posts().filter(j => j.kind === "result"); const found = await p.textContent("#clear .found");
  ok("S14", "reaching the flag clears the course, unlocks 1-2, adds dates to the basket, posts ONE result (4 questions, 1 right, won)", s.unlocked === 2 && s.basket.includes("dates") && /dates/.test(found) && res.length === 1 && res[0].right === 1 && res[0].total === 4 && res[0].won === true && res[0].skills.length >= 1, `results=${res.length} ${res[0] && JSON.stringify([res[0].right, res[0].total, res[0].won, res[0].badges])}`);
  await p.click("#clear #next"); await p.waitForFunction(() => window.__sr.G.state === "play" && window.__sr.G.level === 1, null, { timeout: 8000 });
  await p.keyboard.press("p"); const paused = await p.$("#pausemenu:not([hidden])"); await p.click("#resume"); await tick(p, 100); s = await st(p);
  ok("S15", "next level starts 1-2; P pauses, Resume continues", !!paused && s.state === "play" && s.level === 1);
  // game over
  await p.evaluate(() => { window.__sr.G.lives = 1; window.__sr.G.player.y = 400; }); await p.waitForSelector("#over:not([hidden])", { timeout: 8000 }); await p.click("#over #tomap"); await p.waitForSelector("#map:not([hidden])");
  ok("S16", "last life lost → GAME OVER → Map keeps the unlocked levels and basket", (await p.$$eval("#map .lvl:not(.lock)", e => e.length)) === 2);
  // performance sample
  await p.click('#map .lvl[data-l="0"]'); await p.waitForFunction(() => window.__sr.G.state === "play", null, { timeout: 8000 }); await keys(p, { r: true, run: true });
  const perf = await p.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const f = now => { t.push(now - last); last = now; if (++n < 120) requestAnimationFrame(f); else { t.sort((a, b) => a - b); res({ p50: +t[60].toFixed(1), p90: +t[108].toFixed(1), max: +t[119].toFixed(1) }); } }; requestAnimationFrame(f); })); await keys(p, { r: false, run: false });
  ok("S17", "frame time while running (headless, no GPU)", perf.p90 < 40, JSON.stringify(perf));
  const skipped = await p.evaluate(() => { const G = window.__sr.G; const qs = G.qBlocks.filter(q => !q.done); if (qs.length < 3) return null; const far = Math.max(...qs.slice(0, 3).map(q => q.tx)) * 16 + 80; const q = G.player; q.x = far; q.y = 12 * 16 - 20; G.cam = far - 120; return qs.length; }); await tick(p, 400); const dead = await p.evaluate(() => window.__sr.G.player.dead);
  ok("S19", "running past three A? blocks without answering costs a life (rule kept)", skipped !== null && dead === true, `open blocks=${skipped}`);
  ok("S18", "no page errors in the desktop run", errs.length === 0, errs.join(" | ").slice(0, 300));
  await p.screenshot({ path: P.shot("shop_after_desktop.png") }); await ctx.close();
}
async function mobile(browser) {
  const dev = devices["Pixel 7 landscape"] || Object.assign({}, devices["Pixel 7"], { viewport: { width: 915, height: 412 } });
  const ctx = await H.context(browser, dev); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await H.open(p); await H.toLevel(p, 0, "man"); await tick(p, 300);
  const vis = await p.$eval("#ctl", e => getComputedStyle(e).display !== "none"); const rot = await p.$eval("#rot", e => getComputedStyle(e).display === "none");
  ok("M01", "Pixel 7 landscape: touch pads shown, no rotate hint", vis && rot);
  const cdp = await ctx.newCDPSession(p); const box = async sel => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const br = await box("#br"), ba = await box("#ba"); const x0 = (await st(p)).x;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [br] }); await tick(p, 500); const moving = await p.evaluate(() => window.__sr.IN.r);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [br, ba] }); await tick(p, 120); const jumped = (await st(p)).vy < 0;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await tick(p, 300); const s = await st(p);
  ok("M02", "touch pads: ▶ moves right, A jumps while ▶ is held (multi-touch)", moving && s.x > x0 + 30 && jumped && !(await p.evaluate(() => window.__sr.IN.r)), `dx=${Math.round(s.x - x0)} jumped=${jumped}`);
  await p.screenshot({ path: P.shot("shop_after_pixel7.png") });
  ok("M03", "no page errors on Pixel 7", errs.length === 0, errs.join(" | ").slice(0, 300)); await ctx.close();
}
async function noSession(browser) {
  const ctx = await H.context(browser, { viewport: { width: 960, height: 540 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  const n0 = H.posts().length; await H.open(p, ""); await H.toLevel(p, 0); const c = await findTile(p, "F", 100); await put(p, c[0] * T - 40, 12 * T - 28); await keys(p, { r: true }); await p.waitForSelector("#clear:not([hidden])", { timeout: 15000 });
  ok("N01", "without a Caravan session the game still plays with the built-in bank and posts nothing", (await st(p)).src === "builtin" && H.posts().length === n0 && errs.length === 0, `posts=${H.posts().length - n0}`); await ctx.close();
}
(async () => { const srv = H.start(); H.posts = () => srv.posts; const browser = await chromium.launch();
  const run = async (id, fn) => { if (filter && !id.includes(filter)) return; try { await fn(browser); } catch (e) { ok(id, "scenario crashed", false, String(e).split("\n")[0].slice(0, 220)); } };
  await run("S", desktop); await run("M", mobile); await run("N", noSession); await browser.close(); srv.close();
  const fails = results.filter(r => !r.pass); console.log(`\n${results.length - fails.length}/${results.length} passed` + (fails.length ? "  FAILED: " + fails.map(f => f.id).join(", ") : "")); process.exit(fails.length ? 1 : 0); })();
