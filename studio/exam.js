/* ===================== PRACTICE EXAMS WITH CLAUDE + THE PLAY TAB ===================== */
const SKILLS=[
 {g:"Reading",id:"r_head",name:"Main ideas: headings"},
 {g:"Reading",id:"r_tfng",name:"True / False / Not Given"},
 {g:"Reading",id:"r_box",name:"Word box gaps"},
 {g:"Reading",id:"r_abc",name:"A, B or C questions"},
 {g:"Reading",id:"r_word",name:"One word or a number"},
 {g:"Reading",id:"r_table",name:"Completing a table or notes"},
 {g:"Reading",id:"r_vocab",name:"New words from context"},
 {g:"Reading",id:"r_infer",name:"What the writer means"},
 {g:"Listening",id:"l_tf",name:"Listening: True or False"},
 {g:"Listening",id:"l_abc",name:"Listening: A, B or C"},
 {g:"Listening",id:"l_note",name:"Listening: numbers, names, spelling"},
 {g:"Grammar",id:"g_present",name:"Present simple and continuous",pt:"present simple vs present continuous"},
 {g:"Grammar",id:"g_past",name:"Past simple and continuous",pt:"past simple vs past continuous"},
 {g:"Grammar",id:"g_future",name:"Future forms",pt:"will, going to, and the present continuous for the future"},
 {g:"Grammar",id:"g_perfect",name:"Perfect tenses",pt:"present perfect, past perfect and present perfect continuous"},
 {g:"Grammar",id:"g_compare",name:"Comparatives and superlatives",pt:"comparative and superlative adjectives"},
 {g:"Grammar",id:"g_adverb",name:"Adverbs and linkers",pt:"adverbs of frequency, manner, degree and certainty, and linkers such as however and therefore"},
 {g:"Grammar",id:"g_cond",name:"Conditionals (0, 1, 2)",pt:"zero, first and second conditionals"},
 {g:"Grammar",id:"g_prep",name:"Prepositions of place and time",pt:"prepositions of place and time (in, on, at, between, during, since, for…)"},
 {g:"Grammar",id:"g_question",name:"Questions and question tags",pt:"question forms, wh- questions and question tags"},
 {g:"Grammar",id:"g_modal",name:"Modals",pt:"modals: can, could, should, might, may, would, have to, must, ought to, need to"},
 {g:"Grammar",id:"g_passive",name:"The passive",pt:"the present simple passive and the past simple passive"},
 {g:"Grammar",id:"g_gerund",name:"Gerunds and infinitives",pt:"gerunds and verb + to-infinitive"},
 {g:"Grammar",id:"g_conj",name:"Conjunctions",pt:"coordinating and subordinating conjunctions (and, but, so, because, although, while, when…)"},
 {g:"Vocabulary",id:"v_syn",name:"Synonyms and antonyms"},
 {g:"Vocabulary",id:"v_form",name:"Word forms (prefixes, suffixes)"}];
const FULL_SKILLS=["r_head","r_tfng","r_box","r_abc","r_word","r_table"];
function skillName(id){const s=SKILLS.find(x=>x.id===id);return s?s.name:id;}
const SK_RULE={
 r_head:'type "heading": one question for each paragraph you choose (B, C, D…; paragraph A is the example). Put the correct headings plus 2 extra headings in "headings". Fields: "paragraph" (the letter) and "answer" (the exact heading).',
 r_tfng:'type "tfng": a statement that paraphrases the reading text. "answer" is "True", "False" or "Not Given". Use all three answers.',
 r_box:'type "box": a sentence with one gap "____" that paraphrases the text. Put the answers plus 1 extra word in "box"; "answer" is one word from the box.',
 r_abc:'type "abc": a question about a detail, 3 options, only one correct according to the text.',
 r_word:'type "word": a sentence with one gap "____"; the answer is ONE WORD AND/OR A NUMBER copied exactly from the reading text.',
 r_table:'type "table": notes or a table about stages, dates or numbers in the text: "q" = "<table title> · <row>: <sentence with ____>"; the answer is ONE WORD AND/OR A NUMBER copied exactly from the text.',
 r_vocab:'type "abc": "What does the word … in paragraph B mean?" with 3 meanings; the correct one fits the context.',
 r_infer:'type "abc": what the writer suggests, feels or wants, or the purpose of a paragraph; the answer is implied, not copied.',
 l_tf:'type "tf" about the listening script: a statement; "answer" is "True" or "False".',
 l_abc:'type "abc" about the listening script: what a speaker says or wants, 3 options.',
 l_note:'type "word" about the listening script (note completion): a number, time, date, price or spelled name; ONE WORD AND/OR A NUMBER exactly as in the script.',
 v_syn:'type "abc" with "instruction": a synonym or an antonym of a word that is in the reading text (if there is no reading text, a word from the topic); 3 options.',
 v_form:'type "word" with "text": -1 and "instruction": "Write the correct form of the word in brackets." Example: "Many people are ____ (employ) in tourism." → "employed".'};
