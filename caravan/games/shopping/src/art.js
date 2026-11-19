/* ================= PIXEL ART v2 ================= */
const PAL={c:"#f6ead0",C:"#dbc9a4",h:"#fffaf0",b:"#2f66b3",B:"#1b3f78",L:"#5f95e0",w:"#ffffff",k:"#161616",r:"#d93a2b",R:"#8d1e15",g:"#9a9a9a",d:"#4b4b4b",D:"#2b2b2b",y:"#f7c948",Y:"#c88b12",o:"#ef8a2f",n:"#8b5a2b",N:"#5e3a17",e:"#62b84c",E:"#2f7f2d",p:"#a056d6",P:"#612a93",l:"#a7d8ff",m:"#ff80b5",s:"#d9b97a",t:"#78909c",x:"#ff5a2e",q:"#ffd27a",u:"#3c6e2f"};
function sprite(rows){const h=rows.length,w=rows[0].length;const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=rows[y][x];if(ch==="."||!PAL[ch])continue;g.fillStyle=PAL[ch];g.fillRect(x,y,1,1);}return c;}
function flipH(c){const o=document.createElement("canvas");o.width=c.width;o.height=c.height;const g=o.getContext("2d");g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);return o;}
function cnv(w,h,fn){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");fn(g,w,h);return c;}
function srand(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const px=(g,x,y,col,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w||1,h||1);};
/* ---- Bolt the robot (16x20) ---- */
const BODY=[
"......rr........",
"......rr........",
".......g........",
".......g........",
".dddddddddddddd.",
".dhhhhhhhhhhhcd.",
".dcbbbbbbbbbbcd.",
".dcbwwbLLLLwwcd.",
".dcbwkbLLLLwkcd.",
".dcbbbbLLLLbbcd.",
".dcbbkbbbbbkbcd.",
".dcbbbkkkkkbbcd.",
".dcbbbbbbbbbbcd.",
".dccccccccccCCd.",
".dc.kkk...c.rCd.",
".dDDDDDDDDDDDDd."];
function boltFrame(kind){const r=BODY.map(s=>s.split(""));const arm=(x,y)=>{if(r[y])r[y][x]="g";};
 if(kind==="jump"){arm(0,6);arm(0,5);arm(15,6);arm(15,5);}else if(kind==="throw"){arm(0,9);arm(0,10);arm(15,8);arm(15,7);}else{arm(0,9);arm(0,10);arm(15,9);arm(15,10);}
 if(kind!=="jump"){r[8][15]="r";r[7][15]="r";r[6][15]="g";r[5][15]="g";}
 const legs={idle:["....gg....gg....","....gg....gg....","...cccc..cccc...","...dddd..dddd..."],walk1:["...gg......gg...","...gg......gg...","..cccc....cccc..","..dddd....dddd.."],walk2:[".....gg..gg.....",".....gg..gg.....","....cccc.ccc....","....dddd.ddd...."],jump:["....gg....gg....","....gg...gg.....","...cccc.cccc....","...dddd.dddd...."],duck:["....gg....gg....","...cccc..cccc...","...dddd..dddd...","................"]}[kind==="throw"?"idle":kind];
 return r.map(a=>a.join("")).concat(legs);}
const BOLT={};["idle","walk1","walk2","jump","throw"].forEach(k=>{BOLT[k]=sprite(boltFrame(k));BOLT[k+"L"]=flipH(BOLT[k]);});
const HELMET=sprite(["....yyyyyyyy....","...yqqqqqqqyy...","..yqYyyyyyyYyy..","..YYYYYYYYYYYY..","..YY........YY.."]);
/* ---- enemies ---- */
const BUG=[sprite(["....kk....kk....",".....k....k.....","...eeeeeeeeee...","..eeeeeeeeeeee..",".eeewwEEEEwweee.",".eeewkEEEEkweee.",".eeeeeeeeeeeeee.",".eEEEEEEEEEEEEe.","..EEEEEEEEEEEE..","...EE.EEEE.EE...","..kk...kk...kk..",".kk....kk....kk."]),
 sprite(["....kk....kk....",".....k....k.....","...eeeeeeeeee...","..eeeeeeeeeeee..",".eeewwEEEEwweee.",".eeewkEEEEkweee.",".eeeeeeeeeeeeee.",".eEEEEEEEEEEEEe.","..EEEEEEEEEEEE..","...EE.EEEE.EE...","....kk..kk..kk..","...kk..kk....kk."])];
const BUGFLAT=sprite(["................","................","................","................","................","................","................","................","...eeeeeeeeee...",".eeewwEEEEwweee.",".EEEkkEEEEkkEEE.","..EEEEEEEEEEEE.."]);
const VIRUS=[sprite([".......p........","...p...p...p....","....p.ppp.p.....",".....ppppp......","..pppppppppp.p..","p.ppwwppppwwpp..","..ppwkppppkwpp.p","..pppppppppppp..","..ppppPPPPpppp..","....ppppppp.....","...p.ppppp.p....","...p...p...p...."]),
 sprite(["...p...p...p....","....p..p..p.....","....p.ppp.p.....",".....ppppp......","p.pppppppppp....","..ppwwppppwwpp.p","p.ppwkppppkwpp..","..pppppppppppp.p","..ppppPPPPpppp..","....ppppppp.....","...p.ppppp.p....","..p....p....p..."])];
const DRONE=[sprite(["..gggggggggggg..","........g.......","......dddddd....",".....dttttttd...","....dtwwttwwtd..","....dtwkttkwtd..","....dttttttttd..",".....dttttttd...","......dddddd....","....k........k..","...kk........kk.","................"]),
 sprite(["......gggg......","........g.......","......dddddd....",".....dttttttd...","....dtwwttwwtd..","....dtwkttkwtd..","....dttttttttd..",".....dttttttd...","......dddddd....",".....k......k...","....kk......kk..","................"])];
const SHOT=sprite(["...kkkk...","..kkkkkk..",".kkDDDDkk.","kkDwwDDDkk","kDwwDDDDDk","kDDDDDDDDk","kkDDDDDDkk",".kkDDDDkk.","..kkkkkk..","...kkkk..."]);
/* ---- items ---- */
const COIN=[sprite(["..yyyy..",".yqqqyy.","yqYyyYyy","yqYyyYyy","yqYyyYyy","yqYyyYyy","yqYyyYyy","yqYyyYyy","yqYyyYyy",".yyYYyy.","..yyyy..","........"]),sprite(["...yy...","..yqYy..","..yqYy..","..yqYy..","..yqYy..","..yqYy..","..yqYy..","..yqYy..","..yqYy..","..yqYy..","...yy...","........"]),sprite(["...yy...","...yy...","...yy...","...yy...","...yy...","...yy...","...yy...","...yy...","...yy...","...yy...","...yy...","........"])];
const CHIP=sprite(["..ee........ee..","..ee........ee..","kkkkkkkkkkkkkkkk","kEEEEEEEEEEEEEEk","kEEwwEEEEEEEEEEk","kEEwkEEyqqyEEEEk","kEEEEEEyyyyEEEEk","kEEEEEEyyyyEEEEk","kEEEEEEEEEEEEEEk","kEEEEEEEEEEEEEEk","kkkkkkkkkkkkkkkk","..ee........ee..","..ee........ee..","................","................","................"]);
const TOOLBOX=sprite(["......dddd......",".....d....d.....","rrrrrrrrrrrrrrrr","rRRRRRRRRRRRRRRr","rRRRRRRRRRRRRRRr","rrrrrrrrrrrrrrrr","rRRRRRRwwRRRRRRr","rRRRRRRwwRRRRRRr","rRRRRRRRRRRRRRRr","rRRRRRRRRRRRRRRr","rrrrrrrrrrrrrrrr","................","................","................","................","................"]);
const SCREW=sprite(["..g.","..g.",".gg.",".rr.",".rr.","...."]);
const HEART=sprite([".rr.rr.","rrrrrrr","rrrrrrr",".rrrrr.","..rrr..","...r..."]);
const ONEUP=sprite(["..eeee..",".eeEEee.","eeEhhEee","eeEhhEee",".eeEEee.","..eeee..","...dd...","...dd..."]);
/* ---- procedural tiles ---- */
function bevel(g,col,light,dark,w,h){px(g,0,0,col,w,h);px(g,0,0,light,w,1);px(g,0,0,light,1,h);px(g,0,h-1,dark,w,1);px(g,w-1,0,dark,1,h);}
function groundTile(seed,kind){return cnv(16,16,(g)=>{const r=srand(seed);if(kind==="grass"){px(g,0,0,"#8f5a2b",16,16);for(let i=0;i<14;i++)px(g,Math.floor(r()*16),4+Math.floor(r()*12),r()<0.5?"#6a3f1a":"#a46f3b");px(g,0,0,"#4fa83a",16,4);px(g,0,0,"#7bd05a",16,1);for(let i=0;i<5;i++){const x=Math.floor(r()*16);px(g,x,1+Math.floor(r()*2),"#2f7f2d");}for(let i=0;i<3;i++){const x=Math.floor(r()*15);px(g,x,-1+1,"#9be37a",1,1);px(g,x,4,"#2f7f2d",2,1);}px(g,0,15,"#4a2a10",16,1);}
  else if(kind==="sand"){px(g,0,0,"#e2c48a",16,16);for(let i=0;i<16;i++)px(g,Math.floor(r()*16),Math.floor(r()*16),r()<0.5?"#cfae6c":"#f0d9a6");px(g,0,0,"#f3dfae",16,2);px(g,0,0,"#fff1c8",16,1);px(g,0,15,"#b58f4d",16,1);}
  else{px(g,0,0,"#6f6f78",16,16);for(let i=0;i<10;i++)px(g,Math.floor(r()*16),Math.floor(r()*16),r()<0.5?"#5a5a63":"#86868f");px(g,0,0,"#8f8f99",16,1);px(g,0,15,"#3f3f47",16,1);px(g,7,0,"#4a4a52",1,8);px(g,0,8,"#4a4a52",16,1);px(g,12,8,"#4a4a52",1,8);}});}
function dirtTile(seed,kind){return cnv(16,16,(g)=>{const r=srand(seed);if(kind==="sand"){px(g,0,0,"#d4b06f",16,16);for(let i=0;i<14;i++)px(g,Math.floor(r()*16),Math.floor(r()*16),r()<0.5?"#c09a58":"#e3c689");}else if(kind==="stone"){px(g,0,0,"#5e5e67",16,16);for(let i=0;i<10;i++)px(g,Math.floor(r()*16),Math.floor(r()*16),r()<0.5?"#4a4a52":"#73737c");px(g,7,0,"#3f3f47",1,8);px(g,0,8,"#3f3f47",16,1);px(g,12,8,"#3f3f47",1,8);}else{px(g,0,0,"#8f5a2b",16,16);for(let i=0;i<16;i++)px(g,Math.floor(r()*16),Math.floor(r()*16),r()<0.5?"#6a3f1a":"#a46f3b");if(r()<0.5){px(g,3+Math.floor(r()*8),3+Math.floor(r()*8),"#5a3314",3,2);}}});}
const GROUND={grass:[groundTile(1,"grass"),groundTile(2,"grass"),groundTile(3,"grass")],sand:[groundTile(4,"sand"),groundTile(5,"sand"),groundTile(6,"sand")],stone:[groundTile(7,"stone"),groundTile(8,"stone"),groundTile(9,"stone")]};
const DIRT={grass:[dirtTile(11,"grass"),dirtTile(12,"grass"),dirtTile(13,"grass")],sand:[dirtTile(14,"sand"),dirtTile(15,"sand"),dirtTile(16,"sand")],stone:[dirtTile(17,"stone"),dirtTile(18,"stone"),dirtTile(19,"stone")]};
const T_BRICK=cnv(16,16,g=>{px(g,0,0,"#9a3a2a",16,16);const b=(x,y,w)=>{px(g,x,y,"#c9533c",w,7);px(g,x,y,"#e46a50",w,1);px(g,x,y,"#e46a50",1,7);px(g,x+w-1,y,"#7d2a1c",1,7);px(g,x,y+6,"#7d2a1c",w,1);};b(0,0,8);b(8,0,8);b(0,8,4);b(4,8,8);b(12,8,4);px(g,0,7,"#5e1e12",16,1);px(g,0,15,"#5e1e12",16,1);});
const T_Q=[0,1,2].map(f=>cnv(16,16,g=>{bevel(g,"#f0b429","#ffe08a","#9c6a0a",16,16);px(g,1,1,"#ffd45c",14,1);px(g,1,1,"#ffd45c",1,14);[[2,2],[13,2],[2,13],[13,13]].forEach(([x,y])=>px(g,x,y,"#7a4f05"));const q=["..xxxx..",".xx..xx.",".....xx.","....xx..","...xx...","...xx...","........","...xx..."];q.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c==="x")px(g,4+xx,4+yy,"#7a4f05");}));px(g,5,4,"#fff2c4",3,1);if(f===1){px(g,3,3,"rgba(255,255,255,0.35)",10,10);}if(f===2){px(g,2,2,"rgba(255,255,255,0.55)",12,2);}}));
const T_QA=cnv(16,16,g=>{bevel(g,"#2f66b3","#8fc3ff","#15335f",16,16);px(g,1,1,"#5f95e0",14,1);px(g,1,1,"#5f95e0",1,14);[[2,2],[13,2],[2,13],[13,13]].forEach(([x,y])=>px(g,x,y,"#102a4f"));const a=[".xx..","x..x.","xxxx.","x..x.","x..x."];a.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c==="x")px(g,2+xx,5+yy,"#ffffff");}));const q=["xxx.",".. x","..x.",".x..","....",".x.."];q.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c==="x")px(g,8+xx,4+yy,"#ffffff");}));px(g,9,4,"#ffffff",3,1);px(g,11,5,"#ffffff");px(g,10,6,"#ffffff");px(g,10,7,"#ffffff");px(g,10,9,"#ffffff");});
const T_USED=cnv(16,16,g=>{bevel(g,"#a0703a","#c9985e","#5c3a16",16,16);[[2,2],[13,2],[2,13],[13,13]].forEach(([x,y])=>px(g,x,y,"#4a2d10"));});
const T_HARD=cnv(16,16,g=>{bevel(g,"#8d99a6","#c9d3dc","#4b555f",16,16);px(g,1,1,"#aeb9c4",14,1);px(g,1,1,"#aeb9c4",1,14);px(g,4,6,"#6b7681",6,1);px(g,9,7,"#6b7681",1,3);});
const T_CASTLE=cnv(16,16,g=>{px(g,0,0,"#4a4a55",16,16);const b=(x,y,w)=>{px(g,x,y,"#5f5f6b",w,7);px(g,x,y,"#777784",w,1);px(g,x,y,"#777784",1,7);px(g,x+w-1,y,"#3a3a44",1,7);px(g,x,y+6,"#3a3a44",w,1);};b(0,0,8);b(8,0,8);b(0,8,4);b(4,8,8);b(12,8,4);px(g,0,7,"#2b2b33",16,1);px(g,0,15,"#2b2b33",16,1);});
const T_SPIKE=cnv(16,16,g=>{px(g,0,13,"#4b4b4b",16,3);px(g,0,13,"#6b6b6b",16,1);for(let i=0;i<4;i++){const x=i*4;for(let y=0;y<7;y++){const w=Math.max(1,Math.round((y+1)/2));px(g,x+2-Math.floor(w/2),6+y,"#bfc7cf",w,1);}px(g,x+1,9,"#ffffff",1,3);}});
const T_LAVA=[0,1].map(f=>cnv(16,16,g=>{px(g,0,0,"#ff6a2e",16,16);const r=srand(30+f);for(let i=0;i<8;i++)px(g,Math.floor(r()*16),Math.floor(r()*16),r()<0.5?"#ff9a3e":"#e0441c",2,1);px(g,0,0,"#ffd27a",16,1);px(g,f?3:9,2,"#ffe3a0",2,1);px(g,f?11:4,5,"#ffb04e",2,2);}));
const T_WATER=[0,1].map(f=>cnv(16,16,g=>{px(g,0,0,"#2f7fd1",16,16);px(g,0,0,"#7dc4ff",16,1);px(g,f?2:8,3,"#9ad4ff",4,1);px(g,f?10:2,7,"#5fa8ef",3,1);px(g,f?5:12,12,"#1f5fa8",4,1);}));
const T_PLANK=cnv(16,16,g=>{px(g,0,0,"#b07a3c",16,6);px(g,0,0,"#d79a55",16,1);px(g,0,5,"#6b4420",16,1);px(g,2,2,"#4a2d10",1,2);px(g,13,2,"#4a2d10",1,2);px(g,7,1,"#8a5a28",1,4);});
const SPRING=[cnv(16,16,g=>{px(g,2,13,"#4b4b4b",12,3);px(g,2,13,"#7a7a7a",12,1);for(let y=7;y<13;y+=2)px(g,4,y,"#bbbbbb",8,1);px(g,3,5,"#d93a2b",10,3);px(g,3,5,"#ff7a6a",10,1);}),cnv(16,16,g=>{px(g,2,13,"#4b4b4b",12,3);px(g,2,13,"#7a7a7a",12,1);px(g,4,11,"#bbbbbb",8,1);px(g,3,9,"#d93a2b",10,3);px(g,3,9,"#ff7a6a",10,1);})];
const TORCH=[0,1].map(f=>cnv(16,16,g=>{px(g,7,8,"#6b4420",2,7);px(g,6,7,"#8a8a8a",4,2);px(g,5+f,2,"#ff9a3e",6-f*2,5);px(g,6+f,0,"#ffd27a",4-f*2,4);px(g,7,3,"#ffffff",2,2);}));
const CANNON=cnv(16,16,g=>{bevel(g,"#4b4b55","#7a7a86","#232329",16,16);px(g,3,5,"#1a1a1a",10,6);px(g,3,5,"#3a3a3a",10,1);px(g,11,7,"#000",3,2);});
const GATE=cnv(16,16,g=>{bevel(g,"#6b4420","#a06a3a","#3a2210",16,16);px(g,7,2,"#f7c948",2,2);for(let y=0;y<16;y+=4)px(g,0,y,"#3a2210",16,1);});
/* ---- decorations ---- */
const BUSH=cnv(32,16,g=>{const c=(x,y,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};c(8,11,7,"#2f7f2d");c(22,11,8,"#2f7f2d");c(15,9,8,"#2f7f2d");c(8,9,5,"#4fa83a");c(22,8,6,"#4fa83a");c(15,7,6,"#62b84c");c(13,6,3,"#9be37a");c(22,7,2,"#9be37a");});
const TREE=cnv(32,48,g=>{px(g,13,28,"#6b4420",6,20);px(g,13,28,"#8a5a28",2,20);const c=(x,y,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};c(16,18,14,"#2f7f2d");c(9,22,9,"#2f7f2d");c(23,22,9,"#2f7f2d");c(16,16,11,"#4fa83a");c(11,20,6,"#4fa83a");c(14,12,5,"#9be37a");c(20,14,3,"#9be37a");});
const PALM=cnv(32,48,g=>{for(let y=12;y<48;y++){const x=15+Math.round(Math.sin((48-y)/40)*4);px(g,x,y,y%4<2?"#8a5a28":"#6b4420",4,1);}g.strokeStyle="#2f7f2d";g.lineWidth=3;for(let k=0;k<7;k++){const a=k/7*Math.PI*2;g.beginPath();g.moveTo(19,12);g.quadraticCurveTo(19+Math.cos(a)*9,12+Math.sin(a)*4-4,19+Math.cos(a)*14,12+Math.sin(a)*8+2);g.stroke();}g.strokeStyle="#62b84c";g.lineWidth=1;for(let k=0;k<7;k++){const a=k/7*Math.PI*2;g.beginPath();g.moveTo(19,12);g.quadraticCurveTo(19+Math.cos(a)*9,12+Math.sin(a)*4-5,19+Math.cos(a)*13,12+Math.sin(a)*8);g.stroke();}px(g,17,11,"#8d1e15",2,2);px(g,20,12,"#8d1e15",2,2);});
const FLOWER=[cnv(8,8,g=>{px(g,3,4,"#2f7f2d",2,4);px(g,2,1,"#ff80b5",4,3);px(g,3,2,"#f7c948",2,1);}),cnv(8,8,g=>{px(g,3,4,"#2f7f2d",2,4);px(g,2,1,"#ffffff",4,3);px(g,3,2,"#f7c948",2,1);}),cnv(8,8,g=>{px(g,3,4,"#2f7f2d",2,4);px(g,2,1,"#ff5a2e",4,3);px(g,3,2,"#ffd27a",2,1);})];
const ROCK=cnv(16,8,g=>{px(g,2,3,"#6b7681",12,5);px(g,4,1,"#8d99a6",8,3);px(g,5,1,"#c9d3dc",4,1);px(g,2,7,"#4b555f",12,1);});
const FENCE=cnv(16,16,g=>{px(g,0,8,"#c9985e",16,2);px(g,0,12,"#c9985e",16,2);px(g,2,5,"#a0703a",3,11);px(g,11,5,"#a0703a",3,11);px(g,2,5,"#d79a55",3,1);px(g,11,5,"#d79a55",3,1);});
const SIGN=cnv(16,16,g=>{px(g,7,8,"#6b4420",2,8);px(g,2,2,"#c9985e",12,7);px(g,2,2,"#e0b57a",12,1);px(g,4,4,"#4a2d10",8,1);px(g,4,6,"#4a2d10",6,1);});
const SKULL=cnv(16,16,g=>{px(g,4,4,"#d9d9d9",8,7);px(g,5,11,"#d9d9d9",6,2);px(g,5,6,"#2b2b2b",2,2);px(g,9,6,"#2b2b2b",2,2);px(g,7,9,"#2b2b2b",2,1);});
const CAMELSIL=cnv(32,20,g=>{g.fillStyle="#3b2a1a";g.beginPath();g.ellipse(14,11,9,5,0,0,Math.PI*2);g.fill();g.beginPath();g.ellipse(13,7,4,3,0,0,Math.PI*2);g.fill();px(g,22,5,"#3b2a1a",2,7);px(g,22,3,"#3b2a1a",5,3);px(g,7,14,"#3b2a1a",2,6);px(g,11,14,"#3b2a1a",2,6);px(g,16,14,"#3b2a1a",2,6);px(g,20,14,"#3b2a1a",2,6);});
const FLAG=sprite(["rrrrrrrrrr..","rrrrrrrrrrrr","rrrrwwrrrrrr","rrrwwwwrrrr.","rrrrwwrrrr..","rrrrrrrrr...","rrrrrrrr....","rrrrrr......"]);
const T_FLAGBALL=sprite(["....yyyy....","..yyqqyyyy..",".yyqyyyyyyy.",".yyyyyyyyyy.",".yyyyyyyyyy.","..yyyyyyyy..","....yyyy....","....gggg...."]);
/* ================= v3: human heroes, mushroom, bosses, groceries ================= */
Object.assign(PAL,{S:"#c98a5a",i:"#8a5a3a",W:"#f8f8f6",V:"#dfe6ea",M:"#e9dcc0",a:"#2c5fa8",A:"#1d1d22",J:"#34364a",I:"#5a2a93",F:"#ff9a3e",G:"#ffe6b8",Z:"#b03a2e"});
/* man: massar (M/a pattern), skin S, dishdasha D, trim T, sandals n */
const MAN_S=[
".....MMMMMM.....",
"....MaMMaMMM....",
"....MMMaMMMM....",
".....SSSSSS.....",
".....SkSSkS.....",
".....SSSSSS.....",
"......SiiS......",
"....DDDDDDDD....",
"...DDDDTTDDDD...",
"..SDDDDTTDDDDS..",
"..SDDDDDDDDDDS..",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...nn......nn...",
"...nn......nn..."];
const MAN_B=[
".....MMMMMM.....",
"....MaMMaMMM....",
"....MMMaMMMM....",
"....MMMMMMMM....",
".....SSSSSS.....",
".....SkSSkS.....",
".....SSSSSS.....",
"......SiiS......",
"....DDDDDDDD....",
"...DDDDTTDDDD...",
"..SDDDDTTDDDDS..",
"..SDDDDTTDDDDS..",
"..SDDDDDDDDDDS..",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...nn......nn...",
"...nn......nn..."];
/* woman: hijab H, skin S, abaya D, trim T */
const WOM_S=[
".....HHHHHH.....",
"....HHHHHHHH....",
"....HHSSSSHH....",
"....HHSkSkHH....",
"....HHSSSSHH....",
".....HHSSHH.....",
"....HHHHHHHH....",
"...HDDDDDDDDH...",
"..SDDDDDDDDDDS..",
"..SDDDDDDDDDDS..",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDTDDDTDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...TTTTTTTTTT...",
"...nn......nn...",
"...nn......nn..."];
const WOM_B=[
".....HHHHHH.....",
"....HHHHHHHH....",
"....HHHHHHHH....",
"....HHSSSSHH....",
"....HHSkSkHH....",
"....HHSSSSHH....",
".....HHSSHH.....",
"....HHHHHHHH....",
"...HDDDDDDDDH...",
"..SDDDDDDDDDDS..",
"..SDDDDDDDDDDS..",
"..SDDDDDDDDDDS..",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDTDDDTDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDTDDDTDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...DDDDDDDDDD...",
"...TTTTTTTTTT...",
"...nn......nn...",
"...nn......nn..."];
/* state colours: 0 small, 1 big, 2 tools (red trim) */
const SKIN={man:[{D:"W",T:"V",H:"M"},{D:"l",T:"a",H:"M"},{D:"G",T:"Z",H:"M"}],woman:[{D:"A",T:"J",H:"A"},{D:"J",T:"y",H:"A"},{D:"I",T:"Z",H:"A"}]};
function heroFrame(rows,kind,map){const r=rows.map(s=>s.split("").map(ch=>map[ch]||ch));const H=r.length;
 const feet={idle:["...nn......nn...","...nn......nn..."],walk1:["..nn........nn..","..nn........nn.."],walk2:[".....nn..nn.....",".....nn..nn....."],jump:["....nn....nn....","....nn..........."],throw:["...nn......nn...","...nn......nn..."]}[kind];
 r[H-2]=feet[0].split("");r[H-1]=feet[1].split("");
 if(kind==="jump"){r[9][1]="S";r[8][1]="S";r[9][14]="S";r[8][14]="S";r[10][2]=map.D;r[10][13]=map.D;}
 if(kind==="throw"){r[9][14]="S";r[8][14]="S";r[8][15]="r";r[7][15]="r";}
 if(kind==="walk1"){r[H-3][3]=".";r[H-3][12]=".";}
 return r.map(a=>a.join(""));}
