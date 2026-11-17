# Fixed templates + Fill it / Fix it / Remember it tasks — Task 1 (incident email) and Task 2 (C&C essay)
import subprocess, os, re
from pypdf import PdfReader
OUT = "/mnt/user-data/outputs/Fixed-Templates-Pack"; os.makedirs(OUT, exist_ok=True)
W = "/home/claude/tmpl/work"; os.makedirs(W, exist_ok=True)
FONT = '"Liberation Sans",Arial,sans-serif'
CSS = f'''body{{font-family:{FONT};font-size:11.5pt;line-height:1.38;color:#111;margin:0}}
h1{{font-size:14pt;margin:0 0 2px;letter-spacing:.3px}} .sub{{font-size:10pt;color:#444;margin:0 0 8px}}
h2{{font-size:12pt;margin:12px 0 5px;padding:3px 8px;background:#1f2937;color:#fff;border-radius:3px}}
.box{{border:1.3px solid #1f2937;border-radius:4px;padding:8px 11px;margin:6px 0}}
.rule{{background:#fff7d6;border:1px solid #e0c060;border-radius:4px;padding:6px 10px;margin:6px 0;font-size:11pt}}
.g{{display:inline-block;border-bottom:1.2px solid #111;min-width:70px;height:13px;vertical-align:baseline}}
.gw{{min-width:150px}} .gl{{min-width:260px}}
.n{{display:inline-block;width:20px;height:20px;border-radius:50%;background:#1f2937;color:#fff;text-align:center;line-height:20px;font-size:10pt;font-weight:bold;margin-right:5px}}
.tag{{font-weight:bold;color:#1f2937;font-size:10pt;text-transform:uppercase;letter-spacing:.4px}}
.line{{margin:0 0 7px}} .opt{{color:#555}} p{{margin:0 0 5px}}
table{{border-collapse:collapse;width:100%}} td,th{{border:1px solid #999;padding:4px 7px;vertical-align:top;font-size:11pt}} th{{background:#eef0f3;text-align:left}}
.wl{{border-bottom:1px solid #777;height:22px}} .pb{{page-break-before:always}}
.model{{background:#f4f6f8;border-left:4px solid #1f2937;padding:7px 10px;margin:6px 0;font-size:11pt}}
.err{{font-weight:bold;text-decoration:underline}} .keep{{page-break-inside:avoid}}
.name{{font-size:10.5pt;margin:0 0 6px}} .small{{font-size:10pt;color:#444}}'''

def render(html, pdf, title):
    hp = f"{W}/{os.path.basename(pdf)[:-4]}.html"
    open(hp, "w").write(f'<!DOCTYPE html><html><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{html}</body></html>')
    subprocess.run(["wkhtmltopdf", "--page-size", "A4", "--margin-top", "12mm", "--margin-bottom", "12mm", "--margin-left", "15mm", "--margin-right", "15mm",
                    "--footer-center", "[page]", "--footer-font-size", "8", "--encoding", "utf-8", hp, pdf], capture_output=True)
    return len(PdfReader(pdf).pages)

g = lambda w="": f'<span class="g {w}"></span>'
NAME = '<p class="name">Name: ________________________________ &nbsp;&nbsp; Group: 9 &nbsp;&nbsp; Date: ___________</p>'

# ------------------------------------------------------------------ FIXED TEMPLATE 1
T1_STEPS = [
 ("WHO YOU ARE", f'My name is {g("gw")} and I am [a student at the college, ID {g()}] / [the {g()} of {g()}] / [a {g()} at {g()}] in {g()}.'),
 ("WHY YOU ARE WRITING", f'I am writing to report an incident that happened [on {g()}] / [last {g()}] [at / in {g()}].'),
 ("THE OTHER PERSON · OR · WHEN AND WHERE", f'The person involved is {g()}, who started working as a {g()} [on {g()}] / [{g()} ago]. &nbsp;<span class="opt">— or —</span>&nbsp; The incident happened on {g()} at {g()} o’clock in {g()}.'),
 ("WHAT YOU WERE DOING", f'At that time, I was {g()}ing {g("gw")}.'),
 ("WHAT HAPPENED + HOW HE / SHE REACTED", f'Suddenly, {g("gw")}. Then, {g("gw")}. When I asked him to {g()}, he [refused] / [laughed at me] / [shouted at me] / [walked away].'),
 ("WHAT YOU (OR OTHERS) DID", f'I immediately [told] / [called] / [informed] {g()}, and [we] / [he] / [she] {g("gw")}.'),
 ("WHAT YOU WANT", f'I would like you to [speak to him] / [give him a warning] / [move him to another job] / [repair {g()}] / [{g()}] so that this does not happen again.'),
]
T1_RULES = ('<b>The rule:</b> bullet 1 = sentence ①, bullet 2 = sentence ② … bullet 7 = sentence ⑦. Same order as the question. '
            '① ② are in the <b>present</b>. ④ uses <b>was / were + -ing</b>. ③ ⑤ ⑥ use the <b>past simple</b> (started, dropped, refused, called). '
            '⑦ = <b>would like you to + verb</b>. The template gives you about 85 words; your words add 70 → 150+.')

