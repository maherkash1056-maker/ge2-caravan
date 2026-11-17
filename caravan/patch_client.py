import json, re, sys
p = '/home/claude/studio/class_template.html'
s = open(p).read()
def rep(a, b, count=1):
    global s
    n = s.count(a)
    assert n == count, (n, a[:80])
    s = s.replace(a, b)

# ---------- 1. login markup: ID + PIN ----------
rep('''<div id="xlogout" hidden><p class="e-hint" style="margin:0 0 10px"><b>Log in with your College ID and your name.</b> Your results then go to your teacher under your name.</p>
  <div class="e-row"><div class="e-field" style="margin:0"><label class="e-lab" for="xid">College ID</label><input class="e-in" id="xid" type="text" maxlength="14" autocomplete="off" spellcheck="false" autocapitalize="characters" placeholder="e.g. 46J2696" style="width:150px"></div>
  <div class="e-field" style="margin:0;flex:1 1 200px"><label class="e-lab" for="xname">Your name</label><input class="e-in" id="xname" type="text" maxlength="40" autocomplete="off" spellcheck="false" placeholder="e.g. Salim Al Mashani"></div>
  <button class="e-btn e-teal" type="button" id="xsend" style="align-self:flex-end">Log in</button></div>
  <div class="e-row" id="xcoderow" hidden style="margin-top:8px"><div class="e-field" style="margin:0"><label class="e-lab" for="xcodein">The 6-digit code from your email</label><input class="e-in" id="xcodein" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456" style="width:150px;letter-spacing:3px"></div><button class="e-btn e-primary" type="button" id="xverify" style="align-self:flex-end">Log in</button></div>
  <p class="e-hint" id="xloginmsg" aria-live="polite" style="margin:8px 0 0;font-weight:700"></p></div>''',
'''<div id="xlogout" hidden><p class="e-hint" style="margin:0 0 10px"><b>Log in with your College ID and your PIN.</b> First time? Type your ID and choose a 4-digit PIN. Your name comes from the class list.</p>
  <div class="e-row"><div class="e-field" style="margin:0"><label class="e-lab" for="xid">College ID</label><input class="e-in" id="xid" type="text" maxlength="14" autocomplete="username" spellcheck="false" autocapitalize="characters" placeholder="e.g. 46J2696" style="width:170px"></div>
  <div class="e-field" style="margin:0"><label class="e-lab" for="xpin">PIN (4 digits)</label><input class="e-in" id="xpin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="••••" style="width:120px;letter-spacing:4px"></div>
  <button class="e-btn e-teal" type="button" id="xsend" style="align-self:flex-end">Log in</button></div>
  <div class="e-row" id="xcoderow" hidden style="margin-top:8px"><div class="e-field" style="margin:0"><label class="e-lab" for="xcodein">Type the same PIN again</label><input class="e-in" id="xcodein" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="••••" style="width:120px;letter-spacing:4px"></div><button class="e-btn e-primary" type="button" id="xverify" style="align-self:flex-end">Create my PIN and log in</button></div>
  <p class="e-hint" id="xloginmsg" aria-live="polite" style="margin:8px 0 0;font-weight:700"></p></div>''')

# tasks box after the board
rep('<div id="xboard" hidden style="margin:-6px 0 14px"></div></div>', '<div id="xboard" hidden style="margin:-6px 0 14px"></div><div id="xtasks" hidden style="margin:0 0 14px"></div></div>')

