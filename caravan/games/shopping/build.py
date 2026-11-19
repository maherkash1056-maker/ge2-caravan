#!/usr/bin/env python3
# Builds The Big Shopping Run (slot 12) from caravan/games/shopping/src into caravan/games/shopping.html and
# $CARAVAN_OUT/Slot-12-Big-Shopping-Run.html. Order: teacher hook, fonts+css, body, caravan-bridge.js, art, levels, questions, game+tail.
import os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(os.path.dirname(os.path.dirname(HERE))); S=os.path.join(HERE,'src')
rd=lambda f:open(os.path.join(S,f),encoding='utf-8').read()
bridge=open(os.path.join(HERE,'..','caravan-bridge.js'),encoding='utf-8').read()
html=('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
 '<title>The Big Shopping Run — GE2 Caravan</title>\n<script>'+rd('teacher_hook.js')+'</script>\n'
 '<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">\n<style>\n'+rd('style.css')+'</style>\n</head>\n<body>\n'+rd('body.html')+
 '<script>'+bridge+'</script>\n<script>\n'+rd('art.js')+'</script>\n<script>\n'+rd('levels.js')+'</script>\n<script>\n'+rd('questions.js')+'</script>\n<script>\n'+rd('game.js')+'\n'+rd('game_tail.js')+'</script>\n</body>\n</html>\n')
out1=os.path.join(HERE,'..','shopping.html'); open(out1,'w',encoding='utf-8').write(html)
OUT=os.environ.get('CARAVAN_OUT') or os.path.join(ROOT,'build','outputs'); os.makedirs(OUT,exist_ok=True)
out2=os.path.join(OUT,'Slot-12-Big-Shopping-Run.html'); open(out2,'w',encoding='utf-8').write(html)
print(len(html),out1); print(len(html),out2)