function gRule(s){return 'type "abc" or "word" with "text": -1 and a short "instruction": sentences about the topic that test '+s.pt+'. abc = 3 forms of the same word, one correct. word = "Write the correct form of the verb in brackets", e.g. "The dates ____ (serve) with coffee." → "are served".';}
/* ---------- storage ---------- */
function lsGet(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
const XS={skills:[],src:"topic",len:15,genre:"race",images:[],fileText:"",busy:false,ctl:null,last:null};
/* ---------- reaching Claude: built-in "Ask Claude" on claude.ai, or the class copy on the teacher's credits ---------- */
const AI={mode:null,sample:null,limits:null,checked:false};
/* the class file: the teacher's own API key is written into the file (see "For the teacher") */
const SLOT_WORD="PASTE_YOUR"+"_KEY_HERE";
const DIRECT={model:"claude-sonnet-5-5",max:16000,effort:"medium",perDay:Math.max(1,Math.min(50,parseInt(window.CLASS_PER_DAY,10)||10))};
const SYS_PROMPT="You write English practice exams and check exam-style questions for General English 2 (CEFR B1) students at the University of Technology and Applied Sciences in Salalah, Oman. Only do this kind of task. If a request asks for anything else, reply with {\"error\":\"This class file only makes practice exams.\"}. Everything you write must suit university students in Oman. Follow the requested JSON format exactly.";
function keyOK(k){return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(String(k||"").trim());}
function classKey(){const k=String(window.CLASS_API_KEY||"").trim();return keyOK(k)?k:"";}
function hookOK(u){return /^https?:\/\/[^\s"'<>\\]+$/i.test(String(u||"").trim());}
function hookURL(){const u=String(window.CLASS_HOOK_URL||"").trim();return hookOK(u)?u:"";}
function today(){const t=new Date();return t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate();}
function keyUse(){const u=lsGet("gs-keyuse",null);return u&&u.d===today()?u:{d:today(),n:0};}
function usesLeft(){return Math.max(0,DIRECT.perDay-keyUse().n);}
function useOne(){const u=keyUse();u.n++;lsSet("gs-keyuse",u);}
async function aiInit(){try{if(window.claude&&typeof window.claude.use==="function"){const s=await window.claude.use("sample");if(s){AI.mode="claude";AI.sample=s;try{AI.limits=await s.limits();}catch(e){AI.limits=null;}}}}catch(e){}
  if(!AI.mode&&classKey())AI.mode="direct";
  if(!AI.mode&&hookURL())AI.mode="hook";
  if(!AI.mode&&/^https?:$/.test(location.protocol)&&!window.claude){try{const r=await fetch("api/health",{cache:"no-store"});if(r.ok){const j=await r.json();if(j&&j.ok){AI.mode="class";AI.cls=j;}}}catch(e){}}
  AI.checked=true;renderAI();}
function classCode(){return String(lsGet("gs-classcode","")||"");}
function canImages(){if(AI.mode==="class"||AI.mode==="direct"||AI.mode==="hook")return true;return !!(AI.limits&&AI.limits.images);}
function maxImages(){if(AI.mode==="class"||AI.mode==="direct"||AI.mode==="hook")return 4;return AI.limits&&AI.limits.images?Math.min(4,AI.limits.images.maxCount||1):0;}
function renderAI(){const box=E("#xai"),t=E("#xaitxt");if(!box)return;box.classList.remove("ok","no");
  if(!AI.checked){t.textContent="Checking whether Claude can be used here…";return;}
  if(AI.mode==="claude"){box.classList.add("ok");t.innerHTML="<b>Claude is ready.</b> It uses your own Claude account (you must be signed in), so the first time it asks you to allow it.";}
  else if(AI.mode==="class"){box.classList.add("ok");t.innerHTML='<b>Class copy:</b> Claude runs on your teacher\'s account. <label for="xcode" style="font-weight:700">Class code</label> <input class="e-in" id="xcode" style="max-width:160px;display:inline-block;padding:4px 8px" value="'+esc(classCode())+'" autocomplete="off"> <span class="e-hint" style="margin:0">Your teacher tells you the code.</span>';
    const c=E("#xcode");c.addEventListener("input",()=>lsSet("gs-classcode",c.value.trim()));}
  else if(AI.mode==="direct"||AI.mode==="hook"){const n=usesLeft();box.classList.add(n?"ok":"no");t.innerHTML=n?"<b>Claude is ready</b> — no account needed. This class file uses your teacher's API credits"+(AI.mode==="hook"?" through the class server":"")+". Claude requests left today on this device: <b>"+n+" of "+DIRECT.perDay+"</b>.":"<b>Today's "+DIRECT.perDay+" Claude requests on this device are used.</b> Come back tomorrow. You can still replay your saved exams in Play → My practice exams.";}
  else if(typeof window.CLASS_TPL==="string"){box.classList.add("no");t.innerHTML='<b>This is the teacher file.</b> Make the class file in <a href="#teacher">For the teacher</a>, then open the class file to make exams.';}
  else{box.classList.add("no");t.innerHTML="<b>Claude can't be reached from here.</b> Open this Studio from its claude.ai link while signed in to Claude, or use the class link from your teacher. Everything else on this page still works.";}
  const m=E("#xmake");if(m)m.disabled=!AI.mode;const c2=E("#ecoach");if(c2)c2.disabled=!AI.mode;}
const AI_ERR={not_granted:"You did not allow Claude for this page. Reload the page to be asked again.",sampling_disabled:"Claude is not available for this account.",rate_limited:"Too many requests, or your Claude usage limit is reached. Try again later.",session_expired:"Please sign in to claude.ai again, then reload this page.",refused:"Claude did not accept this text. Try a different text or topic.",prompt_too_large:"The text is too long. Use fewer pages or a shorter text.",invalid_json:"Claude's answer was not complete. Press the button again.",images_unavailable:"Photos can't be sent from here. Use a PDF with text, or paste the text.",image_rejected:"That photo could not be used. Try a clearer or smaller photo.",empty_completion:"Claude gave an empty answer. Press the button again.",cancelled:"Stopped.",upstream_error:"Claude had a connection problem. Press the button again."};
function aiErrText(e){if(!e)return "Something went wrong. Try again.";if(e.code&&AI_ERR[e.code])return AI_ERR[e.code];if(e.msg)return e.msg;return "Something went wrong. Try again.";}
function parseLoose(t){t=String(t||"").trim();try{return JSON.parse(t);}catch(e){}const f=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(f){try{return JSON.parse(f[1]);}catch(e){}}const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}throw {code:"invalid_json"};}
async function blobToB64(b){const buf=new Uint8Array(await b.arrayBuffer());let s="";const CH=0x8000;for(let i=0;i<buf.length;i+=CH)s+=String.fromCharCode.apply(null,buf.subarray(i,i+CH));return btoa(s);}
/* ---------- the class file: straight to the Claude API with the teacher's key ---------- */
function apiBody(o){const b={model:DIRECT.model,max_tokens:o.max||DIRECT.max,system:SYS_PROMPT,messages:[{role:"user",content:o.content}]};if(DIRECT.effort)b.output_config={effort:DIRECT.effort};if(o.stream)b.stream=true;return b;}
async function apiErr(r){let j=null;try{j=await r.json();}catch(e){}return {status:r.status,type:(j&&j.error&&j.error.type)||"",message:(j&&j.error&&j.error.message)||"",retry:parseInt(r.headers.get("retry-after"),10)||0};}
async function apiPost(key,o,signal){for(let k=0;k<2;k++){let r;
    try{r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":key,"anthropic-version":"2023-06-01","content-type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(apiBody(o)),signal});}
    catch(e){if(e&&e.name==="AbortError")throw {code:"cancelled"};return {net:true};}
    if(r.ok)return {r};const x=await apiErr(r);
    if(k===0&&r.status===400&&DIRECT.effort&&/output_config|effort/i.test(x.message)){DIRECT.effort=null;continue;}  /* the API did not accept the effort setting: ask again without it */
    return {r,x};}}
function isCredit(x){return !!x&&/credit|balance|billing|spend/i.test(x.message||"");}
function directErr(x){if(!x)return "Something went wrong. Try again.";
  if(isCredit(x))return "This month's Claude credit for the class is used up. Tell your teacher.";
  if(x.status===401)return "The key in this class file does not work any more (it expired or was deleted). Ask your teacher for the new class file.";
  if(x.status===403)return "The key in this class file is not allowed to do this. Tell your teacher.";
  if(x.status===404)return "The Claude model in this class file is not available. Tell your teacher.";
  if(x.status===413||/too long|too large|too many tokens/i.test(x.message||""))return AI_ERR.prompt_too_large;
  if(x.status===429)return "Claude is busy with your classmates' exams. Wait a minute, then press the button again.";
  if(x.status>=500)return "Claude is very busy right now. Wait a minute, then try again.";
  return "Claude had a problem"+(x.message?": "+String(x.message).slice(0,160):"")+". Try again.";}
const NET_MSG="Claude can't be reached. Check the internet connection (some school networks block Claude), then try again.";
function waitFor(ms,signal){return new Promise((res,rej)=>{if(signal&&signal.aborted){rej({code:"cancelled"});return;}const t=setTimeout(res,ms);if(signal)signal.addEventListener("abort",()=>{clearTimeout(t);rej({code:"cancelled"});},{once:true});});}
async function readStream(r,o){const rd=r.body.getReader(),dec=new TextDecoder();let buf="",text="",stop="",err=null;
  const handle=j=>{if(j.type==="content_block_delta"&&j.delta&&j.delta.type==="text_delta"){text+=j.delta.text;if(o.onText)o.onText({text,delta:j.delta.text});}
    else if(j.type==="message_delta"&&j.delta&&j.delta.stop_reason)stop=j.delta.stop_reason;else if(j.type==="error")err=j.error||{type:"api_error"};};
  for(;;){let rv;try{rv=await rd.read();}catch(e){if(e&&(e.name==="AbortError"||(o.signal&&o.signal.aborted)))throw {code:"cancelled"};err=err||{type:"network"};break;}
    if(rv.done)break;buf=(buf+dec.decode(rv.value,{stream:true})).replace(/\r\n/g,"\n");let i;
    while((i=buf.indexOf("\n\n"))>=0){const ev=buf.slice(0,i);buf=buf.slice(i+2);const data=ev.split("\n").filter(l=>l.startsWith("data:")).map(l=>l.slice(5).replace(/^ /,"")).join("\n");if(!data)continue;let j=null;try{j=JSON.parse(data);}catch(e){}if(j)handle(j);}}
  return {text,stop,err};}
async function directJSON(prompt,o){const key=classKey();if(!key)throw {msg:"This file has no class key."};
  if(!usesLeft())throw {msg:"This device has used today's "+DIRECT.perDay+" Claude requests. Come back tomorrow, and replay your saved exams in Play → My practice exams."};
  const content=[];for(const b0 of (o.images||[]).slice(0,4)){const b=await shrinkImage(b0,1200,.72);content.push({type:"image",source:{type:"base64",media_type:b.type||"image/jpeg",data:await blobToB64(b)}});}
  content.push({type:"text",text:prompt});useOne();renderAI();
  const note=s=>{if(o.onNote)o.onNote(s);};let last=null,nets=0,wait=0;
  for(let attempt=0;attempt<5;attempt++){
    if(wait){for(let s=wait;s>0;s--){note("Claude is busy with other exams — trying again in "+s+" s…");await waitFor(1000,o.signal);}note("");wait=0;}
    const res=await apiPost(key,{content,stream:true},o.signal);
    if(res.net){if(++nets>=2)throw {msg:NET_MSG};await waitFor(2000,o.signal);continue;}
    if(res.x){last=res.x;if(isCredit(last)||!(last.status===429||last.status>=500)||attempt>=3)throw {msg:directErr(last)};wait=last.retry?Math.min(60,last.retry):[8,20,40][Math.min(attempt,2)];continue;}
    const s=await readStream(res.r,o);
    if(s.err&&s.err.type==="network"){if(++nets>=2)throw {msg:NET_MSG};continue;}
    if(s.err){last={status:s.err.type==="overloaded_error"?529:500,message:s.err.message||""};if(attempt>=3)throw {msg:directErr(last)};wait=[8,20,40][Math.min(attempt,2)];continue;}
    if(s.stop==="refusal")throw {code:"refused"};
    return parseLoose(s.text);}
  throw {msg:last?directErr(last):NET_MSG};}
