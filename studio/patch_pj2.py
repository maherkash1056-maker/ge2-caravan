import re,pathlib
p=pathlib.Path("/home/claude/studio/class_template.html");s=p.read_text()
# 1. CSS block
a=s.index("/* ---- 3 · My project (slides) ---- */");b=s.index("/* ---- exam paper mode ---- */")
css='''/* ---- 3 · My project (slides) — v2: tap-to-edit ---- */
.pj-looks{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.pj-look{width:92px;height:56px;border-radius:10px;border:3px solid transparent;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;font:inherit;font-weight:800;font-size:13px;padding:4px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}.pj-look.on{border-color:var(--e-accent);box-shadow:0 0 0 2px #fff,0 0 0 4px var(--e-accent)}
.pj-big{font-size:20px;padding:12px 14px}
.pj-strip{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px}.pj-thumb{position:relative;border:2px solid var(--e-line);border-radius:8px;padding:0;background:var(--e-card);cursor:pointer;text-align:left;flex:none;width:150px;font-size:5.4px;line-height:1.25}.pj-thumb.on{border-color:var(--e-accent);box-shadow:0 0 0 2px var(--e-accent)}.pj-thumb.add{font:inherit;font-size:26px;font-weight:900;color:var(--e-ink);width:60px;display:flex;align-items:center;justify-content:center;aspect-ratio:auto}
.pj-n{position:absolute;left:6px;top:4px;font-size:11px;font-weight:800;background:rgba(0,0,0,.45);color:#fff;border-radius:999px;padding:1px 6px;z-index:1}
.pj-stagewrap{font-size:clamp(13px,1.9vw,24px)}#pjstage .pj-slide{box-shadow:0 6px 24px rgba(0,0,0,.18)}
.pj-slide{aspect-ratio:16/9;width:100%;box-sizing:border-box;padding:5% 6%;display:flex;gap:4%;align-items:center;font-family:"Trebuchet MS",Arial,sans-serif;line-height:1.25;overflow:hidden;border-radius:8px;position:relative}
.pj-main{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}.pj-haspic .pj-main{flex:1.1}.pj-pic{flex:1;height:84%;display:flex;align-items:center;justify-content:center}.pj-pic img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px;box-shadow:0 3px 12px rgba(0,0,0,.25)}
.pj-st{position:absolute;right:4%;top:6%;font-size:2.6em;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}.pj-haspic .pj-st{right:auto;left:4%;top:auto;bottom:6%}
.pj-h{font-size:1.6em;font-weight:900;margin-bottom:.35em;text-wrap:balance;outline:none}.pj-title .pj-h{font-size:2.4em;text-align:center}.pj-s{font-size:1.1em;text-align:center;outline:none}
.pj-ul{margin:0;padding-left:1.1em;font-size:1.1em}.pj-ul li{margin:.25em 0;outline:none}.pj-ph{opacity:.45;font-weight:400}.pj-addpt{list-style:none;opacity:.6;cursor:pointer;font-size:.8em;margin-left:-1.1em}
[contenteditable=true]:focus{box-shadow:0 0 0 2px rgba(255,255,255,.7),0 0 0 4px var(--e-accent);border-radius:4px}
.pj-tools{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:10px}.pj-tools .e-btn{padding:8px 12px;font-size:15px}
#pjstick{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}.pj-stb{font-size:24px;line-height:1;padding:4px 6px;border:1px solid var(--e-line);border-radius:8px;background:var(--e-card);cursor:pointer}
#pjshow{position:fixed;inset:0;z-index:200;background:#000;display:flex;align-items:center;justify-content:center}#pjshow .pj-stage{width:min(100vw,177.7vh);height:min(56.25vw,100vh)}#pjshow .pj-slide{height:100%;border-radius:0;font-size:min(3.2vw,5.5vh)}
#pjshow .pj-ctl{position:fixed;right:10px;bottom:10px;display:flex;gap:6px;align-items:center;color:#fff;font-weight:700}#pjshow .pj-ctl button{font:inherit;font-size:18px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:8px;padding:4px 12px;cursor:pointer}
'''
s=s[:a]+css+s[b:]
# 2. markup
a=s.index('<section class="e-tabpane" id="tab-project"');b=s.index('</section>',a)+len('</section>')
looks=[("sand","Sand","linear-gradient(160deg,#fff6df,#f1dfb2)"),("sea","Sea","linear-gradient(160deg,#0b3a4a,#2f9aa4)"),("khareef","Khareef","linear-gradient(160deg,#1e4f3c,#9fd3a1)"),("night","Night","radial-gradient(circle at 30% 20%,#2a3350,#0d1018)"),("souq","Souq","repeating-linear-gradient(45deg,#7a2a20 0 10px,#8c3a2c 10px 20px)"),("rose","Rose","linear-gradient(160deg,#ffe4ee,#e2548f)")]
chips="".join('<button type="button" class="pj-look" data-pjlook="%s" style="background:%s">%s</button>'%(k,bg,n) for k,n,bg in looks)
html='''<section class="e-tabpane" id="tab-project" aria-label="My project" hidden>
 <div class="e-card" id="pjstart"><h2 style="margin:0 0 6px">📽️ My project — slides in 3 taps</h2>
  <p class="e-hint" style="margin:0 0 10px"><b>1</b> Say what your project is about · <b>2</b> pick a look · <b>3</b> tap <b>Make my slides</b>. Then tap any words on a slide to change them.</p>
  <label class="e-lab" for="pjtopic">1 · My project is about…</label><input class="e-in pj-big" type="text" id="pjtopic" maxlength="120" placeholder="Example: a robot that cleans plastic from Mughsail beach">
  <p class="e-lab" style="margin:12px 0 0">2 · Pick a look</p><div class="pj-looks">'''+chips+'''</div>
  <button class="e-btn e-primary e-big" type="button" id="pjgo" data-act="pjgo">✨ 3 · Make my slides</button>
  <div class="e-row" style="margin-top:14px;gap:6px;flex-wrap:wrap;align-items:center"><span class="e-hint">Or open a project:</span><input class="e-in" type="text" id="pjcodein" placeholder="Project code" style="max-width:130px"><button class="e-btn" type="button" data-act="pjopen">Open</button></div>
  <div id="pjclass" style="margin-top:8px"></div></div>
 <div id="pjmaker" hidden>
  <div class="e-card"><div class="pj-strip" id="pjstrip"></div>
   <div class="pj-stagewrap"><div id="pjstage"></div></div>
   <div class="pj-tools"><span class="e-hint" id="pjpos"></span><button class="e-btn" type="button" data-act="pjleft" title="Move left">◀</button><button class="e-btn" type="button" data-act="pjright" title="Move right">▶</button><button class="e-btn" type="button" data-act="pjsticker">😀 Sticker</button><button class="e-btn" type="button" data-act="pjpic">📷 Picture</button><button class="e-btn" type="button" data-act="pjnopic">No picture</button><button class="e-btn" type="button" data-act="pjdel">🗑 Delete slide</button><span style="flex:1"></span><button class="e-btn e-teal" type="button" data-act="pjfix">✔ Check my English</button></div>
   <div id="pjstick" hidden></div><input type="file" id="pjimg" accept="image/*" hidden>
   <p class="e-hint" id="pjnote" style="margin:8px 0 0;min-height:1.2em"></p></div>
  <div class="e-card" style="margin-top:12px"><div class="e-row" style="gap:6px;flex-wrap:wrap;align-items:center"><button class="e-btn e-primary e-big" type="button" data-act="pjpresent">▶ Present</button><button class="e-btn e-teal" type="button" data-act="pjsave">☁️ Save to the class</button><span class="e-hint" id="pjcode"></span><span style="flex:1"></span><span class="e-hint">Look:</span>'''+chips.replace('class="pj-look"','class="pj-look" style="width:64px;height:36px;font-size:11px;"').replace('style="width:64px;height:36px;font-size:11px;" style="','style="width:64px;height:36px;font-size:11px;')+'''<button class="e-btn" type="button" data-act="pjnew">New project</button></div></div>
 </div>
</section>'''
s=s[:a]+html+s[b:]
# 3. script
a=s.index("/* ---------- 3 · My project: a simple slides builder");b=s.index("/* ---------- Exam paper mode")
js=pathlib.Path("/home/claude/caravan/project/project_client.js").read_text()
s=s[:a]+js+"\n"+s[b:]
p.write_text(s);print("ok",len(s))
