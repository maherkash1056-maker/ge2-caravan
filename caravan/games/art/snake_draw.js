/* Dhofari Snake skins — 2D renderer baked from the 3D skin pack (SKINTEX = body tiles + ring strips). */
const SKIN={
 masar:{name:"Masar",ar:"مصر",xp:0,a:"#7a2a20",b:"#c99a3e",o:"#3a140e",hat:"omani"},
 khareef:{name:"Khareef",ar:"خريف",xp:0,a:"#2f6f69",b:"#e6efe6",o:"#17403b",hat:"mist"},
 mix:{name:"Masar al-Khareef",ar:"مصر الخريف",xp:300,a:"#1e4f3c",b:"#36a89c",o:"#0f2a20",hat:"dhofari"},
 rose:{name:"Ward al-Jabal",ar:"ورد الجبل",xp:600,a:"#c2437a",b:"#2c5234",o:"#6b1f44",hat:"rose",tail:"bud"},
 halwa:{name:"Halwa wa Qahwa",ar:"حلوى وقهوة",xp:1000,a:"#6a2e10",b:"#c99a3e",o:"#3b1708",hat:"dallah",tail:"finjan"}};
const SKIMG={};for(const k in SKINTEX){const t=new Image();t.src=SKINTEX[k].tile;SKIMG[k]={tile:t};if(SKINTEX[k].ring){const r=new Image();r.src=SKINTEX[k].ring;SKIMG[k].ring=r;}}
const SKPATS=new WeakMap();
function skPat(ctx,k,scale){let m=SKPATS.get(ctx);if(!m){m={};SKPATS.set(ctx,m);}const key=k+"@"+scale;if(m[key])return m[key];const im=SKIMG[k]&&SKIMG[k].tile;if(!im||!im.complete||!im.naturalWidth)return null;const p=ctx.createPattern(im,"repeat");try{p.setTransform(new DOMMatrix().scale(scale));}catch(e){}m[key]=p;return p;}
/* head: [x,y]; pts: body points from neck to tail; r: radius; a: heading (rad); opts: {ghost,boost,shield,duel} */
function drawSnakeTex(ctx,k,head,pts,r,a,opts){
 opts=opts||{};const sk=SKIN[k]||SKIN.masar;k=SKIN[k]?k:"masar";const tex=SKINTEX[k];const pat=skPat(ctx,k,Math.max(0.18,r/26));
 ctx.globalAlpha=opts.ghost?0.45:1;ctx.lineCap="round";ctx.lineJoin="round";
 const path=()=>{ctx.beginPath();ctx.moveTo(head[0],head[1]);for(const q of pts)ctx.lineTo(q[0],q[1]);};
 if(opts.boost){path();ctx.strokeStyle="rgba(224,176,70,.55)";ctx.lineWidth=r*2.9;ctx.stroke();}
 path();ctx.strokeStyle=sk.o;ctx.lineWidth=r*2+2.4;ctx.stroke();
 path();ctx.strokeStyle=pat||sk.a;ctx.lineWidth=r*2;ctx.stroke();
 /* rings / decorations along the body */
 const step=Math.max(3,Math.round(26/Math.max(4,r))+2);
 for(let i=step;i<pts.length-1;i+=step){const q=pts[i],p=pts[i-1];const dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1,nx=-dy/L*r,ny=dx/L*r;
  if(tex.ring){ctx.strokeStyle=tex.ringc;ctx.lineWidth=r*0.55;ctx.beginPath();ctx.moveTo(q[0]-nx,q[1]-ny);ctx.lineTo(q[0]+nx,q[1]+ny);ctx.stroke();ctx.strokeStyle="rgba(255,235,170,.75)";ctx.lineWidth=Math.max(0.8,r*0.12);ctx.beginPath();ctx.moveTo(q[0]-nx,q[1]-ny);ctx.lineTo(q[0]+nx,q[1]+ny);ctx.stroke();}
  else if(k==="rose"){ctx.fillStyle="#2c5234";for(const sd of[-1,1]){ctx.beginPath();ctx.ellipse(q[0]+nx*sd*0.95,q[1]+ny*sd*0.95,r*0.42,r*0.2,Math.atan2(ny,nx),0,7);ctx.fill();}}
  else if(k==="khareef"&&i%(step*2)===0){ctx.fillStyle="rgba(255,255,255,.35)";ctx.beginPath();ctx.ellipse(q[0],q[1],r*0.9,r*0.45,Math.atan2(dy,dx),0,7);ctx.fill();}}
 /* sheen */
 ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=Math.max(1,r*0.22);ctx.beginPath();for(let i=1;i<pts.length;i++){const q=pts[i];if(i===1)ctx.moveTo(q[0],q[1]-r*0.5);else ctx.lineTo(q[0],q[1]-r*0.5);}ctx.stroke();
 /* tail piece */
 const t=pts[pts.length-1];if(t){if(sk.tail==="bud"){ctx.fillStyle="#e2548f";ctx.beginPath();ctx.ellipse(t[0],t[1],r*0.9,r*0.6,0,0,7);ctx.fill();ctx.fillStyle="#2c5234";ctx.beginPath();ctx.arc(t[0],t[1]+r*0.3,r*0.35,0,7);ctx.fill();}
  else if(sk.tail==="finjan"){ctx.fillStyle="#f6f1e6";ctx.beginPath();ctx.arc(t[0],t[1],r*0.75,0,7);ctx.fill();ctx.strokeStyle="#c99a3e";ctx.lineWidth=Math.max(1,r*0.18);ctx.stroke();ctx.fillStyle="#5a3418";ctx.beginPath();ctx.arc(t[0],t[1],r*0.42,0,7);ctx.fill();}}
 /* head */
 const ex=Math.cos(a),ey=Math.sin(a),hx=head[0]+ex*r*0.45,hy=head[1]+ey*r*0.45,R=r*1.5;
 ctx.fillStyle=sk.o;ctx.beginPath();ctx.ellipse(hx,hy,R*1.08+1.2,R*0.92+1.2,a,0,7);ctx.fill();
 ctx.fillStyle=pat||sk.a;ctx.beginPath();ctx.ellipse(hx,hy,R*1.08,R*0.92,a,0,7);ctx.fill();
 /* headgear */
 const bx=hx-ex*R*0.35,by=hy-ey*R*0.35;
 if(sk.hat==="omani"||sk.hat==="dhofari"){ctx.fillStyle=sk.hat==="omani"?"#8c2f22":"#1e5a44";ctx.beginPath();ctx.ellipse(bx,by,R*0.95,R*0.78,a,0,7);ctx.fill();ctx.strokeStyle="#e0b046";ctx.lineWidth=Math.max(1,R*0.16);ctx.beginPath();ctx.ellipse(bx,by,R*0.95,R*0.78,a,0,7);ctx.stroke();ctx.fillStyle=sk.hat==="omani"?"#2c5234":"#e6e9e1";ctx.beginPath();ctx.arc(bx-ey*R*0.9,by+ex*R*0.9,R*0.28,0,7);ctx.fill();}
 else if(sk.hat==="mist"){ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=Math.max(1,R*0.18);for(const d of[-0.7,0,0.7]){ctx.beginPath();ctx.arc(bx-ey*R*d,by+ex*R*d,R*0.9,a+Math.PI*0.75,a+Math.PI*1.25);ctx.stroke();}}
 else if(sk.hat==="rose"){ctx.fillStyle="#e2548f";for(let i=0;i<5;i++){const t=i/5*Math.PI*2;ctx.beginPath();ctx.arc(bx+Math.cos(t)*R*0.45,by+Math.sin(t)*R*0.45,R*0.42,0,7);ctx.fill();}ctx.fillStyle="#f6a2c4";ctx.beginPath();ctx.arc(bx,by,R*0.35,0,7);ctx.fill();}
 else if(sk.hat==="dallah"){ctx.fillStyle="#c99a3e";ctx.beginPath();ctx.ellipse(bx,by,R*0.62,R*0.72,a,0,7);ctx.fill();ctx.strokeStyle="#7a5a1e";ctx.lineWidth=Math.max(1,R*0.12);ctx.stroke();ctx.beginPath();ctx.moveTo(bx-ey*R*0.5,by+ex*R*0.5);ctx.lineTo(bx-ey*R*1.15+ex*R*0.3,by+ex*R*1.15+ey*R*0.3);ctx.stroke();ctx.fillStyle="#7a5a1e";ctx.beginPath();ctx.arc(bx-ex*R*0.55,by-ey*R*0.55,R*0.2,0,7);ctx.fill();}
 /* eyes */
 for(const sd of[-1,1]){const px=hx+ex*R*0.45-ey*sd*R*0.5,py=hy+ey*R*0.45+ex*sd*R*0.5;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(px,py,R*0.3,0,7);ctx.fill();ctx.fillStyle="#d9a441";ctx.beginPath();ctx.arc(px+ex*R*0.08,py+ey*R*0.08,R*0.2,0,7);ctx.fill();ctx.fillStyle="#1a0f08";ctx.beginPath();ctx.ellipse(px+ex*R*0.1,py+ey*R*0.1,R*0.07,R*0.15,a,0,7);ctx.fill();}
 /* tongue */
 ctx.strokeStyle="#c0392b";ctx.lineWidth=Math.max(1,R*0.12);ctx.beginPath();const tx=hx+ex*R*1.05,ty=hy+ey*R*1.05;ctx.moveTo(tx,ty);ctx.lineTo(tx+ex*R*0.5,ty+ey*R*0.5);ctx.lineTo(tx+ex*R*0.8-ey*R*0.2,ty+ey*R*0.8+ex*R*0.2);ctx.moveTo(tx+ex*R*0.5,ty+ey*R*0.5);ctx.lineTo(tx+ex*R*0.8+ey*R*0.2,ty+ey*R*0.8-ex*R*0.2);ctx.stroke();
 if(opts.shield){ctx.strokeStyle="#2f6f69";ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.beginPath();ctx.arc(head[0],head[1],r*2,0,7);ctx.stroke();ctx.setLineDash([]);}
 ctx.globalAlpha=1;
}
/* swatch for the skin picker */
function drawSkinSwatch(cv,k){const W=96,H=72,R=Math.min(3,Math.max(2,window.devicePixelRatio||2));cv.width=W*R;cv.height=H*R;const c=cv.getContext("2d");c.setTransform(R,0,0,R,0,0);
 const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,"#fdf6e3");g.addColorStop(1,"#efdcb4");c.fillStyle=g;c.fillRect(0,0,W,H);c.fillStyle="rgba(36,23,15,.10)";c.beginPath();c.ellipse(48,60,34,6,0,0,7);c.fill();
 const P=[[82,22],[52,70],[30,10],[12,52]],N=22,pts=[];for(let i=0;i<=N;i++){const t=i/N,u=1-t;pts.push([u*u*u*P[0][0]+3*u*u*t*P[1][0]+3*u*t*t*P[2][0]+t*t*t*P[3][0],u*u*u*P[0][1]+3*u*u*t*P[1][1]+3*u*t*t*P[2][1]+t*t*t*P[3][1]]);}
 const head=pts[0],a=Math.atan2(head[1]-pts[2][1],head[0]-pts[2][0]);drawSnakeTex(c,k,head,pts.slice(1),6.5,a,{});
 const im=SKIMG[k]&&SKIMG[k].tile;if(im&&!im.complete)im.addEventListener("load",()=>drawSkinSwatch(cv,k),{once:true});}
