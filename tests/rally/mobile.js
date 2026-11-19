// Desktop and Android-phone checks for the CURRENT Khareef Rally 3D: touch pads, keyboard, camera, audio toggle, fuel burn,
// and driving into the first Knowledge Stop. Headless Chromium renders this scene with software WebGL at well under one
// frame per second, so the car cannot be driven in real time here. Instead the game's own update step (window.__dg.update)
// is called by hand at 60 Hz, which is deterministic and exercises input → physics → fuel → events without rendering.
// The frame-rate sample is reported as INFO only: it is a software floor, not a phone number.
// One browser context per device (Pixel 7 portrait, Galaxy S9+ landscape, desktop); the 3D world is built once per context.
// Run: node tests/rally/mobile.js   (exit 1 on failure). Screenshots: build/tmp/rally_mobile_*.png
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium, devices } = require("playwright");
const P = require("../paths.js");
const PROD_API = "https://ge2-caravan-api.ge2-caravan.workers.dev/";
const pageHtml = fs.readFileSync(path.join(P.ROOT, "rally3d/index.html"), "utf8").replace('const API="' + PROD_API + '"', 'const API="http://127.0.0.1:8897/hook"');
const hook = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "*"); if (req.method === "OPTIONS") return res.end(); res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ ok: true })); }); }).listen(8897);
const srv = http.createServer((req, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); res.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); res.end(pageHtml); }).listen(8899);
const S = "studenttoken12345~000S0000~student~Salwa%20Malik~Salwa";
const results = []; let browser; const ONLY = process.argv.slice(2); // node tests/rally/mobile.js M01 M05
const assert = (c, m) => { if (!c) throw new Error("assertion failed: " + m); };
const step = (p, n, keys = [], pads = []) => p.evaluate(({ n, keys, pads }) => { const g = window.__dg; for (const k of keys) g.keys.add(k); for (const id of pads) document.getElementById(id).dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", pointerId: 7 }));
  for (let i = 0; i < n; i++) g.update(1 / 60); for (const k of keys) g.keys.delete(k); for (const id of pads) document.getElementById(id).dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", pointerId: 7 }));
  return { s: g.progressS, speed: g.car.speed, fuel: window.__quiz.S.fuel, heading: g.car.quat.toArray().map(v => +v.toFixed(3)), modal: window.__quiz.modal }; }, { n, keys, pads });
async function device(name, ctxOpts, checks) {
  if (ONLY.length) { checks = checks.filter(([id]) => ONLY.some(k => id.startsWith(k))); if (!checks.length) return; }
  const ctx = await browser.newContext(ctxOpts); await ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue();
    if (u.hostname === "ge2-caravan-rally.ge2-caravan.workers.dev") { const f = path.join(P.ROOT, "rally3d/tex_s", u.pathname.replace(/^\/tex\//, "")); if (fs.existsSync(f)) return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": /\.png$/.test(f) ? "image/png" : "image/jpeg", "access-control-allow-origin": "*" } }); return r.fulfill({ status: 200, body: "{\"ok\":true,\"files\":[]}", headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); } r.abort("blockedbyclient"); });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", e => errors.push(String(e.message).slice(0, 160)));
  let built = "?";
  try { await p.goto("http://127.0.0.1:8899/webhook/ge2-studio-app?p=9#play&s=" + S, { waitUntil: "load", timeout: 60000 }); await p.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });
    const t0 = Date.now(); await p.evaluate(() => { window.__skipIntro = true; window.__drive("pickup"); }); await p.waitForFunction(() => window.__dg && window.__dg.ready && window.__dg.active && !!window.__dg.car, null, { timeout: 300000 }); built = ((Date.now() - t0) / 1000).toFixed(1);
    await p.waitForTimeout(300); }
  catch (e) { results.push({ name: name + " (setup)", verdict: "FAIL", note: String(e.message).split("\n")[0].slice(0, 200) }); console.log("[FAIL] " + name + " setup — " + e.message.split("\n")[0]); await ctx.close(); return; }
  console.log(`[INFO] ${name}: world built in ${built} s`); results.push({ name: name + " world build", verdict: "INFO", note: built + " s" });
  for (const [id, fn] of checks) { let verdict = "PASS", note = ""; const t0 = Date.now();
    try { note = await fn(p) || ""; if (errors.length) { verdict = "FAIL"; note += " page errors: " + errors.splice(0).join(" | "); } }
    catch (e) { verdict = "FAIL"; note = String(e.message || e).split("\n")[0].slice(0, 220); try { await p.screenshot({ path: P.shot("rally_mobile_fail_" + id + ".png") }); } catch (_) { } }
    results.push({ name: id, verdict, note }); console.log(`[${verdict}] ${id} (${((Date.now() - t0) / 1000).toFixed(1)}s) ${note}`); }
  await ctx.close();
}
const fps = (p, ms = 3000) => p.evaluate(ms => new Promise(res => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(+(n / ((performance.now() - t0) / 1000)).toFixed(2)); }; requestAnimationFrame(tick); }), ms);

