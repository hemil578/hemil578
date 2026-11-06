#!/usr/bin/env python3
"""Generates index.html for "Every screen says yes" (see shot-plan.json, BEAT-SHEET.md).
HyperFrames contract: one paused GSAP timeline on window.__timelines, timed media as class="clip"."""
import os

DUR = 24.63
def B(k): return round(0.075 + 0.6 * k, 3)

V = []      # video clip tags, placed inside their section containers
vid_n = [0]
def vid(clip, start, dur, cls="vfill", track=1):
    vid_n[0] += 1
    return (f'<img id="v{vid_n[0]}" class="vclip {cls}" data-clip="{clip}" data-n="{len(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets/frames", clip)))}" '
            f'data-start="{start}" data-duration="{dur}" alt="">')

def beats_clips(clips, t0, cls="vfill", track=1):
    out, t = [], t0
    for i, c in enumerate(clips):
        start = 0 if t == 0.075 and i == 0 else t
        start = t0 if i == 0 else t
        out.append(vid(c, start, round(0.6 if i < len(clips) - 1 else 0.6, 3), cls, track))
        t = round(t + 0.6, 3)
    return "\n".join(out)

SFX = []
def sfx(name, t, vol, dur=None, track=3):
    d = {"boom": 1.4, "pop": 0.18, "riser": 1.2, "sparkle": 0.9, "tap": 0.04, "thud": 0.35, "whoosh": 0.7}[name]
    SFX.append(f'<audio id="a{len(SFX)}" class="clip" src="assets/sfx/{name}.wav" data-start="{t}" '
               f'data-duration="{dur or d}" data-volume="{vol}" data-track-index="{track + len(SFX) % 6}"></audio>')

# ---------- S1 dialog 0 - 2.475 ----------
s1 = f'''
<section id="s1" class="sec">
  <div class="desk"></div>
  <div id="dlg">
    <div class="tbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>&#9888; System Warning</span></div>
    <div class="dbody">
      <div class="prev">
        <img src="assets/posters/c04.jpg" class="vfill" alt="">
        {vid("c01", 0, 0.675)}
        {vid("c02", 0.675, 0.6)}
        {vid("c03", 1.275, 0.6)}
        {vid("c04", 1.875, 0.6)}
      </div>
      <div class="dl1"><span id="dl1">YOU DON'T NEED THIS.</span><b id="strike"></b></div>
      <div class="dl2 h" id="dl2">&hellip;YOU <em>WANT</em> IT.</div>
      <div class="btns"><div class="bt gray">Cancel</div><div class="bt teal" id="buy">BUY ANYWAY</div></div>
    </div>
  </div>
</section>'''
sfx("pop", 0.075, 0.6); sfx("thud", 0.675, 0.7); sfx("tap", 2.3, 0.9)

# ---------- S2 grid 2.475 - 4.275 ----------
posters2 = ["c16", "c17", "c18", "c19", "c20", "c21", "c22", "c23"]
tiles = []
pi = 0
for r in range(3):
    for c in range(3):
        x, y = 66 + c * 324, 560 + r * 400
        if r == 0 and c == 1:
            inner = "\n".join([vid("c05", 2.475, 0.6), vid("c11", 3.075, 0.6), vid("c12", 3.675, 0.6)])
            tiles.append(f'<div class="tile h r{r} live" style="left:{x}px;top:{y}px">{inner}<span class="hot">HOT</span></div>')
        else:
            tiles.append(f'<div class="tile h r{r}" style="left:{x}px;top:{y}px"><img src="assets/posters/{posters2[pi]}.jpg"></div>')
            pi += 1
s2 = f'''
<section id="s2" class="sec">
  <div id="iris"></div>
  <div class="s2logo"><img src="assets/logo.png"></div>
  <div class="s2h" id="s2h">HAS THEM <em>ALL</em></div>
  {"".join(tiles)}
</section>'''
sfx("whoosh", 2.475, 0.4); sfx("tap", 3.075, 0.7); sfx("tap", 3.675, 0.7)

# ---------- S3 scanner + receipt 4.275 - 9.075 ----------
items = [("Butter Squishy", "$19.99", 4.275), ("Flower Pot", "$49.99", 5.475),
         ("Dog Raincoat", "$26.99", 6.675), ("Prism Glasses", "$24.99", 7.275)]
rows = "".join(f'<div class="row h" id="row{i}" style="top:{150 + i * 104}px"><span>{n}</span><b>{p}</b></div>'
               for i, (n, p, t) in enumerate(items))
s3clips = ["c06", "c06b", "c07b", "c07", "c08b", "c09b", "c09", "c08"]
s3 = f'''
<section id="s3" class="sec">
  <div id="scanner"><div class="scr">{beats_clips(s3clips, 4.275)}<div id="laser"></div></div><div class="scan-lbl">SCAN &bull; SCAN &bull; SCAN</div></div>
  <div id="slot"></div>
  <div id="paper"><div class="ph"><img src="assets/logo.png"><div class="dash"></div></div>{rows}</div>
</section>'''
for n, p, t in items: sfx("tap", t, 0.8)
sfx("pop", 4.275, 0.4)

