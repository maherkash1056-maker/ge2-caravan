/* Khareef Rally — graphics quality layer (readable source; inlined before the game module by caravan/rally/build_page.js).
   Why: the shipped scene draws ~2.7k calls / 1.6M triangles per frame at pixel ratio 2 with a 2048² shadow map and scenery out
   to 900 m. This layer adds quality tiers, picks one for the device, adapts it to the measured frame time, and lets the
   player choose (G key / Graphics button / #gfx=tier). It changes rendering only: no gameplay, content, scoring or bridge.
   Hooks used: window.__dg (the game: renderer, scene, camera, sun, hemi, world.scatter, traffic, hud), window.__ready.
   The bundle reads window.__GFX.pixelRatio() / antialias() / shadowSize() while it boots (see build_page.js patches). */
(function () {
  "use strict";
  var TIERS = {
    ultra:   { pr: 2,    shadow: 2048, shadowEvery: 1, scatter: 1.0,  traffic: 8, fogFar: 1.0,  camelAnim: 260, aa: true,  label: "Ultra" },
    high:    { pr: 1.5,  shadow: 2048, shadowEvery: 1, scatter: 0.8,  traffic: 8, fogFar: 1.0,  camelAnim: 260, aa: true,  label: "High" },
    medium:  { pr: 1.25, shadow: 1024, shadowEvery: 2, scatter: 0.6,  traffic: 6, fogFar: 0.8,  camelAnim: 180, aa: true,  label: "Medium" },
    low:     { pr: 1,    shadow: 512,  shadowEvery: 2, scatter: 0.4,  traffic: 4, fogFar: 0.6,  camelAnim: 120, aa: false, label: "Low" },
    minimal: { pr: 0.75, shadow: 0,    shadowEvery: 0, scatter: 0.25, traffic: 2, fogFar: 0.5,  camelAnim: 0,   aa: false, label: "Minimal" }
  };
  var ORDER = ["minimal", "low", "medium", "high", "ultra"];
  var hash = {}; try { location.hash.replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) hash[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); }); } catch (e) { }
  var coarse = false; try { coarse = matchMedia("(pointer: coarse)").matches; } catch (e) { }
  var cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  var requested = TIERS[hash.gfx] ? hash.gfx : null, auto = !requested;
  // starting tier: phones and small machines start one step lower; auto never goes above "high" on its own
  var start = requested || (coarse || cores <= 4 || mem <= 4 ? "medium" : "high");
  var cur = start, G = { tier: cur, auto: auto, tiers: TIERS, order: ORDER, stats: { fps: 0, ms: 0, calls: 0, tris: 0 }, debug: hash.gfx === "debug" || hash.gfxdebug === "1", applied: null, log: [] };
  if (hash.gfx === "debug") { cur = G.tier = start = coarse || cores <= 4 ? "medium" : "high"; G.auto = auto = true; }
  var T = function () { return TIERS[cur]; };
  var dpr = function () { return window.devicePixelRatio || 1; };
  // --- read by the bundle at boot (patched call sites)
  window.__GFX = {
    tier: function () { return cur; },
    pixelRatio: function () { return Math.min(dpr(), T().pr); },
    antialias: function () { return T().aa; },
    shadowSize: function () { return T().shadow || 512; }  // a 0 size would break the light; shadows are switched off below instead
  };
  // --- WebGL availability message (the module cannot start a renderer without it)
  function webglOk() { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
  function noWebGL() {
    var d = document.createElement("div"); d.id = "nowebgl";
    d.style.cssText = "position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:#17110d;color:#f3e6cc;font:600 18px/1.5 system-ui,sans-serif;text-align:center;padding:24px";
    d.innerHTML = '<div style="max-width:520px"><div style="font-size:40px">🚙</div><h2 style="margin:8px 0">Khareef Rally needs 3D graphics (WebGL)</h2><p>This browser or device has WebGL switched off, so the 3D road cannot be drawn.</p><p>Try Chrome or Edge with hardware acceleration on, or ask the teacher for the 2D version of the rally.</p><p style="opacity:.7;font-size:14px">تحتاج اللعبة إلى WebGL لعرض الطريق ثلاثي الأبعاد.</p></div>';
    document.body ? document.body.appendChild(d) : addEventListener("DOMContentLoaded", function () { document.body.appendChild(d); });
  }
  if (!webglOk()) { noWebGL(); G.webgl = false; window.__gfx = G; return; }
  G.webgl = true;

  // --- applying a tier to the live game
  var base = null; // remembered defaults from the scene
  function remember(g) {
    if (base) return;
    base = G.base = { tiles: g.world.scatter.tiles.map(function (t) { return { t: t, maxDist: t.maxDist, lodDist: t.lodDist }; }), traffic: g.traffic.slice(), cameraFar: g.camera.far, shadowType: g.renderer.shadowMap.type, maxDist: Math.max.apply(null, g.world.scatter.tiles.map(function (t) { return t.maxDist; })) };
  }
  function applyTier(name, why) {
    var g = window.__dg; if (!g || !g.ready || !g.renderer) return false;
    var t = TIERS[name]; if (!t) return false; remember(g); cur = G.tier = name;
    var R = g.renderer;
    R.setPixelRatio(Math.min(dpr(), t.pr));
    // shadows: size, on/off, and how often the map is redrawn
    var sun = g.sun; var on = t.shadow > 0;
    if (R.shadowMap.enabled !== on) { R.shadowMap.enabled = on; g.scene.traverse(function (o) { if (o.material) [].concat(o.material).forEach(function (m) { m.needsUpdate = true; }); }); }
    if (sun && sun.shadow) { if (on && sun.shadow.mapSize.x !== t.shadow) { sun.shadow.mapSize.set(t.shadow, t.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } sun.castShadow = on; }
    R.shadowMap.autoUpdate = t.shadowEvery <= 1; R.shadowMap.needsUpdate = true;
    // scenery draw distance (the scatter tiles already cull by distance; we scale their limits)
    base.tiles.forEach(function (b) { b.t.maxDist = b.maxDist * t.scatter; b.t.lodDist = b.lodDist * Math.min(1, t.scatter + 0.2); });
    if (g.world.scatter.update && g.camera) g.world.scatter.update(g.camera.position);
    // traffic: keep the first N cars simulated and visible, park the rest off the scene (collision code skips invisible cars)
    base.traffic.forEach(function (car, i) { var keep = i < t.traffic; car.v.root.visible = keep; car.parked = !keep; });
    g.traffic.length = 0; base.traffic.forEach(function (car, i) { if (i < t.traffic) g.traffic.push(car); });
    // far plane follows the fog so distant geometry is culled, not just fogged
    g.camera.far = Math.min(base.cameraFar, 3600 * t.fogFar + 600); g.camera.updateProjectionMatrix();
    G.applied = { tier: name, pixelRatio: R.getPixelRatio(), shadow: on ? t.shadow : 0, shadowEvery: t.shadowEvery, scatter: t.scatter, traffic: g.traffic.length, cameraFar: g.camera.far, why: why || "" };
    G.log.push((performance.now() / 1000).toFixed(1) + "s → " + name + (why ? " (" + why + ")" : ""));
    try { if (g.hud && g.hud.toast && why !== "init") g.hud.toast("Graphics · الرسوميات", t.label + (G.auto ? " · auto" : ""), why === "key" ? "Press G to change, F for stats" : why, 2.2); } catch (e) { }
    updateButton(); return true;
  }
  // --- frame timing + adaptive control (wraps the game's render(), which the loop calls once per frame)
  var frames = 0, last = 0, ema = 0, slowSince = 0, fastSince = 0, fpsN = 0, fpsT = 0, attachedAt = 0, visChanged = -1e9;
  function wrapRender(g) {
    if (g.__gfxWrapped) return; g.__gfxWrapped = true; var orig = g.render.bind(g);
    g.render = function () {
      var now = performance.now(); frames++;
      var t = TIERS[cur]; if (t.shadowEvery > 1 && g.renderer.shadowMap.enabled) g.renderer.shadowMap.needsUpdate = (frames % t.shadowEvery) === 0;
      orig();
      // a long gap counts as a slow frame unless the tab changed visibility during it
      if (last) { var dt = now - last; if (dt < 4000 || now - visChanged > dt) { dt = Math.min(dt, 4000); ema = ema ? ema * 0.9 + dt * 0.1 : dt; G.stats.ms = +ema.toFixed(1); fpsN++; fpsT += dt; if (fpsT >= 1000) { G.stats.fps = Math.round(fpsN * 1000 / fpsT); fpsN = 0; fpsT = 0; var inf = g.renderer.info; G.stats.calls = inf.render.calls; G.stats.tris = inf.render.triangles; if (G.debug) drawStats(); } } }
      last = now;
      if (G.auto && g.active && !(window.__quiz && window.__quiz.modal) && attachedAt && now - attachedAt > 2000) adapt(now);
    };
  }
  function adapt(now) {
    var i = ORDER.indexOf(cur), slowMs = coarse ? 40 : 24, fastMs = coarse ? 20 : 11;
    if (ema > slowMs) { fastSince = 0; if (!slowSince) slowSince = now; else if (now - slowSince > 2500 && i > 0) { applyTier(ORDER[i - 1], "frame time " + ema.toFixed(0) + " ms"); slowSince = 0; } }
    else if (ema < fastMs) { slowSince = 0; if (!fastSince) fastSince = now; else if (now - fastSince > 8000 && i < ORDER.indexOf(start)) { applyTier(ORDER[i + 1], "frame time " + ema.toFixed(0) + " ms"); fastSince = 0; } }
    else { slowSince = 0; fastSince = 0; }
  }
  // --- UI: button in the HUD, G key cycles, F toggles the stats overlay
  var btn = null, overlay = null;
  function updateButton() { if (btn) btn.textContent = "Graphics: " + (G.auto ? "Auto · " : "") + TIERS[cur].label; }
  function cycle() { G.auto = false; var i = ORDER.indexOf(cur); applyTier(ORDER[(i + 1) % ORDER.length], "key"); }
  function drawStats() {
    if (!overlay) { overlay = document.createElement("div"); overlay.id = "gfxstats"; overlay.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:50;background:rgba(0,0,0,.6);color:#fff;font:12px/1.4 monospace;padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre"; document.body.appendChild(overlay); }
    var a = G.applied || {}; overlay.textContent = "gfx " + cur + (G.auto ? " (auto)" : "") + "\n" + G.stats.fps + " fps  " + G.stats.ms + " ms\n" + G.stats.calls + " calls  " + (G.stats.tris / 1000).toFixed(0) + "k tris\npr " + a.pixelRatio + "  shadow " + a.shadow + (a.shadowEvery > 1 ? "/" + a.shadowEvery : "") + "  scenery " + a.scatter + "  cars " + a.traffic;
    overlay.style.display = G.debug ? "block" : "none";
  }
  function installUI(g) {
    try {
      var bar = document.querySelector("#hud .hud-btns") || document.getElementById("hud");
      if (bar && !btn) { btn = document.createElement("button"); btn.id = "bGfx"; btn.type = "button"; var ref = document.getElementById("bCam"); btn.className = ref ? ref.className : "btn"; btn.addEventListener("click", cycle); (ref && ref.parentNode ? ref.parentNode : bar).appendChild(btn); updateButton(); }
      addEventListener("keydown", function (e) { if (!g.active || (window.__quiz && window.__quiz.modal)) return; if (e.code === "KeyG" && !e.repeat) cycle(); if (e.code === "KeyF" && !e.repeat) { G.debug = !G.debug; drawStats(); } });
    } catch (e) { }
  }
  // --- geometry merging (second performance commit)
  // Measured: ~1 280 of the 2 650 draw calls were the nine vehicles (130–160 meshes each: chrome trim, bolts, lamps), the rest
  // small static meshes (buildings, arches, signs, palms, dhows, terrain and road tiles). Two passes:
  //  * static: meshes sharing material, shadow flags and vertex layout are merged per 150 m cell into one mesh with world
  //    transforms baked in (culling stays per cell). Excluded by evidence from the bundle: anything marked
  //    userData.animate/setOpen/wave/clips/camel (gates, barriers, flags, stones, roadworks, camels), the sea and waterfall
  //    shaders, skid marks and particles (frustumCulled=false), instanced scenery, the player and traffic.
  //  * vehicles: parts are merged per material in the vehicle's own space and re-attached to the root, so the car still moves;
  //    wheel, steer and spin groups are separate owners, so wheels still bounce, steer and spin. Light materials are shared, so
  //    brake / reverse / hazard emissive changes still apply.
  var MERGE = hash.merge !== "0", CELL = 150;
  function isDynamic(o) { var u = o.userData; return !!(u && (u.animate || u.setOpen || u.wave || u.clips || u.camel || u.uniforms)); }
  function inv3t(e) { // inverse-transpose of the upper 3x3 of a column-major 4x4 → normal matrix (row-major 3x3 array)
    var a = e[0], b = e[4], c = e[8], d = e[1], f = e[5], g = e[9], h = e[2], i = e[6], j = e[10];
    var A = f * j - g * i, B = -(d * j - g * h), C = d * i - f * h, det = a * A + b * B + c * C; if (!det) det = 1e-9; var s = 1 / det;
    return [A * s, B * s, C * s, (c * i - b * j) * s, (a * j - c * h) * s, -(a * i - b * h) * s, (b * g - c * f) * s, -(a * g - c * d) * s, (a * f - b * d) * s];
  }
  function det3(e) { return e[0] * (e[5] * e[10] - e[6] * e[9]) - e[4] * (e[1] * e[10] - e[2] * e[9]) + e[8] * (e[1] * e[6] - e[2] * e[5]); }
  function mergeable(o, stats) {
    var m = o.material, geo = o.geometry;
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.isSprite || o.isPoints || o.isLine || o.frustumCulled === false || (o.morphTargetInfluences && o.morphTargetInfluences.length)) return null;
    if (!m || Array.isArray(m)) { stats.skipped["multi-material"] = (stats.skipped["multi-material"] || 0) + 1; return null; }
    if (m.isShaderMaterial || m.isRawShaderMaterial) { stats.skipped.shader = (stats.skipped.shader || 0) + 1; return null; }
    if (!geo || !geo.attributes.position) return null;
    var names = Object.keys(geo.attributes).sort(), sig = [];
    for (var i = 0; i < names.length; i++) { var a = geo.attributes[names[i]]; if (a.isInterleavedBufferAttribute || a.isInstancedBufferAttribute) { stats.skipped.interleaved = (stats.skipped.interleaved || 0) + 1; return null; } sig.push(names[i] + ":" + a.itemSize + (a.normalized ? "n" : "")); }
    return [m.uuid, o.castShadow ? 1 : 0, o.receiveShadow ? 1 : 0, o.renderOrder, sig.join(",")].join("|");
  }
  var attrClassCache = null;
  function attrClass(attr) {
    if (attrClassCache) return attrClassCache;
    var c = attr.constructor; while (c && c !== Function.prototype) { try { var t = new c(new Uint32Array(3), 1); if (t && t.isBufferAttribute && t.array instanceof Uint32Array && t.itemSize === 1) { attrClassCache = c; return c; } } catch (e) { } var n = Object.getPrototypeOf(c); if (!n || n === Function.prototype) break; c = n; }
    throw new Error("no BufferAttribute class found");
  }
  // merge `list` (same material/flags/layout); elementsOf(o) gives the 4x4 (column-major) placing o into the parent's space
  function buildMerged(list, elementsOf, parent, label, stats) {
    var first = list[0], fg = first.geometry, names = Object.keys(fg.attributes), totalV = 0, totalI = 0;
    list.forEach(function (o) { var p = o.geometry.attributes.position; totalV += p.count; totalI += o.geometry.index ? o.geometry.index.count : p.count; });
    if (totalV > 1500000) { stats.skipped["too-big"] = (stats.skipped["too-big"] || 0) + 1; return null; }
    var out = {}; names.forEach(function (nm) { var a = fg.attributes[nm]; out[nm] = { arr: new Float32Array(totalV * a.itemSize), size: a.itemSize, norm: a.normalized, ctor: a.constructor }; });
    var index = new Uint32Array(totalI), vOff = 0, iOff = 0;
    list.forEach(function (o) {
      var geo = o.geometry, e = elementsOf(o), nm3 = inv3t(e), flip = det3(e) < 0, p = geo.attributes.position, cnt = p.count;
      names.forEach(function (nm) {
        var a = geo.attributes[nm], dst = out[nm].arr, sz = out[nm].size;
        for (var k = 0; k < cnt; k++) {
          var x = a.getX(k), y = sz > 1 ? a.getY(k) : 0, z = sz > 2 ? a.getZ(k) : 0, j = (vOff + k) * sz;
          if (nm === "position") { dst[j] = e[0] * x + e[4] * y + e[8] * z + e[12]; dst[j + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; dst[j + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
          else if (nm === "normal") { var nx = nm3[0] * x + nm3[3] * y + nm3[6] * z, ny = nm3[1] * x + nm3[4] * y + nm3[7] * z, nz = nm3[2] * x + nm3[5] * y + nm3[8] * z, l = Math.hypot(nx, ny, nz) || 1; dst[j] = nx / l; dst[j + 1] = ny / l; dst[j + 2] = nz / l; }
          else { dst[j] = x; if (sz > 1) dst[j + 1] = y; if (sz > 2) dst[j + 2] = z; if (sz > 3) dst[j + 3] = a.getW(k); }
        }
      });
      var ic = geo.index ? geo.index.count : cnt;
      for (var t = 0; t < ic; t += 3) { var i0 = geo.index ? geo.index.getX(t) : t, i1 = geo.index ? geo.index.getX(t + 1) : t + 1, i2 = geo.index ? geo.index.getX(t + 2) : t + 2; if (flip) { var tmp = i1; i1 = i2; i2 = tmp; } index[iOff + t] = vOff + i0; index[iOff + t + 1] = vOff + i1; index[iOff + t + 2] = vOff + i2; }
      vOff += cnt; iOff += ic;
    });
    // attributes must be plain BufferAttributes over our typed arrays: typed subclasses (Float32BufferAttribute) would convert
    // the Uint32 index to floats, and the top of the chain is EventDispatcher. Find the class by trial, once.
    var AttrCtor = attrClass(fg.attributes.position);
    var geo2 = new fg.constructor(); names.forEach(function (nm) { geo2.setAttribute(nm, new AttrCtor(out[nm].arr, out[nm].size, out[nm].norm)); });
    geo2.setIndex(new AttrCtor(index, 1)); geo2.computeBoundingSphere(); geo2.computeBoundingBox();
    var mesh = new first.constructor(geo2, first.material); mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow; mesh.renderOrder = first.renderOrder; mesh.name = label + "_" + (first.material.name || "mat"); mesh.userData.mergedFrom = list.length;
    parent.add(mesh); list.forEach(function (o) { o.visible = false; o.userData.mergedInto = mesh; });
    stats.meshesMerged += list.length; stats.groups++; stats.vertices += totalV; return mesh;
  }
  function vehicleRoots(g) { var r = []; if (g.player && g.player.vehicle) r.push(g.player.vehicle.root); ((base && base.traffic) || g.traffic || []).forEach(function (c) { r.push(c.v.root); }); return r; }
  function mergeStatic(g) {
    var S = g.scene, t0 = performance.now(), stats = G.merge = { enabled: MERGE, meshesMerged: 0, groups: 0, candidates: 0, singles: 0, vertices: 0, ms: 0, skipped: {} };
    if (!MERGE) return stats;
    var ex = new Set(); var w = g.world || {};
    [w.scatter && w.scatter.root, w.rails, w.sea, w.waterfall && (w.waterfall.mesh || w.waterfall.obj || w.waterfall)].forEach(function (o) { if (o && o.isObject3D) ex.add(o); });
    vehicleRoots(g).forEach(function (r) { ex.add(r); }); (w.camels || []).forEach(function (c) { ex.add(c.obj); });
    var groups = new Map();
    (function walk(o, excluded) {
      if (ex.has(o) || isDynamic(o) || o.visible === false) excluded = true;
      if (!excluded && o.isMesh) { stats.candidates++; var k = mergeable(o, stats); if (k) { o.updateWorldMatrix(true, false); var e = o.matrixWorld.elements; k += "|" + Math.floor(e[12] / CELL) + "|" + Math.floor(e[14] / CELL); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); } }
      for (var i = 0; i < o.children.length; i++) walk(o.children[i], excluded);
    })(S, false);
    var n = 0; groups.forEach(function (list) { if (list.length < 2) { stats.singles++; return; } buildMerged(list, function (o) { return o.matrixWorld.elements; }, S, "Merged_" + (n++), stats); });
    stats.ms = Math.round(performance.now() - t0); G.log.push("merged " + stats.meshesMerged + " static meshes into " + stats.groups + " (" + stats.ms + " ms)"); return stats;
  }
  var ownerName = function (o) { var nm = o.name || ""; return nm.indexOf("Wheel") === 0 || nm === "Steer" || nm === "Spin"; };
  function mergeVehicle(g, root) {
    var stats = G.vehicles = G.vehicles || { enabled: MERGE, vehicles: 0, meshesMerged: 0, groups: 0, vertices: 0, ms: 0, skipped: {} };
    if (!MERGE || !root || root.userData.gfxMerged) return stats; var t0 = performance.now(); root.updateWorldMatrix(true, true);
    var groups = new Map();
    (function walk(o, owner, excluded) {
      if (o !== root && ownerName(o)) owner = o;
      if (isDynamic(o) || o.visible === false) excluded = true;
      if (!excluded && o.isMesh && o !== root) { var k = mergeable(o, stats); if (k) { k = owner.uuid + "|" + k; if (!groups.has(k)) groups.set(k, { owner: owner, list: [] }); groups.get(k).list.push(o); } }
      for (var i = 0; i < o.children.length; i++) walk(o.children[i], owner, excluded);
    })(root, root, false);
    var n = 0; groups.forEach(function (gr) {
      if (gr.list.length < 2) return; var inv = gr.owner.matrixWorld.clone().invert();
      buildMerged(gr.list, function (o) { return inv.clone().multiply(o.matrixWorld).elements; }, gr.owner, "VMerged_" + (n++), stats);
    });
    root.userData.gfxMerged = true; stats.vehicles++; stats.ms += Math.round(performance.now() - t0); return stats;
  }
  function mergeVehicles(g) { vehicleRoots(g).forEach(function (r) { mergeVehicle(g, r); }); if (G.vehicles) G.log.push("merged " + G.vehicles.meshesMerged + " vehicle parts into " + G.vehicles.groups + " across " + G.vehicles.vehicles + " vehicles (" + G.vehicles.ms + " ms)"); }
  // after merging: release the GPU buffers of original geometries that no visible mesh uses any more (the JS objects stay,
  // so nothing that still references them breaks; a geometry three.js needs again is simply re-uploaded)
  function releaseHiddenGeometries(g) {
    var used = new Set(), freed = 0, kept = 0; g.scene.traverse(function (o) { if (o.isMesh && o.visible && o.geometry) used.add(o.geometry); });
    var seen = new Set(); g.scene.traverse(function (o) { if (o.isMesh && o.userData.mergedInto && o.geometry && !used.has(o.geometry) && !seen.has(o.geometry)) { seen.add(o.geometry); try { o.geometry.dispose(); freed++; } catch (e) { kept++; } } });
    G.released = { geometriesFreed: freed, failed: kept }; G.log.push("released " + freed + " unused original geometries from the GPU");
  }
  function dedupeTextures(g) {
    var stats = G.textures = { enabled: MERGE, materials: 0, textureRefs: 0, uniqueSources: 0, duplicatesReplaced: 0, disposed: 0, bytesFreedEstimate: 0 };
    if (!MERGE) return stats;
    var mats = new Set(); g.scene.traverse(function (o) { if (o.material) [].concat(o.material).forEach(function (m) { mats.add(m); }); }); stats.materials = mats.size;
    var slots = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "alphaMap", "bumpMap"], canon = new Map(), replaced = new Set(), sources = new Set();
    mats.forEach(function (m) { slots.forEach(function (k) {
      var t = m[k]; if (!t || !t.image) return; stats.textureRefs++; var img = t.image, src = img.src || img.currentSrc; if (!src) { sources.add(t.source); return; }
      var key = [src, t.colorSpace, t.flipY, t.generateMipmaps, t.premultiplyAlpha, t.wrapS, t.wrapT, t.minFilter, t.magFilter, t.anisotropy, t.format, t.type, t.repeat.x, t.repeat.y, t.offset.x, t.offset.y, t.rotation].join("|");
      var c = canon.get(key); if (!c) { canon.set(key, t); sources.add(t.source); return; }
      if (c === t || c.source === t.source) return;
      m[k] = c; replaced.add(t); stats.duplicatesReplaced++;
    }); });
    stats.uniqueSources = sources.size;
    replaced.forEach(function (t) { var stillUsed = false; mats.forEach(function (m) { slots.forEach(function (k) { if (m[k] === t) stillUsed = true; }); }); if (!stillUsed) { try { var im = t.image; stats.bytesFreedEstimate += (im.width || 0) * (im.height || 0) * 4 * (t.generateMipmaps ? 1.33 : 1); t.dispose(); stats.disposed++; } catch (e) { } } });
    G.log.push("textures: " + stats.duplicatesReplaced + " duplicate refs → " + stats.disposed + " GPU textures freed (~" + (stats.bytesFreedEstimate / 1048576).toFixed(0) + " MB)"); return stats;
  }
  // --- public API + attach when the world exists
  G.set = function (name) { G.auto = false; return applyTier(name, "api"); };
  G.setAuto = function () { G.auto = true; applyTier(start, "auto"); };
  G.start = start; window.__gfx = G;
  function attach() {
    var g = window.__dg; if (!g || !g.ready || !g.renderer || !g.world) return false;
    remember(g); try { mergeStatic(g); mergeVehicles(g); dedupeTextures(g); releaseHiddenGeometries(g); } catch (e) { G.log.push("optimise failed: " + e.message); }
    if (!g.__gfxStartWrapped) { g.__gfxStartWrapped = true; var origStart = g.start.bind(g); g.start = function () { var r = origStart.apply(this, arguments); try { if (g.player && g.player.vehicle) mergeVehicle(g, g.player.vehicle.root); } catch (e) { G.log.push("vehicle merge failed: " + e.message); } return r; }; }
    wrapRender(g); installUI(g); applyTier(cur, "init"); attachedAt = performance.now(); if (G.debug) drawStats(); return true;
  }
  try { document.addEventListener("visibilitychange", function () { visChanged = performance.now(); last = 0; slowSince = 0; fastSince = 0; }); } catch (e) { }
  var tries = 0, timer = setInterval(function () { if (attach() || ++tries > 3000) clearInterval(timer); }, 200);
})();
