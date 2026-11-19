// Contract tests for rally3d/adapter.html (window.RALLY_BRIDGE) — the ONLY code path between the 3D rally and the class server.
// Pure Node: the adapter script is run in a VM with a fake window, location, history and fetch. No browser, no network.
// Run: node --test tests/rally/adapter.test.js
const test = require("node:test"), assert = require("node:assert/strict");
// Values created inside the VM have another Object prototype: compare by JSON value, not by prototype identity.
const J = x => JSON.parse(JSON.stringify(x)); const deepEq = (a, b, m) => assert.deepEqual(J(a), J(b), m);
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..", "..");
const src = fs.readFileSync(path.join(ROOT, "rally3d", "adapter.html"), "utf8").replace(/^\s*<script>|<\/script>\s*$/g, "");

function boot(hash, { reply = { ok: true }, replies } = {}) {
  const calls = [], replaced = [];
  const ctx = { console, JSON, Math, Object, Array, String, Number, Error, Promise, decodeURIComponent, encodeURIComponent, setTimeout };
  ctx.window = ctx; ctx.location = { hash, pathname: "/webhook/ge2-studio-app", search: "?p=9" };
  ctx.history = { replaceState: (_s, _t, url) => { replaced.push(url); ctx.location.hash = url.slice(url.indexOf("#")); } };
  let n = 0;
  ctx.fetch = async (url, opts) => { const payload = JSON.parse(opts.body); calls.push({ url, headers: opts.headers, keepalive: opts.keepalive, payload }); const r = replies ? replies[n++] : reply; return { ok: true, json: async () => r }; };
  vm.createContext(ctx); vm.runInContext(src, ctx, { filename: "adapter.html" });
  return { B: ctx.RALLY_BRIDGE, calls, replaced, ctx };
}
const S = "studenttoken12345~000S0000~student~Salwa%20Malik~Salwa";
const API = "https://ge2-caravan-api.ge2-caravan.workers.dev/";

test("exposes exactly exam, result, parseHash", () => { const { B } = boot("#play&s=" + S); deepEq(Object.keys(B).sort(), ["exam", "parseHash", "result"]); });

test("parseHash: Studio hash → session; short/missing token → null", () => {
  const { B } = boot("#play&s=" + S);
  deepEq(B.parseHash(), { token: "studenttoken12345", id: "000S0000", role: "student", name: "Salwa Malik", short: "Salwa" });
  assert.equal(boot("#play").B.parseHash(), null);
  assert.equal(boot("#play&s=short~ID").B.parseHash(), null, "token must be at least 8 chars");
  assert.equal(boot("#play&s=studenttoken12345").B.parseHash(), null, "needs token and id");
  deepEq(boot("#play&s=studenttoken12345~S1").B.parseHash(), { token: "studenttoken12345", id: "S1", role: "student", name: "", short: "" });
});

test("on load with a session and no name=, the hash gets &name=<short> appended (replaceState)", () => {
  const { replaced, ctx } = boot("#play&s=" + S);
  assert.equal(replaced.length, 1); assert.ok(ctx.location.hash.endsWith("&name=Salwa"), ctx.location.hash);
  assert.equal(boot("#play&s=" + S + "&name=X").replaced.length, 0, "not appended twice");
  assert.equal(boot("#play").replaced.length, 0, "nothing without a session");
});

test("exam(): fresh Claude exam — payload shape, skills, len default 15, game name, prompt", async () => {
  const text = JSON.stringify({ title: "T", texts: [{ kind: "read", body: "[A] x" }], questions: [{ type: "abc", q: "Q?", options: ["a", "b", "c"], answer: "B", evidence: "e", why: "w", skill: "r_abc" }] });
  const { B, calls } = boot("#play&s=" + S, { reply: { ok: true, text } });
  const game = await B.exam({});
  assert.equal(calls.length, 1); const p = calls[0].payload;
  assert.equal(calls[0].url, API); assert.equal(calls[0].headers["content-type"], "text/plain;charset=UTF-8"); assert.equal(calls[0].keepalive, true);
  assert.equal(p.kind, "exam"); assert.equal(p.token, "studenttoken12345"); assert.equal(p.student, "Salwa Malik"); assert.equal(p.device, "GAME");
  deepEq(p.skills, ["r_abc", "r_word"]); assert.equal(p.len, 15); assert.equal(p.game, "Khareef Rally");
  assert.equal(p.style, true); assert.equal(p.awl, true); assert.equal(p.fast, false); deepEq(p.images, []);
  assert.match(p.prompt, /exactly 15 questions/); assert.match(p.prompt, /Khareef Rally/); assert.match(p.prompt, /"r_abc"/); assert.match(p.prompt, /"r_word"/);
  deepEq(game, { title: "T", texts: [{ kind: "read", body: "[A] x" }], questions: [{ type: "abc", q: "Q?", opts: ["a", "b", "c"], a: "B", evidence: "e", why: "w", skill: "r_abc" }] });
});

test("exam(): x=claude.25 → len 25 in payload and prompt", async () => {
  const { B, calls } = boot("#play&s=" + S + "&x=claude.25.", { reply: { ok: true, text: "{\"questions\":[]}" } });
  await B.exam({}); assert.equal(calls[0].payload.len, 25); assert.match(calls[0].payload.prompt, /exactly 25 questions/);
});

