#!/usr/bin/env node
// Fort of Taqah acceptance tests (3D view + unchanged rules). Real Chromium via Playwright, software WebGL.
// Run: node tests/fort/acceptance.js [filter]      (filter = substring of a scenario id, e.g. F03)
const { chromium, devices } = require("playwright");
const P = require("../paths.js"); const H = require("./harness.js");
const filter = process.argv[2] || "";
const results = []; const ok = (id, name, pass, note) => { results.push({ id, name, pass: !!pass, note }); console.log((pass ? "PASS " : "FAIL ") + id + " " + name + (note ? " — " + note : "")); };
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
process.on("unhandledRejection", () => { });

async function answerCurrent(p, correct) { return p.evaluate(c => { const r = F.cur; const a = c ? r.q.a : (r.q.a + 1) % 3; const btn = document.querySelector('#fopts [data-a="' + a + '"]'); btn.click(); return { n: r.n, a }; }, correct); }
const dbg = p => p.evaluate(() => window.__fortView ? window.__fortView.debug() : null);
const state = p => p.evaluate(() => ({ stage: !!document.querySelector(".fstage"), wall: F.wall, coins: F.coins, wave: F.wave, over: F.over, combo: F.combo, shield: F.shield, raiders: F.raiders.map(r => ({ n: r.n, x: +r.x.toFixed(3), gone: r.gone })), cur: F.cur && F.cur.n, shots: F.shots.length, view: !!F.view, is3d: !!document.querySelector(".fstage.is3d") }));

