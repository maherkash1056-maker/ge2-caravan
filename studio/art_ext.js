/* ===== STUDIO ART: people, camels, cars, footballs, spaceships, scenes ===== */
function shade(hex,amt){const n=parseInt(String(hex).slice(1),16);if(isNaN(n))return hex;let r=n>>16&255,g=n>>8&255,b=n&255;const f=amt<0?0:255,a=Math.abs(amt);r=Math.round(r+(f-r)*a);g=Math.round(g+(f-g)*a);b=Math.round(b+(f-b)*a);return "#"+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function withPal(over,fn){const saved={};for(const k in over){saved[k]=C[k];C[k]=over[k];}try{fn();}finally{for(const k in saved)C[k]=saved[k];}}
function blob(pts,fill,w){curvePath(pts.concat([pts[0],pts[1]]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}stroke(w||LW);}
function kgloves(x,y,r,col,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);union([[0,0,r,r*.92,0],[-r*.55,-r*.75,r*.42,r*.5,-.2],[0,-r*.95,r*.42,r*.52,0],[r*.55,-r*.75,r*.42,r*.5,.2],[-r*1.02,0,r*.4,r*.48,.5]],col);ctx.beginPath();ctx.rect(-r*.75,r*.55,r*1.5,r*.55);ctx.fillStyle=shade(col,-.25);ctx.fill();stroke(2.5);ctx.restore();}
/* a rubber-hose person, feet at y=0. p={x,y,dir,kit,kit2,skin,hair:'short'|'hijab'|'curly',hijab,num,pose,pt,look,keeper,glove,back,scale} */
function person(p,t){ctx.save();ctx.translate(p.x,p.y);wobble(21,1);const sc=p.scale||1;ctx.scale((p.dir||1)*sc,sc);
  const pose=p.pose||"idle",pt=p.pt||0,kit=p.kit||"#c0392b",kit2=p.kit2||"#fbf4e3",skin=p.skin||"#c98e5f",look=p.look||{x:.4,y:0};
  if(pose!=="dive")ellipse(0,2,22,5,C.shadow,false);
  let rot=0,lift=0;
  if(pose==="dive"){const k=Math.min(1,pt/.28);rot=(p.diveDir||1)*k*1.25;lift=-k*26;}
  if(pose==="jump"){lift=-Math.sin(Math.min(1,pt/.5)*Math.PI)*30;}
  if(pose==="win")lift=-Math.abs(Math.sin(t*8))*10;
  ctx.translate(0,lift);ctx.translate(0,-50);ctx.rotate(rot);ctx.translate(0,50);
  const bob=pose==="idle"||pose==="ready"?Math.sin(t*4)*1.2:0;
  const bend=pose==="ready"?8:0;
  /* legs */
  const sw=pose==="run"?Math.sin(t*15):0;
  let L=[[-6,-34+bend],[-7-bend+sw*9,-18+bend*.5],[-8-bend*1.4+sw*15,-4-Math.max(0,sw)*7]],R=[[6,-34+bend],[7+bend-sw*9,-18+bend*.5],[8+bend*1.4-sw*15,-4-Math.max(0,-sw)*7]];
  if(pose==="kick"){const k=Math.min(1,pt/.16),back=pt<.16?k:1;R=[[6,-34],[14+back*8,-22-back*4],[22+back*16,-14-back*16]];L=[[-6,-34],[-8,-18],[-8,-4]];}
  if(pose==="dive"){L=[[-6,-34],[-10,-20],[-16,-10]];R=[[6,-34],[10,-22],[18,-14]];}
  hose(L,6,kit2,2.5);hose(R,6,kit2,2.5);
  const lfx=L[2][0],lfy=L[2][1],rfx=R[2][0],rfy=R[2][1];
  shoe(lfx-3,lfy+4,20,9,true);shoe(rfx+3,rfy+4,20,9,false);
  ctx.save();ctx.beginPath();ctx.rect(-12,-23,8,6);ctx.rect(4,-23,8,6);ctx.fillStyle=kit;ctx.fill();ctx.restore();
  ctx.translate(0,bob);
  /* shorts */
  ctx.beginPath();ctx.moveTo(-15,-46+bend);ctx.lineTo(15,-46+bend);ctx.lineTo(16,-30+bend);ctx.lineTo(2,-30+bend);ctx.lineTo(0,-35+bend);ctx.lineTo(-2,-30+bend);ctx.lineTo(-16,-30+bend);ctx.closePath();ctx.fillStyle=kit2;ctx.fill();stroke(3);
  /* back arm */
  let aL=[[-15,-68],[-24,-56],[-27,-44]],aR=[[15,-68],[24,-56],[27,-44]];
  if(pose==="run"){aL=[[-15,-68],[-24-sw*6,-58],[-26-sw*10,-48]];aR=[[15,-68],[24+sw*6,-58],[26+sw*10,-48]];}
  if(pose==="ready"){aL=[[-15,-66],[-30,-62],[-38,-52]];aR=[[15,-66],[30,-62],[38,-52]];}
  if(pose==="win"||pose==="dive"||pose==="jump"){const w=Math.sin(t*10)*4;aL=[[-15,-68],[-24,-84],[-26,-100+w]];aR=[[15,-68],[24,-84],[26,-100-w]];}
  if(pose==="sad"){aL=[[-15,-66],[-19,-52],[-18,-40]];aR=[[15,-66],[19,-52],[18,-40]];}
  if(pose==="kick"){aL=[[-15,-68],[-30,-66],[-38,-58]];aR=[[15,-68],[26,-74],[34,-82]];}
  const hand=(a,flip)=>{const e=a[2];if(p.keeper)kgloves(e[0],e[1],9,p.glove||"#2ecc71",flip?-.3:.3);else glove(e[0],e[1],7,flip?-.3:.3,false);};
  hose(aL,5.5,kit,2.5);hand(aL,true);
  /* hijab drape (behind the shirt top) */
  const hy=-88;
  if(p.hair==="hijab"){ctx.beginPath();ctx.moveTo(-17,hy+4);ctx.quadraticCurveTo(-22,-64,-14,-60);ctx.lineTo(14,-60);ctx.quadraticCurveTo(22,-64,17,hy+4);ctx.closePath();ctx.fillStyle=p.hijab||"#2c3e50";ctx.fill();stroke(3);}
  /* shirt */
  ctx.beginPath();ctx.moveTo(-17,-70);ctx.quadraticCurveTo(0,-74,17,-70);ctx.lineTo(15,-44+bend);ctx.quadraticCurveTo(0,-41+bend,-15,-44+bend);ctx.closePath();ctx.fillStyle=kit;ctx.fill();stroke(3);
  ctx.save();ctx.beginPath();ctx.moveTo(-17,-70);ctx.quadraticCurveTo(0,-74,17,-70);ctx.lineTo(15,-44+bend);ctx.quadraticCurveTo(0,-41+bend,-15,-44+bend);ctx.closePath();ctx.clip();ctx.fillStyle=shade(kit,-.18);ctx.fillRect(-17,-74,7,40);ctx.restore();
  if(p.num!==undefined&&p.num!==""){ctx.font="bold 13px 'Rum Raisin', Impact, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=kit2;ctx.lineWidth=3;ctx.strokeStyle=C.ink;ctx.save();ctx.scale(p.dir||1,1);ctx.strokeText(String(p.num),0,-56);ctx.fillText(String(p.num),0,-56);ctx.restore();}
  if(p.hair==="hijab"){ctx.beginPath();ctx.moveTo(-12,-71);ctx.quadraticCurveTo(0,-62,12,-71);ctx.lineTo(9,-74);ctx.quadraticCurveTo(0,-68,-9,-74);ctx.closePath();ctx.fillStyle=p.hijab||"#2c3e50";ctx.fill();stroke(2.5);}
  /* head */
  ctx.save();ctx.translate(0,hy);
  if(p.hair==="hijab"){ellipse(0,0,20,21,p.hijab||"#2c3e50");ellipse(0,3,14,15,skin);
    ctx.beginPath();ctx.moveTo(-14,-6);ctx.quadraticCurveTo(0,-14,14,-6);stroke(2,shade(p.hijab||"#2c3e50",-.3));}
  else{ellipse(0,0,17,18,skin);ellipse(-17,2,3.5,5,skin);ellipse(17,2,3.5,5,skin);
    if(p.hair==="curly"){union([[-10,-13,7,6,0],[0,-16,7,6,0],[10,-13,7,6,0],[-14,-5,5,5,0],[14,-5,5,5,0]],p.hairCol||"#2b1a10");}
    else{ctx.beginPath();ctx.moveTo(-17,-2);ctx.quadraticCurveTo(-18,-20,0,-20);ctx.quadraticCurveTo(18,-20,17,-2);ctx.lineTo(12,-7);ctx.lineTo(7,-4);ctx.lineTo(2,-8);ctx.lineTo(-4,-4);ctx.lineTo(-9,-8);ctx.lineTo(-13,-4);ctx.closePath();ctx.fillStyle=p.hairCol||"#2b1a10";ctx.fill();stroke(2.5);}}
  if(!p.back){const blink=Math.sin(t*1.5+(p.num||0))>.985?1:0;const sad=pose==="sad";
    eye(-6.5,2,5,6.5,look,2.6,sad?.45:blink,skin);eye(6.5,2,5,6.5,look,2.6,sad?.45:blink,skin);
    ellipse(-10,11,2.6,1.6,"rgba(230,110,90,.5)",false);ellipse(10,11,2.6,1.6,"rgba(230,110,90,.5)",false);
    if(sad){ctx.beginPath();ctx.moveTo(-5,15);ctx.quadraticCurveTo(0,10,5,15);stroke(2.5);}
    else if(pose==="win"||pose==="kick")smile(0,12,11,.5,true);else smile(0,12,10,0);}
  else if(p.hair!=="hijab"){ctx.beginPath();ctx.arc(0,0,17,Math.PI*.15,Math.PI*.85,true);ctx.closePath();ctx.fillStyle=p.hairCol||"#2b1a10";ctx.fill();stroke(2.5);}
  ctx.restore();
  hose(aR,5.5,kit,2.5);hand(aR,false);
  ctx.restore();}
function ball(x,y,r,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);circ(0,0,r,C.white,true,2.5);ctx.save();ctx.beginPath();ctx.arc(0,0,r-1,0,TAU);ctx.clip();ctx.fillStyle=C.ink;
  const pent=(cx,cy,s)=>{ctx.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5;ctx.lineTo(cx+Math.cos(a)*s,cy+Math.sin(a)*s);}ctx.closePath();ctx.fill();};
  pent(0,0,r*.38);for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5+TAU/10;pent(Math.cos(a)*r*.95,Math.sin(a)*r*.95,r*.3);}ctx.restore();ctx.restore();}
