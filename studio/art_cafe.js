/* ===== STUDIO ART 2: modest people in long robes, the Omani café, the sweet shop ===== */
const cl01=v=>v<0?0:v>1?1:v;
function lum(hex){const n=parseInt(String(hex||"").slice(1),16);if(isNaN(n))return .5;return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)/255;}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function label(txt,x,y,size,col,align,font){ctx.save();ctx.font=(size||13)+"px "+(font||"'Rum Raisin', Impact, sans-serif");ctx.textAlign=align||"center";ctx.textBaseline="middle";ctx.fillStyle=col||C.ink;ctx.fillText(txt,x,y);ctx.restore();}
/* ---------- a person in a long robe (abaya or dishdasha), feet at y=0, about 112 tall ---------- */
function rpath(sw){ctx.beginPath();ctx.moveTo(-15,-72);ctx.quadraticCurveTo(-19,-38,-23+sw,-6);ctx.quadraticCurveTo(0,-1,23+sw,-6);ctx.quadraticCurveTo(19,-38,15,-72);ctx.quadraticCurveTo(0,-77,-15,-72);ctx.closePath();}
const ARMS={down:[[[-14,-68],[-19,-55],[-20,-41]],[[14,-68],[19,-55],[20,-41]]],
 hold:[[[-14,-68],[-21,-57],[-9,-49]],[[14,-68],[21,-57],[9,-49]]],
 pour:[[[-14,-68],[-23,-58],[-17,-45]],[[14,-68],[24,-60],[23,-46]]],
 up:[[[-14,-68],[-25,-82],[-27,-99]],[[14,-68],[25,-82],[27,-99]]],
 hips:[[[-14,-68],[-28,-58],[-17,-47]],[[14,-68],[28,-58],[17,-47]]],
 write:[[[-14,-68],[-21,-58],[-7,-52]],[[14,-68],[21,-58],[6,-56]]],
 wave:[[[-14,-68],[-19,-55],[-20,-41]],[[14,-68],[25,-80],[27,-96]]]};
