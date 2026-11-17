/* ===================== GAME STUDIO · EDITOR ===================== */
const STORE="gamestudio-v1";
let SPEC=blankSpec();
function loadDraft(){try{const j=JSON.parse(localStorage.getItem(STORE)||"null");if(j){const s=sanitizeSpec(j);if(s)SPEC=s;}}catch(e){}}
let saveT=0;function saveDraft(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(STORE,JSON.stringify(SPEC));}catch(e){}},300);}
const E=s=>document.querySelector(s);
function note(t){const m=E("#emsg");if(!m)return;m.textContent=t;clearTimeout(note.t);note.t=setTimeout(()=>{m.textContent="";},7000);}
/* ---------- step 1: genre ---------- */
function renderGenres(){E("#egenres").innerHTML=Object.keys(GENRES).map(k=>{const g=GENRES[k];return '<button type="button" class="e-genre" data-g="'+k+'" aria-pressed="'+(SPEC.genre===k)+'"><span class="e-emoji" aria-hidden="true">'+g.e+'</span><b>'+g.name+'</b><small>'+g.desc+'</small></button>';}).join("");}
E("#egenres").addEventListener("click",e=>{const b=e.target.closest(".e-genre");if(!b)return;SPEC.genre=b.dataset.g;renderGenres();renderOpts();fillFields();changed();});
/* ---------- step 2: look options per genre ---------- */
function swatches(key,list,label){return '<div class="e-field"><span class="e-lab">'+label+'</span><div class="e-sw" role="group" aria-label="'+esc(label)+'">'+list.map(c=>'<button type="button" class="e-swb" data-sw="'+key+'" data-v="'+c+'" style="background:'+c+'" aria-label="'+c+'" aria-pressed="'+(SPEC[key]===c)+'"></button>').join("")+'</div></div>';}
function choice(key,opts,label){return '<div class="e-field"><span class="e-lab">'+label+'</span><div class="e-chips" role="group" aria-label="'+esc(label)+'">'+opts.map(o=>'<button type="button" class="e-chip" data-ch="'+key+'" data-v="'+o[0]+'" aria-pressed="'+(SPEC[key]===o[0])+'">'+o[1]+'</button>').join("")+'</div></div>';}
function personOpts(){return choice("hair",[["short","Short hair"],["curly","Curly hair"],["hijab","Sports hijab"]],"Hair")+(SPEC.hair==="hijab"?swatches("hijab",SW.hijab,"Hijab colour"):"")+swatches("skin",SW.skin,"Skin");}
function renderOpts(){const g=SPEC.genre;let h="";
  if(g==="race"){h+=choice("vehicle",[["camel","🐪 Camel"],["car","🚗 Car"],["runner","🏃 Runner"]],"Your racer");
    const pal=SPEC.vehicle==="car"?SW.car:SPEC.vehicle==="camel"?SW.camel:SW.kit;
    h+=swatches("heroCol",pal,SPEC.vehicle==="runner"?"Your shirt":SPEC.vehicle==="car"?"Your car":"Your camel");
    if(SPEC.vehicle==="camel")h+=swatches("kit",SW.kit,"Saddle");
    if(SPEC.vehicle==="runner")h+=personOpts();
    h+=swatches("rivalCol",pal,"The rival");h+=choice("tod",[["day","Day"],["sunset","Sunset"],["night","Night"]],"Time of day");}
  if(g==="penalty"){h+=swatches("kit",SW.kit,"Your shirt")+swatches("kit2",SW.kit,"Your shorts")+personOpts()+'<div class="e-field"><label class="e-lab" for="enum">Shirt number</label><input class="e-in" style="max-width:90px" type="text" id="enum" data-k="num" maxlength="2"></div>'+swatches("keeperKit",SW.kit,"The goalkeeper's kit");}
  if(g==="space"){h+=swatches("shipCol",SW.ship,"Your ship")+swatches("shipAcc",SW.ship,"Wings and lasers")+swatches("foeCol",["#16a085","#8e44ad","#c0392b","#2c3e50","#d35400"],"The enemy ships");}
  if(g==="boss"){h+=choice("pot",[["gold","Gold"],["silver","Silver"],["copper","Copper"],["emerald","Emerald"]],"Your Dallah")+choice("bossTheme",[["classic","Classic"],["jade","Jade"],["ruby","Ruby"],["midnight","Midnight"]],"The boss colours")+
    '<div class="e-grid2"><div class="e-field"><label class="e-lab" for="f1">Face 1 name</label><input class="e-in" id="f1" data-face="0" placeholder="Example: Baron Brew"></div><div class="e-field"><label class="e-lab" for="f2">Face 2 name</label><input class="e-in" id="f2" data-face="1" placeholder="Example: The Steam Spirit"></div><div class="e-field"><label class="e-lab" for="f3">Face 3 name</label><input class="e-in" id="f3" data-face="2" placeholder="Example: The Kettle Kaiser"></div></div>';}
  h+=choice("look",[["old","Old 1930s cartoon"],["colour","Bright colour"]],"The look");
  E("#eopts").innerHTML=h;fillFields();}