# ---------- 2. login JS ----------
start = s.index('/* ---------- College ID login (class file through n8n) ---------- */')
end = s.index('async function aiJSON(prompt,o){')
new_login = r'''/* ---------- College ID + PIN login (GE2 Caravan, class server through n8n) ---------- */
(function loginUI(){const idI=E("#xid"),pnI=E("#xpin"),cdI=E("#xcodein"),msg=E("#xloginmsg");if(!idI)return;
  const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok===true?"var(--e-ok)":ok===false?"var(--e-warn)":"";};
  const cleanId=()=>idI.value.toUpperCase().replace(/[^0-9A-Z]/g,"").slice(0,14);
  idI.addEventListener("input",()=>{const v=cleanId();if(idI.value!==v)idI.value=v;});
  [pnI,cdI].forEach(i=>i.addEventListener("input",()=>{const v=i.value.replace(/\D/g,"").slice(0,4);if(i.value!==v)i.value=v;}));
  try{const d=lsGet("gs-login-draft",null);if(d)idI.value=d.id||"";}catch(e){}
  function loggedIn(j,id){const sess={token:j.token,id:j.id||id,name:j.name||id,short:j.short||"",role:j.role||"student",at:Date.now()};lsSet("gs-session",sess);setHashSession(sess);say("");E("#xcoderow").hidden=true;pnI.value="";cdI.value="";AI._profFetched=false;renderAI();
    E("#xprog").textContent=(j.first?"Welcome, "+(sess.short||sess.name)+"! Your PIN is saved. ":"Welcome back, "+(sess.short||sess.name)+". ")+(sess.role==="teacher"?"Open the Teacher tab to see the class.":"Tick your skills, choose a text, then press Make my exam.");
    if(sess.role==="teacher"){showTab("teacher");setHashTab("teacher");}}
  async function send(kind,id,pin){const res=await hookPost(hookURL(),{kind,id,pin,device:deviceId()});return res;}
  E("#xsend").addEventListener("click",async()=>{const id=cleanId(),pin=pnI.value.replace(/\D/g,"");
    if(!/^[0-9A-Z]{3,14}$/.test(id)){say("Type your College ID (letters and numbers only), like 46J2696.",false);idI.focus();return;}
    if(pin.length!==4){say("Type your 4-digit PIN. First time here? Choose any 4 digits you will remember.",false);pnI.focus();return;}
    lsSet("gs-login-draft",{id});E("#xsend").disabled=true;say("Logging in…");
    try{const res=await send("login",id,pin);const j=res.j;
      if(res.net||!res.r.ok||!j)say("The class server can't be reached. Check the internet connection and try again.",false);
      else if(j.ok&&j.token)loggedIn(j,id);
      else if(j.code==="newpin"){E("#xcoderow").hidden=false;cdI.value="";cdI.focus();say("First time here. Type the same PIN again to create it.",true);}
      else say(j.error||"Something went wrong. Try again.",false);}
    catch(e){say("Something went wrong. Try again.",false);}finally{E("#xsend").disabled=false;}});
  E("#xverify").addEventListener("click",async()=>{const id=cleanId(),pin=pnI.value.replace(/\D/g,""),again=cdI.value.replace(/\D/g,"");
    if(pin.length!==4){say("Type your new PIN in the first box.",false);pnI.focus();return;}
    if(again!==pin){say("The two PINs are different. Type the same 4 digits in both boxes.",false);cdI.focus();return;}
    E("#xverify").disabled=true;say("Creating your PIN…");
    try{const res=await send("set_pin",id,pin);const j=res.j;
      if(res.net||!res.r.ok||!j)say("The class server can't be reached. Try again.",false);
      else if(j.ok&&j.token)loggedIn(j,id);
      else say(j.error||"That did not work. Try again.",false);}
    catch(e){say("Something went wrong. Try again.",false);}finally{E("#xverify").disabled=false;}});
  pnI.addEventListener("keydown",e=>{if(e.key==="Enter")E("#xsend").click();});
  cdI.addEventListener("keydown",e=>{if(e.key==="Enter")E("#xverify").click();});
  E("#xlogoutbtn").addEventListener("click",()=>{lsSet("gs-profile",null);AI._profFetched=false;const b=E("#xboard");if(b){b.hidden=true;b.innerHTML="";}const tk=E("#xtasks");if(tk){tk.hidden=true;tk.innerHTML="";}endSession("");});
  E("#xboardbtn").addEventListener("click",showBoard);})();
/* ---------- session kept in the page address (the server sandbox has no storage) ---------- */
function hashParts(){const h=location.hash.replace(/^#/,"");const p={tab:"",s:""};h.split("&").forEach((seg,i)=>{if(seg.indexOf("s=")===0)p.s=seg.slice(2);else if(i===0)p.tab=seg;});return p;}
function setHashTab(t){try{const p=hashParts();const v=t+(p.s?"&s="+p.s:"");if(location.hash!=="#"+v)location.hash=v;}catch(_){}}
function setHashSession(sess){try{const p=hashParts();const v=sess?[sess.token,sess.id,sess.role||"student",encodeURIComponent(sess.name||""),encodeURIComponent(sess.short||"")].join("~"):"";location.hash=(p.tab||CUR_TAB)+(v?"&s="+v:"");}catch(_){}}
function restoreSession(){if(session())return;const p=hashParts();if(!p.s)return;const a=p.s.split("~");if(a.length<2||a[0].length<20)return;lsSet("gs-session",{token:a[0],id:a[1],role:a[2]||"student",name:decodeURIComponent(a[3]||""),short:decodeURIComponent(a[4]||""),at:Date.now()});}
/* ---------- tasks from the teacher ---------- */
async function fetchTasks(){const box=E("#xtasks");if(!box||AI.mode!=="hook"||!session()||session().role==="teacher")return;try{const res=await hookPost(hookURL(),{kind:"tasks",token:session().token});const j=res.j;if(!j||!j.ok)return;renderTasks(j.tasks||[]);}catch(e){}}
function renderTasks(list){const box=E("#xtasks");if(!box)return;if(!list.length){box.hidden=true;box.innerHTML="";return;}box.hidden=false;
  box.innerHTML='<div class="e-ai" style="margin:0;display:block"><b>📋 Tasks from your teacher</b>'+list.map(t=>'<div class="e-row" style="margin:8px 0 0;align-items:center"><span style="flex:1 1 200px"><b>'+esc(t.title)+'</b><br><span class="e-hint" style="margin:0">'+(t.skills||[]).map(skillName).join(", ")+' · '+t.len+' questions'+(t.count>1?' × '+t.count:'')+(t.due?' · by '+esc(t.due):'')+'</span></span><span class="tag">'+(t.complete?'✅ Done':t.done+' / '+t.count)+'</span>'+(t.complete?'':'<button class="e-btn e-small e-teal" type="button" data-task="'+t.id+'">Do it</button>')+'</div>').join("")+'</div>';
  box.querySelectorAll("[data-task]").forEach(b=>b.addEventListener("click",()=>{const t=list.find(x=>String(x.id)===b.dataset.task);if(!t)return;XS.skills=(t.skills||[]).filter(id=>SKILLS.some(s=>s.id===id)).slice(0,5);XS.len=[8,15,25].includes(+t.len)?+t.len:8;lsSet("gs-xskills",XS.skills);renderLen();E("#xprog").textContent="Task ticked: "+XS.skills.map(skillName).join(", ")+" · "+XS.len+" questions. Choose a text, then press Make my exam.";E("#xskills").scrollIntoView({behavior:"smooth",block:"start"});}));}
/* ---------- teacher monitor ---------- */
const TM={timer:null,data:null,heat:null};
function isTeacher(){const s=session();return !!(s&&s.role==="teacher");}
function fmtAgo(iso){if(!iso)return "never";const d=(Date.now()-Date.parse(iso))/60000;if(d<1)return "just now";if(d<60)return Math.round(d)+" min ago";if(d<48*60)return Math.round(d/60)+" h ago";return Math.round(d/1440)+" days ago";}
async function tPost(kind,data){const res=await hookPost(hookURL(),{kind,token:session().token,data:data||{}});return res.j||{ok:false};}
async function teacherLoad(){const box=E("#tmon");if(!box||!isTeacher())return;try{const [t,h]=await Promise.all([tPost("teacher_table"),tPost("teacher_heatmap")]);if(t.ok)TM.data=t;if(h.ok)TM.heat=h;renderTeacher();}catch(e){}}
function teacherStart(){if(TM.timer)clearInterval(TM.timer);teacherLoad();TM.timer=setInterval(()=>{if(!E("#tab-teacher").hidden&&isTeacher())teacherLoad();},15000);}
function renderTeacher(){const box=E("#tmon");if(!box)return;const d=TM.data;if(!d){box.innerHTML='<p class="e-hint">Loading the class…</p>';return;}const tot=d.totals||{};
  const skillChips=SKILLS.map(s=>'<label class="e-chip" style="display:inline-block;margin:0 6px 6px 0"><input type="checkbox" value="'+s.id+'" style="margin-right:6px">'+esc(s.name)+'</label>').join("");
  let html='<div class="e-row" style="gap:14px;margin:0 0 10px"><span class="tag">👥 '+tot.students+' students</span><span class="tag">✨ '+tot.exams+' exams ('+tot.examsToday+' today)</span><span class="tag">🎮 '+tot.games+' games</span><span class="tag">🟢 '+tot.active3d+' active this week</span><span class="e-hint" style="margin:0 0 0 auto">updated '+fmtAgo(d.generated)+' · refreshes every 15 s</span></div>';
  html+='<h3 style="margin:10px 0 6px">Class table</h3><div style="overflow:auto"><table class="tm"><thead><tr><th>Student</th><th>ID</th><th>PIN</th><th>Exams</th><th>Games</th><th>Best %</th><th>Avg %</th><th>XP</th><th>Lv</th><th>Weakest</th><th>Last seen</th><th></th></tr></thead><tbody>'+
   (d.table||[]).map(r=>'<tr class="'+(r.inactive?"off":"")+'"><td><b>'+esc(r.short||r.name)+'</b><br><span class="e-hint" style="margin:0;font-size:12px">'+esc(r.name)+'</span></td><td>'+esc(r.student_id)+'</td><td>'+(r.pin_set?"✓":"—")+'</td><td>'+r.exams+'</td><td>'+r.games+'</td><td>'+(r.games?r.best_pct+"%":"—")+'</td><td>'+(r.games?r.avg_pct+"%":"—")+'</td><td>'+r.xp+'</td><td>'+r.level+'</td><td>'+esc(r.weakest||"")+'</td><td>'+fmtAgo(r.last_seen)+'</td><td><button class="e-btn e-small" type="button" data-reset="'+esc(r.student_id)+'" title="Clear the PIN so the student can choose a new one">Reset PIN</button></td></tr>').join("")+'</tbody></table></div>';
  if(TM.heat&&TM.heat.skills&&TM.heat.skills.length){html+='<h3 style="margin:14px 0 6px">Skill heat-map <span class="e-hint" style="margin:0;font-weight:400">(% correct · weakest skills first)</span></h3><div style="overflow:auto"><table class="tm heat"><thead><tr><th>Student</th>'+TM.heat.skills.map(k=>'<th title="'+esc(k.name)+'">'+esc(k.name)+'<br><span class="e-hint" style="margin:0;font-size:11px">class '+k.pct+'%</span></th>').join("")+'</tr></thead><tbody>'+
    TM.heat.rows.map(r=>'<tr><td><b>'+esc(r.name)+'</b></td>'+r.cells.map(c=>c?'<td style="background:'+heatColor(c.pct)+'" title="'+c.n+' questions">'+c.pct+'%</td>':'<td class="none">·</td>').join("")+'</tr>').join("")+'</tbody></table></div>';}
  html+='<h3 style="margin:14px 0 6px">Tasks</h3>'+((d.tasks||[]).length?'<ul class="e-qlist">'+(d.tasks||[]).map(t=>'<li><b>'+esc(t.title)+'</b> · '+esc(String(t.skills||"").split(/\s+/).filter(Boolean).map(skillName).join(", "))+' · '+t.len+' q'+(t.count>1?' × '+t.count:'')+(t.due?' · by '+esc(t.due):'')+' — <b>'+t.done+' / '+t.total+' done</b> <button class="e-btn e-small" type="button" data-close="'+t.id+'">Close</button></li>').join("")+'</ul>':'<p class="e-hint">No open tasks.</p>');
  html+='<details class="e-more" id="tassign"><summary>➕ Assign a task to the class</summary><div class="e-field"><label class="e-lab" for="tatitle">Title</label><input class="e-in" id="tatitle" maxlength="120" placeholder="e.g. Week 10: T/F/NG + table, 15 questions"></div><div class="e-field"><span class="e-lab">Skills</span><div>'+skillChips+'</div></div><div class="e-row"><div class="e-field" style="margin:0"><label class="e-lab" for="talen">Questions</label><select class="e-in" id="talen"><option value="8">8 (Quick)</option><option value="15" selected>15</option><option value="25">25 (full paper)</option></select></div><div class="e-field" style="margin:0"><label class="e-lab" for="tacount">How many exams</label><input class="e-in" id="tacount" type="number" min="1" max="5" value="1" style="width:90px"></div><div class="e-field" style="margin:0"><label class="e-lab" for="tadue">Due</label><input class="e-in" id="tadue" type="date"></div><button class="e-btn e-primary" type="button" id="tago" style="align-self:flex-end">Assign</button></div><p class="e-hint" id="tamsg"></p></details>';
  html+='<h3 style="margin:14px 0 6px">Recent exams <span class="e-hint" style="margin:0;font-weight:400">(click one to read it)</span></h3><ul class="e-qlist">'+(d.recent||[]).map(e=>'<li><a href="#teacher" data-exam="'+e.id+'">'+esc(e.title||"(untitled)")+'</a> — '+esc(e.name||e.student_id)+' · '+e.questions+' q · '+fmtAgo(e.created_at)+(e.ok===false?' · <span style="color:var(--e-warn)">failed</span>':'')+'</li>').join("")+'</ul><div id="texam"></div>';
  box.innerHTML=html;
  box.querySelectorAll("[data-reset]").forEach(b=>b.addEventListener("click",async()=>{if(b.disabled)return;b.disabled=true;b.textContent="Resetting…";const j=await tPost("teacher_reset_pin",{student_id:b.dataset.reset});b.textContent=j.ok?"PIN cleared":"Failed";setTimeout(teacherLoad,800);}));
  box.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",async()=>{b.disabled=true;await tPost("teacher_close_task",{id:+b.dataset.close});teacherLoad();}));
  const go=E("#tago");if(go)go.addEventListener("click",async()=>{const skills=[...box.querySelectorAll("#tassign input[type=checkbox]:checked")].map(i=>i.value);const title=E("#tatitle").value.trim();if(!skills.length){E("#tamsg").textContent="Tick at least one skill.";return;}go.disabled=true;E("#tamsg").textContent="Assigning…";const j=await tPost("teacher_assign",{title:title||("Practice: "+skills.map(skillName).join(", ")),skills,len:+E("#talen").value,count:+E("#tacount").value||1,due:E("#tadue").value});E("#tamsg").textContent=j.ok?"Assigned. Students see it on their exam page.":"Failed: "+(j.error||"");go.disabled=false;setTimeout(teacherLoad,600);});
  box.querySelectorAll("[data-exam]").forEach(a=>a.addEventListener("click",async e=>{e.preventDefault();const out=E("#texam");out.innerHTML='<p class="e-hint">Loading…</p>';const j=await tPost("teacher_exam",{id:a.dataset.exam});if(!j.ok){out.innerHTML='<p class="e-hint">'+esc(j.error||"Not found")+'</p>';return;}const x=j.exam,sp=x.spec||{};
    out.innerHTML='<article class="e-card"><h3 style="margin:0 0 4px">'+esc(x.title||"Exam")+'</h3><p class="e-hint">'+esc(x.name||x.student_id)+' · '+esc(x.skills||"")+' · '+(x.vocab_unit?'vocabulary: '+esc(x.vocab_unit)+' · ':'')+fmtAgo(x.created_at)+'</p>'+(sp.texts||[]).map(t=>'<details class="e-more" open><summary>'+esc(t.title||t.kind||"Text")+'</summary><div class="e-hint" style="white-space:pre-wrap">'+esc(t.body||"")+'</div></details>').join("")+'<ol class="e-qlist">'+(sp.questions||[]).map(q=>'<li>'+esc(q.q||q.instruction||q.type)+(q.options?' <span class="e-opt">('+q.options.map((o,i)=>"ABC"[i]+" "+esc(o)).join(" · ")+')</span>':'')+' → <span class="a">'+esc(String(q.answer))+'</span>'+(q.why?' <span class="e-opt">'+esc(q.why)+'</span>':'')+'</li>').join("")+'</ol>'+(j.results&&j.results.length?'<p><b>Played:</b> '+j.results.map(r=>r.correct+"/"+r.questions+" ("+r.score_pct+"%) "+fmtAgo(r.played_at)).join(" · ")+'</p>':'<p class="e-hint">Not played yet.</p>')+'</article>';out.scrollIntoView({behavior:"smooth",block:"start"});}));}
function heatColor(p){if(p>=80)return "#cfe8d5";if(p>=60)return "#fff1bf";if(p>=40)return "#ffd9b3";return "#f6c3b9";}
'''
s = s[:start] + new_login + s[end:]