function smallHeart(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(0,5);ctx.bezierCurveTo(-8,-1,-4,-8,0,-3.5);ctx.bezierCurveTo(4,-8,8,-1,0,5);ctx.closePath();ctx.fillStyle=col;ctx.fill();stroke(1.6);ctx.restore();}
function robe(o,t){ctx.save();ctx.translate(o.x,o.y);const sd=o.seed||3;wobble(53+sd%5,1);const sc=o.scale||1;ctx.scale(sc,sc);
  const man=o.kind==="man",col=o.robe||(man?"#f4f1ea":"#1d1d24"),skin=o.skin||"#c98e5f",mood=o.mood||"ok";
  const wk=o.walk||0,sw=o.walk?Math.sin(wk):0;const bob=o.walk?-Math.abs(Math.sin(wk))*2.5:Math.sin(t*2.4+sd)*.8;
  if(!o.noShadow)ellipse(0,2,22,5,C.shadow,false);
  const sh=o.shoe||"#4a2f1c";ellipse(-8+sw*5,-2,8,4.4,sh);ellipse(8-sw*5,-2,8,4.4,sh);
  ctx.translate(0,bob);
  rpath(sw*2);ctx.fillStyle=col;ctx.fill();stroke(3);
  ctx.save();rpath(sw*2);ctx.clip();
  if(lum(col)>.45){ctx.fillStyle=shade(col,-.13);ctx.fillRect(-27,-80,10,82);}else{ctx.fillStyle=shade(col,.15);ctx.fillRect(13,-80,12,82);}
  if(man){ctx.beginPath();ctx.moveTo(0,-71);ctx.lineTo(0,-47);stroke(1.6,shade(col,-.3));}
  else if(o.trim){ctx.fillStyle=o.trim;ctx.fillRect(-2.3,-70,4.6,68);ctx.fillRect(-26,-11,52,3.2);}
  ctx.restore();
  if(o.bisht){const b=o.bisht,tr=o.bishtTrim||C.gold;
    [-1,1].forEach(s=>{ctx.beginPath();ctx.moveTo(15*s,-72);ctx.quadraticCurveTo(25*s,-40,27*s+sw*2,-7);ctx.lineTo(12*s+sw*2,-6);ctx.quadraticCurveTo(8*s,-40,6*s,-71);ctx.closePath();ctx.fillStyle=b;ctx.fill();stroke(2.5);
      ctx.beginPath();ctx.moveTo(6*s,-71);ctx.quadraticCurveTo(8*s,-40,12*s+sw*2,-6);stroke(3,tr);});}
  if(man){const tc=o.tassel||shade(col,-.38);ctx.beginPath();ctx.moveTo(1.5,-70);ctx.lineTo(2.5,-55);stroke(1.8,tc);ellipse(2.5,-52,2.4,3.6,tc,true,0,1.4);}
  if(o.apron){const ap=o.apron,ad=shade(ap,-.3);ctx.beginPath();ctx.moveTo(-9,-63);ctx.lineTo(-6,-72);ctx.moveTo(9,-63);ctx.lineTo(6,-72);stroke(2.2,ad);
    ctx.beginPath();ctx.moveTo(-11,-63);ctx.lineTo(11,-63);ctx.lineTo(12,-47);ctx.quadraticCurveTo(17,-30,15,-15);ctx.quadraticCurveTo(0,-11,-15,-15);ctx.quadraticCurveTo(-17,-30,-12,-47);ctx.closePath();ctx.fillStyle=ap;ctx.fill();stroke(2.5);
    ctx.beginPath();ctx.moveTo(-12,-47);ctx.lineTo(-18,-44);ctx.moveTo(12,-47);ctx.lineTo(18,-44);stroke(2,ad);
    rr(-6,-35,12,8,2);ctx.fillStyle=shade(ap,-.08);ctx.fill();stroke(1.8);
    if(o.apronIcon==="heart")smallHeart(0,-54,1,C.pink);else{ctx.beginPath();ctx.moveTo(-5,-58);ctx.lineTo(5,-58);ctx.quadraticCurveTo(5,-50,0,-50);ctx.quadraticCurveTo(-5,-50,-5,-58);ctx.closePath();ctx.fillStyle=C.white;ctx.fill();stroke(1.6);}}
  if(o.badge){ctx.save();ctx.translate(-9,-60);ctx.beginPath();ctx.moveTo(-2,3);ctx.lineTo(-4,11);ctx.moveTo(2,3);ctx.lineTo(4,11);stroke(3,C.red);star(0,0,6.5,C.gold,0);ctx.restore();}
  /* arms */
  const A0=ARMS[o.arms]||ARMS.down;const A=[A0[0].map(p=>p.slice()),A0[1].map(p=>p.slice())];
  if(o.arms==="wave")A[1][2][1]+=Math.sin(t*10)*4;
  if(o.arms==="up"){A[0][2][1]+=Math.sin(t*9)*3;A[1][2][1]-=Math.sin(t*9)*3;}
  if(o.arms==="pour"){const k=Math.sin(t*8)*2.5;A[1][2][1]+=k;A[0][2][0]+=k*.4;}
  if(o.arms==="write")A[1][2][0]+=Math.sin(t*14)*1.6;
  const slv=o.bisht||col;A.forEach(a=>hose(a,10,slv,6.4));
  if(o.hold==="notebook"){ctx.save();ctx.translate(-1,-51);ctx.rotate(-.12);rr(-8,-6,15,12,1.5);ctx.fillStyle="#fbf4e3";ctx.fill();stroke(2);ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(4,-2);ctx.moveTo(-5,1);ctx.lineTo(4,1);ctx.moveTo(-5,4);ctx.lineTo(1,4);stroke(1,"#8d8378");ctx.restore();
    ctx.beginPath();ctx.moveTo(A[1][2][0],A[1][2][1]);ctx.lineTo(A[1][2][0]-5,A[1][2][1]+6);stroke(2.5,C.navy);}
  A.forEach(a=>circ(a[2][0],a[2][1]+1,4.6,skin,true,2));
  /* head */
  ctx.save();ctx.translate(0,-90);const look=o.look||{x:0,y:0};
  if(!man){const hj=o.hijab||"#2c3e50";
    ctx.beginPath();ctx.moveTo(-19,-2);ctx.quadraticCurveTo(-25,15,-17,24);ctx.quadraticCurveTo(0,29,17,24);ctx.quadraticCurveTo(25,15,19,-2);ctx.closePath();ctx.fillStyle=hj;ctx.fill();stroke(3);
    ellipse(0,0,20,21,hj);ellipse(0,3,13.5,14.5,skin);
    ctx.beginPath();ctx.moveTo(-14,-7);ctx.quadraticCurveTo(0,-14,14,-7);stroke(2,shade(hj,lum(hj)>.5?-.25:.3));}
  else{ellipse(-16.5,2,3.2,4.8,skin);ellipse(16.5,2,3.2,4.8,skin);ellipse(0,0,16.5,17.5,skin);
    if(o.beard){const bc=o.beardCol||"#2b1a10";ctx.beginPath();ctx.moveTo(-14.5,2);ctx.quadraticCurveTo(-14,19,0,19.5);ctx.quadraticCurveTo(14,19,14.5,2);ctx.quadraticCurveTo(10,15,0,15);ctx.quadraticCurveTo(-10,15,-14.5,2);ctx.closePath();ctx.fillStyle=bc;ctx.fill();stroke(2);
      ellipse(-4,7.6,4.2,1.8,bc,false);ellipse(4,7.6,4.2,1.8,bc,false);}
    const hat=o.hat||"kumma";
    if(hat==="massar"){const hc=o.hatCol||"#8e44ad",hc2=o.hatCol2||"#f1c40f";union([[0,-11,19.5,8.5,0],[0,-17,15,7.5,0],[-7,-14,9,7,-.3]],hc);
      ctx.save();ctx.beginPath();ctx.ellipse(0,-11,19.5,8.5,0,0,TAU);ctx.ellipse(0,-17,15,7.5,0,0,TAU);ctx.clip();ctx.strokeStyle=hc2;ctx.lineWidth=2;for(let i=-6;i<7;i++){ctx.beginPath();ctx.moveTo(i*6-8,-2);ctx.lineTo(i*6+8,-27);ctx.stroke();}ctx.restore();
      ctx.beginPath();ctx.moveTo(-18,-7);ctx.quadraticCurveTo(0,-1,18,-7);stroke(2);}
    else{const hc=o.hatCol||"#f8f5ee",hc2=o.hatCol2||"#c0392b";const kp=()=>{ctx.beginPath();ctx.moveTo(-16.8,-3);ctx.lineTo(-15.6,-15);ctx.quadraticCurveTo(0,-23,15.6,-15);ctx.lineTo(16.8,-3);ctx.quadraticCurveTo(0,-8,-16.8,-3);ctx.closePath();};
      kp();ctx.fillStyle=hc;ctx.fill();stroke(2.5);ctx.save();kp();ctx.clip();ctx.fillStyle=hc2;for(let i=-4;i<=4;i++){ctx.beginPath();ctx.arc(i*4,-9,1.1,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(i*4+2,-13.5,1,0,TAU);ctx.fill();}
      ctx.strokeStyle=hc2;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-16,-5.6);ctx.quadraticCurveTo(0,-10.6,16,-5.6);ctx.stroke();ctx.restore();}}
  const fy=man?0:3,blink=Math.sin(t*1.7+sd*3)>.985?1:0;let lid=blink;if(mood==="angry")lid=Math.max(lid,.3);if(mood==="sad")lid=Math.max(lid,.45);
  eye(-6,fy-1,4.4,5.8,look,2.3,lid,skin);eye(6,fy-1,4.4,5.8,look,2.3,lid,skin);
  if(o.glasses){ctx.beginPath();ctx.arc(-6,fy-1,7,0,TAU);ctx.moveTo(13,fy-1);ctx.arc(6,fy-1,7,0,TAU);stroke(2);ctx.beginPath();ctx.moveTo(-13,fy-2);ctx.lineTo(-16,fy-4);ctx.moveTo(13,fy-2);ctx.lineTo(16,fy-4);stroke(1.6);}
  const ck=mood==="angry"?"rgba(220,60,40,.75)":"rgba(230,110,90,.5)";ellipse(-9.5,fy+7,2.5,1.5,ck,false);ellipse(9.5,fy+7,2.5,1.5,ck,false);
  if(mood==="angry"){ctx.beginPath();ctx.moveTo(-11,fy-10);ctx.lineTo(-3,fy-6);ctx.moveTo(3,fy-6);ctx.lineTo(11,fy-10);stroke(2.6);}
  else if(mood==="wait"){ctx.beginPath();ctx.moveTo(-10,fy-9);ctx.lineTo(-3,fy-11);ctx.moveTo(3,fy-11);ctx.lineTo(10,fy-9);stroke(2.2);}
  const my=fy+10;
  if(mood==="happy")smile(0,my-1,10,.55,true);
  else if(mood==="angry"||mood==="sad"){ctx.beginPath();ctx.moveTo(-5,my+2);ctx.quadraticCurveTo(0,my-3,5,my+2);stroke(2.5);}
  else if(mood==="wait"){ctx.beginPath();ctx.moveTo(-4,my);ctx.lineTo(4,my);stroke(2.4);}
  else if(mood==="wow")ellipse(0,my,3.2,4.2,C.redD,true,0,2);
  else smile(0,my-1,9,0);
  ctx.restore();
  if(mood==="angry"&&o.steam!==false){for(let i=0;i<2;i++){const k=((t*1.4+i*.5)%1);cloud((i?14:-14)+(i?k*6:-k*6),-116-k*14,4+k*5,.7*(1-k),C.steamD);}}
  ctx.restore();}