async function scenarioDesktop(browser) {
  const ctx = await H.context(browser, { viewport: { width: 1366, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await H.toStage(p); await p.waitForTimeout(600);
  let s = await state(p), d = await dbg(p);
  ok("F01", "3D view mounted on the stage (WebGL canvas #fcv3d, 2D canvas hidden)", s.view && s.is3d && d && d.ships === 5 && await p.$eval("#fcv3d", e => e.clientWidth > 100 && e.clientHeight > 100) && await p.$eval("#fcv", e => getComputedStyle(e).visibility === "hidden"), `ships=${d && d.ships} calls=${d && d.calls} tris=${d && d.triangles}`);
  ok("F02", "wave 1 has 5 raiders sailing, one highlighted as current", s.raiders.length === 5 && s.raiders.every(r => !r.gone) && s.cur === 1 && d.sailing === 5);
  // correct answer → cannon shot → raider sinks (rules in fort.js untouched)
  const a1 = await answerCurrent(p, true); await p.waitForTimeout(150); const d1 = await dbg(p); s = await state(p);
  ok("F03", "correct answer fires a cannonball at raider " + a1.n + " and marks it gone", d1.fx.fired >= 1 && s.raiders[0].gone && s.coins === 50 && s.combo === 1, `fired=${d1.fx.fired} coins=${s.coins}`);
  await p.waitForTimeout(900); const d2 = await dbg(p);
  ok("F04", "cannonball lands: splash effect played and the dhow is sinking", d2.fx.splashes >= 1 && (d2.sinking >= 1 || d2.done >= 1), `splashes=${d2.fx.splashes} sinking=${d2.sinking} done=${d2.done}`);
  // wrong answer → wall damage → wall flash + shake + cracks
  const wallBefore = s.wall; await answerCurrent(p, false); await p.waitForTimeout(200); s = await state(p); const d3 = await dbg(p);
  ok("F05", "wrong answer damages the wall (commander −18) and the view plays the wall hit", s.wall === wallBefore - 18 && d3.fx.wallHits === 1 && s.combo === 0, `wall=${s.wall} hits=${d3.fx.wallHits}`);
  const cracks = await p.evaluate(() => { let n = 0; window.__fortView.fs.scene.traverse(o => { if (o.name === "Crack") n++; }); return n; });
  ok("F06", "wall damage shows as cracks on the 3D wall", cracks === 1, `cracks=${cracks}`);
  // keyboard answers
  const curQ = await p.evaluate(() => F.cur.q.a); const key = ["t", "f", "n"][curQ]; await p.keyboard.press(key); await p.waitForTimeout(150); s = await state(p);
  ok("F07", "keyboard T/F/N answers the current raider (pressed " + key.toUpperCase() + ")", s.raiders.filter(r => r.gone).length === 3 && s.coins === 100, `gone=${s.raiders.filter(r => r.gone).length} coins=${s.coins}`);
  // raider reaching the wall (fast-forward its x) → damage + crash animation
  await p.evaluate(() => { const r = F.raiders.find(r => !r.gone); r.x = 0.001; }); await p.waitForTimeout(400); s = await state(p); const d4 = await dbg(p);
  ok("F08", "a raider reaching the wall damages it and crashes (no sink delay)", s.wall === wallBefore - 36 && d4.fx.wallHits === 2 && s.raiders.filter(r => r.gone).length === 4, `wall=${s.wall}`);
  // finish the wave → shop
  await answerCurrent(p, true); await p.waitForTimeout(300);
  const shop = await p.$(".qov [data-it]"); ok("F09", "wave cleared → fort shop overlay opens", !!shop && (await state(p)).wave === 1);
  await p.click('.qov [data-it="falaj"]'); await p.click(".qov [data-go]"); await p.waitForTimeout(500); s = await state(p); const d5 = await dbg(p);
  ok("F10", "shop purchase + next wave: new wave of 5 raiders replaces the sunk dhows in 3D", s.wave === 1 && s.raiders.length === 5 && s.raiders.every(r => !r.gone) && d5.ships === 5 && d5.sailing === 5 && s.coins === 100, `ships=${d5.ships} coins=${s.coins}`);
  // orbit camera with a mouse drag on the canvas
  const box = await p.$eval("#fcv3d", e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(box.x + box.w * 0.6, box.y + box.h * 0.5); await p.mouse.down(); await p.mouse.move(box.x + box.w * 0.4, box.y + box.h * 0.5, { steps: 6 }); await p.waitForTimeout(100); const d6 = await dbg(p); await p.mouse.up();
  ok("F11", "dragging on the 3D stage orbits the camera (yaw changes) and does not answer a question", d6.cameraYaw !== 0 && (await state(p)).raiders.every(r => !r.gone), `yaw=${d6.cameraYaw}`);
  // play through to the end (correct answers) → result posted via the bridge, 3D view disposed
  for (let guard = 0; guard < 20; guard++) { s = await state(p); if (s.over) break; if (await p.$(".qov [data-go]")) { await p.click(".qov [data-go]"); await p.waitForTimeout(300); continue; } if (s.cur) { await answerCurrent(p, true); await p.waitForTimeout(120); } else await p.waitForTimeout(200); }
  await p.waitForTimeout(800); const end = await p.textContent("#app"); const res = (srvPosts()).filter(j => j.kind === "result");
  ok("F12", "all waves held → Keeper of Taqah, result reported through the bridge hook, 3D canvas removed", /Keeper of Taqah/.test(end) && res.length === 1 && res[0].won === true && !(await p.$("#fcv3d")), `results=${res.length} right=${res[0] && res[0].right}/${res[0] && res[0].total}`);
  ok("F13", "no page errors during the desktop run", errs.length === 0, errs.join(" | ").slice(0, 300));
  await ctx.close();
}
let srvPosts = () => [];

async function scenarioMobile(browser) {
  const ctx = await H.context(browser, devices["Pixel 7"]); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await H.toStage(p); await p.waitForTimeout(600); const s = await state(p), d = await dbg(p);
  const layout = await p.evaluate(() => { const st = document.querySelector(".fstage").getBoundingClientRect(), b = document.querySelector("#fopts").getBoundingClientRect(); return { stageW: st.width, stageH: st.height, winW: innerWidth, btnTop: b.top, docW: document.documentElement.scrollWidth }; });
  ok("M01", "Pixel 7: 3D view mounted, stage fits the viewport width, no horizontal overflow", s.view && d.ships === 5 && layout.stageW <= layout.winW && layout.docW <= layout.winW + 1 && d.pixelRatio <= 1.5, `stage=${Math.round(layout.stageW)}x${Math.round(layout.stageH)} dpr=${d.pixelRatio}`);
  // touch: tap the answer button answers; one-finger drag on the stage orbits
  const ans = await p.evaluate(() => F.cur.q.a); await p.tap('#fopts [data-a="' + ans + '"]'); await p.waitForTimeout(150);
  ok("M02", "tap on TRUE/FALSE/NOT GIVEN answers (touch)", (await state(p)).raiders[0].gone);
  const box = await p.$eval("#fcv3d", e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const cdp = await ctx.newCDPSession(p); const tp = (x, y) => [{ x: Math.round(x), y: Math.round(y) }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(box.x + box.w * 0.7, box.y + box.h * 0.5) });
  for (let i = 1; i <= 5; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(box.x + box.w * (0.7 - 0.06 * i), box.y + box.h * 0.5) });
  await p.waitForTimeout(80); const d2 = await dbg(p); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  ok("M03", "one-finger drag on the stage orbits the camera", d2.cameraYaw !== 0, `yaw=${d2.cameraYaw}`);
  await p.waitForTimeout(3500); const d3 = await dbg(p);
  ok("M04", "camera drifts back toward the rest pose after release", Math.abs(d3.cameraYaw) < Math.abs(d2.cameraYaw), `yaw ${d2.cameraYaw} → ${d3.cameraYaw}`);
  ok("M05", "no page errors on Pixel 7", errs.length === 0, errs.join(" | ").slice(0, 300));
  await ctx.close();
}

async function scenarioNoWebGL() {
  const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] });
  const ctx = await H.context(browser, { viewport: { width: 1366, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await H.toStage(p); await p.waitForTimeout(600); const s = await state(p);
  const avail = await p.evaluate(() => window.FortView3D && FortView3D.available());
  ok("N01", "without WebGL the painted 2D canvas is used (FortView3D.available() false, F.view null)", avail === false && !s.view && !s.is3d && !(await p.$("#fcv3d")) && await p.$eval("#fcv", e => getComputedStyle(e).visibility === "visible"));
  await answerCurrent(p, true); await p.waitForTimeout(150); const s2 = await state(p);
  ok("N02", "2D fallback still plays: answer → raider gone, shot drawn, coins", s2.raiders[0].gone && s2.coins === 50 && s2.shots >= 1 && errs.length === 0, errs.join("|").slice(0, 200));
  const out = P.shot("fort_nowebgl_desktop.png"); await p.screenshot({ path: out }); console.log("  screenshot", out);
  await ctx.close(); await browser.close();
}

(async () => {
  const srv = H.start(); srvPosts = () => srv.posts; const browser = await chromium.launch({ args: GL });
  const run = async (id, fn) => { if (filter && !id.includes(filter)) return; try { await fn(); } catch (e) { ok(id, "scenario crashed", false, String(e).split("\n")[0].slice(0, 200)); } };
  await run("F", () => scenarioDesktop(browser)); await run("M", () => scenarioMobile(browser)); await run("N", scenarioNoWebGL);
  await browser.close(); srv.close();
  const fails = results.filter(r => !r.pass); console.log(`\n${results.length - fails.length}/${results.length} passed` + (fails.length ? "  FAILED: " + fails.map(f => f.id).join(", ") : ""));
  process.exit(fails.length ? 1 : 0);
})();
