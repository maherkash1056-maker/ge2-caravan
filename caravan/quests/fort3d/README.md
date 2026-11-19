# Fort of Taqah — 3D view (`feat/fort-3d`) and 3D adventure (`feat/fort-3d-adventure`)

The Fort of Taqah quest (slot page `caravan/quests/fort.html`) now renders its stage as a real-time 3D scene: the fort on
its headland, an animated sea, raider dhows that sail in on three lanes, the rampart cannon that turns toward the raider
being answered, cannonballs, splashes, smoke, wall cracks and the Guardian's shield dome. Students can drag on the stage
to look around and use the wheel / pinch to zoom.

**Nothing about the game rules changed.** `fort.js` still owns every rule (waves of TRUE / FALSE / NOT GIVEN statements,
the Commander's combo and double shot, the Guardian's shield and lower damage, coins, the shop between waves, badges,
the result report through `caravan-bridge.js`). The 3D module only *reads* the game's state object once per frame. If
WebGL is unavailable, `fort.js` keeps drawing its painted 2D canvas exactly as before.

## Layout

| Path | What |
|---|---|
| `src/types.ts` | The slice of `F` the view reads (`raiders`, `shots`, `hit`, `wall`, `cur`, `shield`) and the `FortView` interface |
| `src/scene.ts` | Renderer, camera, lights, sky dome, fog, resize/dispose |
| `src/sea.ts` | Animated sea (vertex-shader waves, fresnel/specular fragment), `heightAt()` for ship bobbing |
| `src/materials.ts` | Procedural canvas textures (stone, plaster, rock, wood, sail, banners) and the shared materials |
| `src/fort.ts` | Headland, curtain wall, towers, gate, keep, palms, waving flag, aiming cannon, cracks, shield dome |
| `src/ships.ts` | Dhows per raider (hull, lateen sail, numbered banner, highlight ring), lanes, sinking/crash animations |
| `src/effects.ts` | Cannonballs timed to `fort.js`'s 560 ms shot, muzzle flash, splash, smoke, wall-hit burst + camera shake |
| `src/input.ts` | Pointer orbit (mouse / one finger), wheel and pinch zoom, drift back to the rest pose |
| `src/main.ts` | `window.FortView3D = { available(), mount(container, opts) }` and the per-frame sync |
| `build.js` | `tsc --noEmit` type-check + esbuild bundle → `dist/fort3d.js` (ignored by Git; ~600 KB minified IIFE incl. three.js r187) |
| `perf.js` | Frame-time / draw-call / heap probe, 2D vs 3D, desktop + Pixel 7 |

### How the two layers meet (`fort.js`)

* `start()` → `view3d()`: if `FortView3D.available()` the view is mounted into `.fstage` and the stage gets class `is3d`
  (CSS hides the 2D canvas, which still sizes the stage; the answer clips become a small inset instead of covering the scene).
* `loop()` → `F.view ? F.view.update(now, F) : draw(now)`.
* `check()` → `view3dOff()` before `finishGame()` (the WebGL context is released; "Play again" reloads the page).
* `keys()` → T / F / N (or 1 / 2 / 3) answer the current raider; ignored while the shop or the reading overlay is open.
* A raider whose `gone` flag is set with `x > 0` was shot (sinks when the ball lands); with `x <= 0` it reached the wall (crashes).

## Build

```bash
npm run build:fort3d      # type-check + bundle → caravan/quests/fort3d/dist/fort3d.js
npm run build:quests      # (runs the above, then) inlines the bundle into caravan/quests/fort.html
```

`caravan/quests/build.py` inlines `dist/fort3d.js` before `fort.js` when the file exists; without it the page is built
exactly as before (2D only).

## Tests

```bash
npm run test:fort         # tests/fort/acceptance.js — 20 checks in real Chromium (software WebGL)
npm run fort:perf         # caravan/quests/fort3d/perf.js
node tests/fort/preview.js  # playable local preview with stub questions (nothing saved, no exam used)
```

Acceptance covers: 3D mount and 2D canvas hidden; a wave of 5 dhows; correct answer → cannonball → splash → sinking;
wrong answer → wall −18, wall-hit effect, cracks; keyboard answers; a raider reaching the wall; wave cleared → shop → next
wave re-populates the sea; orbit drag does not answer; full play-through → "Keeper of Taqah" with exactly one result
posted to the class-server hook and the WebGL canvas removed; Pixel 7 layout, tap answers, one-finger orbit, drift back;
`--disable-webgl` → the painted 2D canvas plays unchanged.

