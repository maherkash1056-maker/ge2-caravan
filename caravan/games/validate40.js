const P=require("../../tests/paths.js"); // portable build/tmp paths (see tests/paths.js)
const fs=require('fs');const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.setContent(fs.readFileSync(P.requireStudio(),"utf8"));await p.waitForTimeout(500);
const raw=fs.readFileSync(process.argv[2],"utf8");
const r=await p.evaluate((raw)=>{let x=raw;const m=x.match(/\{[\s\S]*\}/);x=JSON.parse(m?m[0]:x);const o={skills:[],len:40,src:"topic",genre:"race"};const v=validateExam(x,o);const s=examToSpec(v,o);G.spec=s;
 return {title:s.name,texts:s.texts.map(t=>t.kind+":"+t.body.split(/\s+/).length+"w"),n:s.qs.length,dropped:v.dropped,order:s.qs.map(q=>q.skill).join(" "),parts:s.qs.filter(q=>/^l_/.test(q.skill)).map(q=>q.q.slice(0,50)+" => "+tapePart(s.texts[q.ti].body,q).slice(0,140).replace(/\n/g," | ")),code:encodeSpec(sanitizeSpec(s)).length};},raw);
console.log(JSON.stringify(r,null,1));await b.close();})();