function goal(x0,y0,x1,y1,t,ripple){ctx.save();const w=x1-x0,h=y1-y0;
  ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(x0,y0,w,h);ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=1;
  for(let i=1;i<14;i++){const xx=x0+w*i/14+(ripple?Math.sin(t*30+i)*ripple:0);ctx.beginPath();ctx.moveTo(xx,y0);ctx.lineTo(xx,y1);ctx.stroke();}
  for(let j=1;j<7;j++){const yy=y0+h*j/7;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy);ctx.stroke();}
  const post=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);stroke(9,C.ink);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);stroke(5,C.white);};
  post(x0,y1+2,x0,y0);post(x0,y0,x1,y0);post(x1,y0,x1,y1+2);ctx.restore();}
function stadium(dpr,t,kitA,kitB){const c=ctx;
  const sky=c.createLinearGradient(0,0,0,120);sky.addColorStop(0,"#7ec8e3");sky.addColorStop(1,"#cfeaf2");c.fillStyle=sky;c.fillRect(0,0,640,130);
  c.fillStyle="#5d4b6b";c.fillRect(0,46,640,84);
  const cols=[kitA||"#c0392b",kitB||"#2980b9","#f1c40f","#ecf0f1","#e67e22"];
  for(let row=0;row<5;row++)for(let i=0;i<64;i++){const x=i*10+(row%2)*5,y=56+row*14;const j=Math.sin(t*6+i*1.7+row)>.6?-2:0;c.fillStyle=cols[(i*7+row*3)%cols.length];c.beginPath();c.arc(x,y+j,3.4,0,TAU);c.fill();c.fillStyle="#e0b48a";c.beginPath();c.arc(x,y-5+j,2.6,0,TAU);c.fill();}
  c.fillStyle=C.ink;c.fillRect(0,126,640,4);
  for(let i=0;i<8;i++){c.fillStyle=i%2?"#f1c40f":"#c0392b";c.fillRect(i*80,130,80,14);}c.fillStyle=C.ink;c.fillRect(0,144,640,3);
  const g=c.createLinearGradient(0,147,0,360);g.addColorStop(0,"#5fae4a");g.addColorStop(1,"#3f8f34");c.fillStyle=g;c.fillRect(0,147,640,213);
  for(let i=0;i<7;i++){if(i%2)continue;c.fillStyle="rgba(255,255,255,.07)";c.beginPath();c.moveTo(320+(i-3.5)*60,147);c.lineTo(320+(i-2.5)*60,147);c.lineTo(320+(i-2.5)*160,360);c.lineTo(320+(i-3.5)*160,360);c.closePath();c.fill();}
  c.strokeStyle="rgba(255,255,255,.85)";c.lineWidth=3;c.beginPath();c.moveTo(90,214);c.lineTo(550,214);c.lineTo(600,330);c.moveTo(90,214);c.lineTo(40,330);c.stroke();
  c.beginPath();c.moveTo(200,170);c.lineTo(440,170);c.stroke();c.beginPath();c.ellipse(320,300,7,3,0,0,TAU);c.fillStyle="#fff";c.fill();}