def template1():
    H = [f'<h1>FIXED TEMPLATE 1 — THE INCIDENT REPORT EMAIL</h1><p class="sub">GE2 · Writing Task 1 · 150 words · 7 bullets = 7 sentences · learn it by heart</p>', NAME]
    H.append('<div class="box"><p class="line">Dear ' + g("gw") + ',</p>')
    for i, (tag, s) in enumerate(T1_STEPS, 1):
        H.append(f'<p class="line"><span class="n">{i}</span><span class="tag">{tag}</span><br>{s}</p>')
    H.append('<p class="line">I hope you will take action soon. &nbsp;<span class="opt">/</span>&nbsp; I look forward to hearing from you.</p><p class="line">Yours sincerely,<br>' + g("gw") + ' <span class="opt">(your full name)</span></p></div>')
    H.append(f'<div class="rule">{T1_RULES}</div>')
    H.append('<h2>THE TEMPLATE FILLED IN — Prompt 1 from your drills (the garage in Sohar) · 168 words</h2>')
    H.append('''<div class="model">Dear Father,<br>
① My name is Khalid Al-Rawahi and I am the assistant manager of our car-repair garage in Sohar.
② I am writing to report an incident that happened last Monday at the garage.
③ The person involved is Said, who started working as a mechanic two weeks ago.
④ At that time, I was checking the invoices in the office.
⑤ Suddenly, a customer came back to the garage very angry. His car had lost a wheel after two kilometres because Said forgot to tighten the wheels. Then, the customer shouted at everyone in the garage. When I asked Said to explain, he said it was not his job.
⑥ I immediately apologised to the customer, and we repaired the car for free.
⑦ I would like you to give Said a warning and check his work every day so that this does not happen again.<br>
I hope you will take action soon.<br>Yours sincerely,<br>Khalid Al-Rawahi</div>''')
    H.append('<p class="small">Notice: the numbers are only for learning — do <b>not</b> write ① ② in the exam. Write it as one email with 3 paragraphs: ①②③ · ④⑤⑥ · ⑦ + closing.</p>')
    return "".join(H)

# ------------------------------------------------------------------ FIXED TEMPLATE 2
T2_PARAS = [
 ("INTRODUCTION · copy A and B from the question", f'Some people think that <b>A</b> is a good idea, while others think that <b>B</b> is better. Both of them have advantages and disadvantages. This essay will compare and contrast <b>A</b> and <b>B</b>, and then say which one I prefer.'),
 ("SIMILARITIES · 2 ideas, each with an example", f'There are some similarities between <b>A</b> and <b>B</b>. Firstly, both <b>A</b> and <b>B</b> {g("gw")}. For example, {g("gl")}. Secondly, both of them {g("gw")}. For instance, {g("gl")}.'),
 ("DIFFERENCES · 3 ideas with than / while", f'However, there are also important differences. Firstly, <b>A</b> is {g()}er / more {g()} than <b>B</b> because {g("gw")}. For example, {g("gl")}. Secondly, <b>A</b> {g("gw")}, while <b>B</b> {g("gw")}. Finally, <b>B</b> is much more {g()} than <b>A</b>.'),
 ("CONCLUSION · your opinion + one reason", f'In conclusion, <b>A</b> and <b>B</b> are similar in some ways but different in others. I prefer {g()} because {g("gl")}. For me, it is definitely the better choice.'),
]
T2_RULES = ('<b>How to make A and B:</b> take the two ideas from the question and turn the verb into <b>-ing</b>: '
            '“it is a good idea to <i>work in a family business</i>” → A = <b>working in a family business</b>; “work for a company not owned by their family” → B = <b>working for another company</b>. '
            'Write A and B exactly the same every time they appear. The template gives you about 105 words; your words add 95 → 200+. '
            'Your opinion comes <b>only</b> in the conclusion. Never: <i>more better · more cheaper · a comparison without than</i>.')

