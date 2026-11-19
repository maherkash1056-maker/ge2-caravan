import os
here=os.path.dirname(os.path.abspath(__file__)); rd=lambda f:open(os.path.join(here,f),encoding='utf-8').read()
bridge=open(os.path.join(here,'..','games','caravan-bridge.js'),encoding='utf-8').read()
CSS={'fort':rd('fort.css'),
'rally':'.rwrap{max-width:1000px;margin:0 auto}.rhud{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:6px 10px;margin-bottom:6px;gap:8px}#rcv{display:block;margin:0 auto;border:2px solid var(--line);border-radius:12px;touch-action:none}',
'dhow':'.route{display:flex;justify-content:space-between;gap:2px;margin:6px 0 10px;font-size:12px;font-weight:700;color:var(--muted)}.route span{display:flex;flex-direction:column;align-items:center;flex:1}.route span.on{color:var(--teal)}.route i{font-style:normal;font-size:18px}.story{background:#fff;border:2px solid var(--line);border-radius:12px;padding:10px 12px;margin:10px 0;min-height:120px}.story.sea{background:linear-gradient(#cfe8ee,#8fc3cf);text-align:center}.cap{font-weight:800;font-size:19px;margin:0 0 4px}.ship{font-size:54px;margin:6px 0;animation:bob 1.2s ease-in-out infinite}@keyframes bob{50%{transform:translate(14px,-6px) rotate(4deg)}}'}
f3=os.path.join(here,'fort3d','dist','fort3d.js'); fort3d=(rd(f3)+'\n') if os.path.exists(f3) else ''  # built by: node caravan/quests/fort3d/build.js
CSS['fort_adventure']=CSS['fort']
NAME={'fort':'Fort of Taqah','rally':'Khareef Rally','dhow':'Dhow to Zanzibar','fort_adventure':'Fort of Taqah'}
for k in CSS:
    html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+NAME[k]+' · GE2 Caravan</title><style>'+rd('common.css')+CSS[k]+'</style></head><body><div id="app"></div>\n<script>'+bridge+'</script>\n<script>const GAME='+__import__('json').dumps(NAME[k])+';\n'+('window.FORT_MODE="adventure";\n' if k=='fort_adventure' else '')+(rd('art/fort_assets.js') if k in('fort','fort_adventure') else '')+(fort3d if k in('fort','fort_adventure') else '')+rd('common.js')+'\n'+rd(('fort' if k=='fort_adventure' else k)+'.js')+'</script></body></html>'
    open(os.path.join(here,k+'.html'),'w',encoding='utf-8').write(html); print(k,len(html))
