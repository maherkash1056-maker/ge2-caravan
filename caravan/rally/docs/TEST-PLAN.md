# Khareef Rally 3D — acceptance tests and QA plan

All tests target the **shipped** game (`rally3d/index.html`) and encode its behaviour as it is, not as it should be. They are
the regression oracle for any rebuild: a rebuild that keeps the same DOM ids and the same `RALLY_BRIDGE` must pass them unchanged.
Commands: `npm run test:rally` (all four), or individually below. All run offline; the class server is a stub on `:8897`, the
page is served on `:8899` with n8n's sandbox CSP, textures come from `rally3d/tex_s`, every other host is aborted. The adapter's
hard-coded production API URL is rewritten to the stub in the served copy only.

## 1. Automated suites

| Suite | Runner | What it proves | Status (2026-11-19, this container) |
|---|---|---|---|
| `tests/rally/adapter.test.js` (11 tests) | `node --test`, adapter run in a VM with a fake window | §1 of CONTRACT.md: hash parsing, `name=` append, exam/bank/mine requests, prompt, tolerant reply parsing, result payload, grade bands, score, won, badge cap, skills/weakest, no-session/no-items rules | PASS 11/11 |
| `tests/rally/content.test.js` (5 tests) | `node --test` | `docs/content.json` equals a fresh extraction from the bundle; 10 landmarks / 5 stones / 4 photo / Mughsail orphan; 25 questions, valid keys; 16 checkpoint, 10 radio (5 abc + 5 one-word), 12 signs; vehicles, upgrades, badges, shop key map | PASS 5/5 |
| `tests/rally/acceptance.js` (21 scenarios) | Playwright, headless Chromium | gameplay and integration, below | PASS 21/21 (see final run log) |
| `tests/rally/mobile.js` (7 checks + build-time INFO) | Playwright device emulation | touch, keyboard, layout, fuel, first stop | PASS 7/7 (fps = INFO) |

Filters: `node tests/rally/acceptance.js A06 A13`, `node tests/rally/mobile.js M01`.

### Acceptance scenarios (`acceptance.js`)
| Id | Scenario | Key assertions |
|---|---|---|
| A01 | Page load | garage renders, ≥1 WebGL canvas, no page error, no host but the texture worker, no class-server call before start |
| A02 | Intro with session | "Fresh from Claude" checked + "Built-in question pack"; name prefilled from the hash |
| A03 | Real Drive path | world builds (INFO: build time), intro, exactly one `exam` POST with the contract fields, pool = usable Claude items (tfng dropped) + 16, HUD shown, in-memory state, **localStorage throws under the sandbox** |
| A04 | `x=bank.25.` | one `bank` POST with `{skills, len:25}` |
| A05 | No session | no network call, built-in pack, no source choice |
| A06 | Knowledge Stop 3/3 | verbatim text, 3 questions, stone, badge, +80 XP, 3 cutscene captions verbatim, result POST (Quest / Khareef Rally / 3/3 / A / 30 / not won / skills / badges) |
| A07, A07b | Knowledge Stop 1/3 and 2/3 | +15 s penalty, no stone / stone with 2 of 3 |
| A08 | Photo mode | 2/2 → album + 40 XP + polaroid; 1/2 → blurry |
| A09 | Checkpoint | +35 % of tank, +10 XP, capped; wrong → nothing |
| A10 | Road sign | first-letter hint, case/space tolerant, gate stored; wrong keeps closed |
| A11 | One-word matcher | number words ↔ digits, articles, apostrophes, alternatives, no fuzzy match |
| A12 | Out of fuel | right → 30 % of tank, wrong → 12 % |
| A13 | Radio | label states, 40 s timer, +10/+20 XP, Radio Star at 5, script shown on a wrong answer |
| A14 | Garage | 4 vehicles (no camel), prices, disabled when poor, buying deducts and switches, fuel clamp rule, upgrades, tank cap 180, level formula |
| A15 | Finish | final POST score right×10 + stones×20, won at ≥ 60 %, run marked done; new-run keeps progression |
| A16 | Result cadence | posts at 10 and 20 answers, each with only the new items (`lastPosted`) |
| A17 | Persistence without the sandbox | reload → Continue with stones/XP; New run keeps XP, clears stones; saved to `orq_ge2_v1` |
| A17b | Persistence under the sandbox | nothing survives a reload, no page error, no Continue |
| A18 | Teacher session | result carries the teacher token and name |
| A19 | Rally book | stones, album, 8 visible badges, per-skill bars |

