/* ===================== GAME STUDIO · CORE ===================== */
const STUDIO_V="1.0";
const W=640,H=360;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
const DIFF={simple:{label:"Simple",hearts:5,spd:.75,rate:.13,dmg:1.3,hp:1},regular:{label:"Regular",hearts:3,spd:.92,rate:.13,dmg:1,hp:1}};
const GENRES={
 race:{name:"Race",e:"🏁",desc:"Race against a rival. Touch the ? boxes to answer.",hero:"Barq",enemy:"Zubair",right:"you get a speed boost",wrong:"you slow down for 3 seconds",taunts:["You will never catch me!","I can see the finish line!","Too slow, too slow!"],trigger:"when you touch a ? box"},
 penalty:{name:"Penalty shootout",e:"⚽",desc:"A question before every penalty kick. Right = a power shot.",hero:"Nasser",enemy:"The Wall",right:"you get a power shot",wrong:"the goalkeeper gets bigger and faster",taunts:["Nothing gets past me!","Is that a shot or a pass?","My gloves are hungry!"],trigger:"before every penalty kick"},
 space:{name:"Space shooter",e:"🚀",desc:"Fly, dodge and shoot. A question when a big ship arrives.",hero:"Captain Noor",enemy:"The Grammar Goblin",right:"your super laser destroys the big ship",wrong:"the big ship hits your shield",taunts:["Your grammar is weak, captain!","Is it IS or ARE? Ha!","My ships are everywhere!"],trigger:"when a big enemy ship arrives"},
 boss:{name:"Boss fight",e:"👹",desc:"Fight a boss with three faces, like Brew-Haha.",hero:"The Dallah",enemy:"Baron Brew",right:"you hit the boss with a super attack",wrong:"the boss hits you",taunts:["Your coffee is weak, little pot!","Sssteamed yet? Ha!","I'M BOILING MAD!"],trigger:"each time the boss loses some health"}};
const SW={/* colour swatches */
 kit:["#c0392b","#2980b9","#27ae60","#f1c40f","#8e44ad","#e67e22","#2c3e50","#ecf0f1"],
 camel:["#d9a35a","#f5f0e6","#8b5a2b","#c97b3d","#3b2a20"],
 car:["#e74c3c","#2980b9","#27ae60","#f1c40f","#8e44ad","#ecf0f1","#2c3e50","#e67e22"],
 skin:["#f1c8a5","#d9a27a","#c98e5f","#8d5a3b"],
 hijab:["#1f3a5f","#6c3483","#2c3e50","#ecf0f1","#7b241c","#145a32"],
 ship:["#e74c3c","#2980b9","#27ae60","#f1c40f","#8e44ad","#ecf0f1"],
 pot:{gold:["#c89b3c","#f2dc92","#8a6322"],silver:["#a7b1bb","#e6ebef","#6d7780"],copper:["#c4693b","#f0b48f","#7e3b1c"],emerald:["#2e8b6a","#9fe0c4","#1b5a44"]},
 boss:{classic:{porc:"#f6f0e3",navy:"#2f3b4e",gold:"#e4b84a"},jade:{porc:"#d9f0e3",navy:"#1d6b52",gold:"#e4b84a"},ruby:{porc:"#f6e0e0",navy:"#8e1b2c",gold:"#e4b84a"},midnight:{porc:"#dfe3f0",navy:"#1b1f4a",gold:"#9fd3ff"}}};
function newQ(type){return {type:type||"abc",q:"",a:"",b:"",c:"",ans:"",why:""};}
function blankSpec(){return {v:1,genre:"race",name:"",team:"",hero:"",enemy:"",faces:["","",""],taunts:["","",""],right:"",wrong:"",look:"old",
 vehicle:"camel",heroCol:"#d9a35a",rivalCol:"#8b5a2b",tod:"day",num:"7",
 kit:"#c0392b",kit2:"#fbf4e3",hair:"short",hijab:"#1f3a5f",skin:"#c98e5f",keeperKit:"#2c3e50",
 shipCol:"#e74c3c",shipAcc:"#f1c40f",foeCol:"#16a085",pot:"gold",bossTheme:"classic",
 text:"",qs:[newQ("abc"),newQ("abc"),newQ("abc"),newQ("abc"),newQ("abc")]};}
function qReady(q){if(!q||!String(q.q||"").trim()||!String(q.ans||"").trim())return false;if(q.type==="abc"&&!(String(q.a||"").trim()&&String(q.b||"").trim()&&String(q.c||"").trim()))return false;return true;}
function gv(spec,k){const g=GENRES[spec.genre]||GENRES.race;const v=String(spec[k]||"").trim();return v||g[k]||"";}
function tauntOf(spec,i){const g=GENRES[spec.genre]||GENRES.race;const v=String((spec.taunts||[])[i]||"").trim();return v||g.taunts[i%3];}

