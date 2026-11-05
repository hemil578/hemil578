/**
 * Buyr — beat-synced story edit (no voiceover): scroll → add to cart → pack the box → ship → unbox.
 * Track: public/buyr/track.mp3 — 100 BPM (beat = 0.6 s), first hit 0.05 s, drop 14.44 s, ends 24.63 s.
 * Every product appears exactly once. Nothing is drawn wider than the 1080 px frame.
 */
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, Easing, random } from "remotion";

const { fontFamily: DISPLAY } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: UI } = loadJakarta("normal", { weights: ["600", "800"], subsets: ["latin"] });

const FPS = 30;
export const STORY_DURATION = Math.round(24.63 * FPS);

const NAVY = "#0F172A", DEEP = "#060E1A", TEAL = "#00C9A7", WHITE = "#FFFFFF", SLATE = "#94A3B8";
const PINK = "#FF5DA2", YELLOW = "#FFD23F";

const BEAT = 0.6, DROP = 14.44;
const beat = (k: number) => +(0.05 + k * BEAT).toFixed(3);
const HITS = [0.05, 0.65, 1.25, 1.86, 2.9, 3.34, 7.85, 8.45, 9.06, 13.56, DROP, ...Array.from({ length: 17 }, (_, i) => beat(24 + i))];

/* ---------- helpers (all timing in absolute seconds) ---------- */
const sp = (t: number, t0: number, damping = 12, mass = 0.6, stiffness = 120) =>
  spring({ frame: Math.round((t - t0) * FPS), fps: FPS, config: { damping, mass, stiffness } });
