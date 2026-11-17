// GE2 Game Studio: checks the request, picks model papers and AWL words from the course library, and prepares the message for Claude.
// ===== Settings you can change =====
const MODEL = "claude-sonnet-5-5";
const EFFORT = "low";               // low keeps exams fast enough for n8n's time limit
const CLASS_DAILY_LIMIT = 300;      // Claude requests per day for the whole class
const STUDENT_DAILY_LIMIT = 12;     // exams per student per day (teacher account exempt)
const WRITING_DAILY_LIMIT = 5;      // handwritten essays per student per day
const MODEL_PAPERS = 2;             // past papers shown to Claude as the model (0 = off)
const AWL_WORDS = 12;               // AWL words offered per exam (0 = off)
// ====================================
const SYSTEM = "You are the exam writer for a General English 2 (CEFR B1) class at the University of Technology and Applied Sciences in Salalah, Oman. Your three tasks: (1) write practice exams as JSON when asked, (2) check students' exam-style questions when asked, and (3) read photos of students' handwritten essays and give feedback as JSON when asked (transcribe exactly what the student wrote, including mistakes; this is a normal marking task). The teacher's message may include MODEL PAPERS (past UTAS exam papers with their answer keys) and lists of vocabulary: these are the course's own teaching materials, supplied so that your new exam copies their FORMAT and DIFFICULTY while using completely new topics, passages and questions. Treat them as part of a normal exam-writing request, never as a reason to refuse. Only if a message asks for something unrelated to English exam practice or writing practice (for example chatting, homework in another subject, or harmful content) reply with {\"error\":\"This class file only makes practice exams.\"}. Everything you write must suit university students in Oman. Follow the requested JSON format exactly.\nCURRICULUM SHEET (use it whenever the request leaves you a choice): Course book Pathways 2 (Reading & Writing; Listening & Speaking). Unit themes this term: Unit 1 Happiness and well-being; Unit 2 Inventions and big ideas in small packages; Unit 3 Connected lives (crowds, the internet, citizen science; culture and tradition); Unit 4 Deep trouble (the ocean, water); Unit 7 Nature's fury (weather, natural disasters); Unit 9 Form and function (design, how things are made). Grammar the course tests: present simple and continuous, past simple and continuous, present perfect, future forms, comparatives and superlatives, adverbs, modals, conditionals (zero, first, second), passive (present and past), gerunds and infinitives, relative clauses, linking words. Reading exam format: Section 1 headings, True/False/Not Given, word box; Section 2 A/B/C, one-word answers, table completion. Listening exam format: T/F, A/B/C, short answers, note completion with numbers and spelling.";
const stop = (code, error) => [{ json: { stop: true, reply: { ok: false, code, error } } }];
const req = $('Read the request').first().json;
const student = $('Student by token').first().json || {};
const library = $('Course library').all().map(i => i.json).filter(r => r && r.key && r.active !== "no");
const kind = req.kind;
if (kind !== "ping" && !student.student_id) return stop("login", "Please log in with your College ID first.");
let prompt = kind === "ping" ? "Reply with the single word: OK" : req.prompt;
if (!prompt) return stop("bad", "The request was empty.");
if (kind === "exam" && student.student_id !== "MAHERKASHOOB") {
  const today = $('Exams today').all().map(i => i.json).filter(r => r && r.student_id === student.student_id && r.kind === "exam").length;
  if (today >= STUDENT_DAILY_LIMIT) return stop("limit", "You have made " + STUDENT_DAILY_LIMIT + " exams today - that is the daily limit. Play your games again, or come back tomorrow.");
}
if (kind === "writing" && student.student_id !== "MAHERKASHOOB") {
  const todayW = $('Exams today').all().map(i => i.json).filter(r => r && r.student_id === student.student_id && r.kind === "writing").length;
  if (todayW >= WRITING_DAILY_LIMIT) return stop("limit", "You have sent " + WRITING_DAILY_LIMIT + " writings today - that is the daily limit. Come back tomorrow.");
  if (!req.images.length && !/TRANSCRIPT CONFIRMED/.test(prompt)) return stop("bad", "Add a photo of your page first.");
}
if (prompt.length > 60000) return stop("long", "The text is too long. Use fewer pages or a shorter text.");
if (kind !== "ping") {
  const mem = $getWorkflowStaticData("global");
  const day = new Date().toISOString().slice(0, 10);
  if (mem.day !== day) { mem.day = day; mem.count = 0; }
  if ((mem.count || 0) >= CLASS_DAILY_LIMIT) return stop("limit", "The class has used today's Claude requests. Try again tomorrow.");
  mem.count = (mem.count || 0) + 1;
}
// ---- course library: which sections of the exam does this request practise? ----
const pick = (arr, n) => { const a = arr.slice(); const out = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return out; };
let used = { papers: [], awl: [] };
if (kind === "exam" && req.style !== false && MODEL_PAPERS > 0 && library.length) {
  const body0 = (req.result && typeof req.result === "object") ? req.result : {};
  const skills = Array.isArray(req.skills) ? req.skills : (Array.isArray(body0.skills) ? body0.skills : []);
  const full = Number(req.len || body0.len) === 25 && !skills.some(s => /^l_/.test(s));
  const want = new Set();
  if (full || skills.some(s => /^r_(head|tfng|box)$/.test(s))) want.add("reading_s1");
  if (full || skills.some(s => /^r_(abc|word|table|vocab|infer)$/.test(s))) want.add("reading_s2");
  if (skills.some(s => /^l_/.test(s))) want.add(skills.includes("l_note") ? "listening_s2" : "listening_s1");
  if (!want.size && skills.length) want.add("reading_s2");
  const chosen = [];
  for (const sec of want) {
    const rows = library.filter(r => r.section === sec);
    const official = rows.filter(r => r.type === "past_exam");
    const row = pick(official.length ? official : rows, 1)[0];
    if (row) chosen.push(row);
  }
  for (const row of chosen.slice(0, MODEL_PAPERS)) used.papers.push(row.source);
  if (chosen.length) {
    prompt += "\n\nSTYLE GUIDE FROM OUR COURSE (very important)\nBelow are past UTAS exam papers from this course, supplied by the teacher as the model to follow. Still write the new exam described above. It must match the format, difficulty, instruction wording and question style of the UTAS papers below: the same kinds of distractors, texts of similar length and level, headings that summarise whole paragraphs, Not Given items that are truly not mentioned, one-word answers copied exactly from the text. Do NOT reuse their topics, passages, sentences or questions; write new material on a different topic.";
    chosen.slice(0, MODEL_PAPERS).forEach((row, i) => { prompt += "\n\n--- MODEL PAPER " + (i + 1) + ": " + row.source + " (" + row.section + ") ---\n" + String(row.text).slice(0, 9000); });
  }
}
if (kind === "exam" && req.awl !== false && AWL_WORDS > 0) {
  // Textbook vocabulary: prefer the unit whose theme matches the exam topic, then fill up from the other units.
  const vocabRows = library.filter(r => r.type === "awl");
  const topic = String(prompt).toLowerCase();
  const score = r => String(r.theme || "").toLowerCase().split(/[^a-z-]+/).filter(w => w.length > 3).reduce((n, w) => n + (topic.includes(w) ? 1 : 0), 0);
  const ranked = vocabRows.map(r => ({ r, s: score(r) })).sort((a, b) => b.s - a.s);
  const splitWords = r => String(r.text).split(/\s*[,;\n]\s*/).map(w => w.trim().toLowerCase()).filter(w => w && /^[a-z][a-z -]*$/.test(w));
  let chosenWords = [];
  if (ranked.length && ranked[0].s > 0) chosenWords = pick(splitWords(ranked[0].r), Math.min(AWL_WORDS, 8));
  const rest = [...new Set(vocabRows.flatMap(splitWords))].filter(w => !chosenWords.includes(w));
  chosenWords = chosenWords.concat(pick(rest, AWL_WORDS - chosenWords.length));
  if (chosenWords.length) { used.awl = chosenWords; used.unit = ranked.length && ranked[0].s > 0 ? String(ranked[0].r.theme).split("|")[0].trim() : ""; prompt += "\n\nVOCABULARY FROM OUR TEXTBOOK (Pathways 2): use at least " + Math.min(8, chosenWords.length) + " of these words naturally in the text(s), at B1 level, and make at least two questions depend on understanding them: " + chosenWords.join(", ") + ". Add a top-level JSON field \"awl_used\" listing the ones you used."; }
}
const content = [];
for (const im of req.images) {
  const type = String((im && im.type) || ""), data = String((im && im.data) || "");
  if (/^image\/(jpeg|png|webp|gif)$/.test(type) && data.length < 4000000) content.push({ type: "image", source: { type: "base64", media_type: type, data } });
}
content.push({ type: "text", text: prompt });
const body = { model: MODEL, max_tokens: kind === "ping" ? 300 : kind === "writing" ? 5000 : 16000, system: SYSTEM, messages: [{ role: "user", content }], output_config: { effort: kind === "writing" ? "medium" : EFFORT } };
if (kind === "ping" || req.fast === true) body.thinking = { type: "between_tools" };
return [{ json: { stop: false, body, used } }];