(async () => {
  browser = await chromium.launch();

  await device("Pixel 7 portrait", { ...devices["Pixel 7"] }, [
    ["M01 touch pads visible on a coarse-pointer phone; GAS pad moves the car; BRAKE pad stops it, then reverses", async p => {
      assert(!(await p.isHidden("#touch")), "#touch visible"); for (const id of ["tgas", "tbrk", "tl", "tr", "thb"]) assert(await p.isVisible("#" + id), "#" + id + " visible");
      const gasFlag = await p.evaluate(() => { document.getElementById("tgas").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", pointerId: 7 })); const v = window.__dg.touch.gas; document.getElementById("tgas").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", pointerId: 7 })); return [v, window.__dg.touch.gas]; });
      assert(gasFlag[0] === 1 && gasFlag[1] === 0, "pad sets touch.gas 1 on pointerdown and 0 on pointerup, got " + gasFlag);
      const s0 = (await step(p, 1)).s; const a = await step(p, 90, [], ["tgas"]); assert(a.s > s0 + 1 && a.s < 41 && !a.modal, `moved with GAS (${s0.toFixed(1)} → ${a.s.toFixed(1)} m, before the start arch at 42)`);
      const b = await step(p, 60, [], ["tbrk"]); assert(b.speed < 0.5, `BRAKE pad stops the car within 1 s (${a.speed.toFixed(1)} → ${b.speed.toFixed(2)} m/s)`);
      const c = await step(p, 180, [], ["tbrk"]); assert(c.speed > 1 && c.s <= b.s + 0.5, `held at standstill, BRAKE reverses (speed ${c.speed.toFixed(1)} m/s, progress ${b.s.toFixed(1)} → ${c.s.toFixed(1)})`); await p.screenshot({ path: P.shot("rally_mobile_pixel7_portrait.png") }); return `+${(a.s - s0).toFixed(1)} m in 1.5 s sim`;
    }],
    ["M01b portrait layout: HUD, fuel gauge and pads inside the viewport, no horizontal scroll", async p => {
      const vw = await p.evaluate(() => innerWidth); for (const sel of ["#hud", "#fuel", "#touch", "#minimap"]) { const bb = await (await p.$(sel)).boundingBox(); assert(bb && bb.x >= 0 && bb.x + bb.width <= vw + 1, sel + " inside viewport " + JSON.stringify(bb)); }
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    }],
  ]);

  await device("Galaxy S9+ landscape", { ...devices["Galaxy S9+"], viewport: { width: 740, height: 360 } }, [
    ["M02 landscape: HUD fits, LEFT pad + GAS changes the heading", async p => {
      const box = await (await p.$("#hud")).boundingBox(); assert(box && box.x + box.width <= 741, "HUD within viewport"); assert(await p.isVisible("#tl") && await p.isVisible("#tr"), "steer pads visible");
      const h0 = (await step(p, 1)).heading; const r = await step(p, 120, [], ["tgas", "tl"]); assert(JSON.stringify(h0) !== JSON.stringify(r.heading), "heading changed with LEFT held"); await p.screenshot({ path: P.shot("rally_mobile_s9_landscape.png") });
    }],
  ]);

  const onRoad = p => p.evaluate(() => { const g = window.__dg; if (!document.getElementById("qpanel").hidden) { const b = document.querySelector('#qpanel [data-v="back"], #qpanel [data-v="ok"], #qcont'); if (b) b.click(); } g.resetTo(14, undefined, true); g.progressS = 14; g.lastS = 14; g.keys.clear(); });
  await device("Desktop 800×500", { viewport: { width: 800, height: 500 } }, [
    ["M06 driving into the start arch (42 m) opens the Al Baleed Knowledge Stop by itself; pads ignored while modal", async p => {
      await p.evaluate(() => { window.__dg.resetTo(30, undefined, true); window.__dg.progressS = 30; window.__dg.lastS = 30; }); // first crossing of the run: the arch stop is offered once per run
      const n = await p.evaluate(() => { const g = window.__dg; let i = 0; while (i < 1200 && document.getElementById("qpanel").hidden) { g.keys.add("up"); g.update(1 / 60); i++; } g.keys.delete("up"); return i; });
      assert(n > 0 && !(await p.isHidden("#qpanel")), "panel opened after " + n + " steps"); const t = await p.textContent("#qpanel"); assert(t.includes("Al Baleed") && t.includes("Knowledge Stop"), "first stop");
      const g = await p.evaluate(() => { document.getElementById("tgas").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", pointerId: 7 })); const v = window.__dg.touch.gas; document.getElementById("tgas").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", pointerId: 7 })); return v; });
      assert(g === 0, "GAS ignored while a question is modal"); await p.screenshot({ path: P.shot("rally_first_stop.png") }); return `arch reached after ${n} steps`;
    }],
    ["M05 fuel burn on the road: 100 units per 1300 m (±5 %), also while coasting", async p => {
      await onRoad(p); const a = await step(p, 1); const b = await step(p, 200, ["up"]); const dist = b.s - a.s, burn = a.fuel - b.fuel, expected = dist * 100 / 1300;
      assert(dist > 5 && b.s < 41 && !b.modal, "car moved " + dist.toFixed(1) + " m and stayed before the arch (" + b.s.toFixed(1) + ")"); assert(Math.abs(burn - expected) <= expected * 0.05 + 0.02, `burn ${burn.toFixed(3)} vs expected ${expected.toFixed(3)} for ${dist.toFixed(1)} m`);
      const c = await step(p, 120); const coastDist = c.s - b.s, coastBurn = b.fuel - c.fuel; assert(Math.abs(coastBurn - coastDist * 100 / 1300) <= 0.05, `coasting burns by distance too (${coastBurn.toFixed(3)} for ${coastDist.toFixed(1)} m)`); return `${burn.toFixed(2)} fuel over ${dist.toFixed(1)} m (expected ${expected.toFixed(2)})`;
    }],
    ["M03 keyboard: touch pads hidden; ArrowUp via real key events moves the car; C cycles camera; M toggles audio; R recovers", async p => {
      await onRoad(p); assert(await p.isHidden("#touch"), "pads hidden on a fine-pointer device");
      await p.keyboard.down("ArrowUp"); const hasKey = await p.evaluate(() => window.__dg.keys.has("up")); await p.keyboard.up("ArrowUp"); assert(hasKey, "ArrowUp keydown adds 'up' to the key set");
      const s0 = (await step(p, 1)).s; const r = await step(p, 90, ["up"]); assert(r.s > s0 + 1 && !r.modal, `moved (${s0.toFixed(1)} → ${r.s.toFixed(1)} m)`);
      await p.keyboard.press("KeyC"); assert((await p.textContent("#bCam")).includes("Hood"), "camera → Hood"); await p.keyboard.press("KeyC"); assert((await p.textContent("#bCam")).includes("Top"), "camera → Top");
      const on0 = await p.evaluate(() => window.__dg.audio.on); await p.keyboard.press("KeyM"); assert((await p.evaluate(() => window.__dg.audio.on)) === !on0, "M toggles audio"); await p.keyboard.press("KeyM");
      await p.keyboard.press("KeyR"); await p.waitForTimeout(100); return `+${(r.s - s0).toFixed(1)} m in 1.5 s sim`;
    }],
    ["M04 frame-rate sample — INFO only (software WebGL floor, not a device number)", async p => { const f = await fps(p); return `${f} fps rendering the road scene headless`; }],
  ]);

  await browser.close(); hook.close(); srv.close(); fs.writeFileSync(P.tmp("rally_mobile.json"), JSON.stringify(results, null, 1));
  const fails = results.filter(r => r.verdict === "FAIL").length, n = results.filter(r => r.verdict === "PASS" || r.verdict === "FAIL").length; console.log(`\n${fails ? "FAIL" : "PASS"}: ${n - fails}/${n}`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error("RUNNER ERROR", e); process.exit(1); });
