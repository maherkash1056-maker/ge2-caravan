# Khareef Rally 3D — behaviour contract (as shipped, 2026-11-18)

Scope: slot 9, `rally3d/index.html` (SHA-256 `a3612afe…`, production copy `c134823b…`). Everything below was read from the
shipped bundle (`caravan/rally/extract_content.js` pulls the data verbatim; `tests/rally/*` exercise the behaviour) and
nothing was changed. Where a statement could not be confirmed it is marked **UNVERIFIED** and listed again in §9.

Vocabulary: *S* = the saved game state (`localStorage["orq_ge2_v1"]`); *session* = the Studio token parsed from the page hash;
*Td* = "a session is present" (`!!Do.s`); *cap* = tank capacity for the current vehicle.

## 1. The bridge: `window.RALLY_BRIDGE`

Defined in `rally3d/adapter.html` (script block 3 of the page). It is the **only** path between the game and the platform.
It exposes exactly three functions: `exam(Do)`, `result(Do, S, items, final)`, `parseHash()`.

### 1.1 Session format (page hash)
The Studio opens slot 9 as `…?p=9#play&s=TOKEN~ID~ROLE~NAME~SHORT[&x=SRC.LEN.TITLE]`.

| Piece | Rule | Example |
|---|---|---|
| `s=` | `TOKEN~ID~ROLE~NAME~SHORT`, URL-encoded names. Token ≥ 8 chars and ID present, else no session. ROLE defaults to `student`. | `studenttoken12345~000S0000~student~Salwa%20Malik~Salwa` |
| `x=` | `SRC.LEN.TITLE`. `claude` needs a numeric LEN or it counts as absent. `bank.N` = a saved exam of N questions. `mine.0.TITLE` = the student's own exam by title. | `x=bank.25.` |
| `name=` | Appended once by the adapter at load (`history.replaceState`) with the SHORT name, used as the name on photos. | `&name=Salwa` |
| `api=` / `group=` | Read into the game's `Do` config. `api` only changes the game's own unused `post()`; **the adapter's API URL is hard-coded** (`https://ge2-caravan-api.ge2-caravan.workers.dev/`), so `window.CARAVAN_API` and `api=` do not redirect exams or results. | |

### 1.2 Question delivery (`exam`)
Called once when the player starts with "Fresh from Claude" selected. Transport: `POST` to the API worker, body JSON,
`content-type: text/plain;charset=UTF-8`, `keepalive: true`. The reply is parsed as JSON; failures throw.

| Source | Request body |
|---|---|
| default / `x=claude.N` | `{kind:"exam", token, student:NAME, device:"GAME", prompt:<rally prompt>, images:[], fast:false, skills:["r_abc","r_word"], len:N\|15, style:true, awl:true, game:"Khareef Rally"}` |
| `x=bank.N` | `{kind:"bank", token, data:{skills:["r_abc","r_word"], len:N}}` → uses `reply.spec` |
| `x=mine.0.TITLE` | `{kind:"bank", token, data:{title:TITLE}}` → uses `reply.spec` |

The rally prompt (full text in `adapter.html`, function `prompt`) asks for one 220–300-word reading text about the Salalah–Mirbat
road and exactly N questions split between `abc` (3 options) and `word` (one word or number, `/`-separated alternatives), each
with `evidence` and `why`. The reply `text` may contain junk around the JSON; the first `{…}` block is used. `toGame` normalises
`questions|qs`, `options|opts`, `answer|a`, `evidence|ev`.

Inside the game, `examToItems` keeps `abc|mcq` and `one|short|table|box|gap|note|word` items. **`tfng`, `head` and any other type
are dropped**, so a bank exam built for the Studio can arrive with fewer usable items. Each item's reading `text` is its `evidence`,
or the first three sentences of the exam text if evidence is empty. Claude items are **prepended** to the shuffled built-in pool
only if at least 4 survived; otherwise the game says "Using the built-in question pack". Fixed content (landmark stops, radio,
road signs) never comes from Claude.

### 1.3 Result payload (`result`)
Posted with `kind:"result"` and the session token, `student:NAME`, `device:"GAME"`, `type:"Quest"`, `exam:"Khareef Rally"`, plus:

