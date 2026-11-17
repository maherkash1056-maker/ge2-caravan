// Wadi Snakes — authoritative arena run inside a Room Durable Object. 15 ticks/s.
// Rules (approved design 9 Nov): eat food to grow; every 100 points -> power question (correct = pick Speed/Shield/Magnet/Ghost);
// any clash = 60-s duel on the same item, first correct eats the other (absorbs 50% length, 50% drops as food);
// both wrong = both lose 30%; death (wall or eaten) -> revival question, respawn at start length with 0 points, XP kept;
// Giant-Slayer: a revived low-score snake beating a top-5 snake (+20 XP); map shrinks in the last 3 minutes.
export const ARENA = 1800, TICK_MS = 1000 / 15, STRIDE = 2, START_LEN = 10, FOOD_VALUE = 10, POWER_EVERY = 100;
const BASE_SPEED = 4.6, BOOST_SPEED = 7.6, TURN = 0.2, MAGNET_R = 120, MAGNET_PULL = 9;
const POWERS = { boost: 10000, shield: 0, magnet: 10000, ghost: 5000 };
const rnd = (a, b) => a + Math.random() * (b - a);
export const SKINS = ["masar", "khareef", "mix", "rose", "halwa", "khanjar", "frankincense", "dhow"];
export class SnakeGame {
  constructor(room) { this.room = room; this.snakes = new Map(); this.food = new Map(); this.fid = 1; this.qid = 1; this.duels = new Map(); this.did = 1; this.oneliners = []; this.duelQs = []; this.oi = 0; this.di = 0; this.tickN = 0; this.ends = 0; this.started = 0; this.minutes = 12; this.lastClash = new Map(); this.timer = null; this.events = []; this.lastSnap = 0; this.lastSave = 0; }
  // ---------- persistence ----------
  dump() { return { snakes: [...this.snakes.values()].map(s => ({ ...s, pending: s.pending || null })), food: [...this.food.values()], fid: this.fid, qid: this.qid, did: this.did, oneliners: this.oneliners, duelQs: this.duelQs, oi: this.oi, di: this.di, ends: this.ends, started: this.started, minutes: this.minutes, duels: [...this.duels.values()] }; }
  restore(d) { if (!d) return; for (const s of d.snakes || []) this.snakes.set(s.id, s); for (const f of d.food || []) this.food.set(f.id, f); Object.assign(this, { fid: d.fid || 1, qid: d.qid || 1, did: d.did || 1, oneliners: d.oneliners || [], duelQs: d.duelQs || [], oi: d.oi || 0, di: d.di || 0, ends: d.ends || 0, started: d.started || 0, minutes: d.minutes || 12 }); for (const du of d.duels || []) this.duels.set(du.id, du); }
  // ---------- players ----------
  join(id, name, skin) { let s = this.snakes.get(id); if (!s) { s = this.newSnake(id, name); this.snakes.set(id, s); if (this.room.phase === "play") this.spawn(s); else s.st = "wait"; } s.name = name; if (SKINS.includes(skin)) s.skin = skin; s.connected = true; return s; }
  newSnake(id, name) { return { id, name, skin: "masar", x: 0, y: 0, a: 0, ta: 0, len: START_LEN, path: [], st: "wait", score: 0, nextPower: POWER_EVERY, xp: 0, correct: 0, answers: 0, skills: {}, deaths: 0, duelsWon: 0, duelsLost: 0, eaten: 0, revived: false, powers: {}, shield: false, pending: null, connected: true, lastSteer: 0, badges: [] }; }
  spawn(s) { const m = this.margin() + 150; s.x = rnd(m, ARENA - m); s.y = rnd(m, ARENA - m); s.a = s.ta = rnd(-Math.PI, Math.PI); s.len = START_LEN; s.path = [[s.x, s.y]]; s.st = "alive"; s.powers = { ghost: Date.now() + 3000 }; s.shield = false; s.pending = null; }
  list() { return [...this.snakes.values()].map(s => ({ id: s.id, name: s.name, skin: s.skin, st: s.st, len: s.len, score: s.score, xp: s.xp, correct: s.correct, answers: s.answers, deaths: s.deaths, duelsWon: s.duelsWon, connected: !!s.connected })); }
  standings() { return [...this.snakes.values()].sort((a, b) => (b.score - a.score) || (b.len - a.len) || (b.xp - a.xp)); }
  // ---------- host ----------
  load(m) { this.oneliners = (m.oneliners || []).filter(q => q && q.q && Array.isArray(q.o)); this.duelQs = (m.duels || []).filter(q => q && q.q && Array.isArray(q.o)); this.oi = 0; this.di = 0; this.room.save(); this.room.send(this.room.hostWs(), { t: "loaded", n: this.oneliners.length, duels: this.duelQs.length }); }
  start(minutes) { this.minutes = Math.max(2, Math.min(20, Number(minutes) || 12)); this.started = Date.now(); this.ends = this.started + this.minutes * 60000; this.food.clear(); this.duels.clear(); this.events = []; for (const s of this.snakes.values()) { s.score = 0; s.nextPower = POWER_EVERY; s.xp = 0; s.correct = 0; s.answers = 0; s.skills = {}; s.deaths = 0; s.duelsWon = 0; s.duelsLost = 0; s.eaten = 0; s.revived = false; s.badges = []; this.spawn(s); } this.topUpFood(); this.room.phase = "play"; this.room.save(); this.room.broadcast({ t: "state", state: this.room.publicState() }); this.sendSnap(); this.run(); }
  pause() { this.stop(); this.pausedAt = Date.now(); this.room.phase = "paused"; this.room.save(); this.room.broadcast({ t: "state", state: this.room.publicState() }); }
  resume() { if (this.room.phase !== "paused") return; const gap = Date.now() - (this.pausedAt || Date.now()); this.ends += gap; for (const d of this.duels.values()) d.deadline += gap; for (const s of this.snakes.values()) if (s.pending) s.pending.deadline += gap; this.room.phase = "play"; this.room.save(); this.room.broadcast({ t: "state", state: this.room.publicState() }); this.sendSnap(); this.run(); }
  end() { this.stop(); this.room.phase = "end"; for (const d of this.duels.values()) d.resolved = true; this.duels.clear(); for (const s of this.snakes.values()) s.pending = null; const st = this.standings(); st.forEach((s, i) => { s.place = i + 1; s.xp += i === 0 ? 50 : i === 1 ? 30 : i === 2 ? 20 : 10; if (i === 0) s.badges.push("serpent"); if (s.duelsWon >= 5) s.badges.push("duelist"); if (s.deaths === 0 && s.answers > 0) s.badges.push("untouchable"); }); this.room.winner = st[0] ? { id: st[0].id, name: st[0].name, score: st[0].score } : null; this.room.save(); this.room.broadcast({ t: "state", state: this.room.publicState() }); }
  run() { this.stop(); this.timer = setInterval(() => { try { this.tick(); } catch (e) { this.events.push({ k: "error", m: String(e && e.message) }); } }, TICK_MS); }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  margin() { if (!this.ends) return 0; const left = this.ends - Date.now(); if (left > 180000) return 0; return ARENA * 0.3 * Math.min(1, (180000 - left) / 180000); }
  // ---------- questions ----------
  nextOne() { if (!this.oneliners.length) return null; const q = this.oneliners[this.oi % this.oneliners.length]; this.oi++; return q; }
  nextDuel() { if (this.duelQs.length) { const q = this.duelQs[this.di % this.duelQs.length]; this.di++; return q; } return this.nextOne(); }
  ask(s, kind, q, seconds, extra) { if (!q) return false; const id = this.qid++; s.pending = { qid: id, kind, q, deadline: Date.now() + seconds * 1000, ...(extra || {}) }; this.room.send(this.room.findWs(s.id), { t: "q", qid: id, kind, q: { type: q.type || "abc", text: q.text || "", q: q.q, options: q.o }, deadline: s.pending.deadline, vs: extra && extra.vs || "", seconds }); return true; }
  answer(s, m) { if (this.room.phase !== "play") return; const p = s.pending; if (!p || Number(m.qid) !== p.qid) return; const ok = Number(m.v) === Number(p.q.a); s.answers++; const sk = p.q.skill || "v_syn"; s.skills[sk] = s.skills[sk] || { r: 0, n: 0 }; s.skills[sk].n++; if (ok) { s.correct++; s.skills[sk].r++; s.xp += 10; }
    this.room.send(this.room.findWs(s.id), { t: "qres", qid: p.qid, ok, correct: p.q.a, why: p.q.why || "", kind: p.kind });
    if (p.kind === "power") { s.pending = null; if (ok) { s.pending = { qid: this.qid++, kind: "pick", deadline: Date.now() + 10000 }; this.room.send(this.room.findWs(s.id), { t: "pick", qid: s.pending.qid, deadline: s.pending.deadline, powers: Object.keys(POWERS) }); } else this.event({ k: "power", id: s.id, name: s.name, ok: false }); }
    else if (p.kind === "revive") { if (ok) { s.pending = null; this.spawn(s); s.revived = true; s.score = 0; s.nextPower = POWER_EVERY; this.event({ k: "revive", id: s.id, name: s.name }); this.sendSnap(s.id); } else { this.ask(s, "revive", this.nextOne(), 15); } }
    else if (p.kind === "duel") { const d = this.duels.get(p.duelId); if (!d) { s.pending = null; return; } d.answers[s.id] = { ok, at: Date.now() }; if (ok && !d.winner) { d.winner = s.id; this.resolveDuel(d); } else if (!ok) { const other = d.a === s.id ? d.b : d.a; if (d.answers[other] && !d.answers[other].ok) this.resolveDuel(d); } } }
  pick(s, m) { if (this.room.phase !== "play") return; const p = s.pending; if (!p || p.kind !== "pick" || Number(m.qid) !== p.qid) return; const k = POWERS[m.power] !== undefined ? m.power : "boost"; s.pending = null; if (k === "shield") s.shield = true; else s.powers[k] = Date.now() + POWERS[k]; this.event({ k: "power", id: s.id, name: s.name, ok: true, power: k }); this.room.send(this.room.findWs(s.id), { t: "power", power: k, until: s.powers[k] || 0 }); }
  // ---------- duels ----------
  startDuel(a, b) { const q = this.nextDuel(); if (!q) return; const d = { id: this.did++, a: a.id, b: b.id, q, deadline: Date.now() + 60000, answers: {}, winner: null, resolved: false }; this.duels.set(d.id, d); a.st = b.st = "duel"; this.ask(a, "duel", q, 60, { duelId: d.id, vs: b.name }); this.ask(b, "duel", q, 60, { duelId: d.id, vs: a.name }); this.event({ k: "duel", a: { id: a.id, name: a.name, len: a.len }, b: { id: b.id, name: b.name, len: b.len } }); }
  resolveDuel(d) { if (d.resolved) return; d.resolved = true; this.duels.delete(d.id); const A = this.snakes.get(d.a), B = this.snakes.get(d.b); for (const s of [A, B]) if (s && s.pending && s.pending.kind === "duel") s.pending = null;
    if (!A || !B) { for (const s of [A, B]) if (s && s.st === "duel") s.st = "alive"; return; }
    if (d.winner) { const W = d.winner === A.id ? A : B, L = W === A ? B : A; const top5 = this.standings().slice(0, 5).some(s => s.id === L.id); const giant = W.revived && W.score < 50 && top5; const half = Math.floor(L.len / 2); W.len += half; W.duelsWon++; W.eaten++; W.st = "alive"; W.powers.ghost = Date.now() + 2000; if (giant) { W.xp += 20; if (!W.badges.includes("giant")) W.badges.push("giant"); } L.duelsLost++; this.dropFood(L, Math.max(0, L.len - half)); this.die(L, "eaten", W.name); this.event({ k: "duelend", winner: { id: W.id, name: W.name }, loser: { id: L.id, name: L.name }, giant, half }); }
    else { for (const s of [A, B]) { s.len = Math.max(5, Math.floor(s.len * 0.7)); s.st = "alive"; s.powers.ghost = Date.now() + 2000; } this.event({ k: "duelend", draw: true, a: { id: A.id, name: A.name }, b: { id: B.id, name: B.name } }); }
    this.sendSnap(); }
  die(s, why, by) { s.st = "dead"; s.deaths++; s.pending = null; s.powers = {}; s.shield = false; this.event({ k: "death", id: s.id, name: s.name, why, by: by || "" }); this.ask(s, "revive", this.nextOne(), 15); }
  dropFood(s, n) { const pts = this.body(s); const step = Math.max(1, Math.floor(pts.length / Math.max(1, Math.min(n, 40)))); for (let i = 0; i < pts.length && n > 0; i += step, n--) this.addFood(pts[i][0] + rnd(-8, 8), pts[i][1] + rnd(-8, 8), FOOD_VALUE, 1); }
  // ---------- world ----------
  addFood(x, y, v, c) { const m = this.margin() + 10; x = Math.max(m, Math.min(ARENA - m, x)); y = Math.max(m, Math.min(ARENA - m, y)); const f = { id: this.fid++, x: Math.round(x), y: Math.round(y), v, c: c || Math.floor(Math.random() * 5) }; this.food.set(f.id, f); this.newFood.push(f); return f; }
  topUpFood() { this.newFood = this.newFood || []; const alive = [...this.snakes.values()].filter(s => s.st === "alive").length; const target = 170 + 4 * alive; const m = this.margin() + 20; while (this.food.size < target) this.addFood(rnd(m, ARENA - m), rnd(m, ARENA - m), FOOD_VALUE); }
  body(s) { const out = []; const p = s.path; for (let i = 0, k = p.length - 1; i < s.len && k >= 0; i++, k -= STRIDE) out.push(p[k]); return out; }
  radius(s) { return 6 + Math.min(10, s.len * 0.06); }
  event(e) { e.at = Date.now(); this.events.push(e); this.room.broadcast({ t: "ev", ev: e }); }
  tick() {
    if (this.room.phase !== "play") return; const now = Date.now(); this.tickN++; this.newFood = []; const removed = []; const margin = this.margin();
    if (now >= this.ends) { this.end(); return; }
    // deadlines
    for (const s of this.snakes.values()) { const p = s.pending; if (!p) continue; if (now > p.deadline) { if (p.kind === "power") { s.pending = null; this.room.send(this.room.findWs(s.id), { t: "qres", qid: p.qid, ok: false, correct: p.q.a, why: "Time is up.", kind: "power" }); } else if (p.kind === "pick") { this.pick(s, { qid: p.qid, power: "boost" }); } else if (p.kind === "revive") { this.room.send(this.room.findWs(s.id), { t: "qres", qid: p.qid, ok: false, correct: p.q.a, why: "Time is up — here is another one.", kind: "revive" }); this.ask(s, "revive", this.nextOne(), 15); } } }
    for (const d of this.duels.values()) if (now > d.deadline) this.resolveDuel(d);
    // move
    for (const s of this.snakes.values()) {
      if (s.st !== "alive") continue;
      const answering = s.pending && (s.pending.kind === "power" || s.pending.kind === "pick");
      let da = ((s.ta - s.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; da = Math.max(-TURN, Math.min(TURN, da)); s.a += da;
      const sp = (s.powers.boost > now) ? BOOST_SPEED : BASE_SPEED; let nx = s.x + Math.cos(s.a) * sp, ny = s.y + Math.sin(s.a) * sp;
      const lo = margin + 2, hi = ARENA - margin - 2;
      if (nx < lo || nx > hi || ny < lo || ny > hi) { if (answering || s.powers.ghost > now) { if (nx < lo || nx > hi) s.a = Math.PI - s.a; else s.a = -s.a; s.ta = s.a; nx = Math.max(lo, Math.min(hi, nx)); ny = Math.max(lo, Math.min(hi, ny)); } else { this.dropFood(s, s.len); this.die(s, "wall"); continue; } }
      s.x = nx; s.y = ny; s.path.push([Math.round(nx), Math.round(ny)]); const keep = s.len * STRIDE + 2; if (s.path.length > keep + 30) s.path.splice(0, s.path.length - keep);
      // food
      const r = this.radius(s); const mag = s.powers.magnet > now;
      for (const f of this.food.values()) { const dx = f.x - s.x, dy = f.y - s.y; const d2 = dx * dx + dy * dy; if (d2 < (r + 7) * (r + 7)) { this.food.delete(f.id); removed.push(f.id); s.score += f.v; s.len += 1; if (s.score >= s.nextPower) { s.nextPower += POWER_EVERY; if (!s.pending) this.ask(s, "power", this.nextOne(), 15); } } else if (mag && d2 < MAGNET_R * MAGNET_R) { const d = Math.sqrt(d2) || 1; f.x += dx / d * -MAGNET_PULL; f.y += dy / d * -MAGNET_PULL; this.newFood.push(f); } }
    }
    // clashes
    const alive = [...this.snakes.values()].filter(s => s.st === "alive");
    for (const A of alive) { if (A.st !== "alive" || A.powers.ghost > now || A.pending) continue; const rA = this.radius(A);
      for (const B of alive) { if (A === B || B.st !== "alive" || A.st !== "alive" || B.powers.ghost > now || B.pending) continue; const key = A.id < B.id ? A.id + "|" + B.id : B.id + "|" + A.id; if ((this.lastClash.get(key) || 0) > now - 1500) continue; const rB = this.radius(B); const rr = (rA + rB) * (rA + rB);
        let hit = ((A.x - B.x) ** 2 + (A.y - B.y) ** 2) < rr; if (!hit) { const pts = this.body(B); for (let i = 2; i < pts.length; i++) { const dx = pts[i][0] - A.x, dy = pts[i][1] - A.y; if (dx * dx + dy * dy < rr) { hit = true; break; } } }
        if (!hit) continue; this.lastClash.set(key, now);
        if (A.shield || B.shield) { const S = A.shield ? A : B; S.shield = false; S.powers.ghost = now + 1500; this.event({ k: "shield", id: S.id, name: S.name }); continue; }
        this.startDuel(A, B); break; } }
    this.topUpFood();
    // broadcast tick
    const snakes = [...this.snakes.values()].filter(s => s.st === "alive" || s.st === "duel").map(s => [s.id, Math.round(s.x), Math.round(s.y), +s.a.toFixed(3), s.len, s.st === "duel" ? 2 : 1, (s.powers.boost > now ? 1 : 0) | (s.shield ? 2 : 0) | (s.powers.magnet > now ? 4 : 0) | (s.powers.ghost > now ? 8 : 0) | (s.pending ? 16 : 0), s.score]);
    this.room.broadcast({ t: "k", n: this.tickN, s: snakes, fa: this.newFood.map(f => [f.id, f.x, f.y, f.c]), fr: removed, m: Math.round(margin), left: Math.max(0, this.ends - now) });
    if (now - this.lastSnap > 5000) { this.lastSnap = now; this.sendSnap(); }
    if (now - this.lastSave > 5000) { this.lastSave = now; this.room.save(); }
  }
  snap() { return { t: "snap", theme: this.theme || "paper", snakes: [...this.snakes.values()].filter(s => s.st === "alive" || s.st === "duel").map(s => ({ id: s.id, name: s.name, skin: s.skin, pts: this.body(s), len: s.len, st: s.st, score: s.score })), food: [...this.food.values()].map(f => [f.id, f.x, f.y, f.c]), m: Math.round(this.margin()), left: Math.max(0, this.ends - Date.now()), players: this.list(), ends: this.ends, arena: ARENA }; }
  sendSnap(onlyId) { const s = this.snap(); if (onlyId) this.room.send(this.room.findWs(onlyId), s); else this.room.broadcast(s); }
  steer(s, m) { if (s.st !== "alive") return; const a = Number(m.a); if (!isFinite(a)) return; s.ta = a; }
  publicState() { const st = this.standings(); return { phase: this.room.phase, game: "snake", players: this.list(), standings: st.map((s, i) => ({ place: i + 1, id: s.id, name: s.name, skin: s.skin, score: s.score, len: s.len, xp: s.xp, correct: s.correct, answers: s.answers, deaths: s.deaths, duelsWon: s.duelsWon, badges: s.badges || [], skills: s.skills })), ends: this.ends, left: Math.max(0, this.ends - Date.now()), minutes: this.minutes, questions: this.oneliners.length, duelQs: this.duelQs.length, winner: this.room.winner || null, events: this.events.slice(-12) }; }
}