# ---------- 3. hash + tab wiring ----------
rep('addEventListener("hashchange",()=>showTab(location.hash.slice(1)));', 'addEventListener("hashchange",()=>{const t=hashParts().tab;if(t&&t!==CUR_TAB)showTab(t);});')
rep('const t=a.dataset.tab;showTab(t);try{if(location.hash!=="#"+t)location.hash=t;}catch(_){}});', 'const t=a.dataset.tab;showTab(t);setHashTab(t);});')
rep('showTab("make");try{location.hash="make";}catch(_){}', 'showTab("make");setHashTab("make");')
rep('showTab("exam");try{location.hash="exam";}catch(_){}', 'showTab("exam");setHashTab("exam");')
rep('if(typeof window.CLASS_TPL==="string"&&!location.hash)showTab("teacher");else if(!location.hash)showTab("exam");',
    'restoreSession();(function(){const hp=hashParts();if(typeof window.CLASS_TPL==="string"&&!hp.tab)showTab("teacher");else if(hp.tab&&TABS.includes(hp.tab))showTab(hp.tab);else showTab("exam");})();')
rep('function endSession(msg){lsSet("gs-session",null);renderAI();', 'function endSession(msg){lsSet("gs-session",null);setHashSession(null);if(TM.timer){clearInterval(TM.timer);TM.timer=null;}renderAI();')