function desert(dpr,t,dist,tod){const c=ctx;const night=tod==="night",sunset=tod==="sunset";
  const sky=c.createLinearGradient(0,0,0,230);sky.addColorStop(0,night?"#141b3a":sunset?"#e9805a":"#7cc2e8");sky.addColorStop(1,night?"#3b3f6b":sunset?"#f8d07a":"#f6e6bd");c.fillStyle=sky;c.fillRect(0,0,640,240);
  if(night){c.fillStyle="#fff";for(let i=0;i<50;i++){c.globalAlpha=.4+.4*Math.sin(t*2+i);c.fillRect((i*137)%640,(i*53)%150,2,2);}c.globalAlpha=1;circ(520,60,22,"#f4f1de",true,2.5);}
  else circ(520,70,sunset?34:26,sunset?"#ffcf6b":"#fff1a8",true,3);
  const dune=(base,amp,col,speed,wl)=>{c.beginPath();c.moveTo(0,240);for(let x=0;x<=640;x+=16){c.lineTo(x,base+Math.sin((x+dist*speed)/wl)*amp+Math.sin((x+dist*speed)/(wl*.47))*amp*.4);}c.lineTo(640,240);c.closePath();c.fillStyle=col;c.fill();c.lineWidth=2.5;c.strokeStyle=C.ink;c.stroke();};
  dune(170,14,night?"#5a4b6e":sunset?"#d98a4e":"#e7c27d",.08,90);dune(196,10,night?"#6e5a62":sunset?"#e7a35f":"#efcf8f",.2,70);
  c.fillStyle=night?"#6b5d55":"#e9c58a";c.fillRect(0,232,640,128);c.fillStyle=C.ink;c.fillRect(0,230,640,3);
  c.fillStyle=night?"#7a6a5f":"#d9b277";c.fillRect(0,252,640,88);c.fillStyle=C.ink;c.fillRect(0,250,640,2.5);c.fillRect(0,338,640,2.5);
  c.fillStyle="rgba(255,255,255,.7)";for(let x=-((dist*1)%80);x<640;x+=80)c.fillRect(x,294,40,4);
  c.fillStyle="rgba(90,60,30,.25)";for(let i=0;i<30;i++){const x=((i*97-dist*1)%660+660)%660-10,y=256+(i*31)%80;c.fillRect(x,y,3,2);}}
