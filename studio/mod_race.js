/* ===================== GENRE: RACE ===================== */
MODS.race=(()=>{let S=null,sp=null;const HX=170,HY=322,RY=286,GAP=1800,START=900;
 function vehicle(kind,o,t){if(kind==="car")ART.car(Object.assign({num:o.num},o),t);
   else if(kind==="runner")ART.person({x:o.x,y:o.y,pose:o.air?"jump":"run",pt:.25,kit:o.color,kit2:o.kit2||"#fbf4e3",hair:o.hair,hijab:o.hijab,skin:o.skin,num:o.num,scale:o.scale||1,look:{x:.8,y:0}},t);
   else ART.camel(o,t);}
 function init(s){sp=s;S={dist:300,rdist:330,v:0,y:0,vy:0,air:false,boxes:[],obs:[],boostT:0,slowT:0,stumbleT:0,finish:6000,done:false,rivalDone:false,endT:0,next:0,trail:[]};}
 function start(s){sp=s;const n=G.qs.length;S={dist:0,rdist:40,v:260,y:0,vy:0,air:false,boxes:[],obs:[],boostT:0,slowT:0,stumbleT:0,finish:START+(n-1)*GAP+1500,done:false,rivalDone:false,endT:0,tauntT:6,rv:0};
   for(let i=0;i<n;i++)S.boxes.push({x:START+i*GAP,taken:false});
   const kind=sp.vehicle==="car"?"barrier":"rock";
   for(let x=START+520;x<S.finish-250;x+=rand(520,760)){const nearBox=S.boxes.some(b=>Math.abs(b.x-x)<300);if(!nearBox)S.obs.push({x,kind,hit:false});}}
 function update(dt,inp){const spd=G.diff.spd;
   if(inp.jump||inp.act||inp.up){if(!S.air&&S.stumbleT<=0){S.vy=-640;S.air=true;SFX.jump();addFx("poof",HX-10,HY,{r:10,dur:.3});}}
   S.boostT=Math.max(0,S.boostT-dt);S.slowT=Math.max(0,S.slowT-dt);S.stumbleT=Math.max(0,S.stumbleT-dt);
   let target=260;if(S.boostT>0)target=410;if(S.slowT>0)target=140;if(S.stumbleT>0)target=90;
   S.v+=(target-S.v)*Math.min(1,dt*4);S.dist+=S.v*dt;
   if(S.air){S.vy+=1800*dt;S.y+=S.vy*dt;if(S.y>=0){S.y=0;S.vy=0;S.air=false;}}
   const rbase=G.diffKey==="simple"?248:266;S.rv=rbase+Math.sin(G.playT*.7)*8;S.rdist+=S.rv*dt;
   /* obstacles */
   for(const o of S.obs){if(o.hit)continue;const dx=o.x-S.dist;if(dx<26&&dx>-22&&-S.y<30){o.hit=true;S.stumbleT=.8;S.slowT=0;addFx("star",HX+10,HY-60,{dur:.7});addText(HX,HY-110,"OUCH!",ART.C.red,24);hurt();}}
   /* question boxes */
   for(const b of S.boxes){if(!b.taken&&S.dist>=b.x-14){b.taken=true;addFx("burst",HX+20,HY-70,{dur:.5,col:ART.C.gold});askQuestion();return;}}
   /* taunts */
   S.tauntT-=dt;if(S.tauntT<=0){S.tauntT=rand(7,10);say(tauntOf(sp,Math.floor(rand(0,3))));}
   /* finish */
   if(!S.rivalDone&&S.rdist>=S.finish){S.rivalDone=true;if(S.dist<S.finish){showCard(gv(sp,"enemy").toUpperCase()+" WINS!",ART.C.red,1.4,30);SFX.groan();setSub("over");setTimeout(()=>finish(false,"rival"),1500);return;}}
   if(S.dist>=S.finish&&!S.done){S.done=true;SFX.crowd();showCard("YOU WIN THE RACE!",ART.C.gold,1.6,32);heroSay("Yes!");G.score+=500+Math.max(0,Math.round((S.dist-S.rdist)));setSub("over");setTimeout(()=>finish(true,"race"),1700);}}
 function idle(dt){if(!S)return;if(G.mode==="title"){S.dist+=120*dt;S.rdist+=125*dt;}}
 function onAnswer(ok){if(ok){S.boostT=2.4;S.slowT=0;SFX.boost();showCard("BOOST!",ART.C.gold,.7,36);heroSay(pick(["Wooo!","Yalla!","See you!","Too easy!"]));}else{S.slowT=2.4;SFX.groan();showCard("SLOW…",ART.C.red,.7,34);say(pick(["Ha! Bye bye!","Thanks for waiting!",tauntOf(sp,1)]));}}
 function render(t){if(!S)init(sp||G.spec);const s=G.spec;const kind=s.vehicle||"camel";
   ART.desert(K,t,S.dist,s.tod||"day");
   const sx=x=>HX+(x-S.dist);
   if(sx(S.finish)>-40&&sx(S.finish)<700){ART.finishLine(sx(S.finish));ART.flag(sx(S.finish)+24,252,t);}
   for(const o of S.obs){const x=sx(o.x);if(x<-40||x>700)continue;if(o.kind==="barrier")ART.barrier(x,HY);else ART.rock(x,HY,1);}
   const rx=HX+(S.rdist-S.dist);const rOpts={x:rx,y:RY,color:s.rivalCol||"#8b5a2b",saddle:"#2c3e50",tassel:"#ecf0f1",run:1,dist:S.rdist,num:"9",scale:.86,kit2:"#2c3e50",hair:"short",skin:"#d9a27a",look:{x:.6,y:0}};
   if(rx>-120&&rx<760)vehicle(kind,rOpts,t+.37);
   for(const b of S.boxes){if(b.taken)continue;const x=sx(b.x);if(x>-40&&x<700)ART.qbox(x,HY-70,t,1);}
   if(S.boostT>0){ART.speedLines(HX-30,HY-20,t,5);}
   if(S.slowT>0&&Math.random()<.3)addFx("poof",HX-50,HY-20,{r:8,dur:.5});
   const fl=G.inv>0&&Math.floor(t*14)%2;const hOpts={x:HX,y:HY+S.y,color:s.heroCol||"#d9a35a",saddle:s.kit||"#c0392b",run:S.stumbleT>0?.3:1,dist:S.dist,num:s.num||"7",kit2:s.kit2,hair:s.hair,hijab:s.hijab,skin:s.skin,air:S.air,look:{x:.8,y:0}};
   if(fl){ctx.save();ctx.globalAlpha=.55;vehicle(kind,hOpts,t);ctx.restore();}else vehicle(kind,hOpts,t);
   if(G.mode==="play"){/* rival off-screen arrow */if(rx>660){ctx.save();ART.textPop(600,RY-80,gv(s,"enemy")+" ▶ "+Math.round((S.rdist-S.dist)/10)+" m",14,ART.C.red,0);ctx.restore();}else if(rx<-60){ART.textPop(70,RY-80,"◀ "+Math.round((S.dist-S.rdist)/10)+" m",14,ART.C.teal,0);}}}
 function hud(){const x0=230,x1=600,y=22;ctx.save();ctx.fillStyle="#fff";ctx.fillRect(x0,y-5,x1-x0,10);ctx.lineWidth=2.5;ctx.strokeStyle=ART.C.ink;ctx.strokeRect(x0,y-5,x1-x0,10);
   const px=d=>x0+(x1-x0)*clamp(d/S.finish,0,1);ctx.fillStyle=ART.C.red;ctx.beginPath();ctx.arc(px(S.rdist),y,6,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=ART.C.gold;ctx.beginPath();ctx.arc(px(S.dist),y,7,0,7);ctx.fill();ctx.stroke();
   S.boxes.forEach(b=>{ctx.fillStyle=b.taken?"#d8c9a6":ART.C.teal;ctx.fillRect(px(b.x)-2,y-9,4,4);});ctx.restore();
   hudText(x0,y+18,"YOU",'left',12);hudText(x1,y+18,"FINISH · Q "+Math.min(G.qi+1,G.qs.length)+"/"+G.qs.length,'right',12);}
 return {id:"race",stick:false,noHearts:false,keysTip:"Space or ↑ = jump",tap:"jump",
  buttons(){return [{id:"jump",x:584,y:300,r:36,label:"JUMP",col:ART.C.gold}];},
  help(s){const v=s.vehicle==="car"?"car":s.vehicle==="runner"?"runner":"camel";return ["Your "+v+", <b>"+esc(gv(s,"hero"))+"</b>, runs by itself.","Jump (space bar, ↑ or the JUMP button) over "+(s.vehicle==="car"?"barriers":"rocks")+". Each hit costs a heart.","Reach the finish line before <b>"+esc(gv(s,"enemy"))+"</b>!"];},
  init,start,update,idle,onAnswer,render,hud,
  bubbleAt(){const rx=HX+(S.rdist-S.dist);return {x:clamp(rx,110,540),y:RY-100,dir:0};},heroBubbleAt(){return {x:HX+20,y:HY-120,dir:0};},
  resultLines(won){return [["Distance",Math.round(Math.min(S.dist,S.finish)/10)+" m of "+Math.round(S.finish/10)],["Hearts left",String(G.hearts)]];}};
})();
