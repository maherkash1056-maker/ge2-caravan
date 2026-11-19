/* ================= engine tail: bosses, items, player, weather, HUD, screens, Caravan bridge, boot =================
   (the original page was cut off inside draw(); everything from here on was rebuilt and is covered by tests/shopping) */
  else if(e.k==="boss"){const gr=g.createRadialGradient(sx+15,sy+11,4,sx+15,sy+11,44);gr.addColorStop(0,e.type==="djinn"?"rgba(217,185,122,0.35)":"rgba(255,90,46,0.3)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(sx-30,sy-34,90,90);
   if(e.flash>0&&Math.floor(G.t/3)%2)continue;const fr=Math.floor(e.an/8)%2;g.save();if(e.dead){g.translate(sx+16,sy+12);g.scale(1,-1);g.translate(-16,-12);}
   if(e.type==="djinn"){g.drawImage(e.stun>0?DJINN_SOLID:DJINN[fr],sx,sy-4);}else{g.drawImage((e.dir||-1)>0?SCORPION_L[fr]:SCORPION[fr],sx,sy+8);}g.restore();
   // hearts above the boss
   for(let i=0;i<3;i++){g.globalAlpha=i<e.hp?1:0.25;g.drawImage(HEART,sx+8+i*8,sy-14);}g.globalAlpha=1;}
  else if(e.k==="chip"){g.drawImage(SUPERDATE,sx,sy+Math.round(Math.sin(G.t/6)));}
  else if(e.k==="tool"){g.drawImage(BURNER,sx,sy+Math.round(Math.sin(G.t/6)));}
  else if(e.k==="khanjar"){g.drawImage(KHANJAR,sx,sy);if(G.t%4<2){g.fillStyle="rgba(255,255,255,0.8)";g.fillRect(sx+4,sy+1,2,2);}}
  else if(e.k==="cape"){g.drawImage(CAPEITEM,sx,sy+2+Math.round(Math.sin(G.t/5)*2));}
  else if(e.k==="life"){g.drawImage(ONEUP,sx,sy,16,16);}
  else if(e.k==="screw"){g.save();g.translate(sx+4,sy+4);g.rotate(e.t*0.4);g.drawImage(EMBER,-4,-4,8,8);g.restore();if(e.t%2===0)G.parts.push({k:"dot",x:e.x+2,y:e.y+2,vx:0,vy:-0.4,t:30,col:"#ff9a3e"});}
 }
 drawPlayer(g,cam);
 // particles + score pops
 for(const q of G.parts){const sx=q.x-cam;if(sx<-20||sx>VW+20)continue;
  if(q.k==="coin")g.drawImage(COIN[Math.floor(q.t/4)%3],sx,q.y);else if(q.k==="brick"){g.fillStyle="#c9533c";g.fillRect(sx,q.y,6,6);g.fillStyle="#e46a50";g.fillRect(sx,q.y,6,1);}
  else if(q.k==="dot"){g.fillStyle=q.col||"#fff";g.fillRect(sx,q.y,2,2);}else if(q.k==="spark"){g.fillStyle="#fff";const r=q.t<5?q.t:10-q.t;g.fillRect(sx-r,q.y,r*2+1,1);g.fillRect(sx,q.y-r,1,r*2+1);}
  else if(q.k==="puff"){g.globalAlpha=Math.max(0,0.5-q.t/44);g.fillStyle="#fff";g.beginPath();g.arc(sx,q.y,q.r,0,Math.PI*2);g.fill();g.globalAlpha=1;}}
 g.font='8px "Press Start 2P",monospace';g.textBaseline="top";
 for(const o of G.pops){g.globalAlpha=o.t>35?(50-o.t)/15:1;g.fillStyle="#000";g.fillText(o.txt,Math.round(o.x-cam)+1,Math.round(o.y)+1);g.fillStyle=o.col;g.fillText(o.txt,Math.round(o.x-cam),Math.round(o.y));}g.globalAlpha=1;
 drawWeather(g,cam,lv);
 g.setTransform(1,0,0,1,0,0);drawHUD(g);}