def template2():
    H = [f'<h1>FIXED TEMPLATE 2 — THE COMPARE &amp; CONTRAST ESSAY</h1><p class="sub">GE2 · Writing Task 2 · 200 words · 4 paragraphs · learn it by heart</p>', NAME]
    H.append('<div class="box">')
    for i, (tag, s) in enumerate(T2_PARAS, 1):
        H.append(f'<p class="line"><span class="n">{i}</span><span class="tag">{tag}</span><br>{s}</p>')
    H.append('</div>')
    H.append(f'<div class="rule">{T2_RULES}</div>')
    H.append('<h2>THE TEMPLATE FILLED IN — working from home vs working in an office (drill 1) · 221 words</h2>')
    H.append('''<div class="model">Some people think that working from home is a good idea, while others think that working in an office is better. Both of them have advantages and disadvantages. This essay will compare and contrast working from home and working in an office, and then say which one I prefer.<br><br>
There are some similarities between working from home and working in an office. Firstly, both working from home and working in an office need a computer and a good internet connection. For example, most employees use email and online meetings every day. Secondly, both of them give people a salary at the end of the month. For instance, my cousin works from home and earns the same money as his colleagues.<br><br>
However, there are also important differences. Firstly, working from home is cheaper than working in an office because people do not pay for petrol or lunch. For example, my brother saves 50 rials a month. Secondly, working from home is quiet and flexible, while working in an office is noisy and has fixed hours. Finally, working in an office is much more social than working from home.<br><br>
In conclusion, working from home and working in an office are similar in some ways but different in others. I prefer working in an office because I like to meet people and learn from them. For me, it is definitely the better choice.</div>''')
    return "".join(H)

# ------------------------------------------------------------------ TASK SHEET: FILL IT
FILL1_PROMPT = '''<div class="box"><p><b>Task 1.</b> Your family owns a mobile phone shop in Salalah, and you work there as a cashier in the evenings. Last Monday, a new employee called Majid, who started two weeks ago, sold a customer a used phone and told him it was new. The next day the customer came back to the shop very angry and shouted at everybody. When you asked Majid to explain, he said it was not his problem.</p>
<p>Write an email to your father, the owner of the shop, to report this incident. In your report you should give your father the following information:</p>
<p>• your full name and your job at the shop &nbsp;&nbsp; • why you are writing this report &nbsp;&nbsp; • the name of the employee and when he started working<br>
• what you were doing when the customer came back &nbsp;&nbsp; • what the customer did and how Majid reacted &nbsp;&nbsp; • what you did to calm the customer<br>
• what you would like your father to do</p><p>Write at least 150 words. Begin: <b>Dear Father,</b></p></div>'''

FILL2_PROMPT = '''<div class="box"><p><b>Task 2.</b> Write an essay about the following topic.</p>
<p>Some people think it is better to study in a group, while others think it is better to study alone.</p>
<p>Compare and contrast these two ways of studying and say which one you prefer. You should write at least 200 words.</p></div>'''