/* ---------- share codes ---------- */
function sanitizeSpec(o){const b=blankSpec();if(!o||typeof o!=="object")return null;const s=Object.assign(b,{});
  const str=(v,n)=>String(v==null?"":v).slice(0,n||120);
  for(const k in b){if(k==="qs"||k==="faces"||k==="taunts")continue;if(o[k]!==undefined)s[k]=str(o[k],k==="text"?1600:120);}
  if(!GENRES[s.genre])s.genre="race";
  s.faces=[0,1,2].map(i=>str((o.faces||[])[i],40));s.taunts=[0,1,2].map(i=>str((o.taunts||[])[i],90));
  s.qs=(Array.isArray(o.qs)?o.qs:[]).slice(0,15).map(q=>({type:["tfng","abc","word"].includes(q&&q.type)?q.type:"abc",q:str(q&&q.q,220),a:str(q&&q.a,80),b:str(q&&q.b,80),c:str(q&&q.c,80),ans:str(q&&q.ans,60),why:str(q&&q.why,160)}));
  if(!s.qs.length)s.qs=[newQ("abc")];return s;}
function encodeSpec(spec){const j=JSON.stringify(spec);const b=btoa(unescape(encodeURIComponent(j)));return "GAME-"+b.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function decodeSpec(code){try{let c=String(code||"").trim().replace(/\s+/g,"");const i=c.indexOf("GAME-");if(i<0)return null;c=c.slice(i+5);c=c.replace(/-/g,"+").replace(/_/g,"/");while(c.length%4)c+="=";const j=decodeURIComponent(escape(atob(c)));return sanitizeSpec(JSON.parse(j));}catch(e){return null;}}
/* ---------- import a Game Design Lab plan ---------- */
function parsePlan(txt){const s=blankSpec();const T=String(txt||"");const get=(label)=>{const m=T.match(new RegExp("^"+label+":\\s*(.+)$","mi"));return m?m[1].trim():"";};
  const clean=v=>/^\(.*\)$/.test(v)?"":v;
  s.name=clean(get("GAME NAME"));s.team=clean(get("MADE BY")).replace(/\s*\(show this.*$/i,"");
  const type=get("TYPE OF GAME").toLowerCase();
  s.genre=/penalty|football/.test(type)?"penalty":/space/.test(type)?"space":/boss/.test(type)?"boss":/race|runner|car|camel|horse/.test(type)?"race":"race";
  if(/runner/.test(type))s.vehicle="runner";if(/car/.test(type))s.vehicle="car";
  s.hero=clean(get("HERO \\(the player\\)")).slice(0,60);s.enemy=clean(get("ENEMY / OPPONENT")).slice(0,60);
  const r=T.match(/RIGHT answer:\s*(.+?)\.\s*Show/i),w=T.match(/WRONG answer:\s*(.+?)\.\s*Show/i);if(r&&!/^\(/.test(r[1]))s.right=r[1];if(w&&!/^\(/.test(w[1]))s.wrong=w[1];
  const tx=T.match(/"""\s*([\s\S]*?)\s*"""/);if(tx)s.text=tx[1].trim().slice(0,1600);
  const qs=[];const re=/^\s*\d+\.\s*\[(True \/ False \/ Not Given|Choose A, B or C|Write the missing word)\]\s*(.+)$/gm;let m;const idx=[];
  while((m=re.exec(T))){idx.push({i:m.index,type:m[1],q:m[2].trim(),end:re.lastIndex});}
  idx.forEach((it,k)=>{const block=T.slice(it.end,k+1<idx.length?idx[k+1].i:T.length);const q=newQ(it.type.startsWith("True")?"tfng":it.type.startsWith("Choose")?"abc":"word");q.q=it.q;
    const o=block.match(/A\)\s*(.*?)\s+B\)\s*(.*?)\s+C\)\s*(.*)/);if(o){q.a=o[1].trim();q.b=o[2].trim();q.c=o[3].trim();}
    const an=block.match(/Answer:\s*(.+)/);if(an)q.ans=an[1].replace(/\s*\(accept.*$/i,"").trim();
    const wy=block.match(/Why:\s*(.+)/);if(wy)q.why=wy[1].trim();qs.push(q);});
  if(qs.length)s.qs=qs.slice(0,15);
  return (s.name||qs.length)?s:null;}

/* ---------- audio (sound effects only) ---------- */
const AU={ctx:null,master:null,on:true};
function actx(){if(!AU.ctx){try{AU.ctx=new (window.AudioContext||window.webkitAudioContext)();AU.master=AU.ctx.createGain();AU.master.gain.value=.5;AU.master.connect(AU.ctx.destination);}catch(e){}}if(AU.ctx&&AU.ctx.state==="suspended")AU.ctx.resume();return AU.ctx;}
function tone(f,dur,type,vol,slide,when,q){const c=actx();if(!c||!AU.on)return;const t0=when||c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type=type||"square";o.frequency.setValueAtTime(f,t0);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t0+dur);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol||.2,t0+.01);g.gain.exponentialRampToValueAtTime(.001,t0+dur);let node=o;if(q){const fl=c.createBiquadFilter();fl.type="lowpass";fl.frequency.value=q;o.connect(fl);node=fl;}node.connect(g);g.connect(AU.master);o.start(t0);o.stop(t0+dur+.05);}
function noise(dur,vol,when,hp){const c=actx();if(!c||!AU.on)return;const t0=when||c.currentTime;const n=Math.floor(c.sampleRate*dur);const b=c.createBuffer(1,n,c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const g=c.createGain();g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.001,t0+dur);const f=c.createBiquadFilter();f.type="highpass";f.frequency.value=hp||4000;s.connect(f);f.connect(g);g.connect(AU.master);s.start(t0);}
const now=()=>actx()?actx().currentTime:0;
const SFX={shoot(){tone(520,.07,"square",.045,260);},hit(){tone(180,.08,"triangle",.16,90);noise(.05,.07,null,2000);},jump(){tone(300,.14,"square",.07,620);},dash(){noise(.14,.14,null,1200);tone(200,.12,"sawtooth",.06,500,null,1200);},
 parry(){[880,1175,1568].forEach((f,i)=>tone(f,.18,"triangle",.16,null,now()+i*.06));},hurt(){tone(300,.35,"sawtooth",.18,70);noise(.15,.12,null,800);},
 q(){[1046,1318,1568,2093].forEach((f,i)=>tone(f,.14,"triangle",.14,null,now()+i*.07));},right(){[523,659,784,1046].forEach((f,i)=>tone(f,.2,"triangle",.16,null,now()+i*.09));},
 wrong(){tone(300,.25,"sawtooth",.14,260,null,900);tone(260,.5,"sawtooth",.14,170,now()+.25,900);},phase(){tone(200,.7,"sawtooth",.16,900,null,2500);noise(.6,.1,null,500);},
 ko(){[392,523,659,784,1046].forEach((f,i)=>tone(f,.5,"square",.12,null,now()+i*.08,3000));noise(.8,.2,null,300);},dead(){[440,415,392,370,349,330].forEach((f,i)=>tone(f,.3,"sawtooth",.12,null,now()+i*.18,1200));},
 super(){tone(120,1.2,"sawtooth",.18,480,null,1500);noise(1.2,.1,null,1500);},tap(){tone(700,.05,"square",.05,500);},whistle(){tone(1800,.5,"sine",.1,2200);},stomp(){noise(.3,.3,null,150);tone(80,.3,"sine",.3,40);},
 kick(){noise(.08,.25,null,300);tone(140,.12,"sine",.25,60);},crowd(){noise(1.4,.18,null,600);},groan(){noise(.9,.12,null,300);tone(220,.6,"sawtooth",.05,140,null,600);},boost(){tone(200,.5,"sawtooth",.1,900,null,2000);noise(.4,.08,null,1500);},
 laser(){tone(1400,.08,"square",.03,600);},boom(){noise(.5,.3,null,120);tone(90,.4,"sine",.3,30);}};

