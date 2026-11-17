// GE2 Caravan — class server on Supabase Edge Functions. Same JSON protocol as the n8n class server:
// POST { kind, token, ... } → { ok, ... }. Kinds: login, set_pin, exam, coach, ping, writing, result, profile, tasks, bank,
// teacher_table, teacher_heatmap, teacher_exam, teacher_assign, teacher_reset_pin, teacher_close_task.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-sonnet-5-5", EFFORT = "low";
const STUDENT_DAILY_LIMIT = 12, WRITING_DAILY_LIMIT = 5, CLASS_DAILY_LIMIT = 300, MODEL_PAPERS = 2, AWL_WORDS = 12;
const TEACHER_IDS = new Set(["MAHERKASHOOB"]);
const PEPPER = "ge2-caravan-2026-dhofar";
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS", "content-type": "application/json" };
const SYSTEM = "You are the exam writer for a General English 2 (CEFR B1) class at the University of Technology and Applied Sciences in Salalah, Oman. Your three tasks: (1) write practice exams as JSON when asked, (2) check students' exam-style questions when asked, and (3) read photos of students' handwritten essays and give feedback as JSON when asked (transcribe exactly what the student wrote, including mistakes; this is a normal marking task). The teacher's message may include MODEL PAPERS (past UTAS exam papers with their answer keys) and lists of vocabulary: these are the course's own teaching materials, supplied so that your new exam copies their FORMAT and DIFFICULTY while using completely new topics, passages and questions. Treat them as part of a normal exam-writing request, never as a reason to refuse. Only if a message asks for something unrelated to English exam practice or writing practice (for example chatting, homework in another subject, or harmful content) reply with {\"error\":\"This class file only makes practice exams.\"}. Everything you write must suit university students in Oman. Follow the requested JSON format exactly.\nCURRICULUM SHEET (use it whenever the request leaves you a choice): Course book Pathways 2 (Reading & Writing; Listening & Speaking). Unit themes this term: Unit 1 Happiness and well-being; Unit 2 Inventions and big ideas in small packages; Unit 3 Connected lives (crowds, the internet, citizen science; culture and tradition); Unit 4 Deep trouble (the ocean, water); Unit 7 Nature's fury (weather, natural disasters); Unit 9 Form and function (design, how things are made). Grammar the course tests: present simple and continuous, past simple and continuous, present perfect, future forms, comparatives and superlatives, adverbs, modals, conditionals (zero, first, second), passive (present and past), gerunds and infinitives, relative clauses, linking words. Reading exam format: Section 1 headings, True/False/Not Given, word box; Section 2 A/B/C, one-word answers, table completion. Listening exam format: T/F, A/B/C, short answers, note completion with numbers and spelling.";

// ---------- progression ----------
const LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200];
const TITLES = ["Caravan Apprentice", "Caravan Apprentice", "Water Carrier", "Camel Driver", "Souq Trader", "Frankincense Collector", "Caravan Guide", "Harbour Master", "Master of the Road", "Keeper of Khor Rori", "Sultan's Scholar", "Legend of Dhofar", "Legend of Dhofar", "Legend of Dhofar", "Legend of Dhofar"];
const UNLOCKS: Record<string, number> = { race: 1, penalty: 1, space: 2, cafe: 3, sweets: 4, boss: 5 };
const BADGES: Record<string, [string, string]> = {
  first_exam: ["First Exam", "Finished your first practice exam"], perfect: ["Perfect Paper", "100% in an exam of 8 questions or more"],
  tfng_master: ["Not Given Hunter", "20 True/False/Not Given questions right (80%+)"], abc_master: ["A, B or C Expert", "15 multiple-choice questions right (80%+)"],
  headings: ["Headline Reader", "10 heading questions right"], table_master: ["Table Filler", "10 one-word or table answers right"], listener: ["Sharp Ears", "10 listening questions right"],
  full_paper: ["Full Paper", "Finished a 25-question reading paper"], streak3: ["Three-Day Streak", "Practised three days in a row"], streak7: ["Week Warrior", "Practised seven days in a row"],
  ten_exams: ["Ten Exams", "Finished ten practice exams"], grammar: ["Grammar Guard", "15 grammar questions right"], game_maker: ["Game Maker", "A classmate played the game you made"],
  crown: ["Crown", "Won a Word Royale"], chicken: ["Chicken Dinner", "Last five standing in a Word Royale"], serpent: ["Serpent of the Wadi", "Won a round of Wadi Snakes"],
  duelist: ["Duelist", "Won five duels in one round of Wadi Snakes"], untouchable: ["Untouchable", "A whole Wadi Snakes round without dying"], giant: ["Giant-Slayer", "Beat a top-5 snake right after coming back"],
  keeper_taqah: ["Keeper of Taqah", "Held the fort of Taqah for three waves"], keeper_mirbat: ["Keeper of Mirbat", "Held the fort of Mirbat for three waves"], keeper_nizwa: ["Keeper of Nizwa", "Held the fort of Nizwa for three waves"],
  keeper_bahla: ["Keeper of Bahla", "Held the fort of Bahla for three waves"], keeper_sohar: ["Keeper of Sohar", "Held the fort of Sohar for three waves"], wall_unbroken: ["Wall Unbroken", "Held a fort with no damage to the wall"],
  stone_finder: ["Stone Finder", "Found the lost caravan stones in Khareef Rally"], road_frankincense: ["Road of Frankincense", "Found all five stones across Dhofar"], captain_zanzibar: ["Captain of Zanzibar", "Sailed the dhow from Sur to Zanzibar"],
  scribe: ["Scribe", "Sent a handwritten essay to Claude"], examples_master: ["Example Master", "An essay with four examples that have a place, number or name"], gold_pen: ["Gold Pen", "9 or 10 out of 10 for an essay"],
  steady_hand: ["Steady Hand", "Answered every storm question on the voyage"],
};
const SK: Record<string, string> = { r_head: "Headings", r_tfng: "T/F/NG", r_box: "Word box", r_abc: "A/B/C", r_word: "One word", r_table: "Table", r_vocab: "Vocabulary", r_infer: "Inference", l_tf: "Listen T/F", l_abc: "Listen A/B/C", l_short: "Listen short", l_note: "Listen notes", g_passive: "Passive", g_modal: "Modals", g_cond: "Conditionals", g_tense: "Tenses", g_rel: "Relative", g_link: "Linking", v_awl: "AWL", r_scan: "Scanning for facts", w_essay: "Writing" };
const levelFor = (xp: number) => { let L = 1; for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) L = i + 1; return L; };
const nextXp = (L: number) => LEVELS[Math.min(L, LEVELS.length - 1)];
const unlocksFor = (L: number) => Object.keys(UNLOCKS).filter(g => UNLOCKS[g] <= L);
const muscatDay = (t?: number) => new Date((t ?? Date.now()) + 4 * 3600000).toISOString().slice(0, 10);
const n = (x: unknown) => Number(x) || 0;
const s = (x: unknown, m = 200) => String(x == null ? "" : x).trim().slice(0, m);
const ts = (x: unknown) => Date.parse(String(x || "")) || 0;
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });
const fail = (code: string, error: string, extra: Record<string, unknown> = {}) => reply({ ok: false, code, error, ...extra });
const loose = (t: unknown): any => { if (t && typeof t === "object") return t as any; let x = String(t || "").trim(); try { return JSON.parse(x); } catch (_) {} const f = x.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) { try { return JSON.parse(f[1]); } catch (_) {} } const a = x.indexOf("{"), b = x.lastIndexOf("}"); if (a >= 0 && b > a) { try { return JSON.parse(x.slice(a, b + 1)); } catch (_) {} } return null; };
async function sha256hex(str: string) { const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join(""); }
const pinHash = (id: string, pin: string) => sha256hex(PEPPER + "|" + id.toUpperCase() + "|" + pin);
const rnd = (len = 32) => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; const b = crypto.getRandomValues(new Uint8Array(len)); let t = ""; for (const x of b) t += a[x % a.length]; return t; };
const skillTotals = (rows: any[]) => { const t: Record<string, { r: number; n: number }> = {}; for (const r of rows) for (const part of String(r.skill_codes || "").split(/\s+/)) { const m = part.match(/^([a-z_]+):(\d+)\/(\d+)$/); if (!m) continue; const k = m[1]; t[k] = t[k] || { r: 0, n: 0 }; t[k].r += +m[2]; t[k].n += +m[3]; } return t; };
const examsToSpec = (e: any) => ({ id: e.id, student_id: e.student_id, name: e.name, title: e.title, questions: e.questions, skills: e.skills, kind: e.kind, ok: e.ok, created_at: e.created_at, exam_json: e.exam_json });