def fill_sheet():
    H = [f'<h1>TEMPLATE TASKS — FILL IT · FIX IT · REMEMBER IT</h1><p class="sub">GE2 · Writing Tasks 1 and 2 · use your fixed templates · 3 pages</p>', NAME]
    H.append('<h2>PART A · FILL IT — Task 1 · write one sentence for each bullet, in order (25 minutes)</h2>')
    H.append(FILL1_PROMPT)
    H.append('<table><tr><th style="width:5%">#</th><th style="width:30%">The bullet asks for</th><th>Your sentence — start with the template words</th></tr>')
    starts = ["My name is … and I am …", "I am writing to report an incident that happened …", "The person involved is …, who started working as … ago.",
              "At that time, I was …ing …", "Suddenly, … Then, … When I asked him to …, he …", "I immediately …, and …", "I would like you to … so that this does not happen again."]
    bullets = ["name + job", "why", "the employee + when he started", "what you were doing", "what the customer did + how Majid reacted", "what you did", "what you want"]
    for i, (b, s) in enumerate(zip(bullets, starts), 1):
        H.append(f'<tr><td><b>{i}</b></td><td>{b}<br><span class="small">{s}</span></td><td><div class="wl"></div><div class="wl"></div></td></tr>')
    H.append('</table><p class="small">Then copy it as one email in your notebook: Dear Father, + ①②③ · ④⑤⑥ · ⑦ + I hope you will take action soon. + Yours sincerely, + name. Count the words: 150+.</p>')
    # PART B
    H.append('<div class="pb"></div><h2>PART B · FILL IT — Task 2 · fill the template, then write it in your notebook (30 minutes)</h2>')
    H.append(FILL2_PROMPT)
    H.append('<p><b>Step 1 — make A and B from the question:</b> &nbsp; A = study<b>ing</b> in a group &nbsp;&nbsp;&nbsp; B = study<b>ing</b> alone</p>')
    H.append('<p><b>Step 2 — choose your ideas</b> (tick two similarities and three differences):</p>')
    H.append('''<table><tr><th style="width:50%">Similarities — both A and B …</th><th>Differences</th></tr>
<tr><td>☐ need a quiet place &nbsp; ☐ help students pass exams &nbsp; ☐ need a plan and a timetable &nbsp; ☐ can be done at home or in the library</td>
<td>☐ a group gives more ideas, while alone you have only your ideas &nbsp; ☐ alone is quieter than a group &nbsp; ☐ a group is more fun / more social &nbsp; ☐ alone you work at your own speed &nbsp; ☐ a group wastes more time (talking, phones)</td></tr></table>''')
    H.append('<p><b>Step 3 — fill the template:</b></p><div class="box" style="line-height:1.9">')
    H.append(f'Some people think that <b>studying in a group</b> is a good idea, while others think that <b>studying alone</b> is better. Both of them have advantages and disadvantages. This essay will compare and contrast studying in a group and studying alone, and then say which one I prefer.<br>'
             f'There are some similarities between studying in a group and studying alone. Firstly, both of them {g("gl")}. For example, {g("gl")} {g("gw")}. Secondly, both of them {g("gl")}. For instance, {g("gl")} {g("gw")}.<br>'
             f'However, there are also important differences. Firstly, studying in a group is {g()}er / more {g()} than studying alone because {g("gl")}. For example, {g("gl")} {g("gw")}. Secondly, studying in a group {g("gl")}, while studying alone {g("gl")}. Finally, studying alone is much more {g()} than studying in a group.<br>'
             f'In conclusion, studying in a group and studying alone are similar in some ways but different in others. I prefer {g("gw")} because {g("gl")} {g("gw")}. For me, it is definitely the better choice.</div>')
    H.append('<p class="small">Check: 4 paragraphs · 200+ words · A and B written the same every time · than / while in paragraph 3 · opinion only in paragraph 4 · no linking word twice.</p>')
    # PART C FIX IT
    H.append('<div class="pb"></div><h2>PART C · FIX IT — a student used the templates but made 12 mistakes in Task 1 and 10 in Task 2 (20 minutes)</h2>')
    H.append('<p>Find the mistakes, cross them out and write the correct word above. All the mistakes are in the <b>template words</b> you must know by heart.</p>')
    H.append('''<div class="model"><b>Task 1 — 12 mistakes.</b> (The café in Salalah: a new waiter, Hamad, dropped a tray of hot drinks on a customer and walked away.)<br>
Dear uncle,<br>
My name Salim Al-Amri and I am a waiter at your café in Salalah. I writing to report an incident that happened in last Saturday at the café. The person involved is Hamad, who start working as a waiter two weeks ago. At that time, I was serve a customer near the door. Suddenly, Hamad drop a tray of hot drinks on a customer. Then, the customer stood up and shouted. He not apologise. When I asked him to help the customer, he walk away. I immediately call the manager, and we gave the customer a free lunch. I would like you to speaking to Hamad so that this does not happens again.<br>
I hope you will take action soon.<br>Yours sincerely,<br>Salim Al-Amri</div>''')
    H.append('''<div class="model"><b>Task 2 — 10 mistakes.</b> (Having a part-time job while studying vs only studying.)<br>
Some people thinks that having a part-time job is a good idea, while others think that only studying is more better. Both of them has advantages and disadvantages. This essay will compare and contrast having a part-time job and only studying, and then say which one I am prefer.<br>
There are some similarities between having a part-time job and only studying. Firstly both of them need good time management. For example, students must plan their week. Secondly, both of them help students to learn new skills. For instance students learn to work with other people.<br>
However, there are also important differences. Firstly, having a part-time job is more tiring that only studying because students work in the evening. For example, my cousin works in a shop until 10 o’clock. Secondly, having a part-time job gives students money, while only studying give them more free time. Finally, only studying is much more relax than having a part-time job.<br>
In conclude, having a part-time job and only studying are similar in some ways but different in others. I prefer only studying because that I want to get high marks. For me, it is definitely the best choice.</div>''')
    H.append('<h2>PART D · REMEMBER IT — homework</h2><p>Write both templates from memory in your notebook, then check them against your template sheets. Tick each time you write one with no mistakes: Template 1 ☐ ☐ ☐ &nbsp;&nbsp; Template 2 ☐ ☐ ☐. Three ticks each = ready for the exam.</p>')
    return "".join(H)