const lin = (t: number, a: number, b: number, from = 0, to = 1, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const env = (t: number, times: number[], decay = 12, win = 0.35) => {
  let v = 0;
  for (const h of times) { const d = t - h; if (d >= 0 && d < win) v = Math.max(v, Math.exp(-d * decay)); }
  return v;
};
const shot = (n: string) => staticFile(`buyr/shots/${n}.jpg`);
const cut = (n: string) => staticFile(`buyr/cut/${n}.png`);

/* ---------- product data (each used once) ---------- */
const FEED = [ // phone feed, swipes on the opening hits
  { img: "glow-penguin-plush_2", name: "Glow Penguin Plush", likes: "128K" },
  { img: "nebuladream-galaxy-projector_2", name: "Galaxy Projector", likes: "302K" },
  { img: "alien-glow-headband_2", name: "Alien Glow Headband", likes: "87K" },
  { img: "santa-butt-tissue-holder_1", name: "Santa Tissue Holder", likes: "211K" },
  { img: "light-up-poppy-flower-pot_1", name: "Light-Up Flower Pot", likes: "64K" },
];
const FEED_T = [0.05, 0.65, 1.25, 1.86, 2.45];

const CARDS = [ // add-to-cart cards in the calm section
  { img: "ice-ball-cola-cup_1", name: "Ice-Ball Cola Cup", price: 19.99, t: 3.34 },
  { img: "cat-pop-up-hook_1", name: "Cat Pop-Up Hook", price: 26.99, t: 4.55 },
  { img: "keycap-clicker-keychain_2", name: "Keycap Clicker", price: 20.99, t: 5.75 },
  { img: "dog-raincoat-with-boots_1", name: "Dog Raincoat & Boots", price: 26.99, t: 6.85 },
];
const BOX_START = 7.85;

const DROPS = [ // fall into the box on the three hits, then on every beat
  { img: "magnetic-jointed-frog_2", name: "Magnetic Frog", price: 19.99, t: 7.85 },
  { img: "lazy-prism-glasses_2", name: "Lazy Prism Glasses", price: 24.99, t: 8.45 },
  { img: "old-man-ski-mask_1", name: "Old Man Ski Mask", price: 9.99, t: 9.06 },
  { img: "seal-plush-slippers_2", name: "Seal Slippers", price: 39.99, t: 9.65 },
  { img: "light-up-keyboard-game_1", name: "Speed Tap Keyboard", price: 22.99, t: 10.25 },
  { img: "big-feet-slippers_1", name: "Big Feet Slippers", price: 29.99, t: 10.85 },
  { img: "gear-cube_1", name: "Gear Cube", price: 26.99, t: 11.45 },
  { img: "slow-rise-butter-squishy_2", name: "Butter Squishy", price: 19.99, t: 12.05 },
  { img: "abs-projector-prank_1", name: "Abs Projector", price: 22.99, t: 12.65 },
];

const FLYBY = [ // fly past the moving box after the drop
  "strawberry-ceramic-berry-bowl_1", "syringe-pen_1", "tiktok-scroll-remote_1", "tongue-pull-skull-keychain_1",
  "gengar-switch-cover_1", "pet-hair-remover-glove_3", "car-battery-disconnect-switch_1",
].map((img, i) => ({ img, t: beat(25 + i) }));

const LID_CLOSE = 13.25, SHIP_END = 20.45;

/* ---------- shared UI pieces ---------- */
const BigWord: React.FC<{ t: number; t0: number; text: string; color?: string; size?: number; y: number }> = ({ t, t0, text, color = WHITE, size = 200, y }) => {
  const s = interpolate(t - t0, [0, 0.13], [1.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const blur = interpolate(t - t0, [0, 0.1], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontFamily: DISPLAY, fontSize: size, lineHeight: 1, color,
      transform: `scale(${s}) rotate(-3deg)`, filter: `blur(${blur}px)`, WebkitTextStroke: "5px #060E1A", paintOrder: "stroke fill",
      textShadow: "0 12px 0 #060E1A, 0 20px 50px rgba(0,0,0,0.45)" }}>{text}</div>
  );
};

/** Word sequence: each word shows from its time until the next. */
const Words: React.FC<{ t: number; list: [number, string, string?][]; until: number; y: number; size?: number }> = ({ t, list, until, y, size }) => {
  const i = list.findIndex(([t0], k) => t >= t0 && t < (list[k + 1]?.[0] ?? until));
  if (i < 0) return null;
  const [t0, text, color] = list[i];
  return <BigWord t={t} t0={t0} text={text} color={color} size={size} y={y} />;
};

const CartIcon: React.FC<{ t: number; count: number; total: number; bump: number }> = ({ count, total, bump }) => (
  <div style={{ position: "absolute", top: 70, right: 50, display: "flex", alignItems: "center", gap: 18, padding: "16px 26px",
    borderRadius: 28, background: "rgba(255,255,255,0.95)", boxShadow: "0 10px 40px rgba(0,0,0,0.35)", transform: `scale(${1 + bump * 0.18})` }}>
    <div style={{ position: "relative", width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke={NAVY} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h9l7 32h30l6-22H17" /><circle cx="24" cy="52" r="4.5" fill={NAVY} /><circle cx="46" cy="52" r="4.5" fill={NAVY} />
      </svg>
      <div style={{ position: "absolute", top: -14, right: -16, minWidth: 40, height: 40, borderRadius: 20, background: TEAL, color: DEEP,
        fontFamily: UI, fontWeight: 800, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>{count}</div>
    </div>
    <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 34, color: NAVY }}>${total.toFixed(2)}</div>
  </div>
);

/* ---------- 1. Phone feed ---------- */
const PhoneFeed: React.FC<{ t: number }> = ({ t }) => {
  const idx = Math.max(0, FEED_T.filter((x) => t >= x).length - 1);
  const swipe = lin(t, FEED_T[idx], FEED_T[idx] + 0.16, 0, 1, Easing.out(Easing.cubic));
  const pos = (idx - 1 + swipe) * 1; // feed index being shown (with swipe progress)
  const enter = sp(t, 0, 13);
  const W = 640, H = 1180;
  const heart = sp(t, FEED_T[idx] + 0.2, 8);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 520, width: W + 36, height: H + 36, borderRadius: 90, background: "#111", padding: 18,
        boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 3px #333`, transform: `translateY(${(1 - enter) * 900}px) rotate(${(1 - enter) * 8}deg)` }}>
        <div style={{ position: "relative", width: W, height: H, borderRadius: 72, overflow: "hidden", background: "#000" }}>
          {FEED.map((p, i) => (
            <div key={p.img} style={{ position: "absolute", left: 0, top: (i - Math.max(0, pos)) * H, width: W, height: H }}>
              <Img src={shot(p.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7))" }} />
              <div style={{ position: "absolute", left: 30, bottom: 50, right: 120, fontFamily: UI, color: WHITE }}>
                <div style={{ fontWeight: 800, fontSize: 32 }}>@buyr.store</div>
                <div style={{ fontWeight: 600, fontSize: 30, marginTop: 6 }}>{p.name} #tiktokmademebuyit</div>
              </div>
              <div style={{ position: "absolute", right: 22, bottom: 160, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: UI, fontWeight: 800, color: WHITE, fontSize: 26 }}>
                <svg width="70" height="64" viewBox="0 0 24 22" style={{ transform: i === idx ? `scale(${1 + heart * 0.25})` : undefined }}>
                  <path d="M12 21s-8-5.2-10.3-10A5.6 5.6 0 0 1 12 4.6 5.6 5.6 0 0 1 22.3 11C20 15.8 12 21 12 21z" fill={i === idx && heart > 0.2 ? "#FE2C55" : WHITE} />
                </svg>
                {p.likes}
              </div>
            </div>
          ))}
          {/* notch */}
          <div style={{ position: "absolute", top: 18, left: W / 2 - 80, width: 160, height: 44, borderRadius: 22, background: "#000" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 2. Logo beat ---------- */
const LogoBeat: React.FC<{ t: number }> = ({ t }) => {
  const s = sp(t, 2.9, 8, 0.6, 200);
  return (
    <AbsoluteFill style={{ background: TEAL, alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${t * 90}deg, rgba(255,255,255,0.18) 0deg 8deg, transparent 8deg 16deg)` }} />
      <div style={{ padding: "50px 80px", background: WHITE, borderRadius: 60, transform: `scale(${s}) rotate(${(1 - s) * -14}deg)`, boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}>
        <Img src={staticFile("buyr/logo.png")} style={{ width: 520, display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 1240, fontFamily: DISPLAY, fontSize: 130, color: DEEP, transform: `scale(${sp(t, 2.95, 10)})` }}>HAS IT ALL.</div>
    </AbsoluteFill>
  );
};

/* ---------- 3. Add-to-cart cards ---------- */
const ProductCard: React.FC<{ t: number; c: typeof CARDS[number]; end: number }> = ({ t, c, end }) => {
  const enter = sp(t, c.t, 14);
  const tapT = c.t + 0.6; // button tap on the second beat of the card
  const tapped = t >= tapT;
  const press = t >= tapT && t < tapT + 0.12 ? 0.9 : 1;
  const fly = lin(t, end - 0.28, end, 0, 1, Easing.in(Easing.cubic)); // card flies to the cart
  const cursor = lin(t, c.t + 0.25, tapT, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{
        position: "absolute", top: 300, width: 860, borderRadius: 56, background: WHITE, padding: 30, boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
        transform: `translate(${fly * 380}px, ${-fly * 700}px) scale(${(0.6 + 0.4 * enter) * (1 - fly * 0.85)}) rotate(${(1 - enter) * 6}deg)`,
        opacity: 1 - fly * 0.6,
      }}>
        <div style={{ width: 800, height: 800, borderRadius: 36, overflow: "hidden", background: "#F1F5F9" }}>
          <Img src={shot(c.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - 0.08 * lin(t, c.t, end)})` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, padding: "0 10px" }}>
          <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 46, color: NAVY, maxWidth: 520, lineHeight: 1.1 }}>{c.name}</div>
          <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 56, color: TEAL }}>${c.price}</div>
        </div>
        <div style={{ marginTop: 26, height: 120, borderRadius: 30, background: tapped ? NAVY : TEAL, color: tapped ? TEAL : DEEP,
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontWeight: 800, fontSize: 48, transform: `scale(${press})` }}>
          {tapped ? "ADDED ✓" : "ADD TO CART"}
        </div>
        {/* tapping finger/cursor */}
        {!tapped || t < tapT + 0.3 ? (
          <div style={{ position: "absolute", left: 600 - cursor * 140, top: 1180 - cursor * 120, width: 70, height: 70, borderRadius: 35,
            background: "rgba(255,255,255,0.85)", border: `6px solid ${NAVY}`, transform: `scale(${press === 0.9 ? 0.75 : 1})`, opacity: cursor }} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 4–6. The box ---------- */
const BOX_W = 620, BOX_H = 430, BOX_TOP = 1130; // front face position (centre column)
const Box: React.FC<{ t: number }> = ({ t }) => {
  const enter = sp(t, BOX_START - 0.25, 14);
  const close = lin(t, LID_CLOSE, LID_CLOSE + 0.6, 0, 1, Easing.inOut(Easing.cubic));
  const open = lin(t, SHIP_END + 0.15, SHIP_END + 0.55, 0, 1, Easing.out(Easing.back(1.6)));
  const lid = close * (1 - open); // 0 open, 1 closed
  // riser shake + post-drop travel bounce
  const riser = t >= LID_CLOSE && t < DROP ? lin(t, LID_CLOSE, DROP) : 0;
  const shake = riser * 14 * Math.sin(t * 95);
  const travelling = t >= DROP && t < SHIP_END;
  const bounce = travelling ? -Math.abs(Math.sin(((t - 0.05) / BEAT) * Math.PI)) * 34 : 0;
  const tilt = travelling ? Math.sin(((t - 0.05) / BEAT) * Math.PI) * 3 : 0;
  const label = sp(t, DROP + 0.05, 9, 0.5, 220);
  const left = 540 - BOX_W / 2;
  const visibleDrops = DROPS.filter((d) => t >= d.t - 0.22);
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${(1 - enter) * 1100 + bounce + lin(t, SHIP_END + 0.5, SHIP_END + 1.1) * 520}px) rotate(${tilt}deg)`, transformOrigin: "540px 1500px" }}>
      {/* shadow */}
      <div style={{ position: "absolute", left: left - 30, top: BOX_TOP + BOX_H - 10, width: BOX_W + 60, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.45)", filter: "blur(18px)" }} />
      {/* inside back wall */}
      <div style={{ position: "absolute", left, top: BOX_TOP - 120, width: BOX_W, height: 140, background: "#0A1222", borderRadius: "16px 16px 0 0", border: `4px solid #1E293B` }} />
      {/* products that have dropped in (peeking over the rim) */}
      {visibleDrops.map((d, i) => {
        const fall = lin(t, d.t - 0.22, d.t, 0, 1, Easing.in(Easing.quad));
        const settle = sp(t, d.t, 7, 0.5, 220);
        const x = 540 + (random(`x${i}`) - 0.5) * 360;
        const restY = BOX_TOP - 90 - (i % 3) * 18 + Math.floor(i / 3) * 40;
        const y = interpolate(fall, [0, 1], [-500, restY]) + (1 - settle) * 30;
        const sink = lin(t, LID_CLOSE, LID_CLOSE + 0.4) * 300; // pushed down when the lid closes
        return <Img key={d.img} src={cut(d.img)} style={{ position: "absolute", left: x - 150, top: y - 150 + sink, width: 300, height: 300, objectFit: "contain",
          transform: `rotate(${(random(`r${i}`) - 0.5) * 40}deg)`, filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.45))" }} />;
      })}
      {/* front face */}
      <div style={{ position: "absolute", left, top: BOX_TOP, width: BOX_W, height: BOX_H, borderRadius: "10px 10px 26px 26px",
        background: `linear-gradient(180deg, #1B2A44, ${NAVY})`, border: `4px solid #24365A`, boxShadow: "inset 0 -30px 60px rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ padding: "20px 34px", background: WHITE, borderRadius: 24, transform: "rotate(-2deg)" }}>
          <Img src={staticFile("buyr/logo.png")} style={{ width: 260, display: "block" }} />
        </div>
        {/* tape */}
        <div style={{ position: "absolute", top: -4, left: BOX_W / 2 - 50, width: 100, height: 70, background: `${TEAL}cc` }} />
        {/* FREE SHIPPING label slapped on at the drop */}
        {t >= DROP && (
          <div style={{ position: "absolute", right: -40, top: -60, padding: "18px 26px", background: YELLOW, color: DEEP, borderRadius: 16,
            fontFamily: DISPLAY, fontSize: 64, lineHeight: 1, border: `5px solid ${DEEP}`, transform: `scale(${2.2 - 1.2 * label}) rotate(${12 - 4 * label}deg)`, opacity: Math.min(1, label * 1.5) }}>
            FREE<br />SHIPPING
          </div>
        )}
      </div>
      {/* flaps (hinged on the left and right top edges) */}
      {[-1, 1].map((side) => (
        <div key={side} style={{
          position: "absolute", top: BOX_TOP - 170, left: side < 0 ? left : left + BOX_W / 2, width: BOX_W / 2, height: 170,
          background: `linear-gradient(${side < 0 ? 90 : 270}deg, #2B4170, #1B2A44)`, border: "4px solid #24365A",
          borderRadius: side < 0 ? "14px 4px 0 0" : "4px 14px 0 0",
          transformOrigin: side < 0 ? "0% 100%" : "100% 100%",
          transform: `rotate(${side * 32 * (1 - lid)}deg) scaleY(${1 - 0.88 * lid})`,
        }} />
      ))}
    </AbsoluteFill>
  );
};

/* speed lines + road while the box travels */
const Speed: React.FC<{ t: number }> = ({ t }) => {
  if (t < DROP || t >= SHIP_END + 0.3) return null;
  const k = lin(t, DROP, DROP + 0.4) * (1 - lin(t, SHIP_END - 0.2, SHIP_END + 0.3));
  return (
    <AbsoluteFill style={{ opacity: k, overflow: "hidden" }}>
      {Array.from({ length: 26 }, (_, i) => {
        const y = random(`ly${i}`) * 1920;
        const len = 200 + random(`ll${i}`) * 500;
        const x = 1080 - (((t * (2600 + random(`lv${i}`) * 1800)) + random(`lx${i}`) * 3000) % 3000);
        return <div key={i} style={{ position: "absolute", top: y, left: x, width: len, height: 6 + random(`lh${i}`) * 8, borderRadius: 6,
          background: i % 4 === 0 ? TEAL : "rgba(255,255,255,0.35)" }} />;
      })}
      {/* road */}
      <div style={{ position: "absolute", top: 1560, left: 0, right: 0, height: 360, background: "#0B1220", borderTop: `6px solid ${TEAL}` }} />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ position: "absolute", top: 1720, left: ((i * 300 - t * 2400) % 2400 + 2400) % 2400 - 300, width: 160, height: 18, background: YELLOW, borderRadius: 9 }} />
      ))}
    </AbsoluteFill>
  );
};