test("exam(): x=bank.25 → kind bank with {skills,len}; x=mine → {title}", async () => {
  const spec = { title: "Bank", texts: [], questions: [] };
  let b = boot("#play&s=" + S + "&x=bank.25.", { reply: { ok: true, spec, id: 7 } });
  await b.B.exam({}); deepEq(b.calls[0].payload, { kind: "bank", token: "studenttoken12345", data: { skills: ["r_abc", "r_word"], len: 25 } });
  b = boot("#play&s=" + S + "&x=mine.0.My%20quiz", { reply: { ok: true, spec } });
  await b.B.exam({}); deepEq(b.calls[0].payload.data, { title: "My quiz" });
  b = boot("#play&s=" + S + "&x=bank.25.", { reply: { ok: true } });
  await assert.rejects(() => b.B.exam({}), /bank empty/);
});

test("exam(): tolerant parsing (text with junk around JSON, qs/opts/a aliases); errors surface", async () => {
  const text = "Here you go:\n{\"title\":\"X\",\"qs\":[{\"type\":\"word\",\"q\":\"g ____\",\"a\":\"two / 2\",\"ev\":\"E\",\"skill\":\"r_word\"}]}";
  const { B } = boot("#play&s=" + S, { reply: { ok: true, text } });
  const g = await B.exam({}); assert.equal(g.questions[0].a, "two / 2"); assert.equal(g.questions[0].evidence, "E"); assert.equal(g.questions[0].why, "");
  await assert.rejects(() => boot("#play&s=" + S, { reply: { ok: false, code: "limit" } }).B.exam({}), /limit/);
  await assert.rejects(() => boot("#play").B.exam({}), /no session/);
});

const items = (okFlags, skill = "r_abc") => okFlags.map(ok => ({ skill, type: "abc", q: "q", ok, ans: "a", t: 1 }));
test("result(): payload — counts, grade bands, skills aggregation, weakest, score, won, badges, type/exam/device", async () => {
  const { B, calls } = boot("#play&s=" + S);
  const S_ = { stones: ["baleed", "taqah"], badges: ["stone_baleed", "stone_taqah", "b3", "b4", "b5", "b6", "b7"] };
  await B.result({}, S_, [...items([true, true, true, false]), ...items([true, false], "r_one")], false);
  const p = calls[0].payload;
  assert.equal(p.kind, "result"); assert.equal(p.type, "Quest"); assert.equal(p.exam, "Khareef Rally"); assert.equal(p.device, "GAME"); assert.equal(p.student, "Salwa Malik");
  assert.equal(p.right, 4); assert.equal(p.total, 6); assert.equal(p.grade, "D", "67% → D");
  deepEq(p.skills, [{ id: "r_abc", name: "A, B or C questions", r: 3, n: 4 }, { id: "r_one", name: "One word or a number", r: 1, n: 2 }]);
  assert.equal(p.weakest, "One word or a number"); assert.equal(p.score, 40, "right*10, no stone bonus when not final"); assert.equal(p.won, false, "never won when not final");
  deepEq(p.badges, ["stone_baleed", "stone_taqah", "b3", "b4", "b5", "b6"], "at most 6 badges");
});
test("result(): final run — score adds stones*20, won iff pct ≥ 60", async () => {
  let b = boot("#play&s=" + S); await b.B.result({}, { stones: ["a", "b", "c"], badges: [] }, items([true, true, true, false, false]), true);
  assert.equal(b.calls[0].payload.score, 30 + 60); assert.equal(b.calls[0].payload.won, true, "60% final → won");
  b = boot("#play&s=" + S); await b.B.result({}, { stones: [], badges: [] }, items([true, false, false]), true);
  assert.equal(b.calls[0].payload.won, false, "33% → not won"); assert.equal(b.calls[0].payload.grade, "F");
});
test("result(): grade bands A/B/C/D/F at 90/80/70/60", async () => {
  for (const [right, grade] of [[9, "A"], [8, "B"], [7, "C"], [6, "D"], [5, "F"]]) {
    const b = boot("#play&s=" + S); await b.B.result({}, { stones: [], badges: [] }, items(Array.from({ length: 10 }, (_, i) => i < right)), false);
    assert.equal(b.calls[0].payload.grade, grade, right + "/10");
  }
});
test("result(): nothing is posted without a session or without items; unknown skill ids pass through as names", async () => {
  let b = boot("#play"); await b.B.result({}, { stones: [], badges: [] }, items([true]), true); assert.equal(b.calls.length, 0);
  b = boot("#play&s=" + S); await b.B.result({}, { stones: [], badges: [] }, [], true); assert.equal(b.calls.length, 0);
  b = boot("#play&s=" + S); await b.B.result({}, { stones: [], badges: [] }, items([true], "g_sign"), false);
  deepEq(b.calls[0].payload.skills, [{ id: "g_sign", name: "g_sign", r: 1, n: 1 }]);
  b = boot("#play&s=" + S); await b.B.result({}, { stones: [], badges: [] }, items([true], "l_abc"), false);
  assert.equal(b.calls[0].payload.skills[0].name, "l_abc", "listening skill has no display name in the adapter");
});