/* ---------- player ---------- */
const TINT={};function tinted(img,col){const k=col+"|"+img.width+"x"+img.height;let m=TINT[k];if(!m)m=TINT[k]=new Map();let c=m.get(img);if(!c){c=document.createElement("canvas");c.width=img.width;c.height=img.height;const x=c.getContext("2d");x.drawImage(img,0,0);x.globalCompositeOperation="source-atop";x.fillStyle=col;x.fillRect(0,0,c.width,c.height);m.set(img,c);}return c;}
function drawPlayer(g,cam){const p=G.player;if(!p)return;const who=SAVE.hero||"man";const fr=HERO[who][p.state===3?1:Math.min(2,p.state)];const key=(p.animK||"idle")+(p.dir<0?"L":"");let img=fr[key]||fr.idle;
 const px=Math.round(p.x-cam)-2,py=Math.round(p.y);
 if(p.mount){const cm=(p.dir<0?CAMEL:CAMEL_L)[Math.floor(G.t/8)%2];g.drawImage(cm,px-2,py+p.h-14,16,12);g.drawImage(cm,px,py+p.h-22,16,12);}
 if(p.inv>0&&!p.dead&&Math.floor(G.t/3)%2===1)return;
 if(p.star>0&&(p.star>90||Math.floor(G.t/4)%2===0)){img=tinted(img,["rgba(247,201,72,0.75)","rgba(255,255,255,0.7)","rgba(255,90,46,0.6)"][Math.floor(G.t/3)%3]);}
 g.save();g.translate(px+8,py+p.h);if(p.dead){g.scale(1,-1);g.translate(0,-p.h);}else g.scale(p.sx,p.sy);
 if(p.state===3){if(p.glide)g.drawImage(CAPE_GLIDE,-12,-p.h+6);else{g.save();if(p.dir<0){g.scale(-1,1);}g.drawImage(CAPE_BACK,-14,-p.h);g.restore();}}
 g.drawImage(img,-8,-p.h);g.restore();}
/* ---------- weather: khareef drizzle, desert sand, castle embers ---------- */
function drawWeather(g,cam,lv){const t=G.t;const castle=lv.castle||!!G.room;
 if(castle){g.fillStyle="rgba(255,170,60,0.8)";for(let i=0;i<14;i++){const x=((i*131+t*0.3)%(VW+40))-20,y=VH-((i*47+t*(0.6+(i%3)*0.3))%VH);g.globalAlpha=0.3+((i*7+t)%20)/40;g.fillRect(Math.round(x),Math.round(y),2,2);}g.globalAlpha=1;return;}
 if(lv.world===0){g.strokeStyle="rgba(255,255,255,0.35)";g.lineWidth=1;g.beginPath();for(let i=0;i<40;i++){const x=((i*89-cam*0.9-t*1.2)%(VW+30)+VW+30)%(VW+30)-15,y=((i*53+t*3.2)%(VH+20))-10;g.moveTo(x,y);g.lineTo(x-2,y+7);}g.stroke();
  const m=g.createLinearGradient(0,VH-70,0,VH);m.addColorStop(0,"rgba(255,255,255,0)");m.addColorStop(1,"rgba(255,255,255,0.18)");g.fillStyle=m;g.fillRect(0,VH-70,VW,70);}
 else{g.fillStyle="rgba(226,196,138,0.5)";for(let i=0;i<26;i++){const x=((i*97-cam*0.6-t*(2+(i%4)))%(VW+60)+VW+60)%(VW+60)-30,y=((i*61+Math.sin(t/20+i)*6)%VH+VH)%VH;g.fillRect(Math.round(x),Math.round(y),6+(i%3)*3,1);}}}
