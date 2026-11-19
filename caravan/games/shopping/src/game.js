/* ================= BOLT'S BIG RUN v2 — engine + game ================= */
const $=s=>document.querySelector(s);const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const T=16,VH=240;const SOLID=new Set(["#","=","B","?","!","Q","H","T","t","p","U","D","N","Y","Z","z","O","~","$","^"]);
const CFG=(()=>{const o={api:(window.CARAVAN_API||"https://ge2-caravan-api.ge2-caravan.workers.dev/"),s:"",name:""};try{location.hash.replace(/^#/,"").split("&").forEach(kv=>{const i=kv.indexOf("=");if(i>0){const k=kv.slice(0,i),v=decodeURIComponent(kv.slice(i+1));if(k in o)o[k]=v;}});}catch(_){}return o;})();
/* ---------- save ---------- */
let SAVE={unlocked:1,best:{},name:CFG.name||"",sound:true,coinsTotal:0,qRight:0,qTotal:0,results:[],hero:"",basket:[],storySeen:false};
try{const j=localStorage.getItem("bolt_run_v4");if(j)SAVE=Object.assign(SAVE,JSON.parse(j));}catch(_){}
function save(){try{localStorage.setItem("bolt_run_v4",JSON.stringify(SAVE));}catch(_){}}
/* ---------- questions: your bank first, built-in fallback ---------- */
let QUESTIONS=[];
function normQ(x){if(!x)return null;const o=x.o||x.opts||x.options||[];if(!x.q||o.length<2)return null;let a=typeof x.a==="number"?x.a:o.findIndex(v=>String(v).trim().toLowerCase()===String(x.a||"").trim().toLowerCase());if(a<0)a=0;return{q:String(x.q),o:o.slice(0,4).map(String),a,hint:x.hint||x.h||"",w:x.w||x.why||x.explanation||"",s:x.s||x.skill||"custom"};}
function loadQuestions(){const ext=Array.isArray(window.BOLT_QUESTIONS)?window.BOLT_QUESTIONS.map(normQ).filter(Boolean):[];QUESTIONS=ext.length>=5?ext:QUESTIONS_BUILTIN.map(normQ);
 // Caravan exam (bank / "mine" / Claude) only when the Caravan page passed an x= setup in the hash — the built-in grammar bank never costs an exam.
 if(window.Caravan&&Caravan.student()&&/[#&]x=/.test(location.hash)){G.qSource="caravan…";Caravan.questions({skills:["r_abc"],n:15,topic:"shopping at the souq in Salalah"}).then(ex=>{const qs=(ex&&ex.questions||[]).filter(q=>q.type==="abc"&&q.o&&q.o.length>=2).map(q=>normQ({q:q.q,o:q.o,a:q.a,w:q.why||"",s:q.skill||"r_abc"})).filter(Boolean);if(qs.length>=3){QUESTIONS=qs.concat(QUESTIONS_BUILTIN.map(normQ)).slice(0,Math.max(12,qs.length));usedQ=[];G.qSource="caravan:"+qs.length;}else G.qSource="builtin";}).catch(()=>{G.qSource="builtin";});}else G.qSource=ext.length>=5?"teacher":"builtin";}
/* ---------- sound ---------- */
let AC=null;function snd(type){if(!SAVE.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
 const seq={jump:[[300,0],[600,0.08]],coin:[[988,0],[1319,0.06]],stomp:[[200,0],[120,0.06]],hurt:[[300,0],[150,0.12]],power:[[400,0],[600,0.06],[800,0.12],[1000,0.18]],block:[[180,0],[90,0.04]],die:[[440,0],[880,0.06],[660,0.18],[587,0.3],[523,0.42],[440,0.54],[392,0.66],[330,0.8],[262,0.95],[196,1.15]],clear:[[523,0],[659,0.1],[784,0.2],[1047,0.3],[1319,0.45]],throw:[[700,0],[400,0.05]],oneup:[[659,0],[784,0.08],[1319,0.16],[1047,0.24],[1175,0.32],[1568,0.4]],wrong:[[220,0],[180,0.15]],right:[[784,0],[1047,0.1]],flag:[[392,0],[523,0.1],[659,0.2],[784,0.3]],spring:[[200,0],[900,0.1]],pipe:[[400,0],[300,0.1],[200,0.2]],cannon:[[120,0],[60,0.1]],boss:[[150,0],[100,0.1],[70,0.25]],bosshit:[[300,0],[500,0.05],[200,0.15]],grow:[[300,0],[400,0.05],[500,0.1],[600,0.15],[700,0.2],[800,0.25]],skid:[[140,0],[110,0.05]],hurry:[[880,0],[660,0.08],[880,0.16],[660,0.24],[880,0.32],[660,0.4]]}[type]||[[440,0]];
 o.type=type==="jump"||type==="coin"?"square":type==="cannon"?"sawtooth":"triangle";seq.forEach(([f,dt])=>o.frequency.setValueAtTime(f,t+dt));const end=t+(seq[seq.length-1][1]||0)+(type==="die"?0.5:0.12);g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.001,end);o.start(t);o.stop(end);}catch(_){}}
/* ---------- canvas ---------- */
const cv=$("#gl"),ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;let VW=320,SCALE=1;
function resize(){const W=innerWidth,H=innerHeight;let sc=Math.min(H/VH,W/256);let vw=Math.round(W/sc);if(vw<256)vw=256;if(vw>560)vw=560;VW=vw;SCALE=sc;cv.width=VW;cv.height=VH;cv.style.width=Math.round(VW*sc)+"px";cv.style.height=Math.round(VH*sc)+"px";ctx.imageSmoothingEnabled=false;}
addEventListener("resize",resize);resize();
/* ---------- input ---------- */
const IN={l:false,r:false,d:false,jump:false,run:false,jumpP:false,runP:false,dP:false};
addEventListener("keydown",e=>{if(e.repeat)return;const k=e.key.toLowerCase();if(k==="arrowleft"||k==="a")IN.l=true;if(k==="arrowright"||k==="d")IN.r=true;if(k==="arrowdown"||k==="s"){IN.d=true;IN.dP=true;}if(k===" "||k==="z"||k==="k"||k==="arrowup"||k==="w"){IN.jump=true;IN.jumpP=true;}if(k==="x"||k==="shift"||k==="j"){IN.run=true;IN.runP=true;}if(k==="p"||k==="escape"){if(G.state==="play")pause();else if(G.state==="pause")unpause();}if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault();});
addEventListener("keyup",e=>{const k=e.key.toLowerCase();if(k==="arrowleft"||k==="a")IN.l=false;if(k==="arrowright"||k==="d")IN.r=false;if(k==="arrowdown"||k==="s")IN.d=false;if(k===" "||k==="z"||k==="k"||k==="arrowup"||k==="w")IN.jump=false;if(k==="x"||k==="shift"||k==="j")IN.run=false;});
const TOUCH="ontouchstart" in window;
if(TOUCH){const ids=["bl","br","ba","bb"];const prev={ba:false,bb:false};
 const apply=e=>{if(e.cancelable&&e.target&&e.target.closest&&e.target.closest("#ctl,#gl"))e.preventDefault();const st={bl:false,br:false,ba:false,bb:false};
  for(const t of e.touches){for(const id of ids){const r=document.getElementById(id).getBoundingClientRect();const pad=14;if(t.clientX>=r.left-pad&&t.clientX<=r.right+pad&&t.clientY>=r.top-pad&&t.clientY<=r.bottom+pad)st[id]=true;}}
  IN.l=st.bl;IN.r=st.br;if(st.ba&&!prev.ba)IN.jumpP=true;IN.jump=st.ba;if(st.bb&&!prev.bb)IN.runP=true;IN.run=st.bb;prev.ba=st.ba;prev.bb=st.bb;
  for(const id of ids)document.getElementById(id).classList.toggle("down",st[id]);};
 ["touchstart","touchmove","touchend","touchcancel"].forEach(ev=>document.addEventListener(ev,apply,{passive:false}));}
function hold(el,on,off){let act=0;const d=e=>{if(e.cancelable)e.preventDefault();act++;on();el.classList.add("down");};const u=e=>{if(e.cancelable)e.preventDefault();act=0;off();el.classList.remove("down");};
 if(TOUCH){}
 else{el.addEventListener("pointerdown",d);el.addEventListener("pointerup",u);el.addEventListener("pointercancel",u);el.addEventListener("pointerleave",u);}
 el.addEventListener("contextmenu",e=>e.preventDefault());}

hold($("#bl"),()=>IN.l=true,()=>IN.l=false);hold($("#br"),()=>IN.r=true,()=>IN.r=false);hold($("#ba"),()=>{IN.jump=true;IN.jumpP=true;},()=>IN.jump=false);hold($("#bb"),()=>{IN.run=true;IN.runP=true;},()=>IN.run=false);
$("#bpause").onclick=()=>{if(G.state==="play")pause();};$("#benter").onclick=()=>{IN.dP=true;};
/* ---------- game state ---------- */
const G={qSource:"",repMark:0,state:"title",level:0,lv:null,grid:null,gridW:0,room:null,score:0,coins:0,lives:3,time:300,cam:0,t:0,combo:0,player:null,ents:[],parts:[],pops:[],blocks:[],checkpoint:null,timer:0,flagSeq:null,world:null,shake:0,gateOpen:false,askingGate:false};
function newPlayer(x,y){return{x,y,w:12,h:20,skipped:0,star:0,mount:null,dbl:false,spin:0,glide:false,vx:0,vy:0,dir:1,ground:false,state:0,inv:0,coyote:0,jbuf:0,anim:0,dead:false,deadT:0,platform:null,throwT:0,sx:1,sy:1,prevBottom:0,wasGround:false,fallV:0};}
function tile(x,y){if(y<0)return".";if(y>=ROWS)return".";const row=G.grid[y];return x<0||x>=row.length?"=":row[x];}
function setTile(x,y,c){const row=G.grid[y];G.grid[y]=row.slice(0,x)+c+row.slice(x+1);}
function solidAt(x,y){return SOLID.has(tile(x,y));}
/* ---------- level start ---------- */
function spawnEnts(grid){const ents=[];for(let y=0;y<ROWS;y++)for(let x=0;x<grid[y].length;x++){const c=grid[y][x];const clear=()=>{grid[y]=grid[y].slice(0,x)+"."+grid[y].slice(x+1);};
 if(c==="E"){ents.push({k:"bug",x:x*T+1,y:y*T+4,w:14,h:12,vx:-0.45,vy:0,an:0,dead:0,hp:2});clear();}else if(c==="V"){ents.push({k:"virus",x:x*T+1,y:y*T+4,w:14,h:12,vx:-0.5,vy:0,an:0,dead:0});clear();}
 else if(c==="u"){ents.push({k:"turtle",x:x*T+1,y:y*T+4,w:14,h:12,vx:-0.4,vy:0,an:0,dead:0,shell:0});clear();}
 else if(c==="M"){ents.push({k:"plat",x:x*T-16,y:y*T,w:48,h:8,vx:0.8,x0:x*T-16-40,x1:x*T-16+40});clear();}
 else if(c==="W"){ents.push({k:"drone",x:x*T,y:y*T,w:14,h:10,bx:x*T,by:y*T,an:Math.random()*6,dead:0,vy:0});clear();}
 else if(c==="N"){ents.push({k:"cannon",x:x*T,y:y*T,w:16,h:16,t:60+Math.floor(Math.random()*60)});}}
 return ents;}
function startLevel(idx,keepCheckpoint){G.level=idx;G.lv=genLevel(idx);G.world=WORLDS[G.lv.world];G.grid=G.lv.grid;G.gridW=G.lv.width;G.room=null;G.ents=spawnEnts(G.grid);G.parts=[];G.pops=[];G.blocks=[];G.flagSeq=null;G.time=G.lv.castle?500:600;G.timer=0;G.combo=0;G.gateOpen=false;G.askingGate=false;G.shake=0;
 let sx=3*T,sy=12*T;for(let y=0;y<ROWS;y++){const x=G.grid[y].indexOf("S");if(x>=0){sx=x*T;sy=y*T-4;setTile(x,y,".");}}
 const st=keepCheckpoint&&G.checkpoint?G.checkpoint:{x:sx,y:sy};if(!keepCheckpoint)G.checkpoint=null;
 G.player=newPlayer(st.x,st.y);if(keepCheckpoint&&G.checkpoint)G.player.inv=90;G.cam=Math.max(0,st.x-VW*0.35);G.state="intro";G.t=0;G.qBlocks=[];for(let y=0;y<ROWS;y++)for(let x=0;x<G.grid[y].length;x++)if(G.grid[y][x]==="Q")G.qBlocks.push({tx:x,ty:y,done:false});for(const qb of G.qBlocks)if(qb.tx*T+56<G.player.x)qb.done=true;if(keepCheckpoint&&G.checkpoint){for(let y=0;y<ROWS;y++)for(let x=0;x<G.grid[y].length;x++)if(G.grid[y][x]==="K"&&x*T<=G.checkpoint.x)setTile(x,y,"k");}G.boss=null;for(let y=0;y<ROWS;y++){const x=G.grid[y].indexOf("X");if(x>=0){setTile(x,y,".");G.boss={k:"boss",type:G.lv.boss||"scorpion",x:x*T,y:y*T-8,w:30,h:22,vx:0,vy:0,hp:3,t:60,stun:0,flash:0,dead:0,an:0,by:y*T-60,fl:0};G.ents.push(G.boss);}}showIntro();}
function showIntro(){const el=$("#intro");el.innerHTML='<div class="box"><div class="wl">WORLD '+esc(G.lv.name)+(G.lv.castle?" · CASTLE":"")+'</div><div class="wn">'+esc(G.world.name)+'</div><div class="lives"><canvas id="ic" width="16" height="28"></canvas> × '+G.lives+'</div></div>';el.hidden=false;$("#ic").getContext("2d").drawImage(HERO[SAVE.hero||"man"][0].idle,0,0);setTimeout(()=>{el.hidden=true;if(G.state==="intro")G.state="play";},1400);}
/* ---------- helpers ---------- */
function pop(x,y,txt,col){G.pops.push({x,y,txt,t:0,col:col||"#fff"});}
function addScore(n,x,y){G.score+=n;if(x!=null)pop(x,y,String(n));}
function addCoin(x,y){G.coins++;SAVE.coinsTotal++;snd("coin");addScore(200);if(G.coins>=100){G.coins-=100;G.lives++;snd("oneup");pop(x,y,"1UP","#62b84c");}}
function spawnCoinPop(tx,ty){G.parts.push({k:"coin",x:tx*T+4,y:ty*T-12,vy:-5,t:0});addCoin(tx*T,ty*T);}
function bounceBlock(tx,ty){G.blocks.push({tx,ty,t:0});}
function burst(x,y,col,n){for(let i=0;i<(n||6);i++)G.parts.push({k:"dot",x,y,vx:(Math.random()-0.5)*3,vy:-2-Math.random()*2,t:0,col});}
function puff(x,y,n){for(let i=0;i<(n||3);i++)G.parts.push({k:"puff",x:x+(Math.random()-0.5)*8,y,vx:(Math.random()-0.5)*0.8,vy:-0.3-Math.random()*0.4,t:0,r:2+Math.random()*2});}
function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
/* ---------- physics (with one-way planks 'o') ---------- */
function moveEntity(e,oneWay){e.ground=false;const prevBottom=e.y+e.h;const stepX=e.vx;e.x+=stepX;
 let x0=Math.floor(e.x/T),x1=Math.floor((e.x+e.w-0.01)/T),y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-0.01)/T);
 for(let ty=y0;ty<=y1;ty++){if(stepX>0&&solidAt(x1,ty)){e.x=x1*T-e.w;e.vx=0;e.hitWall=1;}else if(stepX<0&&solidAt(x0,ty)){e.x=(x0+1)*T;e.vx=0;e.hitWall=-1;}}
 e.y+=e.vy;x0=Math.floor(e.x/T);x1=Math.floor((e.x+e.w-0.01)/T);y0=Math.floor(e.y/T);y1=Math.floor((e.y+e.h-0.01)/T);
 for(let tx=x0;tx<=x1;tx++){if(e.vy>0&&solidAt(tx,y1)){e.y=y1*T-e.h;e.vy=0;e.ground=true;}else if(e.vy<0&&(solidAt(tx,y0)||(e===G.player&&tile(tx,y0)==="I"))){e.y=(y0+1)*T;e.vy=0;e.headHit={tx,ty:y0};}
  else if(oneWay&&e.vy>0&&tile(tx,y1)==="o"&&prevBottom<=y1*T+1&&!e.dropping){e.y=y1*T-e.h;e.vy=0;e.ground=true;}}}
function updatePlayer(){const p=G.player;if(p.dead){p.deadT++;p.vy+=0.3;p.y+=p.vy;if(p.deadT>110)afterDeath();return;}
 if(G.flagSeq){flagUpdate();return;}
 const run=IN.run;const max=(run?2.3:1.5)*(p.mount?1.25:1);const acc=p.ground?0.14:0.1;
 const skid=p.ground&&((IN.l&&p.vx>1)||(IN.r&&p.vx<-1));if(skid){p.vx*=0.86;if(G.t%3===0)puff(p.x+6,p.y+p.h,1);if(!p.skidS){p.skidS=true;snd("skid");}}else p.skidS=false;
 if(IN.l){p.vx-=acc;p.dir=-1;}else if(IN.r){p.vx+=acc;p.dir=1;}else{p.vx*=p.ground?0.82:0.95;if(Math.abs(p.vx)<0.05)p.vx=0;}
 if(Math.abs(p.vx)>max)p.vx+=(Math.sign(p.vx)*max-p.vx)*0.1;
 if(p.ground)p.coyote=8;else if(p.coyote>0)p.coyote--;
 if(p.dropping>0)p.dropping--;if(IN.d&&IN.jumpP&&p.ground&&!p.platform&&tile(Math.floor((p.x+p.w/2)/T),Math.floor((p.y+p.h+1)/T))==="o"){IN.jumpP=false;p.dropping=10;p.ground=false;p.y+=2;p.vy=1;puff(p.x+6,p.y+p.h,2);}
 if(IN.jumpP){p.jbuf=12;IN.jumpP=false;}else if(p.jbuf>0)p.jbuf--;
 if(p.ground)p.dbl=true;if(p.jbuf>0&&p.coyote>0){p.vy=-5.9-Math.abs(p.vx)*0.25;p.jbuf=0;p.coyote=0;p.ground=false;p.platform=null;p.sx=0.8;p.sy=1.25;puff(p.x+6,p.y+p.h,2);snd("jump");}else if(p.jbuf>0&&p.mount&&p.dbl&&!p.ground){p.vy=-5.2;p.jbuf=0;p.dbl=false;snd("jump");puff(p.x+6,p.y+p.h,3);}
 p.vy+=(IN.jump&&p.vy<0)?0.22:(!p.ground&&Math.abs(p.vy)<1.2?0.27:0.38);if(p.vy>7)p.vy=7;p.glide=false;if(p.state===3&&IN.jump&&p.vy>0.8&&!p.ground){p.vy=0.7;p.glide=true;if(G.t%6===0)puff(p.x+6,p.y+p.h-4,1);}
 if(p.star>0){p.star--;if(p.star===0)pop(p.x,p.y-10,"KHANJAR FADES","#f7c948");}if(p.spin>0)p.spin--;
 if(!IN.jump&&p.vy<-2.5)p.vy=-2.5;
 if(p.platform){p.x+=p.platform.vx;}
 const wasGround=p.ground;const fallV=p.vy;
 p.headHit=null;moveEntity(p,true);
 p.platform=null;for(const e of G.ents){if(e.k!=="plat")continue;if(p.vy>=0&&p.x+p.w>e.x&&p.x<e.x+e.w&&p.y+p.h>=e.y-1&&p.y+p.h<=e.y+8){p.y=e.y-p.h;p.vy=0;p.ground=true;p.platform=e;}}
 if(p.ground&&!wasGround&&fallV>3){p.sx=1.25;p.sy=0.75;puff(p.x+6,p.y+p.h,4);if(fallV>6){G.shake=Math.max(G.shake,3);}}
 if(p.ground&&Math.abs(p.vx)>1.8&&G.t%7===0)puff(p.x+6-p.dir*6,p.y+p.h,1);
 p.sx+=(1-p.sx)*0.2;p.sy+=(1-p.sy)*0.2;
 if(p.headHit)hitBlock(p.headHit.tx,p.headHit.ty);
 // crates open on any touch (side or top)
 {const cx=Math.floor((p.x+(p.dir>0?p.w+1:-1))/T);for(let ty=Math.floor(p.y/T);ty<=Math.floor((p.y+p.h-1)/T);ty++){if(tile(cx,ty)==="O")openCrate(cx,ty);}const bx=Math.floor((p.x+p.w/2)/T),by=Math.floor((p.y+p.h+1)/T);if(tile(bx,by)==="O")openCrate(bx,by);}
 if(p.throwT>0)p.throwT--;if(IN.runP&&p.state===3&&p.spin===0){IN.runP=false;p.spin=22;snd("throw");for(const e of G.ents){if(["bug","virus","turtle","drone"].includes(e.k)&&!e.dead&&Math.abs(e.x+7-(p.x+6))<26&&Math.abs(e.y+6-(p.y+p.h/2))<22){e.dead=1;e.flip=true;e.vy=-4;addScore(200,e.x,e.y);burst(e.x+7,e.y+6,"#f7c948",5);}}}
 if(IN.runP){IN.runP=false;if(p.state===2&&G.ents.filter(e=>e.k==="screw").length<2){G.ents.push({k:"screw",x:p.x+(p.dir>0?p.w:-4),y:p.y+8,w:4,h:6,vx:p.dir*4,vy:-1,t:0});p.throwT=10;snd("throw");}}
 if(p.inv>0)p.inv--;
 if(p.x<G.cam)p.x=G.cam;if(p.x<0)p.x=0;
 if(p.y>VH+8)die();
 const x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-1)/T),y0=Math.floor(p.y/T),y1=Math.floor((p.y+p.h-1)/T);
 for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const c=tile(tx,ty);if(c==="C"){setTile(tx,ty,".");addCoin(tx*T,ty*T);G.parts.push({k:"spark",x:tx*T+8,y:ty*T+8,t:0});}else if(c==="S"&&p.y+p.h>ty*T+8){hurt(true);}else if(c==="L"||c==="A"){die();}else if(c==="K"){setTile(tx,ty,"k");checkpointQuestion(tx,ty);}else if(c==="G"&&G.lv.castle&&G.gateOpen&&!G.room){levelClear();}
  else if(c==="O"&&false){}else if(c==="J"&&p.vy>=0&&p.y+p.h>ty*T+6){p.vy=IN.jump?-10.5:-9.2;p.ground=false;p.sx=0.7;p.sy=1.4;snd("spring");G.springT=12;G.springAt=tx+","+ty;}}
 for(let tx=x0;tx<=x1;tx++){if(tile(tx,12)==="F"&&!G.flagSeq&&!G.room){startFlag(tx);}}
 if(G.lv.castle&&!G.gateOpen&&!G.askingGate&&!G.room&&!G.boss){const gx=Math.floor((p.x+p.w+1)/T);for(let ty=y0;ty<=y1;ty++)if(tile(gx,ty)==="D"){gateQuestions();break;}}
 // A? blocks cannot be skipped: 3 skips = lose a life
 if(!G.room){for(const qb of G.qBlocks){if(qb.done)continue;if(tile(qb.tx,qb.ty)!=="Q"){qb.done=true;continue;}if(p.x>qb.tx*T+56){qb.done=true;p.skipped++;if(p.skipped>=3){pop(p.x,p.y-12,"3 QUESTIONS SKIPPED!","#d93a2b");p.skipped=0;die();}else{pop(p.x,p.y-12,"SKIPPED A? "+p.skipped+"/3 — GO BACK!","#ff9a3e");snd("wrong");G.shake=3;}}}}
 // pipes: enter / exit
 const under=tile(Math.floor((p.x+p.w/2)/T),Math.floor((p.y+p.h+1)/T));const underL=tile(Math.floor((p.x+p.w/2)/T)-1,Math.floor((p.y+p.h+1)/T));
 const onEnter=p.ground&&!G.room&&(under==="Y"||(under==="t"&&underL==="Y"));const onExit=p.ground&&G.room&&(under==="Z"||under==="z");
 $("#benter").hidden=!(onEnter||onExit);
 if((onEnter||onExit)&&IN.dP){IN.dP=false;if(onEnter)enterRoom(Math.floor((p.x+p.w/2)/T));else exitRoom();}else IN.dP=false;
 if(!p.ground)p.animK="jump";else if(Math.abs(p.vx)>0.2){p.anim+=Math.abs(p.vx)*0.12;p.animK=Math.floor(p.anim)%2?"walk1":"walk2";}else p.animK="idle";if(p.throwT>0)p.animK="throw";}
async function enterRoom(tx){const rm=G.lv.rooms.find(r=>tx===r.px||tx===r.px+1);if(!rm)return;const ok=await askOne(nextQ(),"🔒 The pipe is locked — answer to open it");G.state="play";if(!ok){pop(G.player.x,G.player.y-12,"LOCKED. TRY AGAIN.","#d93a2b");return;}snd("pipe");G.room={rm,back:{x:(rm.px+2)*T,y:12*T-20}};G.levelEnts=G.ents;G.grid=rm.room.grid;G.gridW=rm.room.width;G.ents=[];let sx=2*T;for(let y=0;y<ROWS;y++){const x=G.grid[y].indexOf("R");if(x>=0){sx=x*T;setTile(x,y,".");}}G.player.x=sx;G.player.y=12*T-20;G.player.vy=0;G.cam=0;pop(sx,10*T,"BONUS ROOM!","#f7c948");}
function exitRoom(){snd("pipe");const back=G.room.back;G.grid=G.lv.grid;G.gridW=G.lv.width;G.ents=G.levelEnts;G.room=null;G.player.x=back.x;G.player.y=back.y;G.player.vy=0;G.cam=Math.max(0,back.x-VW*0.4);}
async function bossStrike(e){const p=G.player;const ok=await askOne(nextQ(),(e.type==="scorpion"?"🦂 Scorpion King":"🌪️ Sandstorm Djinn")+" — answer to strike! ("+e.hp+" hits left)");G.state="play";e.asking=false;
 if(ok){e.hp--;e.flash=30;e.stun=0;e.vy=-4;e.vx=(p.x<e.x?1:-1)*2;snd("bosshit");G.shake=6;burst(e.x+15,e.y+10,"#f7c948",10);addScore(1000,e.x,e.y-10);
  if(e.hp<=0){e.dead=1;e.vy=-7;addScore(5000,e.x,e.y-20);snd("clear");G.boss=null;G.gateOpen=true;for(let y=0;y<ROWS;y++)for(let x=0;x<G.grid[y].length;x++)if(G.grid[y][x]==="D"){setTile(x,y,".");burst(x*T+8,y*T+8,"#f7c948",4);}pop(p.x,p.y-24,"THE GATE IS OPEN!","#62b84c");}}
 else{pop(e.x,e.y-14,"NO DAMAGE","#d93a2b");e.stun=0;}}
async function checkpointQuestion(tx,ty){const p=G.player;p.vx=0;let tries=0,ok=false;while(!ok&&tries<3){ok=await askOne(nextQ(),"🚩 Checkpoint question"+(tries?" · try "+(tries+1):""));tries++;}G.state="play";G.checkpoint={x:tx*T,y:ty*T-4};pop(tx*T,ty*T-8,ok?"CHECKPOINT!":"CHECKPOINT (keep practising)","#62b84c");if(ok){addScore(300,tx*T,ty*T-20);}snd("right");p.skipped=0;}
function openCrate(tx,ty){setTile(tx,ty,".");snd("power");burst(tx*T+8,ty*T+8,"#d79a55",8);G.ents.push({k:"camel",x:tx*T-2,y:ty*T-4,w:20,h:20,vx:0,vy:-3,an:0});pop(tx*T,ty*T-14,"A CAMEL!","#f7c948");}
function hitBlock(tx,ty){const c=tile(tx,ty);const p=G.player;if(c==="O"){openCrate(tx,ty);return;}
 if(c==="I"){setTile(tx,ty,"U");bounceBlock(tx,ty);snd("power");G.ents.push({k:"life",x:tx*T,y:ty*T-16,w:16,h:14,vx:0.8,vy:0,rise:16});pop(tx*T-8,ty*T-20,"SECRET!","#62b84c");return;}
 if(c==="~"){setTile(tx,ty,"U");bounceBlock(tx,ty);snd("power");G.ents.push({k:"tool",x:tx*T,y:ty*T-16,w:16,h:14,vx:0.8,vy:0,rise:16});}
 else if(c==="$"){setTile(tx,ty,"U");bounceBlock(tx,ty);snd("power");G.ents.push({k:"khanjar",x:tx*T,y:ty*T-16,w:16,h:14,vx:1.2,vy:0,rise:16});}
 else if(c==="^"){setTile(tx,ty,"U");bounceBlock(tx,ty);snd("power");G.ents.push({k:"cape",x:tx*T,y:ty*T-16,w:16,h:14,vx:0.6,vy:0,rise:16,float:true});}
 if(c==="?"){setTile(tx,ty,"U");bounceBlock(tx,ty);spawnCoinPop(tx,ty);snd("block");}
 else if(c==="!"){setTile(tx,ty,"U");bounceBlock(tx,ty);snd("power");G.ents.push({k:p.state===0?"chip":"tool",x:tx*T,y:ty*T-16,w:16,h:14,vx:0.8,vy:0,rise:16});}
 else if(c==="Q"){setTile(tx,ty,"U");bounceBlock(tx,ty);snd("block");const qb=G.qBlocks.find(q=>q.tx===tx&&q.ty===ty);if(qb)qb.done=true;askBlock(tx,ty);}
 else if(c==="B"){if(p.state>0){setTile(tx,ty,".");addScore(50);snd("stomp");G.shake=Math.max(G.shake,2);for(let i=0;i<4;i++)G.parts.push({k:"brick",x:tx*T+4+(i%2)*8,y:ty*T+(i<2?0:8),vx:(i%2?1:-1)*(1+Math.random()),vy:-4-Math.random()*2,t:0});}else{bounceBlock(tx,ty);snd("block");}}
 else if(SOLID.has(c)){snd("block");}
 if(c==="?"||c==="!"||c==="Q"||c==="B"){for(const e of G.ents){if((e.k==="bug"||e.k==="virus")&&!e.dead&&Math.floor((e.y+e.h)/T)===ty&&Math.floor((e.x+e.w/2)/T)===tx){e.dead=1;e.vy=-4;e.flip=true;addScore(100,e.x,e.y);}}}}
function setState(st){const p=G.player;const was=p.h;p.state=st;p.h=st>0?28:20;p.y+=was-p.h;}
function dismount(){const p=G.player;if(!p.mount)return;G.ents.push({k:"camelrun",x:p.x-4,y:p.y+p.h-20,w:20,h:20,vx:p.dir*-2.2,vy:-3,t:0});p.mount=null;p.inv=60;snd("hurt");pop(p.x,p.y-10,"CAMEL RAN AWAY!","#ff9a3e");}
function hurt(){const p=G.player;if(p.inv>0||p.dead||p.star>0)return;if(p.mount){dismount();return;}if(p.state>0){setState(p.state===3?1:0);p.inv=90;snd("hurt");G.shake=4;pop(p.x,p.y-8,"OUCH","#d93a2b");}else die();}
function die(){const p=G.player;if(p.dead)return;for(const e of G.ents)if(e.held){e.held=false;e.vx=0;}p.dead=true;p.deadT=0;p.vy=-6;p.vx=0;G.shake=6;snd("die");$("#benter").hidden=true;}
function afterDeath(){G.lives--;if(G.lives<=0){gameOver();return;}startLevel(G.level,true);}
function gameOver(){G.state="over";bridgeResult(false);save();const el=$("#over");el.innerHTML='<div class="box"><div class="wl">GAME OVER</div><div class="wn">Score '+G.score+'</div><div class="row"><button class="btn" id="retry">Try again (World '+(G.lv.world+1)+'-1)</button><button class="btn ghost" id="tomap">Map</button></div></div>';el.hidden=false;el.querySelector("#retry").onclick=()=>{el.hidden=true;G.lives=3;G.score=0;G.coins=0;G.checkpoint=null;startLevel(G.lv.world*5,false);};el.querySelector("#tomap").onclick=()=>{el.hidden=true;worldMap();};}
/* ---------- flag + clear ---------- */
function startFlag(tx){if(G.flagSeq)return;const p=G.player;const h=Math.max(0,Math.min(1,(12*T-p.y)/(10*T)));const pts=[100,200,400,800,1000,2000,5000][Math.min(6,Math.floor(h*7))];addScore(pts,p.x,p.y);snd("flag");if(pts>=5000){pop(p.x-20,p.y-22,"TOP OF THE POLE!","#f7c948");burst(tx*T+8,p.y-10,"#fff",14);G.shake=3;}G.flagSeq={tx,phase:0,t:0,pts};p.vx=0;p.x=tx*T-p.w-2;p.dir=1;G.flagY=3*T;burst(tx*T+8,p.y,"#f7c948",8);}
function flagUpdate(){const f=G.flagSeq,p=G.player;f.t++;if(f.phase===0){p.animK="jump";if(p.y<12*T-p.h)p.y+=2;G.flagY=Math.min(11*T,G.flagY+2);if(p.y>=12*T-p.h&&G.flagY>=11*T){f.phase=1;p.x=f.tx*T+T;}}else if(f.phase===1){p.x+=1.2;p.animK=Math.floor(f.t/6)%2?"walk1":"walk2";p.dir=1;const gx=Math.floor((p.x+p.w)/T);if(tile(gx,12)==="G"||p.x>(f.tx+6)*T){f.phase=2;levelClear();}}}
function levelClear(){if(G.state==="clear")return;G.state="clear";snd("clear");$("#benter").hidden=true;const bonus=Math.floor(G.time)*50;const total=G.score+bonus;SAVE.best[G.level]=Math.max(SAVE.best[G.level]||0,total);SAVE.unlocked=Math.max(SAVE.unlocked,Math.min(LEVELS.length,G.level+2));if(G.lv.item&&!SAVE.basket.includes(G.lv.item))SAVE.basket.push(G.lv.item);save();bridgeResult();
 const el=$("#clear");el.innerHTML='<div class="box"><div class="wl">'+(G.lv.castle?"CASTLE CLEARED!":"COURSE CLEAR!")+'</div><div class="found">🧺 Found: '+(GROCERY[G.lv.item]||'')+' '+esc(G.lv.item||'')+'</div><div class="tally"><div>Score <b>'+G.score+'</b></div><div>Time bonus <b>'+G.time+' × 50 = '+bonus+'</b></div><div>Coins <b>'+G.coins+'</b></div><div class="tot">Total <b>'+total+'</b></div></div><div class="row">'+(G.level+1<LEVELS.length?'<button class="btn" id="next">Next level ▶</button>':'<button class="btn" id="next">You finished the game! 🏆</button>')+'<button class="btn ghost" id="tomap">Map</button></div></div>';el.hidden=false;G.score=total;
 el.querySelector("#next").onclick=async()=>{el.hidden=true;if(G.level===4)await story(STORY.midway);if(G.level===9){await story(STORY.ending);worldMap();return;}if(G.level+1<LEVELS.length){G.checkpoint=null;if(G.level+1===4||G.level+1===9)await story(G.level+1===4?STORY.castle1:STORY.castle2);startLevel(G.level+1,false);}else worldMap();};el.querySelector("#tomap").onclick=()=>{el.hidden=true;worldMap();};}
/* ---------- questions ---------- */
let usedQ=[];function nextQ(){if(usedQ.length>=QUESTIONS.length)usedQ=[];let i;do{i=Math.floor(Math.random()*QUESTIONS.length);}while(usedQ.includes(i));usedQ.push(i);return QUESTIONS[i];}
function askOne(q,title){return new Promise(res=>{G.state="ask";const el=$("#ask");el.innerHTML='<div class="qbox"><div class="qt">'+esc(title)+'</div><div class="qq">'+esc(q.q)+'</div><div class="qo">'+q.o.map((o,i)=>'<button class="qbtn" data-i="'+i+'"><b>'+"ABCD"[i]+'</b>'+esc(o)+'</button>').join("")+'</div><div class="qrow">'+(q.hint?'<button class="hintbtn" id="hint">💡 Hint</button><span class="hinttxt" id="hinttxt" hidden>'+esc(q.hint)+'</span>':'')+'</div><div class="qw" id="qw"></div></div>';el.hidden=false;
 if(q.hint)$("#hint").onclick=()=>{$("#hinttxt").hidden=false;$("#hint").disabled=true;};
 el.querySelectorAll(".qbtn").forEach(b=>b.onclick=()=>{const ok=+b.dataset.i===q.a;SAVE.qTotal++;if(ok)SAVE.qRight++;SAVE.results.push({skill:q.s,ok,q:q.q.slice(0,80),t:Date.now()});if(SAVE.results.length>200)SAVE.results=SAVE.results.slice(-200);save();el.querySelectorAll(".qbtn").forEach(x=>{x.disabled=true;if(+x.dataset.i===q.a)x.classList.add("ok");else if(x===b)x.classList.add("no");});$("#qw").innerHTML=(ok?'<span class="good">✔ Correct!</span> ':'<span class="bad">✘ Not quite.</span> ')+esc(q.w||"");snd(ok?"right":"wrong");setTimeout(()=>{el.hidden=true;afterQuestion();res(ok);},ok?900:1800);});});}
function comboScore(e){G.combo++;if(G.combo>=7){G.lives++;snd("oneup");pop(e.x,e.y-14,"1UP!","#62b84c");G.combo=0;}else{addScore([100,200,400,800,1000,2000][Math.min(5,G.combo-1)],e.x,e.y-6);if(G.combo>=3)pop(e.x,e.y-16,"COMBO x"+G.combo,"#f7c948");}}
function chainScore(e,o){e.chain=(e.chain||0)+1;if(e.chain>=6){G.lives++;snd("oneup");pop(o.x,o.y-14,"1UP!","#62b84c");e.chain=0;}else{addScore([200,400,800,1000,2000][Math.min(4,e.chain-1)],o.x,o.y);if(e.chain>=2)pop(o.x,o.y-16,"CHAIN x"+e.chain,"#f7c948");}}
function afterQuestion(){const p=G.player;if(!p||p.dead)return;p.inv=Math.max(p.inv,110);for(const e of G.ents){if(!(e.k==="bug"||e.k==="virus"||e.k==="turtle"||e.k==="drone")||e.dead)continue;const dx=e.x-p.x;if(Math.abs(dx)<110&&Math.abs(e.y-p.y)<70){const d=dx>=0?1:-1;e.x+=d*40;e.vx=d*Math.abs(e.vx||0.45);e.calm=90;}}}
async function askBlock(tx,ty){const p=G.player;const ok=await askOne(nextQ(),"A? block");G.state="play";if(ok){addScore(500,tx*T,ty*T-16);for(let i=0;i<5;i++)setTimeout(()=>{if(G.state==="play"){G.parts.push({k:"coin",x:tx*T+4,y:ty*T-12,vy:-5-i*0.4,t:0,vx:(i-2)*0.6});addCoin(tx*T,ty*T);}},i*80);if(p.state<2){G.ents.push({k:p.state===0?"chip":"tool",x:tx*T,y:ty*T-16,w:16,h:14,vx:0.8,vy:0,rise:16});snd("power");}}}
async function gateQuestions(){if(G.askingGate||G.gateOpen)return;G.askingGate=true;const p=G.player;p.vx=0;let right=0;for(let i=0;i<3;i++){const ok=await askOne(nextQ(),"Castle gate · question "+(i+1)+" of 3 — you need 2");if(ok)right++;}G.state="play";
 if(right>=2){G.gateOpen=true;for(let y=0;y<ROWS;y++)for(let x=0;x<G.grid[y].length;x++)if(G.grid[y][x]==="D"){setTile(x,y,".");burst(x*T+8,y*T+8,"#f7c948",4);}addScore(1000,p.x,p.y-10);G.shake=4;snd("power");}
 else{pop(p.x,p.y-10,"THE GATE STAYS SHUT","#d93a2b");p.x-=24;setTimeout(()=>{G.askingGate=false;},1500);return;}
 G.askingGate=false;}
/* ---------- entities ---------- */
function updateEnts(){const p=G.player;for(const e of G.ents){
 if(e.k==="plat"){e.x+=e.vx;if(e.x<e.x0||e.x>e.x1)e.vx=-e.vx;continue;}
 if(e.k==="boss"){e.an++;if(e.flash>0)e.flash--;if(e.dead){e.vy+=0.3;e.y+=e.vy;e.x+=e.vx;if(e.y>VH+40){e.gone=true;}continue;}
  if(e.x>G.cam+VW+40||e.asking)continue;
  if(e.type==="djinn"){e.fl++;if(e.stun>0){e.stun--;}else{const dir=p.x<e.x?-1:1;e.x+=dir*0.6*(1+(3-e.hp)*0.3);e.y=e.by+Math.sin(e.fl/30)*18;e.t--;if(e.t<=0){e.t=110-(3-e.hp)*20;G.ents.push({k:"sand",x:e.x+12,y:e.y+20,w:5,h:5,vx:dir*1.4,vy:-1.5,t:0});snd("cannon");if(Math.random()<0.5){e.stun=120;e.vy=0;snd("boss");pop(e.x,e.y-12,"IT SOLIDIFIED — STOMP!","#f7c948");}}}
   if(e.stun>0){e.vy+=0.3;e.y+=e.vy;const fy=Math.floor((e.y+e.h)/T);if(solidAt(Math.floor((e.x+15)/T),fy)){e.y=fy*T-e.h;e.vy=0;}}
   if(!p.dead&&p.inv===0&&rect(p,e)){if(e.stun>0&&p.vy>0&&p.y+p.h-e.y<12){p.vy=-6;e.asking=true;bossStrike(e);}else if(p.star>0){e.asking=true;bossStrike(e);}else hurt();}continue;}
  if(e.stun>0){e.stun--;}else{e.t--;if(e.t<=0){const dir=p.x<e.x?-1:1;e.vx=dir*(1.3+(3-e.hp)*0.4);e.vy=-(4.5+(3-e.hp)*0.4);e.t=70-(3-e.hp)*12;snd("boss");e.dir=dir;}}
  e.vy+=0.3;if(e.vy>7)e.vy=7;const wasAir=!e.ground;e.hitWall=0;moveEntity(e,false);if(e.hitWall)e.vx=-e.vx;if(e.ground){if(wasAir){G.shake=Math.max(G.shake,3);}e.vx*=0.92;}
  if(!p.dead&&p.inv===0&&rect(p,e)){if(p.vy>0&&p.y+p.h-e.y<12){p.vy=-6;e.asking=true;bossStrike(e);}else if(p.star>0){e.asking=true;bossStrike(e);}else hurt();}
  continue;}
 if(e.k==="cannon"){if(Math.abs(e.x-p.x)<240&&e.x<G.cam+VW+20&&e.x>G.cam-20){e.t--;if(e.t<=0){e.t=170-Math.min(80,LEVELS[G.level].diff*15);const dir=p.x<e.x?-1:1;G.ents.push({k:"shot",x:e.x+(dir>0?16:-10),y:e.y+3,w:10,h:10,vx:dir*1.2,t:0,dir});snd("cannon");burst(e.x+(dir>0?16:0),e.y+8,"#aaa",4);}}continue;}
 if(e.k==="shot"){e.t++;e.x+=e.vx;if(e.t%5===0)puff(e.x+5-e.vx*4,e.y+5,1);if(e.t>300||e.x<G.cam-40||e.x>G.cam+VW+40||solidAt(Math.floor((e.x+5)/T),Math.floor((e.y+5)/T)))e.gone=true;
  if(!p.dead&&p.inv===0&&rect(p,e)){if(p.vy>0&&p.y+p.h-e.y<10){e.gone=true;p.vy=-4;addScore(200,e.x,e.y-6);snd("stomp");burst(e.x+5,e.y+5,"#333",6);}else hurt();}continue;}
 if(e.k==="screw"){e.t++;e.vy+=0.3;e.x+=e.vx;e.y+=e.vy;const tx=Math.floor((e.x+(e.vx>0?e.w:0))/T),ty=Math.floor((e.y+e.h)/T);if(solidAt(Math.floor((e.x+2)/T),ty)&&e.vy>0){e.y=ty*T-e.h;e.vy=-3.2;}if(solidAt(tx,Math.floor((e.y+3)/T))||e.t>120||e.x<G.cam-20||e.x>G.cam+VW+20||e.y>VH)e.gone=true;
  for(const o of G.ents){if((o.k==="bug"||o.k==="virus"||o.k==="drone")&&!o.dead&&rect(e,o)){o.dead=1;o.vy=-4;o.flip=true;e.gone=true;addScore(200,o.x,o.y);snd("stomp");burst(o.x+7,o.y+6,"#a056d6",5);}}continue;}
 if(e.k==="chip"||e.k==="tool"||e.k==="khanjar"||e.k==="cape"||e.k==="life"){if(e.rise>0){e.rise--;e.y-=1;continue;}e.vy+=e.float?0.08:0.3;if(e.float&&e.vy>0.8)e.vy=0.8;e.hitWall=0;moveEntity(e,true);if(e.hitWall)e.vx=-e.vx||(e.hitWall>0?-0.8:0.8);if(e.k==="khanjar"&&e.ground){e.vy=-3.2;}if(e.y>VH)e.gone=true;
  if(!p.dead&&rect(e,p)){e.gone=true;snd("power");addScore(1000,e.x,e.y);if(e.k==="chip"){if(p.state<1)setState(1);snd("grow");pop(p.x,p.y-10,"SUPER DATE!","#f7c948");}else if(e.k==="tool"){setState(2);pop(p.x,p.y-10,"FRANKINCENSE FIRE!","#ff9a3e");}else if(e.k==="cape"){setState(3);pop(p.x,p.y-10,"FALCON CAPE! HOLD JUMP TO GLIDE","#d79a55");}else if(e.k==="khanjar"){p.star=600;snd("grow");pop(p.x,p.y-10,"GOLDEN KHANJAR!","#f7c948");}else if(e.k==="life"){G.lives++;snd("oneup");pop(p.x,p.y-10,"1UP!","#62b84c");}p.sx=1.3;p.sy=1.3;p.inv=20;}continue;}
 if(e.k==="camel"){e.an++;e.vy+=0.3;e.hitWall=0;moveEntity(e,true);if(e.y>VH)e.gone=true;if(!p.dead&&!p.mount&&rect(e,p)){e.gone=true;p.mount=true;p.dbl=true;snd("grow");pop(p.x,p.y-14,"RIDING! DOUBLE JUMP","#f7c948");}continue;}
 if(e.k==="camelrun"){e.t++;e.vy+=0.3;e.hitWall=0;moveEntity(e,true);if(e.hitWall)e.vx=-e.vx;if(e.t>90||e.y>VH)e.gone=true;continue;}
 if(e.k==="sand"){e.t++;e.x+=e.vx;e.vy+=0.12;e.y+=e.vy;if(e.t>160||solidAt(Math.floor((e.x+2)/T),Math.floor((e.y+2)/T)))e.gone=true;if(!p.dead&&p.inv===0&&p.star===0&&rect(p,e)){e.gone=true;hurt();}continue;}
 if(e.k==="drone"){e.an+=0.04;if(e.dead){e.vy+=0.3;e.y+=e.vy;if(e.y>VH)e.gone=true;continue;}if(e.x>G.cam+VW+60)continue;e.x=e.bx+Math.sin(e.an)*48;e.y=e.by+Math.sin(e.an*2.3)*10;
  if(!p.dead&&p.inv===0&&rect(p,e)){if(p.star>0||(p.mount&&p.vy<=0.5)){e.dead=1;e.flip=true;e.vy=-4;addScore(200,e.x,e.y-6);snd("stomp");}else if(p.vy>0&&p.y+p.h-e.y<9){e.dead=1;e.vy=-2;p.vy=IN.jump?-5.5:-3.5;G.combo++;comboScore(e);snd("stomp");burst(e.x+7,e.y+5,"#78909c",5);}else hurt();}continue;}
 if(e.k==="bug"||e.k==="virus"||e.k==="turtle"){e.an++;if(e.dead){if(e.flip){e.vy+=0.3;e.y+=e.vy;if(e.y>VH)e.gone=true;}else{e.dead++;if(e.dead>30)e.gone=true;}continue;}
  if(e.x>G.cam+VW+40)continue;
  if(e.shell>0){e.shell--;if(e.shell===0&&e.vx===0){e.vx=-0.4;}} // shell wakes up
  // patrol: turn at walls and edges; chase the player when close (shells excluded)
  const sliding=e.k==="turtle"&&e.shell>0;
  if(!sliding){const base=e.k==="bug"?(e.hp<2?0.8:0.45):e.k==="virus"?0.5:0.4;const dx=p.x-e.x;if(e.calm>0)e.calm--;const near=!e.calm&&Math.abs(dx)<150&&Math.abs(p.y-e.y)<60&&!p.dead;if(near&&!e.noticed){e.noticed=true;pop(e.x-4,e.y-14,"!","#fff");}else if(!near)e.noticed=false;const dir=near?Math.sign(dx)||1:Math.sign(e.vx)||-1;const sp=near?base*1.5:base;e.vx=dir*sp;
   if(e.ground){const ahead=Math.floor((e.x+(e.vx>0?e.w+1:-1))/T);const fy=Math.floor((e.y+e.h+1)/T);if(!solidAt(ahead,fy)&&tile(ahead,fy)!=="o"){e.vx=-e.vx;if(near&&Math.abs(dx)<40)e.vx=0;}}}
  e.vy+=0.3;if(e.vy>6)e.vy=6;e.hitWall=0;const pvx=e.vx;moveEntity(e,true);if(e.hitWall){e.vx=e.hitWall>0?-Math.abs(pvx):Math.abs(pvx);if(sliding&&Math.abs(e.vx)>1){snd("block");e.bounces=(e.bounces||0)+1;if(e.bounces>=2){e.vx=0;e.shell=480;pop(e.x,e.y-14,"STOPPED","#fff");}}}
  if(sliding&&Math.abs(e.vx)>1&&G.t%4===0)puff(e.x+7-Math.sign(e.vx)*8,e.y+10,1);
  if(e.y>VH)e.gone=true;
  // a sliding shell kills other mobs
  if(e.k==="turtle"&&e.shell>0&&Math.abs(e.vx)>1){for(const o of G.ents){if(o!==e&&(o.k==="bug"||o.k==="virus"||o.k==="turtle"||o.k==="drone")&&!o.dead&&rect(e,o)){o.dead=1;o.flip=true;o.vy=-4;chainScore(e,o);snd("stomp");}}}else if(e.k==="turtle"&&e.vx===0)e.chain=0;
  if(e.held){e.x=p.x+(p.dir>0?p.w-2:-e.w+2);e.y=p.y+p.h-e.h;e.vx=0;e.vy=0;e.shell=480;if(!IN.run){e.held=false;e.vx=p.dir*3;e.kickT=30;e.bounces=0;e.x+=p.dir*6;snd("throw");addScore(100,e.x,e.y-6);}
   for(const o of G.ents){if(o!==e&&(o.k==="bug"||o.k==="virus"||o.k==="turtle"||o.k==="drone")&&!o.dead&&rect(e,o)){o.dead=1;o.flip=true;o.vy=-4;addScore(200,o.x,o.y);snd("stomp");}}continue;}
  if(e.kickT>0)e.kickT--;
  if(e.k==="turtle"&&e.shell>0&&e.vx===0&&!e.held&&IN.run&&!p.dead&&Math.abs((e.x+e.w/2)-(p.x+p.w/2))<22&&Math.abs(e.y-p.y-p.h+e.h)<14){e.held=true;pop(e.x,e.y-12,"CARRYING — LET GO OF B TO THROW","#f7c948");continue;}
  if(!p.dead&&p.inv===0&&rect(p,e)&&!(e.kickT>0)){
   if(p.star>0||(p.mount&&e.k!=="virus"&&p.vy<=0.5&&Math.abs(e.y-p.y-p.h+12)<14)){e.dead=1;e.flip=true;e.vy=-4;addScore(200,e.x,e.y-6);snd("stomp");pop(e.x,e.y-14,p.mount&&p.star===0?"MUNCH!":"","#f7c948");}
   else if(e.k==="bug"&&p.vy>0&&p.y+p.h-e.y<10){e.hp--;p.vy=IN.jump?-5.5:-3.5;snd("stomp");p.sx=1.2;p.sy=0.8;if(e.hp<=0){e.dead=1;comboScore(e);}else{e.vx*=1.8;addScore(50,e.x,e.y-6);burst(e.x+7,e.y+4,"#d9b97a",4);}}
   else if(e.k==="turtle"&&p.vy>0&&p.y+p.h-e.y<10){p.vy=IN.jump?-5.5:-3.5;snd("stomp");if(e.shell>0&&Math.abs(e.vx)>1){e.vx=0;e.shell=480;}else{e.shell=480;e.vx=0;addScore(100,e.x,e.y-6);pop(e.x-16,e.y-14,"HOLD B = CARRY · TOUCH = KICK","#fff");}}
   else if(e.k==="turtle"&&e.shell>0&&e.vx===0){if(IN.run){e.held=true;pop(e.x,e.y-12,"HOLDING — RELEASE B TO THROW","#f7c948");}else{e.vx=(p.x+p.w/2<e.x+e.w/2?1:-1)*2.4;e.x+=e.vx*3;e.kickT=30;e.bounces=0;snd("throw");addScore(100,e.x,e.y-6);pop(e.x,e.y-14,"KICK!","#f7c948");}}
   else if(e.k==="virus"&&p.vy>0&&p.y+p.h-e.y<10&&p.state===1){hurt();}
   else hurt();}
 }}
 if(p.ground)G.combo=0;G.ents=G.ents.filter(e=>!e.gone);
 for(const q of G.parts){q.t++;if(q.k==="coin"){q.vy+=0.35;q.y+=q.vy;q.x+=q.vx||0;if(q.t>22)q.gone=true;}else if(q.k==="brick"||q.k==="dot"){q.vy+=0.3;q.x+=q.vx;q.y+=q.vy;if(q.t>40)q.gone=true;}else if(q.k==="spark"){if(q.t>10)q.gone=true;}else if(q.k==="puff"){q.x+=q.vx;q.y+=q.vy;q.r+=0.08;if(q.t>22)q.gone=true;}}G.parts=G.parts.filter(q=>!q.gone);
 for(const b of G.blocks)b.t++;G.blocks=G.blocks.filter(b=>b.t<12);for(const o of G.pops){o.t++;o.y-=0.6;}G.pops=G.pops.filter(o=>o.t<50);if(G.springT>0)G.springT--;if(G.shake>0)G.shake--;}
/* ---------- camera + loop ---------- */
function updateCam(){const p=G.player;const target=p.x-VW*0.4+(p.dir>0?30:-10);if(target>G.cam)G.cam+=(target-G.cam)*0.12;else if(target<G.cam-40)G.cam+=(target+40-G.cam)*0.1;G.cam=Math.max(0,Math.min(G.gridW*T-VW,G.cam));}
let acc=0,last=performance.now();
function frame(now){const dt=Math.min(100,now-last);last=now;acc+=dt;while(acc>=1000/60){acc-=1000/60;if(G.state==="play"){G.t++;updatePlayer();updateEnts();updateCam();if(!G.flagSeq&&!G.player.dead){G.timer++;if(G.timer>=60){G.timer=0;G.time--;if(G.time===60){snd("hurry");pop(G.player.x,G.player.y-18,"HURRY UP!","#ff5a2e");}if(G.time<=0){G.time=0;die();}}}}}
 if(G.lv)draw();requestAnimationFrame(frame);}
/* ---------- drawing ---------- */
function roundRect(g,x,y,w,h,r,fill){g.fillStyle=fill;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();}
function drawBackground(g,cam,w,lv){const castle=lv.castle||G.room&&lv.castle;const sky=castle?w.castleSky:w.sky;const grd=g.createLinearGradient(0,0,0,VH);grd.addColorStop(0,sky[0]);grd.addColorStop(1,sky[1]);g.fillStyle=grd;g.fillRect(0,0,VW,VH);
 if(castle||G.room){ // castle interior / bonus room: stone wall with chains and torches glow
  g.fillStyle=G.room&&!lv.castle?"#2b3a2a":"#231a2b";g.fillRect(0,0,VW,VH);for(let i=-1;i<VW/48+2;i++){const x=i*48-(cam*0.3)%48;g.fillStyle="rgba(0,0,0,0.25)";g.fillRect(x,0,20,VH);g.fillStyle="rgba(255,255,255,0.04)";g.fillRect(x+30,0,4,VH);}
  for(let i=-1;i<VW/96+2;i++){const x=i*96-(cam*0.5)%96+40;g.fillStyle="#3a3a44";for(let y=0;y<80;y+=6){g.fillRect(x,y,3,4);}}
  return;}
 const t=G.t;
 if(lv.world===0){ // khareef: hazy sky, cirrus, low sun, far blue ridge, sea of clouds, olive hills, mist
  const sunset=lv.num===4;const sunX=VW*0.74,sunY=sunset?VH-96:52;
  const sk=g.createLinearGradient(0,0,0,VH);if(sunset){sk.addColorStop(0,"#6f86b8");sk.addColorStop(0.55,"#d8c3a8");sk.addColorStop(1,"#f2c48a");}else{sk.addColorStop(0,"#5fa8e6");sk.addColorStop(0.6,"#bcd9ea");sk.addColorStop(1,"#e8eef0");}g.fillStyle=sk;g.fillRect(0,0,VW,VH);
  g.save();g.globalAlpha=0.55;g.fillStyle="#ffffff";for(let i=-1;i<VW/70+3;i++){const x=i*70-(cam*0.06+t*0.05)%70;const y=18+(i%4)*14;g.save();g.translate(x,y);g.rotate(-0.35);g.beginPath();g.ellipse(0,0,46,3+(i%3),0,0,Math.PI*2);g.fill();g.beginPath();g.ellipse(18,-9,30,2,0,0,Math.PI*2);g.fill();g.restore();}g.restore();
  {const gr=g.createRadialGradient(sunX,sunY,6,sunX,sunY,90);gr.addColorStop(0,sunset?"rgba(255,230,180,0.95)":"rgba(255,250,220,0.95)");gr.addColorStop(0.25,sunset?"rgba(255,200,120,0.45)":"rgba(255,245,200,0.35)");gr.addColorStop(1,"rgba(255,240,200,0)");g.fillStyle=gr;g.fillRect(sunX-90,sunY-90,180,180);g.fillStyle=sunset?"#ffe2b0":"#fff8d8";g.beginPath();g.arc(sunX,sunY,13,0,Math.PI*2);g.fill();}
  g.fillStyle=sunset?"rgba(120,110,150,0.55)":"rgba(90,130,160,0.5)";g.beginPath();g.moveTo(0,VH);for(let i=-1;i<VW/90+3;i++){const x=i*90-(cam*0.15)%90;g.lineTo(x,VH-96-((i*37)%34));g.lineTo(x+45,VH-122-((i*53)%26));}g.lineTo(VW,VH);g.fill();
  g.fillStyle="rgba(255,255,255,0.85)";for(let i=-1;i<VW/60+3;i++){const x=i*60-(cam*0.22)%60;g.beginPath();g.ellipse(x,VH-84+((i%3)*3),40,12,0,Math.PI,0);g.fill();}g.fillRect(0,VH-84,VW,30);
  g.fillStyle=sunset?"#7f8a48":"#8aa64f";for(let i=-1;i<VW/130+2;i++){const x=i*130-(cam*0.4)%130;g.beginPath();g.ellipse(x,VH-22,80,52,0,Math.PI,0);g.fill();}
  g.fillStyle=sunset?"#5d6a34":"#6f8f3f";for(let i=-1;i<VW/130+2;i++){const x=i*130-(cam*0.4)%130;g.beginPath();g.ellipse(x+30,VH-20,50,24,0,Math.PI,0);g.fill();for(let k=0;k<3;k++){g.beginPath();g.arc(x-30+k*25,VH-60-((i+k)%2)*6,4,0,Math.PI*2);g.fill();}}
  g.fillStyle=sunset?"#4a5c2e":"#4f7f35";for(let i=-1;i<VW/95+2;i++){const x=i*95-(cam*0.62)%95+30;g.beginPath();g.ellipse(x,VH-18,52,28,0,Math.PI,0);g.fill();g.drawImage(TREE,x-16,VH-18-48-14,32,48);}
  g.fillStyle="rgba(255,255,255,0.22)";g.fillRect(0,VH-40,VW,24);
 }else{ // desert night: stars, moon, dunes, palms
  g.fillStyle="#fff";for(let i=0;i<60;i++){const x=(i*97-cam*0.05)%VW,y=(i*53)%160;const tw=(Math.sin(t/20+i)+1)/2;g.globalAlpha=0.4+tw*0.6;g.fillRect(((x%VW)+VW)%VW,y,1,1);}g.globalAlpha=1;
  g.fillStyle="#f6ead0";g.beginPath();g.arc(VW-56,40,14,0,Math.PI*2);g.fill();g.fillStyle=w.sky[0];g.beginPath();g.arc(VW-50,36,12,0,Math.PI*2);g.fill();
  g.fillStyle=w.far;for(let i=-1;i<VW/140+2;i++){const x=i*140-(cam*0.2)%140;g.beginPath();g.ellipse(x,VH-30,90,55,0,Math.PI,0);g.fill();}
  g.fillStyle=w.mid;for(let i=-1;i<VW/110+2;i++){const x=i*110-(cam*0.4)%110+40;g.beginPath();g.ellipse(x,VH-22,70,34,0,Math.PI,0);g.fill();}
  g.fillStyle=w.near;for(let i=-1;i<VW/90+2;i++){const x=i*90-(cam*0.6)%90;g.beginPath();g.ellipse(x,VH-18,50,22,0,Math.PI,0);g.fill();if(i%2)g.drawImage(PALM,x-16,VH-18-52,32,48);}
 }}
function draw(){const g=ctx;const w=G.world,lv=G.lv;const castle=lv.castle;g.imageSmoothingEnabled=false;g.setTransform(1,0,0,1,0,0);
 const shakeX=G.shake>0?Math.round((Math.random()-0.5)*G.shake*2):0,shakeY=G.shake>0?Math.round((Math.random()-0.5)*G.shake):0;
 drawBackground(g,G.cam,w,lv);g.translate(shakeX,shakeY);
 const cam=Math.round(G.cam);const x0=Math.floor(cam/T)-1,x1=Math.floor((cam+VW)/T)+1;const gk=castle?"stone":w.ground;
 // decorations behind
 if(!G.room)for(const d of lv.deco){const sx=d.x*T-cam;if(sx<-48||sx>VW+48)continue;const sy=d.y*T;switch(d.t){case"bush":g.drawImage(BUSH,sx-8,sy);break;case"tree":g.drawImage(TREE,sx-8,sy);break;case"palm":g.drawImage(PALM,sx-8,sy);break;case"flower":g.drawImage(FLOWER[d.v||0],sx+4,sy+8);break;case"rock":g.drawImage(ROCK,sx,sy+8);break;case"fence":g.drawImage(FENCE,sx,sy);break;case"sign":g.drawImage(SIGN,sx,sy);break;case"camel":g.drawImage(CAMELSIL,sx-8,sy+12);break;case"torch":g.drawImage(TORCH[Math.floor(G.t/6+d.x)%2],sx,sy);{const gr=g.createRadialGradient(sx+8,sy+4,2,sx+8,sy+4,40);gr.addColorStop(0,"rgba(255,170,60,0.25)");gr.addColorStop(1,"rgba(255,170,60,0)");g.fillStyle=gr;g.fillRect(sx-32,sy-36,80,80);}break;case"skull":g.drawImage(SKULL,sx,sy);break;}}
 // tiles
 for(let ty=0;ty<ROWS;ty++)for(let tx=x0;tx<=x1;tx++){const c=tile(tx,ty);if(c===".")continue;const sx=tx*T-cam,sy=ty*T;let bump=0;for(const b of G.blocks)if(b.tx===tx&&b.ty===ty)bump=-Math.sin(b.t/12*Math.PI)*6;const v=((tx*7+ty*3)%3+3)%3;
  switch(c){case"#":g.drawImage(GROUND[gk][v],sx,sy);break;case"=":g.drawImage(DIRT[gk][v],sx,sy);break;case"B":g.drawImage(T_BRICK,sx,sy+bump);break;case"?":case"!":g.drawImage(T_Q[Math.floor(G.t/9)%4===3?2:Math.floor(G.t/9)%4===2?1:0],sx,sy+bump);break;case"Q":g.drawImage(T_QA,sx,sy+bump);break;case"O":g.drawImage(CRATE,sx,sy);break;case"~":g.drawImage(T_Q[0],sx,sy+bump);g.drawImage(BURNER,sx+3,sy+bump+2,10,10);break;case"$":g.drawImage(T_Q[0],sx,sy+bump);g.drawImage(KHANJAR,sx+3,sy+bump+2,10,10);break;case"^":g.drawImage(T_Q[0],sx,sy+bump);g.drawImage(CAPEITEM,sx+3,sy+bump+5,10,5);break;case"U":g.drawImage(T_USED,sx,sy+bump);break;case"H":g.drawImage(T_HARD,sx,sy);break;
   case"C":g.drawImage(COIN[Math.floor(G.t/7)%3],sx+4,sy+2);break;case"S":g.drawImage(T_SPIKE,sx,sy);break;case"L":g.drawImage(T_LAVA[Math.floor(G.t/14)%2],sx,sy);break;case"A":g.drawImage(T_WATER[Math.floor(G.t/16)%2],sx,sy);break;case"o":g.drawImage(T_PLANK,sx,sy);break;case"J":g.drawImage(SPRING[G.springT>0&&G.springAt===tx+","+ty?1:0],sx,sy);break;case"N":g.drawImage(CANNON,sx,sy);break;
   case"T":case"Y":case"Z":g.fillStyle="#2f7f2d";g.fillRect(sx-2,sy,T*2+4,T);g.fillStyle="#62b84c";g.fillRect(sx+1,sy+1,5,T-3);g.fillStyle="#1d5a1b";g.fillRect(sx-2,sy+T-2,T*2+4,2);g.fillStyle="#9be37a";g.fillRect(sx+1,sy+1,2,T-3);if(c!=="T"){g.fillStyle="#f7c948";g.fillRect(sx+13,sy+5,6,2);g.fillRect(sx+15,sy+3,2,6);}break;case"t":case"z":break;case"p":g.fillStyle="#2f7f2d";g.fillRect(sx,sy,T,T);const left=tile(tx-1,ty)!=="p";if(left){g.fillStyle="#62b84c";g.fillRect(sx+2,sy,5,T);g.fillStyle="#9be37a";g.fillRect(sx+2,sy,2,T);g.fillStyle="#1d5a1b";g.fillRect(sx,sy,1,T);}else{g.fillStyle="#1d5a1b";g.fillRect(sx+T-2,sy,2,T);}break;
   case"K":case"k":g.fillStyle="#9a9a9a";g.fillRect(sx+7,sy-16,2,32);g.fillStyle=c==="k"?"#62b84c":"#d93a2b";g.fillRect(sx+9,sy-14,10,8);g.fillStyle="rgba(255,255,255,0.4)";g.fillRect(sx+9,sy-14,10,2);break;
   case"F":{const fy=G.flagSeq&&G.flagSeq.tx===tx?G.flagY:3*T;g.fillStyle="#9a9a9a";g.fillRect(sx+7,2*T+8,2,11*T-8);g.fillStyle="#d4d4d4";g.fillRect(sx+7,2*T+8,1,11*T-8);g.drawImage(T_FLAGBALL,sx+2,2*T);g.drawImage(FLAG,sx-4,fy);break;}
   case"G":{for(let yy=0;yy<4;yy++)for(let xx=-1;xx<=2;xx++)g.drawImage(T_CASTLE,sx+xx*T,sy-yy*T);g.fillStyle="#1a1a1a";g.fillRect(sx+4,sy+2,8,14);g.fillStyle="#3a3a44";g.fillRect(sx+4,sy+2,8,2);for(let xx=-1;xx<=2;xx++)g.fillRect(sx+xx*T+4,sy-4*T-6,8,6);g.fillStyle="#f7c948";g.fillRect(sx+6,sy-2*T+4,4,4);g.fillRect(sx+22,sy-2*T+4,4,4);g.drawImage(FLAG,sx+6,sy-5*T);break;}
   case"D":g.drawImage(GATE,sx,sy);break;}}
 // entities
 for(const e of G.ents){const sx=Math.round(e.x-cam),sy=Math.round(e.y);if(sx<-48||sx>VW+48)continue;
  if(e.k==="plat"){g.drawImage(T_PLANK,sx,sy,16,16);g.drawImage(T_PLANK,sx+16,sy,16,16);g.drawImage(T_PLANK,sx+32,sy,16,16);}
  else if(e.k==="bug"){const img=e.dead&&!e.flip?BUGFLAT:e.hp<2?BEETLE_CRACK:BEETLE[Math.floor(e.an/10)%2];if(e.flip){g.save();g.translate(sx+8,sy+6);g.scale(1,-1);g.drawImage(img,-8,-6);g.restore();}else g.drawImage(img,sx-1,sy);}
  else if(e.k==="virus"){if(e.flip){g.save();g.translate(sx+8,sy+6);g.scale(1,-1);g.drawImage(CACTUS[0],-8,-6);g.restore();}else g.drawImage(CACTUS[Math.floor(e.an/12)%2],sx-1,sy);}
  else if(e.k==="turtle"){const img=e.shell>0?SHELL:TURTLE[Math.floor(e.an/10)%2];if(e.flip){g.save();g.translate(sx+8,sy+6);g.scale(1,-1);g.drawImage(img,-8,-6);g.restore();}else if(e.vx>0&&e.shell===0){g.save();g.translate(sx+15,sy);g.scale(-1,1);g.drawImage(img,0,0);g.restore();}else g.drawImage(img,sx-1,sy);}
  else if(e.k==="drone"){if(e.dead){g.save();g.translate(sx+8,sy+6);g.scale(1,-1);g.drawImage(FALCON[0],-8,-6);g.restore();}else g.drawImage(FALCON[Math.floor(G.t/6)%2],sx-1,sy);}
  else if(e.k==="camel"||e.k==="camelrun"){const img=(e.vx<0||(e.k==="camel"&&G.player.x<e.x)?CAMEL:CAMEL_L)[Math.floor(G.t/8)%2];g.drawImage(img,sx,sy+8,16,12);g.drawImage(img,sx+2,sy,16,12);}
  else if(e.k==="sand"){g.drawImage(SANDBALL,sx,sy);}
  else if(e.k==="shot"){g.drawImage(SHOT,sx,sy);}
