/* ---------- 3 · My project: the simplest slides maker (topic → look → Claude drafts → tap to edit → present) ---------- */
const PJ={deck:null,cur:0,busy:false};
const PJ_LOOKS={
 sand:{name:"Sand",bg:"linear-gradient(160deg,#fff6df,#f1dfb2)",ink:"#24170f",acc:"#b7432d",sub:"#6b4e35",em:"🏜️"},
 sea:{name:"Sea",bg:"linear-gradient(160deg,#0b3a4a,#1b6b7a 60%,#2f9aa4)",ink:"#f3efe4",acc:"#ffd36a",sub:"#bfe9ec",em:"🌊"},
 khareef:{name:"Khareef",bg:"linear-gradient(160deg,#1e4f3c,#3a8a5f 60%,#9fd3a1)",ink:"#f6fff3",acc:"#ffe066",sub:"#d8f5dc",em:"🌿"},
 night:{name:"Night",bg:"radial-gradient(circle at 30% 20%,#2a3350,#0d1018 70%)",ink:"#fffaf0",acc:"#e0b046",sub:"#b9c0d0",em:"🌙"},
 souq:{name:"Souq",bg:"repeating-linear-gradient(45deg,#7a2a20 0 18px,#8c3a2c 18px 36px)",ink:"#fff4dc",acc:"#ffd36a",sub:"#f5d9b8",em:"🏺"},
 rose:{name:"Rose",bg:"linear-gradient(160deg,#ffe4ee,#f6a2c4 70%,#e2548f)",ink:"#3a1020",acc:"#8c1d48",sub:"#6b2a44",em:"🌹"}};
const PJ_STICKERS=["🌍","♻️","🚯","🐢","🐟","🌊","🏭","🚗","🔋","☀️","🌳","💡","🤖","🧪","📊","🎯","✅","⚠️","🏙️","🇴🇲"];
function pjBlank(){return {id:"",title:"",topic:"",look:"sand",slides:[],updated:Date.now()};}
function pjLoad(){const d=lsGet("gs-project",null);PJ.deck=(d&&Array.isArray(d.slides))?d:pjBlank();if(!PJ_LOOKS[PJ.deck.look])PJ.deck.look="sand";PJ.cur=Math.min(PJ.cur,Math.max(0,PJ.deck.slides.length-1));}
function pjSave(){PJ.deck.updated=Date.now();lsSet("gs-project",PJ.deck);}
function pjStarter(topic){const t=topic||"our project";return [
 {h:t,s:"by "+(studentName()||"our group")+" · GE2 Group 9",st:"🌍"},
 {h:"The problem",pts:["What is the problem?","Where? (a place)","Who does it affect?"],st:"⚠️"},
 {h:"Causes",pts:["Cause 1 — who does it?","Cause 2","Cause 3"],st:"🏭"},
 {h:"Effects",pts:["Effect 1 — who feels it?","Effect 2","Effect 3"],st:"🐢"},
 {h:"Our idea",pts:["What we will make","How it works","Why it is better"],st:"💡"},
 {h:"Conclusion",pts:["In my opinion, the effects are negative because …","I suggest that people should …","Thank you!"],st:"✅"}];}
/* one slide = heading + (points | sub line) + optional picture + optional sticker. Layout chosen automatically. */
function pjSlideHTML(sl,look,edit){const L=PJ_LOOKS[look]||PJ_LOOKS.sand;const ce=edit?' contenteditable="true" spellcheck="false"':'';
 const raw=sl.pts||[];const pts=raw.filter(x=>String(x).trim());const title=!raw.length&&!sl.img;
 let h='<div class="pj-slide'+(title?' pj-title':'')+(sl.img?' pj-haspic':'')+'" style="background:'+L.bg+';color:'+L.ink+'">';
 if(sl.st)h+='<div class="pj-st">'+esc(sl.st)+'</div>';
 h+='<div class="pj-main"><div class="pj-h" style="color:'+L.acc+'" data-f="h"'+ce+'>'+(esc(sl.h||"")||(edit?'<span class="pj-ph">Tap to write the heading</span>':''))+'</div>';
 if(title)h+='<div class="pj-s" style="color:'+L.sub+'" data-f="s"'+ce+'>'+(esc(sl.s||"")||(edit?'<span class="pj-ph">Tap to write a line (names, date…)</span>':''))+'</div>';
 else h+='<ul class="pj-ul">'+(edit?Array.from({length:Math.max(1,raw.length)},(_,i)=>'<li data-f="p'+i+'"'+ce+'>'+(esc(raw[i]||"")||'<span class="pj-ph">Tap to write a point</span>')+'</li>').join("")+(raw.length<5?'<li class="pj-addpt" data-act="addpt">＋ point</li>':''):pts.map(x=>'<li>'+esc(x)+'</li>').join(""))+'</ul>';
 h+='</div>';if(sl.img)h+='<div class="pj-pic"><img src="'+sl.img+'" alt=""></div>';h+='</div>';return h;}