/* products whooshing past the moving box (each once) */
const FlyBy: React.FC<{ t: number }> = ({ t }) => (
  <>
    {FLYBY.map((p, i) => {
      const d = t - p.t;
      if (d < 0 || d > 0.6) return null;
      const k = d / 0.6;
      const fromRight = i % 2 === 0;
      const x = fromRight ? interpolate(k, [0, 1], [1100, -500]) : interpolate(k, [0, 1], [-500, 1100]);
      const y = 470 + (i % 2) * 90;
      const s = interpolate(k, [0, 0.5, 1], [0.6, 1, 0.8]);
      return <Img key={p.img} src={cut(p.img)} style={{ position: "absolute", left: x, top: y, width: 420, height: 420, objectFit: "contain",
        transform: `scale(${s}) rotate(${(fromRight ? -1 : 1) * k * 40}deg)`, filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))" }} />;
    })}
  </>
);

/* ---------- 7. Unbox / CTA ---------- */
const Unbox: React.FC<{ t: number }> = ({ t }) => {
  if (t < SHIP_END) return null;
  const burst = lin(t, SHIP_END + 0.3, SHIP_END + 0.9);
  const logo = sp(t, SHIP_END + 0.45, 10);
  const url = sp(t, beat(36), 10);
  const handles = sp(t, beat(37), 12);
  const pulse = env(t, HITS, 10);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", left: 540 - 700, top: 530 - 700, width: 1400, height: 1400, borderRadius: "50%",
        background: `repeating-conic-gradient(from ${t * 40}deg, ${TEAL}55 0deg 9deg, transparent 9deg 18deg)`,
        maskImage: "radial-gradient(circle, black 20%, transparent 65%)", WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 65%)",
        transform: `scale(${burst})`, opacity: burst }} />
      <div style={{ position: "absolute", top: interpolate(logo, [0, 1], [BOX_TOP - 60, 330]), padding: "44px 70px", background: WHITE, borderRadius: 56,
        transform: `scale(${(0.3 + 0.7 * logo) * (1 + pulse * 0.05)})`, boxShadow: `0 0 ${60 + pulse * 120}px ${TEAL}` }}>
        <Img src={staticFile("buyr/logo.png")} style={{ width: 500, display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 760, fontFamily: DISPLAY, fontSize: 110, color: WHITE, textAlign: "center", lineHeight: 1, opacity: logo,
        transform: `translateY(${(1 - logo) * 40}px)` }}>
        TRENDING FINDS.<br /><span style={{ color: TEAL }}>SHIPPED FREE.</span>
      </div>
      <div style={{ position: "absolute", top: 1030, padding: "26px 64px", borderRadius: 999, background: TEAL, color: DEEP, fontFamily: UI, fontWeight: 800,
        fontSize: 70, transform: `scale(${url * (1 + pulse * 0.05)})` }}>buyrshop.com</div>
      <div style={{ position: "absolute", top: 1220, fontFamily: UI, fontWeight: 800, fontSize: 42, color: WHITE, opacity: handles, textAlign: "center" }}>
        TikTok @buyr.store · IG @buyrr.store
      </div>
    </AbsoluteFill>
  );
};