/* ---------- café themes ---------- */
const CAFE={sea:{wall:"#f3eee3",wall2:"#dce8ee",trim:"#2f6f9f",wood:"#8b5a33",woodL:"#b9844f",woodD:"#5b3a21",floor:"#e6d6b6",floor2:"#d3bf98",view:"sea"},
 desert:{wall:"#f0dbb2",wall2:"#e2c390",trim:"#a0522d",wood:"#7a4a2a",woodL:"#a8703f",woodD:"#4e2e18",floor:"#d5b080",floor2:"#c09866",view:"palms"},
 rose:{wall:"#fae7ea",wall2:"#f2d2d8",trim:"#b04a6a",wood:"#8e5a4a",woodL:"#b8826d",woodD:"#5e3a30",floor:"#ecd9cb",floor2:"#dbc2b0",view:"garden"},
 night:{wall:"#343c6e",wall2:"#2a315c",trim:"#c89b3c",wood:"#6b4a35",woodL:"#8f6649",woodD:"#3f2a1d",floor:"#4d4464",floor2:"#3f3755",view:"night"}};
function archWindow(x,y,w,h,P,t,i){const c=ctx,b=y+h;
  const pth=(pad)=>{const l=x-w/2-pad,r=x+w/2+pad;c.beginPath();c.moveTo(l,b+pad);c.lineTo(l,y+w*.5);c.quadraticCurveTo(l,y-pad,x,y-8-pad);c.quadraticCurveTo(r,y-pad,r,y+w*.5);c.lineTo(r,b+pad);c.closePath();};
  pth(6);c.fillStyle=P.trim;c.fill();stroke(3);
  c.save();pth(0);c.clip();const v=P.view;
  const g=c.createLinearGradient(0,y-10,0,b);
  if(v==="night"){g.addColorStop(0,"#0f1534");g.addColorStop(1,"#2b2f63");}else if(v==="palms"){g.addColorStop(0,"#9fd0ec");g.addColorStop(1,"#f6e3bb");}else if(v==="garden"){g.addColorStop(0,"#bfe2f4");g.addColorStop(1,"#eef7f2");}else{g.addColorStop(0,"#8fd0ef");g.addColorStop(1,"#dff3fb");}
  c.fillStyle=g;c.fillRect(x-w,y-20,w*2,h+30);
  if(v==="sea"){c.fillStyle="#3b8fc4";c.fillRect(x-w,b-h*.34,w*2,h);c.strokeStyle="rgba(255,255,255,.8)";c.lineWidth=1.6;for(let k=0;k<3;k++){const yy=b-h*.28+k*9;c.beginPath();for(let xx=x-w/2;xx<=x+w/2;xx+=4)c.lineTo(xx,yy+Math.sin(xx*.25+t*2+k)*1.4);c.stroke();}
    if(i===0){c.save();c.translate(x+6+Math.sin(t*.3)*4,b-h*.34);c.beginPath();c.moveTo(-9,0);c.lineTo(9,0);c.lineTo(6,4);c.lineTo(-6,4);c.closePath();c.fillStyle="#8b5a33";c.fill();c.beginPath();c.moveTo(0,0);c.lineTo(0,-16);c.lineTo(8,-4);c.closePath();c.fillStyle="#fbf4e3";c.fill();c.restore();}
    else circ(x-10,y+16,7,"#fff1a8",false);}
  else if(v==="palms"){c.fillStyle="#e7c27d";c.beginPath();c.moveTo(x-w,b);c.quadraticCurveTo(x-10,b-h*.42,x+w,b-h*.12);c.lineTo(x+w,b);c.closePath();c.fill();
    c.save();c.translate(x+(i?-8:8),b-h*.22);c.strokeStyle="#6b4a2a";c.lineWidth=3.5;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(3,-22,0,-40);c.stroke();c.fillStyle="#4f8a3a";for(let k=0;k<5;k++){c.save();c.translate(0,-40);c.rotate(-1.9+k*.62);c.beginPath();c.ellipse(11,0,12,3.4,0,0,TAU);c.fill();c.restore();}c.restore();}
  else if(v==="garden"){c.fillStyle="#7fbf73";for(let k=0;k<4;k++){c.beginPath();c.arc(x-w/2+k*w/3,b-6,14,0,TAU);c.fill();}c.fillStyle="#f06c9b";for(let k=0;k<6;k++){c.beginPath();c.arc(x-w/2+6+k*w/5.2,b-14-(k%2)*6,3,0,TAU);c.fill();}}
  else{c.fillStyle="#fff";for(let k=0;k<14;k++){c.globalAlpha=.45+.45*Math.sin(t*2+k*1.7);c.fillRect(x-w/2+((k*37)%w),y-4+((k*23)%(h-10)),2,2);}c.globalAlpha=1;if(i===0){circ(x+8,y+16,9,"#f4f1de",false);circ(x+12,y+13,8,"#0f1534",false);}}
  c.restore();
  c.strokeStyle=P.trim;c.lineWidth=4;c.beginPath();c.moveTo(x,y-8);c.lineTo(x,b);c.moveTo(x-w/2,y+h*.5);c.lineTo(x+w/2,y+h*.5);c.stroke();
  pth(0);stroke(3);
  c.fillStyle=P.woodD;c.fillRect(x-w/2-10,b+5,w+20,6);c.fillStyle=C.ink;c.fillRect(x-w/2-10,b+11,w+20,2);}
function lantern(x,y,t,P){const c=ctx;c.save();c.translate(x,y);const sway=Math.sin(t*1.3)*.05;c.rotate(sway);
  c.beginPath();c.moveTo(0,0);c.lineTo(0,22);stroke(2);
  const fl=.75+.25*Math.sin(t*9)*Math.sin(t*5.3);const gl=c.createRadialGradient(0,44,2,0,44,46);gl.addColorStop(0,"rgba(255,214,120,"+(.42*fl)+")");gl.addColorStop(1,"rgba(255,214,120,0)");c.fillStyle=gl;c.fillRect(-48,0,96,96);
  c.beginPath();c.moveTo(-6,22);c.lineTo(6,22);c.lineTo(9,28);c.lineTo(-9,28);c.closePath();c.fillStyle=C.brass;c.fill();stroke(2);
  c.beginPath();c.moveTo(-9,28);c.quadraticCurveTo(-15,44,-8,60);c.lineTo(8,60);c.quadraticCurveTo(15,44,9,28);c.closePath();c.fillStyle="rgba(255,"+Math.round(200+30*fl)+",120,1)";c.fill();stroke(2.5);
  c.strokeStyle=C.brassD;c.lineWidth=1.6;c.beginPath();c.moveTo(0,28);c.lineTo(0,60);c.moveTo(-5,29);c.quadraticCurveTo(-9,44,-4,60);c.moveTo(5,29);c.quadraticCurveTo(9,44,4,60);c.stroke();
  c.beginPath();c.moveTo(-9,60);c.lineTo(9,60);c.lineTo(5,66);c.lineTo(-5,66);c.closePath();c.fillStyle=C.brass;c.fill();stroke(2);circ(0,69,2.4,C.brass,true,1.5);c.restore();}
