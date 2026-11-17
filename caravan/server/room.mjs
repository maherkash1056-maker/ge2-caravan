// GE2 Caravan game server — rooms as Durable Objects. One room = one class session (Word Royale or Wadi Snakes).
import { SnakeGame, SKINS } from "./snake.mjs";
// HTTP:  POST /rooms {game, hostToken}  -> {code}
//        GET  /rooms/CODE                -> public room info
// WS:    /ws/CODE?role=host|player&name=..&id=..&token=..
export class Room {
  constructor(state, env) { this.state = state; this.env = env; this.clients = new Map(); this.game = null; this.code = ""; this.host = null; this.players = new Map(); this.phase = "lobby"; this.seq = 0; this.snake = null; }
  async load() { if (this.loaded) return; this.loaded = true; const m = await this.state.storage.get("meta"); if (m) Object.assign(this, m); const st = await this.state.storage.get("st"); if (st) { this.players = new Map(Object.entries(st.players || {})); this.questions = st.questions || []; this.qi = st.qi || 0; this.round = st.round || 0; this.q = st.q || null; this.answers = new Map(Object.entries(st.answers || {})); this.phase = st.phase || "lobby"; this.deadline = st.deadline || 0; this.qStart = st.qStart || 0; this.lastResults = st.lastResults || null; this.winner = st.winner || null; } if (this.game === "snake") { this.snake = new SnakeGame(this); this.snake.restore(st && st.snake); if (this.phase === "play") this.snake.run(); } for (const ws of this.state.getWebSockets()) { const a = ws.deserializeAttachment() || {}; if (a.role === "player" && this.players.get(a.id)) this.players.get(a.id).connected = true; if (a.role === "player" && this.snake && this.snake.snakes.get(a.id)) this.snake.snakes.get(a.id).connected = true; } }
  save() { const st = { players: Object.fromEntries(this.players), questions: this.questions || [], qi: this.qi || 0, round: this.round || 0, q: this.q || null, answers: Object.fromEntries(this.answers || new Map()), phase: this.phase, deadline: this.deadline || 0, qStart: this.qStart || 0, lastResults: this.lastResults || null, winner: this.winner || null, snake: this.snake ? this.snake.dump() : null }; this.state.storage.put("st", st).catch(() => {}); }
  async fetch(req) {
    await this.load();
    const u = new URL(req.url);
    if (u.pathname.endsWith("/init") && req.method === "POST") { const b = await req.json(); this.game = b.game; this.code = b.code; this.hostToken = b.hostToken; this.created = Date.now(); if (this.game === "snake") this.snake = new SnakeGame(this); await this.state.storage.put("meta", { game: this.game, code: this.code, hostToken: this.hostToken, created: this.created }); this.save(); return json({ ok: true }); }
    if (u.pathname.endsWith("/info")) return json({ ok: true, code: this.code, game: this.game, phase: this.phase, players: [...this.players.values()].map(p => ({ id: p.id, name: p.name, alive: p.alive, score: p.score })) });
    if (req.headers.get("Upgrade") === "websocket") {
      const role = u.searchParams.get("role") || "player", name = (u.searchParams.get("name") || "Player").slice(0, 30), id = (u.searchParams.get("id") || "").slice(0, 16), token = u.searchParams.get("token") || "";
      if (role === "host" && token !== this.hostToken) return new Response("bad host token", { status: 403 });
      if (role === "player" && this.snake && !this.snake.snakes.get(id) && this.snake.snakes.size >= 30) return new Response("room full", { status: 403 });
      const skin = u.searchParams.get("skin") || "";
      const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server, [role, id || name]);
      server.serializeAttachment({ role, id, name, joined: Date.now() });
      if (role === "player") { const p = this.players.get(id) || { id, name, alive: true, score: 0, answers: 0, correct: 0, xp: 0, joined: Date.now() }; p.name = name; p.connected = true; this.players.set(id, p); if (this.snake) this.snake.join(id, name, skin); this.save(); }
      queueMicrotask(() => { this.send(server, { t: "hello", code: this.code, game: this.game, role, phase: this.phase, you: id, state: this.publicState() }); this.broadcast({ t: "players", players: this.playerList() }); if (this.snake) { this.send(server, this.snake.snap()); const sn = this.snake.snakes.get(id); if (role === "player" && sn && sn.pending && sn.pending.q) this.snake.ask(sn, sn.pending.kind, sn.pending.q, Math.max(5, Math.round((sn.pending.deadline - Date.now()) / 1000)), { duelId: sn.pending.duelId, vs: sn.pending.vs }); } });
      return new Response(null, { status: 101, webSocket: client });
    }
    return json({ ok: false, error: "not found" }, 404);
  }
  playerList() { if (this.snake) return this.snake.list(); return [...this.players.values()].map(p => ({ id: p.id, name: p.name, alive: p.alive, score: p.score, correct: p.correct, answers: p.answers, connected: !!p.connected })); }
  publicState() { if (this.snake) return this.snake.publicState(); return { phase: this.phase, round: this.round || 0, question: this.phase === "question" ? this.pubQ() : null, deadline: this.deadline || 0, players: this.playerList(), results: this.lastResults || null, winner: this.winner || null }; }
  pubQ() { const q = this.q; if (!q) return null; return { n: this.round, type: q.type, q: q.q, options: q.o, text: q.text || "", seconds: q.seconds }; }
  send(ws, msg) { try { ws.send(JSON.stringify(msg)); } catch (e) {} }
  broadcast(msg, role) { const s = JSON.stringify(msg); for (const ws of this.state.getWebSockets()) { const a = ws.deserializeAttachment() || {}; if (role && a.role !== role) continue; try { ws.send(s); } catch (e) {} } }
  async webSocketMessage(ws, raw) {
    await this.load();
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const a = ws.deserializeAttachment() || {};
    if (m.t === "ping") return this.send(ws, { t: "pong", now: Date.now() });
    if (this.snake) { if (a.role === "host") { if (m.t === "load") return this.snake.load(m); if (m.t === "start") return this.snake.start(m.minutes); if (m.t === "pause") return this.snake.pause(); if (m.t === "resume") return this.snake.resume(); if (m.t === "end") return this.snake.end(); if (m.t === "theme") { this.snake.theme = m.v === "night" ? "night" : "paper"; this.broadcast({ t: "theme", v: this.snake.theme }); return; } return; } const sn = this.snake.snakes.get(a.id); if (!sn) return; if (m.t === "steer") return this.snake.steer(sn, m); if (m.t === "answer") return this.snake.answer(sn, m); if (m.t === "pick") return this.snake.pick(sn, m); if (m.t === "skin" && SKINS.includes(m.k)) { sn.skin = m.k; return; } return; }
    if (a.role === "host") return this.hostMsg(m);
    if (a.role === "player") return this.playerMsg(a, m);
  }
  async webSocketClose(ws) { await this.load(); const a = ws.deserializeAttachment() || {}; if (a.role === "player") { const p = this.players.get(a.id); if (p) p.connected = false; if (this.snake && this.snake.snakes.get(a.id)) this.snake.snakes.get(a.id).connected = false; this.broadcast({ t: "players", players: this.playerList() }); } }
  // ---------- Word Royale ----------
  hostMsg(m) {
    if (m.t === "load") { this.questions = Array.isArray(m.questions) ? m.questions : []; this.qi = 0; this.save(); this.send(this.hostWs(), { t: "loaded", n: this.questions.length }); return; }
    if (m.t === "start") { this.phase = "lobby"; this.round = 0; this.winner = null; this.lastResults = null; for (const p of this.players.values()) { p.alive = true; p.score = 0; p.correct = 0; p.answers = 0; p.ghost = false; } this.save(); this.broadcast({ t: "state", state: this.publicState() }); return; }
    if (m.t === "next") return this.nextQuestion(m.seconds);
    if (m.t === "reveal") return this.closeQuestion();
    if (m.t === "revive") { const id = m.id; const p = this.players.get(id); if (p) { p.alive = true; p.ghost = false; this.save(); this.broadcast({ t: "revived", id, name: p.name }); this.broadcast({ t: "players", players: this.playerList() }); } return; }
    if (m.t === "end") { this.phase = "end"; this.winner = this.standings()[0] || null; this.save(); this.broadcast({ t: "state", state: this.publicState() }); return; }
    if (m.t === "pause") { this.phase = "paused"; this.save(); this.broadcast({ t: "state", state: this.publicState() }); return; }
  }
  hostWs() { for (const ws of this.state.getWebSockets("host")) return ws; return null; }
  nextQuestion(seconds) {
    const q = this.questions && this.questions[this.qi]; if (!q) { this.phase = "end"; this.winner = this.standings()[0] || null; this.save(); this.broadcast({ t: "state", state: this.publicState() }); return; }
    this.qi++; this.round = (this.round || 0) + 1; this.q = { ...q, seconds: seconds || q.seconds || (q.text ? 45 : 20) }; this.answers = new Map(); this.phase = "question"; this.deadline = Date.now() + this.q.seconds * 1000; this.qStart = Date.now(); this.save();
    this.broadcast({ t: "question", question: this.pubQ(), deadline: this.deadline, round: this.round });
    this.state.storage.setAlarm(this.deadline + 300);
  }
  async alarm() { await this.load(); if (this.phase === "question" && Date.now() >= this.deadline) this.closeQuestion(); }
  playerMsg(a, m) {
    const p = this.players.get(a.id); if (!p) return;
    if (m.t === "answer" && this.phase === "question" && !this.answers.has(a.id)) { const at = Date.now(); this.answers.set(a.id, { v: m.v, ms: at - this.qStart }); p.answers++; this.save(); this.send(this.findWs(a.id), { t: "got", v: m.v }); this.broadcast({ t: "answered", id: a.id, count: this.answers.size }, "host"); if (this.answers.size >= [...this.players.values()].filter(x => x.connected).length) this.closeQuestion(); }
  }
  findWs(id) { for (const ws of this.state.getWebSockets(id)) return ws; return null; }
  closeQuestion() {
    if (this.phase !== "question") return; this.phase = "reveal"; const q = this.q; const correctIdx = q.a;
    const rows = []; for (const p of this.players.values()) { const an = this.answers.get(p.id); const ok = !!an && Number(an.v) === Number(correctIdx); rows.push({ id: p.id, name: p.name, ok, ms: an ? an.ms : null, wasAlive: p.alive }); if (ok) { p.correct++; p.score += p.alive ? 10 : 5; p.xp += 10; } }
    // elimination: among players who were alive, wrong/no answer -> out; slowest 20% of correct -> out (if at least 5 alive)
    const alive = rows.filter(r => r.wasAlive); const correct = alive.filter(r => r.ok).sort((x, y) => x.ms - y.ms); const cut = alive.length >= 5 ? Math.floor(correct.length * 0.2) : 0; const slow = new Set(correct.slice(correct.length - cut).map(r => r.id));
    const out = []; for (const r of alive) { if (!r.ok || slow.has(r.id)) { const p = this.players.get(r.id); if (p && p.alive) { p.alive = false; p.ghost = true; out.push({ id: p.id, name: p.name, why: r.ok ? "slow" : (this.answers.has(p.id) ? "wrong" : "none") }); } } }
    const stillAlive = [...this.players.values()].filter(p => p.alive);
    // never eliminate everyone: if all would be out, keep the fastest correct (or all) alive
    if (stillAlive.length === 0 && alive.length) { const keep = correct.length ? correct.slice(0, Math.max(1, Math.ceil(alive.length / 2))) : alive; for (const r of keep) { const p = this.players.get(r.id); p.alive = true; p.ghost = false; } out.splice(0, out.length, ...out.filter(o => !keep.some(k => k.id === o.id))); }
    this.lastResults = { round: this.round, correct: correctIdx, answerText: q.o ? q.o[correctIdx] : String(correctIdx), why: q.why || "", rows, out, alive: this.standings().filter(p => p.alive).length };
    this.save();
    this.broadcast({ t: "reveal", results: this.lastResults, players: this.playerList() });
    const survivors = [...this.players.values()].filter(p => p.alive);
    if (survivors.length <= 1 || this.qi >= (this.questions || []).length) { this.phase = "end"; this.winner = this.standings()[0] || null; this.save(); setTimeout(() => this.broadcast({ t: "state", state: this.publicState() }), 50); }
  }
  standings() { return [...this.players.values()].sort((a, b) => (b.alive - a.alive) || (b.score - a.score) || (b.correct - a.correct)).map(p => ({ id: p.id, name: p.name, alive: p.alive, score: p.score, correct: p.correct, answers: p.answers, xp: p.xp })); }
}
function json(o, status) { return new Response(JSON.stringify(o), { status: status || 200, headers: { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*" } }); }
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode() { let c = ""; for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; return c; }
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method === "OPTIONS") return json({ ok: true });
    if (u.pathname === "/" || u.pathname === "/ping") return json({ ok: true, service: "GE2 Caravan game server", version: "0.3", time: new Date().toISOString() });
    if (u.pathname === "/rooms" && req.method === "POST") {
      const b = await req.json().catch(() => ({})); const game = String(b.game || "royale"); const hostToken = String(b.hostToken || "").slice(0, 64); if (hostToken.length < 8) return json({ ok: false, error: "host token needed" }, 400);
      const code = makeCode(); const id = env.ROOMS.idFromName(code); const stub = env.ROOMS.get(id);
      await stub.fetch("https://room/init", { method: "POST", body: JSON.stringify({ game, code, hostToken }) });
      return json({ ok: true, code, ws: `wss://${u.host}/ws/${code}` });
    }
    let m = u.pathname.match(/^\/rooms\/([A-Z0-9]{5})$/); if (m) { const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1])); return stub.fetch("https://room/info"); }
    m = u.pathname.match(/^\/ws\/([A-Z0-9]{5})$/); if (m) { const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1])); return stub.fetch(req); }
    return json({ ok: false, error: "not found" }, 404);
  }
};