/* ---------- play state ---------- */
const G={mode:"off",sub:"",t:0,subT:0,spec:null,mod:null,qs:[],qi:0,hearts:3,score:0,qRight:0,qWrong:0,streak:0,playT:0,card:null,texts:[],fx:[],shake:0,paused:false,
 keys:{},stickId:null,stick:{ox:0,oy:0,dx:0,dy:0},btn:{},hold:{},pressed:{},ptr:{},touch:false,from:"editor",diff:DIFF.regular,diffKey:"regular",bubble:null,hbubble:null,heroFlash:0,inv:0};
const MODS={};
let K=1,KB=false;
const playwrap=$("#playwrap"),stageEl=$("#stage"),cv=$("#gl"),panel=$("#panel"),hud=$("#hud");
const ctx=cv.getContext("2d");ART.set(ctx);
function fit(){if(playwrap.hidden)return;const vw=innerWidth,vh=innerHeight;const s=KB?Math.min(vw/W,2.4):Math.min(vw/W,vh/H,2.4);stageEl.style.transform="scale("+s+")";stageEl.style.transformOrigin=KB?"top center":"center";playwrap.style.alignItems=KB?"flex-start":"center";const dpr=Math.min(2.5,devicePixelRatio||1);K=Math.max(1,Math.round(s*dpr*100)/100);cv.width=Math.round(W*K);cv.height=Math.round(H*K);}
addEventListener("resize",fit);
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="ans"){KB=true;panel.classList.add("typing");fit();}});
document.addEventListener("focusout",e=>{if(e.target&&e.target.id==="ans"){setTimeout(()=>{const a=document.activeElement;if(a&&a.id==="ans")return;KB=false;panel.classList.remove("typing");fit();},260);}});
function setSub(s){G.sub=s;G.subT=0;}
function seqCards(list,done){let i=0;const next=()=>{if(i>=list.length){G.card=null;done&&done();return;}const c=list[i++];G.card={txt:c[0],col:c[1],t:0,dur:c[2],size:c[3]||48};setTimeout(next,c[2]*1000);};next();}
function showCard(txt,col,dur,size){G.card={txt,col,t:0,dur,size:size||40};setTimeout(()=>{if(G.card&&G.card.txt===txt)G.card=null;},dur*1000);}
function addText(x,y,txt,col,size){G.texts.push({x,y,txt,col,size:size||22,t:0,dur:.9});}
function addFx(k,x,y,o){G.fx.push(Object.assign({k,x,y,t:0},o||{}));}
function say(txt,dur){G.bubble={txt,t:0,dur:dur||2.6};}
function heroSay(txt,dur){G.hbubble={txt,t:0,dur:dur||1.8};}
function showPanel(html,cls){panel.innerHTML=html;panel.className=cls||"ui";panel.hidden=false;}
function hidePanel(){panel.hidden=true;panel.innerHTML="";}

