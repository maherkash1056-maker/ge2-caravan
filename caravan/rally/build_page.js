#!/usr/bin/env node
// Builds the Khareef Rally page: caravan/rally/src/base.html (the recovered, untouched bundle) + verified string patches on
// the minified module + the graphics layer caravan/rally/src/perf.js inlined before the module.
// Writes rally3d/index.html (the slot 9 source) and build/outputs/Slot-9-Khareef-Rally.html. publish.sh is unchanged.
//   node caravan/rally/build_page.js            build
//   node caravan/rally/build_page.js --check    verify rally3d/index.html equals a fresh build (CI)
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..", ".."), SRC = path.join(__dirname, "src");
const base = fs.readFileSync(path.join(SRC, "base.html"), "utf8");
const perf = fs.readFileSync(path.join(SRC, "perf.js"), "utf8");

// Each patch must match exactly once in the base; the build fails otherwise so a changed bundle cannot be silently half-patched.
const PATCHES = [
  { why: "pixel ratio is chosen by the graphics layer instead of a fixed min(dpr,2)",
    find: 'Gi.setPixelRatio(Math.min(devicePixelRatio,2));',
    replace: 'Gi.setPixelRatio(window.__GFX?window.__GFX.pixelRatio():Math.min(devicePixelRatio,2));' },
  { why: "MSAA is a context-creation flag; low tiers start without it (it cannot be changed later)",
    find: 'Gi=new zc({canvas:Sm,antialias:!0,powerPreference:"high-performance"});',
    replace: 'Gi=new zc({canvas:Sm,antialias:window.__GFX?window.__GFX.antialias():!0,powerPreference:"high-performance"});' },
  { why: "sun shadow map size and the phone pixel-ratio override come from the graphics layer",
    find: 'i.shadow.mapSize.set(r?1024:2048,r?1024:2048),r&&this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)),',
    replace: 'i.shadow.mapSize.set(window.__GFX?window.__GFX.shadowSize():(r?1024:2048),window.__GFX?window.__GFX.shadowSize():(r?1024:2048)),window.__GFX?this.renderer.setPixelRatio(window.__GFX.pixelRatio()):r&&this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)),' },
];
let html = base;
for (const p of PATCHES) { const n = html.split(p.find).length - 1; if (n !== 1) throw new Error(`patch "${p.why}" matched ${n} times (expected 1)`); html = html.replace(p.find, p.replace); }
const marker = '<script type="module">';
if (html.split(marker).length !== 2) throw new Error("expected exactly one module script");
html = html.replace(marker, '<script>/* GFX LAYER — generated from caravan/rally/src/perf.js by caravan/rally/build_page.js */\n' + perf + '\n</script>\n' + marker);
const sha = crypto.createHash("sha256").update(html).digest("hex");
const outs = [path.join(ROOT, "rally3d", "index.html"), path.join(process.env.CARAVAN_OUT || path.join(ROOT, "build", "outputs"), "Slot-9-Khareef-Rally.html")];
if (process.argv.includes("--check")) { const cur = fs.readFileSync(outs[0], "utf8"); if (cur !== html) { console.error("rally3d/index.html differs from a fresh build — run node caravan/rally/build_page.js"); process.exit(1); } console.log("rally3d/index.html is up to date (" + sha.slice(0, 12) + ")"); process.exit(0); }
for (const o of outs) { fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, html); }
console.log(`built ${outs.map(o => path.relative(ROOT, o)).join(" and ")}: ${html.length} chars, sha ${sha.slice(0, 12)}, ${PATCHES.length} patches, perf layer ${perf.length} chars`);
