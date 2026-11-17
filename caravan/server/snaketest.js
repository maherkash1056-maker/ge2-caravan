// Live bot test of Wadi Snakes: host + N bots steering randomly, answering questions (70% correct).
const { chromium } = require('playwright'); (async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } }); const ctx = await b.newContext({ ignoreHTTPSErrors: true }); const p = await ctx.newPage();
  await p.goto('https://ge2-caravan-server.ge2-caravan.workers.dev/ping');
  const out = await p.evaluate(async (N) => {
    const BASE = location.origin; const L = []; const log = (...a) => L.push((Date.now() % 100000) + ' ' + a.join(' '));
    const r = await (await fetch(BASE + "/rooms", { method: "POST", body: JSON.stringify({ game: "snake", hostToken: "testhost12345" }) })).json(); log("room", r.code);
    const open = (url) => new Promise((res, rej) => { const ws = new WebSocket(url); ws.onopen = () => res(ws); ws.onerror = e => rej("ws error"); });
    const send = (ws, m) => ws.send(JSON.stringify(m)); const wait = ms => new Promise(r => setTimeout(r, ms));
    const stats = { ticks: 0, snaps: 0, ev: {}, q: 0, qres: 0, picks: 0, bytes: 0, maxTickGap: 0, lastTick: 0 };
    const host = await open(r.ws + "?role=host&token=testhost12345");
    host.onmessage = e => { const m = JSON.parse(e.data); stats.bytes += e.data.length; if (m.t === "k") { stats.ticks++; const now = Date.now(); if (stats.lastTick) stats.maxTickGap = Math.max(stats.maxTickGap, now - stats.lastTick); stats.lastTick = now; } else if (m.t === "snap") stats.snaps++; else if (m.t === "ev") { stats.ev[m.ev.k] = (stats.ev[m.ev.k] || 0) + 1; if (["duel", "duelend", "death", "revive", "shield"].includes(m.ev.k)) log("ev", JSON.stringify(m.ev).slice(0, 160)); } else if (m.t === "state") log("state", m.state.phase, JSON.stringify((m.state.standings || []).slice(0, 3).map(s => s.name + ":" + s.score + "/" + s.len + "/xp" + s.xp + "/" + s.badges))); else if (m.t === "loaded") log("loaded", m.n, m.duels); };
    const ones = []; for (let i = 0; i < 20; i++) ones.push({ type: "abc", q: "One-liner " + i, o: ["a", "b", "c"], a: i % 3, why: "because", skill: "v_syn" });
    const duels = []; for (let i = 0; i < 10; i++) duels.push({ type: "tfng", text: "Short text " + i + ". Three sentences. Done.", q: "Statement " + i, o: ["True", "False", "Not Given"], a: i % 3, why: "see text", skill: "r_tfng" });
    send(host, { t: "load", oneliners: ones, duels }); await wait(300);
    const bots = [];
    for (let i = 0; i < N; i++) { const id = "B" + i, ws = await open(r.ws + "?role=player&id=" + id + "&name=Bot" + i + "&skin=khareef"); const bot = { id, ws, me: null, pend: null, st: "wait" }; bots.push(bot);
      ws.onmessage = e => { const m = JSON.parse(e.data); if (m.t === "q") { stats.q++; bot.pend = m; }
        if (m.t === "qres") { stats.qres++; bot.pend = null; } if (m.t === "pick") { stats.picks++; send(ws, { t: "pick", qid: m.qid, power: ["boost", "shield", "magnet", "ghost"][i % 4] }); }
        if (m.t === "k") { const me = m.s.find(x => x[0] === id); if (me) bot.me = me; } };
    }
    // bots answer with the real correct index 70% of the time: we cheat by knowing the pools: a = index % 3 by name
    for (const bot of bots) { const ws = bot.ws; ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.t === "q") { const n = parseInt(m.q.q.replace(/\D/g, ""), 10) || 0; const ok = Math.random() < 0.7; setTimeout(() => send(ws, { t: "answer", qid: m.qid, v: ok ? n % 3 : (n + 1) % 3 }), 300 + Math.random() * 1200); } }); }
    send(host, { t: "start", minutes: 2 }); await wait(500);
    const steer = setInterval(() => { for (const bot of bots) { if (!bot.me) continue; // steer toward a point near the arena centre with noise
        const a = Math.atan2(900 - bot.me[2], 900 - bot.me[1]) + (Math.random() - 0.5) * 2.5; send(bot.ws, { t: "steer", a }); } }, 250);
    await wait(60000); clearInterval(steer);
    send(host, { t: "end" }); await wait(1000);
    const info = await (await fetch(BASE + "/rooms/" + r.code)).json();
    return { L, stats, info: info.players.length };
  }, 12);
  console.log(out.L.join("\n")); console.log(JSON.stringify(out.stats)); console.log("players", out.info);
  await b.close();
})();