# ------------------------------------------------------------------ MEMORY TEST (cloze)
def memory_sheet():
    H = [f'<h1>MEMORY TEST — THE FIXED TEMPLATES</h1><p class="sub">GE2 · Writing · 15 minutes · no notes · fill the template words from memory</p>', NAME]
    H.append('<h2>TEMPLATE 1 — the incident email (20 words missing)</h2><div class="box" style="line-height:1.9">')
    H.append(f'Dear {g()},<br>'
             f'① My {g()} is … and I {g()} a student at the college. ② I am {g()} to {g()} an incident that {g()} on … at … '
             f'③ The person {g()} is …, who {g()} working as a … two weeks {g()}. ④ At that {g()}, I was …ing … '
             f'⑤ {g()}, … Then, … When I {g()} him to …, he {g()}. ⑥ I {g()} told …, and we … '
             f'⑦ I would {g()} you to … so {g()} this does not {g()} again.<br>'
             f'I {g()} you will take {g()} soon.<br>Yours {g()},</div>')
    H.append('<h2>TEMPLATE 2 — the essay (20 words missing)</h2><div class="box" style="line-height:1.9">')
    H.append(f'Some people {g()} that A is a good {g()}, while {g()} think that B is better. Both of them have {g()} and disadvantages. This essay will {g()} and {g()} A and B, and then say which one I {g()}.<br>'
             f'There are some {g()} between A and B. {g()}, both A and B … For {g()}, … Secondly, both of {g()} … For {g()}, …<br>'
             f'{g()}, there are also important {g()}. Firstly, A is …er {g()} B because … Secondly, A …, {g()} B … Finally, B is much {g()} … than A.<br>'
             f'In {g()}, A and B are similar in some ways but {g()} in others. I prefer … {g()} … For me, it is definitely the better choice.</div>')
    H.append('<h2>WORD BOX — only if you need it (the words are mixed)</h2>')
    words = ["conclusion","than","example","compare","action","happen","differences","contrast","instance","similarities","However","name","Firstly","prefer","called/informed","involved","because","like","sincerely","idea","time","hope","am","while","writing","others","them","report","started","refused","that","immediately","different","ago","Suddenly","happened","asked","more","advantages","Father/Sir"]
    import random; random.Random(7).shuffle(words)
    H.append('<div class="box" style="text-align:center;word-spacing:10px;line-height:1.8">' + " · ".join(words) + '</div>')
    return "".join(H)

