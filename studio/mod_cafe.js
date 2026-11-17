/* ===================== GENRE: CAFÉ RUSH ===================== */
MODS.cafe=(()=>{let S=null,sp=null;
 const ST=[{n:"KAHWA",x:52,dur:.9},{n:"KARAK",x:130,dur:1.25},{n:"HALWA",x:208,dur:.7},{n:"LUQAIMAT",x:286,dur:1.45}];
 const SPOTS=[420,505,590],FEET=344,HERO_Y=300,TOP=252;
 const SAY=[["a cup of kahwa","two cups of kahwa","three cups of kahwa"],["a glass of karak","two glasses of karak","three glasses of karak"],["a bowl of halwa","two bowls of halwa","three bowls of halwa"],["a plate of luqaimat","two plates of luqaimat","three plates of luqaimat"]];
 const ABAYA=["#1d1d24","#2c2c3a","#3b2f4a","#1f3a5f","#4a2c2a"],HIJ=["#1f3a5f","#6c3483","#7b241c","#145a32","#2c3e50","#b9770e","#ecf0f1","#c0392b"],DISH=["#f4f1ea","#efe6d2","#dfe9ee","#d8d2c4","#e8dcc8","#c9d6df"],KUM=["#c0392b","#2980b9","#8e44ad","#27ae60","#d35400"],MAS=[["#8e44ad","#f1c40f"],["#c0392b","#f5cba7"],["#2c3e50","#e67e22"],["#7b241c","#f7dc6f"]],SKINS=["#f1c8a5","#d9a27a","#c98e5f","#a86b45","#8d5a3b"];
 let seedN=0;
 const simple=()=>G.diffKey==="simple";
 function ding(){tone(1318,.07,"square",.05);tone(1760,.14,"square",.05,null,now()+.07);}
 function newLook(){seedN++;const sk=pick(SKINS);
   if(Math.random()<.5)return {kind:"woman",robe:pick(ABAYA),hijab:pick(HIJ),trim:Math.random()<.5?pick(["#c89b3c","#c0392b","#2980b9","#f2dc92"]):null,skin:sk,seed:seedN};
   const ms=Math.random()<.35,m=pick(MAS);return {kind:"man",robe:pick(DISH),hat:ms?"massar":"kumma",hatCol:ms?m[0]:"#f8f5ee",hatCol2:ms?m[1]:pick(KUM),beard:Math.random()<.55,skin:sk,seed:seedN};}
 function criticLook(){return (sp&&sp.critic==="man")?{kind:"man",robe:"#f4f1ea",hat:"massar",hatCol:"#7b241c",hatCol2:"#f7dc6f",beard:true,bisht:"#1d1d24",glasses:true,badge:true,skin:"#c98e5f",seed:99}:{kind:"woman",robe:"#5b1e2d",hijab:"#1d1d24",trim:"#e4b84a",glasses:true,badge:true,skin:"#d9a27a",seed:98};}
 function heroLook(s){return robeHero(s,"cup");}
 function cap(x){return x.charAt(0).toUpperCase()+x.slice(1);}
 function orderText(items){const n=[0,0,0,0];items.forEach(k=>n[k]++);const parts=[];n.forEach((c,k)=>{if(c)parts.push(SAY[k][c-1]);});
   const list=parts.length===1?parts[0]:parts.slice(0,-1).join(", ")+" and "+parts[parts.length-1];
   return pick(["Hello! "+cap(list)+", please.","Can I have "+list+", please?","I would like "+list+", please."]);}
 function makeCust(spot,vip){const N=Math.max(1,G.qs.length),p=S.vipNo/N;let items=[];
   if(!vip){const maxI=p<.2?1:p<.55?2:3;const cnt=1+Math.floor(Math.random()*maxI);for(let i=0;i<cnt;i++)items.push(Math.floor(Math.random()*4));items.sort();}
   const pm=(13+5*items.length)*(simple()?1.35:1);
   return {spot,x:700+spot*14,tx:SPOTS[spot],state:"in",look:vip?criticLook():newLook(),items,got:items.map(()=>false),pend:items.map(()=>false),pat:pm,patMax:pm,walk:0,vip,greetT:0,sayTxt:null,sayT:0,mood:"happy",askT:0};}
 function demoCust(spot,items,look,f){const c={spot,x:SPOTS[spot],tx:SPOTS[spot],state:"wait",look,items,got:items.map((_,i)=>i===0&&items.length>1),pend:items.map(()=>false),pat:f*30,patMax:30,walk:0,vip:false,greetT:0,sayTxt:null,sayT:0,mood:f>.55?"happy":f>.28?"ok":"wait"};return c;}
 function init(s){sp=s;seedN=0;S={hero:{x:130,walk:0,pose:"pour",happyT:0,task:null},queue:[],st:ST.map(()=>({state:"idle",prog:0,shake:0})),ready:[false,false,false,true],cust:[null,null,null],leaving:[],fly:[],served:0,lost:0,vipNo:0,vipRight:0,vipNow:null,combo:0,nextC:.6,nextV:14,gapV:14,ending:false,demo:true};
   S.st[1].state="working";S.st[1].prog=.55;
   S.cust=[demoCust(0,[0,2],{kind:"woman",robe:"#1d1d24",hijab:"#6c3483",trim:"#c89b3c",skin:"#d9a27a",seed:11},.8),demoCust(1,[1],{kind:"man",robe:"#f4f1ea",hat:"kumma",hatCol:"#f8f5ee",hatCol2:"#2980b9",beard:true,skin:"#c98e5f",seed:12},.45),demoCust(2,[3,1],{kind:"woman",robe:"#2c2c3a",hijab:"#1f3a5f",skin:"#f1c8a5",seed:13},.2)];}
 function start(s){init(s);S.demo=false;S.cust=[null,null,null];S.ready=[false,false,false,false];S.st.forEach(st=>{st.state="idle";st.prog=0;});S.hero={x:170,walk:0,pose:"idle",happyT:0,task:null};
   S.nextV=S.gapV=simple()?17:14;S.nextC=.6;}
 function vipGap(){return simple()?19:16;}
 function gapC(){const N=Math.max(1,G.qs.length),p=Math.min(1,S.vipNo/N);const b=simple()?[6.6,4.6]:[5.6,3.5];return b[0]+(b[1]-b[0])*p+rand(-.6,.6);}
 function tapStation(i){if(!S||S.ending)return;const st=S.st[i];
   if(st.state!=="idle"){st.shake=.25;return;}
   if(S.ready[i]){st.shake=.3;addText(ST[i].x,214,"Ready!",ART.C.teal,15);return;}
   if(S.queue.length>=3){st.shake=.3;addText(ST[i].x,214,"Wait!",ART.C.red,15);return;}
   st.state="queued";S.queue.push(i);SFX.tap();}
 function leave(c,how){c.state="out";c.how=how;c.tx=760;const i=S.cust.indexOf(c);if(i>=0)S.cust[i]=null;S.leaving.push(c);
   if(how==="angry"){S.lost++;S.combo=0;c.mood="angry";c.sayTxt=pick(["Too slow!","I am leaving!","I waited too long!"]);c.sayT=1.6;G.inv=0;hurt();}
   else if(how==="bye"){c.mood="happy";c.sayTxt=pick(["Goodbye!","See you tomorrow!","Good night!"]);c.sayT=1.6;}}
 function pay(c){const f=Math.max(0,c.pat/c.patMax);const base=40*c.items.length,tip=Math.round(f*8)*5;S.combo++;const bonus=S.combo>=2?10*Math.min(S.combo,10):0;const tot=base+tip+bonus;G.score+=tot;S.served++;
   addText(c.x,FEET-150,"+"+tot,ART.C.gold,22);if(S.combo>=2)addText(c.x,FEET-176,"COMBO x"+S.combo,ART.C.pink,15);
   c.sayTxt=pick(["Thank you!","Delicious!","Lovely, thanks!","Perfect!","Very tasty!"]);c.sayT=1.5;c.mood="happy";ding();
   S.hero.happyT=.7;if(Math.random()<.25)heroSay(pick(["Enjoy!","Here you are!","You're welcome!"]),1.2);leave(c,"happy");}
 function endShift(){if(S.ending)return;S.ending=true;setSub("over");S.cust.forEach(c=>{if(c&&!c.vip)leave(c,"bye");});S.queue=[];S.hero.task=null;S.hero.happyT=3;
   const bonus=G.hearts*100;G.score+=bonus;SFX.crowd();showCard("CLOSING TIME!",ART.C.gold,1.8,36);if(bonus)addText(160,150,"+"+bonus+" for your stars",ART.C.gold,18);setTimeout(()=>finish(G.hearts>0,"close"),2100);}
 function moveLeaving(dt){for(const c of S.leaving){const sp2=c.how==="angry"?300:240;c.x+=sp2*dt;c.walk+=dt*13;if(c.sayT>0)c.sayT-=dt;}S.leaving=S.leaving.filter(c=>c.x<720);}
 function update(dt,inp){const h=S.hero;S.st.forEach(st=>{st.shake=Math.max(0,st.shake-dt);});
   /* customers arrive */
   S.nextC-=dt;S.nextV-=dt;const N=G.qs.length;const free=[0,1,2].filter(i=>!S.cust[i]);const vipDue=S.nextV<=0&&S.vipNo<N&&!S.vipNow;
   if(free.length){if(vipDue){const i=free.includes(1)?1:free[0];const c=makeCust(i,true);S.cust[i]=c;S.vipNow=c;}
     else if(S.nextC<=0&&!vipDue){const i=pick(free);S.cust[i]=makeCust(i,false);S.nextC=gapC();}}
   /* the hero works */
   if(!h.task&&S.queue.length){const i=S.queue.shift();h.task={i,t:0,dur:ST[i].dur*(simple()?.85:1),go:false};}
   if(h.task){const tx=ST[h.task.i].x,d=tx-h.x;
     if(Math.abs(d)>1.5){h.x+=Math.sign(d)*Math.min(Math.abs(d),520*dt);h.walk+=dt*16;h.pose="walk";}
     else{h.x=tx;h.walk=0;h.pose="pour";const st=S.st[h.task.i];if(!h.task.go){h.task.go=true;if(h.task.i===3)noise(.5,.035,null,5000);else noise(.25,.03,null,2500);}st.state="working";h.task.t+=dt;st.prog=Math.min(1,h.task.t/h.task.dur);
       if(h.task.t>=h.task.dur){st.state="idle";st.prog=0;S.ready[h.task.i]=true;tone(988,.08,"triangle",.07);h.task=null;}}}
   else h.pose=h.happyT>0?"happy":"idle";
   h.happyT=Math.max(0,h.happyT-dt);
   /* ready food flies to whoever ordered it */
   for(let i=0;i<4;i++){if(!S.ready[i])continue;let best=null,bj=-1,bf=9;
     for(const c of S.cust){if(!c||c.state!=="wait")continue;for(let j=0;j<c.items.length;j++){if(c.items[j]===i&&!c.got[j]&&!c.pend[j]){const f=c.pat/c.patMax;if(f<bf){bf=f;best=c;bj=j;}break;}}}
     if(best){S.ready[i]=false;best.pend[bj]=true;S.fly.push({k:i,x0:ST[i].x+20,y0:TOP-4,c:best,j:bj,t:0,dur:.5});tone(520,.12,"sine",.05,980);}}
   for(const f of S.fly){f.t+=dt;if(f.t>=f.dur&&!f.done){f.done=true;const c=f.c;if(c.state==="wait"){c.got[f.j]=true;c.pend[f.j]=false;addFx("spark",c.x,FEET-62,{dur:.3});if(c.got.every(Boolean))pay(c);}}}
   S.fly=S.fly.filter(f=>!f.done);
   /* patience */
   for(const c of S.cust){if(!c)continue;
     if(c.state==="in"){const d=c.tx-c.x;c.x+=Math.sign(d)*Math.min(Math.abs(d),250*dt);c.walk+=dt*12;
       if(Math.abs(d)<1){c.x=c.tx;c.walk=0;if(c.vip){c.state="vip";c.askT=1.7;c.mood="ok";say(tauntOf(sp,S.vipNo%3),2.4);SFX.whistle();}else{c.state="wait";c.sayTxt=orderText(c.items);c.sayT=2.6;c.greetT=2.2;SFX.tap();}}continue;}
     if(c.state==="vip"){c.askT-=dt;if(c.askT<=0){c.state="asking";askQuestion({title:"VIP: "+gv(sp,"enemy").toUpperCase().slice(0,24)});return;}continue;}
     if(c.state==="wait"){if(c.sayT>0)c.sayT-=dt;if(c.greetT>0)c.greetT-=dt;else c.pat-=dt*(simple()?.85:1);
       const f=c.pat/c.patMax;c.mood=f>.55?"happy":f>.28?"ok":"wait";if(c.pat<=0){leave(c,"angry");if(G.sub!=="play")return;}}}
   moveLeaving(dt);}
 function idle(dt){if(!S)return;if(G.mode==="title"){S.st[1].prog=(S.st[1].prog+dt*.35)%1;return;}moveLeaving(dt);S.hero.happyT=Math.max(0,S.hero.happyT-dt);if(S.ending)S.hero.pose="happy";}
 function onAnswer(ok){const c=S.vipNow;S.vipNow=null;S.vipNo++;S.nextV=S.gapV=vipGap();
   if(ok){S.vipRight++;G.score+=150;if(G.hearts<G.diff.hearts){G.hearts++;addText(70,46,"+1 star",ART.C.gold,18);}
     S.cust.forEach(x=>{if(x&&x.state==="wait")x.pat=Math.min(x.patMax,x.pat+x.patMax*.4);});
     showCard("FIVE STARS!",ART.C.gold,1,38);heroSay(pick(["Thank you!","Five stars! Yes!","We did it!"]),1.6);S.hero.happyT=1.4;
     if(c){c.mood="happy";leave(c,"vip");c.sayTxt=pick(["Excellent café!","Five stars from me!","Wonderful service!"]);c.sayT=1.8;}}
   else{showCard("BAD REVIEW!",ART.C.red,1,36);if(c){c.mood="angry";leave(c,"vip");c.sayTxt=tauntOf(sp,(S.vipNo+1)%3);c.sayT=2;}
     G.inv=0;hurt();if(G.hearts<=0)return;}
   if(S.vipNo>=G.qs.length)setTimeout(()=>{if(G.mode==="play"&&G.hearts>0)endShift();},700);}
 function pointer(type,x,y){if(type!=="down"||!S||S.ending)return;
   for(let i=0;i<4;i++){if(Math.abs(x-ST[i].x)<39&&y>150){tapStation(i);return;}}
   for(const c of S.cust){if(c&&c.state==="wait"&&Math.abs(x-c.x)<34&&y>FEET-160){c.sayTxt=orderText(c.items);c.sayT=2.4;SFX.tap();return;}}}
 function key(k){if(k>="1"&&k<="4"){tapStation(+k-1);return true;}return false;}
 function render(t){if(!S)init(sp||G.spec);const s=G.spec||sp,th=s.cafeTheme||"sea";
   ART.cafeBg(t,th);
   const h=S.hero;const fl=G.heroFlash>0&&Math.floor(t*14)%2;ctx.save();if(fl)ctx.globalAlpha=.55;
   ART.robe(Object.assign({x:h.x,y:HERO_Y,scale:1.15,arms:h.pose==="pour"?"pour":h.pose==="happy"?"up":"down",walk:h.pose==="walk"?h.walk:0,mood:h.pose==="happy"?"happy":G.heroFlash>0?"sad":"ok",look:{x:.2,y:.5},noShadow:true},heroLook(s)),t);ctx.restore();
   ART.cafeCounter(t,th);
   const keys=G.mode==="play"&&!G.touch;
   for(let i=0;i<4;i++){const st=S.st[i],sx=ST[i].x+(st.shake>0?Math.sin(t*70)*2.5:0);
     ART.station(i,sx,TOP,t,st.state==="working",st.prog);
     ART.stationLabel(ST[i].x,TOP+40,ST[i].n,st.state==="working"?st.prog:st.state==="queued"?-1:0,t,keys?String(i+1):"",S.cust.some(c=>c&&c.state==="wait"&&c.items.some((k,j)=>k===i&&!c.got[j]&&!c.pend[j]))&&!S.ready[i]&&st.state==="idle");
     if(S.ready[i]){const g=.5+.5*Math.sin(t*7);ctx.save();ctx.globalAlpha=.35+.25*g;ART.circ(ST[i].x+20,TOP-4,16,"#fff3b0",false);ctx.restore();ART.itemIcon(i,ST[i].x+20,TOP-6,1.05);}}
   for(const c of S.leaving)ART.robe(Object.assign({x:c.x,y:FEET,walk:c.walk,mood:c.mood,arms:c.how==="happy"||c.how==="bye"?"wave":c.how==="vip"&&c.mood==="happy"?"up":"down",look:{x:.6,y:0}},c.look),t);
   for(const c of S.cust){if(!c)continue;const vipNow=c.vip&&(c.state==="vip"||c.state==="asking");
     if(vipNow){const g=.5+.5*Math.sin(t*5);ctx.save();ctx.globalAlpha=.25+.2*g;ART.ellipse(c.x,FEET-50,40,64,"#fff3b0",false);ctx.restore();}
     ART.robe(Object.assign({x:c.x,y:FEET,walk:c.state==="in"?c.walk:0,mood:c.mood,arms:vipNow?"write":c.got.some(Boolean)?"hold":"down",hold:vipNow?"notebook":null,look:{x:-.6,y:c.vip?.2:0}},c.look),t);
     if(c.vip&&c.state==="in")ART.textPop(c.x,FEET-128,"VIP",20,ART.C.gold,-.06);}
   for(const c of S.cust){if(!c||c.state!=="wait")continue;if(c.sayT>0&&c.sayTxt)ART.bubble(c.x,FEET-124,c.sayTxt,170,0);else ART.orderBubble(c.x,FEET-120,c.items,c.got,c.pat/c.patMax,t);}
   for(const c of S.leaving){if(c.sayT>0&&c.sayTxt)ART.bubble(c.x,FEET-124,c.sayTxt,140,0);}
   for(const f of S.fly){const k=Math.min(1,f.t/f.dur),x=f.x0+(f.c.x-f.x0)*k,y=f.y0+(FEET-64-f.y0)*k-Math.sin(k*Math.PI)*70;ART.itemIcon(f.k,x,y,1.1);}}
 function hud(){const n=G.diff.hearts;for(let i=0;i<n;i++)ART.star(18+i*22,20,9.5,i<G.hearts?ART.C.gold:"#d8c9a6",0);
   const cx=18+n*22+4;ART.coin(cx,20,8);hudText(cx+12,21,G.score.toLocaleString(),"left",15);
   const N=G.qs.length;hudText(624,20,"VIP "+Math.min(S.vipNo+(S.vipNow?1:0),N)+" of "+N,"right",14);
   if(!S.vipNow&&S.vipNo<N){const k=1-clamp(S.nextV/S.gapV,0,1);const x0=530,x1=624,y=34;ctx.save();ctx.fillStyle="#fbf4e3";ctx.fillRect(x0,y,x1-x0,6);ctx.fillStyle=ART.C.gold;ctx.fillRect(x0,y,(x1-x0)*k,6);ctx.lineWidth=1.6;ctx.strokeStyle=ART.C.ink;ctx.strokeRect(x0,y,x1-x0,6);ctx.restore();hudText(x0-4,37,"next VIP","right",11);}}
 return {id:"cafe",stick:false,noHearts:false,ownHud:true,keysTip:"Click a station or press 1, 2, 3, 4 · click a customer to hear the order",
  buttons(){return [];},pointer,key,
  help(s){return ["You are <b>"+esc(gv(s,"hero"))+"</b>. Customers order kahwa, karak, halwa and luqaimat.","Click or tap a station (or press 1, 2, 3, 4) to make it. The food goes to the customer who ordered it.","Serve everyone before their patience runs out — a lost customer costs a star. Then <b>"+esc(gv(s,"enemy"))+"</b> visits!"];},
  init,start,update,idle,onAnswer,render,hud,
  bubbleAt(){const c=S&&S.vipNow;return c&&c.state!=="in"?{x:c.x,y:FEET-124,dir:0}:null;},heroBubbleAt(){return {x:S?S.hero.x:130,y:162,dir:0};},
  resultLines(){return [["Customers served",String(S.served)],["Customers lost",String(S.lost)],["Five-star reviews",S.vipRight+" of "+S.vipNo]];}};
})();
/* the hero in a robe (shared by the café and the sweet shop) */
function robeHero(s,icon){const hij=s.hair==="hijab";const robeCol=(SW.robe.includes(s.kit)?s.kit:(hij?"#1d1d24":"#f4f1ea"));const ap=SW.apron.includes(s.kit2)?s.kit2:"#fbf4e3";
  if(hij)return {kind:"woman",robe:robeCol,hijab:s.hijab||"#1f3a5f",skin:s.skin,apron:ap,apronIcon:icon,seed:7};
  const ms=s.hair==="massar";return {kind:"man",robe:robeCol,hat:ms?"massar":"kumma",hatCol:ms?"#8e44ad":"#f8f5ee",hatCol2:ms?"#f1c40f":"#c0392b",skin:s.skin,apron:ap,apronIcon:icon,seed:7};}