// ---------- request parsing (same as "Read the request") ----------
function parse(bodyText: string) {
  let b: any = null; try { b = JSON.parse(bodyText); } catch (_) {}
  if (b && typeof b === "object" && typeof b.data === "string" && !b.kind) { try { b = JSON.parse(b.data); } catch (_) {} }
  b = (b && typeof b === "object") ? b : {};
  const kind = s(b.kind, 24).toLowerCase() || "exam";
  const id = s(b.id, 16).toUpperCase().replace(/[^0-9A-Z]/g, "");
  return { kind, id, idOK: /^[0-9A-Z]{3,14}$/.test(id), pinIn: s(b.pin, 8).replace(/\D/g, ""), setPin: kind === "set_pin", name: s(b.name, 60).replace(/\s+/g, " "), token: s(b.token, 64), device: s(b.device, 12),
    prompt: String(b.prompt || "").slice(0, 60000), images: Array.isArray(b.images) ? b.images.slice(0, 4) : [], fast: b.fast === true, body: b, data: (b.data && typeof b.data === "object") ? b.data : {} };
}
type Req = ReturnType<typeof parse>;
function pick<T>(arr: T[], k: number): T[] { const a = arr.slice(); const out: T[] = []; while (a.length && out.length < k) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return out; }

async function session(token: string) {
  if (!token) return null;
  const { data } = await sb.from("sessions").select("token, student_id, people!inner(student_id, name, short_name, role, group_id, branch_id, active)").eq("token", token).maybeSingle();
  if (!data || !(data as any).people || (data as any).people.active === false) return null;
  const p = (data as any).people; await sb.from("sessions").update({ last_seen: new Date().toISOString() }).eq("token", token);
  return { token, student_id: p.student_id, name: p.name, short: p.short_name || "", role: p.role || "student", group_id: p.group_id, branch_id: p.branch_id };
}

// ---------- login / set_pin ----------
async function login(req: ReturnType<typeof parse>) {
  if (!req.idOK) return fail("id", "Type your College ID using letters and numbers only, like 46J2696.");
  if (req.pinIn.length !== 4) return fail("pin", "Type your 4-digit PIN.");
  const { data: roster } = await sb.from("people").select("*").eq("student_id", req.id).maybeSingle();
  if (!roster) return fail("roster", "This College ID is not on the class list. Check the ID, or ask your teacher to add you.");
  if (roster.active === false) return fail("roster", "This account is not active. Ask your teacher.");
  let first = false;
  if (!roster.pin_set || !roster.pin_hash) {
    if (!req.setPin) return fail("newpin", "First time here. Choose a 4-digit PIN that you will remember.");
    if (/^(\d)\1{3}$/.test(req.pinIn) || req.pinIn === "1234") return fail("weakpin", "Choose a PIN that is harder to guess (not 1234 or 0000).");
    await sb.from("people").update({ pin_hash: await pinHash(req.id, req.pinIn), pin_set: true }).eq("student_id", req.id); first = true;
  } else {
    if (req.setPin) return fail("pin", "A PIN already exists for this ID. Type your PIN to log in, or ask your teacher to reset it.");
    if ((await pinHash(req.id, req.pinIn)) !== roster.pin_hash) return fail("pin", "That PIN is not right. Try again, or ask your teacher to reset it.");
  }
  const token = rnd();
  await sb.from("sessions").insert({ token, student_id: req.id, device: req.device });
  return reply({ ok: true, token, name: roster.name || req.id, short: roster.short_name || "", id: req.id, role: roster.role || "student", first });
}