function dallah(x,y,s,t,col,tilt){ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(tilt)ctx.rotate(tilt);const c1=col||C.brass,c2=shade(c1,-.32),c3=shade(c1,.45);
  tube([[-9,-28],[-17,-23],[-14,-10]],2.4,c1);
  tube([[8,-14],[16,-23],[20,-36],[27,-44]],3,c1);
  ellipse(0,-2,12,3,c2);
  ctx.beginPath();ctx.moveTo(-11,-3);ctx.quadraticCurveTo(-17,-14,-8,-20);ctx.lineTo(-5,-24);ctx.lineTo(5,-24);ctx.lineTo(8,-20);ctx.quadraticCurveTo(17,-14,11,-3);ctx.closePath();ctx.fillStyle=c1;ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(-5,-24);ctx.lineTo(-6,-32);ctx.lineTo(6,-32);ctx.lineTo(5,-24);ctx.closePath();ctx.fillStyle=c1;ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(-8,-32);ctx.quadraticCurveTo(0,-43,8,-32);ctx.closePath();ctx.fillStyle=c1;ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(0,-41);ctx.lineTo(0,-46);stroke(2.5,c2);circ(0,-47.5,2.3,c1,true,1.5);
  ellipse(-5,-12,2.4,5,c3,false,.2);ctx.beginPath();ctx.moveTo(-10,-8);ctx.quadraticCurveTo(0,-6,10,-8);stroke(1.5,c2);ctx.restore();}
function menuBoard(x,y,w,h,P){const c=ctx;rr(x-5,y-5,w+10,h+10,6);c.fillStyle=P.woodD;c.fill();stroke(3);rr(x,y,w,h,3);c.fillStyle="#2f4a3a";c.fill();stroke(2);
  label("MENU",x+w/2,y+12,14,"#fbf4e3","center","Limelight, Impact, sans-serif");
  const rows=[["Kahwa","200"],["Karak","150"],["Halwa","500"],["Luqaimat","400"]];
  rows.forEach((r,i)=>{const yy=y+29+i*13.5;label(r[0],x+10,yy,11.5,"#fbf4e3","left");label(r[1]+" baisa",x+w-10,yy,11,"#f2dc92","right");c.fillStyle="rgba(251,244,227,.35)";for(let d=x+62;d<x+w-62;d+=5)c.fillRect(d,yy+3,1.6,1.6);});}
function shelf(x,y,w,P,t){const c=ctx;
  dallah(x+18,y,.62,t,"#c89b3c");dallah(x+46,y,.55,t,"#a7b1bb");
  ctx.save();ctx.translate(x+82,y);rr(-11,-26,22,26,4);c.fillStyle="rgba(210,235,245,.75)";c.fill();stroke(2.2);c.save();rr(-11,-26,22,26,4);c.clip();for(let k=0;k<7;k++){ellipse(-6+(k%3)*6,-5-Math.floor(k/3)*6,3.4,2.4,"#5b2a12",true,.3,1.2);}c.restore();rr(-12,-30,24,6,2);c.fillStyle="#b7432d";c.fill();stroke(2);ctx.restore();
  [[x+112,0],[x+124,0],[x+118,-8]].forEach(p=>{ctx.save();ctx.translate(p[0],y+p[1]);ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(5,-8);ctx.quadraticCurveTo(5,0,0,0);ctx.quadraticCurveTo(-5,0,-5,-8);ctx.closePath();c.fillStyle=C.white;c.fill();stroke(1.6);c.fillStyle="#3f7eb3";c.fillRect(-5,-5,10,1.6);ctx.restore();});
  c.fillStyle=P.wood;c.fillRect(x-6,y,w+12,7);c.strokeStyle=C.ink;c.lineWidth=2.5;c.strokeRect(x-6,y,w+12,7);
  [x+8,x+w-8].forEach(bx=>{c.beginPath();c.moveTo(bx-4,y+7);c.lineTo(bx+4,y+7);c.lineTo(bx,y+18);c.closePath();c.fillStyle=P.woodD;c.fill();stroke(2);});}
function cafeBg(t,th){const P=CAFE[th]||CAFE.sea,c=ctx;
  c.fillStyle=P.wall;c.fillRect(0,0,640,268);
  c.fillStyle=th==="night"?"rgba(255,255,255,.03)":"rgba(90,60,30,.035)";for(let i=0;i<26;i++){const x=(i*97)%640,y=(i*53)%220+16;c.beginPath();c.ellipse(x,y,16+(i%5)*6,7+(i%3)*4,0,0,TAU);c.fill();}
  c.fillStyle=P.woodD;c.fillRect(0,0,640,9);c.fillStyle=C.ink;c.fillRect(0,9,640,2.5);
  for(let x=40;x<640;x+=120){c.fillStyle=P.woodD;c.fillRect(x-5,9,10,6);}
  archWindow(452,46,58,108,P,t,0);archWindow(584,46,58,108,P,t,1);
  c.fillStyle=P.wall2;c.fillRect(0,208,640,60);c.fillStyle=C.ink;c.fillRect(0,206,640,2.5);
  c.fillStyle=P.trim;for(let x=0;x<640;x+=16){c.beginPath();c.moveTo(x,209);c.lineTo(x+8,216);c.lineTo(x+16,209);c.closePath();c.fill();}
  c.fillStyle=P.floor;c.fillRect(0,268,640,92);
  for(let r=0;r<4;r++){const y0=268+r*24;for(let k=0;k<17;k++){if((r+k)%2){c.fillStyle=P.floor2;c.fillRect(k*40,y0,40,24);}}}
  c.fillStyle=C.ink;c.fillRect(0,266,640,2.5);
  menuBoard(18,48,164,80,P);shelf(204,126,140,P,t);lantern(286,11,t,P);}
/* ---------- the counter and the four stations ---------- */
function cafeCounter(t,th){const P=CAFE[th]||CAFE.sea,c=ctx,R=360;
  c.beginPath();c.moveTo(-4,262);c.lineTo(R-10,262);c.quadraticCurveTo(R,262,R,272);c.lineTo(R,364);c.lineTo(-4,364);c.closePath();c.fillStyle=P.wood;c.fill();stroke(3);
  for(let i=0;i<4;i++){const x=14+i*86,w=72;c.beginPath();c.moveTo(x,354);c.lineTo(x,318);c.quadraticCurveTo(x,306,x+w/2,302);c.quadraticCurveTo(x+w,306,x+w,318);c.lineTo(x+w,354);c.closePath();c.fillStyle=shade(P.wood,-.12);c.fill();stroke(2.2,P.woodD);
    c.strokeStyle=P.trim;c.lineWidth=1.6;for(let d=0;d<3;d++){c.beginPath();c.moveTo(x+12+d*24,346);c.lineTo(x+24+d*24,334);c.lineTo(x+36+d*24,346);c.stroke();}}
  c.beginPath();c.moveTo(-4,244);c.lineTo(R-6,244);c.quadraticCurveTo(R+4,244,R+4,252);c.lineTo(R+4,262);c.lineTo(-4,262);c.closePath();c.fillStyle=P.woodL;c.fill();stroke(3);
  c.beginPath();c.moveTo(-4,252);c.lineTo(R+4,252);stroke(2,P.woodD);c.fillStyle="rgba(255,255,255,.22)";c.fillRect(0,245.5,R-6,3);}