/* ---------- open / close the player ---------- */
function openPlay(spec,from){G.spec=sanitizeSpec(spec);G.from=from||"editor";G.mod=MODS[G.spec.genre];playwrap.hidden=false;document.body.classList.add("playing");fit();actx();titleCard();}
function closePlay(){G.mode="off";G.paused=false;hidePanel();playwrap.hidden=true;document.body.classList.remove("playing");if(typeof onClosePlay==="function")onClosePlay();}
function titleCard(){G.mode="title";hud.hidden=true;G.fx=[];G.texts=[];G.card=null;G.bubble=null;G.hbubble=null;const sp=G.spec,g=GENRES[sp.genre];G.mod.init(sp);
  const n=sp.qs.filter(qReady).length;
  const help=G.mod.help(sp).map(l=>'<li>'+l+'</li>').join("");
  showPanel('<div class="card flat" style="max-width:600px"><div class="ribbon">'+g.e+' '+esc(g.name.toUpperCase())+'</div><h1 class="logo" style="font-size:40px;margin-top:6px">'+esc(sp.name||"Our Game")+'</h1>'+(sp.team?'<p class="sub" style="margin:2px 0 6px">made by '+esc(sp.team)+'</p>':'')+
   '<div class="cols"><div><div class="lbl">How to play</div><ul class="howto">'+help+'<li><b>'+n+' questions</b> appear '+esc(g.trigger)+'. Right: '+esc(gv(sp,"right"))+'. Wrong: '+esc(gv(sp,"wrong"))+'.</li></ul></div>'+
   '<div style="flex:.7"><div class="lbl">Level</div><div class="row" style="justify-content:flex-start">'+Object.keys(DIFF).map(k=>'<button class="btn '+(G.diffKey===k?"sel":"alt")+'" data-act="diff" data-d="'+k+'">'+DIFF[k].label+'</button>').join("")+'</div><p class="sm" style="margin-top:6px">'+(G.diffKey==="simple"?"5 hearts, slower game":"3 hearts, the real game")+'</p>'+
   '<button class="btn big wide red" data-act="go" style="margin-top:8px"'+(n?'':' disabled')+'>PLAY</button>'+(n?'':'<p class="sm">This game has no complete questions yet.</p>')+'<button class="btn alt wide" data-act="exit" style="margin-top:8px">'+(G.from==="editor"?"← Back to the Studio":"← Exit")+'</button></div></div></div>',"ui scrim top");}
