/* ---------------- ART: 1930s rubber-hose cartoon, drawn live ---------------- */
const ART=(()=>{
const C={ink:"#211611",paper:"#f3e7c8",cream:"#fbf4e3",brass:"#c89b3c",brassD:"#8a6322",brassL:"#f2dc92",coffee:"#5b3a21",coffeeL:"#8b5a33",tea:"#a9672f",red:"#b7432d",redD:"#7d2a1c",pink:"#f06c9b",pinkL:"#fbc0d6",teal:"#3f7e78",navy:"#2f3b4e",gold:"#e4b84a",steam:"#f1ece0",steamD:"#cfc5b1",grey:"#8d8378",white:"#fffdf7",porc:"#f6f0e3",blue:"#4a6c9b",shadow:"rgba(60,40,20,.22)"};
let ctx=null;const LW=3;const TAU=Math.PI*2;
function set(c){ctx=c;}
/* ---- line boil: deterministic jitter that changes 12 times a second ---- */
let boilF=0,seed=1;
function boil(t){const f=Math.floor(t*12);if(f!==boilF){boilF=f;seed=(f*7919)%100003+1;}}
function rnd(i){const x=Math.sin(seed*.013+i*12.9898)*43758.5453;return x-Math.floor(x);}
function wobble(i,amt){ctx.translate((rnd(i)-.5)*amt,(rnd(i+1)-.5)*amt);ctx.rotate((rnd(i+2)-.5)*amt*.014);}
/* ---- primitives ---- */
function stroke(w,col){ctx.lineWidth=w||LW;ctx.strokeStyle=col||C.ink;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();}
function ellipse(x,y,rx,ry,fill,outline=true,rot=0,w){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(outline)stroke(w);}
function circ(x,y,r,fill,outline=true,w){ellipse(x,y,r,r,fill,outline,0,w);}
function line(x1,y1,x2,y2,w,col){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);stroke(w,col);}
function curvePath(pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);if(pts.length===2){ctx.lineTo(pts[1][0],pts[1][1]);return;}for(let i=1;i<pts.length-1;i++){const xc=(pts[i][0]+pts[i+1][0])/2,yc=(pts[i][1]+pts[i+1][1])/2;ctx.quadraticCurveTo(pts[i][0],pts[i][1],xc,yc);}const l=pts[pts.length-1];ctx.lineTo(l[0],l[1]);}
function hose(pts,w,inner,iw){curvePath(pts);stroke(w,C.ink);if(inner){curvePath(pts);stroke(iw||w*.5,inner);}}
function tube(pts,w,col){hose(pts,w+LW*2,col,w);}
/* union of ellipses with one shared outline: shapes=[x,y,rx,ry,rot] */
function union(shapes,fill,alpha){ctx.save();if(alpha!==undefined)ctx.globalAlpha=alpha;ctx.fillStyle=C.ink;ctx.beginPath();shapes.forEach(s=>{ctx.moveTo(s[0]+s[2]+LW,s[1]);ctx.ellipse(s[0],s[1],s[2]+LW,s[3]+LW,s[4]||0,0,TAU);});ctx.fill();ctx.fillStyle=fill;ctx.beginPath();shapes.forEach(s=>{ctx.moveTo(s[0]+s[2],s[1]);ctx.ellipse(s[0],s[1],s[2],s[3],s[4]||0,0,TAU);});ctx.fill();ctx.restore();}
function glove(x,y,r,rot,fist){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);const f=r*.42;const sh=fist?[[0,0,r,r*.95,0],[-r*.5,-r*.6,f,f,0],[0,-r*.75,f,f,0],[r*.5,-r*.6,f,f,0],[-r*.95,r*.1,f*.9,f*.9,0]]:[[0,0,r,r*.9,0],[-r*.55,-r*.85,f,f*1.3,-.2],[0,-r*1.05,f,f*1.35,0],[r*.55,-r*.85,f,f*1.3,.2],[-r*1.05,r*.05,f*.9,f*1.1,.6]];union(sh,C.white);line(-r*.25,r*.1,-r*.25,-r*.5,1.5);line(r*.25,r*.1,r*.25,-r*.5,1.5);ctx.beginPath();ctx.rect(-r*.7,r*.55,r*1.4,r*.5);ctx.fillStyle=C.white;ctx.fill();stroke(2.5);ctx.restore();}
function shoe(x,y,w,h,flip){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.beginPath();ctx.moveTo(-w*.5,0);ctx.quadraticCurveTo(-w*.55,-h,-w*.1,-h);ctx.quadraticCurveTo(w*.3,-h*1.05,w*.5,-h*.4);ctx.quadraticCurveTo(w*.55,0,w*.35,0);ctx.closePath();ctx.fillStyle=C.coffee;ctx.fill();stroke();ellipse(-w*.05,-h*.65,w*.18,h*.16,C.coffeeL,false);ctx.restore();}
/* pie-cut eye; look = {x,y} in -1..1; lid 0..1 closes from top with skin colour */
function eye(x,y,rx,ry,look,pr,lid,skin,angry){ellipse(x,y,rx,ry,C.white);const px=x+(look?look.x:0)*rx*.35,py=y+(look?look.y:0)*ry*.3;ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py,pr,-.5,TAU-2.2);ctx.closePath();ctx.fillStyle=C.ink;ctx.fill();if(lid>0){ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx+1,ry+1,0,0,TAU);ctx.clip();ctx.fillStyle=skin||C.brass;ctx.beginPath();ctx.rect(x-rx-3,y-ry-3,rx*2+6,ry*2*lid);ctx.fill();ctx.restore();ctx.beginPath();ctx.moveTo(x-rx,y-ry+ry*2*lid);ctx.lineTo(x+rx,y-ry+ry*2*lid);stroke(2.5);}}
function smile(x,y,w,open,teeth){if(open>0.2){ctx.beginPath();ctx.ellipse(x,y+open*4,w*.5,open*7+2,0,0,TAU);ctx.fillStyle=C.redD;ctx.fill();stroke(2.5);if(teeth){ctx.fillStyle=C.white;ctx.fillRect(x-w*.35,y-open*3,w*.7,3+open*2);}}else{ctx.beginPath();ctx.moveTo(x-w*.5,y-2);ctx.quadraticCurveTo(x,y+w*.45,x+w*.5,y-2);stroke(3);}}
function star(x,y,r,fill,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle=fill||C.gold;ctx.fill();stroke(2);ctx.restore();}
function textPop(x,y,txt,size,fill,rot,font){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.font=(size||26)+"px "+(font||"Limelight, Impact, sans-serif");ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";ctx.lineWidth=Math.max(4,size*.22);ctx.strokeStyle=C.ink;ctx.strokeText(txt,0,0);ctx.fillStyle=fill||C.gold;ctx.fillText(txt,0,0);ctx.restore();}
function bubble(x,y,txt,w,tailDir){ctx.save();ctx.font="15px 'Rum Raisin', 'Alegreya', serif";const words=txt.split(" "),lines=[];let cur="";words.forEach(wd=>{const test=cur?cur+" "+wd:wd;if(ctx.measureText(test).width>w-22&&cur){lines.push(cur);cur=wd;}else cur=test;});if(cur)lines.push(cur);const h=lines.length*18+14;const bx=Math.max(8,Math.min(360-w-8,x-w/2)),by=y-h;ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,w,h,12):ctx.rect(bx,by,w,h);ctx.fillStyle=C.white;ctx.fill();stroke(2.5);ctx.beginPath();const tx=Math.max(bx+16,Math.min(bx+w-16,x));ctx.moveTo(tx-8,by+h-1);ctx.lineTo(tx+(tailDir||0)*10,by+h+12);ctx.lineTo(tx+8,by+h-1);ctx.fillStyle=C.white;ctx.fill();ctx.beginPath();ctx.moveTo(tx-8,by+h);ctx.lineTo(tx+(tailDir||0)*10,by+h+12);ctx.lineTo(tx+8,by+h);stroke(2.5);ctx.fillStyle=C.ink;ctx.textAlign="center";ctx.textBaseline="top";lines.forEach((l,i)=>ctx.fillText(l,bx+w/2,by+8+i*18));ctx.restore();}
/* ---- HERO: the Dallah ---- */
/* h={x,y,vx,pose:'idle'|'shoot'|'parry'|'hurt'|'win'|'dead'|'super',pt (pose time),look{x,y},lidPop,flash} */
function hero(h,t){ctx.save();ctx.translate(h.x,h.y);wobble(1,1.1);ctx.scale(1.12,1.12);
  ellipse(0,2,26,6,C.shadow,false);
  const run=Math.max(-1,Math.min(1,(h.vx||0)/240));const ar=Math.abs(run);
  const dead=h.pose==="dead",hurt=h.pose==="hurt",win=h.pose==="win",sup=h.pose==="super",parry=h.pose==="parry";
  const hop=parry?-Math.sin(Math.min(1,h.pt/.35)*Math.PI)*34:0;
  let sq=1+Math.sin(t*9)*.025;if(h.pose==="shoot")sq=1.04;if(hurt)sq=.9;
  ctx.translate(0,hop);ctx.rotate(run*.16+(hurt?Math.sin(t*40)*.08:0)+(dead?Math.PI/2*Math.min(1,h.pt/.5):0));
  ctx.scale(1/sq,sq);
  /* legs */
  const step=Math.sin(t*24)*ar;const lf=step*9,rf=-step*9;
  hose([[-7,-30],[-9+lf*.5,-16],[-11+lf,-4-Math.max(0,step)*7*ar]],5.5);hose([[7,-30],[9+rf*.5,-16],[11+rf,-4-Math.max(0,-step)*7*ar]],5.5);
  shoe(-12+lf,-Math.max(0,step)*7*ar,24,10,true);shoe(12+rf,-Math.max(0,-step)*7*ar,24,10,false);
  /* back arm (left) */
  const shoot=h.pose==="shoot";let aL=[[-24,-60],[-34,-48],[-38,-36]],gL=[-39,-32,-.3],aR=[[24,-60],[34,-48],[38,-36]],gR=[39,-32,.3];
  if(ar>.3){const s=Math.sin(t*24)*ar;aL=[[-24,-60],[-36,-56+s*8],[-40,-44+s*12]];gL=[-41,-40+s*12,-.5];aR=[[24,-60],[36,-56-s*8],[40,-44-s*12]];gR=[41,-40-s*12,.5];}
  if(shoot){aL=[[-24,-60],[-38,-66],[-40,-80]];gL=[-40,-85,-.4];aR=[[24,-60],[38,-66],[40,-80]];gR=[40,-85,.4];}
  if(win){const s=Math.sin(t*10);aL=[[-24,-60],[-40,-80],[-44,-100+s*6]];gL=[-45,-105+s*6,-.2];aR=[[24,-60],[40,-80],[44,-100-s*6]];gR=[45,-105-s*6,.2];}
  if(sup){aL=[[-24,-60],[-40,-60],[-50,-70]];gL=[-52,-74,-.7];aR=[[24,-60],[40,-60],[50,-70]];gR=[52,-74,.7];}
  if(hurt||dead){aL=[[-24,-60],[-42,-50],[-48,-62]];gL=[-50,-66,-1];aR=[[24,-60],[42,-50],[48,-62]];gR=[50,-66,1];}
  hose(aL,6);glove(gL[0],gL[1],8,gL[2],shoot||win);
  /* spout (left) + handle (right) */
  tube([[-24,-56],[-40,-66],[-45,-88]],5,C.brass);ellipse(-46,-90,5,3.5,C.brassD,true,-.6);
  tube([[24,-74],[44,-62],[25,-44]],4,C.brass);
  /* body */
  const g=ctx.createLinearGradient(-30,-90,30,-30);g.addColorStop(0,C.brassL);g.addColorStop(.45,C.brass);g.addColorStop(1,C.brassD);
  ctx.beginPath();ctx.moveTo(-20,-84);ctx.lineTo(20,-84);ctx.bezierCurveTo(22,-76,15,-74,17,-68);ctx.bezierCurveTo(31,-62,33,-40,22,-30);ctx.quadraticCurveTo(12,-24,0,-25);ctx.quadraticCurveTo(-12,-24,-22,-30);ctx.bezierCurveTo(-33,-40,-31,-62,-17,-68);ctx.bezierCurveTo(-15,-74,-22,-76,-20,-84);ctx.closePath();ctx.fillStyle=g;ctx.fill();stroke();
  ctx.beginPath();ctx.moveTo(-17,-70);ctx.quadraticCurveTo(0,-66,17,-70);stroke(2);
  ctx.beginPath();ctx.moveTo(-23,-44);ctx.quadraticCurveTo(-26,-56,-19,-63);stroke(2.5,"rgba(255,255,255,.55)");
  /* lid */
  const lp=h.lidPop||0;ctx.save();ctx.translate(0,-lp);ctx.beginPath();ctx.moveTo(-23,-84);ctx.lineTo(23,-84);ctx.lineTo(7,-99);ctx.lineTo(-7,-99);ctx.closePath();ctx.fillStyle=C.brassD;ctx.fill();stroke();circ(0,-103,5,C.gold);ctx.restore();
  /* face */
  const look=h.look||{x:0,y:-.4};const blink=(Math.sin(t*1.3)>.985)?1:0;
  if(dead){line(-13,-56,-5,-48,3);line(-5,-56,-13,-48,3);line(5,-56,13,-48,3);line(13,-56,5,-48,3);}
  else{eye(-9.5,-52,7.5,9,look,3.6,hurt?.5:blink,C.brass);eye(9.5,-52,7.5,9,look,3.6,hurt?.5:blink,C.brass);}
  ctx.beginPath();ctx.moveTo(-15,-62);ctx.quadraticCurveTo(-9,-66,-3,-63);stroke(2.5);ctx.beginPath();ctx.moveTo(15,-62);ctx.quadraticCurveTo(9,-66,3,-63);stroke(2.5);
  ellipse(-15,-44,3,2,"rgba(240,110,100,.5)",false);ellipse(15,-44,3,2,"rgba(240,110,100,.5)",false);
  if(hurt||dead){ctx.beginPath();ctx.moveTo(-8,-38);for(let i=0;i<=4;i++)ctx.lineTo(-8+i*4,-38+(i%2?3:-1));stroke(2.5);}
  else if(shoot||sup)smile(0,-38,12,.6,false);else if(win)smile(0,-40,18,.5,true);else smile(0,-40,14,0);
  /* front arm (right) */
  hose(aR,6);glove(gR[0],gR[1],8,gR[2],shoot||win);
  if(h.flash>0){ctx.globalCompositeOperation="source-atop";ctx.fillStyle="rgba(255,255,255,"+Math.min(.85,h.flash)+")";ctx.fillRect(-60,-120,120,130);}
  ctx.restore();
  if(hurt&&!dead){for(let i=0;i<3;i++){const a=t*6+i*2.1;star(h.x+Math.cos(a)*24,h.y-100+Math.sin(a)*6,6,C.gold,a);}}
}
/* ---- BOSS ---- */
function teacup(x,y,rot,s){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(s||1,s||1);ctx.beginPath();ctx.moveTo(-11,-8);ctx.lineTo(11,-8);ctx.quadraticCurveTo(10,8,0,9);ctx.quadraticCurveTo(-10,8,-11,-8);ctx.closePath();ctx.fillStyle=C.porc;ctx.fill();stroke(2.5);ctx.beginPath();ctx.moveTo(11,-5);ctx.quadraticCurveTo(20,-4,18,3);ctx.quadraticCurveTo(16,7,10,5);stroke(2.5);ellipse(0,-8,11,3,C.tea,true,0,2.5);ctx.beginPath();ctx.moveTo(-8,-1);ctx.lineTo(8,-1);stroke(1.5,C.navy);ctx.restore();}
function tophat(x,y,rot,s){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);ctx.beginPath();ctx.rect(-17,-36,34,36);ctx.fillStyle=C.navy;ctx.fill();stroke();ellipse(0,0,30,7,C.navy);ctx.beginPath();ctx.rect(-17,-12,34,7);ctx.fillStyle=C.gold;ctx.fill();stroke(2);ctx.restore();}
/* phase 1: Baron Brew, the posh teapot. b={x,y,tilt,look,open,flash,hurt} */
function baron(b,t){ctx.save();ctx.translate(b.x,b.y);wobble(5,1.4);const br=1+Math.sin(t*3)*.02;ctx.scale(br,1/br);ctx.rotate(b.tilt||0);
  if(b.hurt)ctx.translate(Math.sin(t*50)*3,0);
  tube([[62,-32],[102,-6],[62,24]],7,C.porc);
  tube([[-62,-6],[-94,-34],[-104,-72]],10,C.porc);ellipse(-105,-75,8,5,C.porc,true,-.5);
  if(b.pour>0){ctx.save();ctx.globalAlpha=.9;tube([[-108,-72],[-114,-52],[-118,-30]],5,C.tea);ctx.restore();}
  ellipse(0,0,74,58,C.porc);
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,73,57,0,0,TAU);ctx.clip();ctx.fillStyle=C.navy;ctx.fillRect(-80,-18,160,13);ctx.fillStyle=C.gold;ctx.fillRect(-80,-18,160,2);ctx.fillRect(-80,-7,160,2);ctx.beginPath();ctx.moveTo(-60,20);ctx.quadraticCurveTo(-66,-10,-50,-32);stroke(3,"rgba(255,255,255,.6)");ctx.restore();
  ellipse(0,56,34,7,C.porc);
  ellipse(0,-56,34,11,C.porc);circ(0,-67,9,C.gold);
  tophat(-30,-78,-.28,1);
  /* face */
  const look=b.look||{x:0,y:.4};const lid=b.hurt?.55:0;
  eye(-24,-10,12,15,look,6,lid,C.porc);eye(22,-10,12,15,look,6,lid,C.porc);
  circ(22,-10,18,null,true,3);ctx.save();ctx.strokeStyle=C.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(22,-10,18,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(38,-2);ctx.quadraticCurveTo(52,8,60,26);ctx.stroke();ctx.restore();
  line(-40,-34,-12,-26,4);line(10,-27,38,-36,4);
  union([[-26,14,9,6,.3],[-36,10,7,5,.5],[-44,4,5,4,.6],[26,14,9,6,-.3],[36,10,7,5,-.5],[44,4,5,4,-.6]],C.steamD);
  const open=b.open||0;if(open>.2){ctx.beginPath();ctx.ellipse(0,26+open*4,26,8+open*10,0,0,TAU);ctx.fillStyle=C.redD;ctx.fill();stroke(2.5);ctx.fillStyle=C.white;ctx.fillRect(-18,18,36,5);}else{ctx.beginPath();ctx.moveTo(-24,22);ctx.quadraticCurveTo(0,38,24,22);ctx.quadraticCurveTo(0,26,-24,22);ctx.closePath();ctx.fillStyle=C.ink;ctx.fill();ctx.fillStyle=C.white;ctx.beginPath();ctx.moveTo(-18,23);ctx.quadraticCurveTo(0,30,18,23);ctx.lineTo(18,26);ctx.quadraticCurveTo(0,33,-18,26);ctx.closePath();ctx.fill();}
  hose([[-50,36],[-70,54],[-62,76]],6);glove(-62,80,10,.2,false);
  hose([[52,36],[74,46],[90,34]],6);glove(92,28,10,-.4,false);teacup(96,10,.1,.9);
  if(b.flash>0){ctx.globalCompositeOperation="source-atop";ctx.fillStyle="rgba(255,255,255,"+Math.min(.85,b.flash)+")";ctx.fillRect(-130,-130,260,230);}
  ctx.restore();}
