#!/usr/bin/env node
// Syntax check for every page and script in the repo — the README rule "syntax-check every inline <script>" made repeatable.
// Inline classic scripts are compiled with vm.Script; inline module scripts and standalone .js/.mjs files go through `node --check`.
// Nothing is executed. Exit 1 on the first file with a syntax error (all files are still reported).
const fs = require("fs"), path = require("path"), vm = require("vm"), { spawnSync } = require("child_process");
const P = require("./paths.js");
const R = p => path.join(P.ROOT, p);
const PAGES = [
  "studio/class_template.html", "studio/shell.html", "caravan/runsheet.html", "caravan/gallery/index.html",
  "caravan/games/two_windows.html", "caravan/games/legends.html", "caravan/games/royale_host.html", "caravan/games/royale_play.html",
  "caravan/games/snake_host.html", "caravan/games/snake_play.html", "caravan/games/two_windows_orig.html", "caravan/games/legends_orig.html",
  "caravan/quests/fort.html", "caravan/quests/rally.html", "caravan/quests/dhow.html",
  "caravan/rally/recovered/Slot-9-Khareef-Rally.html",   // production 3D rally backup (Phase 2A)
  "rally3d/index.html", "rally3d/adapter.html",           // slot 9 source + adapter (teacher's folder)
].map(R).concat(fs.existsSync(P.STUDIO) ? [P.STUDIO] : []);
const SCRIPTS = [];
for (const d of ["caravan/games", "caravan/games/art", "caravan/quests", "caravan/quests/art", "caravan/project", "caravan/writing", "caravan/server", "caravan/api", "caravan/worker", "caravan/supa", "studio", "tests", "tests/rally", "caravan", "caravan/rally"])
  for (const f of fs.readdirSync(R(d))) if (/\.(js|mjs)$/.test(f) && f !== "bugcatch.js") SCRIPTS.push(path.join(d, f));
SCRIPTS.push("caravan/bugcatch.js"); // an HTML snippet: checked as an inline script below

let bad = 0, total = 0;
const scratch = path.join(P.TMP, "syntax"); fs.mkdirSync(scratch, { recursive: true });
function nodeCheck(file) { const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" }); return r.status === 0 ? null : (r.stderr || r.stdout).trim().split("\n").slice(0, 3).join(" | "); }
function checkInline(label, html) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, n = 0, errs = [];
  while ((m = re.exec(html))) {
    const attrs = m[1], src = m[2]; if (/\bsrc\s*=/.test(attrs)) continue;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || "";
    if (type && !/javascript|module/i.test(type)) continue;          // importmap, json, templates
    n++;
    try {
      if (/module/i.test(type)) { const tmp = path.join(scratch, path.basename(label) + "." + n + ".mjs"); fs.writeFileSync(tmp, src); const e = nodeCheck(tmp); if (e) throw new Error(e); }
      else new vm.Script(src, { filename: label + "#script" + n });
    } catch (e) { errs.push("script#" + n + ": " + String(e.message).split("\n")[0].slice(0, 200)); }
  }
  return { n, errs };
}
for (const f of PAGES) {
  if (!fs.existsSync(f)) { console.log("SKIP  " + path.relative(P.ROOT, f) + " (missing)"); continue; }
  const { n, errs } = checkInline(f, fs.readFileSync(f, "utf8")); total += n;
  if (errs.length) { bad++; console.log("FAIL  " + path.relative(P.ROOT, f) + "  " + errs.join("; ")); } else console.log("ok    " + path.relative(P.ROOT, f) + "  (" + n + " inline scripts)");
}
for (const s of SCRIPTS) {
  total++; let e;
  if (s.endsWith("bugcatch.js")) { const r = checkInline(s, fs.readFileSync(R(s), "utf8")); e = r.errs.join("; ") || null; }
  else e = nodeCheck(R(s));
  if (e) { bad++; console.log("FAIL  " + s + "  " + e.slice(0, 200)); } else console.log("ok    " + s);
}
console.log(`\n${bad ? "FAIL" : "PASS"}: ${total} scripts checked, ${bad} file(s) with syntax errors`);
process.exit(bad ? 1 : 0);