/* ---------- HUD ---------- */
function drawHUD(g){g.font='8px "Press Start 2P",monospace';g.textBaseline="top";const txt=(s,x,y,col)=>{g.fillStyle="#000";g.fillText(s,x+1,y+1);g.fillStyle=col||"#fff";g.fillText(s,x,y);};
 g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,0,VW,22);
 txt((SAVE.name||"PLAYER").toUpperCase().slice(0,8),6,4);txt(String(G.score).padStart(7,"0"),6,13);
 g.drawImage(COIN[Math.floor(G.t/7)%3],84,4);txt("×"+String(G.coins).padStart(2,"0"),94,8,"#f7c948");
 txt("WORLD",VW/2-40,4,"#9ad0ff");txt(G.lv.name,VW/2-40,13);
 const low=G.time<=60&&G.state==="play";txt("TIME",VW/2+22,4,"#9ad0ff");txt(String(G.time).padStart(3,"0"),VW/2+22,13,low&&Math.floor(G.t/15)%2?"#ff5a2e":"#fff");
 const fr=HERO[SAVE.hero||"man"][0].idle;g.drawImage(fr,VW-104,2,8,10);txt("×"+G.lives,VW-94,4);txt((GROCERY[G.lv.item]||"")+" "+String(G.lv.item||"").toUpperCase().slice(0,7),VW-104,13,"#62b84c");
 if(G.player&&G.player.skipped>0)txt("SKIPPED "+G.player.skipped+"/3",VW/2-40,24,"#ff9a3e");
 if(G.room)txt("BONUS ROOM · ▼ at the green pipe to leave",6,VH-12,"#f7c948");}
/* ---------- screens ---------- */
function sceneCanvas(fn){const c=document.createElement("canvas");c.width=256;c.height=160;const g=c.getContext("2d");g.imageSmoothingEnabled=false;fn(g,c.width,c.height);return c;}
function sceneSky(g,w,h,a,b){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,w,h);}
function sceneGround(g,w,h,kind){for(let x=0;x<w;x+=16){g.drawImage(GROUND[kind][(x/16)%3],x,h-32);g.drawImage(DIRT[kind][(x/16+1)%3],x,h-16);}}
function sceneHero(g,x,y,big,key){const fr=HERO[SAVE.hero||"man"][big?1:0];g.drawImage(fr[key||"idle"],x,y-(big?28:20));}
const STORY={
 intro:{title:"THE BIG SHOPPING RUN",lines:["Mum: \"We need dates, laban, bread, rice and frankincense for the khareef guests — and halwa, water, coffee, eggs and honey from the night souq.\"","The souq is far: over the green Khareef hills and across the desert at night.","Grab the list. Run, jump, and answer the grammar blocks on the way!"],scene:(g,w,h)=>{sceneSky(g,w,h,"#5fa8e6","#e8eef0");g.fillStyle="#8aa64f";g.beginPath();g.ellipse(60,h-32,90,40,0,Math.PI,0);g.fill();g.beginPath();g.ellipse(200,h-32,80,30,0,Math.PI,0);g.fill();sceneGround(g,w,h,"grass");g.drawImage(TREE,150,h-80);g.drawImage(BUSH,40,h-48);g.drawImage(SIGN,110,h-48);sceneHero(g,70,h-32,false,"walk1");g.font='12px system-ui';g.fillText("🌴🥛🍞🍚🪔",160,20);}},
 castle1:{title:"THE MOUNTAIN PASS",lines:["A dark castle blocks the pass — and the Scorpion King waits inside.","Answer the gate questions to open the door. Stomp the scorpion and answer to strike!"],scene:(g,w,h)=>{sceneSky(g,w,h,"#1b1226","#3a2140");for(let x=0;x<w;x+=16)for(let y=h-48;y<h-32;y+=16)g.drawImage(T_CASTLE,x,y);sceneGround(g,w,h,"stone");g.drawImage(GATE,120,h-48);g.drawImage(TORCH[0],100,h-62);g.drawImage(TORCH[1],150,h-62);g.drawImage(SCORPION[0],170,h-45);sceneHero(g,40,h-32,true,"idle");}},
 midway:{title:"HALF THE BASKET",lines:["Dates, laban, bread, rice and frankincense — the first half of the list is in the basket!","Now the desert at night: palms, dunes, sliding turtles and falcons. Hold on tight."],scene:(g,w,h)=>{sceneSky(g,w,h,"#141b3f","#4a3a6b");g.fillStyle="#fff";for(let i=0;i<40;i++)g.fillRect((i*97)%w,(i*53)%90,1,1);g.fillStyle="#f6ead0";g.beginPath();g.arc(210,30,12,0,Math.PI*2);g.fill();g.fillStyle="#8a6a3a";g.beginPath();g.ellipse(80,h-32,100,38,0,Math.PI,0);g.fill();sceneGround(g,w,h,"sand");g.drawImage(PALM,180,h-80);g.drawImage(CAMELSIL,20,h-52);sceneHero(g,110,h-32,true,"walk2");g.font='12px system-ui';g.fillText("🌴🥛🍞🍚🪔 ✓",20,20);}},
 castle2:{title:"THE SOUQ GATE",lines:["The Sandstorm Djinn guards the gate of the night souq.","It throws sand — but sometimes it turns solid. That is your moment: stomp it and answer!"],scene:(g,w,h)=>{sceneSky(g,w,h,"#120a14","#2a1420");for(let x=0;x<w;x+=16)for(let y=h-48;y<h-32;y+=16)g.drawImage(T_CASTLE,x,y);sceneGround(g,w,h,"stone");g.drawImage(GATE,130,h-48);g.drawImage(DJINN[0],160,h-70);sceneHero(g,40,h-32,true,"jump");}},
 ending:{title:"THE BASKET IS FULL!",lines:["Every item on Mum's list is in the basket. The khareef guests will eat well tonight.","\"Shukran!\" says Mum. \"You ran the big shopping run — and your grammar was perfect.\"","Play any level again from the map to beat your best score."],scene:(g,w,h)=>{sceneSky(g,w,h,"#79c4ff","#cfeeff");sceneGround(g,w,h,"grass");g.drawImage(TREE,20,h-80);g.drawImage(TREE,200,h-80);sceneHero(g,110,h-32,true,"idle");g.font='16px system-ui';g.fillText("🌴🥛🍞🍚🪔🍮💧☕🥚🍯",40,24);g.drawImage(FLAG,150,30);}}
};
function story(s){return new Promise(res=>{G.state="story";const el=$("#intro");el.innerHTML='<div class="box story"><div class="wl">'+esc(s.title)+'</div><div class="scene"></div><div class="stxt" id="stxt"></div><div class="row"><button class="btn" id="snext">Continue ▶</button></div></div>';el.querySelector(".scene").appendChild(sceneCanvas(s.scene));el.hidden=false;
 let i=0;const show=()=>{$("#stxt").textContent=s.lines[i];$("#snext").textContent=i<s.lines.length-1?"Next ▶":"Continue ▶";};show();
 $("#snext").onclick=()=>{if(i<s.lines.length-1){i++;show();}else{el.hidden=true;res();}};});}
