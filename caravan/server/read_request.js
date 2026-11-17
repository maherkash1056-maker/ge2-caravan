// GE2 Caravan: reads what the page sent, normalises the College ID and chooses the route.
let b = $input.first().json.body;
if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
if (b && typeof b === "object" && typeof b.data === "string" && !b.kind) { try { b = JSON.parse(b.data); } catch (e) {} }
b = (b && typeof b === "object") ? b : {};
const s = (x, n) => String(x == null ? "" : x).trim().slice(0, n || 200);
const kind = s(b.kind, 24).toLowerCase() || "exam";
const ROUTES = { login: "verify", start: "verify", set_pin: "verify", verify: "verify", result: "result", profile: "profile", tasks: "tasks",
  exam: "claude", coach: "claude", ping: "claude",
  teacher_table: "teacher", teacher_heatmap: "teacher", teacher_exam: "teacher", teacher_assign: "teacher", teacher_reset_pin: "teacher", teacher_close_task: "teacher", teacher_students: "teacher" };
let route = ROUTES[kind] || "bad";
const id = s(b.id, 16).toUpperCase().replace(/[^0-9A-Z]/g, "");
const idOK = /^[0-9A-Z]{3,14}$/.test(id);
const pinIn = s(b.pin, 8).replace(/\D/g, "");
const out = { kind, route, id, idOK, pinIn, setPin: kind === "set_pin",
  name: s(b.name, 60).replace(/\s+/g, " "), token: s(b.token, 64), device: s(b.device, 12),
  prompt: String(b.prompt || "").slice(0, 60000), images: Array.isArray(b.images) ? b.images.slice(0, 4) : [],
  fast: b.fast === true, result: (b.result && typeof b.result === "object") ? b.result : b,
  data: (b.data && typeof b.data === "object") ? b.data : {}, error: "", code: "" };
if (route === "bad") { out.error = "Unknown request."; out.code = "bad"; }
if (route === "verify" && !idOK) { out.route = "bad"; out.code = "id"; out.error = "Type your College ID using letters and numbers only, like 46J2696."; }
if (route === "verify" && idOK && pinIn.length !== 4) { out.route = "bad"; out.code = "pin"; out.error = "Type your 4-digit PIN."; }
return [{ json: out }];