function station(k,x,yb,t,busy,prog){const c=ctx;c.save();
  if(k===0){c.beginPath();c.moveTo(x-17,yb);c.lineTo(x-14,yb-12);c.lineTo(x+14,yb-12);c.lineTo(x+17,yb);c.closePath();c.fillStyle="#3a3330";c.fill();stroke(2.5);
    for(let i=0;i<5;i++){const f=busy?.6+.4*Math.sin(t*12+i*2):.35;circ(x-10+i*5,yb-12,2.6,"rgba(240,"+Math.round(90+80*f)+",40,"+(.6+.4*f)+")",false);}
    const tilt=busy?-.32-Math.sin(t*6)*.04:0;dallah(x-4,yb-13,1.02,t,C.brass,tilt);
    if(busy){const sx=x-4+Math.cos(tilt)*27-Math.sin(tilt)*-44*1.02+2,sy=yb-13+Math.sin(tilt)*27+Math.cos(tilt)*-44*1.02;c.strokeStyle="#c08a45";c.lineWidth=2.6;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(sx+4,sy+20,x+20,yb-6);c.stroke();}}
  else if(k===1){ellipse(x,yb-2,19,4,"#2d2d2d");const j=busy?Math.sin(t*30)*.8:0;c.translate(j,0);
    c.beginPath();c.moveTo(-17+x,yb-6);c.lineTo(-17+x,yb-34);c.lineTo(17+x,yb-34);c.lineTo(17+x,yb-6);c.quadraticCurveTo(x,yb-2,-17+x,yb-6);c.closePath();c.fillStyle="#b9c2c9";c.fill();stroke(2.5);
    c.fillStyle="#97a1a9";c.fillRect(x-16,yb-14,32,6);ellipse(x,yb-34,17,4.5,"#c98d57",true,0,2.5);ellipse(x-4,yb-35,6,1.5,"rgba(255,240,220,.6)",false);
    tube([[x-17,yb-28],[x-25,yb-30],[x-25,yb-24]],2,"#97a1a9");tube([[x+17,yb-28],[x+25,yb-30],[x+25,yb-24]],2,"#97a1a9");
    const n=busy?3:1;for(let i=0;i<n;i++){const kk=((t*(busy?1.1:.4)+i*.33)%1);cloud(x-6+i*6+Math.sin(t*2+i)*4,yb-42-kk*26,4+kk*6,(busy?.75:.35)*(1-kk),C.steam);}}
  else if(k===2){c.beginPath();c.moveTo(x-27,yb-17);c.quadraticCurveTo(x-25,yb-1,x,yb-1);c.quadraticCurveTo(x+25,yb-1,x+27,yb-17);c.closePath();c.fillStyle="#c4693b";c.fill();stroke(2.5);
    c.fillStyle="#9c4f2a";c.fillRect(x-22,yb-10,44,3);ellipse(x,yb-17,27,5.5,"#5a2a10",true,0,2.5);ellipse(x-8,yb-18,7,1.6,"rgba(255,210,170,.5)",false);
    const a=busy?Math.sin(t*7)*.5:.15;c.save();c.translate(x+4,yb-18);c.rotate(-.75+a);c.beginPath();c.moveTo(0,0);c.lineTo(0,-34);stroke(5,C.ink);c.beginPath();c.moveTo(0,0);c.lineTo(0,-34);stroke(3,"#b07a4a");ellipse(0,1,4,3,"#b07a4a",true,0,1.8);c.restore();
    tube([[x-27,yb-15],[x-34,yb-15]],2.2,"#9c4f2a");tube([[x+27,yb-15],[x+34,yb-15]],2.2,"#9c4f2a");}
  else{c.beginPath();c.moveTo(x-23,yb-22);c.quadraticCurveTo(x-21,yb-1,x,yb-1);c.quadraticCurveTo(x+21,yb-1,x+23,yb-22);c.closePath();c.fillStyle="#2d2d2d";c.fill();stroke(2.5);
    ellipse(x,yb-22,23,5,"#e8b84a",true,0,2.5);
    for(let i=0;i<3;i++){const bx=x-10+i*10,by=yb-23+Math.sin(t*(busy?9:2)+i*2)*(busy?1.6:.5);circ(bx,by,4.2,busy?"#e9a640":"#d99035",true,1.6);}
    if(busy){for(let i=0;i<5;i++){const kk=((t*2+i*.21)%1);circ(x-18+((i*13)%36),yb-23-kk*6,1.2+kk*1.5,"rgba(255,255,255,"+(.8*(1-kk))+")",false);}}
    c.beginPath();c.moveTo(x+14,yb-24);c.lineTo(x+30,yb-52);stroke(3.5,C.ink);c.beginPath();c.moveTo(x+14,yb-24);c.lineTo(x+30,yb-52);stroke(2,"#97a1a9");ellipse(x+12,yb-22,5,3,"#97a1a9",true,.4,1.6);}
  c.restore();}
function stationLabel(x,y,txt,prog,t,key,hot){const c=ctx,w=70,h=18;rr(x-w/2,y-h/2,w,h,5);c.fillStyle="#fbf4e3";c.fill();
  if(prog>0){c.save();rr(x-w/2,y-h/2,w,h,5);c.clip();c.fillStyle="#f2c14e";c.fillRect(x-w/2,y-h/2,w*cl01(prog),h);c.restore();}
  rr(x-w/2,y-h/2,w,h,5);stroke(hot?3:2.2,hot?C.red:C.ink);label(txt,x,y+1,txt.length>6?11:12.5,C.ink);
  if(prog===-1){for(let i=0;i<3;i++){const a=.35+.65*((Math.sin(t*8-i*1.2)+1)/2);c.globalAlpha=a;circ(x-8+i*8,y+15,2.2,C.ink,false);}c.globalAlpha=1;}
  if(key){circ(x+w/2-2,y-h/2-2,8,C.gold,true,2);label(key,x+w/2-2,y-h/2-1.5,11,C.ink);}}
function itemIcon(k,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s||1,s||1);
  if(k===0){const p=()=>{ctx.beginPath();ctx.moveTo(-9,-7);ctx.lineTo(9,-7);ctx.quadraticCurveTo(9,6,0,7);ctx.quadraticCurveTo(-9,6,-9,-7);ctx.closePath();};p();ctx.fillStyle=C.white;ctx.fill();ctx.save();p();ctx.clip();ctx.fillStyle="#3f7eb3";ctx.fillRect(-10,-3,20,2.6);ctx.fillStyle=C.gold;ctx.fillRect(-10,.6,20,1.4);ctx.restore();p();stroke(2.2);ellipse(0,-7,9,2.6,"#c08a45",true,0,1.8);}
  else if(k===1){ellipse(0,8,11,3,C.white,true,0,1.8);ctx.beginPath();ctx.moveTo(-7,-11);ctx.lineTo(7,-11);ctx.quadraticCurveTo(4,-2,6,7);ctx.lineTo(-6,7);ctx.quadraticCurveTo(-4,-2,-7,-11);ctx.closePath();ctx.fillStyle="#c98d57";ctx.fill();stroke(2.2);
    ellipse(0,-9.6,6.4,1.9,"#ecd4b2",false);ctx.beginPath();ctx.moveTo(-4,-7);ctx.lineTo(-3,4);stroke(1.6,"rgba(255,255,255,.65)");}
  else if(k===2){ctx.beginPath();ctx.moveTo(-10,-2);ctx.quadraticCurveTo(-6,-11,0,-10);ctx.quadraticCurveTo(7,-11,10,-2);ctx.closePath();ctx.fillStyle="#6b3416";ctx.fill();stroke(2.2);
    ctx.beginPath();ctx.moveTo(-11,-2);ctx.quadraticCurveTo(-10,8,0,8);ctx.quadraticCurveTo(10,8,11,-2);ctx.closePath();ctx.fillStyle="#2f6f9f";ctx.fill();stroke(2.2);ctx.beginPath();ctx.moveTo(-9,2);ctx.quadraticCurveTo(0,4,9,2);stroke(1.4,"#f2dc92");
    ellipse(-3,-6,3,1.4,"rgba(255,220,180,.6)",false);circ(2,-7,1.4,"#7fbf5a",false);circ(5,-4.5,1.2,"#7fbf5a",false);circ(-5,-4,1.1,"#f2dc92",false);}
  else{ellipse(0,5,13,4,C.white,true,0,2);ellipse(0,5,9,2.4,"#dfe9ee",false);[[-6,1],[0,2],[6,1],[-3,-4],[3,-4]].forEach(p=>circ(p[0],p[1],4.2,"#e0a03c",true,1.6));
    ctx.beginPath();ctx.moveTo(-8,0);ctx.quadraticCurveTo(-4,-7,0,-1);ctx.quadraticCurveTo(4,-8,8,0);stroke(1.8,"#4a1f0c");}
  ctx.restore();}
