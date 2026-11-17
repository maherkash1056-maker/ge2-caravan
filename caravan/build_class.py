# Builds the CLASS file from the Studio template, the same way saveClassFile() does in the browser.
s=open('/home/claude/studio/class_template.html').read()
slot='window.CLASS_API_KEY="PASTE_YOUR_KEY_HERE";window.CLASS_PER_DAY=10;'
assert s.count(slot)==1
out=s.replace(slot,'window.CLASS_HOOK_URL="https://ge2-caravan-api.ge2-caravan.workers.dev/";window.CLASS_PER_DAY=20;')
open('/mnt/user-data/outputs/GE2-Game-Studio-CLASS-n8n.html','w').write(out); print(len(out))