function worldMap(){G.state="map";$("#benter").hidden=true;if(G.lives<=0)G.lives=3;const el=$("#map");
 const lv=i=>{const L=LEVELS[i];const open=i<SAVE.unlocked;const best=SAVE.best[i];return '<button class="lvl'+(L.castle?" castle":"")+(open?"":" lock")+'" data-l="'+i+'"'+(open?"":" disabled")+'><span class="k">'+(open?(L.castle?"🏰":GROCERY[L.item]):"🔒")+'</span>'+(L.w+1)+'-'+L.n+(best?'<span class="b">'+best+'</span>':'')+'</button>';};
 el.innerHTML='<div class="box wide"><div class="wl">THE BIG SHOPPING RUN</div><div class="wn">'+esc(SAVE.name||"")+' · 🧺 basket '+SAVE.basket.length+'/'+LEVELS.length+'</div><div class="basket">'+LEVELS.map(L=>'<span class="'+(SAVE.basket.includes(L.item)?"":"todo")+'" title="'+esc(L.item)+'">'+GROCERY[L.item]+'</span>').join("")+'</div>'+[0,1].map(w=>'<div class="worlds w'+(w+1)+'"><div class="wname">WORLD '+(w+1)+' · '+esc(WORLDS[w].name.toUpperCase())+'</div><div class="lvls">'+LEVELS.map((L,i)=>L.w===w?lv(i):"").join("")+'</div></div>').join("")+'<div class="stats">Coins '+SAVE.coinsTotal+' · Questions right '+SAVE.qRight+' / '+SAVE.qTotal+' · Lives '+G.lives+'</div><div class="row"><button class="btn ghost" id="totitle">Title</button></div></div>';el.hidden=false;
 el.querySelectorAll(".lvl:not(.lock)").forEach(b=>b.onclick=()=>{el.hidden=true;G.checkpoint=null;G.score=0;G.coins=0;startLevel(+b.dataset.l,false);});$("#totitle").onclick=()=>{el.hidden=true;title();};}
