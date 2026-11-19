#!/usr/bin/env node
// Type-checks and bundles the Fort of Taqah 3D view (TypeScript + three.js r187) into dist/fort3d.js (one minified IIFE).
// caravan/quests/build.py inlines dist/fort3d.js into fort.html before fort.js. Run: node caravan/quests/fort3d/build.js
const { execFileSync } = require("child_process"), path = require("path"), fs = require("fs");
const ROOT = path.resolve(__dirname, "..", "..", ".."), here = __dirname;
execFileSync(path.join(ROOT, "node_modules/.bin/tsc"), ["-p", here, "--noEmit"], { stdio: "inherit" });
require(path.join(ROOT, "node_modules/esbuild")).buildSync({
  entryPoints: [path.join(here, "src/main.ts")], bundle: true, minify: true, format: "iife", target: ["es2019"], legalComments: "none",
  outfile: path.join(here, "dist/fort3d.js"), banner: { js: "/* Fort of Taqah 3D view — built from caravan/quests/fort3d/src (TypeScript + three.js r187) by caravan/quests/fort3d/build.js */" },
});
const out = fs.readFileSync(path.join(here, "dist/fort3d.js")); console.log("dist/fort3d.js", out.length, "bytes");
