#!/usr/bin/env node
// Playable local preview of Fort of Taqah with STUB questions (no production call, no exam used, nothing saved).
// Run: node tests/fort/preview.js   then open the URL it prints in Chrome / Edge.
// The page is the shipped caravan/quests/fort.html served under n8n's sandbox CSP; only the class-server URL is pointed
// at the stub on :8897 (one injected line), exactly as the Playwright tests do.
const http = require("http"), fs = require("fs"), path = require("path");
const H = require("./harness.js");
const srv = H.start();                       // stub hook :8897 + plain page server :8899
srv.srv.close();                             // replace the page server with one that injects the stub hook URL
const Q = path.join(__dirname, "..", "..", "caravan", "quests");
http.createServer((q, r) => { const rel = q.url.split("?")[0].slice(1) || "fort.html"; const f = path.join(Q, rel); if (!f.startsWith(Q) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end("no"); }
  let html = fs.readFileSync(f, "utf8"); if (/\.html$/.test(f)) html = html.replace("<head>", '<head><script>window.CARAVAN_HOOK="http://127.0.0.1:8897/hook";</script>');
  r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(html); }).listen(8899);
console.log("Fort of Taqah preview (stub questions, nothing is saved):\n  3D adventure (first person): http://127.0.0.1:8899/fort_adventure.html" + H.HASH + "\n  3D stage (classic rules):    http://127.0.0.1:8899/fort.html" + H.HASH + "\nAdventure: click the view to capture the mouse, WASD / arrows move, Shift runs, Space jumps, E interacts, Esc frees the mouse.\nPhone: left joystick moves, drag on the right half looks, ✋ interacts. Ctrl+C stops the servers.");