// ---------- Claude ----------
async function claude(req: ReturnType<typeof parse>, me: any) {
  const kind = req.kind;
  if (kind !== "ping" && !me) return fail("login", "Please log in with your College ID first.");
  let prompt = kind === "ping" ? "Reply with the single word: OK" : req.prompt;
  if (!prompt) return fail("bad", "The request was empty.");
  const teacher = me && (TEACHER_IDS.has(me.student_id) || me.role === "teacher" || me.role === "admin");
  const dayStart = new Date(Date.now() + 4 * 3600000); dayStart.setUTCHours(0, 0, 0, 0); const since = new Date(dayStart.getTime() - 4 * 3600000).toISOString();
  if (me && !teacher && (kind === "exam" || kind === "writing")) {
    const { count } = await sb.from("exams").select("id", { count: "exact", head: true }).eq("student_id", me.student_id).eq("kind", kind).gte("created_at", since);
    const lim = kind === "exam" ? STUDENT_DAILY_LIMIT : WRITING_DAILY_LIMIT;
    if ((count || 0) >= lim) return fail("limit", kind === "exam" ? `You have made ${lim} exams today - that is the daily limit. Play your games again, or come back tomorrow.` : `You have sent ${lim} writings today - that is the daily limit. Come back tomorrow.`);
  }
  if (kind === "writing" && !req.images.length && !/TRANSCRIPT CONFIRMED/.test(prompt)) return fail("bad", "Add a photo of your page first.");
  if (prompt.length > 60000) return fail("long", "The text is too long. Use fewer pages or a shorter text.");
  if (kind !== "ping" && me) {
    const day = muscatDay(), gid = me.group_id || "none";
    const { data: u } = await sb.from("usage").select("claude_calls").eq("day", day).eq("group_id", gid).maybeSingle();
    if ((u?.claude_calls || 0) >= CLASS_DAILY_LIMIT) return fail("limit", "The class has used today's Claude requests. Try again tomorrow.");
    await sb.from("usage").upsert({ day, group_id: gid, claude_calls: (u?.claude_calls || 0) + 1 });
  }
  const used: any = { papers: [], awl: [] };
  if (kind === "exam") {
    const { data: lib } = await sb.from("library").select("*").eq("active", true).or(`branch_id.is.null,branch_id.eq.${me.branch_id || "none"}`);
    const library = lib || [];
    const b0 = req.body; const skills: string[] = Array.isArray(b0.skills) ? b0.skills.map(String) : [];
    if (b0.style !== false && MODEL_PAPERS > 0 && library.length) {
      const full = Number(b0.len) === 25 && !skills.some(x => /^l_/.test(x)); const want = new Set<string>();
      if (full || skills.some(x => /^r_(head|tfng|box)$/.test(x))) want.add("reading_s1");
      if (full || skills.some(x => /^r_(abc|word|table|vocab|infer)$/.test(x))) want.add("reading_s2");
      if (skills.some(x => /^l_/.test(x))) want.add(skills.includes("l_note") ? "listening_s2" : "listening_s1");
      if (!want.size && skills.length) want.add("reading_s2");
      const chosen: any[] = []; for (const sec of want) { const rows = library.filter((r: any) => r.section === sec); const official = rows.filter((r: any) => r.type === "past_exam"); const row = pick(official.length ? official : rows, 1)[0]; if (row) chosen.push(row); }
      chosen.slice(0, MODEL_PAPERS).forEach((row: any) => used.papers.push(row.source));
      if (chosen.length) { prompt += "\n\nSTYLE GUIDE FROM OUR COURSE (very important)\nBelow are past UTAS exam papers from this course, supplied by the teacher as the model to follow. Still write the new exam described above. It must match the format, difficulty, instruction wording and question style of the UTAS papers below: the same kinds of distractors, texts of similar length and level, headings that summarise whole paragraphs, Not Given items that are truly not mentioned, one-word answers copied exactly from the text. Do NOT reuse their topics, passages, sentences or questions; write new material on a different topic.";
        chosen.slice(0, MODEL_PAPERS).forEach((row: any, i: number) => { prompt += "\n\n--- MODEL PAPER " + (i + 1) + ": " + row.source + " (" + row.section + ") ---\n" + String(row.text).slice(0, 9000); }); }
    }
    if (b0.awl !== false && AWL_WORDS > 0) {
      const vocabRows = library.filter((r: any) => r.type === "awl"); const topic = prompt.toLowerCase();
      const score = (r: any) => String(r.theme || "").toLowerCase().split(/[^a-z-]+/).filter((w: string) => w.length > 3).reduce((a: number, w: string) => a + (topic.includes(w) ? 1 : 0), 0);
      const ranked = vocabRows.map((r: any) => ({ r, s: score(r) })).sort((a: any, b: any) => b.s - a.s);
      const splitWords = (r: any) => String(r.text).split(/\s*[,;\n]\s*/).map((w: string) => w.trim().toLowerCase()).filter((w: string) => w && /^[a-z][a-z -]*$/.test(w));
      let chosenWords: string[] = []; if (ranked.length && ranked[0].s > 0) chosenWords = pick(splitWords(ranked[0].r), Math.min(AWL_WORDS, 8));
      const rest: string[] = [...new Set(vocabRows.flatMap(splitWords) as string[])].filter((w: string) => !chosenWords.includes(w)); chosenWords = chosenWords.concat(pick(rest, AWL_WORDS - chosenWords.length));
      if (chosenWords.length) { used.awl = chosenWords; used.unit = ranked.length && ranked[0].s > 0 ? String(ranked[0].r.theme).split("|")[0].trim() : ""; prompt += "\n\nVOCABULARY FROM OUR TEXTBOOK (Pathways 2): use at least " + Math.min(8, chosenWords.length) + " of these words naturally in the text(s), at B1 level, and make at least two questions depend on understanding them: " + chosenWords.join(", ") + ". Add a top-level JSON field \"awl_used\" listing the ones you used."; }
    }
  }
  const content: any[] = [];
  for (const im of req.images) { const type = String(im?.type || ""), data = String(im?.data || ""); if (/^image\/(jpeg|png|webp|gif)$/.test(type) && data.length < 4000000) content.push({ type: "image", source: { type: "base64", media_type: type, data } }); }
  content.push({ type: "text", text: prompt });
  const body: any = { model: MODEL, max_tokens: kind === "ping" ? 300 : kind === "writing" ? 5000 : 16000, system: SYSTEM, messages: [{ role: "user", content }], output_config: { effort: kind === "writing" ? "medium" : EFFORT } };
  if (!ANTHROPIC_KEY) return fail("key", "The Claude key is not set on the server yet.");
  let r: Response; try { r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify(body) }); }
  catch (e) { return fail("busy", "Claude did not answer in time. " + String((e as Error).message || e).slice(0, 120)); }
  const j: any = await r.json().catch(() => ({}));
  let out: any;
  if (r.ok) { if (j.stop_reason === "refusal") out = { ok: false, code: "refused", error: "Claude did not accept this text." }; else out = { ok: true, text: (Array.isArray(j.content) ? j.content : []).filter((x: any) => x?.type === "text").map((x: any) => x.text).join(""), stop: j.stop_reason || "" }; }
  else { const msg = String(j?.error?.message || ("Claude answered with error " + r.status)); let code = "error"; if (/credit|balance|billing|spend/i.test(msg)) code = "credit"; else if (r.status === 401 || r.status === 403) code = "key"; else if (r.status === 429 || r.status === 529 || r.status >= 500) code = "busy"; else if (r.status === 413 || /too long|too large|too many tokens/i.test(msg)) code = "long"; out = { ok: false, code, status: r.status, error: msg.slice(0, 200) }; }
  if (kind === "exam" || kind === "writing") {
    const text = out.ok ? String(out.text || "") : ""; const spec = text ? loose(text) : null; const title = (spec && spec.title) || (text.match(/"title"\s*:\s*"([^"]{1,120})"/) || [])[1] || "";
    const skillsStr = Array.isArray(req.body.skills) ? req.body.skills.map(String).join(" ") : "";
    await sb.from("exams").insert({ student_id: me.student_id, group_id: me.group_id, kind, title: s(title, 120), skills: skillsStr, questions: n(req.body.len), exam_json: spec || (text ? { raw: text.slice(0, 60000) } : null), ok: out.ok === true, vocab_unit: used.unit || null });
  }
  return reply(out);
}