E("#eopts").addEventListener("click",e=>{const sw=e.target.closest("[data-sw]"),ch=e.target.closest("[data-ch]");
  if(sw){SPEC[sw.dataset.sw]=sw.dataset.v;}else if(ch){SPEC[ch.dataset.ch]=ch.dataset.v;if(ch.dataset.ch==="vehicle"){const pal=SPEC.vehicle==="car"?SW.car:SPEC.vehicle==="camel"?SW.camel:SW.kit;if(!pal.includes(SPEC.heroCol))SPEC.heroCol=pal[0];if(!pal.includes(SPEC.rivalCol))SPEC.rivalCol=pal[2]||pal[1];}}else return;renderOpts();changed();});
/* ---------- plain fields ---------- */
const FIELD_KEYS=["name","team","hero","enemy","right","wrong","text","num"];
function fillFields(){FIELD_KEYS.forEach(k=>{document.querySelectorAll('[data-k="'+k+'"]').forEach(el=>{if(el.value!==SPEC[k])el.value=SPEC[k]||"";});});
  document.querySelectorAll("[data-face]").forEach(el=>{el.value=SPEC.faces[+el.dataset.face]||"";});document.querySelectorAll("[data-taunt]").forEach(el=>{el.value=SPEC.taunts[+el.dataset.taunt]||"";});
  const g=GENRES[SPEC.genre];const ph={hero:"Example: "+g.hero,enemy:"Example: "+g.enemy,right:"Example: "+g.right,wrong:"Example: "+g.wrong};for(const k in ph){const el=E('[data-k="'+k+'"]');if(el)el.placeholder=ph[k];}
  document.querySelectorAll("[data-taunt]").forEach(el=>{el.placeholder="Example: "+g.taunts[+el.dataset.taunt];});}
document.addEventListener("input",e=>{const el=e.target;if(!el.closest||!el.closest("#editor"))return;if(el.dataset.k){SPEC[el.dataset.k]=el.value;changed();}else if(el.dataset.face!==undefined){SPEC.faces[+el.dataset.face]=el.value;changed();}else if(el.dataset.taunt!==undefined){SPEC.taunts[+el.dataset.taunt]=el.value;changed();}});
/* ---------- questions ---------- */
const QT={tfng:"True / False / Not Given",abc:"Choose A, B or C",word:"Write the missing word"};
function qHTML(q,i){let h='<div class="e-q" data-i="'+i+'"><div class="e-qhead"><b>Question '+(i+1)+'</b><div class="e-row"><select class="e-in e-qtype" aria-label="Question '+(i+1)+' type" data-qf="type">'+Object.keys(QT).map(t=>'<option value="'+t+'"'+(q.type===t?" selected":"")+'>'+QT[t]+'</option>').join("")+'</select><button type="button" class="e-btn e-small" data-del="'+i+'">Delete</button></div></div>';
  const ph=q.type==="tfng"?"Example: Kahwa is made with dark coffee beans.":q.type==="abc"?"Example: Dates ____ with the coffee.":"Example: The cup is ____ gently. (shake)";
  h+='<label class="e-lab" for="eq'+i+'">'+(q.type==="tfng"?"The sentence":q.type==="abc"?"The question":"The sentence with a gap ____")+'</label><input class="e-in" type="text" id="eq'+i+'" data-qf="q" value="'+esc(q.q)+'" placeholder="'+esc(ph)+'">';
  if(q.type==="abc")h+='<div class="e-abc">'+["a","b","c"].map((k,j)=>'<div><label class="e-lab" for="eq'+i+k+'">'+"ABC"[j]+'</label><input class="e-in" type="text" id="eq'+i+k+'" data-qf="'+k+'" value="'+esc(q[k])+'" placeholder="'+["is served","are served","serves"][j]+'"></div>').join("")+'</div>';
  h+='<div class="e-grid2"><div><label class="e-lab" for="eq'+i+'ans">The answer</label>';
  if(q.type==="tfng")h+='<select class="e-in" id="eq'+i+'ans" data-qf="ans"><option value="">— choose —</option>'+["True","False","Not Given"].map(v=>'<option'+(q.ans===v?" selected":"")+'>'+v+'</option>').join("")+'</select>';
  else if(q.type==="abc")h+='<select class="e-in" id="eq'+i+'ans" data-qf="ans"><option value="">— choose —</option>'+["A","B","C"].map(v=>'<option'+(q.ans===v?" selected":"")+'>'+v+'</option>').join("")+'</select>';
  else h+='<input class="e-in" type="text" id="eq'+i+'ans" data-qf="ans" value="'+esc(q.ans)+'" placeholder="Example: shaken">';
  h+='</div><div><label class="e-lab" for="eq'+i+'why">Why? <span class="e-opt">(optional)</span></label><input class="e-in" type="text" id="eq'+i+'why" data-qf="why" value="'+esc(q.why)+'" placeholder="Example: is + third form: shake → shaken"></div></div></div>';return h;}