| Field | Rule |
|---|---|
| `right`, `total` | over the `items` passed (only the items not yet posted) |
| `grade` | pct ≥ 90 A, ≥ 80 B, ≥ 70 C, ≥ 60 D, else F |
| `score` | `right × 10`, plus `stones × 20` only when `final` |
| `won` | `final && pct ≥ 60` (never true for interim posts) |
| `skills` | one entry per skill id: `{id, name, r, n}`; names exist for `r_abc` ("A, B or C questions") and `r_word`/`r_one` ("One word or a number"); any other id (`g_sign`, `l_abc`, `l_one`) is passed through as its own name |
| `weakest` | name of the skill with the lowest r/n among those with at least one wrong, else `""` |
| `badges` | first 6 badge ids from S |

**Cadence.** `record()` posts every time the count of recorded answers reaches a multiple of 10 (`final:false`); every landmark
visit ends with a post (`final:false`); `finish()` posts once with `final:true`. Without a session nothing is posted. A failed
post is logged with `console.warn` and **not retried**; `lastPosted` is only advanced on success, so the next post carries the
backlog.

### 1.4 Progress handling (localStorage only — and probably not even that in production)
**Under n8n's sandbox CSP the page has an opaque origin and every `localStorage` access throws `SecurityError`.** The game
wraps `save()`/`load()` in `try/catch`, so saving silently does nothing and every page load starts from a fresh state
(`tests/rally/acceptance.js` A03 and A17b reproduce this with the header the repo's own tests use for n8n). The n8n workflow
that serves `/webhook/ge2-studio-app` (`OXFN4kytbvWiKwuV`, node "Send the page") sets only `Content-Type` and `Cache-Control`;
the `sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads` header is n8n's platform default for HTML
webhook responses, which is why the Studio carries the session in the hash and uses `lsGet/lsSet` with fallbacks. Reading the
live header needs one production request and has not been done (§9). If confirmed, "progress" below means *per page load*.

`orq_ge2_v1` holds one JSON object, accepted only if `v === 1`:
`{v, name, xp, coins, veh, owned[], upg{}, fuel, stones[], photos[], badges[], results[], radioRight, gates{}, started, source, chapterDone, pos, time, penalty, pr, done}`.
Saved on every event (answer, XP, badge, buy) and every 4 s of driving. `orq_best` holds the best finish time in seconds.
"New run" (intro) and "Drive again" (finish) keep `xp, coins, owned, upg, badges, veh` and reset everything else. The key has
**no student id**: on a shared phone the next student continues the previous one's run (see RISKS.md).

## 2. Gameplay as shipped

### 2.1 Vehicles and garage
Showroom (`#garage`): a 3D catalogue with "Drive this one" / "🪙 cost · Buy". In-game shop (`__quiz.shop()`, HUD button): the
four keyed vehicles and the four upgrades; 1 coin = 1 XP earned; a purchase deducts coins and switches vehicle, keeping fuel at
least 30 % of the new tank.

| id (shop key) | cost | top speed | off-road grip | tank | note |
|---|---|---|---|---|---|
| pickup (`pickup`) | 0 | 100 % | 55 % | 100 | start vehicle |
| fourx (`suv`) | 300 | 110 % | 90 % | 120 | |
| saloon (`saloon`) | 600 | 135 % | 40 % | 110 | |
| bus (`minibus`) | 1000 | 90 % | 50 % | 160 | XP × 1.5 |
| camel | 150 | 60 % | 75 % | ∞, fog-proof | **unreachable**: no shop key, never offered |

Upgrades: tyres 200 (off-road grip × 1.3; description says +40 %), tank 250 (cap × 1.5), radio 300 (radio XP 20 and one replay),
lights 350 (fog visibility × 2).

### 2.2 Driving
Rigid-body car with four sprung wheels, per-vehicle tuning, surfaces (road / sand / water), rails along drops, traffic in both
directions, camel herds, sea. Controls: W/↑ throttle, S/↓ brake (and reverse once stopped), A/D or ←/→ steer, Space handbrake, C camera (Chase → Hood → Top),
R recover to road, M toggles the synthesised audio on/off. Touch pads `#tl #tr #tgas #tbrk #thb` appear on coarse-pointer devices. Gamepad:
axis 0 steer, buttons 7/6 throttle/brake, 0/1 handbrake, 3 camera, 9 recover. Recovery is automatic after 1.2 s in the sea,
2.5 s upside down, or leaving the world bounds. Audio is synthesised (engine, skid, gravel, wind, chimes); questions on the radio
are spoken by `speechSynthesis` in en-GB when available, otherwise shown as a ticker.

### 2.3 The road (Salalah → Mirbat)
Places with welcome toasts 80 m before: Salalah (0), Taqah (km 6), Wadi Darbat (km 11), Jabal Samhan (km 21), Mirbat (end).
Start arch at 42 m (the first stone, Al Baleed); finish arch 70 m before the end. Checkpoints at 330, 1000, 1600, 2300, 2760 m
(60 s cooldown after use). Road-sign barriers at 930 (`taqah_road`) and 2200 m (`samhan_road`). Roadside photo stones at 560,
km 14+30, km 21+60 and km 27 (lateral offsets), reached by stopping within 18 m. Hazards: rockfall at km 18+70, roadworks at
km 26+30 (traffic slows to walking pace), camel herds that cross when the player is 30–170 m away. The HUD says Mirbat is "3 km east".

### 2.4 Knowledge Stops (the five stones)
Stop at a stone gate → the landmark text (verbatim, `content.json → landmarks`) → "I have read it" → its 3 questions one at a time,
each with the text beside it. Every right answer +10 XP. **≥ 2 of 3** → stone found: +50 XP, badge `stone_<id>`, three-panel
cutscene (`scene`), toast "n/5 stones found". Otherwise "Roadworks delay": **+15 s** penalty and the stop can be retried.
All five → badge `road`, `chapterDone`, toast "Road of Frankincense".

### 2.5 Photo mode (four roadside stones)
Razat, Tawi Atayr, Dawkah, Sumhuram: first 2 of the landmark's questions. Both right → +20 XP, photo in the album, polaroid with
the player's name (a snapshot of the scene, or the landmark icon if the renderer cannot snapshot). One wrong → "The photo is blurry",
retry after 25 s (10 s if the player backed out). All four → badge `photo` (its description wrongly says 10 landmarks).
Mughsail exists in the content with 2 questions but is **not placed on the road**: unreachable.

### 2.6 Checkpoints, signs, radio, fuel
* Checkpoint: a notice + one pool question. Right → fuel + 35 % of cap (capped) and +10 XP; wrong → nothing.
* Road sign: a gap-fill from the 12 signs with a first-letter hint; right → gate opens (`gates[id]`), +10 XP; wrong → car is put
  back 55 m and the sign can be tried again with another sign.
* Radio: first clip 22 s after the start, then 30–50 s after each question. The clip is spoken (or shown); the question comes
  14 s after the clip ends or when passing a place, with a **40 s** timer; right → +10 XP (+20 with the radio upgrade, which also
  allows one replay); 5 right → badge `radio`; wrong → the script is shown.
* Fuel: `100 / 1300` units per metre, × 1.5 off-road, none on the camel. At 0 the throttle is cut; when the car stops, the
  "Out of fuel" question: right → 30 % of cap, +10 XP; wrong → 12 % of cap.

### 2.7 Scoring, XP, levels, badges, completion
XP = coins (1:1). Level = `floor(xp / 200) + 1`. The server score is computed separately by the adapter (§1.3). Badges: 5 stones,
`road`, `photo`, `radio`; `scan` ("Fact Finder") and `camel` ("Caravan Rider") exist in the table and the book hides them: **no
code path awards them**. Finish: crossing the finish arch → time = race time + penalties, best time stored, final panel with
"Drive again" (new run, progression kept) or "Keep exploring"; the final result is posted either way.

### 2.8 One-word answer matching (`Y1`)
Lower-case, apostrophes removed, non-alphanumerics to spaces, articles `the/a/an` removed, trimmed. A typed answer matches if it
equals any accepted alternative, or if a number word (zero … twelve, fifteen, twenty … ninety, hundred, thousand) equals the
other's digits, or if the digits-only form of both match. No fuzzy matching: "frankincens" ≠ "frankincense".

### 2.9 Accessibility and languages
The question panel is `role=dialog aria-modal` with focus trapping and Enter to answer. UI labels are English with Arabic
second (`ce()`), fonts Tajawal embedded. Haptics on answer (25 ms right, 50-40-50 wrong).

## 3. Educational content
`caravan/rally/docs/content.json`, generated verbatim from the bundle (`node caravan/rally/extract_content.js`, `--check` in CI):
10 landmarks (5 stones × 3 questions + 5 others × 2 = 25 questions, texts of 82–104 words), 16 built-in checkpoint items
(text + question), 10 radio clips (5 A/B/C, 5 one-word listening), 12 road-sign gap-fills, vehicles, upgrades, badges.
The Claude exam prompt is in `rally3d/adapter.html`.

## 4. Debug hooks the bundle exposes (used by the tests)
`window.__ready`, `__quiz` (the quiz object: `visit, checkpoint, sign, stranded, startRadio, radioQuestion, shop, book, finish,
ask, record, S, pool, save`), `__dg` (the game: `car, progressS, active`), `__drive(vehicle)`, `__driveTo(s, lat, cam)`,
`__skipIntro`, `__pause`, `__show`, `__cam`, `__freeCam`, `__roadCam`, `__light`, `__exportAll`, `__tris`, `__dbg`. They are
reachable by any student from the console.

## 5. Page structure quirks (verified)
* The file is two HTML documents nested: an outer `<!doctype html><html><head>…<style/></head><body>` wrapping a complete inner
  document. Browsers tolerate it; the syntax checker counts 3 inline scripts (fonts, adapter, module).
* The bundle names 42 `.glb` models that do not exist on the worker; the worker answers with its JSON listing and the bundle
  builds every model procedurally, so those requests are wasted but harmless.
* The quiz panel, shop and book work in the garage before any driving.

## 6. Discrepancies between text and code (do not "fix" silently in a rebuild; decide)
| Where | Says | Code does |
|---|---|---|
| tyres upgrade | +40 % speed on sand | grip × 1.3 |
| photo badge | "Photos of all 10 landmarks" | awarded at 4 photos |
| intro | "answer 3 questions, win a stone" | needs 2 of 3 |
| badges table | scan, camel | never awarded |
| vehicles table | camel | not purchasable |
| HUD | "Mirbat is 3 km east" | level length in the bundle is in simulation metres; the HUD "To Mirbat" counter divides by 1000 |

## 7. Dependencies (what must stay unchanged)
* **n8n**: serves the page (`?p=9`) under its sandbox CSP; the page never calls n8n.
* **Cloudflare**: `ge2-caravan-api` (exam, bank, result), `ge2-caravan-rally` (32 textures, CORS), `ge2-caravan-files`
  (deploy copy). No websockets.
* **Supabase**: reached only through the API worker; the Edge Function's `exam`, `bank`, `result` kinds and their field names.
* **Studio**: the `#play&s=…&x=…` hash format shared with `caravan-bridge.js`.
* **Student accounts**: token + id from the hash only; the game never sees PINs.

## 8. What a rebuild must reproduce exactly
§1.1–1.4 byte-for-byte (payloads, cadence, grade bands, score, won, badge cap of 6), the 25 landmark questions and texts, the
offline packs, the XP amounts (10 / 50 / 20 / 10 / 10 / 10 / 10-20), the ≥ 2-of-3 and 2-of-2 rules, the 15 s penalty, the fuel
constants, tank caps, level formula, and the new-run semantics. Everything else is a product decision.

## 9. UNVERIFIED behaviour (cannot be confirmed from the recovered bundle or in headless Chromium)
1. Real-device frame rate and thermal behaviour on the class's Android phones; headless uses software WebGL.
2. Speech synthesis voices on students' phones (voice list, Arabic/English mix, autoplay policies); headless has no voices,
   so the radio falls back to the ticker.
3. Whether the audio toggle (M) persists across runs (it is not in the saved state, so presumably not).
4. The exact metre-to-km scale of the world (`h(km)` positions and the "3 km" HUD text use a 1000 divisor on a level whose
   length is not a round number) and the exact positions of the Taqah, Darbat, Samhan and Mirbat stone gates (list `T`).
5. Autopilot (`autopilotInput`) exists but no trigger for enabling it was found.
6. The exact response headers of the live `/webhook/ge2-studio-app?p=9` (whether n8n really adds the sandbox CSP in production). One
   HEAD request would settle it; it was not made (no production access without authorisation).
7. Behaviour under n8n's sandbox CSP for `speechSynthesis`, `vibrate` and gamepads on real phones.
8. The texture worker's cache headers and what happens on a slow 3G first load (textures resolve the promise on error, so the
   scene renders untextured, but this was not observed on a throttled connection).
9. Any server-side handling of `type:"Quest"` results (XP, badges, "won") is in the Edge Function, outside this contract.
