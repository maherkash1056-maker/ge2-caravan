/* ===================== GENRE: PENALTY SHOOTOUT ===================== */
MODS.penalty=(()=>{let S=null,sp=null;const GX0=204,GX1=436,GY0=150,GY1=234,SPOT={x:320,y:300};
 function init(s){sp=s;S={phase:"title",kick:0,you:0,them:0,log:[],marker:{x:320,y:190},mt:0,ball:{x:SPOT.x,y:SPOT.y,r:9,rot:0},keeper:{x:320,pose:"ready",pt:0,dive:0,big:0},striker:{pose:"idle",pt:0,x:262,y:352},shot:null,res:null,t0:0,power:false,maxKicks:5,extra:0};}
 function start(s){sp=s;init(s);S.maxKicks=G.qs.length;S.phase="walk";S.t0=0;}
 function resetBall(){S.ball={x:SPOT.x,y:SPOT.y,r:9,rot:0};S.keeper={x:320,pose:"ready",pt:0,dive:0,big:S.keeper?S.keeper.big:0};S.striker={pose:"idle",pt:0,x:262,y:352};S.shot=null;S.res=null;}
 function nextKick(){if(S.kick>=S.maxKicks){if(S.you!==S.them||S.extra>=3){endMatch();return;}S.extra++;S.maxKicks++;showCard("SUDDEN DEATH!",ART.C.red,1.2,34);}
   resetBall();S.phase="walk";S.t0=0;}
 function endMatch(){S.phase="end";const won=S.you>S.them;if(won){SFX.crowd();showCard("CHAMPIONS!",ART.C.gold,1.6,40);}else{SFX.groan();showCard(S.you===S.them?"A DRAW!":"THEY WIN…",ART.C.red,1.6,36);}G.score+=S.you*200;setSub("over");setTimeout(()=>finish(won,"match"),1700);}
 function update(dt,inp){S.t0+=dt;S.keeper.pt+=dt;S.striker.pt+=dt;const kp=S.keeper;
   if(S.phase==="walk"){if(S.t0>.7){S.phase="ask";askQuestion({title:"KICK "+(S.kick+1)+(S.extra?" · SUDDEN DEATH":"")});}return;}
   if(S.phase==="aim"){S.mt+=dt*(S.power?.9:1.45);const k=(S.mt%2)<1?(S.mt%1):1-(S.mt%1);S.marker.x=GX0+18+k*(GX1-GX0-36);S.marker.y=S.my+Math.sin(S.mt*2.3)*12;
     kp.x=320+Math.sin(S.t0*2.2)*14*(1+kp.big);
     if(inp.act||inp.jump||S.t0>5){shoot();}return;}
   if(S.phase==="shot"){const sh=S.shot;sh.t+=dt;const k=Math.min(1,sh.t/sh.dur);const e=1-Math.pow(1-k,2);S.ball.x=SPOT.x+(sh.tx-SPOT.x)*e;S.ball.y=SPOT.y+(sh.ty-SPOT.y)*e-Math.sin(k*Math.PI)*18;S.ball.r=9-k*3.5;S.ball.rot+=dt*14;
     if(sh.t>sh.react&&kp.pose!=="dive"){kp.pose="dive";kp.pt=0;kp.dive=sh.side;}
     if(kp.pose==="dive"){const dk=Math.min(1,kp.pt/.28);kp.x=320+kp.dive*78*dk;}
     if(k>=1){const reach=(S.power?40:70)*(1+kp.big*.3);const saved=Math.abs(kp.x-sh.tx)<reach&&kp.pose==="dive"&&kp.dive!==0||(kp.dive===0&&Math.abs(sh.tx-320)<reach);
       S.phase="result";S.t0=0;S.res=saved?"save":"goal";
       if(saved){S.ball.vx=(sh.tx<320?-1:1)*160;S.ball.vy=-120;SFX.groan();showCard("SAVED!",ART.C.red,1,40);say(tauntOf(sp,S.kick%3));S.log.push(0);S.striker.pose="sad";S.striker.pt=0;}
       else{S.you++;SFX.crowd();showCard("GOAL!",ART.C.gold,1,48);heroSay(pick(["GOAL!","Yesss!","Top corner!","Easy!"]));S.log.push(1);G.score+=200;S.striker.pose="win";S.striker.pt=0;addFx("burst",sh.tx,sh.ty,{dur:.6,col:ART.C.gold});G.shake=4;}}
     return;}
   if(S.phase==="result"){if(S.res==="save"){S.ball.x+=S.ball.vx*dt;S.ball.y+=S.ball.vy*dt;S.ball.vy+=400*dt;}
     if(S.t0>1.3){S.phase="theirs";S.t0=0;const p=G.diffKey==="simple"?.5:.62;const sc=Math.random()<p;S.theirs=sc;if(sc){S.them++;}showCard(sc?"THEIR KICK: GOAL":"THEIR KICK: SAVED!",sc?ART.C.red:ART.C.teal,1.1,26);if(sc)SFX.groan();else SFX.crowd();}return;}
   if(S.phase==="theirs"){if(S.t0>1.3){S.kick++;nextKick();}return;}}
 function shoot(){const kp=S.keeper;S.phase="shot";S.t0=0;SFX.kick();S.striker.pose="kick";S.striker.pt=0;
   const tx=S.marker.x,ty=S.marker.y;const side=Math.abs(tx-320)<34?0:(tx<320?-1:1);
   const guessRight=Math.random()<(S.power?.35:.8);let dive=guessRight?side:pick([-1,0,1].filter(v=>v!==side));
   S.shot={tx,ty,t:0,dur:.42,react:S.power?.24:.12,side:dive};kp.pose="ready";}
 function onAnswer(ok){S.power=ok;S.keeper.big=ok?0:1;S.phase="aim";S.t0=0;S.mt=Math.random()*2;S.my=rand(GY0+18,GY1-14);
   if(ok){showCard("POWER SHOT!",ART.C.gold,.8,32);}else{showCard("THE KEEPER GROWS!",ART.C.red,.9,28);say(pick(["Ha! Now I'm huge!",tauntOf(sp,0)]));}}
 function idle(dt){if(S){S.keeper.pt+=dt;S.striker.pt+=dt;}}
 function render(t){if(!S)init(sp||G.spec);const s=G.spec;
   ART.stadium(K,t,s.kit,s.keeperKit);
   ART.goal(GX0,GY0,GX1,GY1,t,S.res==="goal"&&S.t0<.6?2:0);
   const kp=S.keeper;const ksc=.82*(1+kp.big*.28);
   ART.person({x:kp.x,y:GY1+2,pose:kp.pose,pt:kp.pt,diveDir:kp.dive||1,kit:s.keeperKit||"#2c3e50",kit2:s.keeperKit||"#2c3e50",keeper:true,glove:"#2ecc71",num:1,hair:"short",skin:"#d9a27a",scale:ksc,look:{x:(S.ball.x-kp.x)/200,y:.3}},t);
   if(S.phase==="aim"){ctx.save();const m=S.marker;ctx.strokeStyle=S.power?ART.C.gold:ART.C.red;ctx.lineWidth=4;ctx.beginPath();ctx.arc(m.x,m.y,13,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(m.x-20,m.y);ctx.lineTo(m.x+20,m.y);ctx.moveTo(m.x,m.y-20);ctx.lineTo(m.x,m.y+20);ctx.stroke();ctx.restore();}
   const st=S.striker;ART.person({x:st.x,y:st.y,pose:st.pose,pt:st.pt,kit:s.kit||"#c0392b",kit2:s.kit2||"#fbf4e3",hair:s.hair,hijab:s.hijab,skin:s.skin,num:s.num||"10",back:st.pose!=="win"&&st.pose!=="sad",scale:1.15,look:{x:.2,y:-.6}},t);
   ART.ball(S.ball.x,S.ball.y,S.ball.r,S.ball.rot);
   if(G.mode==="play"&&S.phase==="aim")hudText(W/2,H-14,G.touch?"Tap to SHOOT when the target is in a good place!":"Press SPACE or click to SHOOT!","center",15);}
 function hud(){const n=Math.max(S.maxKicks,5);ctx.save();const x0=300;hudText(x0,22,"YOU "+S.you+" – "+S.them+" "+(gv(G.spec,"enemy")).toUpperCase().slice(0,14),"left",15);
   for(let i=0;i<n;i++){const v=S.log[i];ctx.beginPath();ctx.arc(x0+8+i*16,42,5.5,0,7);ctx.fillStyle=v===1?ART.C.teal:v===0?ART.C.red:"#fff";ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=ART.C.ink;ctx.stroke();}ctx.restore();}
 return {id:"penalty",stick:false,noHearts:true,keysTip:"Space or click = shoot",tap:"act",
  buttons(){return [{id:"act",x:584,y:300,r:38,label:"SHOOT",col:ART.C.gold,hidden:!(S&&S.phase==="aim")}];},
  help(s){return ["You are <b>"+esc(gv(s,"hero"))+"</b>. Before every kick there is a question.","Right answer: a slow target and a slow keeper. Wrong answer: the keeper gets bigger and faster.","Press SPACE, click or tap SHOOT when the target is in a good place. Beat <b>"+esc(gv(s,"enemy"))+"</b>!"];},
  init,start,update,idle,onAnswer,render,hud,
  bubbleAt(){return {x:S?S.keeper.x:320,y:GY0-10,dir:0};},heroBubbleAt(){return {x:300,y:250,dir:0};},
  resultLines(){return [["Goals",S.you+" – "+S.them]];}};
})();