/* ---------- the class file through the teacher's n8n workflow (the key stays in n8n) ---------- */
const HOOK_ERR={credit:"This month's Claude credit for the class is used up. Tell your teacher.",key:"The teacher's Claude key in n8n does not work any more. Tell your teacher.",limit:"The class has used today's Claude requests. Try again tomorrow.",long:AI_ERR.prompt_too_large,refused:AI_ERR.refused};
async function hookPost(url,payload,signal){const t0=Date.now();let r;
  try{r=await fetch(url,{method:"POST",headers:{"content-type":"text/plain;charset=UTF-8"},body:JSON.stringify(payload),signal});}
  catch(e){if(e&&e.name==="AbortError")throw {code:"cancelled"};return {net:true,ms:Date.now()-t0};}
  let j=null;try{j=JSON.parse(await r.text());}catch(e){}
  return {r,j,ms:Date.now()-t0};}
async function hookJSON(prompt,o){const url=hookURL();if(!url)throw {msg:"This file has no class server address."};
  if(!usesLeft())throw {msg:"This device has used today's "+DIRECT.perDay+" Claude requests. Come back tomorrow, and replay your saved exams in Play → My practice exams."};
  const images=[];for(const b0 of (o.images||[]).slice(0,4)){const b=await shrinkImage(b0,1200,.72);images.push({type:b.type||"image/jpeg",data:await blobToB64(b)});}
  const payload={kind:o.kind||"exam",prompt,images,fast:false};useOne();renderAI();
  const note=s=>{if(o.onNote)o.onNote(s);};let nets=0,busy=0;
  for(let attempt=0;attempt<6;attempt++){
    const res=await hookPost(url,payload,o.signal);
    const slow=res.ms>45000;   /* a web server stopped waiting: n8n Cloud stops after 100 s, some servers after 60 s */
    if(res.net||(res.r&&!res.r.ok&&res.r.status>=500)){
      if(slow&&!payload.fast&&payload.kind==="exam"){payload.fast=true;note("Claude needed more time than the class server allows — trying the quick way…");continue;}
      if(slow)throw {msg:"The class server stopped waiting for Claude. Try a shorter exam (8 or 15 questions)."};
      if(++nets>=2)throw {msg:res.net?"The class server can't be reached. Check the internet connection, then try again. (Teacher: is the n8n workflow published?)":"The class server had a problem (error "+res.r.status+"). Try again."};
      await waitFor(2000,o.signal);continue;}
    if(!res.r.ok){if(res.r.status===404)throw {msg:"The class server is switched off. Tell your teacher (the n8n workflow must be published)."};throw {msg:"The class server answered with error "+res.r.status+". Tell your teacher."};}
    const j=res.j;if(!j||typeof j!=="object")throw {msg:"The class server's answer was not complete. Tell your teacher."};
    if(j.ok)return parseLoose(j.text);
    if(j.code==="busy"&&busy<3){const w=[8,20,40][busy++];for(let s=w;s>0;s--){note("Claude is busy with other exams — trying again in "+s+" s…");await waitFor(1000,o.signal);}note("");continue;}
    if(j.code==="busy")throw {msg:"Claude is busy with your classmates' exams. Wait a minute, then press the button again."};
    throw {msg:HOOK_ERR[j.code]||("The class server had a problem"+(j.error?": "+String(j.error).slice(0,160):"")+". Try again.")};}
  throw {msg:"Claude is busy right now. Wait a minute, then try again."};}
async function aiJSON(prompt,o){o=o||{};
  if(AI.mode==="direct")return await directJSON(prompt,o);
  if(AI.mode==="hook")return await hookJSON(prompt,o);
  if(AI.mode==="claude"){const opt={modelTier:"default",cache:false};if(o.onText)opt.onText=o.onText;if(o.signal)opt.signal=o.signal;if(o.images&&o.images.length)opt.images=o.images;return await AI.sample.json(prompt,opt);}
  if(AI.mode==="class"){const code=classCode();if(!code)throw {msg:"Type the class code first (ask your teacher)."};const imgs=[];for(const b0 of (o.images||[])){const b=await shrinkImage(b0,1200,.72);imgs.push({type:b.type||"image/jpeg",data:await blobToB64(b)});}
    let r;try{r=await fetch("api/claude",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,kind:o.kind||"exam",prompt,images:imgs}),signal:o.signal});}catch(e){if(e&&e.name==="AbortError")throw {code:"cancelled"};throw {code:"upstream_error"};}
    let j=null;try{j=await r.json();}catch(e){}
    if(!r.ok){if(r.status===401)throw {msg:"The class code is not right. Check it with your teacher."};if(r.status===429)throw {msg:"Too many requests from this class. Wait a minute and try again."};if(r.status===402)throw {msg:"The class credits are used up for this month. Tell your teacher."};throw {msg:(j&&j.error)||"The class copy had a problem. Try again."};}
    if(o.onText&&j&&j.text)o.onText({text:j.text,delta:j.text});return parseLoose(j&&j.text);}
  throw {msg:"Claude can't be reached from here."};}
/* ---------- PDF and photos ---------- */
const PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/";
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=()=>res();s.onerror=()=>rej(new Error("load "+src));document.head.appendChild(s);});}
async function pdfLib(){if(!window.pdfjsLib){await loadScript(PDFJS+"pdf.min.js");if(!window.pdfjsWorker)await loadScript(PDFJS+"pdf.worker.min.js");}const L=window.pdfjsLib;L.GlobalWorkerOptions.workerSrc=PDFJS+"pdf.worker.min.js";return L;}
function parsePages(str,max){const out=[];String(str||"").split(/[,\s]+/).forEach(p=>{const m=p.match(/^(\d+)(?:-(\d+))?$/);if(!m)return;let a=+m[1],b=m[2]?+m[2]:a;if(b<a)[a,b]=[b,a];for(let i=a;i<=b&&out.length<12;i++)if(i>=1&&i<=max&&!out.includes(i))out.push(i);});return out.slice(0,6);}
async function openPdf(file){const L=await pdfLib();const data=new Uint8Array(await file.arrayBuffer());return await L.getDocument({data,isEvalSupported:false}).promise;}
async function pdfText(doc,pages){let out=[];for(const n of pages){const pg=await doc.getPage(n);const tc=await pg.getTextContent();let line="",lines=[];tc.items.forEach(it=>{line+=it.str;if(it.hasEOL){lines.push(line);line="";}else if(it.str&&!/\s$/.test(it.str))line+=" ";});if(line.trim())lines.push(line);
    const txt=lines.map(l=>l.replace(/\s+/g," ").trim()).join("\n").replace(/\n{2,}/g,"\n\n");out.push(txt);}return cleanText(out.join("\n\n"));}
