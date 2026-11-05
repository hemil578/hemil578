/**
 * Buyr — beat-synced music edit (no voiceover).
 * Track: public/buyr/track.mp3, 100 BPM (one beat = 0.6 s), first hit at 0.05 s, drop at 14.44 s.
 * Every shot change, text slam, flash and shake is placed on that beat grid.
 */
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, Easing, random,
} from "remotion";

const { fontFamily: DISPLAY } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: BODY } = loadJakarta("normal", { weights: ["800"], subsets: ["latin"] });

const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
export const BEAT_EDIT_DURATION = f(24.63);

const NAVY = "#0F172A", DEEP = "#060E1A", TEAL = "#00C9A7", WHITE = "#FFFFFF";
const PINK = "#FF5DA2", YELLOW = "#FFD23F", CORAL = "#FF6B4A", PURPLE = "#7B5CFF";

const BEAT = 0.6, B0 = 0.05, DROP = 14.44;
const beat = (k: number) => +(B0 + k * BEAT).toFixed(3);

// Hits that get a flash. Before the drop: the measured hits. After: every beat.
const HITS = [0.05, 0.65, 1.25, 1.86, 2.9, 3.34, 7.85, 8.45, 9.06, 13.56, DROP,
  ...Array.from({ length: 17 }, (_, i) => beat(24 + i))];

const env = (t: number, times: number[], decay = 12, win = 0.35) => {
  let v = 0;
  for (const h of times) { const d = t - h; if (d >= 0 && d < win) v = Math.max(v, Math.exp(-d * decay)); }
  return v;
};

const shot = (name: string) => staticFile(`buyr/shots/${name}.jpg`);
const cut = (name: string) => staticFile(`buyr/cut/${name}.png`);

/* ======================= Shot types ======================= */

type Shot =
  | { t: number; kind: "full"; src: string; move?: "push" | "pull" | "panL" | "panR"; label?: string; price?: string }
  | { t: number; kind: "cut"; src: string; bg: string; spin?: number }
  | { t: number; kind: "logo" }
  | { t: number; kind: "riser" }
  | { t: number; kind: "cta" };

