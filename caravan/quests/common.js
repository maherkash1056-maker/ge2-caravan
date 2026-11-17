const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SESS=Caravan.init({game:GAME});Caravan.badge();
const ST={right:0,total:0,skills:{}};let EX=null,QI=0;
const normA=s=>String(s||"").toLowerCase().replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim();
function tally(q,ok){ST.total++;if(ok)ST.right++;const k=q.skill||"r_abc";ST.skills[k]=ST.skills[k]||{id:k,r:0,n:0};ST.skills[k].n++;if(ok)ST.skills[k].r++;}
function isRight(q,v){return q.type==="word"?String(q.a).split(/\s*\/\s*/).some(a=>normA(a)===normA(v)):+v===q.a;}
function rightText(q){return q.type==="word"?q.a:q.o[q.a];}
function nextQ(){return EX&&QI<EX.questions.length?EX.questions[QI++]:null;}
function qLeft(){return EX?EX.questions.length-QI:0;}
/* one question in a card, with the text beside it; resolves true/false */
function askQ(q,o){o=o||{};return new Promise(res=>{const d=document.createElement("div");d.className="qov";let done=false,tm=null;
  const typ=q.type==="tfng"?"True / False / Not Given":q.type==="abc"?"Choose A, B or C":"Write ONE word or a number from the text";
  d.innerHTML='<div class="card"><div class="row" style="justify-content:space-between"><span class="lab">'+esc(o.label||"Question")+'</span><span class="hint">'+typ+(o.hint?" · "+esc(o.hint):"")+'</span></div>'+(o.seconds?'<div class="timer"><i></i></div>':'')+'<p class="q">'+esc(q.q).replace(/_{2,}/g,"______")+'</p><div class="ans">'+(q.type==="word"?'<div class="row" style="flex-wrap:nowrap"><input autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer"><button class="btn t" data-go>Check</button></div>':q.o.map((x,i)=>'<button class="opt" data-v="'+i+'"><b>'+(q.type==="tfng"?"TFN"[i]:"ABC"[i])+'</b><span>'+esc(x)+'</span></button>').join(""))+'</div><div class="fbx"></div>'+Caravan.reader.box("The text — find the answer here (tap to highlight)")+'</div>';
  document.body.appendChild(d);Caravan.reader.bind(d.querySelector(".cv-text"));
  const finish=(v,late)=>{if(done)return;done=true;clearInterval(tm);const ok=!late&&isRight(q,v);tally(q,ok);d.querySelectorAll(".opt").forEach(b=>{b.disabled=true;if(+b.dataset.v===q.a)b.classList.add("ok");else if(+b.dataset.v===+v)b.classList.add("no");});const inp=d.querySelector("input");if(inp)inp.disabled=true;const g=d.querySelector("[data-go]");if(g)g.disabled=true;
    d.querySelector(".fbx").innerHTML='<div class="fb '+(ok?"ok":"no")+'">'+(ok?"✅ Correct! ":late?"⏰ Too late. ":"❌ Not this time. ")+(ok?"":"The answer is <b>"+esc(rightText(q))+"</b>. ")+esc(q.why||"")+'</div><button class="btn p w" data-next>Continue ▶</button>';
    d.querySelector("[data-next]").onclick=()=>{d.remove();res(ok);};d.querySelector(".card").scrollTop=0;};
  d.querySelectorAll(".opt").forEach(b=>b.onclick=()=>finish(b.dataset.v));const inp=d.querySelector("input");if(inp){const go=()=>{if(inp.value.trim())finish(inp.value);};d.querySelector("[data-go]").onclick=go;inp.addEventListener("keydown",e=>{if(e.key==="Enter")go();});}
  if(o.seconds){const t0=Date.now(),bar=d.querySelector(".timer i");tm=setInterval(()=>{const l=Math.max(0,1-(Date.now()-t0)/(o.seconds*1000));bar.style.width=(l*100)+"%";if(l<=0)finish(null,true);},200);}});}
function note(html,btn){return new Promise(res=>{const d=document.createElement("div");d.className="qov";d.innerHTML='<div class="card">'+html+'<button class="btn p w" style="margin-top:10px">'+(btn||"Continue ▶")+'</button></div>';document.body.appendChild(d);d.querySelector("button.btn.p.w").onclick=()=>{d.remove();res();};});}
async function loadExam(opts,readTitle){const app=$("#app");if(!SESS){app.innerHTML='<div class="card"><h1>'+esc(GAME)+'</h1><p class="err">Log in on the GE2 Caravan page first, then open this game from the Play tab.</p></div>';throw 0;}
  app.innerHTML='<div class="card"><h1>'+esc(GAME)+'</h1><p class="big">✍️ Claude is writing your text and questions…</p><p class="hint" style="text-align:center">About 30–60 seconds. A new text every time.</p></div>';
  try{EX=await Caravan.questions(opts);}catch(e){app.innerHTML='<div class="card"><h1>'+esc(GAME)+'</h1><p class="err">'+esc((e&&e.msg)||"Claude did not answer. Try again.")+'</p><button class="btn p" onclick="location.reload()">Try again</button></div>';throw e;}
  if(EX.bank){const want=new Set((opts.skills||[]).map(k=>k.replace(/^r_/,"")));EX.questions=EX.questions.filter(q=>want.has(q.type));if(opts.n&&EX.questions.length>opts.n)EX.questions=EX.questions.slice(0,opts.n);}
  if(!EX.questions.length){app.innerHTML='<div class="card"><p class="err">The questions did not pass the answer check. Try again.</p><button class="btn p" onclick="location.reload()">Try again</button></div>';throw 0;}
  QI=0;Caravan.reader.setText(EX.paragraphs);await Caravan.reader.readFirst({title:readTitle||"Read the text first",button:"Start ▶"});}
function finishGame(title,lines,won,badges){Caravan.report({right:ST.right,total:ST.total,skills:Object.values(ST.skills),won:!!won,badges:badges||[]});
  $("#app").innerHTML='<div class="card" style="text-align:center"><p class="big">'+title+'</p>'+lines.map(l=>'<p style="margin:4px 0">'+l+'</p>').join("")+'<p style="margin:8px 0"><b>'+ST.right+' / '+ST.total+'</b> questions right. Your result and XP are saved.</p><div class="row" style="justify-content:center"><button class="btn p" onclick="location.reload()">Play again</button></div><p class="hint">Close this tab to go back to the Caravan.</p></div>';}
document.addEventListener("click",function(e){if(e.target.closest("button")&&!document.fullscreenElement&&!window._fs){window._fs=true;Caravan.fullscreen();}},true);
