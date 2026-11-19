// Tests for the Khareef Rally graphics layer (caravan/rally/src/perf.js, built into rally3d/index.html by build_page.js).
// Same harness as acceptance.js: stub class server on :8897, page on :8899 under n8n's sandbox CSP, textures from rally3d/tex_s.
// Run: node tests/rally/gfx.js   (exit 1 on failure)
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const P = require("../paths.js");
const PROD_API = "https://ge2-caravan-api.ge2-caravan.workers.dev/";
const pageHtml = fs.readFileSync(path.join(P.ROOT, "rally3d/index.html"), "utf8").replace('const API="' + PROD_API + '"', 'const API="http://127.0.0.1:8897/hook"');
if (!pageHtml.includes("GFX LAYER")) { console.error("rally3d/index.html has no graphics layer — run node caravan/rally/build_page.js"); process.exit(1); }
const hook = http.createServer((q, r) => { r.setHeader("access-control-allow-origin", "*"); r.setHeader("access-control-allow-headers", "*"); if (q.method === "OPTIONS") return r.end(); r.setHeader("content-type", "application/json"); r.end('{"ok":true}'); }).listen(8897);
const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(pageHtml); }).listen(8899);
const S = "studenttoken12345~000S0000~student~Salwa%20Malik~Salwa";
const ONLY = process.argv.slice(2); const results = []; const assert = (c, m) => { if (!c) throw new Error("assertion failed: " + m); };
const route = ctx => ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue(); if (u.hostname === "ge2-caravan-rally.ge2-caravan.workers.dev") { const f = path.join(P.ROOT, "rally3d/tex_s", u.pathname.replace(/^\/tex\//, "")); if (fs.existsSync(f)) return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": /\.png$/.test(f) ? "image/png" : "image/jpeg", "access-control-allow-origin": "*" } }); return r.fulfill({ status: 200, body: '{"ok":true,"files":[]}', headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); } r.abort("blockedbyclient"); });
async function scenario(name, hash, fn, launchArgs) {
  if (ONLY.length && !ONLY.some(k => name.startsWith(k))) return;
  const browser = await chromium.launch(launchArgs ? { args: launchArgs } : {}); const ctx = await browser.newContext({ viewport: { width: 800, height: 500 } }); await route(ctx);
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", e => errors.push(String(e.message).slice(0, 160))); const t0 = Date.now(); let verdict = "PASS", note = "";
  try { await p.goto("http://127.0.0.1:8899/webhook/ge2-studio-app?p=9#play&s=" + S + hash, { waitUntil: "load", timeout: 60000 }); note = (await fn(p, errors)) || ""; }
  catch (e) { verdict = "FAIL"; note = String(e.message || e).split("\n")[0].slice(0, 220); try { await p.screenshot({ path: P.shot("gfx_fail_" + name.slice(0, 3) + ".png") }); } catch (_) { } }
  results.push({ name, verdict, note }); console.log(`[${verdict}] ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s) ${note}`); await browser.close();
}
const applied = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__gfx.applied)));
async function world(p) { await p.waitForFunction(() => window.__ready === true, null, { timeout: 90000 }); await p.evaluate(() => { window.__skipIntro = true; window.__drive("pickup"); }); await p.waitForFunction(() => window.__gfx && window.__gfx.applied && window.__dg && window.__dg.active, null, { timeout: 300000 }); }

