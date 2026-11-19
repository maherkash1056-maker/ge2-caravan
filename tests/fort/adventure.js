#!/usr/bin/env node
// Fort of Taqah — adventure mode (first-person 3D). Real Chromium with software WebGL. Run: node tests/fort/adventure.js [filter]
// Movement checks step the controller deterministically (window.__fortView.tick) so they do not depend on headless frame rate.
const { chromium, devices } = require("playwright");
const P = require("../paths.js"); const H = require("./harness.js");
const filter = process.argv[2] || ""; const results = [];
const ok = (id, name, pass, note) => { results.push({ id, name, pass: !!pass, note }); console.log((pass ? "PASS " : "FAIL ") + id + " " + name + (note ? " — " + note : "")); };
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]; process.on("unhandledRejection", () => { });
const dbg = p => p.evaluate(() => window.__fortView.debug());
const pl = p => p.evaluate(() => window.__fortView.debug().player);
const tick = (p, n, dt = 1 / 60) => p.evaluate(([n, dt]) => window.__fortView.tick(dt, n), [n, dt]);
const inp = (p, o) => p.evaluate(o => Object.assign(window.__fortView.player.input, o), o);
const spawn = (p, x, y, z, yaw = 0) => p.evaluate(([x, y, z, yaw]) => window.__fortView.player.spawn(x, y, z, yaw), [x, y, z, yaw]);
async function toStage(p) { await p.goto("http://127.0.0.1:8899/fort_adventure.html" + H.HASH, { waitUntil: "load" }); await p.click('[data-f="0"]'); await p.click('.fcard[data-h="commander"]'); await p.click("#fsel");
  await p.waitForSelector(".cv-ovl", { timeout: 20000 }); const els = await p.$$(".cv-ovl .cv-w"); for (let i = 0; i < els.length; i++) { await els[i].click(); if (/✓/.test(await p.textContent(".cv-count"))) break; } await p.click(".cv-ovl button");
  for (let k = 0; k < 4; k++) { const b = await p.$(".cv-ovl [data-hq]"); if (!b) break; await b.click(); await p.waitForTimeout(1100); }
  await p.waitForFunction(() => window.__fortView && window.__fortView.debug().mode === "adventure" && window.__fortView.debug().frames > 3, null, { timeout: 20000 }); }