function renderQs(){E("#eqs").innerHTML=SPEC.qs.map(qHTML).join("");}
E("#eqs").addEventListener("input",e=>{const f=e.target.dataset.qf;if(!f||f==="type")return;const i=+e.target.closest(".e-q").dataset.i;SPEC.qs[i][f]=e.target.value;changed(true);});
E("#eqs").addEventListener("change",e=>{const f=e.target.dataset.qf;if(!f)return;const i=+e.target.closest(".e-q").dataset.i;SPEC.qs[i][f]=e.target.value;if(f==="type"){SPEC.qs[i].ans="";renderQs();}changed(true);});
E("#eqs").addEventListener("click",e=>{const d=e.target.closest("[data-del]");if(!d)return;SPEC.qs.splice(+d.dataset.del,1);if(!SPEC.qs.length)SPEC.qs.push(newQ("abc"));renderQs();changed(true);});
E("#eaddq").addEventListener("click",()=>{if(SPEC.qs.length>=15){note("15 questions is the limit.");return;}SPEC.qs.push(newQ("abc"));renderQs();changed(true);const l=E("#eq"+(SPEC.qs.length-1));if(l)l.focus();});
/* ---------- checks ---------- */
function checks(){const out=[];const ready=SPEC.qs.filter(qReady).length;
  out.push([!!SPEC.name.trim(),SPEC.name.trim()?"Game name: "+SPEC.name.trim():"Give your game a name (step 2)"]);
  out.push([!!(SPEC.hero.trim()&&SPEC.enemy.trim()),SPEC.hero.trim()&&SPEC.enemy.trim()?"Hero and enemy named":"Name your hero and your enemy (step 3)"]);
  out.push([SPEC.taunts.filter(t=>t.trim()).length>=2,"Write at least 2 lines for the enemy (step 3)"]);
  out.push([ready>=5,ready>=5?ready+" questions ready":"Write at least 5 complete questions — "+ready+" ready"]);
  const half=SPEC.qs.filter(q=>(q.q.trim()||q.ans)&&!qReady(q)).length;if(half)out.push([false,half+" question"+(half>1?"s are":" is")+" not finished"]);
  if(SPEC.qs.some(q=>q.type==="tfng"&&q.q.trim())&&!SPEC.text.trim())out.push([false,"True / False / Not Given needs a text (step 4)"]);
  return out;}