function cleanText(t){return String(t||"").replace(/\r/g,"").replace(/[ \t]+/g," ").replace(/-\n(?=[a-z])/g,"").replace(/([^\n.!?:])\n(?=[a-z])/g,"$1 ").replace(/\n{3,}/g,"\n\n").trim();}
async function pdfImages(doc,pages){const out=[];for(const n of pages.slice(0,maxImages()||1)){const pg=await doc.getPage(n);const vp0=pg.getViewport({scale:1});const sc=Math.min(2.2,1500/Math.max(vp0.width,vp0.height));const vp=pg.getViewport({scale:sc});const c=document.createElement("canvas");c.width=Math.round(vp.width);c.height=Math.round(vp.height);const cx=c.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,c.width,c.height);await pg.render({canvasContext:cx,viewport:vp}).promise;out.push(await new Promise(r=>c.toBlob(r,"image/jpeg",.82)));}return out.filter(Boolean);}
async function shrinkImage(file,max,qual){try{const bmp=await createImageBitmap(file);const sc=Math.min(1,(max||1600)/Math.max(bmp.width,bmp.height));const c=document.createElement("canvas");c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);return await new Promise(r=>c.toBlob(r,"image/jpeg",qual||.85));}catch(e){return file;}}
function words(t){return (String(t||"").match(/[A-Za-z0-9’'-]+/g)||[]).length;}
/* ---------- the Practice exam tab ---------- */
const TOPICS=["How Omani halwa is made","Frankincense in Dhofar","The khareef in Salalah","Sea turtles at Ras al Jinz","Falaj water channels","Healthy sleep for students","Online shopping","Electric cars","Working from home","Recycling plastic"];
function renderSkills(){const groups=["Reading","Listening","Grammar","Vocabulary"];const full=XS.len===25;
  E("#xskills").innerHTML=groups.map(g=>'<div class="e-skillgrp"><h3>'+g+(g==="Listening"?' <span style="text-transform:none;letter-spacing:0;font-weight:400">— the computer reads it aloud</span>':'')+'</h3><div class="e-chips">'+SKILLS.filter(s=>s.g===g).map(s=>'<button type="button" class="e-tick" data-sk="'+s.id+'" aria-pressed="'+(full?FULL_SKILLS.includes(s.id):XS.skills.includes(s.id))+'"'+(full?' disabled':'')+'>'+esc(s.name)+'</button>').join("")+'</div></div>').join("");
  E("#xskn").textContent=full?"The full reading paper practises all six reading question types.":XS.skills.length+" of 5 ticked";}
function renderSrc(){document.querySelectorAll("#xsrc .e-chip").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.src===XS.src)));["topic","file","paste"].forEach(k=>{E("#xsrc-"+k).hidden=XS.src!==k;});}
function renderLen(){document.querySelectorAll("#xlen .e-chip").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.len===XS.len)));E("#xlenhint").textContent=XS.len===25?"Like the final reading paper: Section 1 (headings, True / False / Not Given, word box) and Section 2 (A, B or C, one word or a number, table). Two texts. About 45 minutes.":XS.len===8?"About 10 minutes.":"About 20 minutes.";renderSkills();}
function renderGenreChips(){E("#xgenre").innerHTML=Object.keys(GENRES).filter(k=>k!=="own").map(k=>'<button type="button" class="e-chip" data-g="'+k+'" aria-pressed="'+(XS.genre===k)+'">'+GENRES[k].e+' '+esc(GENRES[k].name)+'</button>').join("");}
E("#xskills").addEventListener("click",e=>{const b=e.target.closest("[data-sk]");if(!b||b.disabled)return;const id=b.dataset.sk;const i=XS.skills.indexOf(id);if(i>=0)XS.skills.splice(i,1);else{if(XS.skills.length>=5){E("#xskn").textContent="5 is the limit — untick one first.";return;}XS.skills.push(id);}lsSet("gs-xskills",XS.skills);renderSkills();});
E("#xsrc").addEventListener("click",e=>{const b=e.target.closest("[data-src]");if(!b)return;XS.src=b.dataset.src;renderSrc();});
E("#xlen").addEventListener("click",e=>{const b=e.target.closest("[data-len]");if(!b)return;XS.len=+b.dataset.len;renderLen();});
E("#xgenre").addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;XS.genre=b.dataset.g;lsSet("gs-xgenre",XS.genre);renderGenreChips();});
E("#xtopics").innerHTML=TOPICS.map(t=>'<button type="button" class="e-chip" data-t="'+esc(t)+'">'+esc(t)+'</button>').join("");
E("#xtopics").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;E("#xtopic").value=b.dataset.t;});
let PDFDOC=null;
E("#xfile").addEventListener("change",async e=>{const files=[...e.target.files];XS.images=[];XS.fileText="";PDFDOC=null;E("#xpagesbox").hidden=true;const msg=E("#xfilemsg");if(!files.length)return;
  const pdf=files.find(f=>/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name));
  try{if(pdf){msg.textContent="Reading the PDF…";PDFDOC=await openPdf(pdf);const n=PDFDOC.numPages;E("#xpagesbox").hidden=n<2;E("#xpages").value=n>1?"1-"+Math.min(2,n):"1";await readPdfPages();}
    else{const imgs=files.filter(f=>/^image\//.test(f.type)).slice(0,4);if(!imgs.length){msg.textContent="Choose a PDF or a photo (JPG or PNG).";return;}
      if(!canImages()){msg.textContent=AI.mode?"Photos can't be sent from here. Use a PDF with text, or paste the text.":"Photos need Claude, and Claude can't be reached from here.";return;}
      for(const f of imgs.slice(0,Math.max(1,maxImages())))XS.images.push(await shrinkImage(f));E("#xfiletext").value="";msg.textContent=XS.images.length+(XS.images.length>1?" photos":" photo")+" ready. Claude reads the page"+(XS.images.length>1?"s":"")+" and makes the exam from "+(XS.images.length>1?"them":"it")+".";}}
  catch(err){console.log("pdf",err);msg.textContent="That file could not be opened. Try another PDF, a photo, or paste the text.";}});
E("#xpages").addEventListener("change",()=>{if(PDFDOC)readPdfPages();});
async function readPdfPages(){const msg=E("#xfilemsg");const pages=parsePages(E("#xpages").value,PDFDOC.numPages);if(!pages.length){msg.textContent="Type the pages, for example 1-2 or 3.";return;}
  msg.textContent="Reading page"+(pages.length>1?"s ":" ")+pages.join(", ")+"…";const txt=await pdfText(PDFDOC,pages);XS.images=[];
  if(words(txt)<60){if(canImages()){XS.images=await pdfImages(PDFDOC,pages);E("#xfiletext").value="";msg.textContent="This PDF is a scan (no text inside), so Claude will read the page pictures ("+XS.images.length+").";}else{E("#xfiletext").value=txt;msg.textContent="This PDF has almost no text inside (it may be a scan). Paste the text instead.";}}
  else{E("#xfiletext").value=txt.slice(0,9000);msg.textContent=words(txt)+" words from page"+(pages.length>1?"s ":" ")+pages.join(", ")+(words(txt)>700?". Claude will choose the best part.":".");}}
