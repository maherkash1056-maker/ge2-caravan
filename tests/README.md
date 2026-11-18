# GE2 Caravan — local build & tests (Phase 1 tooling)

Dev-only tooling. Nothing here changes a game, the class server, the bridge protocol or any deployment.

## One-time
```bash
npm install            # pins playwright 1.63.0 (dev only). Needs Node ≥ 22 and a Chromium for Playwright.
```
If Playwright has no browser yet: `npx playwright install chromium` (do **not** do this on a machine that already provides one via `PLAYWRIGHT_BROWSERS_PATH`).

## Paths
Old fixed locations (`/mnt/user-data/outputs`, `/home/claude`, `/tmp`) are gone. Everything is relative to the repo:

| Variable | Default | Holds |
|---|---|---|
| `CARAVAN_OUT` | `build/outputs/` | built slot pages (`GE2-Game-Studio-CLASS-n8n.html`, `Slot-N-….html`) |
| `CARAVAN_TMP` | `build/tmp/` | screenshots, dumps, `logs/`, `results.json` |

`build/` is ignored by Git (whitelist in `.gitignore`). `tests/paths.js` is the single source of truth for Node; `caravan/build_class.py`, `caravan/publish.sh` and `caravan/verify_live.py` read the same variables.

## Commands
```bash
npm run build:studio   # studio/class_template.html → build/outputs/GE2-Game-Studio-CLASS-n8n.html
npm run build:quests   # regenerates caravan/quests/{fort,rally,dhow}.html from their parts (should be byte-identical to Git)
npm run test:syntax    # parse every inline <script> and every .js/.mjs — runs nothing
npm run test:local     # all offline Playwright scripts + the page smoke test, one at a time
npm run test:live      # production tests: BLOCKED unless CARAVAN_LIVE=1 — only with explicit authorisation
```
Results: console table, `build/tmp/results.json`, one log per test in `build/tmp/logs/`.

## Verdicts
`PASS` exit 0 and no `PAGEERROR` · `PASS-WARN` exit 0 but a page threw · `FAIL` non-zero exit or timeout · `UNVERIFIED` prerequisite missing (usually the Studio build) · `BLOCKED` production test, not authorised.

The existing scripts were written to be read by a person: they print what they see and exit 0. The runner adds the exit-code/`PAGEERROR` verdict on top; it does not change what the scripts do.

## Local vs live
| Tier | Scripts | Needs |
|---|---|---|
| local, committed HTML only | `quests/uitest.js`, `quests/uitest_d.js`, `games/uitest_classgames.js` | — |
| local, needs `build:studio` | `games/uitest_studio.js`, `uitest_bank.js`, `uitest_read.js`, `uitest_full.js`, `uitest_full2.js`, `writing/uitest_writing.js`, `games/dumpprompt.js`, `tests/smoke_pages.js` | Studio build |
| **live** (production Durable Objects, each creates a room) | `games/uitest_snake.js`, `server/snaketest.js`, `wstest2.js`, `wstest3.js`, `wstest.mjs` | `CARAVAN_LIVE=1` + authorisation |
| live, n8n | `caravan/verify_live.py <rows.json>` | n8n `get_data_table_rows` export of the "GE2 App" table |

Helpers not run automatically: `caravan/games/validate40.js <exam.json>`.

`tests/smoke_pages.js` aborts every request that is not to 127.0.0.1 and lists the hosts each page tried to reach, so it cannot touch n8n, Supabase or Cloudflare. The older `uitest_*` scripts point the class-server URL at the local stub but do not block other outbound requests.

## Publishing (unchanged behaviour, portable paths)
`bash caravan/publish.sh` now runs from its own folder and reads the 11 slot files from `CARAVAN_OUT`; it still needs `caravan/secrets/cf_account` and `cf_token` and still deploys to Cloudflare — never run it as a test.
