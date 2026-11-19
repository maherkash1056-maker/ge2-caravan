#!/usr/bin/env node
// Playable local preview of The Big Shopping Run with a STUB class server (nothing saved, no exam used).
// Run: node tests/shopping/preview.js   then open the printed URL in Chrome / Edge (or on a phone on the same network).
const http = require("http"), fs = require("fs"), path = require("path");
const H = require("./harness.js");
const srv = H.start(); srv.srv.close();
const GAMES = path.join(__dirname, "..", "..", "caravan", "games");
http.createServer((q, r) => { const rel = q.url.split("?")[0].slice(1) || "shopping.html"; const f = path.join(GAMES, rel); if (!f.startsWith(GAMES) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end("no"); }
  let html = fs.readFileSync(f, "utf8"); if (/\.html$/.test(f)) html = html.replace("<head>", '<head><script>window.CARAVAN_HOOK="http://127.0.0.1:8897/hook";</script>');
  r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("content-security-policy", "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads"); r.end(html); }).listen(8899);
console.log("The Big Shopping Run preview (stub class server, nothing is saved):\n  http://127.0.0.1:8899/shopping.html" + H.HASH + "\n  http://127.0.0.1:8899/shopping.html        (no session: built-in questions, no result)\nCtrl+C stops the servers.");