E("#xweak").addEventListener("click",()=>{const w=weakestSkills(3);if(!w.length){E("#xskn").textContent="Play a practice exam first — then this button knows your weak skills.";return;}if(XS.len===25)XS.len=15;XS.skills=w;lsSet("gs-xskills",XS.skills);renderLen();E("#xskn").textContent="Ticked: "+w.map(skillName).join(", ");});
function weakestSkills(n){const st=lsGet("gs-skillstats",{});return Object.keys(st).filter(k=>SKILLS.some(s=>s.id===k)&&st[k].n>=2&&st[k].r/st[k].n<.85).sort((a,b)=>st[a].r/st[a].n-st[b].r/st[b].n).slice(0,n);}
/* ---------- the exam prompt ---------- */
function buildExamPrompt(o){const full=o.len===25;const sk=full?[]:o.skills.map(id=>SKILLS.find(s=>s.id===id)).filter(Boolean);
  const R=full||sk.some(s=>s.g==="Reading"||s.id==="v_syn"),LI=!full&&sk.some(s=>s.g==="Listening");const L=[];
  L.push("Write a practice exam for students of General English 2 (GE2, CEFR level B1) at the University of Technology and Applied Sciences in Salalah, Oman. The students are Arabic speakers aged 18 to 21. They answer your questions inside an English learning game, one question at a time, with the text shown (or played aloud) beside each question.");L.push("");
  L.push("SOURCE");
  if(o.src==="topic")L.push('Write the text(s) yourself about this topic: "'+o.topic+'". Use true, well-known facts only. Do not invent statistics; if a number or date is not certain, leave it out.');
  else if(o.images&&o.images.length)L.push("The source is in the attached image(s) of the student's pages. Use the English text in them. Copy the words you need exactly. If a page has more text than you need, choose the most useful part.");
  else{L.push("Use the student's text below. Keep the writer's words. You may shorten it to the most useful part (and correct obvious copying errors), but do not add facts that are not in it.");L.push("<<<TEXT");L.push(String(o.text).slice(0,9000));L.push("TEXT>>>");}
  L.push("");L.push('TEXTS (put them in "texts", in this order)');
  if(full){L.push('1. Reading text 1 for Section 1 ("kind":"read"): 350–450 words, exactly 5 paragraphs, each starting with its label [A], [B], [C], [D], [E].');L.push('2. Reading text 2 for Section 2 ("kind":"read"): 250–350 words about a process or a topic with numbers, dates and names; paragraphs labelled [A], [B], …'+(o.src!=="topic"?" If the student's source is only enough for one text, make text 2 a second part of it.":""));}
  else{if(R)L.push('- A reading text ("kind":"read"): 280–420 words, 4 or 5 paragraphs, each starting with its label [A], [B], …');
    if(LI)L.push('- A listening script ("kind":"listen"): 180–260 words. The computer reads it aloud, so write natural speech: a conversation between two people (every line starts with a first name and a colon, for example "Maryam: …") or a short talk by one speaker. Include clear numbers, times, dates and names: write times like 9:30 and other numbers as digits; when a name is spelled, write it with hyphens (for example "B-R-Y-A-N-T"). In note answers, accept other correct forms with " / " (for example "24 / twenty-four").');
    if(!R&&!LI)L.push("- No text is needed: write every question as a separate sentence about the topic, and set \"texts\" to [].");}
  L.push("Level B1: clear sentences of 10–20 words, common words plus a few useful academic words. Everything must suit a university in Oman: modest and respectful, no romance, no alcohol, no politics.");L.push("");
  L.push("QUESTIONS");
  if(full){L.push("Exactly 25 questions, in this order, like the GE2 final reading paper:");L.push('1–4: type "heading" (text 0, paragraphs B, C, D, E; paragraph A is the example: give its heading in "example_heading"). 5–10: type "tfng" (text 0). 11–15: type "box" (text 0). 16–18: type "abc" (text 1). 19–22: type "word" (text 1). 23–25: type "table" (text 1).');
    ["r_head","r_tfng","r_box","r_abc","r_word","r_table"].forEach(id=>L.push("- "+SK_RULE[id]));}
  else{L.push("Exactly "+o.len+" questions that practise ONLY these skills, shared as evenly as possible (the skill id goes in \"skill\"):");sk.forEach(s=>L.push("- "+s.id+" ("+s.name+"): "+(s.g==="Grammar"?gRule(s):SK_RULE[s.id])));
    L.push("Order: reading questions first (heading, tfng, box, abc, word, table), then listening, then grammar, then vocabulary.");}
  L.push("");L.push("CHECKING (very important)");
  L.push('- Every reading and listening answer must be provable from the text. In "evidence" copy the exact words from the text (5 to 25 words, no changes) that prove the answer. For "Not Given", grammar and vocabulary items, "evidence" is "".');
  L.push("- Exactly one answer is correct. Wrong options must be possible but clearly wrong for a careful reader. Do not test the same fact twice.");
  L.push('- "why": one short sentence in simple English that explains the answer. It is shown after the student answers.');
  L.push('- "text" is the index of the text the question is about (0 = first text in "texts"), or -1 when no text is needed.');L.push("");
  L.push("OUTPUT: reply with ONLY one JSON object, no other text. Shape:");
  L.push('{"title":"short exam title, 2–5 words, without the words practice exam","texts":[{"title":"…","kind":"read","body":"[A] …\\n\\n[B] …"}],"example_heading":"…","headings":["…"],"box":["…"],"questions":[');
  L.push('{"type":"heading","text":0,"paragraph":"B","answer":"<one of headings>","why":"…","skill":"r_head"},');
  L.push('{"type":"tfng","text":0,"q":"…","answer":"True","evidence":"…","why":"…","skill":"r_tfng"},');
  L.push('{"type":"abc","text":0,"q":"…","options":["…","…","…"],"answer":"B","evidence":"…","why":"…","skill":"r_abc"},');
  L.push('{"type":"word","text":-1,"instruction":"Write the correct form of the verb in brackets.","q":"The dates ____ (serve) with coffee.","answer":"are served","evidence":"","why":"…","skill":"g_passive"}]}');
  L.push('Leave out "headings", "example_heading" or "box" when there are no questions of that type.');
  return L.join("\n");}