function title(){G.state="title";const el=$("#title");el.hidden=false;const prev=(id,who)=>{const c=$(id),g=c.getContext("2d");g.imageSmoothingEnabled=false;g.clearRect(0,0,60,66);g.drawImage(HERO[who][1][Math.floor(G.t/20)%2?"walk1":"idle"],14,6,32,56);};
 const sel=who=>{SAVE.hero=who;$("#pm").classList.toggle("sel",who==="man");$("#pw").classList.toggle("sel",who==="woman");};sel(SAVE.hero||"man");$("#pm").onclick=()=>sel("man");$("#pw").onclick=()=>sel("woman");
 const nm=$("#nm");nm.value=SAVE.name||"";if(G.titleT)clearInterval(G.titleT);G.titleT=setInterval(()=>{if(el.hidden){clearInterval(G.titleT);return;}prev("#tcm","man");prev("#tcw","woman");G.t++;},120);
 $("#start").onclick=async()=>{SAVE.name=(nm.value.trim()||SAVE.name||"Player").slice(0,10);save();el.hidden=true;if(!SAVE.storySeen){await story(STORY.intro);SAVE.storySeen=true;save();}worldMap();};}
function pause(){if(G.state!=="play")return;G.state="pause";$("#snd").textContent=SAVE.sound?"🔊 Sound on":"🔇 Sound off";$("#pausemenu").hidden=false;}
function unpause(){if(G.state!=="pause")return;$("#pausemenu").hidden=true;G.state="play";last=performance.now();}
$("#resume").onclick=unpause;$("#snd").onclick=()=>{SAVE.sound=!SAVE.sound;save();$("#snd").textContent=SAVE.sound?"🔊 Sound on":"🔇 Sound off";};$("#quit").onclick=()=>{$("#pausemenu").hidden=true;$("#benter").hidden=true;worldMap();};
/* ---------- Caravan bridge: results → XP and the skills heat-map (one report per level) ---------- */
const SKILLS={g_passive:"The passive",g_modal:"Modals",g_cause:"Cause and result",g_seq:"Sequencing words",g_contrast:"Contrast linkers",g_past:"Past simple",g_present:"Present simple",g_agree:"Subject–verb agreement",v_q:"Question words",g_prep:"Prepositions",v_b1:"B1 vocabulary",r_abc:"A, B or C questions",custom:"Teacher questions"};
function bridgeResult(won){const rs=SAVE.results.slice(G.repMark||0);G.repMark=SAVE.results.length;if(!rs.length||!window.Caravan)return;const by={};for(const r of rs){const k=by[r.skill]||(by[r.skill]={id:r.skill,name:SKILLS[r.skill]||(Caravan.SKILL_NAMES||{})[r.skill]||r.skill,r:0,n:0});k.n++;if(r.ok)k.r++;}
 const right=rs.filter(r=>r.ok).length;const badges=[];if(won!==false&&G.lv){badges.push("shopping_"+G.lv.item);if(G.level===LEVELS.length-1)badges.push("souq_hero");if(G.lv.castle)badges.push("gate_"+(G.lv.boss||"castle"));}
 try{Caravan.report({right,total:rs.length,skills:Object.values(by),won:won!==false,score:G.score,badges,noScan:true});}catch(_){}}
/* ---------- boot ---------- */
const SESSION=window.Caravan?Caravan.init({game:"The Big Shopping Run"}):null;if(SESSION&&!SAVE.name)SAVE.name=(SESSION.short||SESSION.name||"").slice(0,10);
loadQuestions();title();requestAnimationFrame(frame);
window.__sr={G,IN,SAVE,LEVELS,WORLDS,startLevel,worldMap,title,story,STORY,askOne,nextQ,tile,setTile,levelClear,pause,unpause,get Q(){return QUESTIONS;},get session(){return SESSION;}};