/* ---------- background & FX ---------- */
const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const strobe = t >= LID_CLOSE && t < DROP && Math.floor(t * 15) % 2 === 0;
  const travel = t >= DROP && t < SHIP_END;
  const bg = t < 2.9 ? `radial-gradient(circle at 50% 30%, #2A1B4A, ${DEEP} 70%)`
    : t < BOX_START ? `radial-gradient(circle at 50% 40%, #12324A, ${DEEP} 75%)`
    : strobe ? NAVY : travel ? `linear-gradient(180deg, #0B2B3A, ${DEEP})` : `radial-gradient(circle at 50% 60%, ${NAVY}, ${DEEP} 75%)`;
  return <AbsoluteFill style={{ background: bg }} />;
};

const FX: React.FC<{ t: number; fr: number }> = ({ t, fr }) => {
  const flash = env(t, HITS, 16, 0.25);
  const drop = t >= DROP && t < DROP + 0.5 ? Math.exp(-(t - DROP) * 6) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: WHITE, opacity: Math.max(flash * 0.28, drop) }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.55)" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("buyr/noise.png")})`, mixBlendMode: "overlay", opacity: 0.6,
        backgroundPosition: `${Math.floor(random(`gx${fr}`) * 512)}px ${Math.floor(random(`gy${fr}`) * 512)}px` }} />
    </AbsoluteFill>
  );
};

