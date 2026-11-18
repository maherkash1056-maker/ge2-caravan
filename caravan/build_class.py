# Builds the CLASS file from the Studio template, the same way saveClassFile() does in the browser.
# Paths: template is studio/class_template.html next to this repo; output goes to $CARAVAN_OUT (default <repo>/build/outputs).
import os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
OUT=os.environ.get('CARAVAN_OUT') or os.path.join(ROOT,'build','outputs'); os.makedirs(OUT,exist_ok=True)
s=open(os.path.join(ROOT,'studio','class_template.html'),encoding='utf-8').read()
slot='window.CLASS_API_KEY="PASTE_YOUR_KEY_HERE";window.CLASS_PER_DAY=10;'
assert s.count(slot)==1
out=s.replace(slot,'window.CLASS_HOOK_URL="https://ge2-caravan-api.ge2-caravan.workers.dev/";window.CLASS_PER_DAY=20;')
dest=os.path.join(OUT,'GE2-Game-Studio-CLASS-n8n.html')
open(dest,'w',encoding='utf-8').write(out); print(len(out), dest)