/** Full-screen photo: punch-in on the cut, then a slow camera move. Whip-blur on entry. */
const FullShot: React.FC<{ src: string; move?: string; dur: number; label?: string; price?: string }> = ({ src, move = "push", dur, label, price }) => {
  const fr = useCurrentFrame();
  const p = fr / Math.max(1, dur);
  const punch = interpolate(fr, [0, 5], [1.25, 1.0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const drift = move === "pull" ? 1.12 - 0.12 * p : 1 + 0.12 * p;
  const pan = move === "panL" ? 60 - 120 * p : move === "panR" ? -60 + 120 * p : 0;
  const blur = interpolate(fr, [0, 4], [18, 0], { extrapolateRight: "clamp" });
  const tag = spring({ frame: fr - 4, fps: FPS, config: { damping: 11, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: DEEP, overflow: "hidden" }}>
      {/* blurred fill so any aspect ratio covers 9:16 */}
      <Img src={src} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.6)", transform: "scale(1.3)" }} />
      <Img src={src} style={{
        position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        transform: `scale(${punch * drift}) translateX(${pan}px)`, filter: `blur(${blur}px)`,
      }} />
      {/* bottom gradient for the label */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 55%, rgba(6,14,26,0.85) 100%)" }} />
      {label && (
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 250, transform: `translateY(${(1 - tag) * 120}px)`, opacity: tag }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 120, color: WHITE, lineHeight: 0.95, textTransform: "uppercase", textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>{label}</div>
          {price && <div style={{
            display: "inline-block", marginTop: 18, padding: "10px 30px", borderRadius: 18, background: TEAL,
            color: DEEP, fontFamily: BODY, fontSize: 64, transform: `rotate(-3deg) scale(${tag})`,
          }}>{price}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Cut-out product slamming onto a flat colour with echo trails and RGB split. */
const CutShot: React.FC<{ src: string; bg: string; spin?: number }> = ({ src, bg, spin = 0 }) => {
  const fr = useCurrentFrame();
  const s = spring({ frame: fr, fps: FPS, config: { damping: 9, mass: 0.5, stiffness: 180 } });
  const rot = (1 - s) * (spin || 25) + Math.sin(fr / 6) * 2;
  const split = interpolate(fr, [0, 6], [22, 0], { extrapolateRight: "clamp" });
  const bob = Math.sin(fr / 5) * 12;
  const ring = interpolate(fr, [0, 12], [0.2, 2.2], { extrapolateRight: "clamp" });
  const ringO = interpolate(fr, [0, 12], [0.7, 0], { extrapolateRight: "clamp" });
  const img = (extra: React.CSSProperties) => (
    <Img src={src} style={{ position: "absolute", width: 820, height: 820, objectFit: "contain", ...extra }} />
  );
  return (
    <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* sunburst rays */}
      <AbsoluteFill style={{
        background: `repeating-conic-gradient(from ${fr * 2}deg, rgba(255,255,255,0.10) 0deg 10deg, transparent 10deg 20deg)`,
      }} />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", border: "18px solid white", transform: `translateY(-170px) scale(${ring})`, opacity: ringO }} />
      <div style={{ position: "relative", width: 900, height: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${bob - 170}px) scale(${0.3 + 0.7 * s}) rotate(${rot}deg)` }}>
        {img({ opacity: 0.25, transform: "scale(1.25)" })}
        {split > 0.5 && img({ transform: `translateX(${split}px)`, filter: "drop-shadow(0 0 0 #FF0050) opacity(0.6)", mixBlendMode: "screen" })}
        {split > 0.5 && img({ transform: `translateX(${-split}px)`, filter: "opacity(0.6) hue-rotate(180deg)", mixBlendMode: "screen" })}
        {img({ filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.45))" })}
      </div>
    </AbsoluteFill>
  );
};

const LogoShot: React.FC = () => {
  const fr = useCurrentFrame();
  const s = spring({ frame: fr, fps: FPS, config: { damping: 8, mass: 0.6, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: TEAL, alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${fr * 3}deg, rgba(255,255,255,0.18) 0deg 8deg, transparent 8deg 16deg)` }} />
      <div style={{ padding: "60px 90px", background: WHITE, borderRadius: 70, transform: `scale(${s}) rotate(${(1 - s) * -20}deg)`, boxShadow: "0 40px 100px rgba(0,0,0,0.35)" }}>
        <Img src={staticFile("buyr/logo.png")} style={{ width: 560, display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};

/** Build-up before the drop: grid of shots collapsing into the centre, tunnel zoom. */
const Riser: React.FC<{ dur: number }> = ({ dur }) => {
  const fr = useCurrentFrame();
  const p = fr / dur;
  const tiles = ["nebuladream-galaxy-projector_1", "glow-penguin-plush_2", "seal-plush-slippers_1", "alien-glow-headband_2",
    "light-up-poppy-flower-pot_1", "gear-cube_2", "cat-pop-up-hook_1", "ice-ball-cola-cup_1", "magnetic-jointed-frog_2"];
  const strobe = Math.floor(fr / 2) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: strobe ? DEEP : NAVY, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 340px)", gap: 14, transform: `scale(${1 + p * 2.2}) rotate(${p * 25}deg)` }}>
        {tiles.map((t, i) => (
          <Img key={t} src={shot(t)} style={{ width: 340, height: 340, objectFit: "cover", borderRadius: 24, opacity: fr > i * 1.5 ? 1 : 0 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CTAShot: React.FC = () => {
  const fr = useCurrentFrame();
  const t = (fr + f(20.45)) / FPS;
  const pulse = env(t, HITS, 10);
  const logo = spring({ frame: fr, fps: FPS, config: { damping: 9, mass: 0.6 } });
  const url = spring({ frame: fr - f(BEAT), fps: FPS, config: { damping: 10 } });
  const handle = spring({ frame: fr - f(BEAT * 2), fps: FPS, config: { damping: 12 } });
  const orbit = ["magnetic-jointed-frog_1", "lazy-prism-glasses_2", "seal-plush-slippers_2", "light-up-keyboard-game_1", "slow-rise-butter-squishy_2", "magnetic-jointed-frog_2", "big-feet-slippers_1", "strawberry-ceramic-berry-bowl_1"];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${NAVY}, ${DEEP} 70%)`, alignItems: "center", overflow: "hidden" }}>
      {orbit.map((o, i) => {
        const a = (i / orbit.length) * Math.PI * 2 + fr / 40;
        const r = 470 + Math.sin(fr / 10 + i) * 25;
        return <Img key={o} src={cut(o)} style={{
          position: "absolute", width: 230, height: 230, objectFit: "contain",
          left: 540 + Math.cos(a) * r - 115, top: 900 + Math.sin(a) * r * 1.6 - 115,
          transform: `scale(${(0.9 + pulse * 0.25) * Math.min(1, fr / 10)}) rotate(${Math.sin(fr / 8 + i) * 15}deg)`,
          filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
        }} />;
      })}
      <div style={{ marginTop: 600, padding: "50px 80px", background: WHITE, borderRadius: 60, transform: `scale(${logo * (1 + pulse * 0.06)})`, boxShadow: `0 0 ${80 + pulse * 120}px ${TEAL}` }}>
        <Img src={staticFile("buyr/logo.png")} style={{ width: 520, display: "block" }} />
      </div>
      <div style={{
        marginTop: 70, padding: "28px 70px", borderRadius: 999, background: TEAL, color: DEEP,
        fontFamily: BODY, fontSize: 76, transform: `scale(${url * (1 + pulse * 0.05)})`,
      }}>buyrshop.com</div>
      <div style={{ marginTop: 34, fontFamily: BODY, fontSize: 46, lineHeight: 1.35, color: WHITE, textAlign: "center", opacity: handle, transform: `translateY(${(1 - handle) * 40}px)`, textShadow: "0 4px 20px #060E1A" }}>
        TikTok @buyr.store<br />IG @buyrr.store
      </div>
    </AbsoluteFill>
  );
};

/* ======================= Shot list ======================= */
const SHOTS: Shot[] = [
  // Intro: one product per hit
  { t: 0, kind: "cut", src: cut("magnetic-jointed-frog_2"), bg: TEAL, spin: -30 },
  { t: 0.65, kind: "cut", src: cut("lazy-prism-glasses_2"), bg: PINK, spin: 30 },
  { t: 1.25, kind: "cut", src: cut("old-man-ski-mask_1"), bg: YELLOW, spin: -25 },
  { t: 1.86, kind: "cut", src: cut("seal-plush-slippers_2"), bg: PURPLE, spin: 20 },
  { t: 2.45, kind: "cut", src: cut("light-up-keyboard-game_1"), bg: CORAL, spin: -20 },
  { t: 2.9, kind: "logo" },
  // Build: calmer, two beats per shot, slow camera moves + product label
  { t: 3.34, kind: "full", src: shot("nebuladream-galaxy-projector_1"), move: "push", label: "Galaxy projector", price: "$39.99" },
  { t: 4.55, kind: "full", src: shot("glow-penguin-plush_2"), move: "panR", label: "Glow penguin", price: "$32.99" },
  { t: 5.75, kind: "full", src: shot("seal-plush-slippers_1"), move: "pull", label: "Seal slippers", price: "$39.99" },
  { t: 6.85, kind: "full", src: shot("ice-ball-cola-cup_1"), move: "panL", label: "Ice-ball cup", price: "$19.99" },
  // Three hits: three slams
  { t: 7.85, kind: "cut", src: cut("magnetic-jointed-frog_1"), bg: TEAL, spin: 35 },
  { t: 8.45, kind: "cut", src: cut("big-feet-slippers_1"), bg: PINK, spin: -35 },
  { t: 9.06, kind: "cut", src: cut("gear-cube_1"), bg: YELLOW, spin: 35 },
  // Picking up: one shot per beat
  { t: 9.65, kind: "full", src: shot("alien-glow-headband_2"), move: "push", label: "Alien headband", price: "$29.99" },
  { t: 10.25, kind: "full", src: shot("gengar-tongue-slippers_2"), move: "panR" },
  { t: 10.85, kind: "full", src: shot("light-up-poppy-flower-pot_1"), move: "push", label: "Light-up flower pot", price: "$49.99" },
  { t: 11.45, kind: "full", src: shot("cat-pop-up-hook_1"), move: "pull" },
  { t: 12.05, kind: "full", src: shot("keycap-clicker-keychain_2"), move: "panL", label: "Keycap clicker", price: "$20.99" },
  { t: 12.65, kind: "full", src: shot("dog-raincoat-with-boots_1"), move: "push" },
  { t: 13.25, kind: "riser" },
  // DROP: half-beat cuts, alternating cut-outs and photos
  { t: DROP, kind: "cut", src: cut("magnetic-jointed-frog_2"), bg: TEAL },
  { t: 14.75, kind: "full", src: shot("glow-penguin-plush_2") },
  { t: 15.05, kind: "cut", src: cut("lazy-prism-glasses_2"), bg: PINK },
  { t: 15.35, kind: "full", src: shot("nebuladream-galaxy-projector_2") },
  { t: 15.65, kind: "cut", src: cut("slow-rise-butter-squishy_2"), bg: PURPLE },
  { t: 15.95, kind: "full", src: shot("strawberry-ceramic-berry-bowl_2") },
  { t: 16.25, kind: "cut", src: cut("old-man-ski-mask_1"), bg: YELLOW },
  { t: 16.55, kind: "full", src: shot("santa-butt-tissue-holder_1") },
  { t: 16.85, kind: "cut", src: cut("light-up-keyboard-game_1"), bg: TEAL },
  { t: 17.15, kind: "full", src: shot("gear-cube_2") },
  { t: 17.45, kind: "cut", src: cut("abs-projector-prank_1"), bg: CORAL },
  { t: 17.75, kind: "full", src: shot("magnetic-jointed-frog_1") },
  { t: 18.05, kind: "cut", src: cut("strawberry-ceramic-berry-bowl_1"), bg: PINK },
  { t: 18.35, kind: "full", src: shot("alien-glow-headband_2") },
  { t: 18.65, kind: "cut", src: cut("seal-plush-slippers_2"), bg: PURPLE },
  { t: 18.95, kind: "full", src: shot("light-up-poppy-flower-pot_1") },
  { t: 19.25, kind: "cut", src: cut("big-feet-slippers_1"), bg: YELLOW },
  { t: 19.55, kind: "full", src: shot("seal-plush-slippers_1") },
  { t: 19.85, kind: "cut", src: cut("magnetic-jointed-frog_1"), bg: TEAL },
  { t: 20.15, kind: "full", src: shot("nebuladream-galaxy-projector_1") },
  { t: 20.45, kind: "cta" },
];

/* ======================= Kinetic words (one per beat) ======================= */
const WORDS: { t: number; text: string; color?: string; size?: number }[] = [
  { t: 0.05, text: "WAIT" }, { t: 0.65, text: "THIS" }, { t: 1.25, text: "IS" }, { t: 1.86, text: "SO" },
  { t: 2.45, text: "VIRAL", color: YELLOW },
  { t: 7.85, text: "WEIRD" }, { t: 8.45, text: "FUNNY" }, { t: 9.06, text: "VIRAL", color: YELLOW },
  { t: 13.25, text: "READY?", size: 230 },
  { t: DROP, text: "FREE", size: 300 }, { t: 15.05, text: "SHIPPING", size: 230 },
  { t: 15.65, text: "ALL", size: 300 }, { t: 16.25, text: "US", size: 320 }, { t: 16.85, text: "ORDERS", size: 250 },
  { t: 17.45, text: "SHIPS IN", size: 230 }, { t: 18.05, text: "1–2 DAYS", size: 230, color: YELLOW },
  { t: 18.65, text: "50+ FINDS", size: 220 }, { t: 19.25, text: "FROM", size: 300 }, { t: 19.85, text: "$9.99", size: 300, color: YELLOW },
];
const WORD_END: Record<number, number> = { 2.45: 2.9, 9.06: 9.65, 13.25: DROP, 19.85: 20.45 };

const KineticWord: React.FC<{ text: string; color?: string; size?: number; low?: boolean }> = ({ text, color = WHITE, size = 260, low }) => {
  const fr = useCurrentFrame();
  const s = interpolate(fr, [0, 4], [1.6, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const blur = interpolate(fr, [0, 3], [12, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: low ? "flex-end" : "center", paddingBottom: low ? 230 : 0, paddingTop: 0, pointerEvents: "none" }}>
      <div style={{
        fontFamily: DISPLAY, fontSize: size, color, lineHeight: 1, letterSpacing: 2, textAlign: "center",
        transform: `scale(${s}) rotate(-4deg)`, filter: `blur(${blur}px)`,
        WebkitTextStroke: "6px #060E1A", paintOrder: "stroke fill",
        textShadow: "0 14px 0 #060E1A, 0 20px 50px rgba(0,0,0,0.5)",
      }}>{text}</div>
    </AbsoluteFill>
  );
};

/* ======================= Global FX ======================= */
const FX: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const flash = env(t, HITS, 16, 0.25);
  const drop = t >= DROP && t < DROP + 0.5 ? Math.exp(-(t - DROP) * 6) : 0;
  const leak = t > 3.34 && t < 7.85; // warm light leak during the calm build
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {leak && <AbsoluteFill style={{
        background: `radial-gradient(circle at ${30 + Math.sin(fr / 14) * 30}% ${20 + Math.cos(fr / 18) * 15}%, rgba(255,140,60,0.35), transparent 55%)`,
        mixBlendMode: "screen",
      }} />}
      <AbsoluteFill style={{ background: WHITE, opacity: Math.max(flash * 0.35, drop) }} />
      {/* vignette */}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.55)" }} />
      {/* film grain */}
      <AbsoluteFill style={{
        backgroundImage: `url(${staticFile("buyr/noise.png")})`,
        backgroundPosition: `${Math.floor(random(`gx${fr}`) * 512)}px ${Math.floor(random(`gy${fr}`) * 512)}px`,
        mixBlendMode: "overlay",
      }} />
    </AbsoluteFill>
  );
};

/** Persistent small logo, hidden on the logo/CTA shots. */
const Bug: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t < 3.34 || t >= 20.45) return null;
  return (
    <div style={{ position: "absolute", top: 80, right: 60, padding: "10px 20px", borderRadius: 18, background: "rgba(255,255,255,0.92)" }}>
      <Img src={staticFile("buyr/logo.png")} style={{ width: 130, display: "block" }} />
    </div>
  );
};

export const BuyrBeatEdit: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const hit = env(t, HITS, 14);
  const shake = t >= DROP && t < 20.45 ? hit * 16 : t < 3.34 ? hit * 10 : 0;
  const sx = (random(`sx${fr}`) - 0.5) * 2 * shake, sy = (random(`sy${fr}`) - 0.5) * 2 * shake;
  const zoomPunch = 1 + hit * 0.04;

  return (
    <AbsoluteFill style={{ backgroundColor: DEEP }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${zoomPunch})` }}>
        {SHOTS.map((s, i) => {
          const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : 24.63;
          const dur = f(end) - f(s.t);
          return (
            <Sequence key={i} from={f(s.t)} durationInFrames={dur}>
              {s.kind === "full" && <FullShot src={s.src} move={s.move} dur={dur} label={s.label} price={s.price} />}
              {s.kind === "cut" && <CutShot src={s.src} bg={s.bg} spin={s.spin} />}
              {s.kind === "logo" && <LogoShot />}
              {s.kind === "riser" && <Riser dur={dur} />}
              {s.kind === "cta" && <CTAShot />}
            </Sequence>
          );
        })}
        {WORDS.map((w, i) => {
          const next = WORD_END[w.t] ?? (i + 1 < WORDS.length ? Math.min(WORDS[i + 1].t, w.t + BEAT) : w.t + BEAT);
          return (
            <Sequence key={`w${i}`} from={f(w.t)} durationInFrames={f(next) - f(w.t)}>
              <KineticWord text={w.text} color={w.color} size={w.size} low={w.t < 13 || w.t >= DROP} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Bug />
      <FX />
      <Audio src={staticFile("buyr/track.mp3")} volume={(fr2) => interpolate(fr2, [BEAT_EDIT_DURATION - 20, BEAT_EDIT_DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