async function desktop(browser) {
  const ctx = await H.context(browser, { viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await toStage(p); let d = await dbg(p);
  ok("A01", "adventure view mounted full-screen with WebGL, player spawned in the courtyard, colliders built", d.mode === "adventure" && d.player.y === 9 && d.colliders > 40 && await p.$eval("#fcv3d", e => e.clientWidth >= 1200 && e.clientHeight >= 700) && await p.$eval("body", b => b.classList.contains("fadv")), `colliders=${d.colliders} calls=${d.calls} tris=${d.triangles}`);
  // gravity: lift the player and let them fall to the ground
  await spawn(p, 0, 12, 10); await tick(p, 120); d = await pl(p);
  ok("A02", "gravity: a player 3 m up falls and lands on the courtyard (grounded, y = 9)", d.grounded && Math.abs(d.y - 9) < 0.01, `y=${d.y} grounded=${d.grounded}`);
  // walking forward (yaw 0 looks toward -z, the sea wall)
  await spawn(p, -3.5, 9, 12, 0); await inp(p, { f: true }); await tick(p, 60); let a = await pl(p); await inp(p, { f: false }); await tick(p, 60); const b = await pl(p);
  ok("A03", "W walks forward with acceleration and stops with friction", a.z < 12 - 2.5 && a.speed > 3.5 && b.speed < 0.3, `after 1 s: z=${a.z} speed=${a.speed}; after stop speed=${b.speed}`);
  await inp(p, { f: true, run: true }); await tick(p, 60); const r = await pl(p); await inp(p, { f: false, run: false }); await tick(p, 30);
  ok("A04", "Shift runs faster than walking", r.speed > a.speed + 1.5, `run=${r.speed} walk=${a.speed}`);
  // strafing follows the yaw
  await spawn(p, -3.5, 9, 12, 0); await inp(p, { r: true }); await tick(p, 60); const s = await pl(p); await inp(p, { r: false });
  ok("A05", "D strafes right (+x) relative to the view", s.x > -1.5 && Math.abs(s.z - 12) < 0.5, `x=${s.x} z=${s.z}`);
  // wall collision: walk into the curtain wall from the courtyard
  await spawn(p, 0, 9, -8, 0); await inp(p, { f: true }); await tick(p, 240); const w = await pl(p); await inp(p, { f: false });
  ok("A06", "player collides with the curtain wall and cannot pass (z stays ≥ -12.15, hitWall)", w.z >= -12.2 && w.z <= -12.0 && w.hitWall && w.y < 9.5, `z=${w.z} y=${w.y} hitWall=${w.hitWall}`);
  // keep wall from inside the courtyard, and entering through the door
  await spawn(p, 8, 9, -8, Math.PI); await inp(p, { f: true }); await tick(p, 180); const k = await pl(p); await inp(p, { f: false });
  ok("A07", "the keep's front wall blocks (z ≤ -3.4) and the roof keeps the player outside", k.z <= -3.3 && k.y < 9.5, `z=${k.z}`);
  await spawn(p, 5, 9, -8, Math.PI); await inp(p, { f: true }); await tick(p, 240); const inside = await pl(p); await inp(p, { f: false });
  ok("A08", "walking through the 2 m doorway enters the keep's reading room", inside.z > -2 && inside.z < 6.5 && inside.y < 9.5, `z=${inside.z} station=${(await dbg(p)).station}`);
  // staircase: climb from the courtyard to the rampart with step-up
  await spawn(p, -14, 9, 6, 0); await inp(p, { f: true }); await tick(p, 420); const top = await pl(p); await inp(p, { f: false }); await tick(p, 30); const top2 = await pl(p);
  ok("A09", "the stone staircase is climbable: W from the courtyard reaches the rampart (y ≈ 17)", top2.y >= 16.9 && top2.grounded, `y=${top2.y} z=${top2.z} grounded=${top2.grounded}`);
  // rampart: the merlons stop the player from walking into the sea; the inner parapet from falling into the courtyard
  await spawn(p, 0, 17, -10, 0); await inp(p, { f: true }); await tick(p, 180); const edge = await pl(p); await inp(p, { f: false });
  ok("A10", "on the rampart the merlons stop the player at the sea side (z ≥ -12.4, still at y 17)", edge.z >= -12.45 && edge.y >= 16.9, `z=${edge.z} y=${edge.y}`);
  await spawn(p, 0, 17, -10, Math.PI); await inp(p, { f: true }); await tick(p, 180); const inner = await pl(p); await inp(p, { f: false });
  ok("A11", "the inner parapet keeps the player on the rampart (no fall into the courtyard)", inner.y >= 16.9 && inner.z <= -8.9, `z=${inner.z} y=${inner.y}`);
  // jump
  await spawn(p, 0, 9, 10, 0); await inp(p, { jump: true }); await tick(p, 12); const up = await pl(p); await inp(p, { jump: false }); await tick(p, 120); const down = await pl(p);
  ok("A12", "Space jumps (leaves the ground) and gravity brings the player back", up.y > 9.4 && !up.grounded && down.grounded && Math.abs(down.y - 9) < 0.01, `peak≥${up.y}`);
  // keyboard events (real key presses) and mouse look via pointer deltas
  await spawn(p, 0, 9, 10, 0); await p.keyboard.down("w"); await p.waitForTimeout(600); await p.keyboard.up("w"); await p.waitForTimeout(100); const kb = await pl(p);
  ok("A13", "real keyboard events drive the controller (W key moves forward in real time)", kb.z < 9.5, `z=${kb.z}`);
  const y0 = (await pl(p)).yaw; await p.evaluate(() => window.__fortView.player.look(200, -50)); const y1 = await pl(p);
  ok("A14", "mouse-look deltas turn the view (yaw) and tilt it (pitch), pitch clamped", y1.yaw < y0 - 0.3 && y1.pitch > 0.05, `yaw ${y0}→${y1.yaw} pitch=${y1.pitch}`);
  await p.evaluate(() => window.__fortView.player.look(0, -5000)); const clamped = (await pl(p)).pitch; ok("A15", "pitch cannot flip over (clamped at ±1.2 rad)", clamped <= 1.2 && clamped >= 1.19, `pitch=${clamped}`);
  // stations: walking up to the reading lectern raises the prompt
  await spawn(p, 5, 9, -1, Math.PI); await inp(p, { f: true }); await tick(p, 90); await inp(p, { f: false }); await p.waitForTimeout(150); d = await dbg(p); const prompt = await p.$eval("#fprompt", e => !e.hidden && e.textContent);
  ok("A16", "near the reading lectern the station prompt appears", d.station === "reading" && /text on the wall/.test(prompt || ""), `station=${d.station}`);
  await spawn(p, 0, 17, -10.5, 0); await p.waitForTimeout(150); d = await dbg(p);
  ok("A17", "standing behind the middle cannon on the rampart selects the cannon station", d.station === "cannon1", `station=${d.station}`);
  // the game rules still run underneath: raiders sail, the view draws them
  d = await dbg(p); ok("A18", "fort.js raiders are drawn as dhows in the bay while exploring", d.ships === 5 && d.sailing >= 4, `ships=${d.ships}`);
  await p.screenshot({ path: P.shot("adv_after_rampart.png") });
  ok("A19", "no page errors (desktop)", errs.length === 0, errs.join(" | ").slice(0, 300)); await ctx.close();
}
async function mobile(browser) {
  const dev = devices["Pixel 7 landscape"] || Object.assign({}, devices["Pixel 7"], { viewport: { width: 915, height: 412 } });
  const ctx = await H.context(browser, dev); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await toStage(p); const d = await dbg(p);
  const ui = await p.evaluate(() => ({ stage: document.querySelector(".fstage").getBoundingClientRect().toJSON(), vp: [innerWidth, innerHeight], fadv: document.body.className, joy: !!document.querySelector("#fjoy"), act: !!document.querySelector("#fact"), joyBox: document.querySelector("#fjoy").getBoundingClientRect().toJSON(), cv: document.querySelector("#fcv3d").getBoundingClientRect().toJSON() }));
  ok("M01", "Pixel 7 landscape: touch mode, virtual joystick + action button present, 3D canvas fills the screen", d.player.touch && ui.joy && ui.act && ui.cv.width >= ui.vp[0] - 2 && ui.cv.height >= ui.vp[1] - 2, `dpr=${d.pixelRatio} canvas=${Math.round(ui.cv.width)}x${Math.round(ui.cv.height)} stage=${JSON.stringify(ui.stage)} vp=${ui.vp} body=${ui.fadv}`);
  const cdp = await ctx.newCDPSession(p); const jc = { x: ui.joyBox.x + ui.joyBox.width / 2, y: ui.joyBox.y + ui.joyBox.height / 2 };
  await spawn(p, 0, 9, 10, 0); await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: jc.x, y: jc.y, id: 1 }] }); await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: jc.x, y: jc.y - 50, id: 1 }] });
  const stick = await p.evaluate(() => ({ ...window.__fortView.player.stick })); await tick(p, 60); const m = await pl(p); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); const stick2 = await p.evaluate(() => ({ ...window.__fortView.player.stick }));
  ok("M02", "joystick drag forward moves the player, release recentres", stick.y > 0.5 && m.z < 8 && stick2.y === 0, `stick=${JSON.stringify(stick)} z=${m.z}`);
  const yaw0 = (await pl(p)).yaw; const lx = ui.cv.width * 0.75, ly = ui.cv.height * 0.3;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: lx, y: ly, id: 2 }] }); for (let i = 1; i <= 5; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: lx - i * 20, y: ly, id: 2 }] }); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const yaw1 = (await pl(p)).yaw; ok("M03", "dragging on the right half of the screen looks around", yaw1 > yaw0 + 0.2, `yaw ${yaw0}→${yaw1}`);
  await p.screenshot({ path: P.shot("adv_after_pixel7.png") });
  ok("M04", "no page errors (Pixel 7)", errs.length === 0, errs.join(" | ").slice(0, 300)); await ctx.close();
}
async function fallback() {
  const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] }); const ctx = await H.context(browser, { viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8899/fort_adventure.html" + H.HASH, { waitUntil: "load" }); await p.click('[data-f="0"]'); await p.click('.fcard[data-h="commander"]'); await p.click("#fsel"); await p.waitForSelector(".cv-ovl", { timeout: 20000 });
  const els = await p.$$(".cv-ovl .cv-w"); for (let i = 0; i < els.length; i++) { await els[i].click(); if (/✓/.test(await p.textContent(".cv-count"))) break; } await p.click(".cv-ovl button"); for (let k = 0; k < 4; k++) { const b = await p.$(".cv-ovl [data-hq]"); if (!b) break; await b.click(); await p.waitForTimeout(1100); }
  await p.waitForSelector("#fqcard"); await p.waitForTimeout(500); const s = await p.evaluate(() => ({ view: !!F.view, adv: document.body.classList.contains("fadv"), raiders: F.raiders.length }));
  ok("N01", "without WebGL the adventure page falls back to the classic 2D fort (same rules, no errors)", !s.view && !s.adv && s.raiders === 5 && errs.length === 0, errs.join("|").slice(0, 200)); await ctx.close(); await browser.close();
}
(async () => { const srv = H.start(); const browser = await chromium.launch({ args: GL });
  const run = async (id, fn) => { if (filter && !id.includes(filter)) return; try { await fn(browser); } catch (e) { ok(id, "scenario crashed", false, String(e).split("\n")[0].slice(0, 220)); } };
  await run("A", desktop); await run("M", mobile); await run("N", fallback); await browser.close(); srv.close();
  const fails = results.filter(r => !r.pass); console.log(`\n${results.length - fails.length}/${results.length} passed` + (fails.length ? "  FAILED: " + fails.map(f => f.id).join(", ") : "")); process.exit(fails.length ? 1 : 0); })();
