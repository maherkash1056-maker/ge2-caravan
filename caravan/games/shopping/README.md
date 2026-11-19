# The Big Shopping Run — slot 12 (`feat/shopping-run`)

A pixel-art platformer for the GE2 Caravan: Ahmed or Maryam runs through the Khareef hills (world 1) and the desert
night (world 2) to fill Mum's shopping basket. Grammar questions are asked by the blue **A?** blocks, at every
checkpoint flag, at locked bonus pipes, at castle gates and when striking a boss. Ten levels, two bosses (Scorpion King,
Sandstorm Djinn), power-ups (super date, frankincense fire, golden khanjar, falcon cape, a rideable camel).

The page was supplied by the teacher as a single HTML file that was cut off inside the drawing code. Everything up to
that point is the original (split into modules, three bugs fixed); the rest of the engine was rebuilt here.

## Layout

| Path | What |
|---|---|
| `src/teacher_hook.js` | the `window.BOLT_QUESTIONS` override comment (teacher's own questions) |
| `src/style.css` | page styles + the portrait "turn your phone" hint |
| `src/body.html` | canvas, touch pads, overlays (title, map, intro/story, clear, over, ask, pause) |
| `src/art.js` | all pixel art, generated in code (heroes, enemies, bosses, tiles, decorations) — original |
| `src/levels.js` | seeded chunk-based level generator, bonus rooms, decoration layer — original |
| `src/questions.js` | the built-in grammar bank (38 items with hints and skill ids) — original |
| `src/game.js` | engine: input, physics, entities, blocks, questions, bosses, pipes, flag — original, patched (see below) |
| `src/game_tail.js` | **rebuilt**: boss/item/player/particle drawing, weather, HUD, story screens, world map, title, pause, Caravan result report, boot, `window.__sr` test handle |
| `build.py` | assembles `caravan/games/shopping.html` and `build/outputs/Slot-12-Big-Shopping-Run.html` (bridge `caravan-bridge.js` inlined, like the other games) |

## What changed against the supplied file

Fixes
* Drop-through on one-way planks was wired but disabled (`p.dropping=…&&false`): **Down + Jump** now drops through.
* Questions: the page POSTed `kind:"questions"` to the class server, a request the server does not know. It now uses the
  Caravan bridge: the built-in grammar bank always works (no exam used); a teacher bank via `window.BOLT_QUESTIONS`; and when
  the Caravan page opens the game with an `x=` setup (bank / "mine" / Claude with a length), the bridge exam's A-B-C
  questions are used first. The game never calls Claude on its own.
* Results: `bridgeResult()` did not exist. One `Caravan.report` per cleared level (and on game over) with right/total,
  the per-skill heat-map (passive, modals, cause/result, sequencing, contrast, tenses, agreement, vocabulary…) and badges
  `shopping_<item>`, `gate_<boss>`, `souq_hero`.
* HUD lives/basket text no longer sits under the pause button.
* The student's name is taken from the Caravan session when present (no need to type it).

Rebuilt / added
* Weather: khareef drizzle and mist in world 1, blowing sand in world 2, embers in castles and bonus rooms.
* Story pages with pixel scenes (intro, mountain pass, half basket, souq gate, ending), world map with basket progress,
  best scores and lock state, title screen with animated hero previews, pause menu with sound toggle.
* Portrait phones get a "turn your phone sideways" hint; the on-screen pads already support multi-touch (run + jump).

Rules kept exactly as supplied: a player who runs past three A? blocks without answering loses a life; checkpoint
questions allow three tries; castle gates need 2 of 3; bosses are struck by stomping and answering.

## Build, test, preview

```bash
npm run build:shopping     # → caravan/games/shopping.html + build/outputs/Slot-12-Big-Shopping-Run.html
npm run test:shopping      # tests/shopping/acceptance.js (Chromium: desktop keyboard, Pixel 7 landscape touch, no-session play)
node tests/fort/preview.js # (any quest) — for this game open caravan/games/shopping.html directly, or through the Studio Play tab once published
```

Local preview with a stub class server: `node tests/shopping/preview.js` prints the URL (stub questions, nothing saved).

## Slot 12 in the platform

* n8n serves `?p=12` from the "GE2 App" table like every other slot (the workflow reads the part number from the query;
  no workflow change). `publish.sh`, `verify_live.py` and the smoke test list the new slot file.
* The Studio Play tab (`studio/class_template.html`) lists the game next to the other quests.
* Nothing has been published: that needs the teacher's approval (`publish.sh` deploys the file worker and syncs n8n).