function space(dpr,t,dist){const c=ctx;const g=c.createLinearGradient(0,0,0,360);g.addColorStop(0,"#0b1026");g.addColorStop(1,"#1d1446");c.fillStyle=g;c.fillRect(0,0,640,360);
  const layer=(n,sp,sz,a)=>{c.fillStyle="rgba(255,255,255,"+a+")";for(let i=0;i<n;i++){const x=((i*173-dist*sp)%680+680)%680-20,y=(i*97)%360;c.fillRect(x,y,sz,sz);}};
  layer(70,.15,1.5,.5);layer(40,.4,2,.7);layer(18,1,2.5,.95);
  const px=((560-dist*.05)%900+900)%900-120;circ(px,90,46,"#e07a5f",true,3);ctx.save();ctx.beginPath();ctx.arc(px,90,45,0,TAU);ctx.clip();ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(px-50,95,100,50);ctx.restore();ellipse(px,92,70,12,null,true,-.2,3);
  circ(((120-dist*.08)%800+800)%800-80,280,20,"#81b29a",true,2.5);}
/* side-view camel facing right, feet at y=0 */
function camel(o,t){ctx.save();ctx.translate(o.x,o.y);wobble(31,1.1);const s=o.scale||1;ctx.scale(s,s);const col=o.color||"#d9a35a",dark=shade(col,-.25),run=o.run===undefined?1:o.run;
  ellipse(0,2,46,7,C.shadow,false);const ph=t*(8+run*6),a=Math.sin(ph)*run,b=Math.sin(ph+Math.PI)*run;
  const leg=(x,sw,back)=>{hose([[x,-44],[x+sw*10,-22],[x+sw*16-(back?2:0),-4]],7,back?dark:col,4);ellipse(x+sw*16,-1,6,4,C.ink,false);};
  leg(-26,b,true);leg(22,a,true);
  tube([[-40,-56],[-50,-46],[-52,-30]],2.5,dark);
  ellipse(0,-56,40,20,col);union([[-6,-74,20,16,0]],col);ctx.beginPath();ctx.moveTo(-36,-56);ctx.quadraticCurveTo(0,-40,36,-58);stroke(2,dark);
  ctx.beginPath();ctx.moveTo(-22,-80);ctx.quadraticCurveTo(-6,-98,12,-80);ctx.lineTo(16,-64);ctx.lineTo(-26,-64);ctx.closePath();ctx.fillStyle=o.saddle||"#c0392b";ctx.fill();stroke(3);
  for(let i=0;i<4;i++){const tx=-22+i*12;line(tx,-64,tx+Math.sin(ph+i)*2,-56,2.5,o.tassel||"#f1c40f");circ(tx+Math.sin(ph+i)*2,-55,2.5,o.tassel||"#f1c40f",false);}
  leg(-20,a,false);leg(28,b,false);
  tube([[32,-62],[48,-76],[52,-100]],9,col);
  ctx.save();ctx.translate(58,-104);ctx.rotate(.08*Math.sin(ph));ellipse(6,2,20,11,col);ellipse(20,5,8,7,shade(col,.1));circ(23,3,1.8,C.ink,false);ellipse(-6,-9,4,6,dark,true,-.4);
  eye(2,-2,5,6,o.look||{x:.6,y:0},2.6,0,col);ctx.beginPath();ctx.moveTo(14,10);ctx.quadraticCurveTo(20,14,26,9);stroke(2.5);
  line(-10,4,24,-3,2,o.saddle||"#c0392b");ctx.restore();
  if(o.label){ctx.font="bold 12px 'Rum Raisin', Impact, sans-serif";ctx.textAlign="center";ctx.fillStyle=C.ink;ctx.fillText(o.label,-4,-118);}
  ctx.restore();}
