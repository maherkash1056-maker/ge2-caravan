# caravan/rally — Khareef Rally 3D (slot 9)

Production slot 9 is **not** `quests/rally.html` (the 2D canvas quest). It is a separate 3D game ("Oman Road Quest"
codebase: three.js r187 ES-module bundle, embedded Tajawal fonts, a `RALLY_BRIDGE` adapter) that was built outside this
repository. Its readable source, build pipeline and asset-worker generator were never committed; the bundle has no source map. This folder holds the byte-exact backup made
on 2026-11-18 and a remastered generator for its asset worker.

| Path | What |
|---|---|
| `/rally3d/index.html` | **the source of slot 9** (teacher's folder, from the project archive). `publish.sh`'s bug-catcher injection turns it into the production page byte for byte. |
| `/rally3d/adapter.html` | the `RALLY_BRIDGE` adapter: `window.RALLY_BRIDGE = {exam, result, parseHash}` |
| `/rally3d/tex_s/` | the 32 assets the texture worker serves (colour/normal/roughness textures, sprite PNGs). The 42 `.glb` model names the bundle mentions do not exist on the worker: every model is built procedurally in the bundle (`sM` table, no glTF loader). See `MANIFEST.json` → `phantom_model_paths`. |
| `recovered/Slot-9-Khareef-Rally.html` | the live page as served on 2026-11-18, identical in the n8n "GE2 App" table (part 9) and the Cloudflare page store — the backup to compare against |
| `recovered/MANIFEST.json` | sources, retrieval time, SHA-256 of every file |
| `build_worker.py` | remastered generator: rebuilds `worker.mjs` (gitignored) for the texture worker from `rally3d/tex_s`, same paths, content types, CORS and the same listing answer for unknown paths; `--check` verifies hashes |
| `docs/CONTRACT.md` | Phase 2B: the behaviour contract of the shipped game (bridge, session, questions, results, progress, gameplay, discrepancies, unverified) |
| `docs/content.json` + `extract_content.js` | the educational content extracted verbatim from the bundle; `--check` guards sync |
| `docs/TEST-PLAN.md` | acceptance tests (`tests/rally/`), desktop + Android QA matrix, performance and touch |
| `docs/ARCHITECTURE.md` | preserve-vs-reconstruct list and the proposed TypeScript + three.js source layout with a 2D fallback |
| `docs/RISKS.md` | localStorage-only progression, public PIN pepper, live debug hooks, and proposed solutions |
| `check_slot9.py` | guard: accepts `build/outputs/Slot-9-Khareef-Rally.html` only if it is `rally3d/index.html`, the production backup, or another 3D build; refuses the 2D quest |

## How slot 9 talks to the platform
- Session from the Studio hash `#play&s=TOKEN~ID~ROLE~NAME~SHORT&x=SRC.LEN.TITLE` (same format as `caravan-bridge.js`), parsed by the adapter.
- `RALLY_BRIDGE.exam()` → `POST {kind:"exam", skills:["r_abc","r_word"], len, game:"Khareef Rally", prompt…}` to the API worker, or `{kind:"bank"}` for `x=bank.N` / `x=mine`.
- `RALLY_BRIDGE.result()` → `POST {kind:"result", type:"Quest", exam:"Khareef Rally", right, total, grade, score: right*10 + stones*20, won: final && pct>=60, skills, weakest, badges}`; posted every 10 answered items and at the finish.
- Nothing else leaves the page: no Supabase, no n8n, no websockets. Only `ge2-caravan-api` (results/exams) and `ge2-caravan-rally` (assets).
- Progress, XP, coins, owned vehicles and badges live in `localStorage["orq_ge2_v1"]`; best time in `orq_best`. These are per device and are not the class-server XP.
- Offline mode: with no session the game runs from a built-in pool of road-sign questions.

## Do not
- Edit `recovered/*`: it is the backup. Changes to the game go in `rally3d/` (or a new source tree) and must keep the adapter contract above.
- Commit `worker.mjs`: generated, gitignored.
- Deploy from here: `build_worker.py` only builds.
