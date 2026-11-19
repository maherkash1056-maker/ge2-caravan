# Khareef Rally 3D — what to preserve, what to reconstruct, and the proposed source architecture

## 1. Preserve vs reconstruct
The original source is lost; only the minified bundle exists. "Preserve" below means *carry over unchanged* (data or small
self-contained code that can be lifted verbatim); "reconstruct" means *re-author to the contract* because the minified code is
not maintainable.

| Area | Verdict | How |
|---|---|---|
| Bridge adapter (`rally3d/adapter.html`) | **Preserve** | Readable source. Becomes `src/bridge/adapter.ts` with the same exported functions and payloads; `tests/rally/adapter.test.js` is the oracle. |
| Educational content (25 landmark questions, texts, cutscenes, 16 checkpoint items, 10 radio clips, 12 signs) | **Preserve** | `docs/content.json` becomes `src/content/*.json`, loaded, never edited by code. `content.test.js` guards it. |
| Game rules (XP amounts, 2-of-3, penalty, fuel constants, tank caps, level, shop prices, result cadence) | **Preserve as a spec** | CONTRACT.md §2 and the acceptance tests; the code is rewritten but the numbers are table-driven. |
| Quiz UI (panel, options, one-word matcher `Y1`/`bh`, timer, focus trap) | **Reconstruct** | Small, well understood (≈ 2.5 KB minified); rewrite in TS with the same DOM ids so the tests keep working. |
| Shop, book, intro, finish panels | **Reconstruct** | HTML templates in the bundle are readable; port to components. |
| Save/load (`orq_ge2_v1`) | **Preserve the schema**, reconstruct the code | Same key and `v:1` shape so students' current progress survives the first release; R1 changes come later as a versioned migration. |
| Car physics (`fh`, tuning `cm`) | **Reconstruct** | 10 KB of minified rigid-body code; readable enough to port, but it must be re-tuned against recorded runs (see QA). |
| World generation (terrain, road spline, scatter, colliders, traffic, herds, sea, waterfall shaders) | **Reconstruct** | Largest part. Keep the same place distances and object positions (§2.3) so the content placement is identical. |
| Procedural models (vehicles, buildings, signs, trees, stones) | **Reconstruct or replace** | Procedural builders are minified; the 42 phantom `.glb` names show real models were intended. Decision needed: port the builders or commission glTF models. |
| three.js | **Preserve** | Pin r187 (the shipped revision). |
| Audio synth, speech, haptics | **Reconstruct** | Small; pre-recorded radio clips recommended (RISKS R7). |
| Debug hooks | **Reconstruct behind a flag** | Needed by tests; stripped from production. |
| Fonts (Tajawal) | **Preserve** | Move from inline base64 to the asset worker. |

## 2. Proposed source layout (TypeScript + three.js, 2D fallback)
```
rally3d/                       ← stays the deploy folder (index.html is the built page; adapter.html, tex_s/ as today)
src/rally/
  bridge/adapter.ts            RALLY_BRIDGE: exam, result, parseHash (contract §1)
  content/{landmarks,checkpoints,radio,signs,vehicles,upgrades,badges}.json
  core/                        renderer-agnostic game rules — NO three.js imports
    state.ts                   S schema v1, load/save, newRun, migrations
    rules.ts                   XP, fuel, level, grade helpers (pure functions, unit-tested)
    quiz.ts                    pools, examToItems, ask/visit/checkpoint/sign/stranded/radio/finish (returns events, UI injected)
    world-data.ts              place distances, checkpoint/sign/stone/hazard positions (§2.3)
  ui/                          DOM: panel, hud, shop, book, intro, touch pads, a11y (same element ids as today)
  render3d/                    three.js: scene, terrain, road, scatter, vehicles, camera, fx, audio
  render2d/                    canvas fallback: top-down map driven by the same core (lineage: quests/rally.js)
  input/                       keyboard, touch, gamepad → {throttle, brake, steer, handbrake}
  physics/                     car model + tuning tables
  main.ts                      feature detection → picks render3d or render2d; wires core + ui + input
tests/rally/                   adapter.test.js, content.test.js, acceptance.js, mobile.js (existing), + unit tests per core module
tools/                         build (esbuild/vite → single HTML with inline module, like today), extract_content, size budget
```
Principles: the **core never touches three.js or the DOM**, so the 2D fallback and the unit tests run the same rules; the UI keeps
today's element ids (`#qpanel`, `.qopt[data-i]`, `#qans`, `#qgo`, `#qcont`, `[data-v]`, `#tgas`…) so the acceptance tests are
the regression suite for the rebuild; the output is still **one HTML file per slot** with inline module + adapter, because that
is what n8n's table and the file worker store.

2D fallback: `main.ts` checks `canvas.getContext("webgl2") || getContext("webgl")`, `OES`/texture limits and a 2-second
frame-time probe; on failure or `?v=2d` it loads `render2d` (a modernised `quests/rally.js` map with the same stops, same quiz,
same bridge). Same save key, same results.

Build: TypeScript strict, esbuild to ES2020 module, three.js r187 pinned, size budget enforced in CI (< 600 KB gzipped page,
fonts and models external), source maps kept in the repo (never shipped), `publish.sh` unchanged (it only injects the bug catcher).

## 3. Delivery and sequencing (for Phase 2C planning, not started)
1. Scaffold + core rules + quiz with the existing DOM ids → acceptance tests A06–A19 green against the new build with
   `render2d` only.
2. 3D renderer: terrain, road, car, camera, stops → M01–M06 green; side-by-side runs against the shipped bundle on the same
   inputs (recorded key sequences) to compare progress and fuel curves.
3. World dressing, traffic, herds, hazards, audio.
4. Production hardening: strip hooks, R1 key-by-student, size budget, device QA sign-off, then the normal publish loop.