const HERO={};for(const who of ["man","woman"]){HERO[who]=[];for(let st=0;st<3;st++){const big=st>0;const base=who==="man"?(big?MAN_B:MAN_S):(big?WOM_B:WOM_S);const fr={};for(const k of ["idle","walk1","walk2","jump","throw"]){fr[k]=sprite(heroFrame(base,k,SKIN[who][st]));fr[k+"L"]=flipH(fr[k]);}HERO[who].push(fr);}}
const MUSHROOM=sprite([
".....oooooo.....",
"...ooGGooooGo...",
"..ooooooGGoooo..",
".oGGooooooooGGo.",
".ooooooGGooooooo",
".ooooooooooooooo",
"..FFFFFFFFFFFF..",
"......MMMM......",
"......MkMM......",
"......MMMM......",
"......MMMM......",
"......MMMM......",
"................","................","................","................"]);
const BOSS_BUG=[0,1].map(f=>cnv(32,24,g=>{const s=BUG[f];g.imageSmoothingEnabled=false;g.drawImage(s,0,0,16,12,0,0,32,24);px(g,10,4,"#f7c948",4,3);px(g,18,4,"#f7c948",4,3);px(g,8,0,"#f7c948",2,3);px(g,22,0,"#f7c948",2,3);px(g,12,2,"#f7c948",8,2);}));
const BOSS_GLITCH=[0,1].map(f=>cnv(32,24,g=>{g.imageSmoothingEnabled=false;g.drawImage(VIRUS[f],0,0,16,12,0,0,32,24);px(g,12,13,"#ff5a2e",8,2);}));
const GROCERY={dates:"🌴",laban:"🥛",bread:"🍞",rice:"🍚",frankincense:"🪔",halwa:"🍮",water:"💧",coffee:"☕"};
/* ================= v4: chosen mobs, bosses, camel, power-ups ================= */
Object.assign(PAL,{v:"#c9533c",j:"#7dc4ff",f:"#ff3b2e",z:"#5fb24a"});
const BEETLE=[sprite(["....kk....kk....","...k......k.....","...sssssssss....","..sYYsssssYYss..","..sYwYsssYwYss..","..sYkYsssYkYss..","..ssssssssssss..","..sYYYYYYYYYYs..","..sYYssYYssYYs..","...ssssssssss...","..kk..kk..kk....",".kk..kk..kk....."]),
 sprite(["....kk....kk....","...k......k.....","...sssssssss....","..sYYsssssYYss..","..sYwYsssYwYss..","..sYkYsssYkYss..","..ssssssssssss..","..sYYYYYYYYYYs..","..sYYssYYssYYs..","...ssssssssss...","...kk..kk..kk...","....kk..kk..kk.."])];
