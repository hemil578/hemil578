window.__timelines = window.__timelines || {};
const DUR = 24.63;
const tl = gsap.timeline({ paused: true });
const F = (sel, from, to, t) => tl.fromTo(sel, from, Object.assign({ immediateRender: false }, to), t);
const B = (k) => +(0.075 + 0.6 * k).toFixed(3);

// section windows (hard cuts on the beat grid)
const win = { s1: [0, 2.875], s2: [2.475, 4.275], s3: [4.275, 9.075], s4: [9.075, 11.475], s5: [11.475, 12.675],
  s6: [12.675, 14.475], s7: [14.475, 16.875], s8: [16.875, 18.075], s9: [18.075, 19.875], s10: [19.875, DUR + 1] };
gsap.set('#s1', { visibility: 'visible' });
gsap.set('#iris', { display: 'none' });
for (const [id, [a, b]] of Object.entries(win)) {
  if (a > 0) tl.set('#' + id, { visibility: 'visible' }, a);
  if (b < DUR) tl.set('#' + id, { visibility: 'hidden' }, b);
}
const ripple = (x, y, t) => F('#ripple', { opacity: 1, scale: 0.2, x: x, y: y }, { opacity: 0, scale: 1.6, duration: 0.35, ease: 'power2.out' }, t);