/* the broken pot that stays in the corner after phase 1 */
function brokenPot(x,y){ctx.save();ctx.translate(x,y);ctx.scale(.55,.55);ctx.rotate(.25);tube([[62,-32],[102,-6],[62,24]],7,C.steamD);tube([[-62,-6],[-94,-34],[-104,-72]],10,C.steamD);ellipse(0,0,74,58,C.steamD);line(-20,-50,-5,-10,2.5);line(-5,-10,-18,30,2.5);line(20,-40,34,0,2.5);ellipse(-24,-10,12,15,C.white);line(-30,-16,-18,-4,3);line(-18,-16,-30,-4,3);ellipse(22,-10,12,15,C.white);line(16,-16,28,-4,3);line(28,-16,16,-4,3);ctx.beginPath();ctx.moveTo(-20,24);ctx.quadraticCurveTo(0,14,20,24);stroke(3);ctx.restore();}
/* phase 2: the Steam Spirit. b={x,y,look,open,flash,hurt,wisp} */
function spirit(b,t){ctx.save();ctx.translate(b.x,b.y);wobble(9,2);const sway=Math.sin(t*2.2)*.06;ctx.rotate(sway);if(b.hurt)ctx.translate(Math.sin(t*50)*3,0);
  ctx.globalAlpha=.94;
  /* tail wisps */
  const w=Math.sin(t*3);tube([[0,60],[-30+w*10,100],[-10-w*14,140],[-50,170]],9,C.steam);tube([[20,70],[50,100+w*8],[40,130]],6,C.steam);
  union([[0,0,56,52,0],[-38,12,40,36,0],[38,12,40,36,0],[-22,-42,38,34,0],[24,-44,36,32,0],[0,-72,30,26,0],[-48,-20,22,20,0],[50,-18,22,20,0],[0,52,34,26,0],[-40,52,24,20,0],[36,56,24,20,0]],C.steam);
  ellipse(-30,-50,16,10,"rgba(255,255,255,.7)",false,-.5);ellipse(20,-60,10,7,"rgba(255,255,255,.6)",false,.3);
  /* arms */
  const a=Math.sin(t*3.5);tube([[-56,0],[-86,-6+a*8],[-100,-30+a*10],[-108,-20+a*10]],8,C.steam);tube([[56,0],[86,-6-a*8],[100,-30-a*10],[108,-20-a*10]],8,C.steam);
  /* face */
  ctx.globalAlpha=1;const look=b.look||{x:0,y:.3};
  ellipse(-22,-28,14,19,C.ink);ellipse(22,-28,14,19,C.ink);circ(-22+look.x*4,-30+look.y*4,4,C.white,false);circ(22+look.x*4,-30+look.y*4,4,C.white,false);
  if(b.hurt){ctx.fillStyle=C.steam;ctx.fillRect(-38,-50,32,14);ctx.fillRect(6,-50,32,14);}
  line(-40,-54,-10,-46,5);line(10,-46,40,-54,5);
  const open=b.open||0;ctx.beginPath();ctx.moveTo(-44,6);ctx.quadraticCurveTo(0,22+open*14,44,6);ctx.quadraticCurveTo(0,36+open*18,-44,6);ctx.closePath();ctx.fillStyle=C.ink;ctx.fill();
  ctx.fillStyle=C.white;ctx.beginPath();for(let i=0;i<7;i++){const x0=-40+i*13;ctx.moveTo(x0,8+Math.abs(i-3)*.9);ctx.lineTo(x0+13,8+Math.abs(i-2.5)*.9);ctx.lineTo(x0+6.5,16+open*6);ctx.closePath();}ctx.fill();
  if(b.flash>0){ctx.globalCompositeOperation="source-atop";ctx.fillStyle="rgba(255,255,255,"+Math.min(.85,b.flash)+")";ctx.fillRect(-140,-130,280,320);}
  ctx.restore();}