function tick(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s||1,s||1);circ(0,0,6.5,"#3f9b5a",true,1.8);ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-.6,2.6);ctx.lineTo(3.4,-2.6);stroke(2.2,C.white);ctx.restore();}
function orderBubble(x,yb,items,got,pat,t,vip){ctx.save();const n=items.length,w=Math.max(56,n*27+18),h=48;const bx=Math.max(4,Math.min(636-w,x-w/2)),by=yb-h;
  if(pat<.25)ctx.translate(Math.sin(t*40)*1.5,0);
  rr(bx,by,w,h,10);ctx.fillStyle=C.white;ctx.fill();stroke(2.5);
  ctx.beginPath();ctx.moveTo(x-6,by+h-1);ctx.lineTo(x,by+h+9);ctx.lineTo(x+6,by+h-1);ctx.fillStyle=C.white;ctx.fill();ctx.beginPath();ctx.moveTo(x-6,by+h);ctx.lineTo(x,by+h+9);ctx.lineTo(x+6,by+h);stroke(2.5);
  items.forEach((k,i)=>{const ix=bx+w/2+(i-(n-1)/2)*27,iy=by+19;if(got[i])ctx.globalAlpha=.35;itemIcon(k,ix,iy,.92);ctx.globalAlpha=1;if(got[i])tick(ix+7,iy+5,.8);});
  const pw=w-16,px=bx+8,py=by+h-11;ctx.fillStyle="#e9e1cf";ctx.fillRect(px,py,pw,6);ctx.fillStyle=pat>.5?"#4caf50":pat>.25?C.gold:C.red;ctx.fillRect(px,py,pw*cl01(pat),6);ctx.lineWidth=1.6;ctx.strokeStyle=C.ink;ctx.strokeRect(px,py,pw,6);
  ctx.restore();}
function coin(x,y,r){circ(x,y,r,C.gold,true,2);circ(x,y,r*.62,null,true,1.4);ellipse(x-r*.3,y-r*.35,r*.22,r*.14,"rgba(255,255,255,.7)",false);}
/* ---------- the sweet shop ---------- */
const SWEETTH={pink:{a:"#fbe1ea",b:"#f6cfdc",floor:"#e9b6c6",floor2:"#dea3b7",frame:"#ebbd8b",cell1:"#fff7fa",cell2:"#fde5ee",acc:"#e5484d",shelf:"#c97b5d"},
 mint:{a:"#e2f6ee",b:"#cdeedf",floor:"#a9d8c3",floor2:"#93cbb3",frame:"#eac48c",cell1:"#f6fffb",cell2:"#e0f4ea",acc:"#2f9e72",shelf:"#7aa88e"},
 lemon:{a:"#fff6cf",b:"#ffeaa6",floor:"#f0d27c",floor2:"#e6c466",frame:"#dda65e",cell1:"#fffdf3",cell2:"#fff0c6",acc:"#e0a10b",shelf:"#c99a52"},
 night:{a:"#2c305e",b:"#262a54",floor:"#3e3667",floor2:"#352e59",frame:"#c89b3c",cell1:"#3c4177",cell2:"#343869",acc:"#f2c14e",shelf:"#6b5a8a",night:true}};
const SWC=["#e5484d","#f08c2a","#f2c230","#4caf62","#3b82d6","#9b5bc9"];
function sweetPath(k,r){const P=new Path2D();
  if(k===0){P.moveTo(0,r*.82);P.bezierCurveTo(-r*1.25,-r*.02,-r*.62,-r*1.02,0,-r*.4);P.bezierCurveTo(r*.62,-r*1.02,r*1.25,-r*.02,0,r*.82);P.closePath();}
  else if(k===1){P.arc(0,0,r*.84,0,TAU);}
  else if(k===2){for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,q=i%2?r*.5:r*.98;if(i)P.lineTo(Math.cos(a)*q,Math.sin(a)*q+r*.06);else P.moveTo(Math.cos(a)*q,Math.sin(a)*q+r*.06);}P.closePath();}
  else if(k===3){P.moveTo(0,-r*.92);P.quadraticCurveTo(r*.34,-r*.48,r*.86,r*.56);P.quadraticCurveTo(0,r*.98,-r*.86,r*.56);P.quadraticCurveTo(-r*.34,-r*.48,0,-r*.92);P.closePath();}
  else if(k===4){P.moveTo(0,-r*.96);P.bezierCurveTo(r*.5,-r*.36,r*.84,r*.06,r*.82,r*.34);P.bezierCurveTo(r*.8,r*.8,-r*.8,r*.8,-r*.82,r*.34);P.bezierCurveTo(-r*.84,r*.06,-r*.5,-r*.36,0,-r*.96);P.closePath();}
  else{P.ellipse(0,0,r*.6,r*.56,0,0,TAU);}
  return P;}
