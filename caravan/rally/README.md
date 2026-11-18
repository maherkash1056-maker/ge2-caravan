# caravan/rally — Khareef Rally 3D (slot 9)

Production slot 9 is **not** `quests/rally.html` (the 2D canvas quest). It is a separate 3D game ("Oman Road Quest"
codebase: three.js r187 ES-module bundle, embedded Tajawal fonts, a `RALLY_BRIDGE` adapter) that was built outside this
repository. Its readable source, build pipeline and asset-worker generator were never committed; the bundle has no source map. This folder holds the byte-exact backup made
on 2026-11-18 and a remastered generator for its asset worker.

| Path | What |
|---|---|
| `recovered/Slot-9-Khareef-Rally.html` | the live page, identical in the n8n "GE2 App" table (part 9) and the Cloudflare page store |
| `recovered/rally_bridge_adapter.js` | script block 3 of that page: `window.RALLY_BRIDGE = {exam, result, parseHash}` |
| `recovered/tex/**` | all 32 real assets the texture worker serves (colour/normal/roughness textures, sprite PNGs). The 42 `.glb` model names the bundle mentions do not exist on the worker: every model is built procedurally in the bundle (`sM` table, no glTF loader). See `MANIFEST.json` → `phantom_model_paths`. |
| `recovered/MANIFEST.json` | sources, retrieval time, SHA-256 of every file |
| `build_worker.py` | remastered generator: rebuilds `worker.mjs` (gitignored) for the texture worker from `recovered/tex`, same paths, content types, CORS and the same listing answer for unknown paths; `--check` verifies hashes |
| `check_slot9.py` | guard: refuses a `build/outputs/Slot-9-Khareef-Rally.html` that is the 2D quest instead of a 3D build |

## How slot 9 talks to the platform
- Session from the Studio hash `#play&s=TOKEN~ID~ROLE~NAME~SHORT&x=SRC.LEN.TITLE` (same format as `caravan-bridge.js`), parsed by the adapter.
- `RALLY_BRIDGE.exam()` → `POST {kind:"exam", skills:["r_abc","r_word"], len, game:"Khareef Rally", prompt…}` to the API worker, or `{kind:"bank"}` for `x=bank.N` / `x=mine`.
- `RALLY_BRIDGE.result()` → `POST {kind:"result", type:"Quest", exam:"Khareef Rally", right, total, grade, score: right*10 + stones*20, won: final && pct>=60, skills, weakest, badges}`; posted every 10 answered items and at the finish.
- Nothing else leaves the page: no Supabase, no n8n, no websockets. Only `ge2-caravan-api` (results/exams) and `ge2-caravan-rally` (assets).
- Progress, XP, coins, owned vehicles and badges live in `localStorage["orq_ge2_v1"]`; best time in `orq_best`. These are per device and are not the class-server XP.
- Offline mode: with no session the game runs from a built-in pool of road-sign questions.

## Do not
- Edit `recovered/*`: it is the backup. Changes go in a new source tree.
- Commit `worker.mjs`: generated, gitignored.
- Deploy from here: `build_worker.py` only builds.