### Device checks (`mobile.js`)
Headless Chromium renders this scene with software WebGL at ~0.5–1.5 fps, so the car is driven by calling the game's own
`update(1/60)` by hand (deterministic, no rendering). Each device gets one context and one world build (10–20 s here).

| Id | Device | Check |
|---|---|---|
| M01 | Pixel 7 portrait | pads visible; GAS pad sets `touch.gas`, moves the car; BRAKE stops within 1 s, then reverses when held |
| M01b | Pixel 7 portrait | HUD, fuel, pads, minimap inside the viewport; no horizontal overflow |
| M02 | Galaxy S9+ landscape 740×360 | HUD fits; LEFT + GAS changes heading |
| M06 | Desktop | driving into the start arch opens the Al Baleed stop by itself; pads ignored while a question is modal |
| M05 | Desktop | fuel = distance × 100 / 1300 on the road (±5 %), also while coasting |
| M03 | Desktop | pads hidden; ArrowUp key registers and moves; C cycles Chase → Hood → Top; M toggles audio; R recovers |
| M04 | Desktop | frame-rate sample, **INFO only** |

## 2. Manual QA matrix (to run on real devices before any rebuild is approved for class)
Devices: the teacher's phone, two student Android phones (one low-end, one recent), one iPhone, one laptop (Chrome + Edge).
Network: college Wi-Fi and 4G. Open from the Studio Play tab (real hash, real n8n sandbox), not from a file.

| # | Check | Pass criterion |
|---|---|---|
| Q1 | First load time on 4G | garage visible < 8 s; "Building the Dhofar road…" < 15 s |
| Q2 | Frame rate while driving (chase camera), 2 minutes | ≥ 25 fps median on the recent phone, ≥ 15 on the low-end; no thermal throttling message |
| Q3 | Touch pads | GAS/BRAKE/steer/handbrake respond with one finger each; two pads at once (gas + steer) work |
| Q4 | Orientation | portrait and landscape both usable; rotating mid-question keeps the panel readable |
| Q5 | Speech | radio clip is heard in English; if not, the ticker shows the script |
| Q6 | Persistence | close the tab, reopen from the Studio: is "Continue" offered? (expected **no** under n8n's sandbox; record what happens) |
| Q7 | Results | after one Knowledge Stop, the teacher tab shows a "Quest · Khareef Rally" result for the student |
| Q8 | Daily limit | the 13th exam of the day shows the built-in pack message, not an error |
| Q9 | Text size | question text readable at arm's length on the low-end phone (≥ 16 px rendered) |
| Q10 | Out-of-fuel, sea splash, upside-down recoveries | each recovers within 3 s without a reload |
| Q11 | Back button / tab switch | returning to the tab resumes; keys are not stuck |
| Q12 | Offline | with Wi-Fi off after load: game continues with the built-in pack; results are posted when back online (expected: lost — record) |

## 3. Performance budget for the rebuild (to be measured with the same M04 sample on real devices)
Page ≤ 600 KB gzipped, textures and fonts on the asset worker, ≤ 42 wasted requests → 0, first interactive ≤ 5 s on 4G,
≥ 30 fps on the teacher's phone with shadows on, ≥ 20 fps with shadows off on the low-end phone, no frame > 100 ms during a stop.

## 4. Known limits of this plan
Headless numbers are floors; speech, haptics and gamepads are stubbed by the browser; the live n8n header is assumed from the
repo's own emulation (CONTRACT §9.6); the Edge Function's handling of `type:"Quest"` is outside these tests.
