import json,re,sys,glob,os
f=sorted(glob.glob('/root/.claude/projects/-home-claude/dea197cc-3a15-5176-a575-788e18adf2ee/tool-results/mcp-n8n-get_data_table_rows-*.txt'),key=os.path.getmtime)[-1]
d=json.load(open(f))
files={1:'GE2-Game-Studio-CLASS-n8n.html',2:'Class-Game-2-Two-Windows-Ajnan.html',3:'Class-Game-3-2-Legends-Wijdan-Khlood.html',4:'Slot-4-Word-Royale-HOST.html',5:'Slot-5-Word-Royale-PLAYER.html',6:'Slot-6-Wadi-Snakes-PLAYER.html',7:'Slot-7-Wadi-Snakes-HOST.html',8:'Slot-8-Fort-of-Taqah.html',9:'Slot-9-Khareef-Rally.html',10:'Slot-10-Dhow-to-Zanzibar.html',11:'Slot-11-Brew-Haha.html'}
for r in sorted(d['rows'],key=lambda r:r['part']):
  if r['part'] not in files: continue
  h=r['html'] or ''; same=open('/mnt/user-data/outputs/'+files[r['part']],encoding='utf-8').read()==h
  print(r['part'],len(h),r['updatedAt'][11:19],'IDENTICAL' if same else 'DIFFERENT')