# ------------------------------------------------------------------ ANSWER KEY (teacher)
def key_sheet():
    H = ['<h1>TEACHER KEY — Fill it · Fix it · Memory test</h1><p class="sub">GE2 · Writing · fixed templates pack</p>']
    H.append('<h2>Part C · Fix it — Task 1 (12)</h2><table><tr><th style="width:5%">#</th><th style="width:40%">Mistake</th><th>Correct</th></tr>')
    k1 = [("Dear uncle","Dear Uncle (capital letter)"),("My name Salim","My name <b>is</b> Salim"),("I writing","I <b>am</b> writing"),("happened in last Saturday","happened <b>last Saturday</b> (no “in”) / <b>on</b> Saturday"),
          ("who start working","who <b>started</b> working"),("I was serve","I was <b>serving</b>"),("Hamad drop a tray","Hamad <b>dropped</b> a tray"),("He not apologise","He <b>did not</b> apologise"),
          ("he walk away","he <b>walked</b> away"),("I immediately call","I immediately <b>called</b>"),("you to speaking","you to <b>speak</b>"),("does not happens","does not <b>happen</b>")]
    for i, (a, b) in enumerate(k1, 1): H.append(f'<tr><td>{i}</td><td>{a}</td><td>{b}</td></tr>')
    H.append('</table><h2>Part C · Fix it — Task 2 (10)</h2><table><tr><th style="width:5%">#</th><th style="width:40%">Mistake</th><th>Correct</th></tr>')
    k2 = [("Some people thinks","Some people <b>think</b>"),("more better","<b>better</b>"),("Both of them has","Both of them <b>have</b>"),("I am prefer","I <b>prefer</b>"),("Firstly both","Firstly<b>,</b> both (comma)"),
          ("For instance students","For instance<b>,</b> students (comma)"),("more tiring that","more tiring <b>than</b>"),("only studying give","only studying <b>gives</b>"),("much more relax","much more <b>relaxing</b>"),("In conclude / because that / the best choice","In <b>conclusion</b> · because (no “that”) · the <b>better</b> choice (two things)")]
    for i, (a, b) in enumerate(k2, 1): H.append(f'<tr><td>{i}</td><td>{a}</td><td>{b}</td></tr>')
    H.append('</table><p class="small">Task 2 has 12 corrections in total; accept any 10.</p>')
    H.append('<h2>Memory test — answers in order</h2><p><b>Template 1:</b> Father/Sir · name · am · writing · report · happened · involved · started · ago · time · Suddenly · asked · refused · immediately · like · that · happen · hope · action · sincerely.</p>')
    H.append('<p><b>Template 2:</b> think · idea · others · advantages · compare · contrast · prefer · similarities · Firstly · example · them · instance · However · differences · than · while · more · conclusion · different · because.</p>')
    H.append('<h2>Part A · Fill it — Task 1 model (164 words)</h2><div class="model">Dear Father,<br>My name is Ahmed Al-Shanfari and I am a cashier at our mobile phone shop in Salalah. I am writing to report an incident that happened last Monday and Tuesday at the shop. The person involved is Majid, who started working as a salesman two weeks ago. At that time, I was counting the money at the cash desk. Suddenly, a customer came back to the shop very angry because Majid had sold him a used phone and said it was new. Then, the customer shouted at everybody in the shop. When I asked Majid to explain, he said it was not his problem. I immediately apologised to the customer, and I gave him a new phone and a discount. I would like you to speak to Majid and give him a warning so that this does not happen again.<br>I hope you will take action soon.<br>Yours sincerely,<br>Ahmed Al-Shanfari</div>')
    H.append('<h2>Part B · Fill it — Task 2 model (212 words)</h2><div class="model">Some people think that studying in a group is a good idea, while others think that studying alone is better. Both of them have advantages and disadvantages. This essay will compare and contrast studying in a group and studying alone, and then say which one I prefer.<br>There are some similarities between studying in a group and studying alone. Firstly, both of them need a quiet place and a plan. For example, students need a timetable for every subject. Secondly, both of them help students to pass their exams. For instance, my sister studies alone and my brother studies with friends, and both passed.<br>However, there are also important differences. Firstly, studying in a group is more useful than studying alone because students share ideas. For example, a friend can explain a difficult grammar rule. Secondly, studying in a group is social and fun, while studying alone is quiet and sometimes boring. Finally, studying alone is much more flexible than studying in a group.<br>In conclusion, studying in a group and studying alone are similar in some ways but different in others. I prefer studying alone because I can work at my own speed without wasting time. For me, it is definitely the better choice.</div>')
    return "".join(H)

if __name__ == "__main__":
    n1 = render(template1() + '<div class="pb"></div>' + template2(), f"{OUT}/Fixed-Templates-Task1-Task2.pdf", "Fixed Templates")
    n2 = render(fill_sheet(), f"{OUT}/Template-Tasks-Fill-Fix-Remember.pdf", "Template Tasks")
    n3 = render(memory_sheet(), f"{OUT}/Template-Memory-Test.pdf", "Memory Test")
    n4 = render(key_sheet(), f"{OUT}/Template-Tasks-TEACHER-KEY.pdf", "Teacher Key")
    print("pages:", n1, n2, n3, n4)
