// GE2 Caravan: the student's task list with progress.
const st = $('Student for tasks').first().json || {};
if (!st.student_id) return [{ json: { reply: { ok: false, code: "login", error: "Please log in first." } } }];
const tasks = $('Tasks active').all().map(i => i.json).filter(t => t && t.title && t.active !== false);
const mine = $('Exams of student').all().map(i => i.json).filter(e => e && e.student_id === st.student_id && e.kind === "exam");
const view = tasks.map(t => { const since = Date.parse(t.created_at) || 0; const need = Number(t.count) || 1; const len = Number(t.len) || 0;
  const done = mine.filter(e => (Date.parse(e.created_at || e.createdAt) || 0) >= since && (Number(e.questions) || 0) >= len).length;
  return { id: t.id, title: t.title, skills: String(t.skills || "").split(/\s+/).filter(Boolean), len, count: need, due: t.due || "", done: Math.min(done, need), complete: done >= need }; })
  .sort((a, b) => (a.complete - b.complete) || String(a.due).localeCompare(String(b.due)));
return [{ json: { reply: { ok: true, tasks: view } } }];
