#!/bin/bash
# Publish the Caravan pages: build the Cloudflare file-server worker from the output files, deploy it, then trigger the n8n sync.
# Paths: runs from its own folder (caravan/); the 11 built slot pages are read from $CARAVAN_OUT (default <repo>/build/outputs).
set -e
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; cd "$HERE"
export CARAVAN_OUT="${CARAVAN_OUT:-$(cd "$HERE/.." && pwd)/build/outputs}"
python3 - <<'PY'
import json,os
O=os.environ["CARAVAN_OUT"]; os.makedirs("files",exist_ok=True)
names={1:"GE2-Game-Studio-CLASS-n8n.html",2:"Class-Game-2-Two-Windows-Ajnan.html",3:"Class-Game-3-2-Legends-Wijdan-Khlood.html",4:"Slot-4-Word-Royale-HOST.html",5:"Slot-5-Word-Royale-PLAYER.html",6:"Slot-6-Wadi-Snakes-PLAYER.html",7:"Slot-7-Wadi-Snakes-HOST.html",8:"Slot-8-Fort-of-Taqah.html",9:"Slot-9-Khareef-Rally.html",10:"Slot-10-Dhow-to-Zanzibar.html",11:"Slot-11-Brew-Haha.html"}
slots={k:os.path.join(O,v) for k,v in names.items()}
BUG=open('bugcatch.js',encoding='utf-8').read().strip()
def inject(h):
    if 'CARAVAN_BUGCATCH' in h: return h
    i=h.find('<head'); j=h.find('>',i)+1 if i>=0 else -1
    return (h[:j]+'\n'+BUG+'\n'+h[j:]) if j>0 else BUG+'\n'+h
d={}
for k,v in slots.items():
    h=open(v,encoding='utf-8').read(); h2=inject(h)
    if h2!=h: open(v,'w',encoding='utf-8').write(h2)
    d[str(k)]=h2
js="const F="+json.dumps(d,ensure_ascii=False)+""";
export default{async fetch(req){const u=new URL(req.url);const m=u.pathname.match(/^\\/slot\\/(\\d+)$/);if(!m||!F[m[1]])return new Response(JSON.stringify({ok:true,slots:Object.keys(F).map(k=>({part:+k,len:F[k].length}))}),{headers:{"content-type":"application/json"}});
return new Response(F[m[1]],{headers:{"content-type":"text/html;charset=utf-8","cache-control":"no-store"}});}}"""
open("files/worker.mjs","w",encoding="utf-8").write(js); print("worker bytes",len(js))
PY
A=$(cat secrets/cf_account); T=$(cat secrets/cf_token)
curl -sS -X PUT "https://api.cloudflare.com/client/v4/accounts/$A/workers/scripts/ge2-caravan-files" -H "Authorization: Bearer $T" -F 'metadata={"main_module":"worker.mjs","compatibility_date":"2025-01-01"};type=application/json' -F "worker.mjs=@files/worker.mjs;type=application/javascript+module" | python3 -c "import sys,json;j=json.load(sys.stdin);print('deploy',j['success'],j.get('errors'))"
sleep 6; curl -sS https://ge2-caravan-files.ge2-caravan.workers.dev/