(async () => {
  await scenario("G01 default: layer present before the module, auto tier applied after the world builds, button + G key + F overlay, no page error", "", async (p, errors) => {
    assert(await p.evaluate(() => typeof window.__GFX === "object" && typeof window.__GFX.pixelRatio === "function"), "__GFX hooks exist for the bundle");
    await world(p); const a = await applied(p); const startTier = await p.evaluate(() => window.__gfx.start); assert(["high", "medium"].includes(startTier), "auto start tier high or medium, got " + startTier); assert(await p.evaluate(() => window.__gfx.auto === true), "auto mode");
    assert(await p.evaluate(() => window.__dg.renderer.getPixelRatio() <= 1.5), "pixel ratio capped at 1.5 on desktop");
    assert(await p.isVisible("#bGfx"), "Graphics button in the HUD"); const txt = await p.textContent("#bGfx"); assert(/Graphics: Auto · (Ultra|High|Medium|Low|Minimal)/.test(txt), "button text: " + txt); // headless frames are seconds long, so auto may already have stepped down
    await p.keyboard.press("KeyG"); const b = await applied(p); assert(b.tier !== a.tier, "G cycles the tier"); assert(await p.evaluate(() => window.__gfx.auto === false), "manual after G");
    await p.keyboard.press("KeyF"); assert(await p.isVisible("#gfxstats"), "F shows the stats overlay"); await p.keyboard.press("KeyF"); assert(await p.isHidden("#gfxstats"), "F hides it");
    assert(errors.length === 0, "page errors: " + errors.join(" | ")); await p.screenshot({ path: P.shot("gfx_default.png") }); return "start " + a.tier + " → G → " + b.tier;
  });
  await scenario("G02 #gfx=low: pixel ratio 1, 512 shadow map every 2nd frame, 4 cars, 40 % scenery distance, far plane follows fog", "&gfx=low", async p => {
    await world(p); const a = await applied(p); assert(a.tier === "low" && !(await p.evaluate(() => window.__gfx.auto)), "tier low, manual");
    const s = await p.evaluate(() => { const g = window.__dg; return { pr: g.renderer.getPixelRatio(), shadow: g.sun.shadow.mapSize.x, enabled: g.renderer.shadowMap.enabled, autoUpdate: g.renderer.shadowMap.autoUpdate, traffic: g.traffic.length, visibleCars: g.traffic.filter(c => c.v.root.visible).length, far: g.camera.far, aa: g.renderer.getContext().getContextAttributes().antialias, maxDist: Math.max(...g.world.scatter.tiles.map(t => t.maxDist)), baseMaxDist: window.__gfx.base.maxDist }; });
    assert(s.pr === 1, "pixel ratio 1, got " + s.pr); assert(s.shadow === 512 && s.enabled && s.autoUpdate === false, "512 shadow map, manual update: " + JSON.stringify(s)); assert(s.traffic === 4 && s.visibleCars === 4, "4 cars"); assert(s.far < 3000, "far plane reduced: " + s.far); assert(Math.abs(s.maxDist - s.baseMaxDist * 0.4) < 1, "scenery distance scaled to 40 %: " + s.maxDist + " of " + s.baseMaxDist); assert(s.aa === false, "no MSAA on low");
    await p.screenshot({ path: P.shot("gfx_low.png") }); return JSON.stringify(s);
  });
  await scenario("G03 #gfx=minimal: shadows off, 2 cars, pixel ratio 0.75; the game still plays (knowledge stop opens, questions work)", "&gfx=minimal", async p => {
    await world(p); const s = await p.evaluate(() => { const g = window.__dg; return { tier: window.__gfx.tier, pr: g.renderer.getPixelRatio(), enabled: g.renderer.shadowMap.enabled, sunShadow: g.sun.castShadow, traffic: g.traffic.length }; });
    assert(s.tier === "minimal" && s.enabled === false && s.sunShadow === false && s.traffic === 2 && s.pr === 0.75, JSON.stringify(s));
    const n = await p.evaluate(() => { const g = window.__dg; g.resetTo(30, undefined, true); g.progressS = 30; g.lastS = 30; let i = 0; while (i < 1200 && document.getElementById("qpanel").hidden) { g.keys.add("up"); g.update(1 / 60); i++; } g.keys.delete("up"); return i; });
    assert(n > 0 && n < 1200, "drove into the start arch (" + n + " steps)"); await p.click('#qpanel [data-v="go"]'); await p.waitForSelector("#qpanel .qopt", { timeout: 10000 }); await p.click('#qpanel .qopt[data-i="1"]'); await p.waitForSelector("#qcont", { timeout: 5000 });
    assert(await p.$eval("#qpanel .qtitle", e => e.classList.contains("ok")), "first Al Baleed answer judged correct on minimal"); await p.screenshot({ path: P.shot("gfx_minimal_stop.png") }); return "arch after " + n + " steps";
  });
  await scenario("G04 adaptive: sustained slow frames step the tier down; the log records why", "", async p => {
    await world(p); const before = await p.evaluate(() => window.__gfx.tier);
    // render in a tight loop: each frame costs tens of ms in headless → EMA > 24 ms → step down after 2.5 s
    const after = await p.evaluate(() => new Promise(res => { const g = window.__dg; let i = 0; const t0 = performance.now(); (function loop() { g.render(); i++; if (performance.now() - t0 < 9000 && window.__gfx.tier === "__never__") return; if (performance.now() - t0 < 9000) setTimeout(loop, 0); else res({ tier: window.__gfx.tier, frames: i, ms: window.__gfx.stats.ms, log: window.__gfx.log.slice(-3) }); })(); }));
    const order = ["minimal", "low", "medium", "high", "ultra"]; assert(order.indexOf(after.tier) < order.indexOf(before), `stepped down from ${before} to ${after.tier} (ema ${after.ms} ms, ${after.frames} frames)`); assert(after.log.some(l => /frame time/.test(l)), "log explains: " + after.log.join(" / "));
    return `${before} → ${after.tier} after ${after.frames} frames at ${after.ms} ms`;
  });
  await scenario("G05 no WebGL: a clear message is shown instead of a blank page", "", async p => {
    await p.waitForSelector("#nowebgl", { timeout: 20000 }); const t = await p.textContent("#nowebgl"); assert(/WebGL/.test(t) && /2D version/.test(t), "message text"); assert(await p.evaluate(() => window.__gfx && window.__gfx.webgl === false), "layer reports no WebGL"); await p.screenshot({ path: P.shot("gfx_nowebgl.png") });
  }, ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis", "--disable-gpu"]);

  await scenario("G06 merge: static meshes per cell and vehicle parts per owner, originals hidden, dynamic objects untouched, wheels keep their owners, draw calls fall", "&gfx=high", async (p, errors) => {
    await world(p); const m = await p.evaluate(() => JSON.parse(JSON.stringify({ merge: window.__gfx.merge, vehicles: window.__gfx.vehicles, textures: window.__gfx.textures })));
    assert(m.merge.enabled && m.merge.groups > 20 && m.merge.meshesMerged > 200, "static merged: " + JSON.stringify(m.merge)); assert(m.vehicles && m.vehicles.vehicles === 9 && m.vehicles.meshesMerged > 800, "vehicle parts merged: " + JSON.stringify(m.vehicles));
    const totalMerged = m.merge.meshesMerged + m.vehicles.meshesMerged, totalGroups = m.merge.groups + m.vehicles.groups;
    const chk = await p.evaluate(() => { const g = window.__dg; let hiddenOriginals = 0, merged = 0, dynamicMerged = 0, playerMerged = 0; g.scene.traverse(o => { if (o.userData.mergedInto) { hiddenOriginals += o.visible ? 0 : 1; } if (o.userData.mergedFrom) merged++; });
      const isDyn = o => o.userData && (o.userData.animate || o.userData.setOpen || o.userData.wave || o.userData.clips); g.scene.traverse(o => { if (isDyn(o)) o.traverse(c => { if (c.userData.mergedInto) dynamicMerged++; }); }); g.player.vehicle.root.traverse(c => { if (c.userData.mergedInto) playerMerged++; }); g.traffic.forEach(t => t.v.root.traverse(c => { if (c.userData.mergedInto) playerMerged++; }));
      g.renderer.info.reset(); g.render(); return { hiddenOriginals, merged, dynamicMerged, playerMerged, calls: g.renderer.info.render.calls, gpuTextures: g.renderer.info.memory.textures }; });
    assert(chk.merged === totalGroups && chk.hiddenOriginals === totalMerged, "originals hidden, merged meshes present: " + JSON.stringify(chk) + " vs " + totalGroups + "/" + totalMerged); assert(chk.dynamicMerged === 0, "no animated/toggled mesh was merged");
    const wheels = await p.evaluate(() => { const r = window.__dg.player.vehicle.root; let spinOwned = 0, rootOwned = 0; r.traverse(o => { if (o.userData.mergedFrom) { if (o.parent.name === "Spin" || o.parent.name === "Steer" || o.parent.name.indexOf("Wheel") === 0) spinOwned++; else if (o.parent === r || o.parent.name === "Body" || o.parent.name === "Details") rootOwned++; } }); return { spinOwned, rootOwned }; });
    assert(wheels.spinOwned >= 4 && wheels.rootOwned >= 1, "vehicle parts merged under wheel owners and the body: " + JSON.stringify(wheels));
    assert(m.textures.duplicatesReplaced >= 0 && errors.length === 0, "textures " + JSON.stringify(m.textures) + " errors " + errors.join("|"));
    // still playable: the start arch opens the Al Baleed stop
    const n = await p.evaluate(() => { const g = window.__dg; g.resetTo(30, undefined, true); g.progressS = 30; g.lastS = 30; let i = 0; while (i < 1200 && document.getElementById("qpanel").hidden) { g.keys.add("up"); g.update(1 / 60); i++; } g.keys.delete("up"); return i; }); assert(n > 0 && n < 1200, "arch stop opens (" + n + " steps)");
    return `static ${m.merge.meshesMerged}→${m.merge.groups}, vehicles ${m.vehicles.meshesMerged}→${m.vehicles.groups}; ${chk.calls} calls; textures: ${m.textures.duplicatesReplaced} dup refs, ${m.textures.disposed} freed; gpu textures ${chk.gpuTextures}`;
  });
  await scenario("G06b #merge=0 leaves the scene as shipped", "&gfx=high&merge=0", async p => { await world(p); const m = await p.evaluate(() => window.__gfx.merge); assert(m && m.enabled === false && !m.groups, JSON.stringify(m)); const merged = await p.evaluate(() => { let n = 0; window.__dg.scene.traverse(o => { if (o.userData.mergedFrom) n++; }); return n; }); assert(merged === 0, "no merged meshes"); });

  hook.close(); srv.close(); fs.writeFileSync(P.tmp("rally_gfx.json"), JSON.stringify(results, null, 1));
  const fails = results.filter(r => r.verdict === "FAIL").length; console.log(`\n${fails ? "FAIL" : "PASS"}: ${results.length - fails}/${results.length}`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error("RUNNER ERROR", e); process.exit(1); });