/* phase 3: the Kettle Kaiser. b={x,y,look,open,flash,hurt,glow,whistle} */
function kettle(b,t){ctx.save();ctx.translate(b.x,b.y);wobble(13,1.6);if(b.hurt)ctx.translate(Math.sin(t*50)*4,0);
  const glow=.35+.25*Math.sin(t*8)+(b.glow||0);const rg=ctx.createRadialGradient(0,30,10,0,30,120);rg.addColorStop(0,"rgba(255,90,40,"+Math.min(.6,glow)+")");rg.addColorStop(1,"rgba(255,90,40,0)");ctx.fillStyle=rg;ctx.fillRect(-130,-90,260,220);
  /* handle arch */
  tube([[-44,-52],[0,-108],[44,-52]],8,C.coffee);
  /* whistle spout */
  tube([[72,-10],[102,-44],[112,-78]],12,C.brassD);circ(114,-82,10,C.brassD);circ(114,-82,4,C.ink,false);
  if(b.whistle>0){ctx.save();ctx.globalAlpha=.8;for(let i=0;i<3;i++){const k=((t*2+i*.33)%1);circ(114+k*30,-90-k*40,6+k*14,C.steam,true,2);}ctx.restore();}
  /* body */
  const g=ctx.createLinearGradient(0,-50,0,50);g.addColorStop(0,C.brass);g.addColorStop(.6,C.brassD);g.addColorStop(1,C.red);
  ctx.beginPath();ctx.moveTo(-52,-46);ctx.lineTo(52,-46);ctx.bezierCurveTo(78,-30,88,20,84,46);ctx.quadraticCurveTo(60,62,0,62);ctx.quadraticCurveTo(-60,62,-84,46);ctx.bezierCurveTo(-88,20,-78,-30,-52,-46);ctx.closePath();ctx.fillStyle=g;ctx.fill();stroke(3.5);
  ctx.beginPath();ctx.moveTo(-70,10);ctx.quadraticCurveTo(-62,-14,-48,-30);stroke(3,"rgba(255,255,255,.4)");
  for(let i=-3;i<=3;i++)circ(i*22,52,2.5,C.ink,false);
  ctx.beginPath();ctx.moveTo(-30,30);ctx.lineTo(-22,40);ctx.lineTo(-34,46);stroke(2.5);ctx.beginPath();ctx.moveTo(60,0);ctx.lineTo(70,14);stroke(2.5);
  ellipse(0,-48,44,11,C.brassD);circ(0,-60,9,C.coffee);
  /* face */
  const look=b.look||{x:0,y:.3};
  ellipse(-28,-6,17,19,C.white);ellipse(28,-6,17,19,C.white);
  [[-28,-6],[28,-6]].forEach(e=>{ctx.beginPath();let r=9;for(let a=0;a<TAU*2.6;a+=.25){r=9-a*1.3;if(r<.5)break;ctx.lineTo(e[0]+look.x*4+Math.cos(a+t*6)*r,e[1]+look.y*3+Math.sin(a+t*6)*r);}stroke(3);});
  if(b.hurt){ctx.fillStyle=C.brassD;ctx.fillRect(-47,-26,38,13);ctx.fillRect(9,-26,38,13);}
  line(-48,-34,-12,-24,5);line(12,-24,48,-34,5);
  const open=b.open===undefined?1:b.open;ctx.beginPath();ctx.ellipse(0,30,30+open*4,6+open*18,0,0,TAU);ctx.fillStyle=C.redD;ctx.fill();stroke(3);
  ctx.fillStyle=C.white;ctx.beginPath();for(let i=0;i<6;i++){const x0=-24+i*8;ctx.rect(x0,18,7,6+open*3);}ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=1.5;ctx.stroke();
  if(open>.4)ellipse(0,40+open*4,12,5+open*3,C.pink);
  /* arms, fists */
  const p=Math.sin(t*7)*4;hose([[-78,20],[-104,16+p],[-110,40]],9);glove(-112,46,12,-.3,true);hose([[78,20],[104,16-p],[110,40]],9);glove(112,46,12,.3,true);
  if(b.flash>0){ctx.globalCompositeOperation="source-atop";ctx.fillStyle="rgba(255,255,255,"+Math.min(.85,b.flash)+")";ctx.fillRect(-140,-130,280,220);}
  ctx.restore();}
