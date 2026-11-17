/* ===================== GENRE: BOSS FIGHT (the Brew-Haha engine) ===================== */
MODS.boss=(()=>{let sp=null;const FLOOR=300,GRAV=1500,JUMPV=-560,MOVE=250,DASHV=560,DASHT=.26;
 const THEMES={classic:{},jade:{porc:"#d9f0e3",navy:"#1d6b52",steam:"#e3f5ec",steamD:"#b5d6c4",brass:"#5fa37f",brassD:"#2f6b50",brassL:"#bfe8cf",red:"#1f4d3a"},ruby:{porc:"#f6e0e0",navy:"#8e1b2c",steam:"#f7e6e6",steamD:"#d8b4b4",brass:"#c0504d",brassD:"#7d2a2a",brassL:"#f0b4b0",red:"#5a1414"},midnight:{porc:"#dfe3f0",navy:"#1b1f4a",gold:"#9fd3ff",steam:"#e6e9f5",steamD:"#b9bfd8",brass:"#5a6fb0",brassD:"#2d3a6e",brassL:"#b8c6f0",red:"#1b1f4a"}};
 let h=null,b=null,proj=[],shots=[],marks=[],phase=1,nextPhase=1,sup=0,supT=0,lastShot=0,jumpBuf=0,parries=0,tauntT=3,N=1,p2=99,p3=99;
 const potPal=()=>{const p=SW.pot[sp.pot]||SW.pot.gold;return {brass:p[0],brassL:p[1],brassD:p[2]};};
 const bossPal=()=>THEMES[sp.bossTheme]||{};
 function faceName(i){const f=String((sp.faces||[])[i]||"").trim();if(f)return f;if(i===0)return gv(sp,"enemy");return ["","The Steam Spirit","The Kettle Kaiser"][i];}
 function newHero(){return {x:130,y:FLOOR,vx:0,vy:0,ground:true,pose:"idle",pt:0,aim:0,look:{x:.6,y:-.2},lidPop:0,flash:0,dashT:0,dashCd:0,airDash:true,parryWin:0,duck:false,trail:[]};}
 function newBoss(hp){return {x:520,y:190,baseY:190,tx:520,ty:190,hp,max:hp,look:{x:-1,y:.3},open:0,pour:0,tilt:0,flash:0,hurt:0,glow:0,whistle:0,co:null,wait:0,spd:150,swoop:null,jump:null};}
 function init(s){sp=s;h=newHero();b=newBoss(1000);b.x=470;b.y=176;proj=[];shots=[];phase=1;}
 function start(s){sp=s;N=G.qs.length;const hp=Math.max(800,N*210*(G.diffKey==="simple"?.75:1));h=newHero();b=newBoss(hp);proj=[];shots=[];phase=1;nextPhase=1;sup=0;supT=0;lastShot=0;jumpBuf=0;parries=0;tauntT=3;
   marks=[];for(let k=1;k<N;k++)marks.push({f:k/N,done:false});p2=N>=3?Math.max(1,Math.round(N/3)):99;p3=N>=3?Math.max(p2+1,Math.round(2*N/3)):99;if(p3>=N)p3=99;b.co=phaseGen(1);}
 /* ---- boss brains ---- */
 function* moveTo(x,y,secs){b.tx=x;b.ty=y;yield secs;}
 function* phaseGen(ph){yield .8;while(true){
   if(ph===1){const a=pick(["cups","pour","sugar","cups","rain","cups"]);yield* P1[a]();yield rand(.5,.9)/G.diff.spd;}
   else if(ph===2){const a=pick(["bolts","saucers","swoop","puffs","saucers","swoop"]);yield* P2[a]();yield rand(.4,.8)/G.diff.spd;}
   else{const a=pick(["train","spit","stomp","train","spit"]);yield* P3[a]();yield rand(.3,.7)/G.diff.spd;}
   tauntT-=1;if(tauntT<=0){tauntT=3;say(tauntOf(sp,ph-1));}}}
 const P1={
  *cups(){const s=G.diff.spd;yield* moveTo(520,rand(150,210),.5/s);b.open=1;yield .35;let hi=Math.random()<.5;for(let i=0;i<3;i++){const y=hi?FLOOR-72:FLOOR-20;proj.push({k:"cup",x:b.x-70,y:b.y+20,vx:-300*s,ty:y,rot:0,r:11,arc:true});hi=!hi;yield .55/s;}b.open=0;},
  *pour(){const s=G.diff.spd;yield* moveTo(430,120,.8/s);b.tilt=-.5;b.pour=1;const n=Math.floor(11*s);for(let i=0;i<n;i++){proj.push({k:"drop",x:b.x-112,y:b.y-20,vx:rand(-170,-40)*s,vy:rand(-60,40),g:420*s,r:6});yield .14/s;}b.tilt=0;b.pour=0;yield* moveTo(520,190,.6/s);},
  *sugar(){b.open=.6;yield .3;for(let i=0;i<2;i++){proj.push({k:"cube",x:b.x-60,y:b.y+40,vx:-190*G.diff.spd,vy:-120,g:900,rot:0,pink:true,r:11});yield .7;}b.open=0;},
  *rain(){const s=G.diff.spd;yield* moveTo(520,110,.5/s);b.tilt=-.3;b.pour=1;for(let i=0;i<6;i++){const x=rand(60,430);proj.push({k:"drop",x,y:-10,vx:0,vy:210*s,g:200*s,r:7});addFx("mark",x,FLOOR,{dur:.9});yield .28/s;}b.tilt=0;b.pour=0;yield* moveTo(520,190,.5/s);}};
 const P2={
  *bolts(){const s=G.diff.spd;const hx=h.x;const xs=[hx,clamp(hx-100,40,440),clamp(hx+100,40,440)];b.open=1;for(const x of xs){proj.push({k:"bolt",x,t:0,warn:.75/s,on:.35,y0:40,y1:FLOOR});yield .22/s;}yield 1.3/s;b.open=0;},
  *saucers(){const s=G.diff.spd;const hs=[FLOOR-22,FLOOR-74,FLOOR-22,FLOOR-130,FLOOR-74];for(let i=0;i<5;i++){proj.push({k:"saucer",x:W+30,y:hs[i],vx:-260*s,ph:rand(0,6),pink:i===2,r:13,rot:0,amp:8});yield .55/s;}yield .6;},
  *swoop(){const s=G.diff.spd;const y=Math.random()<.5?FLOOR-50:FLOOR-130;yield* moveTo(560,y,.6/s);b.open=1;yield .45/s;b.swoop={t:0,dur:1.1/s,x0:b.x,x1:-150,y};while(b.swoop){yield .05;}b.open=0;b.x=700;b.y=100;yield* moveTo(520,190,.9/s);},
  *puffs(){const s=G.diff.spd;for(let i=0;i<3;i++){proj.push({k:"puff",x:b.x-40,y:b.y+rand(-20,40),vx:-110*s,vy:rand(-10,10),pink:i!==1,r:14});yield .5;}yield .4;}};
 const P3={
  *train(){const s=G.diff.spd;b.whistle=1;SFX.whistle();yield .5;let hi=Math.random()<.5;for(let i=0;i<3;i++){proj.push({k:"band",x:b.x-40,y:hi?FLOOR-104:FLOOR-44,w:120,h:44,vx:-270*s,hi});hi=!hi;yield 1.0/s;}b.whistle=0;yield .7/s;},
  *spit(){const s=G.diff.spd;b.open=1;for(let i=0;i<3;i++){const ang=Math.atan2(h.y-50-(b.y-10),h.x-(b.x-60));for(let j=-1;j<=1;j++){const a=ang+j*.28;proj.push({k:"bullet",x:b.x-60,y:b.y-10,vx:Math.cos(a)*250*s,vy:Math.sin(a)*250*s,r:7});}if(i===1)proj.push({k:"puff",x:b.x-70,y:b.y-60,vx:-120*s,vy:0,pink:true,r:14});yield .6/s;}b.open=.3;},
  *stomp(){const s=G.diff.spd;b.whistle=1;b.glow=.4;SFX.whistle();yield .6/s;b.whistle=0;b.glow=0;b.jump={t:0,dur:1.1/s};while(b.jump){yield .05;}yield .6;}};
 function bossBox(){return phase===1?{x:b.x,y:b.y,rx:72,ry:56}:phase===2?{x:b.x,y:b.y-6,rx:58,ry:70}:{x:b.x,y:b.y+4,rx:82,ry:58};}
 function inBox(px,py,bx){const dx=(px-bx.x)/bx.rx,dy=(py-bx.y)/bx.ry;return dx*dx+dy*dy<1;}
 function heroBox(){return h.duck?{x:h.x,y:h.y-20,r:15}:{x:h.x,y:h.y-50,r:21};}
 function clearField(){proj=[];shots=[];b.swoop=null;b.jump=null;b.open=0;b.tilt=0;b.pour=0;b.whistle=0;b.glow=0;h.duck=false;h.dashT=0;h.trail=[];}
 function damageBoss(d,x,y){if(G.sub!=="play")return;b.hp-=d;G.score+=Math.round(d);b.flash=.5;b.hurt=.12;addFx("spark",x,y,{rot:rand(0,3)});
   for(const m of marks){if(!m.done&&b.hp<=b.max*(1-m.f)){m.done=true;b.hp=Math.max(b.hp,1);clearField();askQuestion();return;}}
   if(b.hp<=0){b.hp=0;clearField();askQuestion({title:"THE FINAL BLOW!"});}}
 function hurtHero(){if(G.inv>0||G.sub!=="play")return;if(!hurt(true))return;SFX.hurt();h.pose="hurt";h.pt=0;h.vy=Math.min(h.vy,-200);h.ground=false;h.dashT=0;addText(h.x,h.y-125,"OUCH!",ART.C.red,26);
   if(G.hearts<=0){h.pose="dead";h.pt=0;h.vy=-300;proj=[];shots=[];supT=0;showCard("GAME OVER!",ART.C.red,1.6,44);}}
 function tryParry(){const hb=heroBox();for(const p of proj){if(!p.pink||p.dead)continue;const py=p.k==="saucer"?p.yy:p.y;if(Math.hypot(p.x-hb.x,py-hb.y)<hb.r+p.r+26){doParry(p);return true;}}return false;}
 function doParry(p){p.dead=true;parries++;G.score+=50;sup=Math.min(1,sup+1/3);h.vy=-440;h.ground=false;h.pose="parry";h.pt=0;h.parryWin=0;G.inv=Math.max(G.inv,.3);h.airDash=true;SFX.parry();const py=p.k==="saucer"?p.yy:p.y;addFx("burst",p.x,py,{dur:.5});addText(p.x,py-30,"PARRY!",ART.C.pink,28);}
 function fireSuper(){if(G.sub!=="play"||sup<1||supT>0)return;sup=0;supT=2.2;h.pose="super";h.duck=false;SFX.super();showCard("SUPER ATTACK!",ART.C.pink,1,34);}
 function update(dt,inp){const s=G.diff.spd;
   b.flash=Math.max(0,b.flash-dt*2);b.hurt=Math.max(0,b.hurt-dt);h.lidPop=Math.max(0,h.lidPop-dt*40);
   b.look.x=clamp((h.x-b.x)/220,-1,1);b.look.y=clamp((h.y-60-b.y)/200,-.5,.7);h.look.x=clamp((b.x-h.x)/300,-1,1);h.look.y=clamp((b.y-(h.y-60))/300,-.8,.3);
   h.pt+=dt;h.dashCd=Math.max(0,h.dashCd-dt);h.parryWin=Math.max(0,h.parryWin-dt);jumpBuf=Math.max(0,jumpBuf-dt);
   const busy=supT>0||h.pose==="hurt"&&h.pt<.3;
   if(h.dashT>0){h.dashT-=dt;h.vx=h.dashDir*DASHV;h.vy=0;h.trail.push({x:h.x,y:h.y,t:0});if(h.dashT<=0){h.pose=h.ground?"idle":"jump";h.vx=0;addFx("poof",h.x-h.dashDir*20,h.y,{r:10,dur:.3});}}
   else if(!busy){h.vx=inp.mx*MOVE;const wasDuck=h.duck;h.duck=h.ground&&inp.my>.5&&!inp.up;if(h.duck){h.vx=0;if(!wasDuck){addFx("poof",h.x-14,h.y,{r:8,dur:.3});addFx("poof",h.x+14,h.y,{r:8,dur:.3});}}h.aim=inp.up?(inp.mx!==0?1:2):0;
     if(inp.jump&&jumpBuf<=0&&h.ground&&!h.duck){h.vy=JUMPV;h.ground=false;h.pose="jump";h.pt=0;SFX.jump();jumpBuf=.25;addFx("poof",h.x,h.y,{r:10,dur:.3});}
     else if(inp.jump&&jumpBuf<=0&&!h.ground){h.parryWin=.22;jumpBuf=.25;tryParry();}
     if(inp.dash&&h.dashCd<=0&&(h.ground||h.airDash)&&!h.duck){h.dashT=DASHT;h.dashCd=.5;h.dashDir=inp.mx<0?-1:1;h.pose="dash";h.pt=0;G.inv=Math.max(G.inv,DASHT+.06);if(!h.ground)h.airDash=false;SFX.dash();h.vy=0;h.trail=[];addFx("poof",h.x,h.y,{r:12,dur:.35});}}
   if(inp.superBtn)fireSuper();
   h.trail.forEach(q=>q.t+=dt);h.trail=h.trail.filter(q=>q.t<.22);
   if(!h.ground&&h.dashT<=0)h.vy+=GRAV*dt;
   h.x=clamp(h.x+h.vx*dt,36,450);h.y+=h.vy*dt;
   if(h.y>=FLOOR){h.y=FLOOR;if(!h.ground){h.ground=true;h.airDash=true;if(h.pose==="jump"||h.pose==="parry")h.pose="idle";}h.vy=0;}
   if(h.ground&&h.dashT<=0&&supT<=0&&h.pose!=="hurt")h.pose=h.duck?"duck":"idle";
   if(h.pose==="hurt"&&h.pt>.5)h.pose=h.ground?"idle":"jump";
   if(supT>0){supT-=dt;h.pose="super";h.vx=0;G.inv=Math.max(G.inv,.1);const bx=bossBox();damageBoss(120*dt*G.diff.dmg,bx.x+rand(-30,30),bx.y+rand(-30,30));if(supT<=0){h.pose="idle";supT=0;}if(G.sub!=="play")return;}
   else if(h.pose!=="hurt"&&h.dashT<=0){lastShot+=dt;if(lastShot>=G.diff.rate){lastShot=0;const a=h.aim===2?-1.3:h.aim===1?-.8:-.3;const bx0=h.x+(24+Math.cos(a)*30)*1.12,by0=h.y+(-58+Math.sin(a)*30)*1.12;const dir=h.aim===2?-Math.PI/2:h.aim===1?-Math.PI/4:0;shots.push({x:bx0,y:h.duck?h.y-30:by0,vx:Math.cos(dir)*640,vy:Math.sin(dir)*640,rot:dir});h.lidPop=6;SFX.shoot();}}
   const bx=bossBox();for(const q of shots){const dx=bx.x-q.x,dy=bx.y-q.y,d=Math.hypot(dx,dy)||1;q.vx+=dx/d*700*dt;q.vy+=dy/d*700*dt;const v=Math.hypot(q.vx,q.vy);q.vx*=640/v;q.vy*=640/v;q.x+=q.vx*dt;q.y+=q.vy*dt;q.rot=Math.atan2(q.vy,q.vx);if(inBox(q.x,q.y,bx)){q.dead=true;damageBoss(4*G.diff.dmg,q.x,q.y);SFX.hit();if(G.sub!=="play")return;}}
   shots=shots.filter(q=>!q.dead&&q.y>-20&&q.x<W+20);
   if(b.swoop){const w=b.swoop;w.t+=dt;const k=Math.min(1,w.t/w.dur);b.x=w.x0+(w.x1-w.x0)*k;b.y=w.y;b.tx=b.x;b.ty=b.y;if(k>=1)b.swoop=null;}
   else if(b.jump){const j=b.jump;j.t+=dt;const k=Math.min(1,j.t/j.dur);const low=FLOOR-62,top=120;if(k<.35)b.y=190-Math.sin(k/.35*Math.PI/2)*(190-top);else if(k<.5){b.y=top+((k-.35)/.15)*(low-top);if(!j.landed&&k>=.48){j.landed=true;G.shake=12;SFX.stomp();proj.push({k:"fwave",x:b.x-90,vx:-320*s});addFx("cloud",b.x-70,FLOOR-10,{r:22,dur:.6});addFx("cloud",b.x+70,FLOOR-10,{r:22,dur:.6});}}else if(k<.7)b.y=low;else b.y=low+(190-low)*((k-.7)/.3);b.ty=190;if(k>=1){b.jump=null;b.y=190;}}
   else{const bd=b.tx-b.x,bdy=b.ty-b.y;b.x+=clamp(bd,-b.spd*dt,b.spd*dt);b.y+=clamp(bdy,-b.spd*dt,b.spd*dt);b.y+=Math.sin(G.t*2)*16*dt;}
   b.wait-=dt;let guard=0;while(b.wait<=0&&G.sub==="play"&&guard++<8){const r=b.co.next();if(r.done){b.co=phaseGen(phase);continue;}b.wait+=Math.max(.016,r.value||.016);}
   const hb=heroBox();
   for(const p of proj){
     if(p.k==="drop"){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>FLOOR+4){p.dead=true;addFx("splash",p.x,FLOOR,{dur:.35});}}
     else if(p.k==="cup"){if(p.arc)p.y+=(p.ty-p.y)*Math.min(1,dt*4);p.x+=p.vx*dt;p.rot+=dt*9;if(p.x<-30)p.dead=true;}
     else if(p.k==="cube"){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=dt*4;if(p.y>FLOOR-10){p.y=FLOOR-10;p.vy=-420;addFx("poof",p.x,FLOOR,{r:8,dur:.3});}if(p.x<-30)p.dead=true;}
     else if(p.k==="puff"){p.x+=p.vx*dt;p.y+=p.vy*dt+Math.sin(G.t*3+p.x)*.3;if(p.x<-30)p.dead=true;}
     else if(p.k==="saucer"){p.x+=p.vx*dt;p.ph+=dt*4;p.rot+=dt*8;p.yy=p.y+Math.sin(p.ph)*p.amp;if(p.x<-40)p.dead=true;}
     else if(p.k==="bullet"){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>H+20||p.x<-20||p.x>W+20||p.y<-20)p.dead=true;}
     else if(p.k==="bolt"){p.t+=dt;if(p.t>p.warn+p.on)p.dead=true;}
     else if(p.k==="band"){p.x+=p.vx*dt;if(p.x+p.w<-10)p.dead=true;}
     else if(p.k==="fwave"){p.x+=p.vx*dt;if(p.x<-40)p.dead=true;}
     if(!p.dead&&G.inv<=0&&h.pose!=="dead"){let hit=false;
       if(p.k==="bolt")hit=p.t>p.warn&&Math.abs(p.x-hb.x)<hb.r+6;
       else if(p.k==="band")hit=hb.x+hb.r>p.x&&hb.x-hb.r<p.x+p.w&&hb.y+hb.r>p.y&&hb.y-hb.r<p.y+p.h;
       else if(p.k==="fwave")hit=Math.abs(p.x-hb.x)<hb.r+14&&hb.y+hb.r>FLOOR-40;
       else{const py=p.k==="saucer"?p.yy:p.y;hit=Math.hypot(p.x-hb.x,py-hb.y)<hb.r+p.r-3;}
       if(hit){if(p.pink&&h.parryWin>0){doParry(p);continue;}if(p.k!=="bolt"&&p.k!=="band"&&p.k!=="fwave")p.dead=true;hurtHero();}}}
   proj=proj.filter(p=>!p.dead);
   if(G.inv<=0&&(b.swoop||(b.jump&&b.jump.t/b.jump.dur>.4&&b.jump.t/b.jump.dur<.7))&&inBox(hb.x,hb.y,bossBox()))hurtHero();}
 function startTransform(){setSub("transform");clearField();b.tx=520;b.ty=190;SFX.phase();}
 function idle(dt){if(!h||!b)return;G.subT;
   if(G.sub==="intro"||G.mode==="title"){b.y=b.baseY+Math.sin(G.t*2)*8;return;}
   if(G.sub==="transform"){const k=G.subT;G.shake=Math.max(G.shake,k<1.2?6:0);if(!h.ground){h.vy+=GRAV*dt;h.y=Math.min(FLOOR,h.y+h.vy*dt);if(h.y>=FLOOR){h.ground=true;h.pose="idle";}}
     if(k<1.2){b.x+=(520-b.x)*dt*3;b.y+=(190-b.y)*dt*3;}
     if(k>.2&&Math.random()<.5)addFx("cloud",b.x+rand(-90,90),b.y+rand(-70,70),{r:rand(16,34),dur:.9});
     if(k>=1.2&&phase<nextPhase){phase=nextPhase;b.co=phaseGen(phase);b.wait=0;if(phase===3){b.baseY=190;b.ty=190;b.x=540;b.tx=540;b.spd=130;}else b.spd=190;G.hearts=G.diff.hearts;addText(h.x,h.y-130,"HEARTS REFILLED!",ART.C.red,22);showCard("FACE "+phase+": "+faceName(phase-1).toUpperCase(),ART.C.gold,1.5,28);say(tauntOf(sp,phase-1));}
     if(k>=2.4){setSub("play");G.shake=0;}return;}
   if(G.sub==="ko"){const k=G.subT;G.shake=k<.5?8:0;if(Math.random()<.6)addFx("cloud",b.x+rand(-100,100),b.y+rand(-80,80),{r:rand(14,36),dur:.8});if(Math.random()<.3)addFx("star",b.x+rand(-120,120),b.y+rand(-100,100),{dur:.7});b.flash=.7*Math.abs(Math.sin(k*20));if(k>2.6&&!b.ended){b.ended=true;finish(true,"ko");}return;}
   if(G.sub==="over"){h.pt+=dt;if(h.pose==="dead"){h.vy+=GRAV*dt;h.y=Math.min(FLOOR,h.y+h.vy*dt);}}}
 function onAnswer(ok,last){if(last){if(ok){setSub("ko");clearField();supT=0;h.pose="win";b.open=1;SFX.ko();showCard("KNOCKOUT!",ART.C.gold,2.6,50);G.score+=500;return;}
     b.hp=b.max*.1;G.inv=0;hurtHero();if(G.hearts>0){G.inv=1.6;showCard("UP AGAIN!",ART.C.red,1,30);}b.co=phaseGen(phase);b.wait=0;return;}
   b.co=phaseGen(phase);b.wait=0;
   if(ok){b.flash=.6;addText(b.x,b.y-110,"+"+(100),ART.C.gold,30);sup=Math.min(1,sup+1/3);}else{G.inv=0;hurtHero();if(G.hearts<=0)return;G.inv=1.4;}
   const done=G.qi;if(done===p2&&phase<2){nextPhase=2;startTransform();}else if(done===p3&&phase<3){nextPhase=3;startTransform();}}
 function render(t){if(!h)init(sp||G.spec);ctx.drawImage(ART.stage(K),0,0,W,H);
   if(phase>=2)ART.brokenPot(96,92);
   proj.forEach(p=>{if(p.k==="bolt")ART.bolt(p.x,p.y0,p.y1,p.t>p.warn,t);});
   G.fx.forEach(f=>{if(f.k==="mark"){const k=f.t/f.dur;ctx.save();ctx.globalAlpha=.5+.4*Math.sin(t*20);ART.ellipse(f.x,FLOOR-2,14*(1-k*.5),4,ART.C.red,false);ctx.restore();}});
   if(!(G.sub==="ko"&&G.subT>2.2)){const bv={x:b.x,y:b.y,look:b.look,open:b.open,pour:b.pour,tilt:b.tilt,flash:b.flash,hurt:b.hurt>0,glow:b.glow,whistle:b.whistle};if(G.sub==="ko"){bv.tilt=Math.sin(G.subT*18)*.25;bv.open=1;}
     const drawB=()=>ART.withPal(bossPal(),()=>{if(phase===1)ART.baron(bv,t);else if(phase===2)ART.spirit(bv,t);else ART.kettle(bv,t);});if(bv.flash>0)ART.flashLayer(drawB,bv.flash);else drawB();}
   proj.forEach(p=>{if(p.k==="drop")ART.drop(p.x,p.y,p.vx,p.vy);else if(p.k==="cup")ART.teacup(p.x,p.y,p.rot,1.1);else if(p.k==="cube")ART.cube(p.x,p.y,p.rot,t);else if(p.k==="saucer")ART.saucer(p.x,p.yy||p.y,p.pink,p.rot);else if(p.k==="bullet")ART.bullet(p.x,p.y);else if(p.k==="puff")ART.puff(p.x,p.y,p.r,p.pink,.95);else if(p.k==="band")ART.band(p.x,p.y,p.w,p.h,t);else if(p.k==="fwave")ART.floorWave(p.x,t);});
   if(supT>0){const bx=bossBox();ART.stream(h.x+30,h.y-66,bx.x,bx.y,26,t);}
   shots.forEach(q=>ART.bean(q.x,q.y,q.rot));
   ART.withPal(potPal(),()=>{h.trail.forEach(q=>{ctx.save();ctx.globalAlpha=.28*(1-q.t/.22);ART.hero({x:q.x,y:q.y,vx:h.vx,pose:"dash",pt:0,look:h.look,aim:h.aim,dashDir:h.dashDir},t);ctx.restore();});
     const hv={x:h.x,y:h.y,vx:h.vx,pose:h.pose,pt:h.pt,look:h.look,lidPop:h.lidPop,flash:G.heroFlash,aim:h.aim,dashDir:h.dashDir};if(G.inv>0&&h.pose!=="dead"&&h.dashT<=0&&Math.floor(t*14)%2)hv.flash=.5;if(hv.flash>0)ART.flashLayer(()=>ART.hero(hv,t),hv.flash);else ART.hero(hv,t);});
   G.fx.forEach(f=>{if(f.k==="splash"){const k=f.t/f.dur;for(let i=-1;i<=1;i++)ART.circ(f.x+i*10*k*2,f.y-k*14+Math.abs(i)*6,3*(1-k)+1,ART.C.tea,false);}});
   if(G.mode==="title"){ART.textPop(470,320,faceName(0).toUpperCase().slice(0,22),20,ART.C.gold,-.04);}}
 function hud(){ctx.save();const x0=236,x1=596,y=16,hh=14;ctx.fillStyle="#fff";ctx.fillRect(x0,y,x1-x0,hh);const f=clamp(b.hp/b.max,0,1);ctx.fillStyle=phase===2?ART.C.teal:ART.C.red;ctx.fillRect(x1-(x1-x0)*f,y,(x1-x0)*f,hh);ctx.lineWidth=3;ctx.strokeStyle=ART.C.ink;ctx.strokeRect(x0,y,x1-x0,hh);
   marks.forEach(m=>{const mx=x0+(x1-x0)*m.f;ctx.fillStyle=m.done?"#d8c9a6":ART.C.gold;ctx.beginPath();ctx.arc(mx,y+hh+8,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=ART.C.ink;ctx.font="bold 10px Alegreya, serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("?",mx,y+hh+8);});
   ART.star(x0,y+hh+8,8,b.hp<=0?"#d8c9a6":ART.C.gold,0);
   ART.withPal(bossPal(),()=>{for(let i=1;i<=3;i++)ART.miniFace(124+i*28,y+8,i,phase===i);});
   ctx.restore();hudText(x0+2,y+hh+24,"FACE "+phase+" · "+faceName(phase-1).toUpperCase().slice(0,26),"left",12);hudText(x1,y+hh+24,"SCORE "+G.score.toLocaleString(),"right",12);
   for(let i=0;i<G.diff.hearts;i++)heart(26+i*22,26,i<G.hearts);
   for(let i=0;i<3;i++){const on=sup>=(i+1)/3-.001;ctx.save();ctx.translate(26+i*18,48);ART.ellipse(0,0,7,4.5,on?ART.C.pink:"#d8c9a6",true,0,2.5);ctx.restore();}
   hudText(82,49,"SUPER","left",10);
   if(sup>=1&&supT<=0&&!G.touch)hudText(26,68,"Press C!","left",11);}
 return {id:"boss",stick:true,ownHud:true,keysTip:"← → move · ↓ duck · ↑ aim up · Space jump (again on pink = parry) · X dash · C super",tap:"jump",
  buttons(){return [{id:"jump",x:592,y:302,r:32,label:"JUMP",col:ART.C.gold},{id:"dash",x:516,y:322,r:26,label:"DASH",col:ART.C.teal},{id:"duck",x:534,y:256,r:24,label:"DUCK",col:ART.C.brassL,hold:true},{id:"sup",x:604,y:218,r:27,label:"SUPER",col:ART.C.pink,hidden:!(sup>=1&&supT<=0),alpha:.9}];},
  help(s){return ["You are <b>"+esc(gv(s,"hero"))+"</b>. Move with ← →, jump with Space, dash with X, duck with ↓. You shoot by yourself.","Jump again on a <span style='color:#e85d8f;font-weight:700'>pink</span> thing to parry it. Three parries = a SUPER attack (C).","The boss has three faces. Each ? mark on its health bar is a question. Knock out <b>"+esc(faceName(0))+"</b>!"];},
  init(s){init(s);},start,update,idle,onAnswer,render,hud,
  bubbleAt(){return b?{x:b.x-120,y:Math.max(100,b.y-40),dir:1}:null;},heroBubbleAt(){return h?{x:h.x+40,y:h.y-120,dir:-1}:null;},
  resultLines(){return [["Parries",String(parries)],["Boss face",phase+" of 3"],["Hearts left",String(G.hearts)]];}};
})();