function pjRender(){const d=PJ.deck;if(!d)return;E("#pjtopic").value=d.topic||"";
 document.querySelectorAll("[data-pjlook]").forEach(b=>b.classList.toggle("on",b.dataset.pjlook===d.look));
 const has=d.slides.length>0;E("#pjmaker").hidden=!has;E("#pjstart").hidden=has;if(!has)return;
 PJ.cur=Math.min(PJ.cur,d.slides.length-1);const s=d.slides[PJ.cur];
 E("#pjstrip").innerHTML=d.slides.map((x,i)=>'<button type="button" class="pj-thumb'+(i===PJ.cur?' on':'')+'" data-pji="'+i+'"><span class="pj-n">'+(i+1)+'</span>'+pjSlideHTML(x,d.look,false)+'</button>').join("")+'<button type="button" class="pj-thumb add" data-act="add">＋</button>';
 E("#pjstage").innerHTML=pjSlideHTML(s,d.look,true);E("#pjpos").textContent=(PJ.cur+1)+" / "+d.slides.length;
 E("#pjcode").textContent=d.id?"Project code: "+d.id:"";}
function pjReadStage(){const s=PJ.deck.slides[PJ.cur];if(!s)return;const st=E("#pjstage");const g=f=>{const el=st.querySelector('[data-f="'+f+'"]');if(!el)return undefined;const ph=el.querySelector(".pj-ph");return ph?"":el.textContent.trim();};
 const h=g("h");if(h!==undefined)s.h=h.slice(0,80);const sub=g("s");if(sub!==undefined)s.s=sub.slice(0,120);
 const pts=[];for(let i=0;i<6;i++){const v=g("p"+i);if(v===undefined)break;pts.push(v.slice(0,110));}if(st.querySelector('[data-f="p0"]'))s.pts=pts.filter(Boolean);pjSave();}
function pjNote(t,bad){const n=E("#pjnote");if(n){n.textContent=t||"";n.style.color=bad?"#b7432d":"";}}
async function pjDraft(){if(PJ.busy)return;const topic=E("#pjtopic").value.trim();if(!topic){pjNote("Write what your project is about first.",true);E("#pjtopic").focus();return;}
 PJ.deck.topic=topic;PJ.deck.title=topic;
 if(AI.mode!=="hook"||!session()){PJ.deck.slides=pjStarter(topic);PJ.cur=0;pjSave();pjRender();pjNote("Log in on tab 1 and Claude can write a first draft for you. For now, here is the plan.");return;}
 PJ.busy=true;E("#pjgo").disabled=true;pjNote("Claude is writing a first draft of your slides…");
 try{const prompt='A CEFR B1 university student in Oman is making 6 slides for a class project. Project: "'+topic+'". Write the slides in simple B1 English with Omani examples (a place, a number or a name where possible). Slides: 1 title (heading = a short catchy title, sub = one line); 2 The problem; 3 Causes (who does it); 4 Effects (who feels it); 5 Our idea / solution (what we will make, how it works, why it is better); 6 Conclusion (In my opinion … because …; I suggest that …). Each content slide: heading of 2–5 words and 3 points of max 10 words. Reply with ONLY this JSON: {"slides":[{"h":"...","s":"..."},{"h":"...","pts":["...","...","..."]}, …6 items]}';
  const r=await hookJSON(prompt,{kind:"coach",pskills:[],plen:0});const sl=(Array.isArray(r&&r.slides)?r.slides:[]).slice(0,8).map((x,i)=>({h:String(x.h||"").slice(0,80),s:x.s?String(x.s).slice(0,120):undefined,pts:Array.isArray(x.pts)?x.pts.map(String).slice(0,5):undefined,st:(pjStarter(topic)[i]||{}).st}));
  if(sl.length<3)throw {msg:"Claude's draft was not complete. Try again."};PJ.deck.slides=sl;PJ.cur=0;pjSave();pjRender();pjNote("Draft ready — tap any text on the slide to change it. Make it yours!");}
 catch(e){PJ.deck.slides=pjStarter(topic);PJ.cur=0;pjSave();pjRender();pjNote((e&&e.msg)||"Claude did not answer, so here is the plan to fill in.",true);}
 finally{PJ.busy=false;E("#pjgo").disabled=false;}}