/* ---- projectiles ---- */
function bean(x,y,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ellipse(0,0,7,4.5,C.coffee,true,0,2.5);ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(0,2,5,0);stroke(1.5,C.brassL);ctx.restore();}
function drop(x,y,vx,vy){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(vy,vx)-Math.PI/2);ctx.beginPath();ctx.moveTo(0,-12);ctx.quadraticCurveTo(7,-2,6,3);ctx.arc(0,3,6,0,Math.PI,false);ctx.quadraticCurveTo(-7,-2,0,-12);ctx.closePath();ctx.fillStyle=C.tea;ctx.fill();stroke(2.5);ellipse(-2,2,1.6,2.5,"rgba(255,255,255,.6)",false);ctx.restore();}
function cube(x,y,rot,t){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();ctx.rect(-10,-10,20,20);ctx.fillStyle=C.pink;ctx.fill();stroke(2.5);ctx.fillStyle=C.pinkL;ctx.fillRect(-7,-7,7,7);ctx.restore();const k=(t*3)%1;star(x+12,y-12,4+k*2,C.white,t*3);}
function saucer(x,y,pink,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ellipse(0,0,18,7,pink?C.pink:C.porc,true,0,2.5);ellipse(0,-1,9,3,pink?C.pinkL:C.gold,false);ctx.restore();}
function puff(x,y,r,pink,alpha){ctx.save();ctx.globalAlpha=alpha===undefined?1:alpha;union([[0,0,r,r*.85,0],[-r*.7,r*.1,r*.6,r*.55,0],[r*.7,r*.1,r*.6,r*.55,0],[-r*.35,-r*.6,r*.55,r*.5,0],[r*.4,-r*.55,r*.5,r*.45,0]].map(s=>[s[0]+x,s[1]+y,s[2],s[3],0]),pink?C.pink:C.steam);ctx.restore();}
function bullet(x,y){circ(x,y,7,C.ink,false);circ(x-2,y-2,2,"rgba(255,255,255,.7)",false);}
function bolt(x,y0,y1,active,t){ctx.save();if(!active){ctx.setLineDash([6,8]);ctx.globalAlpha=.6+.3*Math.sin(t*20);line(x,y0,x,y1,3,C.red);ctx.restore();return;}
  ctx.beginPath();ctx.moveTo(x,y0);let y=y0;let s=1;while(y<y1){y+=22;ctx.lineTo(x+s*9,Math.min(y,y1));s=-s;}stroke(14,C.ink);ctx.beginPath();ctx.moveTo(x,y0);y=y0;s=1;while(y<y1){y+=22;ctx.lineTo(x+s*9,Math.min(y,y1));s=-s;}stroke(8,C.steam);ctx.restore();}
