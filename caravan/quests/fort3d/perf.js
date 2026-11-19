#!/usr/bin/env node
// Fort of Taqah performance probe: frame time of the game loop with the 3D view vs the 2D canvas, draw calls, triangles,
// JS heap. Headless Chromium uses software WebGL here, so absolute numbers are NOT what a real GPU gives — the comparison
// and the draw-call/triangle counts are the meaningful parts. Run: node caravan/quests/fort3d/perf.js
const { chromium, devices } = require("playwright"); const H = require("../../../tests/fort/harness.js");
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--js-flags=--expose-gc"];
async function measure(browser, opts, disable3d) {
  const ctx = await H.context(browser, opts); if (disable3d) await ctx.addInitScript(() => { Object.defineProperty(window, "FortView3D", { get() { return undefined; }, set() { } }); });
  const p = await ctx.newPage(); await H.toStage(p); await p.waitForTimeout(800);
  // play a shot so effects are alive, then sample 120 loop iterations
  await p.evaluate(() => { const r = F.cur; document.querySelector('#fopts [data-a="' + r.q.a + '"]').click(); });
  const r = await p.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), n = 0; const tick = now => { t.push(now - last); last = now; if (++n < 120) requestAnimationFrame(tick); else { t.sort((a, b) => a - b); const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null; const d = window.__fortView ? window.__fortView.debug() : null; res({ view: !!F.view, p50: +t[60].toFixed(1), p90: +t[108].toFixed(1), max: +t[119].toFixed(1), heapMB: mem, calls: d && d.calls, tris: d && d.triangles, dpr: d && d.pixelRatio }); } }; requestAnimationFrame(tick); }));
  await ctx.close(); return r;
}
(async () => { const srv = H.start(); const browser = await chromium.launch({ args: GL }); const out = {};
  for (const [name, opts] of [["desktop 1366x800", { viewport: { width: 1366, height: 800 } }], ["Pixel 7", devices["Pixel 7"]]]) { out[name] = { "2D canvas": await measure(browser, opts, true), "3D view": await measure(browser, opts, false) }; }
  await browser.close(); srv.close(); console.log(JSON.stringify(out, null, 1)); })().catch(e => { console.error(e); process.exit(1); });