# ---------- S4 chat 9.075 - 11.475 ----------
s4 = f'''
<section id="s4" class="sec">
  <div class="chead"><div class="av">B</div><div><b>the group chat</b><span>3 people</span></div></div>
  <div id="vbub">{beats_clips(["c10", "c13", "c14", "c15"], 9.075)}</div>
  <div class="tb h" id="tb0" style="top:1150px">WAIT&mdash;</div>
  <div class="tb h" id="tb1" style="top:1320px">WHAT&mdash;</div>
  <div class="tb h" id="tb2" style="top:1490px">LOL</div>
  <div class="typing h" id="typing"><i></i><i></i><i></i></div>
  <div class="react h" id="react">HA HA</div>
</section>'''
sfx("pop", 9.075, 0.7); sfx("pop", 9.675, 0.7); sfx("pop", 10.275, 0.7); sfx("tap", 10.875, 0.6)

# ---------- S5 mosaic 11.475 - 12.675 ----------
m4 = []
po4 = ["c24", "c25", "c26"]
for i in range(4):
    x, y = (i % 2) * 543, (i // 2) * 963
    inner = '<img src="assets/posters/c16.jpg">' + vid("c16", 11.475, 0.6) if i == 0 else f'<img src="assets/posters/{po4[i - 1]}.jpg">'
    m4.append(f'<div class="mt m4 h" style="left:{x}px;top:{y}px;width:537px;height:957px">{inner}</div>')
m9 = []
po9 = ["c27", "c28", "c29", "c30", "c01", "c02", "c03", "c04"]
k = 0
for i in range(9):
    x, y = (i % 3) * 362, (i // 3) * 642
    if i == 4:
        inner = '<img src="assets/posters/c17.jpg">' + vid("c17", 12.075, 0.6)
    else:
        inner = f'<img src="assets/posters/{po9[k]}.jpg">'; k += 1
    m9.append(f'<div class="mt m9 h" style="left:{x}px;top:{y}px;width:356px;height:636px">{inner}</div>')
s5 = f'''
<section id="s5" class="sec">{"".join(m4)}{"".join(m9)}</section>'''
sfx("tap", 11.475, 0.8); sfx("tap", 12.075, 0.8)

# ---------- S6 timer 12.675 - 14.475 ----------
s6 = f'''
<section id="s6" class="sec">
  <div id="tcirc">{beats_clips(["c18", "c19", "c20"], 12.675)}</div>
  <svg id="ring" width="1080" height="1920" viewBox="0 0 1080 1920">
    <circle cx="540" cy="880" r="430" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="36"/>
    <circle id="rarc" cx="540" cy="880" r="430" fill="none" stroke="#00c9a7" stroke-width="36" stroke-linecap="round"
      stroke-dasharray="2701.77" stroke-dashoffset="0" transform="rotate(-90 540 880)"/>
  </svg>
  <div class="num h" id="n3">3</div><div class="num h" id="n2">2</div><div class="num h" id="n1">1</div>
</section>'''
for t in (12.675, 13.275, 13.875): sfx("tap", t, 1.0)
sfx("riser", 13.275, 0.25)

# ---------- S7 shipping label 14.475 - 16.875 ----------
bars, x = [], 0
pat = [3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 4, 2, 1, 2, 3, 1, 1, 2, 2, 1, 3, 2, 1, 1, 2, 4, 1, 2, 1, 3, 1, 2, 2, 1]
i = 0
while x < 780:
    w = pat[i % len(pat)] * 6
    if i % 2 == 0: bars.append(f'<i style="left:{x}px;width:{w}px"></i>')
    x += w; i += 1
s7 = f'''
<section id="s7" class="sec">
  <div id="label">
    <div class="lrow"><div><small>FROM</small><img src="assets/logo.png" class="llogo"></div><div class="lr"><small>SHIP TO</small><b>YOU</b></div></div>
    <div class="lrule"></div>
    <div class="lmid"><div class="lphoto">{beats_clips(["c21", "c22", "c23", "c24"], 14.475)}</div>
      <div class="lmeta"><small>PKG</small><b>1 / 1</b><small>CONTENTS</small><b>A THING<br>YOU WANT</b></div></div>
    <div class="lrule"></div>
    <div id="barcode">{"".join(bars)}<div id="scanline"></div></div>
    <div class="ltrk">BUYRSHOP.COM</div>
  </div>
  <div class="stamp h" id="st1">FREE US SHIPPING</div>
  <div class="stamp st2 h" id="st2">ON EVERY ORDER</div>
</section>'''
sfx("boom", 14.475, 0.8, track=9); sfx("thud", 14.475, 0.9); sfx("thud", 15.075, 0.9); sfx("tap", 15.675, 0.6); sfx("tap", 16.275, 0.6)

# ---------- S8 price tag 16.875 - 18.075 ----------
s8 = f'''
<section id="s8" class="sec">
  <div id="pcirc">{beats_clips(["c25", "c26"], 16.875)}</div>
  <div id="swing"><div class="string"></div><div class="ptag"><div class="hole"></div><small>FROM</small><b>$9.99</b></div></div>
  <div class="pin"></div>
</section>'''
sfx("sparkle", 16.875, 0.6); sfx("whoosh", 16.875, 0.3)

# ---------- S9 tracking map 18.075 - 19.875 ----------
steps = ["Ordered", "Shipped", "Tracking live"]
srows = "".join(f'<div class="step" style="top:{30 + i * 66}px"><i class="ck h" id="ck{i}"></i><span>{s}</span></div>' for i, s in enumerate(steps))
s9 = f'''
<section id="s9" class="sec">
  <div id="mapw">
    <div class="blk" style="left:90px;top:620px;width:260px;height:180px"></div>
    <div class="blk" style="left:420px;top:560px;width:200px;height:260px"></div>
    <div class="blk" style="left:690px;top:760px;width:300px;height:170px"></div>
    <div class="blk" style="left:150px;top:900px;width:330px;height:150px"></div>
    <div class="blk" style="left:560px;top:1000px;width:240px;height:200px"></div>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0">
      <path d="M -40 1130 C 200 1080 300 1240 520 1150 S 900 980 1120 1040" stroke="#16325c" stroke-width="70" fill="none"/>
      <path id="route" d="M 190 1210 C 300 1000 420 1060 520 900 S 700 640 870 600" stroke="#00c9a7" stroke-width="18"
        stroke-linecap="round" fill="none" stroke-dasharray="1100" stroke-dashoffset="1100"/>
    </svg>
    <div class="wh" style="left:140px;top:1160px"></div>
    <div class="hpin h" id="hpin" style="left:830px;top:500px"></div>
  </div>
  <div class="mtitle" id="mtitle"><span><em>TRACKED</em> DELIVERY</span></div>
  <div id="tcard"><div class="tthumb">{beats_clips(["c27", "c28", "c29"], 18.075)}</div><div class="steps">{srows}</div></div>
</section>'''
sfx("whoosh", 18.075, 0.4); sfx("tap", 18.675, 0.7); sfx("pop", 18.675, 0.5); sfx("tap", 19.275, 0.7)

# ---------- S10 browser 19.875 - 24.63 ----------
url = "buyrshop.com"
chars = "".join(f'<span class="ch h" id="ch{i}">{c}</span>' for i, c in enumerate(url))
s10 = f'''
<section id="s10" class="sec">
  <div id="bwin">
    <div class="bbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>
      <div class="url">{chars}<b id="caret"></b></div></div>
    <div class="page">
      <img src="assets/logo.png" class="plogo h" id="plogo">
      <div class="pline h" id="pline">YOU <em>WANT</em> IT.</div>
      <div class="pstrip h" id="pstrip"><div><img src="assets/posters/c06.jpg"></div><div>{vid("c30", 21.675, 0.6)}<img src="assets/posters/c30.jpg" class="under"></div><div><img src="assets/posters/c09.jpg"></div></div>
      <div class="pbtn h" id="pbtn"><span>SHOP NOW</span></div>
      <div class="psmall h" id="psmall">Free US shipping &middot; From $9.99</div>
    </div>
  </div>
</section>'''
for i in range(len(url)): sfx("tap", round(19.975 + i * 0.07, 3), 0.35)
sfx("pop", 20.475, 0.5); sfx("thud", 21.075, 0.6); sfx("pop", 22.275, 0.5); sfx("tap", 23.075, 1.0); sfx("sparkle", 23.075, 0.5)

CSS = open(os.path.join(os.path.dirname(__file__), "style.css")).read()
JS = open(os.path.join(os.path.dirname(__file__), "timeline.js")).read()

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>{CSS}</style>
</head>
<body>
<!-- "Every screen says yes". Generated by build.py. Cuts on the beat grid 0.075 + 0.6k s, drop 14.475. -->
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-fps="30" data-width="1080" data-height="1920">
{s1}{s2}{s3}{s4}{s5}{s6}{s7}{s8}{s9}{s10}
<svg id="cursor" class="h" width="90" height="120" viewBox="0 0 30 40"><path d="M2 2 L2 32 L10 25 L15 37 L20 35 L15 23 L26 23 Z" fill="#fff" stroke="#0f172a" stroke-width="2.4" stroke-linejoin="round"/></svg>
<div id="ripple" class="h"></div>
<div id="flash"></div>
<audio id="music" class="clip" src="assets/track.mp3" data-start="0" data-duration="{DUR}" data-volume="1" data-fade-out="0.6" data-track-index="2"></audio>
{chr(10).join(SFX)}
</div>
<script>{JS}</script>
</body>
</html>
'''
open(os.path.join(os.path.dirname(__file__), "index.html"), "w").write(html)
print("ok", vid_n[0], "videos", len(SFX), "sfx")