function wave(y,gapX,gapW,t){ctx.save();const segs=[];for(let x=-10;x<370;x+=22){if(x>gapX-gapW/2-8&&x<gapX+gapW/2+8)continue;segs.push([x,y+Math.sin(x*.3+t*6)*3,13,10,0]);}if(segs.length)union(segs,C.steam);ctx.restore();}
function beam(x,y0,y1,w,t){ctx.save();const g=ctx.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,"rgba(91,58,33,0)");g.addColorStop(.3,C.tea);g.addColorStop(.5,C.brassL);g.addColorStop(.7,C.tea);g.addColorStop(1,"rgba(91,58,33,0)");ctx.fillStyle=g;ctx.fillRect(x-w,y0,w*2,y1-y0);ctx.beginPath();ctx.moveTo(x-w*.6,y1);ctx.lineTo(x-w*.6,y0);ctx.moveTo(x+w*.6,y1);ctx.lineTo(x+w*.6,y0);stroke(3);for(let i=0;i<6;i++){const k=((t*2.5+i*.17)%1);bean(x+Math.sin(i*2+t*9)*w*.4,y1-k*(y1-y0),t*8+i);}ctx.restore();}
/* ---- FX ---- */
function cloud(x,y,r,alpha,col){ctx.save();ctx.globalAlpha=alpha;union([[x,y,r,r*.8,0],[x-r*.8,y+r*.2,r*.6,r*.5,0],[x+r*.8,y+r*.2,r*.6,r*.5,0],[x-r*.3,y-r*.6,r*.5,r*.45,0],[x+r*.4,y-r*.55,r*.5,r*.4,0]],col||C.steam);ctx.restore();}
function spark(x,y,r,rot,col){ctx.save();ctx.translate(x,y);ctx.rotate(rot);for(let i=0;i<4;i++){ctx.rotate(Math.PI/4);line(-r,0,r,0,3,col||C.gold);}ctx.restore();}
/* ---- stage ---- */
let stageCv=null;
function stage(dpr){if(stageCv&&stageCv.dpr===dpr)return stageCv;const cv=document.createElement("canvas");cv.width=360*dpr;cv.height=640*dpr;cv.dpr=dpr;const c=cv.getContext("2d");c.scale(dpr,dpr);const old=ctx;ctx=c;
  const wall=c.createLinearGradient(0,0,0,640);wall.addColorStop(0,"#e9d7ae");wall.addColorStop(.5,"#f3e7c8");wall.addColorStop(1,"#e4cf9f");c.fillStyle=wall;c.fillRect(0,0,360,640);
  c.save();c.globalAlpha=.08;c.strokeStyle=C.ink;c.lineWidth=1;for(let x=-40;x<400;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x+300,600);c.stroke();c.beginPath();c.moveTo(x,0);c.lineTo(x-300,600);c.stroke();}c.restore();
  const spot=c.createRadialGradient(180,180,20,180,200,230);spot.addColorStop(0,"rgba(255,246,210,.85)");spot.addColorStop(1,"rgba(255,246,210,0)");c.fillStyle=spot;c.fillRect(0,0,360,560);
  /* floor */
  c.fillStyle=C.coffee;c.fillRect(0,556,360,84);c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=2;for(let i=0;i<8;i++){c.beginPath();c.moveTo(0,566+i*11);c.lineTo(360,566+i*11);c.stroke();}c.strokeStyle="rgba(255,255,255,.08)";for(let x=20;x<360;x+=60){c.beginPath();c.moveTo(x,556);c.lineTo(x+14,640);c.stroke();}
  c.fillStyle=C.gold;c.fillRect(0,552,360,8);c.strokeStyle=C.ink;c.lineWidth=3;c.beginPath();c.moveTo(0,552);c.lineTo(360,552);c.moveTo(0,560);c.lineTo(360,560);c.stroke();
  /* footlights */
  for(let x=30;x<360;x+=60){const fg=c.createRadialGradient(x,632,2,x,632,26);fg.addColorStop(0,"rgba(255,240,170,.9)");fg.addColorStop(1,"rgba(255,240,170,0)");c.fillStyle=fg;c.fillRect(x-30,600,60,40);circ(x,636,7,C.brassL);}
  /* curtains */
  function drape(x0,w,h,dir){const g=c.createLinearGradient(x0,0,x0+w,0);g.addColorStop(0,dir>0?C.redD:C.red);g.addColorStop(.5,C.red);g.addColorStop(1,dir>0?C.red:C.redD);c.beginPath();c.moveTo(x0,0);c.lineTo(x0+w,0);c.lineTo(x0+w*(dir>0?.55:1),h*.55);c.quadraticCurveTo(x0+w*(dir>0?.5:.9),h,x0+w*(dir>0?.2:.75),h);c.lineTo(x0+w*(dir>0?0:.45),h*.55);c.closePath();c.fillStyle=g;c.fill();c.lineWidth=3;c.strokeStyle=C.ink;c.stroke();c.save();c.clip();c.strokeStyle="rgba(0,0,0,.25)";c.lineWidth=2;for(let i=1;i<5;i++){c.beginPath();c.moveTo(x0+i*w/5,0);c.quadraticCurveTo(x0+i*w/5+(dir>0?-14:14),h*.5,x0+w*(dir>0?.2:.75)+(i-2.5)*4,h);c.stroke();}c.restore();}
  drape(0,70,300,1);drape(290,70,300,-1);
  /* tassel ropes */
  c.strokeStyle=C.gold;c.lineWidth=4;c.beginPath();c.moveTo(0,172);c.quadraticCurveTo(30,180,40,190);c.stroke();c.beginPath();c.moveTo(360,172);c.quadraticCurveTo(330,180,320,190);c.stroke();circ(42,196,6,C.gold);circ(318,196,6,C.gold);
  /* valance */
  c.beginPath();c.moveTo(0,0);c.lineTo(360,0);c.lineTo(360,30);for(let x=360;x>=0;x-=36){c.quadraticCurveTo(x-18,56,x-36,30);}c.closePath();c.fillStyle=C.red;c.fill();c.lineWidth=3;c.strokeStyle=C.ink;c.stroke();c.fillStyle=C.gold;c.fillRect(0,0,360,5);for(let x=18;x<360;x+=36)circ(x,46,4,C.gold);
  ctx=old;stageCv=cv;return cv;}
