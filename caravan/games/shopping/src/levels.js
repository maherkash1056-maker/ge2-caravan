/* ================= LEVELS v2: long seeded chunk levels + bonus rooms + decoration layer ================= */
const ROWS=15;
function RNG(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const WORLDS=[
 {name:"Khareef Hills",sky:["#79c4ff","#cfeeff"],far:"#5f9ec8",mid:"#6fb35a",near:"#3f8a3a",ground:"grass",deco:"grass",castleSky:["#1b1226","#3a2140"]},
 {name:"Desert Night",sky:["#141b3f","#4a3a6b"],far:"#2b2f55",mid:"#8a6a3a",near:"#5e4624",ground:"sand",deco:"sand",castleSky:["#120a14","#2a1420"]}
];
const LEVELS=[
 {w:0,n:1,len:480,diff:1,item:"dates"},{w:0,n:2,len:540,diff:2,item:"laban"},{w:0,n:3,len:560,diff:2,item:"bread",special:"camel"},{w:0,n:4,len:580,diff:3,item:"rice",special:"fire"},{w:0,n:5,len:400,diff:3,castle:true,item:"frankincense",boss:"scorpion"},
 {w:1,n:1,len:560,diff:3,item:"halwa"},{w:1,n:2,len:600,diff:4,item:"water",special:"khanjar"},{w:1,n:3,len:620,diff:4,item:"coffee",special:"glide"},{w:1,n:4,len:680,diff:5,item:"eggs"},{w:1,n:5,len:460,diff:5,castle:true,item:"honey",boss:"djinn"}
];
function makeGrid(W){const g=[];for(let y=0;y<ROWS;y++)g.push(new Array(W).fill("."));return g;}
function bonusRoom(seed,castle,diff){const r=RNG(seed);const W=44;const g=makeGrid(W);const set=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<ROWS)g[y][x]=c;};
 for(let x=0;x<W;x++){set(x,0,"H");set(x,13,"#");set(x,14,"=");}for(let y=0;y<ROWS;y++){set(0,y,"H");set(W-1,y,"H");}
 // mini level: coins, a few hazards and enemies that scale with difficulty
 for(let x=4;x<W-8;x++){if(x%9<4)set(x,9,"C");if(x%9===5)set(x,10,"o");if(x%9===6)set(x,10,"o");if(x%11===7)set(x,6,"C");}
 const haz=Math.min(4,diff);for(let i=0;i<haz;i++){const x=8+Math.floor(r()*(W-18));if(g[12][x]==="."&&g[12][x+1]==="."){if(castle){set(x,13,"L");set(x+1,13,"L");set(x,14,"L");set(x+1,14,"L");set(x,10,"o");set(x+1,10,"o");}else{set(x,12,"S");}}}
 for(let i=0;i<Math.max(1,Math.floor(diff/2));i++){set(10+Math.floor(r()*(W-20)),12,r()<0.5?"E":"V");}
 for(let x=6;x<W-8;x+=7)set(x,5,r()<0.6?"?":"B");
 set(2,12,"R");set(W-4,12,"Z");set(W-3,12,"z");
 return{grid:g.map(a=>a.join("")),width:W};}
