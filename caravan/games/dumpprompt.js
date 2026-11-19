const P=require("../../tests/paths.js"); // portable build/tmp paths (see tests/paths.js)
const fs=require('fs');const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.setContent(fs.readFileSync(P.requireStudio(),"utf8"));await p.waitForTimeout(500);
const pr=await p.evaluate(()=>buildExamPrompt({lpaper:true,skills:[],len:15,src:"topic",topic:"the frankincense trade in Dhofar",genre:"race",images:[]}));fs.writeFileSync(P.tmp("prompt40.txt"),pr);console.log(pr.length);await b.close();})();
