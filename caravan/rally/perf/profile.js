#!/usr/bin/env node
// Profiles a Khareef Rally page in headless Chromium: what a frame costs and why. Headless uses software WebGL, so absolute
// milliseconds are not a PC's numbers; counts (draw calls, triangles, programs, textures, texel budget) and A/B ratios
// (shadows on/off, pixel ratio, scatter) transfer. Usage: node caravan/rally/perf/profile.js [page.html] [label]
const http = require("http"), fs = require("fs"), path = require("path"); const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "..", "..", ".."); const P = require(path.join(ROOT, "tests/paths.js"));
const file = process.argv[2] || "rally3d/index.html", label = process.argv[3] || path.basename(path.dirname(file)) + "-" + path.basename(file, ".html"), extraHash = process.argv[4] || "";
const html = fs.readFileSync(path.resolve(ROOT, file), "utf8").replace('const API="https://ge2-caravan-api.ge2-caravan.workers.dev/"', 'const API="http://127.0.0.1:8897/hook"');
const hook = http.createServer((q, r) => { r.setHeader("access-control-allow-origin", "*"); r.setHeader("access-control-allow-headers", "*"); if (q.method === "OPTIONS") return r.end(); r.setHeader("content-type", "application/json"); r.end('{"ok":true}'); }).listen(8897);
const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(html); }).listen(8899);
const texStats = { requests: 0, bytes: 0, files: [] };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await ctx.route("**/*", r => { const u = new URL(r.request().url()); if (u.hostname === "127.0.0.1") return r.continue();
    if (u.hostname === "ge2-caravan-rally.ge2-caravan.workers.dev") { const f = path.join(ROOT, "rally3d/tex_s", u.pathname.replace(/^\/tex\//, "")); if (fs.existsSync(f)) { const body = fs.readFileSync(f); texStats.requests++; texStats.bytes += body.length; texStats.files.push(path.basename(f)); return r.fulfill({ status: 200, body, headers: { "content-type": /\.png$/.test(f) ? "image/png" : "image/jpeg", "access-control-allow-origin": "*" } }); } return r.fulfill({ status: 200, body: '{"ok":true,"files":[]}', headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); } r.abort(); });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", e => errors.push(e.message.slice(0, 120)));
  const t0 = Date.now(); await p.goto("http://127.0.0.1:8899/webhook/ge2-studio-app?p=9#play&s=studenttoken12345~000S0000~student~Salwa%20Malik~Salwa" + extraHash, { waitUntil: "load" });
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 }); const garageMs = Date.now() - t0;
  const t1 = Date.now(); await p.evaluate(() => { window.__skipIntro = true; window.__drive("pickup"); }); await p.waitForFunction(() => window.__dg && window.__dg.ready && window.__dg.active && !!window.__dg.car, null, { timeout: 400000 }); const buildMs = Date.now() - t1;
  // drive 3 s of sim so the scene is the typical road view, not the start line
  await p.evaluate(() => { const g = window.__dg; g.keys.add("up"); for (let i = 0; i < 180; i++) g.update(1 / 60); g.keys.delete("up"); });
  const prof = await p.evaluate(async () => {
    const g = window.__dg, R = g.renderer, S = g.scene, cam = g.camera;
    const timeRender = (n = 12) => { const ts = []; for (let i = 0; i < n; i++) { const t = performance.now(); g.render(); R.getContext().finish(); ts.push(performance.now() - t); } ts.sort((a, b) => a - b); return { median: +ts[n >> 1].toFixed(1), min: +ts[0].toFixed(1), max: +ts[n - 1].toFixed(1) }; };
    const info = () => { R.info.reset(); g.render(); const i = R.info; return { calls: i.render.calls, triangles: i.render.triangles, lines: i.render.lines, points: i.render.points, programs: i.programs.length, geometries: i.memory.geometries, textures: i.memory.textures }; };
    const counts = { meshes: 0, instanced: 0, instances: 0, lights: 0, shadowCasters: 0, shadowReceivers: 0, sprites: 0, skinned: 0 }; const mats = new Set(), geos = new Set(), texs = new Set();
    S.traverse(o => { if (o.isLight) counts.lights++; if (o.isSprite) counts.sprites++; if (o.isMesh) { counts.meshes++; if (o.isInstancedMesh) { counts.instanced++; counts.instances += o.count; } if (o.isSkinnedMesh) counts.skinned++; if (o.castShadow) counts.shadowCasters++; if (o.receiveShadow) counts.shadowReceivers++; geos.add(o.geometry); for (const m of [].concat(o.material)) { mats.add(m); for (const k of ["map", "normalMap", "roughnessMap", "aoMap", "emissiveMap", "alphaMap"]) if (m[k]) texs.add(m[k]); } } });
    const texList = [...texs].map(t => ({ name: (t.image && (t.image.src || t.image.currentSrc || "")).split("/").pop().slice(0, 30) || t.name || "(generated)", w: t.image && (t.image.width || t.image.videoWidth) || 0, h: t.image && t.image.height || 0, mips: t.generateMipmaps, aniso: t.anisotropy }));
    const texels = texList.reduce((n, t) => n + t.w * t.h, 0);
    const lights = []; S.traverse(o => { if (o.isLight) lights.push({ type: o.type, castShadow: !!o.castShadow, mapSize: o.shadow ? [o.shadow.mapSize.x, o.shadow.mapSize.y] : null, shadowCam: o.shadow && o.shadow.camera ? { l: o.shadow.camera.left, r: o.shadow.camera.right, far: o.shadow.camera.far } : null }); });
    const base = { gfx: window.__gfx ? window.__gfx.tier : "(none)", pixelRatio: R.getPixelRatio(), drawingBuffer: [R.domElement.width, R.domElement.height], shadowMap: { enabled: R.shadowMap.enabled, type: R.shadowMap.type, autoUpdate: R.shadowMap.autoUpdate }, antialias: R.getContextAttributes ? R.getContextAttributes().antialias : null, toneMapping: R.toneMapping, cameraFar: cam.far, fog: S.fog ? [S.fog.near, S.fog.far] : null };
    const heap = performance.memory ? { usedMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), totalMB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(1) } : null;
    const ab = {}; ab.baseline = { ...info(), render: timeRender() };
    const sm = R.shadowMap.enabled; R.shadowMap.enabled = false; S.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); ab.noShadows = { ...info(), render: timeRender() }; R.shadowMap.enabled = sm; S.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
    const pr = R.getPixelRatio(); R.setPixelRatio(0.5); ab.halfPixelRatio = { ...info(), render: timeRender() }; R.setPixelRatio(pr);
    const sc = g.world && g.world.scatter; let hidden = []; if (sc) { S.traverse(o => { if (o.isInstancedMesh && o.visible) { hidden.push(o); o.visible = false; } }); ab.noInstanced = { ...info(), render: timeRender() }; hidden.forEach(o => o.visible = true); }
    const noAuto = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = false; ab.shadowsFrozen = { ...info(), render: timeRender() }; R.shadowMap.autoUpdate = noAuto;
    return { base, counts, uniqueMaterials: mats.size, uniqueGeometries: geos.size, uniqueTextures: texs.size, texels, texelsMB: +(texels * 4 / 1048576).toFixed(0), textures: texList.sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 12), lights, heap, ab, traffic: g.traffic.length, camels: g.world.camels.length, herds: g.world.herds.length };
  });
  const rafFps = await p.evaluate(ms => new Promise(res => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(+(n / ((performance.now() - t0) / 1000)).toFixed(2)); }; requestAnimationFrame(tick); }), 3000);
  const out = { label, file, when: new Date().toISOString(), headless: true, viewport: "1280x720@1", garageMs, worldBuildMs: buildMs, textures: { requests: texStats.requests, bytesKB: Math.round(texStats.bytes / 1024) }, rafFps, errors, ...prof };
  fs.mkdirSync(path.join(P.TMP, "perf"), { recursive: true }); const outFile = path.join(P.TMP, "perf", label + ".json"); fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  try { const png = await p.evaluate(() => { window.__dg.render(); return window.__dg.renderer.domElement.toDataURL("image/png"); }); fs.writeFileSync(P.shot("perf_" + label + ".png"), Buffer.from(png.split(",")[1], "base64")); } catch (e) { console.log("(canvas capture failed: " + e.message.split("\n")[0] + ")"); }
  await b.close(); hook.close(); srv.close();
  const f = x => `${x.calls} calls / ${x.triangles} tris / render ${x.render.median} ms`;
  console.log(`== ${label} ==\n garage ${garageMs} ms, world build ${buildMs} ms, textures ${texStats.requests} req ${Math.round(texStats.bytes / 1024)} KB, rAF ${rafFps} fps, heap ${out.heap ? out.heap.usedMB + " MB" : "n/a"}`);
  console.log(` gfx ${out.base.gfx} pixelRatio ${out.base.pixelRatio} buffer ${out.base.drawingBuffer.join("x")} shadows ${out.base.shadowMap.enabled} type ${out.base.shadowMap.type} fog ${out.base.fog} far ${out.base.cameraFar}`);
  console.log(` scene: ${out.counts.meshes} meshes (${out.counts.instanced} instanced, ${out.counts.instances} instances), casters ${out.counts.shadowCasters}, receivers ${out.counts.shadowReceivers}, lights ${out.counts.lights}, materials ${out.uniqueMaterials}, geometries ${out.uniqueGeometries}, textures ${out.uniqueTextures} (${out.texelsMB} MB texels), traffic ${out.traffic}, camels ${out.camels}`);
  for (const l of out.lights) console.log(`  light ${l.type} shadow=${l.castShadow} map=${l.mapSize} cam=${JSON.stringify(l.shadowCam)}`);
  console.log(` A/B: baseline ${f(out.ab.baseline)} | noShadows ${f(out.ab.noShadows)} | pixelRatio 0.5 ${f(out.ab.halfPixelRatio)} | noInstanced ${out.ab.noInstanced ? f(out.ab.noInstanced) : "n/a"} | shadowsFrozen ${f(out.ab.shadowsFrozen)}`);
  console.log(` top textures: ${out.textures.map(t => t.name + " " + t.w + "x" + t.h).join(", ")}`);
  console.log(` saved ${outFile}`);
})().catch(e => { console.error("PROFILE ERROR", e); process.exit(1); });
