/*
  A reel is a pure function of time: window.seek(t) paints frame t from window.REEL (the timeline that
  render.mjs builds from reel.json). No CSS transitions or animations, no timers, no Math.random, no state
  carried between frames, so any frame can be drawn in any order by any number of browsers.

  Scene item times (`at`, `until`) are seconds from the scene's start. Positions are fractions of the frame
  (x 0..1 left to right, y 0..1 top to bottom); sizes are px on the 1080x1920 frame unless named `h`/`w`.
  Shorter feed frames (1:1, 4:5) keep the 9:16 layout: x is remapped into the safe width, characters grow and
  text and cards shrink a little, so the same timeline reads at every size.
*/
(() => {
  const R = window.REEL;
  const W = R.w, H = R.h, FPS = R.fps, DURATION = R.duration;
  // the platform's own buttons sit down the right edge: text and cards centre in the space left of them
  const SAFE_R = R.safe?.right ?? 0.14, SAFE_L = R.safe?.left ?? 0.06, MID_X = (SAFE_L + 1 - SAFE_R) / 2;
  const A = Math.min(1, H / 1920), CH = Math.pow(A, -0.05), TS = Math.pow(A, 0.7);   // 9:16: all 1
  const FY = (y) => y - (1 - A) * 0.07 * (1 - y);   // lift the upper layout a little off the characters' heads
  const FX = (x) => (A < 1 ? SAFE_L + (x - 0.06) / 0.8 * (1 - SAFE_L - SAFE_R) : x);   // 9:16 text area (0.06..0.86) → this size's

  // ---------------------------------------------------------------- maths
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const pr = (t, a, d) => cl((t - a) / (d || 1e-9));
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (u) => ((ax * u + bx) * u + cx) * u, Y = (u) => ((ay * u + by) * u + cy) * u;
    const dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 8; i++) { const e = X(u) - x; if (Math.abs(e) < 1e-6) break; const d = dX(u); if (Math.abs(d) < 1e-6) break; u -= e / d; }
      return Y(cl(u));
    };
  }
  /** Damped spring step response, 0 → 1 over x in 0..1. Lower z = more overshoot. */
  function springer(z = 0.62, w = 11) {
    const wd = w * Math.sqrt(1 - z * z);
    const end = 1 - Math.exp(-z * w) * (Math.cos(wd) + (z * w / wd) * Math.sin(wd));
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      return (1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x))) / end;
    };
  }
  const E = {
    lin: (x) => x,
    snap: bez(0.16, 1, 0.3, 1),
    whip: bez(0.76, 0, 0.18, 1),
    glide: bez(0.45, 0, 0.2, 1),
    hurl: bez(0.8, 0, 1, 0.5),
    slam: springer(0.5, 13),
    pop: springer(0.42, 14),
    soft: springer(0.8, 9),
    out3: (x) => 1 - Math.pow(1 - x, 3),
    io3: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  };
  /** 0 → 1 → 0 decaying wobble after time a: the "boing" after a landing or a pose change. */
  const wobble = (t, a, f = 15, z = 7) => (t < a ? 0 : Math.exp(-z * (t - a)) * Math.sin(f * (t - a)));
  const decay = (t, a, d) => (t < a ? 0 : Math.max(0, 1 - (t - a) / d));
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------------------------------------------------------------- dom
  const reel = document.getElementById("reel");
  reel.style.width = W + "px"; reel.style.height = H + "px";
  document.documentElement.style.width = document.body.style.width = W + "px";
  document.documentElement.style.height = document.body.style.height = H + "px";
  const b = R.brand || {};
  document.getElementById("brand-css").textContent =
    `:root{${b.accent ? `--accent:${b.accent};` : ""}${b.font ? `--font:${b.font};` : ""}${b.body ? `--body:${b.body};` : ""}${b.caption ? `--cap:${b.caption};` : ""}}` + (b.css || "");
  const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /** "*word*" → accent colour. Each word is its own span so it can move on its own. */
  const words = (s, accent) => String(s).split(/(\s+|\n)/).filter((x) => x !== "").map((w) =>
    w === "\n" ? "<br>" : /^\s+$/.test(w) ? " " : `<span class="w"${/^\*.*\*[.,!?:;]*$/.test(w) ? ` style="color:${accent}"` : ""}>${esc(w.replace(/\*/g, ""))}</span>`).join("");
  function P(e, o) {
    const s = o.s == null ? 1 : o.s, sx = o.sx == null ? s : o.sx, sy = o.sy == null ? s : o.sy;
    let tr = `translate3d(${(o.x || 0).toFixed(2)}px,${(o.y || 0).toFixed(2)}px,0)`;
    if (o.r) tr += ` rotate(${o.r.toFixed(3)}deg)`;
    if (sx !== 1 || sy !== 1) tr += ` scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    e.style.transform = tr;
    const op = o.o == null ? 1 : cl(o.o);
    e.style.opacity = op.toFixed(3);
    e.style.visibility = op <= 0.002 ? "hidden" : "visible";
    if (o.blur != null) e.style.filter = o.blur > 0.05 ? `blur(${o.blur.toFixed(2)}px)` : "none";
  }

  // ---------------------------------------------------------------- entrances and exits
  /** Offset/scale/opacity for an element entering at `a` (type, duration d) and leaving at `z`. */
  function moveIn(t, a, type = "pop", d) {
    const k = pr(t, a, d || (type === "slam" ? 0.42 : 0.5));
    switch (type) {
      case "none": return { o: t >= a ? 1 : 0 };
      case "fade": return { o: E.out3(k) };
      case "drop": return { y: -(1 - E.slam(k)) * H * 0.7, o: k > 0 ? 1 : 0 };
      case "rise": return { y: (1 - E.slam(k)) * H * 0.7, o: k > 0 ? 1 : 0 };
      case "slide-left": return { x: (1 - E.snap(k)) * W, o: k > 0 ? 1 : 0 };   // comes in from the right, moving left
      case "slide-right": return { x: -(1 - E.snap(k)) * W, o: k > 0 ? 1 : 0 };
      case "slam": return { s: 1 + (1 - E.slam(k)) * 1.4, o: cl(k * 6) };
      default: return { s: E.pop(k), o: k > 0 ? 1 : 0 };                         // pop
    }
  }
  function moveOut(t, z, type = "fade", d = 0.32) {
    if (z == null || t < z) return {};
    const k = E.hurl(pr(t, z, d));
    switch (type) {
      case "drop": return { y: k * H * 0.8 };
      case "rise": return { y: -k * H * 0.8 };
      case "slide-left": return { x: -k * W };
      case "slide-right": return { x: k * W };
      case "pop": return { s: 1 - k, o: 1 - k };
      case "none": return { o: 0 };
      default: return { o: 1 - k };
    }
  }
  const join = (a, b) => ({ x: (a.x || 0) + (b.x || 0), y: (a.y || 0) + (b.y || 0), s: (a.s == null ? 1 : a.s) * (b.s == null ? 1 : b.s), o: (a.o == null ? 1 : a.o) * (b.o == null ? 1 : b.o) });

  // ---------------------------------------------------------------- scenes
  const shakes = [];   // absolute times, all scenes
  const scenes = R.scenes.map((sc, si) => {
    const root = el(`<section class="scene"></section>`);
    reel.appendChild(root);
    const S = { sc, root, t0: sc.start, t1: sc.end, items: [] };
    for (const s of sc.shake || []) shakes.push({ at: sc.start + s.at, amount: s.amount == null ? 1 : s.amount });

    if (sc.bg) {
      const bg = sc.bg;
      if (bg.src) { const img = el(`<img class="bg" src="${bg.src}">`); root.appendChild(img); S.bg = img; }
      else { root.style.background = bg.color || "#111"; }
      if (bg.gradient) root.style.background = bg.gradient;
    }
    for (const c of sc.chars || []) {
      const box = el(`<div class="char"></div>`);
      // each pose is its own layer (image, open-mouth image, overlays) so two poses can crossfade
      const poses = c.poses.map((p) => {
        const layer = el(`<div class="pose"></div>`); box.appendChild(layer);
        const closed = el(`<img src="${p.src}">`); layer.appendChild(closed);
        const open = p.open ? el(`<img src="${p.open}">`) : null; if (open) layer.appendChild(open);
        const over = (p.over || []).map((o) => {
          const wrap = el(`<div class="over"><div class="ovclip"><img src="${o.src}"></div></div>`); layer.appendChild(wrap);
          const clip = wrap.firstElementChild, lip = o.unroll ? el(`<div class="ovlip"></div>`) : null;
          if (lip) clip.appendChild(lip);
          return { o, wrap, clip, img: wrap.querySelector("img"), lip };
        });
        return { ...p, layer, closed, open, over };
      });
      root.appendChild(box);
      S.items.push({ kind: "char", c, box, poses });
    }
    for (const p of sc.pics || []) {
      const box = el(`<div class="pic ${p.frame || ""}"><div class="clip" style="overflow:hidden"><img src="${p.src}"></div></div>`);
      root.appendChild(box);
      S.items.push({ kind: "pic", p, box, img: box.querySelector("img"), clip: box.querySelector(".clip") });
    }
    for (const c of sc.cards || []) {
      const kind = c.kind || "notification";
      const icon = c.icon ? (/\.(png|jpe?g|webp|svg)/i.test(c.icon) ? `<img src="${c.icon}">` : esc(c.icon)) : "";
      const cls = kind === "chat-me" ? "chat me" : kind;
      const inner = kind === "button" ? `<div class="t">${esc(c.title)}</div>`
        : kind === "stat" ? `<div class="t" style="color:${c.color || "var(--accent)"}">${esc(c.title)}</div><div class="b">${esc(c.body || "")}</div>`
        : `${icon && kind === "notification" ? `<div class="ic" style="${c.iconBg ? `background:${c.iconBg}` : ""}">${icon}</div>` : ""}<div>${c.app ? `<div class="app">${esc(c.app)}</div>` : ""}<div class="t">${esc(c.title || "")}</div>${c.body ? `<div class="b">${esc(c.body)}</div>` : ""}</div>`;
      const box = el(`<div class="card ${cls}" style="width:${((c.w || (kind === "button" ? 0.6 : 0.78)) * W / TS).toFixed(0)}px">${inner}</div>`);
      root.appendChild(box);
      S.items.push({ kind: "card", c, box });
    }
    for (const x of sc.texts || []) {
      const size = (x.size || 110) * TS;
      const stroke = x.stroke == null ? Math.round(size * 0.11) : x.stroke;
      const box = el(`<div class="txt" style="font-size:${size}px;color:${x.color || "#fff"};-webkit-text-stroke:${stroke}px ${x.strokeColor || "#000"};padding:0 ${(W * SAFE_R).toFixed(0)}px 0 ${(W * SAFE_L).toFixed(0)}px">${x.bg ? `<span style="background:${x.bg};-webkit-text-stroke:0;padding:.08em .32em;border-radius:.22em;-webkit-box-decoration-break:clone;box-decoration-break:clone">${words(x.text, x.accent || "var(--accent)")}</span>` : words(x.text, x.accent || "var(--accent)")}</div>`);
      root.appendChild(box);
      S.items.push({ kind: "text", x, box, ws: [...box.querySelectorAll(".w")] });
    }
    return S;
  });
  const scenesBy = Object.fromEntries(scenes.map((s) => [s.sc.id, s]));

  // captions, safe-zone guide, flash and fade layers sit over every scene
  const caps = el(`<div id="caps"></div>`); reel.appendChild(caps);
  const safe = el(`<div id="safe"><div style="left:0;right:0;bottom:0;height:${((R.safe?.bottom ?? 0.2) * 100).toFixed(1)}%"></div><div style="right:0;top:0;bottom:0;width:${(SAFE_R * 100).toFixed(1)}%"></div>${R.safe?.left == null ? "" : `<div style="left:0;top:0;bottom:0;width:${(SAFE_L * 100).toFixed(1)}%"></div>`}<div style="left:0;right:0;top:0;height:${((R.safe?.top ?? 0.07) * 100).toFixed(1)}%"></div></div>`); reel.appendChild(safe);
  const flash = el(`<div id="flash"></div>`); reel.appendChild(flash);
  const black = el(`<div id="black"></div>`); reel.appendChild(black);

  // ---------------------------------------------------------------- per-frame drawing
  function camera(sc, lt, dur) {
    const bg = sc.bg || {}, amt = bg.amount == null ? 1 : bg.amount;
    let k = E.io3(pr(lt, 0, dur));
    if (bg.curve?.length) {   // bg.curve: [[t, k, ease], ...] the move's progress over scene time (ease lin | io3 | out3 | in3)
      const c = bg.curve; k = c[0][1];
      for (let j = 1; j < c.length; j++) {
        if (lt >= c[j][0]) { k = c[j][1]; continue; }
        const u = pr(lt, c[j - 1][0], c[j][0] - c[j - 1][0]), f = { lin: (x) => x, out3: E.out3, in3: (x) => x * x * x }[c[j][2]] || E.io3;
        k = c[j - 1][1] + (c[j][1] - c[j - 1][1]) * f(u); break;
      }
    }
    let z = 1, x = 0, y = 0;
    switch (bg.move || "push") {
      case "push": z = 1 + 0.1 * amt * k; break;
      case "pull": z = 1.1 * amt + 1 - amt - 0.1 * amt * k; break;
      case "pan-left": x = -60 * amt * (k - 0.5) * 2; z = 1.08; break;
      case "pan-right": x = 60 * amt * (k - 0.5) * 2; z = 1.08; break;
      case "rise": y = -50 * amt * (k - 0.5) * 2; z = 1.08; break;
      default: z = 1.02;
    }
    z *= bg.zoom || 1;                           // a closer framing of the same background (medium shot)
    for (const p of sc.punch || []) {           // quick zoom hits on beats: in fast, settle slow
      const u = lt - p.at;
      if (u >= 0) z += (p.z == null ? 0.08 : p.z) * (u < 0.08 ? E.out3(u / 0.08) : Math.exp(-5 * (u - 0.08)));
    }
    const f = bg.focus || [0.5, 0.5];
    return { z, x, y, fx: f[0] * W, fy: f[1] * H };
  }
  /** chars[].path: keyframes [{at, x, base, h, rot, o, ease}] that move a character over time. A missing value
      carries over from the keyframe before (or the character's own x/base/h); `ease` shapes the way into that key. */
  function along(c, lt) {
    let prev = { at: -1e9, x: c.x == null ? 0.5 : c.x, base: c.base == null ? 0.8 : c.base, h: c.h || 0.6, rot: 0, o: 1 };
    for (const k of c.path) {
      const cur = { ...prev, ...k };
      if (lt < cur.at) {
        const u = (E[k.ease] || E.lin)(pr(lt, prev.at, cur.at - prev.at)), m = (a, b) => a + (b - a) * u;
        return { x: m(prev.x, cur.x), base: m(prev.base, cur.base), h: m(prev.h, cur.h), rot: m(prev.rot, cur.rot), o: m(prev.o, cur.o) };
      }
      prev = cur;
    }
    return prev;
  }
  function shakeAt(t) {
    let a = 0; for (const s of shakes) a += s.amount * decay(t, s.at, 0.28);
    return a ? { x: 16 * a * Math.sin(t * 93), y: 12 * a * Math.cos(t * 77), r: 0.6 * a * Math.sin(t * 61) } : { x: 0, y: 0, r: 0 };
  }

  function drawScene(S, t, tr) {
    const lt = t - S.t0, sc = S.sc, dur = S.t1 - S.t0;
    const cam = camera(sc, lt, dur), sh = shakeAt(t);
    // transition offsets for the whole scene (whip/slide/zoom between neighbours)
    S.root.style.display = "block";
    P(S.root, { x: tr.x || 0, s: tr.s == null ? 1 : tr.s, o: tr.o == null ? 1 : tr.o, blur: tr.blur || 0 });

    if (S.bg) {   // background: moves half as much as the camera (parallax), cover-fit
      // bg.parallax 1 locks the background to the characters (people sitting on a bench in it);
      // the zoom centres on cam.fx/fy (bg.focus), so the camera can push in on any point of the picture
      const par = sc.bg.parallax, nw = S.bg.naturalWidth || W, nh = S.bg.naturalHeight || H, fit = Math.max(W / nw, H / nh) * 1.06;
      const z = 1 + (cam.z - 1) * (par ?? 0.6), w0 = nw * fit, h0 = nh * fit, w = w0 * z, h = h0 * z;
      S.bg.style.width = w.toFixed(1) + "px"; S.bg.style.height = h.toFixed(1) + "px";
      P(S.bg, { x: cam.fx + ((W - w0) / 2 - cam.fx) * z + cam.x * (par ?? 0.5) + sh.x * 0.5, y: cam.fy + ((H - h0) / 2 - cam.fy) * z + cam.y * (par ?? 0.5) + sh.y * 0.5, blur: sc.bg.blur });
    }
    for (const it of S.items) {
      if (it.kind === "char") drawChar(it, t, lt, cam, sh);
      else if (it.kind === "text") drawText(it, lt, sh);
      else if (it.kind === "card") drawCard(it, lt, sh);
      else if (it.kind === "pic") drawPic(it, lt, cam, sh);
    }
  }

  function drawChar(it, t, lt, cam, sh) {
    const c = it.c, enter = c.enter || {}, exit = c.exit || {};
    const at = enter.at || 0;
    // which pose is on, and when it came on
    let cur = it.poses[0];
    for (const p of it.poses) if (lt >= (p.at || 0)) cur = p;
    const since = lt - (cur.at || 0);
    const mv = join(moveIn(lt, at, enter.type || "pop", enter.d), moveOut(lt, exit.at, exit.type, exit.d));
    if ((c.until != null && lt >= c.until + 0.4) || lt < at) { it.box.style.visibility = "hidden"; return; }
    // size from the pose image's own shape: h is the character's height as a share of the frame
    const img = cur.closed, nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
    const pa = c.path ? along(c, lt) : { x: c.x == null ? 0.5 : c.x, base: c.base == null ? 0.8 : c.base, h: c.h || 0.6, rot: 0, o: 1 };
    // poses[].dx / dy / hs: shift (fractions of the frame) and scale one pose so every pose of a character sits the same
    const h = pa.h * (cur.hs || 1) * H * CH, w = h * nw / nh;
    it.box.style.width = w.toFixed(1) + "px"; it.box.style.height = h.toFixed(1) + "px";
    // life: breathing, a slow sway, a squash on landing, a springy pop on every pose change
    const ph = (c.phase || 0) + hash(c.id ? c.id.length : 1) * 6;
    // still: true turns off breathing and the talking bob, and forces sway to 0 (the mouth still moves)
    const breath = c.still ? 0 : 0.014 * Math.sin(lt * 2 * Math.PI / 2.8 + ph);
    const landT = at + (enter.d || 0.5) * 0.55;
    const land = (enter.type === "drop" || enter.type === "rise") ? 0.09 * wobble(lt, landT, 16, 8) : 0;
    // pop: false turns off the springy pose change (walk cycles, a quiet change of expression)
    const pop = c.pop !== false && cur.pop !== false && since >= 0 && cur !== it.poses[0] ? 0.07 * wobble(lt, cur.at, 17, 9) : 0;
    const talking = mouthOpen(c.id, t);
    const bob = talking == null || c.still ? 0 : 5 * Math.sin(lt * 9.3 + ph);
    const sx = (1 + land + pop - breath * 0.4), sy = 1 - land + pop + breath;
    // rot: a fixed turn in degrees (per pose, else per character) to level a pose that came out tilted
    const r = (cur.rot ?? c.rot ?? 0) + pa.rot + (c.still ? 0 : c.sway == null ? 1.2 : c.sway) * Math.sin(lt * 1.9 + ph) + (pop ? 2.5 * pop : 0);
    const x = FX(pa.x + (cur.dx || 0)) * W - w / 2 + cam.x + sh.x;
    const y = (pa.base + (cur.dy || 0)) * H - h + cam.y + sh.y + bob * 0.4;
    const z = cam.z, cx = cam.fx, cy = cam.fy;   // camera zoom about its focus (the frame centre by default)
    P(it.box, { x: cx + (x + mv.x - cx) * z + (z - 1) * w / 2, y: cy + (y + mv.y - cy) * z + (z - 1) * h, sx: sx * z * (mv.s == null ? 1 : mv.s), sy: sy * z * (mv.s == null ? 1 : mv.s), r, o: (mv.o == null ? 1 : mv.o) * pa.o });
    // xfade: a new pose fades in over the old one (first half), then the old one fades out under it (second half)
    const xf = cur.xfade ?? c.xfade ?? 0, ci = it.poses.indexOf(cur);
    const prev = xf > 0 && ci > 0 && since < xf ? it.poses[ci - 1] : null, u = prev ? since / xf : 1;
    // each visible layer: its size, its place in the box (the box follows the current pose), its head point
    const geo = (p) => {
      const pi = p.closed, ph = pa.h * (p.hs || 1) * H * CH, pw = ph * (pi.naturalWidth || 1) / (pi.naturalHeight || 1);
      const left = (w - pw) / 2 + (FX(pa.x + (p.dx || 0)) - FX(pa.x + (cur.dx || 0))) * W;
      const top = h - ph + ((p.dy || 0) - (cur.dy || 0)) * H, flip = !!(p.flip ?? c.flip), hd = p.head;
      const hx = hd ? (flip ? 1 - hd[0] : hd[0]) * pw : pw / 2, hy = hd ? hd[1] * ph : 0;
      return { ph, pw, left, top, flip, lx: hx, ly: hy, X: left + hx, Y: top + hy, size: hd && hd[2] ? hd[2] * ph : 0 };
    };
    const gc = geo(cur), gp = prev ? geo(prev) : null;
    // poses[].head [x, y, size] (fractions of the pose image): during a crossfade both layers slide and scale so
    // their heads sit on one point moving from the old head to the new one, so it reads as a turn, not a second person
    const align = gp && cur.head && prev.head, m = E.io3(u);
    const SX = align ? gp.X + (gc.X - gp.X) * m : 0, SY = align ? gp.Y + (gc.Y - gp.Y) * m : 0, SS = align && gp.size && gc.size ? gp.size + (gc.size - gp.size) * m : 0;
    for (const p of it.poses) {
      const on = p === cur, was = p === prev, open = on && p.open && talking === true;
      if (!on && !was) { p.layer.style.visibility = "hidden"; continue; }
      const g = on ? gc : gp, L = p.layer.style;
      L.visibility = "visible"; L.width = g.pw.toFixed(1) + "px"; L.height = g.ph.toFixed(1) + "px";
      L.left = "0px"; L.top = "0px"; L.bottom = "auto"; L.transformOrigin = "0 0";
      const flip = g.flip ? ` translate(${g.pw.toFixed(1)}px,0) scale(-1,1)` : "";
      if (align) {
        const k = SS ? SS / g.size : 1;   // a third head value (head height) also eases the scale between the two
        L.transform = `translate(${SX.toFixed(2)}px,${SY.toFixed(2)}px) scale(${k.toFixed(4)}) translate(${(-g.lx).toFixed(2)}px,${(-g.ly).toFixed(2)}px)${flip}`;
      } else L.transform = `translate(${g.left.toFixed(2)}px,${g.top.toFixed(2)}px)${flip}`;
      L.opacity = (on ? E.io3(cl(u * 2)) : 1 - E.io3(cl(u * 2 - 1))).toFixed(3);
      L.zIndex = on ? 2 : 1;
      p.closed.style.visibility = !open ? "inherit" : "hidden";
      if (p.open) p.open.style.visibility = open ? "inherit" : "hidden";
      // overlays on the outgoing pose leave in the first half, so a paper is never seen in two places for long
      for (const v of p.over) { drawOver(v, lt, g.pw, g.ph); v.wrap.style.opacity = on ? "1" : (1 - E.io3(cl(u * 2))).toFixed(3); }
    }
  }
  /** poses[].over: an image laid on a pose (a paper in a pocket). x, y: its anchor point as fractions of the pose
      image; w: its width as a fraction of the pose image's width; anchor "bottom" (default, sticks up out of the
      anchor) or "top" (hangs down from it); rot in degrees about the anchor; slide: [{at, v}] (scene time,
      v 0 = hidden in the pocket, 1 = fully out) slides it out of / back into the anchor line; each segment eases in
      and out unless its end key says ease: "linear" (sample one curve densely to carry it across a cut). */
  function drawOver(v, lt, pw, ph) {
    const o = v.o, w = (o.w || 0.2) * pw, nw = v.img.naturalWidth || 1, nh = v.img.naturalHeight || 1, h = w * nh / nw;
    let s = 1;
    if (o.slide && o.slide.length) {
      s = o.slide[0].v;
      for (let i = 1; i < o.slide.length; i++) {
        const a = o.slide[i - 1], b = o.slide[i];
        if (lt >= b.at) s = b.v; else if (lt > a.at) { const u = pr(lt, a.at, b.at - a.at); s = a.v + (b.v - a.v) * (b.ease === "linear" ? u : E.io3(u)); break; } else break;
      }
    }
    const top = o.anchor === "top", X = (o.x || 0.5) * pw, Y = (o.y || 0.5) * ph;
    const W2 = v.wrap.style, C = v.clip.style, I = v.img.style;
    W2.visibility = s > 0.002 ? "inherit" : "hidden";
    W2.width = w.toFixed(1) + "px"; W2.height = h.toFixed(1) + "px";
    W2.left = (X - w / 2).toFixed(1) + "px"; W2.top = (top ? Y : Y - h).toFixed(1) + "px";
    W2.transformOrigin = top ? "50% 0" : "50% 100%";
    W2.transform = `rotate(${(o.rot || 0).toFixed(2)}deg)`;
    I.width = "100%"; I.height = "100%";
    if (o.unroll && top) {   // unroll: the top end stays at the anchor (tucked in by `tuck`) and the paper grows down
      const tk = (o.tuck || 0) * h;
      C.width = "100%"; C.height = (s * (h - tk)).toFixed(1) + "px"; I.height = h.toFixed(1) + "px";
      I.transform = `translate3d(0,${(-tk).toFixed(1)}px,0)`;
      if (v.lip) {   // a soft shadow under the pocket lip, so the paper reads as coming out of the pocket
        v.lip.style.display = "block"; v.lip.style.height = (0.16 * w).toFixed(1) + "px";
        v.lip.style.background = `linear-gradient(rgba(18,14,12,${o.lip ?? 0.55}),rgba(18,14,12,0))`;
      }
    } else {
      C.width = "100%"; C.height = "100%";
      I.transform = `translate3d(0,${((top ? -1 : 1) * (1 - s) * h).toFixed(1)}px,0)`;
    }
  }
  /** true/false while this character's voice is playing (flapping), null when silent. From render.mjs. */
  function mouthOpen(id, t) {
    const m = R.mouth && R.mouth[id];
    if (!m) return null;
    const f = Math.round(t * FPS), v = m[f];
    return v === "1" ? true : v === "0" ? false : null;
  }

  function drawText(it, lt, sh) {
    const x = it.x, a = x.at || 0, style = x.style || "pop";
    if (lt < a || (x.until != null && lt > x.until + 0.4)) { it.box.style.visibility = "hidden"; return; }
    const out = moveOut(lt, x.until, x.exit || "fade", 0.25);
    const y = FY(x.y == null ? 0.14 : x.y) * H;
    it.box.style.visibility = "visible";
    if (style === "slam") {
      const k = pr(lt, a, 0.45);
      P(it.box, { y: y + sh.y + (out.y || 0), x: sh.x + (out.x || 0), s: (1 + (1 - E.slam(k)) * 1.3) * (out.s == null ? 1 : out.s), o: cl(k * 7) * (out.o == null ? 1 : out.o), r: -2 * (1 - E.slam(k)) });
      it.ws.forEach((w) => (w.style.transform = "none"));
      return;
    }
    P(it.box, { y: y + sh.y * 0.6 + (out.y || 0), x: (out.x || 0), s: out.s, o: out.o });
    const st = x.stagger == null ? (style === "type" ? 0.05 : 0.09) : x.stagger;
    it.ws.forEach((w, i) => {
      const k = pr(lt, a + i * st, style === "rise" ? 0.5 : style === "ease" ? x.d || 0.9 : 0.42);
      if (style === "ease") { const e = E.io3(k); w.style.transform = `translate3d(0,${((1 - e) * 28).toFixed(1)}%,0)`; w.style.opacity = e.toFixed(3); }   // gentle: fade and drift up
      else if (style === "rise") { w.style.transform = `translate3d(0,${((1 - E.snap(k)) * 110).toFixed(1)}%,0)`; w.style.opacity = E.out3(k * 1.4).toFixed(3); }
      else if (style === "type") { w.style.opacity = lt >= a + i * st ? "1" : "0"; w.style.transform = "none"; }
      else { const s = E.pop(k); w.style.transform = `scale(${s.toFixed(4)}) rotate(${((1 - E.pop(k)) * -6).toFixed(2)}deg)`; w.style.opacity = k > 0 ? "1" : "0"; }
    });
  }

  function drawCard(it, lt, sh) {
    const c = it.c, a = c.at || 0;
    if (lt < a || (c.until != null && lt > c.until + 0.5)) { it.box.style.visibility = "hidden"; return; }
    const ent = c.enter || (c.kind === "button" || c.kind === "stat" ? "pop" : c.kind === "chat" ? "slide-right" : c.kind === "chat-me" ? "slide-left" : "drop");
    const mv = join(moveIn(lt, a, ent, 0.55), moveOut(lt, c.until, c.exit || "fade"));
    const w = it.box.offsetWidth, h = it.box.offsetHeight;
    const cx = (c.x == null ? MID_X : FX(c.x)) * W, cy = FY(c.y == null ? 0.2 : c.y) * H;
    const fl = c.float === false ? 0 : 6 * Math.sin(lt * 1.7 + a * 3);
    let s = (mv.s == null ? 1 : mv.s) * TS;
    if (c.kind === "button") s *= 1 + 0.035 * Math.max(0, Math.sin((lt - a - 0.6) * 5.5)) * (lt > a + 0.6 ? 1 : 0);   // a gentle "press me" pulse
    P(it.box, { x: cx - w / 2 + mv.x + sh.x * 0.7, y: cy - h / 2 + mv.y + fl + sh.y * 0.7, s, o: mv.o, r: c.kind === "notification" ? 0 : 0.6 * Math.sin(lt * 1.3 + a) });
  }

  function drawPic(it, lt, cam, sh) {
    const p = it.p, a = p.at || 0;
    if (lt < a || (p.until != null && lt > p.until + 0.5)) { it.box.style.visibility = "hidden"; return; }
    const w = (p.w || 0.7) * W;
    it.box.style.width = w.toFixed(0) + "px";
    const nw = it.img.naturalWidth || 1, nh = it.img.naturalHeight || 1, inner = w - (p.frame === "phone" ? 44 : 0);
    const fullH = inner * nh / nw, viewH = p.h ? p.h * H : fullH;
    it.clip.style.height = Math.min(fullH, viewH).toFixed(1) + "px";
    if (p.scroll) {   // long screenshots scroll inside the frame: {at, d, to: 0..1 of the overflow}
      const k = E.glide(pr(lt, p.scroll.at ?? 0.6, p.scroll.d || 2));
      it.img.style.transform = `translate3d(0,${(-(fullH - viewH) * (p.scroll.to == null ? 1 : p.scroll.to) * k).toFixed(1)}px,0)`;
    }
    const mv = join(moveIn(lt, a, p.enter || "rise", 0.6), moveOut(lt, p.until, p.exit || "fade"));
    const fl = p.float === false ? 0 : 8 * Math.sin(lt * 1.4 + a);
    const bh = it.box.offsetHeight;
    P(it.box, { x: FX(p.x == null ? 0.5 : p.x) * W - w / 2 + mv.x + cam.x * 0.8 + sh.x, y: FY(p.y == null ? 0.45 : p.y) * H - bh / 2 + mv.y + fl + cam.y * 0.8 + sh.y, s: (mv.s == null ? 1 : mv.s) * (1 + (cam.z - 1) * 0.8), o: mv.o, r: p.tilt == null ? 0 : p.tilt });
  }

  // captions: groups of a few words; the spoken word lights up and pops
  function drawCaps(t) {
    const C = R.captions;
    if (!C || !C.on || !C.groups || !C.groups.length) { caps.style.visibility = "hidden"; return; }
    let g = null;
    for (const x of C.groups) if (t >= (x.s ?? x.a - 0.02) && t < (x.end ?? x.b + 0.12)) g = x;
    if (!g) { caps.style.visibility = "hidden"; return; }
    if (C.style === "steady") return steadyCaps(t, C, g);
    if (caps._g !== g) {
      caps._g = g;
      caps.innerHTML = g.words.map((w) => `<span class="w">${esc(w.w)}</span>`).join(" ");
      caps._ws = [...caps.querySelectorAll(".w")];
    }
    const cs = scenes.find((S) => t >= S.t0 && t < S.t1), sc = cs?.sc.captions || {};   // a scene may move or resize them
    const size = (sc.size || C.size || 84) * TS, emk = sc.em ?? 1;
    caps.style.fontSize = size + "px";
    caps.style.webkitTextStroke = `${Math.round(size * 0.14)}px #000`;
    caps.style.paintOrder = "stroke fill";
    caps.style.padding = `0 ${(W * SAFE_R).toFixed(0)}px 0 ${(W * SAFE_L).toFixed(0)}px`;
    const k = pr(t, g.a - 0.02, 0.22);
    const cy = sc.y ?? C.y;
    P(caps, { y: (cy == null ? 0.64 : cy) * H, s: 0.85 + 0.15 * E.pop(k), o: 1 });
    caps._ws.forEach((el, i) => {
      const w = g.words[i], on = t >= w.a - 0.02 && t < (g.words[i + 1] ? g.words[i + 1].a : g.b + 0.12);
      if (w.em) {   // emphasis: grows (with reflow) to em.s over ~0.12 s with a small overshoot, stays big and green
        const es = 1 + (w.em.s - 1) * emk, u = Math.max(0, t - w.a + 0.04), m = t >= w.a - 0.04 ? 1 + (es - 1) * E.out3(cl(u / 0.12)) + 0.07 * es * cl(u / 0.12) * Math.exp(-9 * Math.max(0, u - 0.12)) : 1;
        el.style.fontSize = m.toFixed(3) + "em";
        el.style.color = t >= w.a - 0.02 ? (C.accent || "var(--accent)") : (C.color || "var(--cap)");
        el.style.transform = "none";
        return;
      }
      el.style.color = on ? (C.accent || "var(--accent)") : (C.color || "var(--cap)");
      const s = on ? 1 + 0.12 * Math.exp(-14 * Math.max(0, t - w.a)) : 1;
      el.style.transform = `scale(${s.toFixed(4)})`;
    });
  }

  // captions.style "steady": no karaoke. The group is laid out once with every emphasis word at its final big size
  // from the start (natural spacing, nothing reflows); words stay white; an emphasis word turns accent when spoken with
  // a tiny 1.0 -> 1.08 -> 1.0 pulse over 0.15 s (a little side margin is reserved for it). Groups fade in and out over ~0.08 s. A scene's captions.pill (0..1)
  // puts a dark rounded backing behind each line, captions.shadow adds a soft dark shadow.
  function steadyCaps(t, C, g) {
    const cs = scenes.find((S) => t >= S.t0 && t < S.t1), sc = cs?.sc.captions || {};
    const size = Math.round((sc.size || C.size || 84) * TS), emk = sc.em ?? 1;
    const pill = sc.pill ?? C.pill ?? 0, shadow = sc.shadow ?? C.shadow ?? 0;
    const key = g.a + "|" + size + "|" + emk + "|" + pill + "|" + shadow;
    if (caps._k !== key) {
      caps._k = key; caps._g = g;
      const lines = [[]];
      g.words.forEach((w, i) => { if (w.br && i) lines.push([]); lines[lines.length - 1].push(i); });
      const sw = Math.round(size * 0.14);
      caps.innerHTML = lines.map((ln) => `<span class="ln">` + ln.map((i) => {
        const w = g.words[i], es = w.em ? 1 + (w.em.s - 1) * emk : 1;
        return `<span class="w" style="font-size:${es.toFixed(3)}em${w.em ? ";margin:0 .18em" : ""}">${esc(w.w)}</span>`;
      }).join(" ") + `</span>`).join("<br>");
      caps._ws = [...caps.querySelectorAll(".w")];
      caps.style.fontSize = size + "px";
      caps.style.lineHeight = "1.18";
      caps.style.webkitTextStroke = `${sw}px #000`;
      caps.style.paintOrder = "stroke fill";
      caps.style.padding = `0 ${(W * SAFE_R).toFixed(0)}px 0 ${(W * SAFE_L).toFixed(0)}px`;
      caps.style.textShadow = shadow ? `0 ${Math.round(size * 0.06)}px ${Math.round(size * 0.22)}px rgba(0,0,0,${shadow})` : "none";
      for (const ln of caps.querySelectorAll(".ln")) {
        ln.style.background = pill ? `rgba(0,0,0,${pill})` : "none";
        ln.style.borderRadius = Math.round(size * 0.32) + "px";
        ln.style.padding = pill ? `${Math.round(size * 0.02)}px ${Math.round(size * 0.28)}px` : "0";
        ln.style.webkitBoxDecorationBreak = ln.style.boxDecorationBreak = "clone";
      }
      caps._ws.forEach((el, i) => { const w = g.words[i]; el.style.color = C.color || "var(--cap)"; el.style.transformOrigin = "50% 72%"; el.style.transform = "none"; el._st = -1; });
    }
    const cy = sc.y ?? C.y, s0 = g.s ?? g.a - 0.02, e0 = g.end ?? g.b + 0.12, F = 0.08;
    const o = Math.min(E.io3(cl((t - s0) / F)), E.io3(cl((e0 - t) / F)));
    P(caps, { y: Math.round((cy == null ? 0.64 : cy) * H), s: 1, o });
    caps._ws.forEach((el, i) => {
      const w = g.words[i]; if (!w.em) return;
      const u = t - (w.a - 0.02), m = u > 0 && u < 0.15 ? 1 + 0.08 * Math.sin(Math.PI * u / 0.15) : 1;
      const on = u >= 0, key = m + (on ? 10 : 0);
      if (Math.abs(key - el._st) < 1e-5) return; el._st = key;
      el.style.transform = m === 1 ? "none" : `scale(${m.toFixed(4)})`;
      el.style.color = on ? (C.accent || "var(--accent)") : (C.color || "var(--cap)");
    });
  }

  function seek(t) {
    t = cl(t, 0, DURATION);
    reel.style.display = "none"; void reel.offsetHeight; reel.style.display = "";   // drop cached layer bitmaps: same t, same pixels
    for (const S of scenes) S.root.style.display = "none";
    let fl = 0;
    scenes.forEach((S, i) => {
      const nx = scenes[i + 1], tin = S.sc.in || {}, tout = nx ? nx.sc.in || {} : {};
      const dIn = tin.d || 0.28, dOut = tout.d || 0.28;
      // fade: a dissolve; the incoming scene fades in over the outgoing one, which holds underneath
      const OV = ["whip", "slide", "zoom", "fade"];
      const startVis = OV.includes(tin.type) ? S.t0 - dIn / 2 : S.t0;
      const endVis = nx && OV.includes(tout.type) ? S.t1 + dOut / 2 : S.t1;
      if (t < startVis || t >= endVis) return;
      const tr = { x: 0, s: 1, o: 1, blur: 0 };
      if (t < S.t0 + dIn / 2 && OV.includes(tin.type)) {
        const k = E.whip(pr(t, S.t0 - dIn / 2, dIn));
        if (tin.type === "fade") tr.o = E.io3(pr(t, S.t0 - dIn / 2, dIn));
        else if (tin.type === "zoom") { tr.s = 1.5 - 0.5 * k; tr.o = k; }
        else { tr.x = (1 - k) * W; if (tin.type === "whip") tr.blur = 28 * Math.sin(k * Math.PI); }
      }
      if (nx && t > S.t1 - dOut / 2 && OV.includes(tout.type)) {
        const k = E.whip(pr(t, S.t1 - dOut / 2, dOut));
        if (tout.type === "fade") { /* the outgoing scene holds still under the dissolve */ }
        else if (tout.type === "zoom") { tr.s *= 1 + 0.4 * k; tr.o *= 1 - k; }
        else { tr.x -= k * W; if (tout.type === "whip") tr.blur = 28 * Math.sin(k * Math.PI); }
      }
      // dip: a quick dip through black between shots of different framing (no superimposed faces)
      if (tin.type === "dip") tr.o *= E.io3(pr(t, S.t0, dIn / 2));
      if (nx && tout.type === "dip") tr.o *= 1 - E.io3(pr(t, S.t1 - dOut / 2, dOut / 2));
      if (tin.type === "flash") fl = Math.max(fl, 0.85 * (1 - pr(t, S.t0, 0.22)));
      drawScene(S, t, tr);
    });
    for (const S of scenes) for (const f of S.sc.flash || []) fl = Math.max(fl, 0.85 * (1 - pr(t, S.t0 + f, 0.18)) * (t >= S.t0 + f ? 1 : 0));
    flash.style.opacity = fl.toFixed(3); flash.style.visibility = fl > 0.01 ? "visible" : "hidden";
    drawCaps(t);
    safe.style.visibility = R.showSafe ? "visible" : "hidden";
    const fo = R.fadeOut || 0, f = fo ? pr(t, DURATION - fo, fo) : 0;
    black.style.opacity = E.io3(f).toFixed(3); black.style.visibility = f > 0 ? "visible" : "hidden";
    document.documentElement.dataset.t = t.toFixed(4);
  }

  window.READY = (async () => {
    await Promise.all([...document.images].map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => { i.onload = i.onerror = () => r(); }))));
    await document.fonts.ready;
    seek(0);
    return true;
  })();
  window.DURATION = DURATION;
  window.seek = seek;
  window.scenesBy = scenesBy;
})();