function startRun(){const sp=G.spec;G.diff=DIFF[G.diffKey];G.qs=sp.qs.filter(qReady);G.qi=0;G.hearts=G.diff.hearts;G.score=0;G.qRight=0;G.qWrong=0;G.streak=0;G.playT=0;G.fx=[];G.texts=[];G.card=null;G.bubble=null;G.hbubble=null;G.inv=0;G.heroFlash=0;G.paused=false;G.keys={};G.btn={};G.hold={};G.pressed={};
  hidePanel();hud.hidden=false;G.mode="play";setSub("intro");G.mod.start(sp);
  seqCards([["READY?",ART.C.gold,.9],["GO!",ART.C.red,.8]],()=>{if(G.mode==="play"&&G.sub==="intro"){setSub("play");say(tauntOf(sp,0));}});}
/* ---------- hearts ---------- */
function hurt(silent){if(G.inv>0||G.mode!=="play")return false;G.hearts--;G.inv=1.4;G.heroFlash=.6;G.shake=8;G.streak=0;if(!silent)SFX.hurt();if(G.hearts<=0){G.hearts=0;setTimeout(()=>finish(false,"hearts"),900);setSub("over");}return true;}
/* ---------- questions ---------- */
let QA=null;
function askQuestion(extra){if(G.mode!=="play")return;setSub("q");const last=G.qi>=G.qs.length-1;const q=G.qs[G.qi%G.qs.length];QA={q,n:G.qi+1,total:G.qs.length,last,answered:false,ok:false,extra:extra||{}};SFX.q();
  showCard(extra&&extra.title?extra.title:"A QUESTION!",ART.C.teal,.7,34);setTimeout(renderQuestion,750);}
function renderQuestion(){if(!QA)return;const q=QA.q,sp=G.spec;const split=!!String(sp.text||"").trim();
  const typeName=q.type==="tfng"?"True / False / Not Given":q.type==="abc"?"Choose A, B or C":"Write the missing word";
  let h=(split?'<div class="split"><div class="card flat side"><div class="sidehd">The text — read to find the answer</div><div class="letter">'+String(sp.text).split(/\n+/).map(p=>'<p>'+esc(p)+'</p>').join("")+'</div></div>':'')+
   '<div class="card q flat" style="max-width:'+(split?'none':'560px')+'"><div class="ribbon">QUESTION '+QA.n+' OF '+QA.total+'</div><div class="row spread" style="margin-top:2px"><span class="badge">'+typeName+'</span></div><div class="q" style="margin-top:8px">'+esc(q.q).replace(/_{2,}/g,'<span class="gap">&nbsp;</span>')+'</div>';
  if(q.type==="tfng"){h+='<div class="opts one">'+["True","False","Not Given"].map((o,i)=>'<button class="opt" data-act="opt" data-v="'+o+'"><b>'+"ABC"[i]+'</b><span>'+o+'</span></button>').join("")+'</div>';}
  else if(q.type==="abc"){h+='<div class="opts one">'+[["A",q.a],["B",q.b],["C",q.c]].map(o=>'<button class="opt" data-act="opt" data-v="'+o[0]+'"><b>'+o[0]+'</b><span>'+esc(o[1])+'</span></button>').join("")+'</div>';}
  else{h+='<div class="row inputrow" style="margin-top:10px;flex-wrap:nowrap"><input type="text" id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Type your answer"><button class="btn teal" data-act="check">Check</button></div>';}
  h+='<div class="fb" id="fb" hidden></div></div>'+(split?'</div>':'');showPanel(h,"ui scrim top");const inp=$("#ans");if(inp&&!G.touch)inp.focus();}