## Measured (headless Chromium, software WebGL — not a GPU)

| Viewport | Layer | frame p50 / p90 | draw calls | triangles | JS heap |
|---|---|---|---|---|---|
| 1366×800 | 2D canvas | 16.7 / 16.7 ms | – | – | 10 MB |
| 1366×800 | 3D view | 66.7 / 83.3 ms | 117 | 27.9 k | 14 MB |
| Pixel 7 (dpr capped 1.5) | 2D canvas | 16.7 / 16.7 ms | – | – | 10 MB |
| Pixel 7 | 3D view | 66.7 / 83.3 ms | 115 | 27.9 k | 16 MB |

The 3D frame times above are SwiftShader (CPU) rasterisation of ~28 k triangles at 117 draw calls; that budget is small
for any real GPU, including integrated laptop graphics, but **it must be confirmed on the teacher's Windows PC** before
the lag question is considered answered. A `quality: "low"` path (no shadows, no antialiasing, pixel ratio 1) is taken
automatically on machines reporting ≤ 2 CPU cores.

## Checking on the Windows PC

1. `git checkout feat/fort-3d && npm install` (once), then `node tests/fort/preview.js`.
2. Open the printed URL in Chrome or Edge, pick a fort and a hero, do the reading check, then play.
3. Things to look at: smoothness while dhows sail and when the cannon fires; the small answer clip in the bottom-right
   corner of the stage (headless Chromium showed a dark rectangle mirrored at the top-right while the clip played — a
   software-compositing artifact to confirm absent on a real GPU); drag / wheel on the stage; T / F / N keys.
4. Open the same URL with Chrome's `--disable-webgl` flag to see the unchanged 2D fallback.

## Adventure mode (`fort_adventure.html`, branch `feat/fort-3d-adventure`)

A first-person version of the same game. `caravan/quests/build.py` builds `fort_adventure.html` from the same sources
with `window.FORT_MODE="adventure"`; `fort.js` then mounts `AdventureView` instead of the stage view and binds the
station glue (`advBind` / `advCard` / `advLane` / `advFront` at the end of `fort.js`). The classic 2D page and the
3D stage page are untouched fallbacks.

| Module | What |
|---|---|
| `src/colliders.ts` | axis-aligned solid boxes; per-axis movement with step-up (stairs), ground snapping, head bumps |
| `src/player.ts` | first-person controller: WASD/arrows, Shift run, Space jump, E interact, pointer-lock mouse look; touch: left joystick, right-half drag look, ✋ button |
| `src/world.ts` | the walkable fort: courtyard, stone staircase to the rampart, parapets, hollow keep with the reading room, market stall, well, boundaries, three cannon stations, station markers and prompts |
| `src/adventure.ts` | the view: player stepping (fixed 60 Hz sub-steps), station proximity → `onStation` / `onInteract`, raiders / shots / hits from `F`, `tick(dt, n)` for deterministic tests, `debug()` |

Rules in adventure mode (everything else is unchanged `fort.js`):
* The question card is only usable **at a cannon**; the west / middle / east cannon answers the raiders of its own lane.
  `pick()` selects the front raider of that lane. With no raider left in the lane the card says so.
* While the student stands at a cannon the raiders **hold position** (`F.hold`); the time pressure is the walk between
  cannons and the stairs. (Rule added for the adventure — flagged for the teacher's approval.)
* The text on the wall can be read at any cannon (it stays beside the question, as in the original), in the keep's
  reading room (station, no answer buttons) and anywhere with the 📖 Text button. The reading check before the game and
  the highlight questions are unchanged (`Caravan.reader`).
* Shop between waves, badges, result report: unchanged, they still appear as overlays.

Tests: `node tests/fort/adventure.js` — 24 checks (mount, gravity, walk/run/strafe, wall + keep collisions, doorway,
staircase climb, rampart parapets, jump, real key events, mouse look + pitch clamp, station prompts, lane-locked cannons,
firing, reading room, 📖 toggle, Pixel 7 landscape joystick + look drag, no-WebGL fallback to the classic page).
