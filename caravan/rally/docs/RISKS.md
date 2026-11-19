# Khareef Rally 3D — risks and proposed solutions (no migration or auth change implemented)

## R1. Progress lives only in `localStorage` — and under n8n's sandbox it does not persist at all
**Facts.** Under the sandbox CSP that n8n applies to HTML webhook responses (the header the repo's own tests emulate; the
serving workflow adds no header of its own), `localStorage` throws and the game's `try/catch` turns every save into a no-op:
each page load is a brand-new run, XP and coins restart at zero, bought vehicles vanish, and "Continue" is never offered.
Verified in tests A03/A17b against the emulated header; the live header itself is unverified (CONTRACT §9.6). Where storage
does work (a page opened outside n8n), the facts below apply. `orq_ge2_v1` (state) and `orq_best` (best time) are per browser profile on one device. The key carries no student id.
The server receives only `result` posts; XP, coins, vehicles, upgrades and badges inside the game are never sent anywhere
(the result carries at most 6 badge ids).

**Consequences.**
* A student who changes phone, clears the browser, or uses a private tab starts from zero; on iOS Safari script-writable
  storage can be evicted after 7 days without use.
* Two students on one phone share one run: the second continues the first one's stones, XP and coins, and the next
  `result` post goes out under the second student's token with the first student's badges.
* Anything in the state can be edited from the console (`__quiz.S.coins = 9999`); the game's XP and coins are therefore
  cosmetic and must never be used for grading. The server-side XP computed from `result` posts is the one that counts.
* A failed `result` post is not retried until the next post; if the student closes the tab after the final post fails, that
  run's results are lost.

**Proposed solutions (for approval; none implemented).**
0. *Confirm the live header* (one HEAD request, with authorisation). If the sandbox is confirmed, client-side storage cannot be the
   answer at all and option 2 (server mirror through the existing `result`/`profile` calls) becomes the only durable one.
1. *Key by student*: `orq_ge2_v1:<ID>` with a one-time copy of the legacy key for the first student who opens it. Client-only,
   no server change, removes the shared-phone leak. Smallest step.
2. *Server mirror through the existing protocol*: include a compact progress blob in the existing `result` payload (e.g.
   `game_state`) and read it back from the existing `profile` call. Needs one additive field in the Edge Function and no schema
   change if stored in an existing JSON column; to be designed in Phase 2C, not now.
3. *Retry queue*: keep unposted `items` in the saved state and post them on the next start (`lastPosted` already exists).
4. *Grading rule*: document that only Edge Function XP is authoritative (already true), and strip game XP from any teacher view.

## R2. The PIN pepper is public
**Facts.** `PEPPER = "ge2-caravan-2026-dhofar"` is committed in `caravan/sha.js` and `caravan/supa/caravan/index.ts`, and the
README says a copy lives in n8n Code nodes. The repository is **public** on GitHub. PINs are 4 digits (the README's example is
`1357`), hashed as `sha256(PEPPER + "|" + ID + "|" + PIN)` and stored in the roster (`pin_hash`).

**Consequences.** Anyone holding a roster export (n8n "GE2 Roster" table, a leaked `roster_rows.json`) can recover every PIN
offline: 10 000 SHA-256 hashes per student, milliseconds. The pepper adds nothing once it is public; it is a salt at best.
The teacher ID `MAHERKASHOOB` is also committed, which pairs a known account with a 4-digit secret.

**Mitigations already in place.** PINs are only ever checked server-side; the token, not the PIN, travels with the game; the
Edge Function rate-limits exams per day (not login attempts: **UNVERIFIED**).

**Proposed solutions (for approval; none implemented, none change authentication now).**
1. Move the pepper to a Supabase function secret (`PEPPER` env, like `ANTHROPIC_API_KEY`) and remove it from the repo and the
   n8n Code nodes. Requires the n8n login path to stop hashing PINs itself (or to call the Edge Function for it).
2. Rotate: new pepper + slow hash (PBKDF2 or scrypt via Web Crypto in Deno) + per-student random salt, re-hashing each student
   **on their next successful login** so no bulk migration or PIN reset is needed. Keep the old verifier only for that step.
3. Add server-side login throttling (per ID and per IP) in the Edge Function; it already tracks `device` and `last_seen`.
4. Make the repository private, or at minimum confirm the public setting is intentional, since the handoff note calls it private.
5. Treat the roster tables as secrets in backups and exports (they are already gitignored).

## R3. Debug hooks are live in production
`window.__quiz`, `__drive`, `__driveTo`, `__skipIntro`, etc. let any student skip the intro, teleport to the finish, call
`visit()` repeatedly, or set coins. Results still flow through `record()`, so a student can post 10 "right" answers from the
console. Proposal: strip the hooks in the production build (keep them behind a build flag for tests) and have the Edge Function
sanity-check `result` rates per token.

## R4. Unreachable and mis-described features
Camel vehicle, `scan` and `camel` badges, Mughsail content, the tyres and photo-badge descriptions (CONTRACT.md §6). Risk: a
rebuild "fixes" them without a decision and changes the game students know. Proposal: a one-page decision list signed off before
Phase 2C.

## R5. Page size and delivery
1.06 MB in an n8n table row, re-served through two workers; 52 KB of fonts inline; 42 wasted model requests per load. Proposal:
budget the rebuild (bundle < 600 KB gzipped, models and fonts on the asset worker with long cache, no phantom requests).

## R6. No WebGL fallback
Every "WebGL" string is a three.js internal; a phone without WebGL gets a blank stage. Proposal: feature-detect before loading
the bundle and show a clear message plus the 2D quest (`quests/rally.html`) as the fallback (ARCHITECTURE.md).

## R7. Speech and audio policies
Radio clips rely on `speechSynthesis` voices and on an `AudioContext` unlocked by the first pointer/key event. On phones without
an English voice the ticker fallback shows the whole script, which makes the listening question a reading question. Proposal:
pre-recorded clips on the asset worker, with the ticker as fallback only.