function genLevel(idx){const L=LEVELS[idx];const r=RNG(7000+idx*977);const W=L.len+60;const g=makeGrid(W);const deco=[];const rooms=[];
 const set=(x,y,ch)=>{if(x>=0&&x<W&&y>=0&&y<ROWS)g[y][x]=ch;};const get=(x,y)=>(x<0||x>=W||y<0||y>=ROWS)?"=":g[y][x];
 const col=(x,gh)=>{for(let y=gh;y<ROWS;y++)set(x,y,y===gh?"#":"=");};
 const diff=L.diff,castle=!!L.castle,base=13;let x=0;const special=L.special||"";
 const run=(n,h)=>{for(let i=0;i<n;i++){col(x,h||base);x++;}};
 // 1-1 opening, built by hand. Ki: walk, one block, one beetle. Sho: a step and a small gap with a coin arc. Ten: power-up, two beetles, first A? block. Ketsu: a secret and the checkpoint.
 const opening=()=>{run(20,base);set(3,base-1,"S");deco.push({t:"sign",x:6,y:base-1});set(12,base-4,"?");set(14,base-3,"C");set(15,base-4,"C");set(16,base-3,"C");set(18,base-1,"E");
  run(4,base);for(let i=0;i<3;i++){col(x,base);set(x,base-1,"H");x++;}run(3,base);set(x,base-3,"C");set(x+1,base-4,"C");x+=2;run(6,base);
  run(10,base);set(x-8,base-4,"B");set(x-7,base-4,"!");set(x-6,base-4,"B");set(x-3,base-1,"E");set(x-1,base-1,"E");run(8,base);set(x-5,base-4,"Q");
  run(14,base);set(x-11,base-4,"I");deco.push({t:"sign",x:x-11,y:base-1});set(x-8,base-3,"C");set(x-7,base-3,"C");set(x-6,base-3,"C");set(x-4,base-1,"K");run(2,base);};
 const pick=a=>a[Math.floor(r()*a.length)];
 if(idx===0){opening();}else{run(14,base);set(3,base-1,"S");}if(special==="camel")set(8,base-1,"O");if(special==="glide")set(9,base-5,"^");if(special==="fire")set(9,base-5,"~");if(special==="khanjar")set(9,base-5,"$");
 let powerPlaced=idx===0?1:0,qCount=idx===0?1:0,bonusPlaced=false,springPlaced=0;const cps=[];for(let c=idx===0?160:80;c<L.len-60;c+=80)cps.push(c);let cpi=0;
 let chunks=castle?["flat","lava","spikes","pillars","flat","lava","blocks","virus","platforms","cannon","drones","lavaplanks","flat","spikes"]:["flat","gap","stairs","pipe","blocks","platforms","hill","coins","enemies","gap","flat","blocks","bridge","spring","treeplat","cannon","drones","hill","pipe","turtles"];
 if(special==="camel")chunks=["flat","hill","gap","enemies","coins","bridge","flat","hill","turtles","blocks","gap","pipe"];
 if(special==="fire")chunks=["flat","cactus","blocks","cactus","gap","stairs","cactus","pipe","coins","enemies","platforms","cactus"];
 if(special==="khanjar")chunks=["khanjar","enemies","flat","khanjar","turtles","blocks","gap","khanjar","cactus","drones","hill","pipe"];
 if(special==="glide")chunks=["sky","flat","sky","blocks","sky","coins","pipe","sky","hill","drones","sky"];
 while(x<L.len-40){
  if(cpi<cps.length&&x>=cps[cpi]){run(8,base);set(x-5,base-1,"K");if(special==="camel")set(x-2,base-1,"O");if(special==="glide")set(x-2,base-5,"^");cpi++;continue;}
  let c=pick(chunks);if(castle&&x<60)c=pick(["flat","blocks","spikes","flat"]);else if(!castle&&x<48)c=pick(["flat","coins","hill","blocks"]);
  if(c==="flat"){const n=6+Math.floor(r()*8);run(n,base);if(r()<0.8){set(x-Math.floor(n/2),base-1,castle&&r()<0.5&&x>70?"V":"E");if(diff>=3&&r()<0.5)set(x-2,base-1,"E");}if(r()<0.4&&!castle)set(x-2,base-4,"C");if(!castle&&n>=10&&r()<0.3&&x>90){set(x-3,base-4,"I");deco.push({t:"sign",x:x-3,y:base-1});}}
  else if(c==="gap"){const w=2+Math.min(2,Math.floor(r()*(diff+2)));run(3,base);for(let i=0;i<w;i++)set(x+i,base-3-((i>0&&i<w-1)?1:0),"C");x+=w;run(3,base);}
  else if(c==="lava"){const w=2+Math.min(2,Math.floor(r()*(diff)));run(3,base);for(let i=0;i<w;i++){set(x,13,"L");set(x,14,"L");set(x,base-3-((i>0&&i<w-1)?1:0),"C");x++;}run(3,base);}
  else if(c==="lavaplanks"){run(3,base);const w=6+Math.floor(r()*4);for(let i=0;i<w;i++){set(x,13,"L");set(x,14,"L");if(i%3!==2)set(x,11,"o");if(i%3===1)set(x,8,"C");x++;}run(3,base);}
  else if(c==="bridge"){run(3,base);const w=6+Math.floor(r()*5);for(let i=0;i<w;i++){set(x,14,"A");if(!(diff>=2&&i===Math.floor(w/2)))set(x,13,"o");else set(x,13,"A");if(i%2)set(x,10,"C");x++;}if(diff>=2)set(x-Math.floor(w/2),8,"W");run(3,base);}
  else if(c==="spikes"){run(3,base);const w=1+Math.floor(r()*2);for(let i=0;i<w;i++){col(x,base);set(x,base-1,"S");x++;}run(3,base);}
  else if(c==="stairs"){const h=2+Math.floor(r()*Math.min(4,diff+2));run(2,base);for(let i=1;i<=h;i++){col(x,base);for(let k=0;k<i;k++)set(x,base-1-k,"H");x++;}const top=1+Math.floor(r()*3);for(let i=0;i<top;i++){col(x,base);for(let k=0;k<h;k++)set(x,base-1-k,"H");if(i===0)set(x,base-2-h,"C");x++;}if(r()<0.5){x+=2+Math.floor(r()*2);}for(let i=h;i>=1;i--){col(x,base);for(let k=0;k<i;k++)set(x,base-1-k,"H");x++;}run(2,base);}
  else if(c==="pipe"){run(3,base);const h=2+Math.floor(r()*Math.min(3,diff+1));const bonus=!bonusPlaced&&r()<0.6;for(let k=0;k<h;k++){set(x,base-1-k,k===h-1?(bonus?"Y":"T"):"p");set(x+1,base-1-k,k===h-1?"t":"p");}col(x,base);col(x+1,base);if(bonus){bonusPlaced=true;rooms.push({px:x,room:bonusRoom(500+idx,castle,diff)});}else if(r()<0.35+diff*0.1)set(x,base-1-h,"V");x+=2;run(3,base);}
  else if(c==="blocks"){const n=3+Math.floor(r()*5);run(2,base);const row=base-4;for(let i=0;i<n;i++){col(x,base);let ch=r()<0.45?"?":"B";if(powerPlaced<2&&i===Math.floor(n/2)&&r()<0.7){ch="!";powerPlaced++;}else if(r()<0.4){ch="Q";qCount++;}set(x,row,ch);if(r()<0.3)set(x,row-4,"?");else if(r()<0.3)set(x,row-2,"C");x++;}if(r()<0.5)set(x-n,base-1,"E");run(2,base);}
  else if(c==="pillars"){run(2,base);for(let i=0;i<4;i++){col(x,base);const h=1+Math.floor(r()*3);for(let k=0;k<h;k++)set(x,base-1-k,"H");if(r()<0.4)set(x,base-2-h,"C");x++;if(r()<0.5){set(x,13,"L");set(x,14,"L");x++;}}run(2,base);}
  else if(c==="platforms"){run(2,base);const w=5+Math.floor(r()*3);const x0=x;if(castle){for(let i=0;i<w;i++){set(x+i,13,"L");set(x+i,14,"L");}}if(diff>=2&&r()<0.5){set(x0+Math.floor(w/2),9,"M");}else{set(x0+1,11,"o");set(x0+2,11,"o");set(x0+Math.floor(w/2)+1,9,"o");set(x0+Math.floor(w/2),9,"o");set(x0+w-2,11,"o");set(x0+w-3,11,"o");set(x0+Math.floor(w/2),7,"C");set(x0+Math.floor(w/2)+1,7,"C");}x+=w;run(2,base);}
  else if(c==="hill"){const h=1+Math.floor(r()*3);const n=5+Math.floor(r()*6);for(let i=0;i<n;i++){col(x,base-h);if(i===2&&r()<0.6)set(x,base-h-1,"E");x++;}if(r()<0.5)set(x-2,base-h-3,"C");}
  else if(c==="coins"){const n=5+Math.floor(r()*4);for(let i=0;i<n;i++){col(x,base);const y=base-3-Math.round(Math.sin(i/(n-1)*Math.PI)*2);set(x,y,"C");x++;}}
  else if(c==="enemies"){run(9,base);const k=1+Math.floor(r()*(diff+1));for(let i=0;i<k;i++)set(x-2-i*2,base-1,r()<0.2?"V":r()<0.45?"u":"E");}
  else if(c==="virus"){run(6,base);set(x-3,base-1,"V");set(x-5,base-6,"B");set(x-4,base-6,"?");set(x-3,base-6,"B");}
  else if(c==="spring"){run(3,base);set(x,base-1,"J");x++;run(2,base);const h=4+Math.floor(r()*2);for(let k=0;k<h;k++)set(x,base-1-k,"H");col(x,base);set(x,base-2-h,"C");set(x-1,base-3-h,"C");x++;for(let k=0;k<h;k++)set(x,base-1-k,"H");col(x,base);x++;run(3,base);springPlaced++;}
  else if(c==="treeplat"){run(2,base);const n=7+Math.floor(r()*4);for(let i=0;i<n;i++){col(x,base);if(i>=1&&i<=3)set(x,10,"o");if(i>=4&&i<=6)set(x,7,"o");if(i>=1&&i<=6)set(x,(i<=3?10:7)-2,"C");x++;}if(diff>=1)set(x-4,base-1,"E");run(2,base);}
  else if(c==="cannon"){run(4,base);const h=2+Math.floor(r()*2);for(let k=0;k<h;k++)set(x,base-1-k,"H");col(x,base);set(x,base-1-h,"N");x++;run(5,base);}
  else if(c==="turtles"){run(8,base);set(x-3,base-1,"u");if(diff>=3)set(x-6,base-1,"u");}
  else if(c==="cactus"){run(7,base);set(x-3,base-1,"V");if(r()<0.5)set(x-5,base-1,"V");if(r()<0.5)set(x-4,base-5,"~");}
  else if(c==="khanjar"){run(6,base);set(x-3,base-5,"$");run(10,base);for(let i=0;i<3+Math.floor(r()*3);i++)set(x-2-i*2,base-1,r()<0.3?"V":r()<0.5?"u":"E");}
  else if(c==="sky"){run(2,base);const h=4+Math.floor(r()*2);for(let i=1;i<=h;i++){col(x,base);for(let k=0;k<i;k++)set(x,base-1-k,"H");x++;}col(x,base);for(let k=0;k<h;k++)set(x,base-1-k,"H");x++;const w=7+Math.floor(r()*4);for(let i=0;i<w;i++){if(i%3===1)set(x,base-h-2,"C");if(i%4===2)set(x,11,"o");x++;}run(3,base);}
  else if(c==="drones"){const n=8+Math.floor(r()*4);run(n,base);set(x-Math.floor(n/2),base-6,"W");if(diff>=3)set(x-2,base-8,"W");}
 }
 run(8,base);
 if(castle){for(let k=0;k<5;k++)set(x,base-1-k,"H");col(x,base);x++;run(30,base);set(x-10,base-1,"X");for(let k=0;k<5;k++)set(x,base-1-k,"H");col(x,base);x++;set(x,base-1,"D");set(x,base-2,"D");set(x,base-3,"D");col(x,base);x++;run(12,base);set(x-7,base-1,"G");}
 else{for(let i=1;i<=7;i++){col(x,base);for(let k=0;k<i;k++)set(x,base-1-k,"H");x++;}run(3,base);set(x+1,base-1,"F");run(12,base);set(x-5,base-1,"G");run(8,base);}
 for(let y=0;y<ROWS;y++)for(let xx=x;xx<W;xx++)g[y][xx]="=";
 while(qCount<6){let done=false;for(let xx=30;xx<x-30&&!done;xx+=7){for(let y=5;y<12;y++){if(g[y][xx]==="?"){g[y][xx]="Q";qCount++;done=true;break;}}}if(!done)break;}
 if(!castle&&!g.some(row=>row.includes("I"))){for(let xx=100;xx<x-40;xx++){let ok=true;for(let k=-3;k<=3;k++){if(get(xx+k,base)!=="#"||get(xx+k,base-1)!=="."||get(xx+k,base-4)!=="."||get(xx+k,base-3)!==".")ok=false;}if(ok){set(xx,base-4,"I");deco.push({t:"sign",x:xx,y:base-1});break;}}}
 // decoration layer: on ground tops
 const dr=RNG(400+idx);for(let xx=10;xx<x-14;xx++){for(let y=1;y<ROWS;y++){if(get(xx,y)==="#"&&get(xx,y-1)==="."&&get(xx+1,y-1)==="."){const v=dr();
   if(castle){if(v<0.08)deco.push({t:"torch",x:xx,y:y-4});else if(v<0.11)deco.push({t:"skull",x:xx,y:y-1});break;}
   if(L.w===0){if(v<0.10)deco.push({t:"bush",x:xx,y:y-1});else if(v<0.16&&get(xx,y-2)==="."&&get(xx,y-3)===".")deco.push({t:"tree",x:xx,y:y-3});else if(v<0.28)deco.push({t:"flower",x:xx,y:y-1,v:Math.floor(dr()*3)});else if(v<0.31)deco.push({t:"rock",x:xx,y:y-1});else if(v<0.36)deco.push({t:"fence",x:xx,y:y-1});}
   else{if(v<0.07&&get(xx,y-2)==="."&&get(xx,y-3)===".")deco.push({t:"palm",x:xx,y:y-3});else if(v<0.12)deco.push({t:"rock",x:xx,y:y-1});else if(v<0.15)deco.push({t:"camel",x:xx,y:y-2});else if(v<0.2)deco.push({t:"flower",x:xx,y:y-1,v:2});}
   break;}}}
 return {grid:g.map(a=>a.join("")),width:x,world:L.w,num:L.n,castle,name:(L.w+1)+"-"+L.n,deco,rooms,item:L.item,diff:L.diff,boss:L.boss,special};
}