const BEETLE_CRACK=sprite(["....kk....kk....","...k......k.....","...sssssssss....","..sYYssskYYYss..","..sYwYsskYwYss..","..sYkYskssYkss..","..sssskssssss...","..sYYkYYYYYYYs..","..sYkssYYssYYs..","...ssssssssss...","..kk..kk..kk....",".kk..kk..kk....."]);
const CACTUS=[sprite([".......e........","......eee.......","..e...eee.......",".eee..eee...e...",".eee..eee..eee..","..e...eee..eee..","..e..eEeE...e...","..eeeeEeEeeee...","....eEwEEwEe....","....eEkEEkEe....","....eEEEEEEe....",".....eeeeee....."]),
 sprite([".......e........","......eee.......","..e...eee...e...",".eee..eee..eee..",".eee..eee..eee..","..e...eee...e...","..e..eEeE...e...","..eeeeEeEeeee...","....eEwEEwEe....","....eEkEEkEe....","....eEEEEEEe....","....eeeeeeee...."])];
const TURTLE=[sprite(["................","......bbbbbb....","....bbjjjjjjbb..","...bjjjbbjjjjjb.","..bjjjbjjbjjjjjb","..bbbbbbbbbbbbbb","..e.eeeeeeeeee.e","..EEe........eEE",".EwkE........EE.",".EEEE...........","..ee..ee..ee....","......ee..ee...."]),
 sprite(["................","......bbbbbb....","....bbjjjjjjbb..","...bjjjbbjjjjjb.","..bjjjbjjbjjjjjb","..bbbbbbbbbbbbbb","..e.eeeeeeeeee.e","..EEe........eEE",".EwkE........EE.",".EEEE...........","...ee..ee..ee...",".....ee..ee....."])];
