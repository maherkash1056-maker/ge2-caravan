#!/usr/bin/env node
// Extracts the educational content and game tables from rally3d/index.html WITHOUT altering them.
// The bundle is minified; its data lives in object literals (xh, vd, Io, bd, Md, wd, Sd, _h, Ed, vh). Each literal is
// located by bracket matching and evaluated as data in an empty VM (no DOM, no network), then written to docs/content.json.
//   node caravan/rally/extract_content.js          → writes caravan/rally/docs/content.json
//   node caravan/rally/extract_content.js --check  → exits 1 if docs/content.json differs from a fresh extraction
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..", ".."), SRC = path.join(ROOT, "rally3d", "index.html"), OUT = path.join(__dirname, "docs", "content.json");
const html = fs.readFileSync(SRC, "utf8");
const mod = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => /module/.test(m[1])).map(m => m[2])[0];
if (!mod) throw new Error("module script not found in " + SRC);
function matchFrom(i, open, close) { let d = 0, q = null, esc = false; for (let k = i; k < mod.length; k++) { const c = mod[k]; if (q) { if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'" || c === "`") { q = c; continue; } if (c === open) d++; else if (c === close) { d--; if (d === 0) return k + 1; } } return -1; }
function literal(name, open) { const close = open === "[" ? "]" : "}"; const re = new RegExp("(?:^|[,;{}\\s])" + name.replace("$", "\\$") + "=\\" + open); const m = re.exec(mod); if (!m) throw new Error("literal not found: " + name); const s = m.index + m[0].length - 1; const e = matchFrom(s, open, close); return vm.runInNewContext("(" + mod.slice(s, e) + ")", {}, { timeout: 2000 }); }
const content = {
  generated_from: { file: "rally3d/index.html", sha256: crypto.createHash("sha256").update(html).digest("hex"), extractor: "caravan/rally/extract_content.js" },
  note: "Verbatim data from the shipped bundle. Keys are the bundle's own: landmarks=xh, stone_order=_h, photo_landmarks=Ed, offline_checkpoints=vd, radio=Io, road_signs=bd, vehicles=Md, upgrades=wd, badges=Sd, vehicle_keys=vh. The exam prompt sent to the class server is in rally3d/adapter.html (function prompt).",
  landmarks: literal("xh", "["), stone_order: literal("_h", "["), photo_landmarks: literal("Ed", "["),
  offline_checkpoints: literal("vd", "["), radio: literal("Io", "["), road_signs: literal("bd", "["),
  vehicles: literal("Md", "["), upgrades: literal("wd", "["), badges: literal("Sd", "["), vehicle_keys: literal("vh", "{"),
};
const json = JSON.stringify(content, null, 1) + "\n";
if (process.argv.includes("--check")) { const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""; if (cur !== json) { console.error("content.json is out of date with rally3d/index.html — run node caravan/rally/extract_content.js"); process.exit(1); } console.log("content.json matches rally3d/index.html"); process.exit(0); }
fs.writeFileSync(OUT, json); console.log("wrote", path.relative(ROOT, OUT), "landmarks", content.landmarks.length, "checkpoints", content.offline_checkpoints.length, "radio", content.radio.length, "signs", content.road_signs.length, "vehicles", content.vehicles.length, "upgrades", content.upgrades.length, "badges", content.badges.length);