async function pjFix(){if(PJ.busy)return;pjReadStage();const s=PJ.deck.slides[PJ.cur];const lines=[s.h||""].concat(s.pts||[],s.s?[s.s]:[]).filter(x=>x.trim());if(!lines.length||AI.mode!=="hook"||!session()){pjNote(lines.length?"Log in on tab 1 first.":"Write something on the slide first.",true);return;}
 PJ.busy=true;pjNote("Checking your English…");try{const r=await hookJSON('Correct the English of these slide lines written by a CEFR B1 student. Keep the ideas and length; fix grammar, spelling and word choice only. Reply with ONLY this JSON: {"fixed":["..."],"notes":["one short note per change, or an empty list"]}\nLINES:\n'+lines.map((l,i)=>(i+1)+". "+l).join("\n"),{kind:"coach",pskills:[],plen:0});
  const fx=(Array.isArray(r&&r.fixed)?r.fixed:[]).map(String);if(!fx.length)throw {msg:"Nothing came back. Try again."};let k=0;s.h=fx[k++]||s.h;if(s.pts)s.pts=s.pts.map(p=>fx[k++]||p);if(s.s)s.s=fx[k++]||s.s;const notes=(Array.isArray(r.notes)?r.notes:[]).map(String).filter(Boolean);pjSave();pjRender();pjNote(notes.length?"Fixed: "+notes.join(" · "):"Checked — no changes needed.");}
 catch(e){pjNote((e&&e.msg)||"Claude did not answer. Try again.",true);}finally{PJ.busy=false;}}
async function pjShrink(file){const b=await shrinkImage(file,900,.72);return "data:"+(b.type||"image/jpeg")+";base64,"+await blobToB64(b);}
function pjPresent(){const d=PJ.deck;if(!d.slides.length)return;pjReadStage();let i=PJ.cur;const ov=document.createElement("div");ov.id="pjshow";ov.innerHTML='<div class="pj-stage"></div><div class="pj-ctl"><button type="button" data-p="-1">‹</button><span class="pj-pos"></span><button type="button" data-p="1">›</button><button type="button" data-p="x">✕</button></div>';document.body.appendChild(ov);
 const show=()=>{i=Math.max(0,Math.min(d.slides.length-1,i));ov.querySelector(".pj-stage").innerHTML=pjSlideHTML(d.slides[i],d.look,false);ov.querySelector(".pj-pos").textContent=(i+1)+" / "+d.slides.length;};
 const close=()=>{ov.remove();document.removeEventListener("keydown",kd);leaveFullscreen();};
 const kd=e=>{if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){i++;show();}else if(e.key==="ArrowLeft"||e.key==="PageUp"){i--;show();}else if(e.key==="Escape")close();};
 ov.addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(b){if(b.dataset.p==="x")close();else{i+=+b.dataset.p;show();}return;}const r=ov.getBoundingClientRect();i+=(e.clientX-r.left)>r.width/2?1:-1;show();});
 document.addEventListener("keydown",kd);goFullscreen();show();}
async function pjSaveServer(){if(AI.mode!=="hook"||!session()){pjNote("Log in on tab 1 to save to the class.",true);return;}pjReadStage();const d=PJ.deck;if(!d.slides.length)return;d.title=d.slides[0].h||d.topic||"My project";
 pjNote("Saving…");try{const res=await hookPost(hookURL(),{kind:"project_save",token:session().token,data:{id:d.id||"",title:d.title,topic:d.topic,theme:d.look,slides:d.slides}});const j=res.j||{};if(!j.ok)throw {msg:j.error||"Could not save."};d.id=String(j.id);pjSave();pjRender();pjNote("Saved. Your project code is "+d.id+" — a classmate can open it with it.");pjList();}catch(e){pjNote((e&&e.msg)||"Could not save.",true);}}