function normA(s){return String(s||"").toLowerCase().replace(/[’`]/g,"'").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim();}
function answer(val,el){if(!QA||QA.answered)return;const fb=$("#fb");if(!fb)return;const q=QA.q;let ok;
  if(q.type==="word"){const alts=String(q.ans).split(/\s*\/\s*|\s+or\s+/i).map(normA).filter(Boolean);ok=alts.includes(normA(val));}else ok=normA(val)===normA(q.ans);
  QA.answered=true;QA.ok=ok;const right=q.type==="abc"?q.ans+") "+({A:q.a,B:q.b,C:q.c}[String(q.ans).trim().toUpperCase()]||""):q.ans;
  if(ok){G.qRight++;G.streak++;const pts=100+Math.min(100,25*(G.streak-1));G.score+=pts;SFX.right();fb.className="fb ok";fb.innerHTML="<b>Correct! +"+pts+"</b> — "+esc(gv(G.spec,"right"))+(q.why?"<br>"+esc(q.why):"");}
  else{G.qWrong++;G.streak=0;SFX.wrong();fb.className="fb bad";fb.innerHTML="<b>Wrong</b> — "+esc(gv(G.spec,"wrong"))+"<br>Answer: <b>"+esc(right)+"</b>"+(q.why?"<br>"+esc(q.why):"");}
  panel.querySelectorAll(".opt").forEach(b=>{b.disabled=true;const v=b.dataset.v;if(normA(v)===normA(q.ans))b.classList.add("right");else if(el&&b===el)b.classList.add("wrong");});
  const inp=$("#ans");if(inp)inp.disabled=true;
  fb.hidden=false;fb.insertAdjacentHTML("afterend",'<button class="btn big wide" style="margin-top:10px" data-act="resume">Back to the game →</button>');fb.scrollIntoView({block:"nearest"});}
function resumeFromQuestion(){if(!QA||!QA.answered)return;const ok=QA.ok,last=QA.last,extra=QA.extra;QA=null;hidePanel();G.qi++;setSub("play");G.inv=Math.max(G.inv,.8);G.mod.onAnswer(ok,last,extra);}
/* ---------- results ---------- */
function accuracy(){const t=G.qRight+G.qWrong;return t?G.qRight/t:0;}
function grade(){const a=accuracy();if(a>=.9)return "A+";if(a>=.8)return "A";if(a>=.7)return "B";if(a>=.6)return "C";return "D";}
function proof(){let h=0;const s=(G.spec.name||"")+"|"+G.score+"|"+G.qRight+"|"+G.diffKey;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return (h%46656).toString(36).toUpperCase().padStart(3,"0");}
function finish(won,reason){if(G.mode!=="play")return;G.mode="result";hud.hidden=true;const sp=G.spec;const mm=Math.floor(G.playT/60),ss=String(Math.floor(G.playT%60)).padStart(2,"0");
  if(won)SFX.ko();else SFX.dead();
  const line=won?pick(["You win!","Champion!","What a game!","Brilliant!"]):pick(["Game over!","So close!","Try again!"]);
  const extra=G.mod.resultLines?G.mod.resultLines(won):[];
  let h='<div class="card flat" style="max-width:600px"><div class="ribbon">'+(won?"YOU WIN!":"GAME OVER")+'</div><div class="cols" style="margin-top:6px"><div><h2 style="margin:0 0 4px">'+line+'</h2><div class="grade">'+grade()+'</div><p class="sm center">'+esc(sp.name||"Our Game")+' · '+G.diff.label+' · proof <b>'+proof()+'</b></p></div><div><div class="statl"><span>Questions right</span><b>'+G.qRight+' / '+(G.qRight+G.qWrong)+' ('+Math.round(accuracy()*100)+'%)</b>'+extra.map(e=>'<span>'+esc(e[0])+'</span><b>'+esc(e[1])+'</b>').join("")+'<span>Time</span><b>'+mm+':'+ss+'</b><span>Score</span><b>'+G.score.toLocaleString()+'</b></div></div></div>'+
   '<div class="row" style="margin-top:8px"><button class="btn big" data-act="again">Play again</button><button class="btn alt" data-act="exit">'+(G.from==="editor"?"← Back to the Studio":"← Exit")+'</button></div></div>';
  showPanel(h,"ui scrim top");}
/* ---------- input ---------- */
function readInput(){const k=G.keys,st=G.stick;let mx=0,my=0;if(k.l)mx-=1;if(k.r)mx+=1;if(k.u)my-=1;if(k.d)my+=1;
  if(G.stickId!==null){const dx=st.dx,dy=st.dy;if(Math.abs(dx)>10)mx=clamp(dx/28,-1,1);if(Math.abs(dy)>10)my=clamp(dy/28,-1,1);}
  if(G.hold.duck)my=1;
  const up=k.u||(G.stickId!==null&&st.dy<-26);const jump=!!(k.jump||G.btn.jump);const dash=!!(k.dash||G.btn.dash);const superBtn=!!(k.sup||G.btn.sup);const act=!!(k.act||G.btn.act||k.jump);
  k.jump=false;k.dash=false;k.sup=false;k.act=false;G.btn={};
  return {mx:Math.abs(mx)<.35?0:mx,my:Math.abs(my)<.35?0:my,mxr:mx,myr:my,up,jump,dash,superBtn,act};}
function stagePt(e){const r=stageEl.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
stageEl.addEventListener("pointerdown",e=>{if(e.target.closest("button")||!panel.hidden||G.mode!=="play")return;actx();if(e.pointerType==="touch")G.touch=true;const p=stagePt(e);try{stageEl.setPointerCapture(e.pointerId);}catch(_){}
  const mod=G.mod;if(mod.stick&&p.x<W*.45&&(G.touch||e.pointerType!=="mouse")){if(G.stickId===null){G.stickId=e.pointerId;G.stick={ox:p.x,oy:p.y,dx:0,dy:0};}return;}
  let hit=null;for(const b of (mod.buttons?mod.buttons():[])){if(b.hidden)continue;if(Math.hypot(p.x-b.x,p.y-b.y)<b.r+10){hit=b;break;}}
  const id=hit?hit.id:(mod.tap||"act");if(hit&&hit.hold)G.hold[id]=true;else G.btn[id]=true;G.ptr[e.pointerId]={btn:id,hold:!!(hit&&hit.hold)};G.pressed[id]=(G.pressed[id]||0)+1;});
stageEl.addEventListener("pointermove",e=>{if(e.pointerId===G.stickId){const p=stagePt(e);G.stick.dx=p.x-G.stick.ox;G.stick.dy=p.y-G.stick.oy;}});
function pointerEnd(e){if(e.pointerId===G.stickId){G.stickId=null;G.stick.dx=0;G.stick.dy=0;}const pr=G.ptr[e.pointerId];if(pr){G.pressed[pr.btn]=Math.max(0,(G.pressed[pr.btn]||1)-1);if(pr.hold&&G.pressed[pr.btn]<=0)G.hold[pr.btn]=false;delete G.ptr[e.pointerId];}}
stageEl.addEventListener("pointerup",pointerEnd);stageEl.addEventListener("pointercancel",pointerEnd);stageEl.addEventListener("lostpointercapture",pointerEnd);
addEventListener("keydown",e=>{if(playwrap.hidden)return;if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"))return;const k=e.key;
  if(k==="ArrowLeft"||k==="a"||k==="A")G.keys.l=true;if(k==="ArrowRight"||k==="d"||k==="D")G.keys.r=true;if(k==="ArrowUp"||k==="w"||k==="W")G.keys.u=true;if(k==="ArrowDown"||k==="s"||k==="S")G.keys.d=true;
  if((k===" "||k==="z"||k==="Z")&&!e.repeat){e.preventDefault();actx();G.keys.jump=true;}if((k==="x"||k==="X"||k==="Shift")&&!e.repeat)G.keys.dash=true;if((k==="c"||k==="C")&&!e.repeat)G.keys.sup=true;if(k==="Enter"&&!e.repeat&&panel.hidden)G.keys.act=true;
  if(k==="ArrowUp"||k==="ArrowDown"||k===" ")e.preventDefault();
  if(k==="Escape"){if(G.paused)unpause();else pause();}});
addEventListener("keyup",e=>{const k=e.key;if(k==="ArrowLeft"||k==="a"||k==="A")G.keys.l=false;if(k==="ArrowRight"||k==="d"||k==="D")G.keys.r=false;if(k==="ArrowUp"||k==="w"||k==="W")G.keys.u=false;if(k==="ArrowDown"||k==="s"||k==="S")G.keys.d=false;});
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
function pause(){if(G.mode!=="play"||G.sub!=="play"||G.paused)return;G.paused=true;showPanel('<div class="card flat" style="max-width:380px"><h2>Paused</h2><div class="row"><button class="btn big teal" data-act="unpause">Resume</button><button class="btn alt" data-act="quit">Quit</button></div></div>',"ui scrim");}
function unpause(){G.paused=false;hidePanel();}
$("#pausebtn").addEventListener("click",pause);
panel.addEventListener("click",e=>{const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;actx();
  if(a==="go")startRun();else if(a==="diff"){G.diffKey=el.dataset.d;titleCard();}else if(a==="exit")closePlay();
  else if(a==="opt")answer(el.dataset.v,el);else if(a==="check"){const v=($("#ans")||{}).value||"";if(v.trim())answer(v);}
  else if(a==="resume")resumeFromQuestion();else if(a==="again")titleCard();else if(a==="unpause")unpause();else if(a==="quit"){G.paused=false;titleCard();}});
panel.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target&&e.target.id==="ans"){e.preventDefault();const v=e.target.value||"";if(v.trim())answer(v);}});
/* ---------- render ---------- */
function heart(x,y,on){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(0,6);ctx.bezierCurveTo(-12,-4,-6,-14,0,-7);ctx.bezierCurveTo(6,-14,12,-4,0,6);ctx.closePath();ctx.fillStyle=on?ART.C.red:"#d8c9a6";ctx.fill();ART.stroke(2.5);ctx.restore();}
function hudText(x,y,txt,align,size){ctx.save();ctx.font=(size||14)+"px 'Rum Raisin', Impact, sans-serif";ctx.textAlign=align||"left";ctx.textBaseline="middle";ctx.lineJoin="round";ctx.lineWidth=4;ctx.strokeStyle="rgba(251,244,227,.95)";ctx.strokeText(txt,x,y);ctx.fillStyle=ART.C.ink;ctx.fillText(txt,x,y);ctx.restore();}
function drawCommon(){const t=G.t;
  G.fx.forEach(f=>{const k=f.t/(f.dur||.5);if(f.k==="spark")ART.spark(f.x,f.y,6+k*14,(f.rot||0)+k*2,ART.C.gold);else if(f.k==="cloud")ART.cloud(f.x,f.y-k*20,f.r*(1+k*.5),1-k);else if(f.k==="poof")ART.cloud(f.x,f.y,f.r*(1+k),1-k,ART.C.steamD);else if(f.k==="burst"){for(let i=0;i<6;i++){const a=i*Math.PI/3+k*2;ART.star(f.x+Math.cos(a)*k*44,f.y+Math.sin(a)*k*44,7*(1-k)+2,f.col||ART.C.pink,a);}}else if(f.k==="star")ART.star(f.x,f.y-k*30,10*(1-k)+2,ART.C.gold,k*4);else if(f.k==="boom")ART.boom(f.x,f.y,k,f.r||30);});
  G.texts.forEach(x=>{const k=x.t/x.dur;ctx.save();ctx.globalAlpha=1-k*k;ART.textPop(x.x,x.y-k*40,x.txt,x.size*(1+k*.2),x.col,-.1);ctx.restore();});
  const bp=G.mod&&G.mod.bubbleAt?G.mod.bubbleAt():null;if(G.bubble&&bp)ART.bubble(bp.x,bp.y,G.bubble.txt,180,bp.dir||0);
  const hp=G.mod&&G.mod.heroBubbleAt?G.mod.heroBubbleAt():null;if(G.hbubble&&hp)ART.bubble(hp.x,hp.y,G.hbubble.txt,160,hp.dir||0);}
function drawHudCommon(){if(G.mod.noHearts!==true){const n=G.diff.hearts;for(let i=0;i<n;i++)heart(22+i*22,22,i<G.hearts);}
  hudText(G.mod.noHearts?16:22+G.diff.hearts*22+6,22,"SCORE "+G.score.toLocaleString(),"left",14);
  if(G.mod.hud)G.mod.hud();
  const mod=G.mod;if(G.touch){if(mod.stick){const st=G.stick;if(G.stickId!==null)ART.stick(st.ox,st.oy,st.dx,st.dy,true);else ART.stick(80,282,0,0,false);}
    (mod.buttons?mod.buttons():[]).forEach(b=>{if(!b.hidden)ART.button(b.x,b.y,b.r,b.label,b.col,(G.pressed[b.id]||0)>0,b.alpha||.55);});}
  else{const tip=mod.keysTip;if(tip&&G.playT<8)hudText(W/2,H-12,tip,"center",13);}}
function render(){ctx.setTransform(K,0,0,K,0,0);const t=G.t;ctx.save();if(G.shake>0)ctx.translate(rand(-G.shake,G.shake),rand(-G.shake,G.shake));
  if(G.mod)G.mod.render(t);drawCommon();if(G.mode==="play"&&G.sub!=="intro_hidden")drawHudCommon();
  if(G.card){const c=G.card,k=Math.min(1,c.t/.25),s=1.4-.4*k*(2-k);ctx.save();ctx.translate(W/2,H*.42);ctx.scale(s,s);ctx.rotate(-.05);ART.textPop(0,0,c.txt,c.size,c.col,0);ctx.restore();}
  ctx.restore();ART.film(K,t,G.spec&&G.spec.look==="colour"?"colour":false);}
function tick(dt){G.t+=dt;ART.boil(G.t);if(G.mode==="off")return;G.subT+=dt;if(G.card)G.card.t+=dt;
  G.texts.forEach(x=>x.t+=dt);G.texts=G.texts.filter(x=>x.t<x.dur);G.fx.forEach(f=>f.t+=dt);G.fx=G.fx.filter(f=>f.t<(f.dur||.5));
  if(G.bubble){G.bubble.t+=dt;if(G.bubble.t>G.bubble.dur)G.bubble=null;}if(G.hbubble){G.hbubble.t+=dt;if(G.hbubble.t>G.hbubble.dur)G.hbubble=null;}
  G.shake=Math.max(0,G.shake-dt*30);G.heroFlash=Math.max(0,G.heroFlash-dt*3);
  if(G.mode==="play"&&!G.paused){if(G.sub==="play"){G.playT+=dt;G.inv=Math.max(0,G.inv-dt);G.mod.update(dt,readInput());}else if(G.mod.idle)G.mod.idle(dt);}
  else if(G.mode==="title"&&G.mod.idle)G.mod.idle(dt);}
