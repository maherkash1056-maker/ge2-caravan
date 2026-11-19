// Guards the extracted educational content: docs/content.json must equal a fresh extraction from rally3d/index.html,
// and the invariants the game logic depends on must hold. Run: node --test tests/rally/content.test.js
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..");
const C = JSON.parse(fs.readFileSync(path.join(ROOT, "caravan/rally/docs/content.json"), "utf8"));

test("content.json is in sync with rally3d/index.html", () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, "caravan/rally/extract_content.js"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
test("10 landmarks: 5 stones in the bundle's order, 4 photo landmarks, 1 story-only (Mughsail)", () => {
  assert.equal(C.landmarks.length, 10);
  assert.deepEqual(C.stone_order, ["baleed", "taqah", "darbat", "samhan", "mirbat"]);
  assert.deepEqual(C.landmarks.filter(l => l.stone).map(l => l.id).sort(), [...C.stone_order].sort());
  assert.deepEqual(C.photo_landmarks, ["razat", "tawi", "dawkah", "sumhuram"]);
  const neither = C.landmarks.filter(l => !l.stone && !C.photo_landmarks.includes(l.id)).map(l => l.id);
  assert.deepEqual(neither, ["mughsail"], "a landmark reachable by neither stone nor photo flow");
});
test("stone stops have 3 questions and a 3-panel cutscene; photo stops have ≥2 questions; every answer key is valid", () => {
  for (const l of C.landmarks) {
    if (l.stone) { assert.equal(l.qs.length, 3, l.id); assert.equal(l.scene.length, 3, l.id); } else assert.ok(l.qs.length >= 2, l.id);
    assert.ok(l.text.split(/\s+/).length >= 80 && l.text.split(/\s+/).length <= 110, l.id + " text length " + l.text.split(/\s+/).length);
    for (const q of l.qs) {
      assert.ok(["abc", "one"].includes(q.type), l.id);
      if (q.type === "abc") { assert.equal(q.opts.length, 3); assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < 3); assert.equal(q.skill, "r_abc"); }
      else { assert.ok(Array.isArray(q.a) && q.a.length >= 1); assert.equal(q.skill, "r_one"); }
      assert.ok(q.why && q.q);
    }
  }
  assert.equal(C.landmarks.reduce((n, l) => n + l.qs.length, 0), 25);
});
test("offline question packs: 16 checkpoint items, 10 radio clips (listening, A/B/C or one word), 12 road signs", () => {
  assert.equal(C.offline_checkpoints.length, 16); for (const q of C.offline_checkpoints) { assert.ok(q.text && q.q && q.why); assert.ok(["abc", "one"].includes(q.type)); }
  assert.equal(C.radio.length, 10); for (const q of C.radio) { assert.ok(q.clip.length > 40); assert.ok(["abc", "one"].includes(q.type)); assert.equal(q.skill, q.type === "abc" ? "l_abc" : "l_one"); if (q.type === "abc") assert.equal(q.opts.length, 3); else assert.ok(q.a.length >= 1); }
  assert.equal(C.radio.filter(q => q.type === "abc").length, 5); assert.equal(C.radio.filter(q => q.type === "one").length, 5);
  assert.equal(C.road_signs.length, 12); for (const s of C.road_signs) { assert.ok(s.s.includes("____")); assert.ok(s.a.length >= 1); assert.equal(s.hint, s.a[0][0]); }
});
test("vehicles, upgrades, badges, vehicle key map (shop reachability)", () => {
  assert.deepEqual(C.vehicles.map(v => [v.id, v.cost]), [["pickup", 0], ["fourx", 300], ["saloon", 600], ["bus", 1000], ["camel", 150]]);
  assert.equal(C.vehicles.find(v => v.id === "bus").xp, 1.5); assert.equal(C.vehicles.find(v => v.id === "camel").tank, null, "Infinity serialises as null: the camel needs no fuel");
  assert.deepEqual(C.upgrades.map(u => [u.id, u.cost]), [["tyres", 200], ["tank", 250], ["radio", 300], ["lights", 350]]);
  assert.deepEqual(C.badges.map(b => b.id), ["stone_baleed", "stone_taqah", "stone_darbat", "stone_mirbat", "stone_samhan", "road", "photo", "radio", "scan", "camel"]);
  assert.deepEqual(C.vehicle_keys, { pickup: "pickup", suv: "fourx", saloon: "saloon", minibus: "bus" }, "the camel has no key: it cannot be bought or driven from the shop");
});
