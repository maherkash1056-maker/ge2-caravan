# Compares the n8n "GE2 App" table copy of the 11 slot pages with the built outputs. Must print IDENTICAL x11 after a publish + sync.
# Usage: python3 caravan/verify_live.py [rows.json]
#   rows.json = the JSON returned by the n8n MCP tool get_data_table_rows on the "GE2 App" table ({"rows":[{"part","html","updatedAt"},...]}).
#   Without an argument it falls back to the newest saved mcp-n8n-get_data_table_rows-*.txt under ~/.claude/projects (the old behaviour).
#   Built pages are read from $CARAVAN_OUT (default <repo>/build/outputs).
import json,re,sys,glob,os
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('CARAVAN_OUT') or os.path.join(os.path.dirname(HERE),'build','outputs')
if len(sys.argv)>1: f=sys.argv[1]
else:
  c=sorted(glob.glob(os.path.expanduser('~/.claude/projects/*/tool-results/mcp-n8n-get_data_table_rows-*.txt')),key=os.path.getmtime)
  if not c: sys.exit('verify_live.py: pass the n8n get_data_table_rows JSON file as the first argument (no saved export found)')
  f=c[-1]
d=json.load(open(f))
files={1:'GE2-Game-Studio-CLASS-n8n.html',2:'Class-Game-2-Two-Windows-Ajnan.html',3:'Class-Game-3-2-Legends-Wijdan-Khlood.html',4:'Slot-4-Word-Royale-HOST.html',5:'Slot-5-Word-Royale-PLAYER.html',6:'Slot-6-Wadi-Snakes-PLAYER.html',7:'Slot-7-Wadi-Snakes-HOST.html',8:'Slot-8-Fort-of-Taqah.html',9:'Slot-9-Khareef-Rally.html',10:'Slot-10-Dhow-to-Zanzibar.html',11:'Slot-11-Brew-Haha.html',12:'Slot-12-Big-Shopping-Run.html'}
for r in sorted(d['rows'],key=lambda r:r['part']):
  if r['part'] not in files: continue
  h=r['html'] or ''; fp=os.path.join(OUT,files[r['part']])
  same=os.path.exists(fp) and open(fp,encoding='utf-8').read()==h
  print(r['part'],len(h),r['updatedAt'][11:19],'IDENTICAL' if same else ('MISSING '+fp if not os.path.exists(fp) else 'DIFFERENT'))
