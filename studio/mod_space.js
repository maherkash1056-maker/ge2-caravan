/* ===================== GENRE: SPACE SHOOTER ===================== */
MODS.space=(()=>{let S=null,sp=null;
 function init(s){sp=s;S={x:120,y:180,vx:0,vy:0,dist:0,shots:[],foes:[],rocks:[],eshots:[],big:null,bigDone:0,bigNext:6,spawnT:1,rockT:3,fireT:0,beam:0,tauntT:5,done:false,kills:0};}
 function start(s){init(s);S.total=G.qs.length;}
 function spawnBig(){S.big={x:760,y:180,hp:1,state:"in",t:0,flash:0};SFX.whistle();showCard("BIG SHIP!",ART.C.red,.8,34);}
 function update(dt,inp){const spd=G.diff.spd;S.dist+=120*dt;
   /* ship */
   const ax=inp.mxr||inp.mx,ay=inp.myr||inp.my;S.vx+=(ax*270-S.vx)*Math.min(1,dt*10);S.vy+=(ay*270-S.vy)*Math.min(1,dt*10);S.x=clamp(S.x+S.vx*dt,40,400);S.y=clamp(S.y+S.vy*dt,52,330);
   S.fireT-=dt;if(S.fireT<=0&&!S.beam){S.fireT=.2;S.shots.push({x:S.x+34,y:S.y});SFX.laser();}
   for(const b of S.shots)b.x+=720*dt;S.shots=S.shots.filter(b=>b.x<680&&!b.dead);
   /* small foes and rocks (paused while a big ship is on screen) */
   if(!S.big){S.spawnT-=dt;if(S.spawnT<=0){S.spawnT=rand(.9,1.5)/spd;S.foes.push({x:680,y:rand(60,320),ph:rand(0,6),v:rand(120,170)*spd,hp:1});}
     S.rockT-=dt;if(S.rockT<=0){S.rockT=rand(2.4,3.6)/spd;S.rocks.push({x:690,y:rand(70,320),r:rand(16,26),v:rand(70,110)*spd,rot:0,hp:3});}
     S.bigNext-=dt;if(S.bigNext<=0&&S.bigDone<S.total)spawnBig();}
   for(const f of S.foes){f.x-=f.v*dt;f.ph+=dt*3;f.y+=Math.sin(f.ph)*60*dt;}
   for(const r of S.rocks){r.x-=r.v*dt;r.rot+=dt;}
   for(const e of S.eshots){e.x+=e.vx*dt;e.y+=e.vy*dt;}
   /* hits */
   for(const b of S.shots){for(const f of S.foes){if(!f.dead&&Math.hypot(b.x-f.x,b.y-f.y)<22){f.dead=true;b.dead=true;S.kills++;G.score+=20;addFx("boom",f.x,f.y,{dur:.45,r:22});SFX.hit();}}
     for(const r of S.rocks){if(!r.dead&&Math.hypot(b.x-r.x,b.y-r.y)<r.r+4){b.dead=true;r.hp--;addFx("spark",b.x,b.y,{rot:rand(0,3)});if(r.hp<=0){r.dead=true;G.score+=30;addFx("boom",r.x,r.y,{dur:.5,r:r.r+6});SFX.boom();}}}}
   const hitShip=(x,y,rr)=>Math.hypot(x-S.x,(y-S.y)*1.4)<rr+18;
   for(const f of S.foes){if(!f.dead&&hitShip(f.x,f.y,14)){f.dead=true;addFx("boom",f.x,f.y,{dur:.45,r:22});if(hurt())addText(S.x,S.y-40,"OUCH!",ART.C.red,22);}}
   for(const r of S.rocks){if(!r.dead&&hitShip(r.x,r.y,r.r-4)){r.dead=true;addFx("boom",r.x,r.y,{dur:.5,r:r.r+6});if(hurt())addText(S.x,S.y-40,"OUCH!",ART.C.red,22);}}
   for(const e of S.eshots){if(!e.dead&&hitShip(e.x,e.y,10)){e.dead=true;if(hurt())addText(S.x,S.y-40,"OUCH!",ART.C.red,22);}}
   S.foes=S.foes.filter(f=>!f.dead&&f.x>-40);S.rocks=S.rocks.filter(r=>!r.dead&&r.x>-50);S.eshots=S.eshots.filter(e=>!e.dead&&e.x>-30&&e.x<680&&e.y>-30&&e.y<390);
   /* big ship */
   const B=S.big;if(B){B.t+=dt;B.flash=Math.max(0,B.flash-dt*2);
     if(B.state==="in"){B.x+=(520-B.x)*Math.min(1,dt*2.5);B.y=180+Math.sin(B.t*1.5)*20;if(B.t>1.4){B.state="wait";B.t=0;say(tauntOf(sp,S.bigDone%3));askQuestion({title:"BIG SHIP "+(S.bigDone+1)+" OF "+S.total});}}
     else if(B.state==="beam"){S.beam=Math.max(0,S.beam-dt);B.flash=.6;if(B.t>.25&&Math.random()<.5)addFx("spark",B.x+rand(-50,50),B.y+rand(-20,20),{rot:rand(0,3)});if(B.t>.9){B.state="boom";B.t=0;SFX.boom();G.shake=10;for(let i=0;i<6;i++)addFx("boom",B.x+rand(-70,70),B.y+rand(-30,30),{dur:.7,r:36});G.score+=300;}}
     else if(B.state==="boom"){if(B.t>.5){S.big=null;S.bigDone++;nextBig();}}
     else if(B.state==="fire"){if(B.t>.35&&!B.fired){B.fired=true;const a=Math.atan2(S.y-B.y,S.x-(B.x-90));for(let j=-1;j<=1;j++)S.eshots.push({x:B.x-90,y:B.y+10,vx:Math.cos(a+j*.18)*330,vy:Math.sin(a+j*.18)*330});SFX.shoot();}
       if(B.t>1.1){B.state="leave";B.t=0;}}
     else if(B.state==="leave"){B.x+=300*dt;if(B.x>780){S.big=null;S.bigDone++;nextBig();}}}
   S.tauntT-=dt;if(S.tauntT<=0&&!B){S.tauntT=rand(8,11);say(tauntOf(sp,Math.floor(rand(0,3))));}}
 function nextBig(){if(S.bigDone>=S.total&&!S.done){S.done=true;SFX.crowd();showCard("SECTOR CLEAR!",ART.C.gold,1.6,36);heroSay("Mission complete!");G.score+=300+G.hearts*100;setSub("over");setTimeout(()=>finish(true,"clear"),1700);}else S.bigNext=rand(7,9);}
 function onAnswer(ok){const B=S.big;if(!B)return;B.t=0;if(ok){B.state="beam";S.beam=.9;SFX.super();showCard("SUPER LASER!",ART.C.gold,.8,34);heroSay(pick(["Take that!","Bye bye, goblin!","Grammar power!"]));}
   else{B.state="fire";B.fired=false;SFX.groan();showCard("SHIELDS DOWN!",ART.C.red,.8,32);G.inv=0;}}
 function idle(dt){if(S)S.dist+=60*dt;}
 function render(t){if(!S)init(sp||G.spec);const s=G.spec;
   ART.space(K,t,S.dist);
   for(const r of S.rocks)ART.asteroid(r.x,r.y,r.r,r.rot);
   for(const f of S.foes)ART.saucerFoe(f.x,f.y,t,s.foeCol);
   if(S.big)ART.mothership({x:S.big.x,y:S.big.y,color:s.foeCol||"#16a085",label:gv(s,"enemy").toUpperCase().slice(0,24),hurt:S.big.flash>0},t);
   for(const e of S.eshots){ART.circ(e.x,e.y,7,"#ff6b6b",true,2);}
   for(const b of S.shots)ART.laser(b.x-14,b.y,b.x+6,b.y,3,s.shipAcc||"#f1c40f");
   if(S.beam>0&&S.big)ART.laser(S.x+30,S.y,S.big.x-60,S.big.y,10+Math.sin(t*40)*3,"#ff5e5e");
   const fl=G.inv>0&&Math.floor(t*14)%2;ctx.save();if(fl)ctx.globalAlpha=.5;ART.ship({x:S.x,y:S.y,vy:S.vy,color:s.shipCol||"#e74c3c",accent:s.shipAcc||"#f1c40f",boost:Math.abs(S.vx)>40},t);ctx.restore();
   if(G.mode==="title"){ART.mothership({x:520,y:170,color:s.foeCol||"#16a085",label:gv(s,"enemy").toUpperCase().slice(0,24)},t);}}
 function hud(){hudText(620,22,"BIG SHIPS "+Math.min(S.bigDone,S.total)+" / "+S.total,"right",14);}
 return {id:"space",stick:true,noHearts:false,keysTip:"Arrow keys = fly · lasers fire by themselves",tap:"act",
  buttons(){return [];},
  help(s){return ["You are <b>"+esc(gv(s,"hero"))+"</b>. Fly with the arrow keys (or the stick on a phone). Your lasers fire by themselves.","Shoot the small ships, dodge the rocks. Each hit costs a heart.","When a big ship arrives, answer the question. Defeat <b>"+esc(gv(s,"enemy"))+"</b>!"];},
  init,start,update,idle,onAnswer,render,hud,
  bubbleAt(){return S&&S.big?{x:clamp(S.big.x-60,120,540),y:S.big.y-70,dir:0}:{x:520,y:110,dir:0};},heroBubbleAt(){return {x:S.x+20,y:S.y-30,dir:0};},
  resultLines(){return [["Small ships destroyed",String(S.kills)],["Big ships",Math.min(S.bigDone,S.total)+" / "+S.total],["Hearts left",String(G.hearts)]];}};
})();