let curKey=0;
function changed(qOnly){curKey++;E("#echecks").innerHTML=checks().map(c=>'<li class="'+(c[0]?"ok":"todo")+'">'+esc(c[1])+'</li>').join("");E("#eqcount").innerHTML='<b>'+SPEC.qs.filter(qReady).length+'</b> of '+SPEC.qs.length+' ready';saveDraft();}
/* ---------- preview ---------- */
const pcv=E("#pv"),pctx=pcv.getContext("2d");let pK=1,prevKey=-1;
function sizePreview(){const w=pcv.clientWidth||520;const dpr=Math.min(2,devicePixelRatio||1);pK=Math.max(.5,w/W*dpr);pcv.width=Math.round(W*pK);pcv.height=Math.round(H*pK);prevKey=-1;}
addEventListener("resize",sizePreview);
let PS=null;
function drawPreview(){if(!playwrap.hidden)return;if(prevKey!==curKey){PS=sanitizeSpec(JSON.parse(JSON.stringify(SPEC)));if(!PS.qs.filter(qReady).length)PS.qs=[{type:"abc",q:"x",a:"a",b:"b",c:"c",ans:"A",why:""}];G.qs=PS.qs.filter(qReady);MODS[PS.genre].init(PS);prevKey=curKey;}
  const saved={ctx,K,spec:G.spec,mode:G.mode,mod:G.mod};ctx=pctx;K=pK;G.spec=PS;G.mode="title";G.mod=MODS[PS.genre];ART.set(pctx);
  try{pctx.setTransform(pK,0,0,pK,0,0);G.mod.render(G.t);drawCommon();
    ART.textPop(320,74,(PS.name||"Your game name").slice(0,28),PS.name.length>18?28:36,ART.C.gold,-.04);
    if(PS.team){pctx.save();pctx.font="15px 'Rum Raisin', serif";pctx.textAlign="center";pctx.lineWidth=4;pctx.strokeStyle="rgba(251,244,227,.9)";pctx.strokeText("made by "+PS.team.slice(0,40),320,106);pctx.fillStyle=ART.C.ink;pctx.fillText("made by "+PS.team.slice(0,40),320,106);pctx.restore();}
    ART.film(pK,G.t,PS.look==="colour"?"colour":false);}
  catch(err){console.log("preview",err&&err.message);}
  finally{ctx=saved.ctx;K=saved.K;G.spec=saved.spec;G.mode=saved.mode;G.mod=saved.mod;ART.set(ctx);}}
/* ---------- buttons ---------- */
function onClosePlay(){prevKey=-1;sizePreview();}
E("#eplay").addEventListener("click",()=>{if(!SPEC.qs.filter(qReady).length){note("Write at least one complete question first (step 4).");return;}openPlay(JSON.parse(JSON.stringify(SPEC)),"editor");});
function copyText(t,okMsg,el){const fallback=()=>{openModal('<h2>Your game code</h2><p>Select it all and copy it (Ctrl + C), then send it to your teacher and friends.</p><textarea class="e-in" id="mcode" rows="6" readonly>'+esc(t)+'</textarea><div class="e-row" style="margin-top:10px"><button class="e-btn" data-m="close">Close</button></div>');const c=E("#mcode");c.focus();c.select();};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>note(okMsg),fallback);else fallback();}catch(e){fallback();}}
E("#ecode").addEventListener("click",()=>{const n=SPEC.qs.filter(qReady).length;if(n<1){note("Write at least one complete question first.");return;}copyText(encodeSpec(SPEC),"Game code copied! Paste it in WhatsApp for your teacher and friends. They open the Studio, press “Play a friend's game” and paste it.");});
function openModal(html){E("#emodal .e-mbox").innerHTML=html;E("#emodal").hidden=false;}
function closeModal(){E("#emodal").hidden=true;E("#emodal .e-mbox").innerHTML="";}
E("#emodal").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(e.target.id==="emodal"){closeModal();return;}if(!b)return;const m=b.dataset.m;
  if(m==="close")closeModal();
  else if(m==="playcode"||m==="editcode"){const s=decodeSpec(E("#mpaste").value);if(!s){E("#merr").textContent="That code does not work. Copy the whole code, starting with GAME-";return;}closeModal();if(m==="playcode")openPlay(s,"friend");else{SPEC=s;afterLoad("The game is open in the Studio. You can change it and save your own copy.");}}
  else if(m==="doimport"){const s=parsePlan(E("#mpaste").value);if(!s){E("#merr").textContent="I can't read that plan. Copy the whole game plan from the Game Design Lab.";return;}closeModal();SPEC=s;afterLoad("Your game plan is in the Studio. Now choose the colours and write the enemy's lines.");}});