/* ---------- main ---------- */
export const BuyrStory: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const hit = env(t, HITS, 14);
  const shake = t >= DROP && t < SHIP_END ? hit * 10 : t < 3.34 ? hit * 8 : 0;
  const sx = (random(`sx${fr}`) - 0.5) * 2 * shake, sy = (random(`sy${fr}`) - 0.5) * 2 * shake;

  // cart: 4 cards, then each item dropped into the box
  const added = [...CARDS.map((c, i) => ({ at: (CARDS[i + 1]?.t ?? BOX_START), price: c.price })), ...DROPS.map((d) => ({ at: d.t, price: d.price }))];
  const inCart = added.filter((a) => t >= a.at);
  const lastAdd = inCart.length ? inCart[inCart.length - 1].at : -9;
  const bump = t - lastAdd < 0.3 ? Math.exp(-(t - lastAdd) * 12) : 0;
  const cardIdx = CARDS.findIndex((c, i) => t >= c.t && t < (CARDS[i + 1]?.t ?? BOX_START));
  const dropName = [...DROPS].reverse().find((d) => t >= d.t && t < d.t + 0.55 && t < LID_CLOSE);

  return (
    <AbsoluteFill style={{ backgroundColor: DEEP, overflow: "hidden" }}>
      <Backdrop t={t} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${1 + hit * 0.03})` }}>
        {t < 2.9 && <PhoneFeed t={t} />}
        {t < 2.9 && <Words t={t} y={170} size={190} until={2.9} list={[[0.05, "SAW IT"], [0.65, "ON"], [1.25, "TIKTOK?", TEAL], [1.86, "TIKTOK?", TEAL], [2.45, "WANT IT?", YELLOW]]} />}
        {t >= 2.9 && t < 3.34 && <LogoBeat t={t} />}
        {cardIdx >= 0 && <ProductCard t={t} c={CARDS[cardIdx]} end={CARDS[cardIdx + 1]?.t ?? BOX_START} />}
        {t >= BOX_START - 0.25 && <Speed t={t} />}
        {t >= BOX_START - 0.25 && <Box t={t} />}
        {t >= BOX_START && t < DROP && (
          <Words t={t} y={260} size={170} until={DROP} list={[[7.85, "WEIRD."], [8.45, "FUNNY."], [9.06, "VIRAL.", YELLOW], [9.65, "PACK", TEAL], [10.25, "IT"], [10.85, "ALL", TEAL], [11.45, "IN"], [12.05, "ONE", TEAL], [12.65, "BOX!", YELLOW], [LID_CLOSE, "READY?", YELLOW]]} />
        )}
        {dropName && (
          <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: UI, fontWeight: 800, fontSize: 52, color: WHITE,
            opacity: lin(t, dropName.t, dropName.t + 0.08), textShadow: "0 4px 20px #000" }}>
            + {dropName.name} <span style={{ color: TEAL }}>${dropName.price}</span>
          </div>
        )}
        {t >= DROP && t < SHIP_END && <FlyBy t={t} />}
        {t >= DROP && t < SHIP_END && (
          <Words t={t} y={210} size={200} until={SHIP_END} list={[
            [DROP, "FREE", YELLOW], [beat(25), "SHIPPING", YELLOW], [beat(26), "ALL US", WHITE], [beat(27), "ORDERS"], [beat(28), "SHIPS IN"],
            [beat(29), "1–2 DAYS", TEAL], [beat(30), "TRACKED"], [beat(31), "TO YOUR", WHITE], [beat(32), "DOOR", TEAL], [beat(33), "UNBOX IT", YELLOW]]} />
        )}
        <Unbox t={t} />
      </AbsoluteFill>
      {t >= 3.34 && t < LID_CLOSE + 0.6 && <CartIcon t={t} count={inCart.length} total={inCart.reduce((a, b) => a + b.price, 0)} bump={bump} />}
      <FX t={t} fr={fr} />
      <Audio src={staticFile("buyr/track.mp3")} volume={(f2) => interpolate(f2, [STORY_DURATION - 20, STORY_DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