/* side-view cartoon car facing right, wheels on y=0 */
function car(o,t){ctx.save();ctx.translate(o.x,o.y);wobble(33,1);const s=o.scale||1;ctx.scale(s,s);const col=o.color||"#e74c3c",dark=shade(col,-.3);
  ellipse(0,2,58,7,C.shadow,false);const spin=(o.dist||0)/14,bump=Math.sin(t*30)*(o.run||0)*1.2;ctx.translate(0,bump);
  ctx.beginPath();ctx.moveTo(-60,-14);ctx.lineTo(-62,-34);ctx.quadraticCurveTo(-60,-44,-46,-46);ctx.lineTo(-30,-48);ctx.quadraticCurveTo(-18,-70,6,-70);ctx.quadraticCurveTo(26,-70,34,-50);ctx.lineTo(54,-44);ctx.quadraticCurveTo(66,-40,64,-24);ctx.lineTo(62,-14);ctx.closePath();ctx.fillStyle=col;ctx.fill();stroke(3.5);
  ctx.beginPath();ctx.moveTo(-24,-48);ctx.quadraticCurveTo(-14,-64,2,-64);ctx.lineTo(2,-48);ctx.closePath();ctx.fillStyle="#bfe3f2";ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(8,-64);ctx.quadraticCurveTo(22,-64,28,-50);ctx.lineTo(8,-48);ctx.closePath();ctx.fillStyle="#bfe3f2";ctx.fill();stroke(2.5);
  eye(13,-56,5,6.5,o.look||{x:.8,y:0},2.6,0,"#bfe3f2");eye(22,-55,4.2,6,o.look||{x:.8,y:0},2.3,0,"#bfe3f2");
  ctx.beginPath();ctx.moveTo(48,-30);ctx.quadraticCurveTo(56,-22,64,-30);stroke(2.5);ctx.fillStyle=C.white;ctx.fillRect(51,-30,10,3);
  circ(58,-38,4,"#fff6b0",true,2);circ(-58,-36,3.5,"#ff6b6b",true,2);
  ctx.fillStyle=dark;ctx.fillRect(-56,-26,116,5);
  if(o.num!==undefined){circ(-22,-30,10,C.white,true,2.5);ctx.font="bold 12px 'Rum Raisin', Impact, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=C.ink;ctx.fillText(String(o.num),-22,-29);}
  const wheel=(x)=>{circ(x,-12,14,"#2d2d2d",true,3);circ(x,-12,7,"#bdc3c7",true,2);ctx.save();ctx.translate(x,-12);ctx.rotate(spin);for(let i=0;i<3;i++){ctx.rotate(TAU/3);line(0,0,0,-7,2,C.ink);}ctx.restore();};
  wheel(-36);wheel(38);
  if(o.run>0.2){for(let i=0;i<3;i++){const k=((t*3+i*.33)%1);cloud(-70-k*30,-12-k*8,5+k*7,.6*(1-k),"#cfc4b1");}}
  ctx.restore();}
function rock(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s||1,s||1);union([[0,-12,18,13,0],[-12,-7,10,8,0],[12,-6,9,7,0]],"#9c8f84");ellipse(-4,-16,5,3,"rgba(255,255,255,.35)",false);ctx.restore();}
function barrier(x,y){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(-22,-30,44,14);ctx.fillStyle="#f1c40f";ctx.fill();stroke(3);ctx.save();ctx.beginPath();ctx.rect(-22,-30,44,14);ctx.clip();ctx.fillStyle=C.ink;for(let i=-3;i<4;i++){ctx.beginPath();ctx.moveTo(i*12,-30);ctx.lineTo(i*12+8,-30);ctx.lineTo(i*12,-16);ctx.lineTo(i*12-8,-16);ctx.closePath();ctx.fill();}ctx.restore();line(-16,-16,-16,0,4);line(16,-16,16,0,4);ctx.restore();}
function qbox(x,y,t,s){ctx.save();ctx.translate(x,y+Math.sin(t*4)*4);ctx.scale(s||1,s||1);const gl=ctx.createRadialGradient(0,0,4,0,0,34);gl.addColorStop(0,"rgba(255,230,120,.7)");gl.addColorStop(1,"rgba(255,230,120,0)");ctx.fillStyle=gl;ctx.fillRect(-36,-36,72,72);
  ctx.rotate(Math.sin(t*3)*.08);ctx.beginPath();ctx.rect(-16,-16,32,32);ctx.fillStyle=C.gold;ctx.fill();stroke(3);ctx.fillStyle=shade(C.gold,-.2);ctx.fillRect(-16,8,32,8);ctx.beginPath();ctx.rect(-16,-16,32,32);stroke(3);
  ctx.font="22px Limelight, Impact, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=C.ink;ctx.fillText("?",0,-1);ctx.restore();}
function flag(x,y,t){ctx.save();ctx.translate(x,y);line(0,0,0,-120,5);ctx.beginPath();ctx.moveTo(0,-120);for(let i=0;i<=8;i++){ctx.lineTo(i*7,-120+Math.sin(t*6+i*.8)*3);}for(let i=8;i>=0;i--){ctx.lineTo(i*7,-90+Math.sin(t*6+i*.8)*3);}ctx.closePath();ctx.save();ctx.clip();for(let r=0;r<3;r++)for(let q=0;q<6;q++){ctx.fillStyle=(r+q)%2?C.ink:C.white;ctx.fillRect(q*10,-122+r*11,10,11);}ctx.restore();stroke(2.5);ctx.restore();}
function finishLine(x){ctx.save();for(let r=0;r<9;r++)for(let q=0;q<2;q++){ctx.fillStyle=(r+q)%2?C.ink:C.white;ctx.fillRect(x+q*10,252+r*10,10,10);}ctx.restore();}
/* spaceship facing right */
function ship(o,t){ctx.save();ctx.translate(o.x,o.y);wobble(41,1);const col=o.color||"#e74c3c",acc=o.accent||"#f1c40f";const tilt=(o.vy||0)/900;ctx.rotate(tilt);
  const fl=6+Math.sin(t*40)*3+(o.boost?10:0);ctx.beginPath();ctx.moveTo(-30,-7);ctx.lineTo(-44-fl*1.6,0);ctx.lineTo(-30,7);ctx.closePath();ctx.fillStyle="#ffb347";ctx.fill();stroke(2.5);ctx.beginPath();ctx.moveTo(-30,-4);ctx.lineTo(-38-fl,0);ctx.lineTo(-30,4);ctx.closePath();ctx.fillStyle="#fff3b0";ctx.fill();
  ctx.beginPath();ctx.moveTo(-14,-12);ctx.lineTo(-30,-28);ctx.lineTo(-6,-14);ctx.closePath();ctx.fillStyle=acc;ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(-14,12);ctx.lineTo(-30,28);ctx.lineTo(-6,14);ctx.closePath();ctx.fillStyle=acc;ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(-32,-12);ctx.quadraticCurveTo(10,-20,34,0);ctx.quadraticCurveTo(10,20,-32,12);ctx.closePath();ctx.fillStyle=col;ctx.fill();stroke(3);
  ctx.save();ctx.beginPath();ctx.moveTo(-32,-12);ctx.quadraticCurveTo(10,-20,34,0);ctx.quadraticCurveTo(10,20,-32,12);ctx.closePath();ctx.clip();ctx.fillStyle=shade(col,-.22);ctx.fillRect(-34,4,70,20);ctx.restore();
  circ(4,-2,9,"#bfe3f2",true,2.5);eye(1,-3,3.5,4.5,{x:.8,y:0},1.8,0,"#bfe3f2");eye(8,-3,3,4.2,{x:.8,y:0},1.6,0,"#bfe3f2");
  if(o.shield){ctx.globalAlpha=.35+.15*Math.sin(t*10);ellipse(0,0,44,30,"#7fd8ff",true,0,2);ctx.globalAlpha=1;}
  ctx.restore();}
function saucerFoe(x,y,t,col){ctx.save();ctx.translate(x,y+Math.sin(t*5+x*.05)*3);wobble(43,1);ellipse(0,-6,11,9,"#bfe3f2");ellipse(0,2,24,8,col||"#8e44ad");for(let i=-2;i<=2;i++)circ(i*9,4,2.2,"#f1c40f",false);eye(-4,-6,3,3.6,{x:-.8,y:.3},1.6,0,"#bfe3f2");eye(4,-6,3,3.6,{x:-.8,y:.3},1.6,0,"#bfe3f2");line(-8,-12,-2,-10,2);line(8,-12,2,-10,2);ctx.restore();}
function asteroid(x,y,r,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);union([[0,0,r,r*.85,0],[r*.5,-r*.3,r*.5,r*.45,0],[-r*.5,r*.35,r*.45,r*.4,0]],"#8d8378");circ(-r*.3,-r*.2,r*.18,"#6f665c",true,1.5);circ(r*.3,r*.3,r*.13,"#6f665c",true,1.5);ctx.restore();}
function mothership(o,t){ctx.save();ctx.translate(o.x,o.y);wobble(47,1.4);const col=o.color||"#8e44ad";if(o.hurt)ctx.translate(Math.sin(t*50)*3,0);
  ellipse(10,-24,40,26,"#bfe3f2");ellipse(0,0,80,26,col);ctx.save();ctx.beginPath();ctx.ellipse(0,0,79,25,0,0,TAU);ctx.clip();ctx.fillStyle=shade(col,-.25);ctx.fillRect(-80,6,160,30);ctx.restore();
  for(let i=-3;i<=3;i++)circ(i*20,8,4,Math.sin(t*8+i)>0?"#f1c40f":"#e67e22",true,1.5);
  eye(-2,-28,8,10,{x:-.8,y:.4},4,0,"#bfe3f2");eye(20,-28,8,10,{x:-.8,y:.4},4,0,"#bfe3f2");line(-12,-42,4,-36,4);line(30,-42,14,-36,4);
  ctx.beginPath();ctx.moveTo(-6,-14);ctx.quadraticCurveTo(10,-20,26,-14);stroke(3);
  tube([[-70,6],[-96,10]],6,"#7f8c8d");tube([[-60,18],[-86,26]],6,"#7f8c8d");
  if(o.label){ctx.font="bold 13px 'Rum Raisin', Impact, sans-serif";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.strokeText(o.label,0,-58);ctx.fillText(o.label,0,-58);}
  ctx.restore();}
function laser(x0,y0,x1,y1,w,col){ctx.save();ctx.lineCap="round";ctx.strokeStyle=col||"#ff5e5e";ctx.globalAlpha=.35;ctx.lineWidth=w*2.4;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=w*.4;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.restore();}
function boom(x,y,k,s){ctx.save();ctx.translate(x,y);const r=(s||30)*(.4+k);ctx.globalAlpha=1-k;union([[0,0,r,r,0],[r*.7,-r*.3,r*.6,r*.6,0],[-r*.6,-r*.4,r*.55,r*.55,0],[0,r*.6,r*.5,r*.5,0]],k<.3?"#fff3b0":k<.6?"#ffb347":"#e74c3c");ctx.restore();}
function speedLines(x,y,t,n){ctx.save();ctx.strokeStyle="rgba(33,22,17,.45)";ctx.lineWidth=2.5;for(let i=0;i<(n||5);i++){const k=((t*4+i*.21)%1);ctx.beginPath();ctx.moveTo(x-20-k*60,y-50+i*18);ctx.lineTo(x-50-k*60,y-50+i*18);ctx.stroke();}ctx.restore();}