const SHELL=sprite(["................","................","................","................","......bbbbbb....","....bbjjjjjjbb..","...bjjjbbjjjjjb.","..bjjjbjjbjjjjjb","..bbbbbbbbbbbbbb","..bBBBBBBBBBBBb.","...bbbbbbbbbbb..","................"]);
const FALCON=[sprite(["..nn......nn....",".nnnn....nnnn...",".nnnnnn.nnnnnn..","..nnnnnnnnnnnn..","...nnnnnnnnnn...","....nnSSSSnn....","....nnSwkSnn....",".....nSSSSn.....","......nyyn......",".......yy.......","......Y..Y......","................"]),
 sprite(["................","................","..nn......nn....","..nnnn..nnnn....","...nnnnnnnnn....","....nnSSSSnn....","....nnSwkSnn....",".....nSSSSn.....","......nyyn......",".......yy.......","......Y..Y......","................"])];
const CAMEL=[sprite(["..........SS....","..........SSS...","..........SS....","...rrrr...SS....","..rSSSSrr.SSS...","..rSSSSSSSSSS...",".SSSSSSSSSSS....",".SSSSSSSSSS.....","..SS...SS.......","..SS...SS.......","..SS...SS.......","..ii...ii......."]),
 sprite(["..........SS....","..........SSS...","..........SS....","...rrrr...SS....","..rSSSSrr.SSS...","..rSSSSSSSSSS...",".SSSSSSSSSSS....",".SSSSSSSSSS.....","...SS...SS......",".SS.....SS......","SS.......SS.....","ii.......ii....."])];