// ---------- result ----------
async function result(req: ReturnType<typeof parse>, me: any) {
  if (!me) return fail("login", "Please log in first.");
  const b: any = req.body.result && typeof req.body.result === "object" ? req.body.result : req.body;
  const sk: any[] = Array.isArray(b.skills) ? b.skills : []; const total = n(b.total), right = n(b.right);
  const maker = String(b.maker || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const type = b.type === "Practice exam" ? "Practice exam" : (b.type === "Class game" ? "Class game" : "Student game");
  const gameBadges = (Array.isArray(b.badges) ? b.badges : []).map(String).filter((x: string) => /^[a-z_]{2,20}$/.test(x));
  const row = { student_id: me.student_id, group_id: me.group_id, type, exam: s(b.exam, 80), exam_id: s(b.examId, 40) || null, game: s(b.game, 40) || null, maker: maker && maker !== me.student_id ? maker : null, correct: right, questions: total, score_pct: total ? Math.round(100 * right / total) : 0, grade: s(b.grade, 2), won: !!b.won,
    skill_codes: sk.map(x => `${x.id}:${n(x.r)}/${n(x.n)}`).join(" "), weakest: s(b.weakest, 60), score: n(b.score), badges: gameBadges.join(",") };
  if (!total) return reply({ ok: false, code: "bad", error: "No result." });
  await sb.from("results").insert(row);
  // profile
  const [{ data: prof }, { data: recent }] = await Promise.all([sb.from("profiles").select("*").eq("student_id", me.student_id).maybeSingle(), sb.from("results").select("type, correct, questions, score_pct, skill_codes").eq("student_id", me.student_id)]);
  const p: any = prof || {}; const rs: any[] = recent || [];
  const isExam = type === "Practice exam";
  let gained = (type === "Class game" && row.score > 0) ? row.score : row.correct * 10 + (row.won ? 30 : 0) + (isExam ? 20 : 0) + (row.questions >= 15 ? 30 : 0) + (row.score_pct === 100 && row.questions >= 8 ? 50 : 0);
  const today = muscatDay(), yesterday = muscatDay(Date.now() - 86400000); const lastPlay = p.last_play ? String(p.last_play).slice(0, 10) : "";
  let streak = n(p.streak); if (lastPlay === today) streak = Math.max(1, streak); else if (lastPlay === yesterday) streak += 1; else streak = 1;
  gained += Math.min(streak, 7) * 5;
  const xp = n(p.xp) + gained, oldLevel = n(p.level) || 1, level = levelFor(xp);
  const t = skillTotals(rs); const good = (ids: string[], need: number) => { let r = 0, tt = 0; for (const id of ids) if (t[id]) { r += t[id].r; tt += t[id].n; } return r >= need && r / Math.max(1, tt) >= 0.8; };
  const exams = rs.filter(x => x.type === "Practice exam"); const have = new Set(String(p.badges || "").split(",").filter(Boolean)); const earned = new Set(have);
  if (exams.length >= 1) earned.add("first_exam"); if (exams.length >= 10) earned.add("ten_exams");
  if (rs.some(x => n(x.score_pct) === 100 && n(x.questions) >= 8)) earned.add("perfect"); if (rs.some(x => n(x.questions) >= 25)) earned.add("full_paper");
  if (good(["r_tfng"], 20)) earned.add("tfng_master"); if (good(["r_abc", "l_abc"], 15)) earned.add("abc_master"); if (good(["r_head"], 10)) earned.add("headings");
  if (good(["r_word", "r_table", "r_box"], 10)) earned.add("table_master"); if (good(["l_tf", "l_abc", "l_note"], 10)) earned.add("listener"); if (good(Object.keys(t).filter(k => k.startsWith("g_")), 15)) earned.add("grammar");
  if (streak >= 3) earned.add("streak3"); if (streak >= 7) earned.add("streak7"); for (const gb of gameBadges) if (BADGES[gb]) earned.add(gb);
  const newBadges = [...earned].filter(x => !have.has(x)); const unlocks = unlocksFor(level), newUnlocks = unlocks.filter(u => !unlocksFor(oldLevel).includes(u));
  const profile = { student_id: me.student_id, xp, level, title: TITLES[Math.min(level - 1, TITLES.length - 1)], streak, last_play: today, games: n(p.games) + 1, exams: n(p.exams) + (isExam ? 1 : 0), best_pct: Math.max(n(p.best_pct), row.score_pct), badges: [...earned].join(","), unlocks: unlocks.join(","), updated: new Date().toISOString() };
  await sb.from("profiles").upsert(profile);
  // maker bonus: +50 XP once per classmate per day
  if (row.maker) { const { data: already } = await sb.from("results").select("id").eq("student_id", me.student_id).eq("maker", row.maker).gte("played_at", new Date(Date.now() - 86400000).toISOString()).limit(2); if ((already || []).length <= 1) { const { data: mp } = await sb.from("profiles").select("*").eq("student_id", row.maker).maybeSingle(); const { data: mr } = await sb.from("people").select("student_id").eq("student_id", row.maker).maybeSingle(); if (mr) { const mxp = n(mp?.xp) + 50, ml = levelFor(mxp); const mb = String(mp?.badges || "").split(",").filter(Boolean); if (!mb.includes("game_maker")) mb.push("game_maker"); await sb.from("profiles").upsert({ student_id: row.maker, xp: mxp, level: ml, title: TITLES[Math.min(ml - 1, TITLES.length - 1)], streak: n(mp?.streak), last_play: mp?.last_play || null, games: n(mp?.games), exams: n(mp?.exams), best_pct: n(mp?.best_pct), badges: mb.join(","), unlocks: unlocksFor(ml).join(","), updated: new Date().toISOString() }); } } }
  const view = { xp, level, title: profile.title, nextXp: nextXp(level), prevXp: LEVELS[level - 1] || 0, streak, gained, leveled: level > oldLevel, newBadges: newBadges.map(x => ({ id: x, name: BADGES[x][0], how: BADGES[x][1] })), badges: [...earned].map(x => ({ id: x, name: (BADGES[x] || [x])[0], how: (BADGES[x] || ["", ""])[1] })), unlocks, newUnlocks, games: profile.games, exams: profile.exams, best_pct: profile.best_pct };
  return reply({ ok: true, saved: true, profile: view });
}

// ---------- profile ----------
async function profileView(me: any) {
  if (!me) return fail("login", "Please log in with your College ID first.");
  const { data: all } = await sb.from("profiles").select("student_id, xp, level, title, streak, games, exams, best_pct, badges, unlocks, people!inner(name, group_id)").eq("people.group_id", me.group_id).order("xp", { ascending: false });
  const rows: any[] = (all || []).map((x: any) => ({ ...x, name: x.people?.name }));
  const meRow = rows.find(x => x.student_id === me.student_id) || { student_id: me.student_id, name: me.name, xp: 0, level: 1, title: TITLES[0], streak: 0, games: 0, exams: 0, best_pct: 0, badges: "", unlocks: unlocksFor(1).join(",") };
  const rank = rows.findIndex(x => x.student_id === me.student_id) + 1; const level = n(meRow.level) || 1;
  const board = rows.slice(0, 10).map((x, i) => ({ rank: i + 1, name: x.name || x.student_id, level: n(x.level) || 1, xp: n(x.xp), streak: n(x.streak), me: x.student_id === me.student_id }));
  const since = new Date(Date.now() + 4 * 3600000); since.setUTCHours(0, 0, 0, 0); const sinceIso = new Date(since.getTime() - 4 * 3600000).toISOString();
  const [{ count: exToday }, { count: wrToday }] = await Promise.all([sb.from("exams").select("id", { count: "exact", head: true }).eq("student_id", me.student_id).eq("kind", "exam").gte("created_at", sinceIso), sb.from("exams").select("id", { count: "exact", head: true }).eq("student_id", me.student_id).eq("kind", "writing").gte("created_at", sinceIso)]);
  const teacher = me.role === "teacher" || me.role === "admin" || TEACHER_IDS.has(me.student_id);
  return reply({ ok: true, today: { exams: exToday || 0, limit: teacher ? 999 : STUDENT_DAILY_LIMIT, writings: wrToday || 0, wlimit: teacher ? 999 : WRITING_DAILY_LIMIT }, profile: { xp: n(meRow.xp), level, title: meRow.title || TITLES[Math.min(level - 1, TITLES.length - 1)], nextXp: nextXp(level), prevXp: LEVELS[level - 1] || 0, streak: n(meRow.streak), games: n(meRow.games), exams: n(meRow.exams), best_pct: n(meRow.best_pct),
    badges: String(meRow.badges || "").split(",").filter(Boolean).map(b => ({ id: b, name: (BADGES[b] || [b])[0], how: (BADGES[b] || ["", ""])[1] })), allBadges: Object.keys(BADGES).map(b => ({ id: b, name: BADGES[b][0], how: BADGES[b][1] })), unlocks: String(meRow.unlocks || "").split(",").filter(Boolean), unlockLevels: UNLOCKS, rank, students: rows.length }, board });
}

// ---------- tasks / bank ----------
async function tasks(req: ReturnType<typeof parse>, me: any) {
  if (!me) return fail("login", "Please log in first.");
  if (req.kind === "bank") {
    const d = req.data; const want: string[] = Array.isArray(d.skills) ? d.skills.map(String) : []; const len = n(d.len); const wantId = s(d.id, 20), wantTitle = s(d.title, 120).toLowerCase(), count = Math.min(5, Math.max(1, n(d.count) || 1));
    if (wantId || wantTitle) { let q = sb.from("exams").select("*, people!inner(name)").eq("kind", "exam").eq("ok", true); q = wantId ? q.eq("id", Number(wantId) || 0) : q.eq("student_id", me.student_id).ilike("title", wantTitle); const { data } = await q.limit(1); const e: any = (data || [])[0]; const sp = e && loose(e.exam_json); if (!sp || !Array.isArray(sp.questions)) return fail("empty", "That exam was not found. Make it again.");
      return reply({ ok: true, bank: true, spec: sp, title: e.title || sp.title || "", by: String(e.people?.name || "").split(/\s+/)[0], questions: n(e.questions), skills: String(e.skills || "").split(/\s+/).filter(Boolean), made: e.created_at, pool: 1, id: e.id }); }
    const [{ data }, { data: played }] = await Promise.all([sb.from("exams").select("id, student_id, title, skills, questions, exam_json, created_at, people!inner(name)").eq("kind", "exam").eq("ok", true).eq("group_id", me.group_id).neq("student_id", me.student_id).order("created_at", { ascending: false }).limit(400), sb.from("results").select("exam_id").eq("student_id", me.student_id).like("exam_id", "b%")]);
    const done = new Set<string>(((played || []).map((r: any) => String(r.exam_id || "").slice(1))).concat((Array.isArray(d.exclude) ? d.exclude : []).map((x: unknown) => String(x).replace(/^b/, ""))));
    const all: any[] = (data || []).filter(e => !/^(TEST|49X)/.test(e.student_id) && !done.has(String(e.id)) && e.exam_json && Array.isArray(e.exam_json.questions) && e.exam_json.questions.length);
    const sk = (e: any) => String(e.skills || "").split(/\s+/).filter(Boolean);
    const score = (e: any) => { const ss = sk(e); const hit = want.filter(w => ss.includes(w)).length; return (want.length ? hit / want.length : 1) * 2 + (len && n(e.questions) === len ? 1 : 0) + (len && Math.abs(n(e.questions) - len) <= 5 ? 0.5 : 0); };
    const ranked = all.map(e => ({ e, s: score(e) })).filter(x => x.s >= (want.length ? 1 : 0)).sort((a, b) => b.s - a.s);
    const top = ranked.slice(0, 8).sort(() => Math.random() - 0.5); if (!top.length) return fail("empty", done.size ? "You have finished every matching exam in the bank. Try other skills, or a different length." : "No classmate has made an exam like this yet. Make your own with Claude.");
    const specs = top.slice(0, count).map(x => ({ spec: x.e.exam_json, title: x.e.title || x.e.exam_json.title || "", by: String(x.e.people?.name || "").split(/\s+/)[0], id: x.e.id }));
    if (count > 1) return reply({ ok: true, bank: true, specs, pool: ranked.length });
    const pk = top[0].e; return reply({ ok: true, bank: true, id: pk.id, spec: pk.exam_json, title: pk.title || pk.exam_json.title || "", by: String(pk.people?.name || "a classmate").split(/\s+/)[0], questions: n(pk.questions), skills: sk(pk), made: pk.created_at, pool: ranked.length });
  }
  const [{ data: tk }, { data: mine }] = await Promise.all([sb.from("tasks").select("*").eq("group_id", me.group_id).eq("active", true), sb.from("exams").select("questions, created_at").eq("student_id", me.student_id).eq("kind", "exam")]);
  const view = (tk || []).map((t: any) => { const since = ts(t.created_at), need = n(t.count) || 1, len = n(t.len); const done = (mine || []).filter((e: any) => ts(e.created_at) >= since && n(e.questions) >= len).length; return { id: t.id, title: t.title, skills: String(t.skills || "").split(/\s+/).filter(Boolean), len, count: need, due: t.due || "", done: Math.min(done, need), complete: done >= need }; }).sort((a: any, b: any) => (Number(a.complete) - Number(b.complete)) || String(a.due).localeCompare(String(b.due)));
  return reply({ ok: true, tasks: view });
}

// ---------- projects (slides) ----------
async function projects(req: Req, me: any) {
  if (!me) return fail("login", "Please log in first.");
  const d = req.data;
  if (req.kind === "project_save") {
    const slides = Array.isArray(d.slides) ? d.slides.slice(0, 30) : []; if (!slides.length) return fail("bad", "No slides.");
    const deck = { title: s(d.title, 120), topic: s(d.topic, 120), theme: s(d.theme, 12) || "sand", slides };
    if (JSON.stringify(deck).length > 2500000) return fail("long", "The project is too big. Use smaller or fewer pictures.");
    const id = Number(d.id) || 0;
    if (id) { const { data: ex } = await sb.from("exams").select("id, student_id").eq("id", id).eq("kind", "project").maybeSingle(); if (ex && ex.student_id === me.student_id) { await sb.from("exams").update({ title: deck.title, exam_json: deck, questions: slides.length }).eq("id", id); return reply({ ok: true, id }); } }
    const { data: ins, error } = await sb.from("exams").insert({ student_id: me.student_id, group_id: me.group_id, kind: "project", title: deck.title, skills: "", questions: slides.length, exam_json: deck, ok: true }).select("id").single();
    if (error || !ins) return fail("error", "Could not save."); return reply({ ok: true, id: ins.id });
  }
  if (req.kind === "project_get") { const id = Number(String(d.id || "").replace(/\D/g, "")) || 0; const { data: ex } = await sb.from("exams").select("id, student_id, title, exam_json, created_at, people!inner(name)").eq("id", id).eq("kind", "project").eq("group_id", me.group_id).maybeSingle(); if (!ex || !ex.exam_json) return fail("nf", "No project with that code."); const j: any = ex.exam_json; return reply({ ok: true, project: { id: ex.id, student_id: ex.student_id, by: String((ex as any).people?.name || "").split(/\s+/)[0], title: j.title || ex.title, topic: j.topic || "", theme: j.theme || "sand", slides: Array.isArray(j.slides) ? j.slides : [] } }); }
  const { data } = await sb.from("exams").select("id, student_id, title, questions, created_at, people!inner(name)").eq("kind", "project").eq("group_id", me.group_id).order("created_at", { ascending: false }).limit(60);
  return reply({ ok: true, projects: (data || []).map((e: any) => ({ id: e.id, title: e.title, by: String(e.people?.name || "").split(/\s+/)[0], mine: e.student_id === me.student_id, slides: e.questions, created_at: e.created_at })) });
}

// ---------- teacher ----------
async function teacher(req: ReturnType<typeof parse>, me: any) {
  if (!me) return fail("login", "Please log in first.");
  if (!(me.role === "teacher" || me.role === "admin" || TEACHER_IDS.has(me.student_id))) return fail("role", "Teacher only.");
  const gid = me.group_id; const d = req.data;
  if (req.kind === "teacher_assign") { await sb.from("tasks").insert({ group_id: gid, title: s(d.title, 120) || "Practice", skills: (Array.isArray(d.skills) ? d.skills : String(d.skills || "").split(/\s+/)).map(String).filter(Boolean).join(" "), len: n(d.len) || 8, count: n(d.count) || 1, due: s(d.due, 20), created_by: me.student_id }); return reply({ ok: true }); }
  if (req.kind === "teacher_reset_pin") { await sb.from("people").update({ pin_hash: null, pin_set: false }).eq("student_id", s(d.student_id, 16).toUpperCase()); return reply({ ok: true }); }
  if (req.kind === "teacher_close_task") { await sb.from("tasks").update({ active: false }).eq("id", n(d.id)); return reply({ ok: true }); }
  const [{ data: roster }, { data: profiles }, { data: results }, { data: exams }, { data: tk }, { data: sess }] = await Promise.all([
    sb.from("people").select("*").eq("group_id", gid).eq("active", true), sb.from("profiles").select("*"),
    sb.from("results").select("*").eq("group_id", gid).order("played_at", { ascending: false }).limit(3000),
    sb.from("exams").select("id, student_id, kind, title, questions, skills, ok, created_at, vocab_unit").eq("group_id", gid).order("created_at", { ascending: false }).limit(2000),
    sb.from("tasks").select("*").eq("group_id", gid), sb.from("sessions").select("student_id, last_seen").gte("last_seen", new Date(Date.now() - 3 * 86400000).toISOString())]);
  const students = (roster || []).filter((r: any) => r.role === "student" || !r.role); const byId = (arr: any[]) => { const m: Record<string, any[]> = {}; for (const x of arr) (m[x.student_id] = m[x.student_id] || []).push(x); return m; };
  const resBy = byId(results || []), exBy = byId(exams || []); const prof: Record<string, any> = {}; for (const p of profiles || []) prof[p.student_id] = p;
  const seenBy: Record<string, number> = {}; for (const x of sess || []) seenBy[x.student_id] = Math.max(seenBy[x.student_id] || 0, ts(x.last_seen));
  const nameOf: Record<string, string> = {}; for (const r of roster || []) nameOf[r.student_id] = r.short_name || r.name;
  if (req.kind === "teacher_exam") { const id = n(d.exam_id || d.id); const { data: ex } = await sb.from("exams").select("*, people!inner(name)").eq("id", id).maybeSingle(); if (!ex) return fail("nf", "Exam not found."); const res = (resBy[ex.student_id] || []).filter((r: any) => r.exam === ex.title).slice(0, 5); return reply({ ok: true, exam: { id: ex.id, student_id: ex.student_id, name: ex.people?.name, title: ex.title, created_at: ex.created_at, skills: ex.skills, questions: ex.questions, vocab_unit: ex.vocab_unit, spec: ex.exam_json }, results: res }); }
  if (req.kind === "teacher_heatmap") { const skills = new Set<string>(); const rows: any[] = []; for (const st of students) { const t = skillTotals(resBy[st.student_id] || []); Object.keys(t).forEach(k => skills.add(k)); rows.push({ student_id: st.student_id, name: st.short_name || st.name, cells: t }); } const cls = skillTotals((results || []).filter((r: any) => students.some((x: any) => x.student_id === r.student_id))); const pct = (k: string) => cls[k] ? cls[k].r / Math.max(1, cls[k].n) : 0; const order = [...skills].sort((a, b) => pct(a) - pct(b));
    return reply({ ok: true, skills: order.map(k => ({ id: k, name: SK[k] || k, pct: Math.round(100 * pct(k)), n: cls[k] ? cls[k].n : 0 })), rows: rows.map(r => ({ student_id: r.student_id, name: r.name, cells: order.map(k => r.cells[k] ? { pct: Math.round(100 * r.cells[k].r / Math.max(1, r.cells[k].n)), n: r.cells[k].n } : null) })) }); }
  const now = Date.now(), ONLINE = 5 * 60000; const mNow = new Date(now + 4 * 3600000); const weekStart = Date.UTC(mNow.getUTCFullYear(), mNow.getUTCMonth(), mNow.getUTCDate() - mNow.getUTCDay()) - 4 * 3600000;
  const xpOf = (r: any) => n(r.correct) * 10 + (r.won ? 30 : 0) + (r.type === "Practice exam" ? 20 : 0) + (n(r.questions) >= 15 ? 30 : 0) + (n(r.score_pct) === 100 && n(r.questions) >= 8 ? 50 : 0);
  const table = students.map((st: any) => { const p = prof[st.student_id] || {}; const rs = resBy[st.student_id] || []; const es = exBy[st.student_id] || []; const lastTs = Math.max(0, seenBy[st.student_id] || 0, ...rs.map((r: any) => ts(r.played_at)), ...es.map((e: any) => ts(e.created_at))); const online = !!lastTs && now - lastTs <= ONLINE; const wk = rs.filter((r: any) => ts(r.played_at) >= weekStart); const t = skillTotals(rs); const weak = Object.keys(t).filter(k => t[k].n >= 3).sort((a, b) => t[a].r / t[a].n - t[b].r / t[b].n).slice(0, 2).map(k => SK[k] || k);
    return { student_id: st.student_id, name: st.name, short: st.short_name, pin_set: !!st.pin_set, exams: es.filter((e: any) => e.kind === "exam").length, games: rs.length, best_pct: n(p.best_pct), avg_pct: rs.length ? Math.round(rs.reduce((a: number, r: any) => a + n(r.score_pct), 0) / rs.length) : 0, xp: n(p.xp), level: n(p.level) || 1, streak: n(p.streak), last_seen: lastTs ? new Date(lastTs).toISOString() : "", online, inactive: !online, weakest: weak.join(", "), wk_xp: wk.reduce((a: number, r: any) => a + (r.type === "Class game" && n(r.score) > 0 ? n(r.score) : xpOf(r)), 0), wk_games: wk.length, wk_correct: wk.reduce((a: number, r: any) => a + n(r.correct), 0), wk_best: wk.reduce((m: number, r: any) => Math.max(m, n(r.score_pct)), 0) }; }).sort((a: any, b: any) => a.name.localeCompare(b.name));
  const todayM = muscatDay(); const examsToday = (exams || []).filter((e: any) => e.kind === "exam" && muscatDay(ts(e.created_at)) === todayM).length;
  const taskView = (tk || []).filter((t: any) => t.active !== false).map((t: any) => { const since = ts(t.created_at); const done = students.filter((st: any) => (exBy[st.student_id] || []).filter((e: any) => e.kind === "exam" && ts(e.created_at) >= since && n(e.questions) >= n(t.len)).length >= (n(t.count) || 1)).length; return { id: t.id, title: t.title, skills: t.skills, len: t.len, count: t.count, due: t.due, created_at: t.created_at, done, total: students.length }; });
  return reply({ ok: true, table, totals: { students: students.length, exams: (exams || []).filter((e: any) => e.kind === "exam").length, examsToday, games: (results || []).length, online: table.filter((r: any) => r.online).length, active3d: table.filter((r: any) => r.last_seen && now - ts(r.last_seen) <= 3 * 86400000).length }, tasks: taskView, recent: (exams || []).filter((e: any) => e.kind === "exam").slice(0, 40).map((e: any) => ({ id: e.id, student_id: e.student_id, name: nameOf[e.student_id] || e.student_id, title: e.title, questions: e.questions, created_at: e.created_at, ok: e.ok })), week_start: new Date(weekStart).toISOString(), generated: new Date().toISOString() });
}

Deno.serve(async (r: Request) => {
  if (r.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (r.method !== "POST") return reply({ ok: true, server: "ge2-caravan", time: new Date().toISOString() });
  let req: Req; try { req = parse(await r.text()); } catch (_) { return fail("bad", "Bad request."); }
  try {
    const k = req.kind;
    if (k === "login" || k === "set_pin" || k === "start" || k === "verify") return await login(req);
    const me = await session(req.token);
    if (k === "exam" || k === "coach" || k === "ping" || k === "writing") return await claude(req, me);
    if (k === "result") return await result(req, me);
    if (k === "profile" || k === "board") return await profileView(me);
    if (k === "tasks" || k === "bank") return await tasks(req, me);
    if (k.startsWith("project_")) return await projects(req, me);
    if (k.startsWith("teacher_")) return await teacher(req, me);
    return fail("bad", "Unknown request.");
  } catch (e) { return fail("error", "Server error: " + String((e as Error).message || e).slice(0, 200)); }
});