# ---------- 4. renderAI: hook messages, teacher tab, tasks ----------
rep('''const lg=E("#xlogin");if(lg){lg.hidden=AI.mode!=="hook";const s=session();E("#xlogout").hidden=!!s;E("#xloggedin").hidden=!s;if(s){E("#xwho").textContent=(s.name?s.name+" ":"")+"("+s.id+")";renderProfile();if(!AI._profFetched){AI._profFetched=true;fetchProfile();}}}''',
'''const lg=E("#xlogin");if(lg){lg.hidden=AI.mode!=="hook";const s=session();E("#xlogout").hidden=!!s;E("#xloggedin").hidden=!s;if(s){E("#xwho").textContent=(s.name?s.name+" ":"")+"("+s.id+")";renderProfile();if(!AI._profFetched){AI._profFetched=true;fetchProfile();fetchTasks();}}}
  const tl=document.querySelector('.e-tab[data-tab="teacher"]'),tm=E("#tmon");if(tl){const teacher=isTeacher();tl.hidden=!(typeof window.CLASS_TPL==="string"||teacher||AI.mode!=="hook");if(tm){tm.hidden=!teacher;if(teacher&&!TM.timer)teacherStart();}}''')
rep('''else if(AI.mode==="direct"||AI.mode==="hook"){const n=usesLeft();box.classList.add(n?"ok":"no");t.innerHTML=n?"<b>Claude is ready</b>"+(AI.mode==="hook"?" — you are logged in. Exams run on your teacher's class server":" — no account needed. This class file uses your teacher's API credits")+". Claude requests left today on this device: <b>"+n+" of "+DIRECT.perDay+"</b>.":"<b>Today's "+DIRECT.perDay+" Claude requests on this device are used.</b> Come back tomorrow. You can still replay your saved exams in Play → My practice exams.";}''',
'''else if(AI.mode==="hook"){box.classList.add("ok");const s=session();t.innerHTML="<b>Claude is ready</b> — logged in as "+esc(s.short||s.name||s.id)+(s.role==="teacher"?" (teacher)":"")+". Up to <b>6 exams a day</b>; games can be replayed as often as you like.";}
  else if(AI.mode==="direct"){const n=usesLeft();box.classList.add(n?"ok":"no");t.innerHTML=n?"<b>Claude is ready</b> — no account needed. This class file uses your teacher's API credits. Claude requests left today on this device: <b>"+n+" of "+DIRECT.perDay+"</b>.":"<b>Today's "+DIRECT.perDay+" Claude requests on this device are used.</b> Come back tomorrow.";}''')

# ---------- 5. teacher tab: rename, monitor container, CSS ----------
rep('<a class="e-tab" href="#teacher" data-tab="teacher">For the teacher</a>', '<a class="e-tab" href="#teacher" data-tab="teacher">🧭 Teacher</a>')
rep('<section class="e-tabpane" id="tab-teacher" aria-label="For the teacher" hidden>\n  <div class="e-cards3">',
    '<section class="e-tabpane" id="tab-teacher" aria-label="Teacher" hidden>\n  <section class="e-card" id="tmon" hidden style="margin:0 0 16px"></section>\n  <div class="e-cards3">')
rep('.e-chip{font:inherit;', '.tm{border-collapse:collapse;width:100%;font-size:14px}.tm th,.tm td{border:1px solid var(--e-line);padding:5px 8px;text-align:left;vertical-align:top;white-space:nowrap}.tm th{background:var(--e-sel);position:sticky;top:0}.tm tr.off td{opacity:.55}.tm.heat td{text-align:center;color:#24170f}.tm td.none{color:var(--e-muted);text-align:center}\n.e-chip{font:inherit;')

# hook device-limit check: do not block at the device limit in hook mode (server enforces 6/day per student)
open(p, 'w').write(s)
print("patched", len(s))