/* ---------- checking what Claude wrote ---------- */
function nrm(t){return " "+String(t||"").toLowerCase().replace(/[’`]/g,"'").replace(/[^a-z0-9']+/g," ").replace(/\s+/g," ").trim()+" ";}
function inText(ev,T){const e=nrm(ev).trim();if(e.length<3)return false;const t=nrm(T);if(t.includes(" "+e+" "))return true;const tk=e.split(" ").filter(w=>w.length>=3);if(tk.length<4)return false;const set=new Set(t.trim().split(" "));return tk.filter(w=>set.has(w)).length/tk.length>=.85;}
function answerInText(ans,T){const t=nrm(T),t2=nrm(String(T||"").replace(/\b[A-Za-z](?:-[A-Za-z])+\b/g,m=>m.replace(/-/g,"")));return String(ans||"").split(/\s*\/\s*/).map(a=>nrm(a).trim()).filter(Boolean).some(a=>t.includes(" "+a+" ")||t2.includes(" "+a+" "));}
const TYPE_SKILL={heading:"r_head",tfng:"r_tfng",box:"r_box",abc:"r_abc",word:"r_word",table:"r_table",tf:"l_tf"};
function validateExam(x,o){if(!x||typeof x!=="object"||!Array.isArray(x.questions))throw {msg:"Claude's exam was not complete. Press the button again."};
  const texts=(Array.isArray(x.texts)?x.texts:[]).filter(t=>t&&String(t.body||"").trim()).slice(0,3).map(t=>({title:String(t.title||"").slice(0,90),kind:t.kind==="listen"?"listen":"read",body:String(t.body).slice(0,6000)}));
  const heads=(Array.isArray(x.headings)?x.headings:[]).map(String).filter(Boolean).slice(0,10),box=(Array.isArray(x.box)?x.box:[]).map(String).filter(Boolean).slice(0,10);
  const qs=[],usedHead=new Set();let dropped=0;const okSkill=id=>SKILLS.some(s=>s.id===id);
  for(const q of x.questions.slice(0,40)){try{const type=String(q.type||"");let ti=parseInt(q.text,10);if(isNaN(ti))ti=0;const hasT=ti>=0&&ti<texts.length;const T=hasT?texts[ti].body:"";
      let skill=okSkill(q.skill)?q.skill:(TYPE_SKILL[type]||"");if(hasT&&texts[ti].kind==="listen"&&/^r_/.test(skill))skill=type==="word"?"l_note":type==="tf"?"l_tf":"l_abc";
      const isGV=/^[gv]_/.test(skill);const ev=String(q.evidence||"");const why=String(q.why||"").slice(0,220);const whyEv=ev&&!isGV?(why+(why?" ":"")+"The text says: “"+ev.slice(0,140)+"”").slice(0,300):why;
      const base={skill,why:whyEv};if(hasT&&!isGV)base.ti=ti;else base.nt=1;if(isGV&&q.instruction)base.instr=String(q.instruction).slice(0,200);
      const need=c=>{if(!c)throw 0;};
      if(type==="heading"){const p=String(q.paragraph||"").trim().toUpperCase().slice(0,1);need(hasT&&heads.length>=2&&/[A-H]/.test(p)&&T.includes("["+p+"]"));const a=heads.find(h=>nrm(h)===nrm(q.answer));need(a&&!usedHead.has(a));usedHead.add(a);
        qs.push(Object.assign(base,{type:"pick",q:"Which heading fits paragraph "+p+"?",opts:heads,ans:a,sec:"Headings",instr:"Choose the best heading. There are more headings than you need."}));}
      else if(type==="tfng"||type==="tf"){const a={true:"True",t:"True",false:"False",f:"False","not given":"Not Given",ng:"Not Given"}[String(q.answer||"").trim().toLowerCase()];need(a&&String(q.q||"").trim());if(type==="tf")need(a!=="Not Given");if(hasT&&a!=="Not Given")need(inText(ev,T));
        if(type==="tf")qs.push(Object.assign(base,{type:"pick",q:String(q.q),opts:["True","False"],ans:a,sec:"True or False"}));else qs.push(Object.assign(base,{type:"tfng",q:String(q.q),ans:a}));}
      else if(type==="box"){need(box.length>=2&&String(q.q||"").includes("_"));const a=box.find(w=>nrm(w)===nrm(q.answer));need(a);if(hasT)need(inText(ev,T)||answerInText(a,T));
        qs.push(Object.assign(base,{type:"pick",q:String(q.q),opts:box,ans:a,sec:"Word box",instr:"Choose ONE word from the box."}));}
      else if(type==="abc"){const op=Array.isArray(q.options)?q.options.map(String):[];need(op.length===3&&op.every(s=>s.trim())&&String(q.q||"").trim());let a="";const raw=String(q.answer||"").trim();const lm=raw.match(/^\(?([ABCabc])\)?(?:[).:\s]|$)/);if(lm)a=lm[1].toUpperCase();else{const k=op.findIndex(s=>nrm(s)===nrm(raw));if(k>=0)a="ABC"[k];}need(a);
        if(hasT&&!isGV&&skill!=="r_infer"&&skill!=="r_vocab")need(inText(ev,T));qs.push(Object.assign(base,{type:"abc",q:String(q.q),a:op[0],b:op[1],c:op[2],ans:a,sec:isGV?(skill[0]==="g"?"Grammar":"Vocabulary"):undefined}));}
      else if(type==="word"||type==="table"){const a=String(q.answer||"").trim();need(a&&String(q.q||"").includes("_"));
        if(!isGV){need(hasT&&a.split(/\s*\/\s*/).every(x=>x.trim().split(/\s+/).length<=3)&&answerInText(a,T));}
        qs.push(Object.assign(base,{type:"word",q:String(q.q),ans:a,sec:isGV?(skill[0]==="g"?"Grammar":"Vocabulary"):type==="table"?"Table":(texts[ti]&&texts[ti].kind==="listen"?"Notes":"One word or a number"),instr:isGV?base.instr:"Write ONE WORD AND/OR A NUMBER from the "+(texts[ti]&&texts[ti].kind==="listen"?"recording":"text")+"."}));}
      else dropped++;}catch(e){dropped++;}}
  qs.forEach(q=>{Object.keys(q).forEach(k=>{if(q[k]===undefined)delete q[k];});});
  if(qs.length<3)throw {msg:"Claude's exam did not pass the answer checks. Press the button again, or try a clearer text."};
  return {title:shortTitle(x.title),texts,qs,dropped,exHead:String(x.example_heading||"")};}
function shortTitle(t){t=String(t||"").replace(/^\s*(GE2\s*)?(practice\s+)?(exam|test|quiz)\s*[:\-–—]\s*/i,"").replace(/\s+/g," ").trim()||"Practice exam";if(t.length<=40)return t;const c=t.slice(0,41),i=c.lastIndexOf(" ");return (i>20?c.slice(0,i):t.slice(0,39)).replace(/[\s,:;–—-]+$/,"")+"…";}
function examToSpec(v,o){const g=o.genre||"race";const s=blankSpec();s.genre=g;s.name=v.title;s.team="";s.look="colour";s.texts=v.texts;s.text="";s.qs=v.qs;s.exam={id:"x"+Date.now().toString(36),by:AI.mode||"",skills:o.len===25?FULL_SKILLS.slice():o.skills.slice()};
  if(g==="cafe"||g==="sweets"){s.hair="hijab";s.kit="#1d1d24";s.kit2="#e4b84a";}
  if(v.exHead&&v.texts[0]&&v.texts[0].kind==="read"){const b=v.texts[0].body;if(b.includes("[A]")&&!/^\[A\]\s*\(/.test(b))v.texts[0].body=b.replace("[A]","[A] (Example heading: "+v.exHead.replace(/[()]/g,"")+")\n");}
  return sanitizeSpec(s);}
/* ---------- make the exam ---------- */
E("#xmake").addEventListener("click",makeExam);
E("#xstop").addEventListener("click",()=>{if(XS.ctl)XS.ctl.abort();});
async function makeExam(){if(XS.busy)return;const prog=E("#xprog"),out=E("#xout");
  if(!AI.mode){prog.textContent="Claude can't be reached from here (see the box at the top).";return;}
  const o={skills:XS.skills.slice(),len:XS.len,src:XS.src,genre:XS.genre,images:[]};
  if(o.len!==25&&!o.skills.length){prog.textContent="Tick at least one skill in step 1.";E("#xskills").scrollIntoView({behavior:"smooth",block:"center"});return;}
  if(o.src==="topic"){o.topic=E("#xtopic").value.trim();if(!o.topic){prog.textContent="Write a topic in step 2, or tap one of the ideas.";E("#xtopic").focus();return;}}
  else if(o.src==="file"){o.text=E("#xfiletext").value.trim();o.images=XS.images.slice();if(!o.images.length&&words(o.text)<60){prog.textContent="Choose a PDF or a photo in step 2 (or paste the text).";return;}if(o.images.length)o.text="";}
  else{o.text=E("#xpaste").value.trim();if(words(o.text)<60){prog.textContent="Paste a longer text in step 2 (at least 60 words).";E("#xpaste").focus();return;}}
  const prompt=buildExamPrompt(o);XS.busy=true;XS.ctl=new AbortController();E("#xmake").disabled=true;E("#xstop").hidden=false;out.innerHTML="";const N=o.len;const t0=Date.now();
  prog.textContent="Claude is thinking… (this can take a minute)";const tm=setInterval(()=>{if(XS.note)prog.textContent=XS.note;else if(!XS.gotText)prog.textContent="Claude is thinking… "+Math.round((Date.now()-t0)/1000)+" s";},1000);XS.gotText=false;XS.note="";
  try{const raw=await aiJSON(prompt,{images:o.images,signal:XS.ctl.signal,kind:"exam",onNote:s=>{XS.note=s;if(s)prog.textContent=s;else XS.gotText=false;},onText:({text})=>{XS.gotText=true;const n=(text.match(/"type"\s*:/g)||[]).length;prog.textContent=n?"Writing question "+Math.min(n,N)+" of "+N+"…":"Writing the text…";}});
    prog.textContent="Checking every answer against the text…";const v=validateExam(raw,o);const spec=examToSpec(v,o);XS.last=spec;saveExam(spec);
    prog.textContent=v.qs.length+" questions ready"+(v.dropped?" ("+v.dropped+" removed because the answer check failed)":"")+".";renderExamOut(spec);}
  catch(e){console.log("exam",e);prog.textContent=aiErrText(e);}
  finally{clearInterval(tm);XS.note="";XS.busy=false;E("#xmake").disabled=!AI.mode;E("#xstop").hidden=true;XS.ctl=null;}}
function renderExamOut(spec){const out=E("#xout");const n=spec.qs.length;const sk=[...new Set(spec.qs.map(q=>q.skill).filter(Boolean))].map(skillName);
  out.innerHTML='<h3>'+esc(spec.name)+'</h3><p class="e-hint" style="margin:0 0 8px">'+n+' questions · '+esc(sk.join(", "))+'</p>'+
   '<div class="e-row"><button class="e-btn e-primary e-big" type="button" data-x="play">▶ Play it ('+GENRES[spec.genre].e+' '+esc(GENRES[spec.genre].name)+')</button><button class="e-btn e-teal" type="button" data-x="code">Copy game code</button><button class="e-btn" type="button" data-x="edit">Open in Make a game</button></div>'+
   '<details class="e-more"><summary>See the text'+(spec.texts.length>1?"s":"")+'</summary>'+spec.texts.map(t=>'<p><b>'+esc(t.title||(t.kind==="listen"?"Listening":"Reading"))+'</b>'+(t.kind==="listen"?' <span class="e-opt">(read aloud in the game)</span>':'')+'</p><div class="e-hint" style="white-space:pre-wrap;margin:0 0 8px">'+esc(t.body)+'</div>').join("")+'</details>'+
   '<details class="e-more"><summary>See the questions and answers (teachers)</summary><ol class="e-qlist">'+spec.qs.map(q=>'<li>'+(q.sec?'<span class="e-opt">'+esc(q.sec)+' · </span>':'')+esc(q.q)+(q.type==="abc"?' <span class="e-opt">(A '+esc(q.a)+' · B '+esc(q.b)+' · C '+esc(q.c)+')</span>':'')+' → <span class="a">'+esc(q.ans)+'</span></li>').join("")+'</ol></details>';}
E("#xout").addEventListener("click",e=>{const b=e.target.closest("[data-x]");if(!b||!XS.last)return;const a=b.dataset.x;
  if(a==="play")openPlay(XS.last,"friend");else if(a==="code")copyText(encodeSpec(XS.last),"Game code copied! Send it to your friends — they choose Play → “A friend's game”.");else if(a==="edit")loadIntoEditor(JSON.parse(JSON.stringify(XS.last)),"Your practice exam is open in Make a game.");});
/* ---------- my exams and skill records ---------- */
function myExams(){return lsGet("gs-exams",[]);}
function saveExam(spec){const L=myExams().filter(x=>x.id!==spec.exam.id);L.unshift({id:spec.exam.id,title:spec.name,date:Date.now(),skills:spec.exam.skills,spec,res:[]});lsSet("gs-exams",L.slice(0,12));renderMine();}
function onGameResult(r){const sp=r.spec;if(r.skills&&r.skills.length){const st=lsGet("gs-skillstats",{});r.skills.forEach(x=>{const o=st[x.id]||{r:0,n:0};o.r+=x.r;o.n+=x.n;st[x.id]=o;});lsSet("gs-skillstats",st);}
  if(sp&&sp.exam&&sp.exam.id){const L=myExams();const it=L.find(x=>x.id===sp.exam.id);if(it){it.res=(it.res||[]).concat([{date:Date.now(),right:r.right,total:r.total,grade:r.grade}]).slice(-5);lsSet("gs-exams",L);}}renderMine();}
function onPractiseSkill(id){XS.skills=[id];if(XS.len===25)XS.len=15;lsSet("gs-xskills",XS.skills);renderLen();showTab("exam");try{location.hash="exam";}catch(_){}scrollTo({top:0,behavior:"smooth"});E("#xprog").textContent="Ticked: "+skillName(id)+". Choose the text, then press Make my exam.";}
function renderMine(){const ul=E("#pmine");if(!ul)return;const L=myExams();
  if(!L.length){ul.innerHTML='<li><span class="e-hint" style="margin:0">None yet — make one in the Practice exam tab.</span></li>';return;}
  ul.innerHTML=L.map(x=>{const last=(x.res||[]).slice(-1)[0];return '<li><div><b>'+esc(x.title)+'</b><small>'+new Date(x.date).toLocaleDateString()+' · '+x.spec.qs.length+' questions'+(last?' · last: '+last.right+'/'+last.total+' ('+esc(last.grade)+')':'')+'</small></div><div class="e-row"><button class="e-btn e-small e-teal" type="button" data-mine="play" data-id="'+esc(x.id)+'">▶ Play</button><button class="e-btn e-small" type="button" data-mine="del" data-id="'+esc(x.id)+'" aria-label="Delete '+esc(x.title)+'">Delete</button></div></li>';}).join("");
  const st=lsGet("gs-skillstats",{});const ks=Object.keys(st).filter(k=>st[k].n>0);if(ks.length){ul.insertAdjacentHTML("beforeend",'<li><div><b>Your skills so far</b><small>'+ks.sort((a,b)=>st[a].r/st[a].n-st[b].r/st[b].n).map(k=>esc(skillName(k))+' '+st[k].r+'/'+st[k].n).join(" · ")+'</small></div></li>');}}
E("#pmine").addEventListener("click",e=>{const b=e.target.closest("[data-mine]");if(!b)return;const id=b.dataset.id;const L=myExams();const it=L.find(x=>x.id===id);if(!it)return;
  if(b.dataset.mine==="play")openPlay(it.spec,"friend");else{if(b.dataset.armed){lsSet("gs-exams",L.filter(x=>x.id!==id));renderMine();}else{b.dataset.armed="1";b.textContent="Tap again";setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent="Delete";}},3000);}}});
/* ---------- example games (Play tab) ---------- */
E("#pex").innerHTML=Object.keys(EXAMPLES).map(g=>'<button class="e-btn e-small" type="button" data-ex="'+g+'">'+GENRES[g].e+' '+esc(GENRES[g].name)+'</button>').join("");
E("#pex").addEventListener("click",e=>{const b=e.target.closest("[data-ex]");if(!b)return;const g=b.dataset.ex,ex=JSON.parse(JSON.stringify(EXAMPLES[g]));openPlay(Object.assign(blankSpec(),ex,{genre:g,text:ex.text||EX_TEXT,qs:ex.qs||JSON.parse(JSON.stringify(EX_QS))}),"friend");});
/* ---------- Brew-Haha inside the Studio ---------- */
function openBrew(){const w=E("#brewwrap"),f=E("#brewframe");if(typeof BREW_SRC!=="string"){note("Brew-Haha is not in this copy.");return;}f.srcdoc=BREW_SRC;w.hidden=false;document.body.classList.add("playing");const m=E("#pbrewmsg");if(m)m.textContent="";setTimeout(()=>{try{f.contentWindow.focus();}catch(_){}},300);
  setTimeout(()=>{if(w.hidden)return;let ok=false;try{ok=!!(f.contentDocument&&f.contentDocument.getElementById("stage"));}catch(e){}if(!ok){closeBrew();if(m)m.textContent="Brew-Haha could not open inside this page here. Ask your teacher for its own link.";}},6000);}
function closeBrew(){const w=E("#brewwrap"),f=E("#brewframe");w.hidden=true;document.body.classList.remove("playing");try{f.removeAttribute("srcdoc");f.src="about:blank";}catch(_){}}
window.closeBrew=closeBrew;
E("#pbrew").addEventListener("click",openBrew);E("#brewclose").addEventListener("click",closeBrew);
/* ---------- Make a game: a PDF for the text, and Claude checks the questions ---------- */
E("#epdf").addEventListener("click",()=>E("#epdffile").click());
E("#epdffile").addEventListener("change",async e=>{const f=e.target.files[0];const msg=E("#epdfmsg");if(!f)return;try{msg.textContent="Reading the PDF…";const doc=await openPdf(f);const pages=[1];const txt=await pdfText(doc,pages);
    if(words(txt)<30){msg.textContent="Page 1 has almost no text inside (it may be a scan). Type or paste the text instead.";return;}
    const body=txt.split(/\n/).filter(l=>words(l)>=8||/[.!?]$/.test(l.trim())).join("\n");const sents=body.replace(/\n(?!\n)/g," ").split(/(?<=[.!?])\s+/);let cut="";for(const x of sents){if(words(cut)>=120)break;cut+=(cut?" ":"")+x.trim();}cut=cut||txt.slice(0,900);SPEC.text=cut.slice(0,6000);if(SPEC.texts&&SPEC.texts.length)SPEC.texts[0].body=SPEC.text;E("#etext").value=SPEC.text;changed();
    msg.textContent="Took "+words(cut)+" words from page 1 of "+doc.numPages+". Delete what you don't need — a short text (40–150 words) is best.";}catch(err){console.log(err);msg.textContent="That PDF could not be opened. Paste the text instead.";}finally{e.target.value="";}});
E("#ecoach").addEventListener("click",coachQuestions);
async function coachQuestions(){const msg=E("#ecoachmsg");document.querySelectorAll(".e-coach").forEach(x=>x.remove());
  if(!AI.mode){msg.textContent="Claude can't be reached from here.";return;}const list=SPEC.qs.map((q,i)=>({q,i})).filter(x=>String(x.q.q||"").trim());if(!list.length){msg.textContent="Write a question first.";return;}
  const L=["You are a kind English teacher. A team of B1 students (Arabic speakers, GE2 at a university in Oman) wrote these exam-style questions about their text. Check each question. Do NOT write the corrected question or the answer for them: if there is a problem, describe it in ONE short, simple English sentence and give a hint so they can fix it themselves.","Look for: an answer that is wrong or not in the text; a Not Given answer when the text does say it (or the opposite); more than one possible answer; a missing gap ____ ; options that are too easy; grammar or spelling mistakes in the question; a passive form that is wrong.","","THEIR TEXT:",'"""',String(SPEC.text||"(no text)").slice(0,4000),'"""',"","THEIR QUESTIONS:"];
  list.forEach((x,k)=>{const q=x.q;L.push((k+1)+". ["+({tfng:"True / False / Not Given",abc:"A, B or C",word:"write the missing word",pick:"choose from a list"}[q.type]||q.type)+"] "+q.q+(q.type==="abc"?" | A) "+q.a+" B) "+q.b+" C) "+q.c:"")+(q.type==="pick"?" | list: "+(q.opts||[]).join(", "):"")+" | their answer: "+q.ans);});
  L.push("","Reply with ONLY JSON: {\"questions\":[{\"n\":1,\"ok\":true,\"note\":\"one short sentence: what is good, or the problem and a hint\"}],\"overall\":\"one short encouraging sentence\"}");
  const b=E("#ecoach");b.disabled=true;msg.textContent="Claude is checking your questions…";
  try{const r=await aiJSON(L.join("\n"),{kind:"coach",onNote:s=>{msg.textContent=s||"Claude is checking your questions…";}});const arr=Array.isArray(r&&r.questions)?r.questions:[];let bad=0;
    arr.forEach(c=>{const k=parseInt(c.n,10)-1;const x=list[k];if(!x)return;const el=document.querySelector('.e-q[data-i="'+x.i+'"]');if(!el)return;if(!c.ok)bad++;el.insertAdjacentHTML("beforeend",'<div class="e-coach'+(c.ok?' ok':'')+'"><b>'+(c.ok?"✓ Claude: ":"✎ Claude: ")+'</b>'+esc(String(c.note||"").slice(0,240))+'</div>');});
    msg.textContent=(r&&r.overall?String(r.overall).slice(0,160)+" ":"")+(bad?bad+" question"+(bad>1?"s need":" needs")+" a fix — read the notes.":"All good!");}
  catch(e){msg.textContent=aiErrText(e);}finally{b.disabled=!AI.mode;}}
/* ---------- teacher file: make the class file with the key inside ---------- */
(function keyMaker(){const card=E("#tkeycard");if(!card||typeof window.CLASS_TPL!=="string")return;card.hidden=false;
  const inp=E("#tkey"),msg=E("#tkeymsg"),show=E("#tkeyshow"),day=E("#tkeyday"),tb=E("#tkeytest");let tested="";
  const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok===true?"var(--e-ok)":ok===false?"var(--e-warn)":"";};
  const val=()=>inp.value.replace(/\s+/g,"");
  show.addEventListener("click",()=>{const on=inp.type==="password";inp.type=on?"text":"password";show.textContent=on?"Hide":"Show";show.setAttribute("aria-pressed",String(on));});
  inp.addEventListener("input",()=>{if(val()!==tested)say("");});
  tb.addEventListener("click",async()=>{const k=val();if(!keyOK(k)){say("That doesn't look like an API key. Copy it again: it starts with sk-ant-",false);inp.focus();return;}
    tb.disabled=true;say("Testing the key…");
    try{const res=await apiPost(k,{content:[{type:"text",text:"Reply with the single word: OK"}],max:400});
      if(res.net)say("Claude can't be reached from this computer. Check the internet connection, then try again.",false);
      else if(!res.x){tested=k;say("✓ The key works. Now choose the daily limit and press Download the class file.",true);}
      else{const x=res.x;
        if(isCredit(x))say("The key is right, but the account has no API credit left. In claude.ai open Settings → Billing → API credits and check that they are linked.",false);
        else if(x.status===401)say("This key does not work: it was deleted or expired, or part of it is missing. Copy it again from platform.claude.com → API keys.",false);
        else if(x.status===429||x.status>=500){tested=k;say("✓ The key works (Claude is busy right now). You can download the class file.",true);}
        else say("The Claude API answered: "+(x.message||("error "+x.status)),false);}}
    catch(e){say("The test stopped. Try again.",false);}finally{tb.disabled=false;}});
  E("#tkeydl").addEventListener("click",()=>{const k=val();if(!keyOK(k)){say("Paste your API key first (it starts with sk-ant-).",false);inp.focus();return;}
    const name=saveClassFile('window.CLASS_API_KEY="'+k+'";window.CLASS_PER_DAY='+(parseInt(day.value,10)||10)+';',"GE2-Game-Studio-CLASS.html");
    if(!name){say("This teacher file is damaged. Download it again from Claude.",false);return;}
    say((tested===k?"✓ ":"✓ (You did not test the key.) ")+name+" is in your Downloads folder. Open it, make one quick exam, then send it to your students.",true);});})();
/* writes the class file: the template with the slot filled in, saved as a download */
function saveClassFile(fill,name){const slot='window.CLASS_API_KEY="'+SLOT_WORD+'";window.CLASS_PER_DAY=10;',tpl=window.CLASS_TPL;
  if(typeof tpl!=="string"||tpl.indexOf(slot)<0)return "";const html=tpl.replace(slot,()=>fill);
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html"}));a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},8000);return name;}
/* ---------- teacher file: the class file through n8n ---------- */
(function hookMaker(){const card=E("#thookcard");if(!card||typeof window.CLASS_TPL!=="string")return;card.hidden=false;
  const inp=E("#thook"),msg=E("#thookmsg"),day=E("#thookday"),tb=E("#thooktest");let tested="";
  const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok===true?"var(--e-ok)":ok===false?"var(--e-warn)":"";};
  const val=()=>inp.value.trim();
  inp.addEventListener("input",()=>{if(val()!==tested)say("");});
  tb.addEventListener("click",async()=>{const u=val();if(!hookOK(u)){say("Paste the Production URL from the first step of the workflow (it starts with https://).",false);inp.focus();return;}
    if(/\/webhook-test\//.test(u)){say("That is the Test URL. Copy the Production URL instead (it has /webhook/, not /webhook-test/).",false);return;}
    tb.disabled=true;say("Asking your n8n…");
    try{const res=await hookPost(u,{kind:"ping",prompt:"",images:[]});const j=res.j;
      if(res.net)say("Your n8n did not answer. Check that the address is the Production URL and that the workflow is saved and published (turned on).",false);
      else if(!res.r.ok)say(res.r.status===404?"n8n says this address is not switched on. Publish (turn on) the workflow, then test again.":"n8n answered with error "+res.r.status+". Check the workflow, then test again.",false);
      else if(!j||typeof j!=="object")say("n8n answered, but not in the way the class file needs. Import the workflow file again and use its Production URL.",false);
      else if(j.ok){tested=u;say("✓ Your n8n works and Claude answered. Now choose the daily limit and press Download the class file.",true);}
      else if(j.code==="key")say("n8n works, but Claude did not accept the key. Open the Ask Claude step and check the credential: Name x-api-key, Value your API key.",false);
      else if(j.code==="credit")say("n8n works, but the account has no API credit left. In claude.ai open Settings → Billing → API credits.",false);
      else if(j.code==="busy"){tested=u;say("✓ Your n8n works (Claude is busy right now). You can download the class file.",true);}
      else say("n8n answered: "+(j.error||j.code||"unknown problem"),false);}
    catch(e){say("The test stopped. Try again.",false);}finally{tb.disabled=false;}});
  E("#thookdl").addEventListener("click",()=>{const u=val();if(!hookOK(u)){say("Paste your n8n Production URL first.",false);inp.focus();return;}
    const name=saveClassFile("window.CLASS_HOOK_URL="+JSON.stringify(u).replace(/</g,"\\u003c")+";window.CLASS_PER_DAY="+(parseInt(day.value,10)||10)+";","GE2-Game-Studio-CLASS-n8n.html");
    if(!name){say("This teacher file is damaged. Download it again from Claude.",false);return;}
    say((tested===u?"✓ ":"✓ (You did not test the address.) ")+name+" is in your Downloads folder. Open it, make one quick exam, then send it to your students.",true);});})();
/* ---------- tab hook + boot ---------- */
function onTabShown(t){if(t==="play")renderMine();}
XS.skills=(lsGet("gs-xskills",[])||[]).filter(id=>SKILLS.some(s=>s.id===id)).slice(0,5);XS.genre=GENRES[lsGet("gs-xgenre","race")]&&lsGet("gs-xgenre","race")!=="own"?lsGet("gs-xgenre","race"):"race";
renderLen();renderSrc();renderGenreChips();renderMine();renderAI();aiInit();
if(typeof window.CLASS_TPL==="string"&&!location.hash)showTab("teacher");
