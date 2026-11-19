// Portable paths for the GE2 Caravan build + test scripts.
// Replaces the old fixed locations (/mnt/user-data/outputs, /home/claude, /tmp) that only existed on one machine.
//   CARAVAN_OUT  where built pages go           default <repo>/build/outputs
//   CARAVAN_TMP  where screenshots/dumps go     default <repo>/build/tmp
// Both folders are gitignored (the /* whitelist in .gitignore) and created on first use.
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(process.env.CARAVAN_OUT || path.join(ROOT, "build", "outputs"));
const TMP = path.resolve(process.env.CARAVAN_TMP || path.join(ROOT, "build", "tmp"));
for (const d of [OUT, TMP]) fs.mkdirSync(d, { recursive: true });
const STUDIO = path.join(OUT, "GE2-Game-Studio-CLASS-n8n.html");   // output of caravan/build_class.py
module.exports = {
  ROOT, OUT, TMP, STUDIO,
  shot: (name) => path.join(TMP, name),   // screenshot path (was /tmp/<name>)
  tmp: (name) => path.join(TMP, name),    // any other dump (was /tmp/<name>)
  requireStudio() {                        // clear message instead of ENOENT
    if (!fs.existsSync(STUDIO)) { console.error("UNVERIFIED: Studio build missing at " + STUDIO + " — run `npm run build:studio` first."); process.exit(3); }
    return STUDIO;
  }
};