function sweet(k,x,y,r,t,sp,alpha){ctx.save();ctx.translate(x,y);if(alpha!==undefined&&alpha<1)ctx.globalAlpha=Math.max(0,alpha);ctx.lineJoin="round";
  if(sp==="rainbow"||k<0){circ(0,0,r*.9,"#5b3220",true,2.5);const cols=["#e5484d","#f2c230","#4caf62","#3b82d6","#9b5bc9","#f08c2a","#fbfbfb"];
    for(let i=0;i<15;i++){const a=i*2.39996+(t||0)*.9,q=r*(.2+((i*37)%10)/10*.56);ctx.save();ctx.translate(Math.cos(a)*q,Math.sin(a)*q);ctx.rotate(a*1.7);ctx.fillStyle=cols[i%cols.length];ctx.fillRect(-2.7,-1.1,5.4,2.2);ctx.restore();}
    ellipse(-r*.32,-r*.38,r*.24,r*.13,"rgba(255,255,255,.55)",false,-.6);ctx.restore();return;}
  const col=SWC[k]||SWC[0],dk=shade(col,-.32);
  if(k===5){[-1,1].forEach(s=>{ctx.beginPath();ctx.moveTo(s*r*.5,0);ctx.lineTo(s*r*1.02,-r*.5);ctx.quadraticCurveTo(s*r*.86,0,s*r*1.02,r*.5);ctx.closePath();ctx.fillStyle=shade(col,.35);ctx.fill();stroke(2.2);});}
  const P=sweetPath(k,r);ctx.fillStyle=col;ctx.fill(P);
  ctx.save();ctx.clip(P);ctx.fillStyle=dk;ctx.beginPath();ctx.ellipse(r*.35,r*.5,r*.95,r*.55,-.5,0,TAU);ctx.fill();
  if(k===1){ctx.strokeStyle="#5b2a12";ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-r*.8,-r*.1);ctx.quadraticCurveTo(-r*.4,-r*.6,0,-r*.1);ctx.quadraticCurveTo(r*.4,r*.35,r*.8,-r*.2);ctx.stroke();ctx.fillStyle="#fbf4e3";[[-.3,.35],[.15,.45],[.45,.15],[-.55,.1]].forEach(p=>{ctx.fillRect(p[0]*r,p[1]*r,2.4,1.3);});}
  if(k===5){ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=2.4;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.32-r*.3,r*.7);ctx.lineTo(i*r*.32+r*.3,-r*.7);ctx.stroke();}}
  if(k===3){ctx.strokeStyle=dk;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-r*.6);ctx.lineTo(0,r*.6);ctx.stroke();}
  if(sp==="row"||sp==="col"){ctx.fillStyle="rgba(255,255,255,.9)";for(let i=-1;i<=1;i++){if(sp==="row")ctx.fillRect(-r,i*r*.5-1.8,r*2,3.6);else ctx.fillRect(i*r*.5-1.8,-r,3.6,r*2);}}
  ctx.restore();
  ctx.lineWidth=2.4;ctx.strokeStyle=C.ink;ctx.stroke(P);
  ellipse(-r*.3,-r*.34,r*.2,r*.12,"rgba(255,255,255,.75)",false,-.6);
  if(sp==="row"||sp==="col"){const g=.5+.5*Math.sin((t||0)*6);ctx.globalAlpha*=.35+.3*g;ctx.beginPath();ctx.arc(0,0,r*1.12,0,TAU);ctx.strokeStyle=C.white;ctx.lineWidth=2.5;ctx.stroke();}
  ctx.restore();}
function sweetBg(t,th){const P=SWEETTH[th]||SWEETTH.pink,c=ctx;
  for(let i=0;i<21;i++){c.fillStyle=i%2?P.a:P.b;c.fillRect(i*32,0,32,300);}
  if(P.night){c.fillStyle="#fff";for(let i=0;i<30;i++){c.globalAlpha=.3+.4*Math.sin(t*2+i);c.fillRect((i*137)%300,(i*53)%280,2,2);}c.globalAlpha=1;}
  const cols=["#e5484d","#f2c230","#4caf62","#3b82d6","#9b5bc9","#f08c2a"];c.strokeStyle=C.ink;c.lineWidth=1.6;c.beginPath();c.moveTo(0,14);for(let x=0;x<=300;x+=30)c.quadraticCurveTo(x+15,22,x+30,14);c.stroke();
  for(let i=0;i<10;i++){const x=i*30+4;c.beginPath();c.moveTo(x,15);c.lineTo(x+22,15);c.lineTo(x+11,32);c.closePath();c.fillStyle=cols[i%cols.length];c.fill();stroke(1.6);}
  c.fillStyle=P.floor;c.fillRect(0,300,640,60);for(let k=0;k<16;k++){if(k%2){c.fillStyle=P.floor2;c.fillRect(k*40,300,40,30);}else{c.fillStyle=P.floor2;c.fillRect(k*40,330,40,30);}}
  c.fillStyle=C.ink;c.fillRect(0,298,640,2.5);}
function boardFrame(x,y,cols,rows,cell,th){const P=SWEETTH[th]||SWEETTH.pink,c=ctx,w=cols*cell,h=rows*cell;
  rr(x-10,y-10,w+20,h+20,16);c.fillStyle=P.frame;c.fill();stroke(3);
  c.fillStyle=shade(P.frame,-.28);for(let i=0;i<cols*2;i++){circ(x+i*cell/2+cell/4,y-5,1.6,c.fillStyle,false);circ(x+i*cell/2+cell/4,y+h+5,1.6,c.fillStyle,false);}for(let i=0;i<rows*2;i++){circ(x-5,y+i*cell/2+cell/4,1.6,c.fillStyle,false);circ(x+w+5,y+i*cell/2+cell/4,1.6,c.fillStyle,false);}
  rr(x-2,y-2,w+4,h+4,8);c.fillStyle=P.cell1;c.fill();stroke(2.2);
  c.save();rr(x-2,y-2,w+4,h+4,8);c.clip();c.fillStyle=P.cell2;for(let r=0;r<rows;r++)for(let q=0;q<cols;q++)if((r+q)%2)c.fillRect(x+q*cell,y+r*cell,cell,cell);c.restore();}
function jar(x,yb,w,h,fill,t,glow,label2){const c=ctx;c.save();c.translate(x,yb);
  const P=new Path2D();P.moveTo(-w/2+5,-h+18);P.quadraticCurveTo(-w/2,-h+22,-w/2,-h+32);P.lineTo(-w/2,-9);P.quadraticCurveTo(-w/2,0,-w/2+9,0);P.lineTo(w/2-9,0);P.quadraticCurveTo(w/2,0,w/2,-9);P.lineTo(w/2,-h+32);P.quadraticCurveTo(w/2,-h+22,w/2-5,-h+18);P.closePath();
  if(glow){const g=.5+.5*Math.sin(t*8);c.save();c.shadowColor="rgba(255,220,90,.95)";c.shadowBlur=18+10*g;c.fillStyle="rgba(255,236,150,.5)";c.fill(P);c.restore();}
  c.fillStyle="rgba(215,238,250,.55)";c.fill(P);
  c.save();c.clip(P);const top=-(h-26)*cl01(fill);let i=0;for(let yy=-7;yy>top-6&&yy>-h+20;yy-=9){for(let xx=-w/2+7+((i%2)*4);xx<w/2-4;xx+=10){const k=(i*7+Math.round(xx))%6;circ(xx,yy,4.6,SWC[(k+6)%6],true,1.4);}i++;}
  c.restore();
  c.lineWidth=3;c.strokeStyle=C.ink;c.stroke(P);c.beginPath();c.moveTo(-w/2+7,-h+38);c.lineTo(-w/2+7,-18);stroke(3,"rgba(255,255,255,.7)");
  rr(-w/2+1,-h+6,w-2,13,4);c.fillStyle="#e5484d";c.fill();stroke(2.5);c.fillStyle="rgba(255,255,255,.35)";c.fillRect(-w/2+4,-h+8,w-8,3);
  rr(-w/2+6,-h*.5-11,w-12,22,5);c.fillStyle="#fbf4e3";c.fill();stroke(2);label(label2||"SWEET",0,-h*.5-3,10,C.ink);label("JAR",0,-h*.5+6,10,C.ink);
  c.restore();}
