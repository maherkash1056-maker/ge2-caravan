#!/bin/bash
# Publish the Caravan pages: build the Cloudflare file-server worker from the output files, deploy it, then trigger the n8n sync.
set -e
cd /home/claude/caravan
python3 - <<'PY'
import json
slots={1:"/mnt/user-data/outputs/GE2-Game-Studio-CLASS-n8n.html",2:"/mnt/user-data/outputs/Class-Game-2-Two-Windows-Ajnan.html",3:"/mnt/user-data/outputs/Class-Game-3-2-Legends-Wijdan-Khlood.html",4:"/mnt/user-data/outputs/Slot-4-Word-Royale-HOST.html",5:"/mnt/user-data/outputs/Slot-5-Word-Royale-PLAYER.html",6:"/mnt/user-data/outputs/Slot-6-Wadi-Snakes-PLAYER.html",7:"/mnt/user-data/outputs/Slot-7-Wadi-Snakes-HOST.html",8:"/mnt/user-data/outputs/Slot-8-Fort-of-Taqah.html",9:"/mnt/user-data/outputs/Slot-9-Khareef-Rally.html",10:"/mnt/user-data/outputs/Slot-10-Dhow-to-Zanzibar.html",11:"/mnt/user-data/outputs/Slot-11-Brew-Haha.html"}
d={str(k):open(v,encoding='utf-8').read() for k,v in slots.items()}
js="const F="+json.dumps(d,ensure_ascii=False)+""";
export default{async fetch(req){const u=new URL(req.url);const m=u.pathname.match(/^\\/slot\\/(\\d+)$/);if(!m||!F[m[1]])return new Response(JSON.stringify({ok:true,slots:Object.keys(F).map(k=>({part:+k,len:F[k].length}))}),{headers:{"content-type":"application/json"}});
return new Response(F[m[1]],{headers:{"content-type":"text/html;charset=utf-8","cache-control":"no-store"}});}}"""
open("files/worker.mjs","w",encoding="utf-8").write(js); print("worker bytes",len(js))
PY
A=$(cat secrets/cf_account); T=$(cat secrets/cf_token)
curl -sS -X PUT "https://api.cloudflare.com/client/v4/accounts/$A/workers/scripts/ge2-caravan-files" -H "Authorization: Bearer $T" -F 'metadata={"main_module":"worker.mjs","compatibility_date":"2025-01-01"};type=application/json' -F "worker.mjs=@files/worker.mjs;type=application/javascript+module" | python3 -c "import sys,json;j=json.load(sys.stdin);print('deploy',j['success'],j.get('errors'))"
sleep 6; curl -sS https://ge2-caravan-files.ge2-caravan.workers.dev/
