#!/usr/bin/env node
// Adventure-mode performance probe: draw calls, triangles and frame time per preset at two viewpoints (courtyard, rampart).
// Headless Chromium rasterises WebGL in software here, so frame times are NOT GPU results — compare presets, read the
// draw-call / triangle budget, and confirm on a real device. Run: node caravan/quests/fort3d/perf_adventure.js
const { chromium } = require("playwright"); const H = require("../../../tests/fort/harness.js");
(async () => { const srv = H.start(); const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const ctx = await H.context(browser, { viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:8899/fort_adventure.html" + H.HASH, { waitUntil: "load" }); await p.click('[data-f="0"]'); await p.click('.fcard[data-h="commander"]'); await p.click("#fsel");
  await p.waitForSelector(".cv-ovl", { timeout: 20000 }); const els = await p.$$(".cv-ovl .cv-w"); for (let i = 0; i < els.length; i++) { await els[i].click(); if (/✓/.test(await p.textContent(".cv-count"))) break; } await p.click(".cv-ovl button");
  for (let k = 0; k < 4; k++) { const b = await p.$(".cv-ovl [data-hq]"); if (!b) break; await b.click(); await p.waitForTimeout(1100); }
  await p.waitForFunction(() => window.__fortView && window.__fortView.debug().frames > 3, null, { timeout: 20000 });
  const rows = [];
  for (const [view, x, y, z, yaw] of [["courtyard", -3.5, 9, 12, 0], ["rampart", 0, 17, -10.5, 0.2]]) for (const q of ["low", "medium", "high"]) {
    await p.evaluate(([x, y, z, yaw, q]) => { const v = window.__fortView; v.setQuality(q); v.player.spawn(x, y, z, yaw); v.frameMs.length = 0; }, [x, y, z, yaw, q]); await p.waitForTimeout(2500);
    const d = await p.evaluate(() => { const v = window.__fortView; const d = v.debug(); return { calls: d.calls, tris: d.triangles, p50: d.frameP50, p90: d.frameP90, pr: d.pixelRatio, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, geoms: v.fs.renderer.info.memory.geometries, tex: v.fs.renderer.info.memory.textures }; });
    rows.push({ view, q, ...d }); console.log(view.padEnd(10), q.padEnd(7), `calls ${d.calls}  tris ${d.tris}  p50 ${d.p50} ms  p90 ${d.p90} ms  pr ${d.pr}  heap ${d.heapMB} MB  geometries ${d.geoms}  textures ${d.tex}`);
  }
  await browser.close(); srv.close(); })().catch(e => { console.error(e); process.exit(1); });
