/* ===================== GENRE: SWEET MATCH ===================== */
MODS.sweets=(()=>{let S=null,sp=null;
 const COLS=8,ROWS=7,CELL=40,BX=296,BY=50,NT=6,MX=146,MY=152,R=15;
 const px=c=>BX+c*CELL+CELL/2,py=r=>BY+r*CELL+CELL/2,K=(c,r)=>c+","+r;
 const CHEER=["Nice!","Yummy!","Wonderful!","Fantastic!","Super sweet!"];
 let uid=0;const simple=()=>G.diffKey==="simple";
 function mk(t){return {t,sp:null,oy:0,vy:0,pop:0,id:++uid};}
 function at(c,r){return c>=0&&c<COLS&&r>=0&&r<ROWS?S.g[r][c]:null;}
 function runs(){const out=[];
   for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){const a=S.g[r][c];if(!a||a.t<0){c++;continue;}let e=c+1;while(e<COLS&&S.g[r][e]&&S.g[r][e].t===a.t)e++;if(e-c>=3){const cells=[];for(let k=c;k<e;k++)cells.push([k,r]);out.push({cells,dir:"h"});}c=e;}}
   for(let c=0;c<COLS;c++){let r=0;while(r<ROWS){const a=S.g[r][c];if(!a||a.t<0){r++;continue;}let e=r+1;while(e<ROWS&&S.g[e][c]&&S.g[e][c].t===a.t)e++;if(e-r>=3){const cells=[];for(let k=r;k<e;k++)cells.push([c,k]);out.push({cells,dir:"v"});}r=e;}}
   return out;}
 function swapG(a,b){const t=S.g[a[1]][a[0]];S.g[a[1]][a[0]]=S.g[b[1]][b[0]];S.g[b[1]][b[0]]=t;}
 function findMove(){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const d of [[1,0],[0,1]]){const c2=c+d[0],r2=r+d[1];if(c2>=COLS||r2>=ROWS)continue;const A=S.g[r][c],B=S.g[r2][c2];if(!A||!B)continue;
     if(A.t<0||B.t<0)return [[c,r],[c2,r2]];swapG([c,r],[c2,r2]);const ok=runs().length>0;swapG([c,r],[c2,r2]);if(ok)return [[c,r],[c2,r2]];}return null;}
 function fillBoard(){for(let n=0;n<40;n++){S.g=[];for(let r=0;r<ROWS;r++){const row=[];S.g.push(row);for(let c=0;c<COLS;c++){let t,g=0;do{t=Math.floor(Math.random()*NT);g++;}while(g<40&&((c>=2&&row[c-1].t===t&&row[c-2].t===t)||(r>=2&&S.g[r-1][c].t===t&&S.g[r-2][c].t===t)));row.push(mk(t));}}if(findMove())return;}}
 function init(s){sp=s;uid=0;S={g:null,phase:"idle",sel:null,drag:null,cur:[3,3],grab:false,kb:false,sw:null,popping:[],popT:0,cascade:0,beams:[],rays:[],meter:0,M:18,moves:30,hp:Math.max(1,(G.qs&&G.qs.length)||6),mood:{m:"idle",pt:0},hint:null,idleT:0,heroT:0,tauntT:9,shT:0,shDone:false,cleared:0,best:0};
   fillBoard();S.meter=S.M*.6;S.g[2][5].sp="row";S.g[4][2].t=-1;S.g[4][2].sp="rainbow";}
 function start(s){init(s);const N=Math.max(1,G.qs.length);fillBoard();S.M=simple()?15:18;S.meter=0;S.moves=Math.round(4*N)+(simple()?12:6);S.hp=N;S.tauntT=8;}
 function tickFx(dt){S.mood.pt+=dt;if((S.mood.m==="hit"&&S.mood.pt>.55)||(S.mood.m==="laugh"&&S.mood.pt>1.6)||(S.mood.m==="chomp"&&S.mood.pt>1.2))S.mood={m:"idle",pt:0};
   S.heroT=Math.max(0,S.heroT-dt);S.beams.forEach(b=>b.t+=dt);S.beams=S.beams.filter(b=>b.t<.35);S.rays.forEach(b=>b.t+=dt);S.rays=S.rays.filter(b=>b.t<.4);}
 function trySwap(a,b){if(S.phase!=="idle"||!a||!b||!at(a[0],a[1])||!at(b[0],b[1]))return;if(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1)return;
   S.sel=null;S.grab=false;S.drag=null;S.hint=null;S.idleT=0;S.phase="swap";S.sw={a,b,t:0,dur:.14,back:false};SFX.tap();}
 function commonType(){const n=[0,0,0,0,0,0];for(const row of S.g)for(const e of row)if(e&&e.t>=0)n[e.t]++;let b=0;for(let i=1;i<NT;i++)if(n[i]>n[b])b=i;return b;}
 function popSet(clear,make){make=make||new Map();const q=[...clear],fired=new Set();
   while(q.length){const k=q.pop();if(fired.has(k))continue;const [c,r]=k.split(",").map(Number);const e=at(c,r);if(!e)continue;
     if(e.sp==="row"||e.sp==="col"){fired.add(k);S.beams.push({kind:e.sp,c,r,t:0});tone(1300,.2,"square",.03,320);
       const n=e.sp==="row"?COLS:ROWS;for(let i=0;i<n;i++){const kk=e.sp==="row"?K(i,r):K(c,i);if(!clear.has(kk)&&!make.has(kk)){clear.add(kk);q.push(kk);}}}
     else if(e.sp==="rainbow"){fired.add(k);const tt=commonType(),to=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const o=S.g[y][x];if(o&&o.t===tt){const kk=K(x,y);to.push([x,y]);if(!clear.has(kk)&&!make.has(kk)){clear.add(kk);q.push(kk);}}}S.rays.push({x:px(c),y:py(r),to,t:0});}}
   for(const m of make.values()){const e=at(m.p[0],m.p[1]);if(!e)continue;if(m.kind==="rainbow"){e.t=-1;e.sp="rainbow";}else e.sp=m.kind;addFx("burst",px(m.p[0]),py(m.p[1]),{dur:.45,col:ART.C.gold});}
   S.popping=[...clear].map(k=>k.split(",").map(Number));S.popT=0;S.phase="pop";const n=S.popping.length;if(!n){afterPop();return;}
   const pts=n*20*(1+S.cascade);G.score+=pts;S.cleared+=n;if(S.meter<S.M)S.meter=Math.min(S.M,S.meter+n*(1+S.cascade*.5));
   let sx=0,sy=0;S.popping.forEach(p=>{sx+=px(p[0]);sy+=py(p[1]);});addText(sx/n,sy/n,"+"+pts,ART.C.gold,18);
   if(S.cascade>=1){addText(BX+COLS*CELL/2,BY+ROWS*CELL/2-10,CHEER[Math.min(S.cascade,CHEER.length)-1],ART.C.pink,30);S.heroT=1;}
   S.best=Math.max(S.best,S.cascade+1);tone(520+S.cascade*140,.12,"triangle",.09,900+S.cascade*200);if(n>=4||S.cascade>=1)S.mood={m:"hit",pt:0};}
 function resolve(rs,swp){const clear=new Set(),make=new Map();
   for(const run of rs){run.cells.forEach(p=>clear.add(K(p[0],p[1])));const L=run.cells.length;if(L<4)continue;
     const order=[];if(swp)swp.forEach(s=>{if(run.cells.some(p=>p[0]===s[0]&&p[1]===s[1]))order.push(s);});
     const mid=Math.floor(L/2);for(let d=0;d<L;d++){const i=mid+(d%2?-(d+1)/2:d/2);if(i>=0&&i<L)order.push(run.cells[i]);}
     let anc=null;for(const p of order){const e=at(p[0],p[1]);if(e&&!e.sp&&e.t>=0&&!make.has(K(p[0],p[1]))){anc=p;break;}}
     if(anc)make.set(K(anc[0],anc[1]),{p:anc,kind:L>=5?"rainbow":(run.dir==="h"?"row":"col")});}
   for(const k of make.keys())clear.delete(k);popSet(clear,make);}
 function rainbowSwap(a,b){const A=at(a[0],a[1]),B=at(b[0],b[1]),clear=new Set();
   if(A.t<0&&B.t<0){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)clear.add(K(c,r));A.sp=B.sp=null;A.t=B.t=-2;showCard("SUGAR STORM!",ART.C.pink,1,34);}
   else{const Rp=A.t<0?a:b,Op=A.t<0?b:a,re=at(Rp[0],Rp[1]),tt=at(Op[0],Op[1]).t;re.sp=null;re.t=-2;clear.add(K(Rp[0],Rp[1]));const to=[];
     for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const e=S.g[r][c];if(e&&e.t===tt){clear.add(K(c,r));to.push([c,r]);}}S.rays.push({x:px(Rp[0]),y:py(Rp[1]),to,t:0});}
   SFX.super();popSet(clear,null);}
 function afterPop(){S.popping.forEach(p=>{S.g[p[1]][p[0]]=null;});S.popping=[];
   for(let c=0;c<COLS;c++){let w=ROWS-1;for(let r=ROWS-1;r>=0;r--){const e=S.g[r][c];if(e){if(w!==r){S.g[w][c]=e;S.g[r][c]=null;e.oy-=(w-r)*CELL;}w--;}}
     const empty=w+1;for(let r=0;r<empty;r++){const e=mk(Math.floor(Math.random()*NT));e.oy=-empty*CELL-6;S.g[r][c]=e;}}
   S.phase="fall";}
 function settle(){S.phase="idle";S.cascade=0;S.idleT=0;S.hint=null;
   if(S.meter>=S.M){S.mood={m:"chomp",pt:0};askQuestion({title:"THE SWEET JAR IS FULL!"});return;}
   if(S.moves<=0){outOfMoves();return;}
   if(!findMove()){S.phase="shuffle";S.shT=0;S.shDone=false;showCard("NO MOVES — SHUFFLE!",ART.C.pink,1,26);}}
 function placeRainbow(){const opts=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const e=S.g[r][c];if(e&&e.t>=0&&!e.sp)opts.push([c,r]);}if(!opts.length)return;const p=pick(opts),e=at(p[0],p[1]);e.t=-1;e.sp="rainbow";addFx("burst",px(p[0]),py(p[1]),{dur:.7,col:ART.C.gold});addFx("star",px(p[0]),py(p[1]),{dur:.8});}
 function win(){setSub("over");S.mood={m:"ko",pt:0};const bonus=S.moves*50;G.score+=bonus;SFX.crowd();showCard("SWEET VICTORY!",ART.C.gold,1.8,40);if(bonus)addText(BX+COLS*CELL/2,BY+ROWS*CELL/2+40,"+"+bonus+" for moves left",ART.C.gold,18);setTimeout(()=>finish(true,"monster"),2100);}
 function outOfMoves(){setSub("over");S.mood={m:"laugh",pt:0};SFX.groan();say(pick(["Yum! No more moves!","All your sweets are mine!",tauntOf(sp,1)]),2.2);showCard("OUT OF MOVES!",ART.C.red,1.6,34);setTimeout(()=>finish(false,"moves"),2100);}
 function update(dt,inp){tickFx(dt);
   if(S.phase==="idle"){S.idleT+=dt;if(S.idleT>6&&!S.hint)S.hint=findMove();S.tauntT-=dt;if(S.tauntT<=0){S.tauntT=rand(11,15);say(tauntOf(sp,Math.floor(rand(0,3))),2.4);}return;}
   if(S.phase==="swap"){S.sw.t+=dt;if(S.sw.t<S.sw.dur)return;const {a,b,back}=S.sw;swapG(a,b);S.sw=null;if(back){S.phase="idle";return;}
     const A=at(a[0],a[1]),B=at(b[0],b[1]);if(A.t<0||B.t<0){S.moves--;S.cascade=0;rainbowSwap(a,b);return;}
     const rs=runs();if(!rs.length){S.sw={a,b,t:0,dur:.14,back:true};tone(160,.12,"triangle",.08);addText((px(a[0])+px(b[0]))/2,(py(a[1])+py(b[1]))/2-14,"No match",ART.C.red,14);return;}
     S.moves--;S.cascade=0;resolve(rs,[b,a]);return;}
   if(S.phase==="pop"){S.popT+=dt;const k=Math.min(1,S.popT/.22);S.popping.forEach(p=>{const e=at(p[0],p[1]);if(e)e.pop=k;});if(S.popT>=.22)afterPop();return;}
   if(S.phase==="fall"){let moving=false;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const e=S.g[r][c];if(e&&e.oy<0){e.vy+=2600*dt;e.oy=Math.min(0,e.oy+e.vy*dt);if(e.oy<0)moving=true;else e.vy=0;}}
     if(!moving){const rs=runs();if(rs.length){S.cascade++;resolve(rs,null);}else settle();}return;}
   if(S.phase==="shuffle"){S.shT+=dt;if(S.shT>.45&&!S.shDone){S.shDone=true;fillBoard();}if(S.shT>.9){settle();}}}
 function idle(dt){if(S)tickFx(dt);}
 function onAnswer(ok,last){S.meter=0;
   if(ok){S.moves+=3;addText(150,96,"+3 MOVES",ART.C.teal,22);placeRainbow();S.mood={m:"hit",pt:0};S.heroT=1.4;heroSay(pick(["Yes!","Sweet!","Too easy!","Take that!"]),1.4);SFX.boom();
     if(last){S.hp=0;win();return;}S.hp=Math.max(1,S.hp-1);showCard("RAINBOW SWEET!",ART.C.gold,.9,32);}
   else{S.moves=Math.max(0,S.moves-3);addText(150,96,"−3 MOVES",ART.C.red,22);S.mood={m:"laugh",pt:0};say(tauntOf(sp,Math.floor(rand(0,3))),2.4);
     if(last){S.meter=Math.round(S.M*.5);showCard("THE MONSTER IS STILL HUNGRY!",ART.C.red,1.3,22);}else{S.hp=Math.max(1,S.hp-1);showCard("THE MONSTER EATS 3 MOVES!",ART.C.red,1.1,24);}
     if(S.moves<=0){outOfMoves();return;}}
   if(!findMove()){S.phase="shuffle";S.shT=0;S.shDone=false;}}
 function cellAt(x,y){const c=Math.floor((x-BX)/CELL),r=Math.floor((y-BY)/CELL);return c>=0&&c<COLS&&r>=0&&r<ROWS?[c,r]:null;}
 function pointer(type,x,y){if(!S)return;
   if(type==="down"){S.kb=false;const p=cellAt(x,y);if(!p){S.sel=null;return;}if(S.phase!=="idle")return;
     if(S.sel&&Math.abs(S.sel[0]-p[0])+Math.abs(S.sel[1]-p[1])===1){trySwap(S.sel,p);return;}
     if(S.sel&&S.sel[0]===p[0]&&S.sel[1]===p[1]){S.drag={p,x,y};return;}
     S.sel=p;S.drag={p,x,y};S.cur=p.slice();SFX.tap();return;}
   if(type==="move"&&S.drag){const dx=x-S.drag.x,dy=y-S.drag.y;if(Math.max(Math.abs(dx),Math.abs(dy))>14){const d=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];const from=S.drag.p,q=[from[0]+d[0],from[1]+d[1]];S.drag=null;if(at(q[0],q[1]))trySwap(from,q);}return;}
   if(type==="up")S.drag=null;}
 function key(k){if(!S)return false;const D={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],A:[-1,0],D:[1,0],W:[0,-1],S:[0,1]};
   if(D[k]){S.kb=true;const d=D[k];if(S.grab&&S.sel){const q=[S.sel[0]+d[0],S.sel[1]+d[1]];if(at(q[0],q[1])){const from=S.sel;S.cur=q.slice();trySwap(from,q);}return true;}
     S.cur=[clamp(S.cur[0]+d[0],0,COLS-1),clamp(S.cur[1]+d[1],0,ROWS-1)];return true;}
   if(k===" "||k==="Enter"){S.kb=true;if(S.phase!=="idle")return true;if(S.grab){S.grab=false;S.sel=null;}else{S.grab=true;S.sel=S.cur.slice();SFX.tap();}return true;}
   return false;}
 function render(t){if(!S)init(sp||G.spec);const s=G.spec||sp,th=s.sweetTheme||"pink";
   ART.sweetBg(t,th);ART.shelfJars(t,th);ART.cake(MX,278,t,th);
   ART.sugarMonster({x:MX,y:MY,r:44,col:s.foeCol||"#8e44ad",mood:S.mood.m,pt:S.mood.pt,look:S.sel?{x:.85,y:.35}:{x:.7,y:.25}},t);
   ART.robe(Object.assign({x:50,y:352,scale:.92,arms:S.heroT>0?"up":"hold",mood:S.heroT>0?"happy":"ok",look:{x:.7,y:-.3}},robeHero(s,"heart")),t);
   ART.jar(246,336,56,148,S.meter/S.M,t,S.meter>=S.M&&G.mode==="play");
   ART.boardFrame(BX,BY,COLS,ROWS,CELL,th);
   ctx.save();ctx.beginPath();ctx.rect(BX-2,BY-2,COLS*CELL+4,ROWS*CELL+4);ctx.clip();
   const sw=S.sw,k=sw?1-Math.pow(1-Math.min(1,sw.t/sw.dur),2):0;
   const shk=S.phase==="shuffle"?(S.shT<.45?1-S.shT/.45:Math.min(1,(S.shT-.45)/.45)):1;
   for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const e=S.g[r][c];if(!e)continue;let x=px(c),y=py(r)+e.oy;
     if(sw){if(c===sw.a[0]&&r===sw.a[1]){x+=(px(sw.b[0])-x)*k;y+=(py(sw.b[1])-py(r))*k;}else if(c===sw.b[0]&&r===sw.b[1]){x+=(px(sw.a[0])-x)*k;y+=(py(sw.a[1])-py(r))*k;}}
     let sc=1,al=1;if(e.pop>0){sc=1+e.pop*.45;al=1-e.pop;}
     const isSel=S.sel&&S.sel[0]===c&&S.sel[1]===r&&S.phase==="idle";const h=S.hint;const isHint=h&&S.idleT>6&&S.phase==="idle"&&((h[0][0]===c&&h[0][1]===r)||(h[1][0]===c&&h[1][1]===r));
     if(isSel){ctx.save();ctx.globalAlpha=.75;ART.circ(x,y,19,"#fff3b0",false);ctx.restore();sc*=1+.07*Math.sin(t*12);}
     if(isHint)sc*=1+.12*Math.abs(Math.sin(t*6));
     ART.sweet(e.t,x,y,R*sc*shk,t,e.sp,al);}
   for(const b of S.beams){const a=Math.max(0,1-b.t/.35);ctx.save();ctx.globalAlpha=a;if(b.kind==="row")ART.laser(BX,py(b.r),BX+COLS*CELL,py(b.r),12*a+2,"#ffe27a");else ART.laser(px(b.c),BY,px(b.c),BY+ROWS*CELL,12*a+2,"#ffe27a");ctx.restore();}
   for(const ry of S.rays){const a=Math.max(0,1-ry.t/.4);ctx.save();ctx.globalAlpha=a;ry.to.forEach(p=>ART.laser(ry.x,ry.y,px(p[0]),py(p[1]),3,"#fbc0d6"));ctx.restore();}
   ctx.restore();
   if(S.kb&&G.mode==="play"&&S.phase==="idle"){const c=S.cur;ctx.save();ctx.strokeStyle=S.grab?ART.C.red:ART.C.ink;ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.strokeRect(BX+c[0]*CELL+2,BY+c[1]*CELL+2,CELL-4,CELL-4);ctx.restore();}}
 function hud(){const low=S.moves<=5;hudText(16,19,"MOVES","left",12);ctx.save();if(low&&Math.floor(G.t*4)%2)ctx.globalAlpha=.55;hudText(68,20,String(S.moves),"left",22);ctx.restore();
   hudText(16,42,"SCORE "+G.score.toLocaleString(),"left",13);
   const N=Math.max(1,G.qs.length),x0=36,x1=256,y=70;hudText((x0+x1)/2,y-13,gv(sp,"enemy").toUpperCase().slice(0,28),"center",12);
   const w=(x1-x0)/N;ctx.save();for(let i=0;i<N;i++){ctx.fillStyle=i<S.hp?"#e5484d":"#e9e1cf";ctx.fillRect(x0+i*w+1,y-4,w-2,9);ctx.lineWidth=1.6;ctx.strokeStyle=ART.C.ink;ctx.strokeRect(x0+i*w+1,y-4,w-2,9);}ctx.restore();
   hudText(616,26,"QUESTION "+Math.min(G.qi+1,G.qs.length)+" of "+G.qs.length,"right",13);}
 return {id:"sweets",stick:false,noHearts:true,ownHud:true,keysTip:"Drag or click two sweets · arrow keys + Space also work",
  buttons(){return [];},pointer,key,
  help(s){return ["You are <b>"+esc(gv(s,"hero"))+"</b>. Swap two sweets next to each other to make a line of 3 or more.","Drag a sweet, or click it and then its neighbour. Keyboard: arrows to move, Space to pick up.","A line of 4 makes a striped sweet, a line of 5 a rainbow sweet. Fill the jar and beat <b>"+esc(gv(s,"enemy"))+"</b> before your moves run out!"];},
  init,start,update,idle,onAnswer,render,hud,
  bubbleAt(){return {x:MX,y:MY-58,dir:0};},heroBubbleAt(){return {x:76,y:236,dir:0};},
  resultLines(){return [["Moves left",String(S.moves)],["Sweets matched",String(S.cleared)],["Best chain",String(S.best)]];}};
})();