/* ---- film post-processing ---- */
let grainCv=null;
function grain(){if(grainCv)return grainCv;const cv=document.createElement("canvas");cv.width=cv.height=256;const c=cv.getContext("2d");const img=c.createImageData(256,256);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()<.5?40:0;}c.putImageData(img,0,0);grainCv=cv;return cv;}
let vigCv=null;
function vignette(dpr){if(vigCv&&vigCv.dpr===dpr)return vigCv;const cv=document.createElement("canvas");cv.width=360*dpr;cv.height=640*dpr;cv.dpr=dpr;const c=cv.getContext("2d");c.scale(dpr,dpr);const g=c.createRadialGradient(180,320,180,180,320,420);g.addColorStop(0,"rgba(40,20,10,0)");g.addColorStop(1,"rgba(40,20,10,.55)");c.fillStyle=g;c.fillRect(0,0,360,640);vigCv=cv;return cv;}
function film(dpr,t,low){ctx.save();ctx.setTransform(1,0,0,1,0,0);const W=360*dpr,H=640*dpr;
  if(!low){ctx.globalAlpha=.16;const g=grain();const ox=Math.floor(Math.random()*256),oy=Math.floor(Math.random()*256);ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();const s=Math.max(1,dpr*.75);for(let y=-oy*s;y<H;y+=256*s)for(let x=-ox*s;x<W;x+=256*s)ctx.drawImage(g,x,y,256*s,256*s);ctx.restore();ctx.globalAlpha=1;ctx.drawImage(vignette(dpr),0,0);
    ctx.globalCompositeOperation="multiply";ctx.fillStyle="rgba(235,205,150,.35)";ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation="source-over";
    if(Math.random()<.04){ctx.globalAlpha=.18;ctx.fillStyle="#2a1a10";ctx.fillRect(Math.random()*W,0,1.5*dpr,H);}
    if(Math.random()<.05){ctx.globalAlpha=.06;ctx.fillStyle="#fff8e0";ctx.fillRect(0,0,W,H);}
  }
  ctx.restore();}
return {C,set,boil,wobble,ellipse,circ,line,hose,tube,union,glove,shoe,eye,smile,star,textPop,bubble,hero,baron,brokenPot,spirit,kettle,teacup,bean,drop,cube,saucer,puff,bullet,bolt,wave,beam,cloud,spark,stage,film,stroke};
})();
