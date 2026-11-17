// GE2 Caravan: builds whatever the teacher page asked for (table, heat-map, one exam, students).
const req = $('Read the request').first().json;
const ts = (o, k) => Date.parse(o[k] || o.createdAt) || 0;
const roster = $('Roster all').all().map(i => i.json).filter(r => r && r.student_id);
const profiles = $('Profiles all').all().map(i => i.json).filter(p => p && p.student_id);
const results = $('Results recent').all().map(i => i.json).filter(r => r && r.student_id).sort((a, b) => ts(b, 'played_at') - ts(a, 'played_at'));
const exams = $('Exams recent').all().map(i => i.json).filter(r => r && r.student_id).sort((a, b) => ts(b, 'created_at') - ts(a, 'created_at'));
const tasks = $('Tasks all').all().map(i => i.json).filter(t => t && t.title);
const seenBy = {}; for (const s of $('Students all').all().map(i => i.json)) { if (s && s.student_id) seenBy[s.student_id] = Math.max(seenBy[s.student_id] || 0, Date.parse(s.last_seen || "") || 0, Date.parse(s.verified_at || "") || 0); }
const ONLINE_MS = 5 * 60000;   // a student is online if the app talked to the server in the last 5 minutes
const SK = { r_head: "Headings", r_tfng: "T/F/NG", r_box: "Word box", r_abc: "A/B/C", r_word: "One word", r_table: "Table", r_vocab: "Vocabulary", r_infer: "Inference", l_tf: "Listen T/F", l_abc: "Listen A/B/C", l_short: "Listen short", l_note: "Listen notes", g_passive: "Passive", g_modal: "Modals", g_cond: "Conditionals", g_tense: "Tenses", g_rel: "Relative", g_link: "Linking", v_awl: "AWL", r_scan: "Scanning for facts", w_essay: "Writing" };
const students = roster.filter(r => r.role === "student" || !r.role);
const byId = (arr) => { const m = {}; for (const x of arr) (m[x.student_id] = m[x.student_id] || []).push(x); return m; };
const resBy = byId(results), exBy = byId(exams);
const prof = {}; for (const p of profiles) prof[p.student_id] = p;
const skillTotals = (rows) => { const t = {}; for (const r of rows) for (const part of String(r.skill_codes || "").split(/\s+/)) { const m = part.match(/^([a-z_]+):(\d+)\/(\d+)$/); if (!m) continue; const k = m[1]; t[k] = t[k] || { r: 0, n: 0 }; t[k].r += +m[2]; t[k].n += +m[3]; } return t; };
if (req.kind === "teacher_exam") {
  const id = String(req.data.exam_id || req.data.id || "");
  const ex = exams.find(e => String(e.id) === id || e.exam_id === id);
  if (!ex) return [{ json: { reply: { ok: false, code: "nf", error: "Exam not found." } } }];
  let spec = null; try { spec = JSON.parse(ex.exam_json || "null"); } catch (e) {}
  const res = (resBy[ex.student_id] || []).filter(r => r.exam === ex.title).slice(0, 5);
  return [{ json: { reply: { ok: true, exam: { id: ex.id, student_id: ex.student_id, name: ex.name, title: ex.title, created_at: ex.created_at, skills: ex.skills, questions: ex.questions, vocab_unit: ex.vocab_unit, spec }, results: res } } }];
}
if (req.kind === "teacher_heatmap") {
  const skills = new Set(); const rows = [];
  for (const st of students) { const t = skillTotals(resBy[st.student_id] || []); Object.keys(t).forEach(k => skills.add(k)); rows.push({ student_id: st.student_id, name: st.short_name || st.name, cells: t }); }
  const cls = skillTotals(results.filter(r => students.some(s => s.student_id === r.student_id)));
  const pct = k => cls[k] ? cls[k].r / Math.max(1, cls[k].n) : 0;
  const order = [...skills].sort((a, b) => pct(a) - pct(b));
  return [{ json: { reply: { ok: true, skills: order.map(k => ({ id: k, name: SK[k] || k, pct: Math.round(100 * pct(k)), n: cls[k] ? cls[k].n : 0 })), rows: rows.map(r => ({ student_id: r.student_id, name: r.name, cells: order.map(k => r.cells[k] ? { pct: Math.round(100 * r.cells[k].r / Math.max(1, r.cells[k].n)), n: r.cells[k].n } : null) })) } } }];
}
const dayMs = 86400000, now = Date.now();
const mNow = new Date(now + 4 * 3600000); const weekStart = Date.UTC(mNow.getUTCFullYear(), mNow.getUTCMonth(), mNow.getUTCDate() - mNow.getUTCDay()) - 4 * 3600000; // Sunday 00:00 in Muscat
const xpOf = r => { const n = x => Number(x) || 0; return n(r.correct) * 10 + (r.won === "Yes" ? 30 : 0) + (r.type === "Practice exam" ? 20 : 0) + (n(r.questions) >= 15 ? 30 : 0) + (n(r.score_pct) === 100 && n(r.questions) >= 8 ? 50 : 0); };
const table = students.map(st => {
  const p = prof[st.student_id] || {}; const rs = resBy[st.student_id] || []; const es = exBy[st.student_id] || [];
  const lastTs = Math.max(0, seenBy[st.student_id] || 0, ...rs.map(r => ts(r, 'played_at')), ...es.map(e => ts(e, 'created_at')));
  const online = !!lastTs && (now - lastTs) <= ONLINE_MS;
  const wk = rs.filter(r => ts(r, 'played_at') >= weekStart); const t = skillTotals(rs); const weak = Object.keys(t).filter(k => t[k].n >= 3).sort((a, b) => (t[a].r / t[a].n) - (t[b].r / t[b].n)).slice(0, 2).map(k => SK[k] || k);
  return { student_id: st.student_id, name: st.name, short: st.short_name, pin_set: !!st.pin_set, exams: es.filter(e => e.kind === "exam").length, games: rs.length, best_pct: Number(p.best_pct) || 0, avg_pct: rs.length ? Math.round(rs.reduce((a, r) => a + (Number(r.score_pct) || 0), 0) / rs.length) : 0, xp: Number(p.xp) || 0, level: Number(p.level) || 1, streak: Number(p.streak) || 0, last_seen: lastTs ? new Date(lastTs).toISOString() : "", online, inactive: !online, weakest: weak.join(", "), wk_xp: wk.reduce((s, r) => s + xpOf(r), 0), wk_games: wk.length, wk_correct: wk.reduce((s, r) => s + (Number(r.correct) || 0), 0), wk_best: wk.reduce((m, r) => Math.max(m, Number(r.score_pct) || 0), 0) };
}).sort((a, b) => a.name.localeCompare(b.name));
const todayMuscat = new Date(now + 4 * 3600000).toISOString().slice(0, 10);
const examsToday = exams.filter(e => e.kind === "exam" && new Date(ts(e, 'created_at') + 4 * 3600000).toISOString().slice(0, 10) === todayMuscat).length;
const taskView = tasks.filter(t => t.active !== false).map(t => { const since = Date.parse(t.created_at) || 0; const done = students.filter(st => (exBy[st.student_id] || []).filter(e => e.kind === "exam" && ts(e, 'created_at') >= since && (Number(e.questions) || 0) >= (Number(t.len) || 0)).length >= (Number(t.count) || 1)).length; return { id: t.id, title: t.title, skills: t.skills, len: t.len, count: t.count, due: t.due, created_at: t.created_at, done, total: students.length }; });
return [{ json: { reply: { ok: true, table, totals: { students: students.length, exams: exams.filter(e => e.kind === "exam").length, examsToday, games: results.length, online: table.filter(r => r.online).length, active3d: table.filter(r => r.last_seen && (now - Date.parse(r.last_seen)) <= 3 * dayMs).length }, tasks: taskView, recent: exams.filter(e => e.kind === "exam").slice(0, 40).map(e => ({ id: e.id, student_id: e.student_id, name: e.name, title: e.title, questions: e.questions, created_at: e.created_at || e.createdAt, ok: e.ok })), week_start: new Date(weekStart).toISOString(), generated: new Date().toISOString() } } }];
