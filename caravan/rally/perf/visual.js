#!/usr/bin/env node
// Visual regression + gallery for the Khareef Rally graphics layer.
// 1. Renders the SAME deterministic frames (simulation paused, car placed by __driveTo, N manual update steps) with the static
//    merge off (#merge=0) and on, at a fixed tier, and measures the pixel difference in-page (mean abs diff, % pixels > 16/255).
// 2. Captures a gallery (desktop, phone portrait, phone landscape) at several road positions with the merge on, so buildings,
//    road, vehicles, trees, signs and water can be checked by eye. Output: build/tmp/visual/*.png + visual.json
// Usage: node caravan/rally/perf/visual.js [page.html]
const http = require("http"), fs = require("fs"), path = require("path"); const { chromium, devices } = require("playwright");
const ROOT = path.resolve(__dirname, "..", "..", ".."); const P = require(path.join(ROOT, "tests/paths.js"));
const file = process.argv[2] || "rally3d/index.html";
const html = fs.readFileSync(path.resolve(ROOT, file), "utf8").replace('const API="https://ge2-caravan-api.ge2-caravan.workers.dev/"', 'const API="http://127.0.0.1:8897/hook"');
const hook = http.createServer((q, r) => { r.setHeader("access-control-allow-origin", "*"); r.setHeader("access-control-allow-headers", "*"); if (q.method === "OPTIONS") return r.end(); r.setHeader("content-type", "application/json"); r.end('{"ok":true}'); }).listen(8897);
const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(html); }).listen(8899);
const OUT = path.join(P.TMP, "visual"); fs.mkdirSync(OUT, { recursive: true });
const S = "#play&s=studenttoken12345~000S0000~student~Salwa%20Malik~Salwa";
const route = ctx => ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue(); if (u.hostname === "ge2-caravan-rally.ge2-caravan.workers.dev") { const f = path.join(ROOT, "rally3d/tex_s", u.pathname.replace(/^\/tex\//, "")); if (fs.existsSync(f)) return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": /\.png$/.test(f) ? "image/png" : "image/jpeg", "access-control-allow-origin": "*" } }); return r.fulfill({ status: 200, body: '{"ok":true,"files":[]}', headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); } r.abort(); });
async function open(browser, ctxOpts, hash) {
  const ctx = await browser.newContext(ctxOpts); await route(ctx); const p = await ctx.newPage(); const errors = []; p.on("pageerror", e => errors.push(e.message.slice(0, 160)));
  await p.goto("http://127.0.0.1:8899/webhook/ge2-studio-app?p=9" + S + hash, { waitUntil: "load", timeout: 60000 }); await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  await p.evaluate(() => { window.__skipIntro = true; window.__drive("pickup"); }); await p.waitForFunction(() => window.__dg && window.__dg.ready && window.__dg.active && window.__gfx && window.__gfx.applied, null, { timeout: 400000 });
  await p.evaluate(() => { window.__pause(true); }); // the rAF loop keeps rendering but no longer advances time: frames depend only on our manual steps
  return { ctx, p, errors };
}
// place the car at road distance s, advance the simulation deterministically, render, and return the canvas as a PNG data URL
async function frame(p, s, steps, cam) { return p.evaluate(async ({ s, steps, cam }) => { const g = window.__dg; g.camMode = cam || 0; g.camInit = true; window.__driveTo(s, 1.85, cam || 0); for (let i = 0; i < steps; i++) { g.keys.add("up"); g.update(1 / 60); } g.keys.delete("up"); g.updateCamera(0.5); g.updateCamera(0.5); g.render(); await new Promise(r => requestAnimationFrame(r)); g.render(); return g.renderer.domElement.toDataURL("image/png"); }, { s, steps, cam }); }
async function diff(p, a, b) { return p.evaluate(async ({ a, b }) => { const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; }); const A = await load(a), B = await load(b); const c = document.createElement("canvas"); c.width = A.width; c.height = A.height; const x = c.getContext("2d"); x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data; let sum = 0, big = 0; const n = c.width * c.height; for (let i = 0; i < n * 4; i += 4) { const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3; sum += d; if (d > 16) big++; } return { meanAbs: +(sum / n).toFixed(2), pctChanged: +(100 * big / n).toFixed(2), w: c.width, h: c.height }; }, { a, b }); }
const save = (name, dataUrl) => fs.writeFileSync(path.join(OUT, name), Buffer.from(dataUrl.split(",")[1], "base64"));
const SPOTS = [{ name: "start-arch", s: 20, steps: 30 }, { name: "coast-dhows", s: 540, steps: 30 }, { name: "taqah-town", s: 980, steps: 30 }, { name: "mountain", s: 1700, steps: 30 }, { name: "mirbat", s: 2900, steps: 30 }];
(async () => {
  const browser = await chromium.launch(); const report = { file, when: new Date().toISOString(), tier: "high", diffs: [], gallery: [], merge: null, textures: null, errors: [] };
  // 1. visual regression: merge off vs on, desktop, high tier
  const off = await open(browser, { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, "&gfx=high&merge=0");
  const on = await open(browser, { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, "&gfx=high");
  report.merge = await on.p.evaluate(() => window.__gfx.merge); report.textures = await on.p.evaluate(() => window.__gfx.textures);
  report.callsOff = await off.p.evaluate(() => { const g = window.__dg; g.renderer.info.reset(); g.render(); return { calls: g.renderer.info.render.calls, tris: g.renderer.info.render.triangles, gpuTextures: g.renderer.info.memory.textures, geometries: g.renderer.info.memory.geometries }; });
  report.callsOn = await on.p.evaluate(() => { const g = window.__dg; g.renderer.info.reset(); g.render(); return { calls: g.renderer.info.render.calls, tris: g.renderer.info.render.triangles, gpuTextures: g.renderer.info.memory.textures, geometries: g.renderer.info.memory.geometries }; });
  // traffic respawns with Math.random(), so it differs between any two runs: hide it in both contexts for the comparison
  for (const c of [off, on]) await c.p.evaluate(() => { window.__dg.traffic.forEach(t => { t.v.root.visible = false; }); window.__dg.updateTraffic = () => {}; });
  for (const sp of SPOTS) { const a = await frame(off.p, sp.s, sp.steps, 0), b = await frame(on.p, sp.s, sp.steps, 0); save(`diff_${sp.name}_off.png`, a); save(`diff_${sp.name}_on.png`, b); const d = await diff(on.p, a, b); report.diffs.push({ spot: sp.name, ...d }); console.log(`diff ${sp.name.padEnd(12)} mean ${d.meanAbs}  changed>16 ${d.pctChanged}%`); }
  report.errors.push(...off.errors.map(e => "off: " + e), ...on.errors.map(e => "on: " + e)); await off.ctx.close(); await on.ctx.close();
  // 2. gallery with merge on at three viewports
  for (const [label, opts] of [["desktop", { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }], ["pixel7-portrait", { ...devices["Pixel 7"], deviceScaleFactor: 1 }], ["s9-landscape", { ...devices["Galaxy S9+"], viewport: { width: 740, height: 360 }, deviceScaleFactor: 1 }]]) {
    // canvas PNGs (page.screenshot waits for a compositor frame, which headless software GL cannot deliver within its timeout)
    const v = await open(browser, opts, "&gfx=medium"); for (const sp of SPOTS) { const f = `gallery_${label}_${sp.name}.png`; save(f, await frame(v.p, sp.s, sp.steps, 0)); report.gallery.push(f); } if (label === "desktop") { save("gallery_desktop_taqah-hood-cam.png", await frame(v.p, 980, 30, 1)); save("gallery_desktop_taqah-top-cam.png", await frame(v.p, 980, 30, 2)); report.gallery.push("gallery_desktop_taqah-hood-cam.png", "gallery_desktop_taqah-top-cam.png"); }
    report.errors.push(...v.errors.map(e => label + ": " + e)); await v.ctx.close();
  }
  await browser.close(); hook.close(); srv.close(); fs.writeFileSync(path.join(OUT, "visual.json"), JSON.stringify(report, null, 1));
  console.log("merge:", JSON.stringify(report.merge)); console.log("textures:", JSON.stringify(report.textures)); console.log("calls off/on:", JSON.stringify(report.callsOff), JSON.stringify(report.callsOn)); console.log("errors:", report.errors.length ? report.errors : "none"); console.log("gallery:", report.gallery.length, "screenshots in", OUT);
})().catch(e => { console.error("VISUAL ERROR", e); process.exit(1); });