E("#efriend").addEventListener("click",()=>openModal('<h2>Play a friend\'s game</h2><p>Paste the game code (it starts with GAME-).</p><textarea class="e-in" id="mpaste" rows="5" placeholder="GAME-..."></textarea><p class="e-err" id="merr"></p><div class="e-row"><button class="e-btn e-primary" data-m="playcode">▶ Play it</button><button class="e-btn" data-m="editcode">Open it in the Studio</button><button class="e-btn" data-m="close">Cancel</button></div>'));
E("#eimport").addEventListener("click",()=>openModal('<h2>Import from the Game Design Lab</h2><p>In the Lab, press “Copy our game plan”, then paste it here. Your name, hero, enemy, text and questions come in.</p><textarea class="e-in" id="mpaste" rows="7" placeholder="Please make a complete browser game..."></textarea><p class="e-err" id="merr"></p><div class="e-row"><button class="e-btn e-primary" data-m="doimport">Import</button><button class="e-btn" data-m="close">Cancel</button></div>'));
function afterLoad(msg){renderGenres();renderOpts();renderQs();fillFields();changed();note(msg);scrollTo({top:0,behavior:"smooth"});}
const EX_TEXT="Omani coffee is called kahwa. It is made with light coffee beans and cardamom, and sometimes rosewater or saffron is added. The coffee is poured from a dallah into small cups without handles. A guest is always served first, and the cup is filled only a little. When the guest has had enough, the cup is shaken gently from side to side. Dates are always served with the coffee.";
const EX_QS=[{type:"tfng",q:"Kahwa is made with dark coffee beans.",a:"",b:"",c:"",ans:"False",why:"The text says light coffee beans."},{type:"tfng",q:"A guest is served first.",a:"",b:"",c:"",ans:"True",why:"A guest is always served first."},{type:"tfng",q:"Kahwa is more popular than tea in Oman.",a:"",b:"",c:"",ans:"Not Given",why:"The text does not compare coffee and tea."},{type:"abc",q:"What is sometimes added to kahwa?",a:"milk",b:"rosewater",c:"sugar",ans:"B",why:"sometimes rosewater or saffron is added."},{type:"abc",q:"Dates ____ with the coffee.",a:"is served",b:"are served",c:"serves",ans:"B",why:"dates = many → are + third form."},{type:"word",q:"The cup is ____ gently when the guest has had enough. (shake)",a:"",b:"",c:"",ans:"shaken",why:"is + third form: shake → shaken."}];
const EXAMPLES={race:{name:"Desert Dash",team:"Salim and Huda",hero:"Barq",enemy:"Zubair the cheater",vehicle:"camel",heroCol:"#f5f0e6",kit:"#c0392b",rivalCol:"#8b5a2b",tod:"sunset",taunts:["You will never catch me, Barq!","My camel drinks coffee too!","See you at the finish!"],right:"Barq gets a speed boost",wrong:"Barq slows down for 3 seconds"},
 penalty:{name:"Kahwa Cup",team:"Ahmed and Maryam",hero:"Maryam",enemy:"The Wall",kit:"#c0392b",kit2:"#fbf4e3",hair:"hijab",hijab:"#1f3a5f",skin:"#c98e5f",num:"10",keeperKit:"#2c3e50",taunts:["Nothing gets past me!","My gloves love coffee!","Is that a shot or a pass?"]},
 space:{name:"Grammar Galaxy",team:"Nasser and Said",hero:"Captain Noor",enemy:"The Grammar Goblin",shipCol:"#2980b9",shipAcc:"#f1c40f",foeCol:"#8e44ad",look:"colour",taunts:["Your grammar is weak, captain!","Is it IS or ARE? Ha!","My ships are everywhere!"]},
 boss:{name:"The Coffee Clash",team:"Huda and Aisha",hero:"The Dallah",enemy:"Baron Brew",faces:["Baron Brew","The Steam Spirit","The Kettle Kaiser"],pot:"gold",bossTheme:"classic",taunts:["Your coffee is weak, little pot!","Boo! Read the question twice!","I'M BOILING MAD!"]}};
E("#edemo").addEventListener("click",()=>{const g=SPEC.genre;SPEC=Object.assign(blankSpec(),JSON.parse(JSON.stringify(EXAMPLES[g])),{genre:g,text:EX_TEXT,qs:JSON.parse(JSON.stringify(EX_QS))});afterLoad("Example loaded for "+GENRES[g].name+". Press ▶ Play to try it, or “Start again” to clear.");});
let clearArmed=0;E("#eclear").addEventListener("click",e=>{const b=e.currentTarget;if(!clearArmed){clearArmed=1;b.textContent="Tap again to clear";setTimeout(()=>{clearArmed=0;b.textContent="Start again";},3500);return;}clearArmed=0;b.textContent="Start again";const g=SPEC.genre;SPEC=blankSpec();SPEC.genre=g;try{localStorage.removeItem(STORE);}catch(_){}afterLoad("Cleared. Ready for a new game.");});
/* ---------- boot ---------- */
loadDraft();renderGenres();renderOpts();renderQs();fillFields();changed();sizePreview();
let last=performance.now();function loop(nowT){const dt=Math.min(1/30,(nowT-last)/1000);last=nowT;tick(dt);if(!playwrap.hidden){ART.set(ctx);render();}else drawPreview();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load("20px Limelight"),document.fonts.load("20px 'Rum Raisin'")]).then(()=>{prevKey=-1;}).catch(()=>{});}