function cake(x,yb,t,th){const P=SWEETTH[th]||SWEETTH.pink,c=ctx;c.save();c.translate(x,yb);
  ellipse(0,0,64,8,C.shadow,false);ellipse(0,-3,62,8,"#fbf4e3");
  rr(-54,-34,108,31,6);c.fillStyle="#c97b5d";c.fill();stroke(3);c.fillStyle="#fbf4e3";c.beginPath();c.moveTo(-54,-34);for(let i=0;i<=9;i++){const xx=-54+i*12;c.lineTo(xx,-28+(i%2?7:0));}c.lineTo(54,-34);c.closePath();c.fill();
  rr(-40,-60,80,28,6);c.fillStyle="#f6cfdc";c.fill();stroke(3);c.fillStyle="#fbf4e3";c.beginPath();c.moveTo(-40,-60);for(let i=0;i<=8;i++){const xx=-40+i*10;c.lineTo(xx,-54+(i%2?6:0));}c.lineTo(40,-60);c.closePath();c.fill();
  for(let i=0;i<5;i++)circ(-30+i*15,-40,3,SWC[i],true,1.4);for(let i=0;i<7;i++)circ(-45+i*15,-16,3,SWC[(i+2)%6],true,1.4);
  c.restore();}
function sugarMonster(o,t){ctx.save();ctx.translate(o.x,o.y);wobble(67,1.2);const r=o.r||46,col=o.col||"#8e44ad",dk=shade(col,-.32),lt=shade(col,.4);const mood=o.mood||"idle",pt=o.pt||0;
  let sx=1,sy=1,bob=Math.sin(t*3)*3,rot=0;
  if(mood==="hit"){const k=Math.max(0,1-pt/.5);sx=1+.18*k;sy=1-.14*k;rot=Math.sin(pt*50)*.06*k;}
  if(mood==="laugh"){bob=Math.sin(t*22)*2.5;sy=1+Math.sin(t*22)*.04;}
  if(mood==="ko"){rot=Math.min(1,pt/.6)*.4;bob=Math.min(1,pt/.6)*10;}
  ellipse(0,r*1.0,r*.9,r*.15,C.shadow,false);
  ctx.translate(0,bob);ctx.rotate(rot);ctx.scale(sx,sy);
  ellipse(-r*.42,r*.86,r*.28,r*.15,dk);ellipse(r*.42,r*.86,r*.28,r*.15,dk);
  [-1,1].forEach(s=>{const pts=[[s*r*.4,-r*.6],[s*r*.5,-r*1.0],[s*r*.76,-r*1.12]];tube(pts,6,C.white);ctx.save();ctx.strokeStyle=C.red;ctx.lineWidth=2.6;for(let i=0;i<3;i++){const p=pts[0],q=pts[1];const k=.25+i*.28;const px=p[0]+(q[0]-p[0])*k,py=p[1]+(q[1]-p[1])*k;ctx.beginPath();ctx.moveTo(px-4,py+2);ctx.lineTo(px+4,py-2);ctx.stroke();}ctx.restore();});
  const ar=mood==="laugh"?Math.sin(t*20)*.3:Math.sin(t*3)*.15;
  [-1,1].forEach(s=>{hose([[s*r*.78,r*.1],[s*r*1.08,-r*.05+ar*10*s],[s*r*1.18,-r*.38]],7,col,4.5);glove(s*r*1.2,-r*.44,8,s*.3,true);});
  ctx.save();ctx.translate(r*1.2,-r*.5);ctx.rotate(.2);ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-22);stroke(5,C.ink);ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-22);stroke(3,"#cfd6db");for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*3.5,-22);ctx.lineTo(i*3.5,-32);stroke(2.4,"#cfd6db");}ctx.restore();
  const sh=[[0,0,r*.86,r*.82,0]];for(let i=0;i<14;i++){const a=i/14*TAU;sh.push([Math.cos(a)*r*.8,Math.sin(a)*r*.76,r*.24,r*.24,0]);}union(sh,col);
  ellipse(0,r*.34,r*.52,r*.38,lt,false);
  ctx.beginPath();ctx.moveTo(-r*.36,r*.18);ctx.quadraticCurveTo(0,r*.32,r*.36,r*.18);ctx.lineTo(r*.3,r*.62);ctx.quadraticCurveTo(0,r*.74,-r*.3,r*.62);ctx.closePath();ctx.fillStyle=C.white;ctx.fill();stroke(2.2);smallHeart(0,r*.45,1.1,C.pink);
  const look=o.look||{x:-.7,y:.2};
  if(mood==="ko"){[-1,1].forEach(s=>{ctx.save();ctx.translate(s*r*.3,-r*.22);ctx.rotate(t*6*s);ctx.beginPath();for(let a=0;a<12;a+=.3){const q=a*.9;ctx.lineTo(Math.cos(a)*q,Math.sin(a)*q);}stroke(2.4);ctx.restore();});}
  else{const lid=mood==="hit"?.55:0;eye(-r*.3,-r*.22,r*.2,r*.26,look,r*.1,lid,col);eye(r*.3,-r*.22,r*.2,r*.26,look,r*.1,lid,col);}
  ctx.beginPath();ctx.moveTo(-r*.5,-r*.55);ctx.lineTo(-r*.12,-r*.44);ctx.moveTo(r*.12,-r*.44);ctx.lineTo(r*.5,-r*.55);stroke(3.2);
  if(mood==="laugh"||mood==="chomp"){const op=mood==="chomp"?Math.abs(Math.sin(pt*14)):1;ctx.beginPath();ctx.ellipse(0,r*.04,r*.36,r*(.1+.16*op),0,0,TAU);ctx.fillStyle=C.redD;ctx.fill();stroke(2.5);ellipse(0,r*(.1+.08*op),r*.16,r*.06,C.pink,false);ctx.fillStyle=C.white;ctx.fillRect(-r*.2,r*.04-r*(.1+.16*op)+1,r*.12,r*.09);ctx.fillRect(r*.08,r*.04-r*(.1+.16*op)+1,r*.12,r*.09);}
  else if(mood==="hit"||mood==="ko"){ctx.beginPath();ctx.moveTo(-r*.24,r*.06);for(let i=1;i<=6;i++)ctx.lineTo(-r*.24+i*r*.08,r*.06+(i%2?-4:4));stroke(2.6);}
  else{ctx.beginPath();ctx.moveTo(-r*.34,-r*.02);ctx.quadraticCurveTo(0,r*.28,r*.34,-r*.02);ctx.closePath();ctx.fillStyle=C.redD;ctx.fill();stroke(2.5);ctx.fillStyle=C.white;ctx.beginPath();ctx.moveTo(-r*.2,0);ctx.lineTo(-r*.12,r*.1);ctx.lineTo(-r*.04,0);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(r*.04,0);ctx.lineTo(r*.12,r*.1);ctx.lineTo(r*.2,0);ctx.closePath();ctx.fill();}
  ctx.restore();}
