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
  var frames = 0, last = 0, ema = 0, slowSince = 0, fastSince = 0, fpsN = 0, fpsT = 0, attachedAt = 0;
  function wrapRender(g) {
    if (g.__gfxWrapped) return; g.__gfxWrapped = true; var orig = g.render.bind(g);
    g.render = function () {
      var now = performance.now(); frames++;
      var t = TIERS[cur]; if (t.shadowEvery > 1 && g.renderer.shadowMap.enabled) g.renderer.shadowMap.needsUpdate = (frames % t.shadowEvery) === 0;
      orig();
      if (last) { var dt = now - last; if (dt < 4000) { ema = ema ? ema * 0.9 + dt * 0.1 : dt; G.stats.ms = +ema.toFixed(1); fpsN++; fpsT += dt; if (fpsT >= 1000) { G.stats.fps = Math.round(fpsN * 1000 / fpsT); fpsN = 0; fpsT = 0; var inf = g.renderer.info; G.stats.calls = inf.render.calls; G.stats.tris = inf.render.triangles; if (G.debug) drawStats(); } } }
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
  // --- public API + attach when the world exists
  G.set = function (name) { G.auto = false; return applyTier(name, "api"); };
  G.setAuto = function () { G.auto = true; applyTier(start, "auto"); };
  G.start = start; window.__gfx = G;
  function attach() {
    var g = window.__dg; if (!g || !g.ready || !g.renderer || !g.world) return false;
    remember(g); wrapRender(g); installUI(g); applyTier(cur, "init"); attachedAt = performance.now(); if (G.debug) drawStats(); return true;
  }
  try { document.addEventListener("visibilitychange", function () { last = 0; slowSince = 0; fastSince = 0; }); } catch (e) { }
  var tries = 0, timer = setInterval(function () { if (attach() || ++tries > 3000) clearInterval(timer); }, 200);
})();