const CAMEL_L=CAMEL.map(flipH);
const CRATE=cnv(16,16,g=>{bevel(g,"#a0703a","#d79a55","#5c3a16",16,16);px(g,2,2,"#5c3a16",12,1);px(g,2,13,"#5c3a16",12,1);px(g,2,2,"#5c3a16",1,12);px(g,13,2,"#5c3a16",1,12);g.fillStyle="#5c3a16";g.beginPath();g.moveTo(3,3);g.lineTo(12,12);g.lineTo(12,11);g.lineTo(4,3);g.fill();g.beginPath();g.moveTo(12,3);g.lineTo(3,12);g.lineTo(4,12);g.lineTo(12,4);g.fill();px(g,6,6,"#f7c948",4,4);});
const SUPERDATE=sprite(["......ee........",".....ee.........","....nnnnnn......","...nNNnnNNn.....","..nNNnnnnNNn....","..nNnnnnnnNn....","..nnnnnnnnnn....","..nNNNNNNNNn....","...nNNNNNNn.....","....nnnnnn......","................","................","................","................","................","................"]);
const BURNER=sprite(["......xx........",".....xqqx.......","....xqyyqx......",".....xqqx.......","......yy........","....ssssss......","...ssyyyyss.....","...ssssssss.....","....sNNNNs......","...ssssssss.....","..ssssssssss....","................","................","................","................","................"]);
const KHANJAR=sprite(["....yy..........","...yqqy.........","...yqqy.........","....yy..........","....ww..........","....ww..........","....ww..........",".....ww.........",".....ww.........","......ww........","......ww........","................","................","................","................","................"]);
const CAPEITEM=sprite(["....nnnnnnnn....","..nnnnnnnnnnnn..",".nnnnnnnnnnnnnn.",".nn.nnnnnnnn.nn.","nn...nnnnnn...nn","n.....nnnn.....n","......nnnn......","......nnnn......",".......nn.......","................","................","................","................","................","................","................"]);
const CAPE_BACK=sprite(["................","................","................","................","................","................","................","...nn...........","..nnnn..........","..nnnn..........",".nnnnn..........",".nnnnn..........",".nnnnn..........","nnnnnn..........","nnnnn...........","nnnn............","nnn.............","................","................","................"]);
const CAPE_GLIDE=sprite([".nnnnnnnnnnnnnnnnnnnnnn.","nnnnnnnnnnnnnnnnnnnnnnnn","nn.nnnnnnnnnnnnnnnnnn.nn","n...nnnnnnnnnnnnnnnn...n",".....nnnnnnnnnnnnnn.....","........nnnnnnnn........"]);
const EMBER=sprite([".xx.","xqqx","xqqx",".xx."]);
const SANDBALL=sprite([".sss.","sssss","sshss","sssss",".sss."]);
const SCORPION=[0,1].map(f=>sprite(["........kk...kk.k...............","......kk..k...kkk...............","....kk....kkkkkkkk..............","...k.....kkkyyykkk..............","..k....kkkkyyyyykkkk............","..k...nnnnnnnnnnnnnnnn..........",".kk..nNNNwwNNNNwwNNNNn..........",".k...nNNNwkNNNNkwNNNNn..kkk.....","....nnnnnnnnnnnnnnnnnnn.k.k.....","...nNNNNNNNNNNNNNNNNNNnkk.k.....","....nnnnnnnnnnnnnnnnnnnnn.k.....",f?"..k...k...k...k...k...k.........":"...k...k...k...k...k...k........",f?".k...k...k...k...k...k..........":"..k...k...k...k...k...k........."]));
const SCORPION_L=SCORPION.map(flipH);
const DJINN=[0,1].map(f=>sprite(["............ssssssss............","..........sssssssssssss.........","........sssssssssssssssss.......",".......ssssswwssssswwssss.......",".......ssssswkssssskwssss.......","......ssssssssssssssssssss......","......sssssssssyyyysssssss......","......ssssssssssyyssssssss......",".......ssssssssssssssssss.......",f?"........ss.ssssssssss.ss........":".......ss..ssssssssss..ss.......",f?"..........s..ssssss..s..........":".........s..ssssssss..s.........","............s.ssss.s............",".............s.ss.s.............","..............s..s..............","................................","................................"]));
const DJINN_SOLID=sprite(["............gggggggg............","..........ggggggggggggg.........","........ggggggggggggggggg.......",".......gggggwwgggggwwgggg.......",".......gggggwkgggggkwgggg.......","......gggggggggggggggggggg......","......gggggggggdddddgggggg......","......ggggggggggddgggggggg......",".......gggggggggggggggggg.......","........gggggggggggggggg........","..........gggggggggggg..........","............gggggggg............",".............gggggg.............","..............gggg..............","................................","................................"]);
Object.assign(GROCERY,{eggs:"🥚",honey:"🍯"});