// S1 system warning dialog
F('#dlg', { scale: 0.86, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 0);
tl.to('#dlg', { scale: 1.04, duration: 2.1, ease: 'none' }, 0.35);
tl.to('#dlg', { keyframes: { x: [-20, 18, -12, 7, 0] }, duration: 0.3, ease: 'none' }, 0.675);
F('#strike', { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: 'power2.out' }, 0.675);
tl.to('#dl1', { color: '#94a3b8', duration: 0.2 }, 0.675);
F('#dl2', { opacity: 0, scale: 1.5, transformOrigin: 'left center' }, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.2)' }, 0.675);
F('#cursor', { opacity: 0, x: 1000, y: 1800 }, { opacity: 1, x: 755, y: 1365, duration: 0.4, ease: 'power3.out' }, 1.875);
tl.to('#buy', { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1 }, 2.28);
ripple(761, 1371, 2.3);
tl.set('#cursor', { opacity: 0 }, 2.475);

// S2 shop grid: circle reveal from the click point
F('#s2', { clipPath: 'circle(0px at 761px 1371px)' }, { clipPath: 'circle(2300px at 761px 1371px)', duration: 0.4, ease: 'power2.in' }, 2.475);
F('.s2logo', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 2.475);
F('#s2h', { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 2.475);
[2.475, 3.075, 3.675].forEach((t, r) => F('#s2 .r' + r, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.4)', stagger: 0.05 }, t));

// S3 scanner + receipt
F('#s3', { filter: 'blur(24px)', scale: 1.12 }, { filter: 'blur(0px)', scale: 1, duration: 0.3, ease: 'power2.out' }, 4.275);
for (let i = 0; i < 8; i++) {
  const t = B(7 + i);
  F('#laser', { top: 0 }, { top: 680, duration: 0.5, ease: 'sine.inOut' }, t);
  tl.to('#scanner', { scale: 1.03, duration: 0.08, yoyo: true, repeat: 1 }, t);
}
const rowT = [4.275, 5.475, 6.675, 7.275];
rowT.forEach((t, i) => {
  F('#paper', { height: i === 0 ? 0 : 150 + i * 104 + 40 }, { height: 150 + (i + 1) * 104 + 40, duration: 0.25, ease: 'power2.out' }, t);
  F('#row' + i, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, t);
});

// S4 group chat
F('#vbub', { scale: 0.6, opacity: 0, transformOrigin: 'left top' }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 9.075);
[9.075, 9.675, 10.275].forEach((t, i) => F('#tb' + i, { scale: 0.3, opacity: 0, transformOrigin: 'right bottom' }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.6)' }, t + (i === 0 ? 0.1 : 0)));
tl.to('#s4', { keyframes: { x: [-12, 10, -6, 0] }, duration: 0.2, ease: 'none' }, 10.275);
F('#typing', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 10.875);
tl.to('#typing i', { keyframes: { y: [0, -16, 0] }, duration: 0.3, stagger: 0.1, ease: 'sine.inOut' }, 10.95);
F('#react', { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, 10.875);

// S5 mosaic split 1 -> 4 -> 9
F('#s5 .m4', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.out', stagger: 0.04 }, 11.475);
F('#s5 .m9', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.out', stagger: 0.03 }, 12.075);

// S6 countdown timer
F('#tcirc', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(1.8)' }, 12.675);
const C = 2701.77;
[12.675, 13.275, 13.875].forEach((t, i) => {
  F('#rarc', { strokeDashoffset: (C * i) / 3 }, { strokeDashoffset: (C * (i + 1)) / 3, duration: 0.6, ease: 'none' }, t);
  const n = '#n' + (3 - i);
  F(n, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'power4.out' }, t);
  tl.set(n, { opacity: 0 }, t + 0.6);
  if (i) tl.to('#tcirc', { scale: 1.05, duration: 0.08, yoyo: true, repeat: 1 }, t);
});

// S7 shipping label (the drop)
F('#flash', { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 14.475);
F('#label', { scale: 1.25, rotation: -8 }, { scale: 1, rotation: -2, duration: 0.3, ease: 'power3.out' }, 14.475);
[['#st1', 14.475], ['#st2', 15.075]].forEach(([s, t]) => {
  F(s, { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.16, ease: 'power4.in' }, t);
  tl.to('#s7', { keyframes: { x: [-16, 14, -7, 0], y: [8, -6, 3, 0] }, duration: 0.22, ease: 'none' }, t + 0.16);
});
[15.675, 16.275].forEach((t) => F('#scanline', { opacity: 1, left: 0 }, { left: 790, duration: 0.45, ease: 'sine.inOut' }, t));
tl.set('#scanline', { opacity: 0 }, 16.75);

// S8 swinging price tag
F('#pcirc', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' }, 16.875);
F('#swing', { rotation: -32 }, { rotation: 0, duration: 1.15, ease: 'elastic.out(1, 0.3)' }, 16.875);

// S9 tracking map
F('#mapw', { scale: 1.5 }, { scale: 1, duration: 0.5, ease: 'power3.out' }, 18.075);
F('#route', { strokeDashoffset: 1100 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 18.075);
F('#mtitle', { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, 18.075);
F('#tcard', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, 18.075);
F('#hpin', { opacity: 0, y: -220 }, { opacity: 1, y: 0, duration: 0.45, ease: 'bounce.out' }, 18.675);
[18.2, 18.675, 19.275].forEach((t, i) => F('#ck' + i, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(3)' }, t));

// S10 browser end card
F('#bwin', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 19.875);
for (let i = 0; i < 12; i++) tl.set('#ch' + i, { opacity: 1 }, +(19.975 + i * 0.07).toFixed(3));
F('#plogo', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 20.475);
F('#pline', { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.out' }, 21.075);
tl.to('#bwin', { keyframes: { x: [-12, 10, -5, 0] }, duration: 0.2, ease: 'none' }, 21.275);
F('#pstrip', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 21.675);
F('#pbtn', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2.4)' }, 22.275);
F('#psmall', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 22.475);
F('#cursor', { opacity: 0, x: 960, y: 1820 }, { opacity: 1, x: 534, y: 1374, duration: 0.5, ease: 'power3.out' }, 22.5);
tl.to('#pbtn span', { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1 }, 23.055);
ripple(540, 1380, 23.075);
[23.475, 24.075].forEach((t) => tl.to('#pbtn span', { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t));
tl.to('#caret', { opacity: 0, duration: 0.01, repeat: 7, yoyo: true, repeatDelay: 0.29 }, 21.0);

tl.set({}, {}, DUR);
window.__timelines['main'] = tl;
tl.seek(0);

// Frame-accurate renderer hook (snap.js): clip frames are pre-extracted JPEG sequences.
const vclips = [...document.querySelectorAll('img.vclip')];
window.seek = async (t) => {
  tl.seek(t, false);
  const waits = [];
  for (const im of vclips) {
    const s = +im.dataset.start, d = +im.dataset.duration;
    if (t >= s && t < s + d) {
      const n = Math.min(+im.dataset.n, Math.floor((t - s) * 30) + 1);
      const src = 'assets/frames/' + im.dataset.clip + '/' + String(n).padStart(3, '0') + '.jpg';
      if (!im.src.endsWith(src)) { im.src = src; }
      im.style.visibility = 'visible';
      waits.push(im.decode().catch(() => {}));
    } else im.style.visibility = 'hidden';
  }
  await Promise.all(waits);
};
window.ready = () => true;
