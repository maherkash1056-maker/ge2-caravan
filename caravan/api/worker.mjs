// GE2 Caravan API front door: forwards every POST to the class server (Supabase Edge Function).
const UP="https://djlsdsfvnnawvrmalhzb.supabase.co/functions/v1/caravan";
const H={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"POST, OPTIONS"};
export default{async fetch(req){
 if(req.method==="OPTIONS")return new Response(null,{headers:H});
 if(req.method!=="POST")return new Response(JSON.stringify({ok:true,server:"ge2-caravan-api"}),{headers:{...H,"content-type":"application/json"}});
 const r=await fetch(UP,{method:"POST",headers:{"content-type":"application/json"},body:await req.text()});
 return new Response(await r.text(),{status:r.status,headers:{...H,"content-type":"application/json"}});
}}