async function pjOpen(id){try{const res=await hookPost(hookURL(),{kind:"project_get",token:session().token,data:{id:String(id)}});const j=res.j||{};if(!j.ok||!j.project)throw {msg:j.error||"Not found."};const p=j.project;const own=p.student_id===session().id;PJ.deck={id:own?p.id:"",title:p.title,topic:p.topic||p.title||"",look:PJ_LOOKS[p.theme]?p.theme:"sand",slides:p.slides,updated:Date.now()};PJ.cur=0;pjSave();pjRender();pjNote(own?"Your project is open.":"Opened a copy of "+(p.by||"a classmate")+"'s project — your changes are your own.");}catch(e){pjNote((e&&e.msg)||"Not found.",true);}}
async function pjList(){const box=E("#pjclass");if(!box||AI.mode!=="hook"||!session())return;try{const res=await hookPost(hookURL(),{kind:"project_list",token:session().token});const j=res.j||{};const rows=(j.projects||[]);box.innerHTML=rows.length?rows.map(p=>'<button type="button" class="e-chip" data-pjopen="'+esc(p.id)+'">'+esc(p.title)+' <span class="e-muted">· '+esc(p.by||"")+'</span></button>').join(" "):'<span class="e-muted">No projects saved yet.</span>';}catch(e){}}
function pjInit(){pjLoad();pjRender();pjList();const pane=E("#tab-project");
 pane.addEventListener("input",e=>{const t=e.target;if(t.id==="pjtopic"){PJ.deck.topic=t.value;pjSave();}else if(t.closest("#pjstage")){const ph=t.querySelector&&t.querySelector(".pj-ph");if(ph)ph.remove();clearTimeout(PJ.t);PJ.t=setTimeout(()=>{pjReadStage();const i=PJ.cur;const th=E("#pjstrip").children[i];if(th)th.innerHTML='<span class="pj-n">'+(i+1)+'</span>'+pjSlideHTML(PJ.deck.slides[i],PJ.deck.look,false);},400);}});
 pane.addEventListener("focusin",e=>{const t=e.target;if(t.closest&&t.closest("#pjstage")&&t.dataset.f){const ph=t.querySelector(".pj-ph");if(ph){ph.remove();}}});
 pane.addEventListener("change",async e=>{const t=e.target;if(t.id==="pjimg"&&t.files&&t.files[0]){try{pjReadStage();PJ.deck.slides[PJ.cur].img=await pjShrink(t.files[0]);pjSave();pjRender();}catch(err){pjNote("Could not read that picture.",true);}t.value="";}});
 pane.addEventListener("click",async e=>{const b=e.target.closest("button,[data-act]");if(!b)return;const d=PJ.deck;const a=b.dataset.act||b.id;
  if(b.dataset.pji!==undefined){pjReadStage();PJ.cur=+b.dataset.pji;pjRender();return;}
  if(b.dataset.pjlook){d.look=b.dataset.pjlook;pjSave();pjRender();return;}
  if(b.dataset.pjopen){pjOpen(b.dataset.pjopen);return;}
  if(b.dataset.st){pjReadStage();const s=d.slides[PJ.cur];s.st=s.st===b.dataset.st?"":b.dataset.st;pjSave();pjRender();return;}
  if(a==="pjgo")pjDraft();
  else if(a==="add"){pjReadStage();d.slides.splice(PJ.cur+1,0,{h:"",pts:[""]});PJ.cur++;pjSave();pjRender();}
  else if(a==="addpt"){pjReadStage();const s=d.slides[PJ.cur];s.pts=(s.pts||[]).concat([""]);pjSave();pjRender();const li=E("#pjstage").querySelector('[data-f="p'+(s.pts.length-1)+'"]');if(li)li.focus();}
  else if(a==="pjdel"){if(d.slides.length<=1){pjNote("You need at least one slide.",true);return;}d.slides.splice(PJ.cur,1);PJ.cur=Math.max(0,PJ.cur-1);pjSave();pjRender();}
  else if(a==="pjleft"&&PJ.cur>0){pjReadStage();const s=d.slides.splice(PJ.cur,1)[0];d.slides.splice(PJ.cur-1,0,s);PJ.cur--;pjSave();pjRender();}
  else if(a==="pjright"&&PJ.cur<d.slides.length-1){pjReadStage();const s=d.slides.splice(PJ.cur,1)[0];d.slides.splice(PJ.cur+1,0,s);PJ.cur++;pjSave();pjRender();}
  else if(a==="pjpic"){E("#pjimg").click();}
  else if(a==="pjnopic"){delete d.slides[PJ.cur].img;pjSave();pjRender();}
  else if(a==="pjsticker"){const box=E("#pjstick");box.hidden=!box.hidden;}
  else if(a==="pjfix")pjFix();
  else if(a==="pjpresent")pjPresent();
  else if(a==="pjsave")pjSaveServer();
  else if(a==="pjnew"){if(d.slides.length&&!confirm_("Start a new project? (Save this one first if you want to keep it.)"))return;PJ.deck=pjBlank();PJ.cur=0;pjSave();pjRender();pjNote("");}
  else if(a==="pjopen"){const code=(E("#pjcodein").value||"").trim();if(code)pjOpen(code);}});
 E("#pjstick").innerHTML=PJ_STICKERS.map(s=>'<button type="button" class="pj-stb" data-st="'+s+'">'+s+'</button>').join("");}
function confirm_(m){try{return window.confirm?window.confirm(m):true;}catch(e){return true;}}
