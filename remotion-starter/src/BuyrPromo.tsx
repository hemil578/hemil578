import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

// Brand colours, taken from buyrshop.com
const NAVY = "#0F172A", DEEP = "#060E1A", TEAL = "#00C9A7", TEAL2 = "#00A896";
const WHITE = "#FFFFFF", SLATE = "#94A3B8";
const FPS = 30;
const s2f = (s: number) => Math.round(s * FPS);

// Voice lines (start, duration in seconds) from public/buyr/voice.json
const LINES: [string, number, number][] = [
  ["Seen it on TikTok? We've got it.", 0.3, 2.58],
  ["Shadow lamps that light up your wall.", 3.23, 2.38],
  ["Super cozy seal slippers.", 5.95, 2.25],
  ["A galaxy, right on your ceiling.", 8.55, 2.42],
  ["And fun gifts they'll actually love.", 11.33, 2.42],
  ["Free tracked shipping across the US, and orders ship in 1–2 days.", 14.1, 4.58],
  ["Trending finds, shipped free. Shop now at buyrshop.com", 19.03, 4.33],
];

export const BUYR_DURATION = s2f(25.5);

const useSpring = (delay: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });
};

/* ---------- Background: navy gradient with drifting teal glows ---------- */
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const glow = (x: number, y: number, r: number, o: number) => (
    <div style={{
      position: "absolute", left: x - r / 2, top: y - r / 2, width: r, height: r, borderRadius: "50%",
      background: `radial-gradient(circle, ${TEAL}${o.toString(16).padStart(2, "0")}, transparent 65%)`,
    }} />
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DEEP} 0%, ${NAVY} 55%, ${DEEP} 100%)` }}>
      {glow(200 + Math.sin(f / 45) * 140, 500 + Math.cos(f / 60) * 200, 900, 0x30)}
      {glow(900 + Math.cos(f / 50) * 120, 1400 + Math.sin(f / 40) * 160, 1000, 0x26)}
      {/* subtle dot grid */}
      <AbsoluteFill style={{
        backgroundImage: `radial-gradient(${WHITE}14 2px, transparent 2px)`,
        backgroundSize: "60px 60px", backgroundPosition: `0 ${-(f * 0.6) % 60}px`,
      }} />
    </AbsoluteFill>
  );
};

/* ---------- Small pieces ---------- */
const Pill: React.FC<{ text: string; delay?: number; solid?: boolean }> = ({ text, delay = 0, solid = true }) => {
  const s = useSpring(delay);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 14, padding: "16px 34px", borderRadius: 999,
      background: solid ? TEAL : "transparent", border: solid ? "none" : `3px solid ${TEAL}`,
      color: solid ? DEEP : TEAL, fontWeight: 800, fontSize: 38, letterSpacing: 2,
      transform: `scale(${s})`, opacity: s,
    }}>{text}</div>
  );
};

const BigWord: React.FC<{ text: string; delay: number; color?: string; size?: number }> = ({ text, delay, color = WHITE, size = 150 }) => {
  const s = useSpring(delay, 12);
  return (
    <div style={{
      fontSize: size, fontWeight: 800, color, lineHeight: 1.0, letterSpacing: -3,
      transform: `translateY(${(1 - s) * 90}px) scale(${0.85 + 0.15 * s})`, opacity: s,
    }}>{text}</div>
  );
};

/** Quick teal wipe used as a transition at the start of each scene. */
const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  // A skewed teal band sweeps left-to-right across the frame.
  const x = interpolate(f, [0, 12], [-130, 130], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  if (f > 12) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -200, bottom: -200, left: "30%", width: "40%",
        background: TEAL, transform: `translateX(${x * 2.5}%) skewX(-15deg)` }} />
    </AbsoluteFill>
  );
};

/* ---------- Captions (TikTok style: 2-3 words at a time, current word highlighted) ---------- */
const CHUNK = 3;
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const line = LINES.slice(1).find(([, st, d]) => t >= st && t < st + d + 0.25); // hook has its own big text
  if (!line) return null;
  const [text, st, d] = line;
  const words = text.split(" ");
  // Weight each word by its length so timing follows speech more closely.
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  const elapsed = Math.min(1, Math.max(0, (t - st) / d)) * total;
  let active = 0, acc = 0;
  for (let i = 0; i < words.length; i++) { acc += weights[i]; if (elapsed < acc) { active = i; break; } active = i; }
  const chunkStart = Math.floor(active / CHUNK) * CHUNK;
  const chunk = words.slice(chunkStart, chunkStart + CHUNK);
  const local = f - Math.round((st + (weights.slice(0, chunkStart).reduce((a, b) => a + b, 0) / total) * d) * FPS);
  const pop = spring({ frame: local, fps: FPS, config: { damping: 12, mass: 0.5 } });
  return (
    <div style={{
      position: "absolute", bottom: 230, left: 50, right: 50, textAlign: "center",
      fontSize: 84, fontWeight: 800, lineHeight: 1.15, color: WHITE, letterSpacing: -1,
      textShadow: "0 6px 24px rgba(0,0,0,0.9)", transform: `scale(${0.8 + 0.2 * pop})`,
    }}>
      {chunk.map((w, i) => {
        const on = chunkStart + i === active;
        return (
          <span key={i} style={{
            display: "inline-block", color: on ? DEEP : WHITE, background: on ? TEAL : "transparent",
            borderRadius: 16, padding: "2px 16px", margin: "4px 4px", textShadow: on ? "none" : undefined,
          }}>{w}</span>
        );
      })}
    </div>
  );
};

/* ---------- Scenes ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const s = useSpring(4, 16);
  const zoom = interpolate(f, [0, 95], [1.0, 1.12]);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ marginTop: 210, textAlign: "center" }}>
        <BigWord text="SEEN IT ON" delay={2} size={110} />
        <BigWord text="TIKTOK?" delay={10} size={180} color={TEAL} />
      </div>
      <div style={{
        marginTop: 50, width: 900, height: 900, borderRadius: 48, overflow: "hidden",
        boxShadow: `0 30px 90px ${TEAL}55`, transform: `translateY(${(1 - s) * 400}px) rotate(${(1 - s) * -8}deg)`,
        opacity: s,
      }}>
        <Img src={staticFile("buyr/hero.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
      </div>
      <div style={{ marginTop: 40 }}><BigWord text="We've got it." delay={45} size={90} /></div>
    </AbsoluteFill>
  );
};

const Product: React.FC<{ img: string; label: string; price: string; dir: 1 | -1 }> = ({ img, label, price, dir }) => {
  const f = useCurrentFrame();
  const s = useSpring(3, 15);
  const p = useSpring(18, 9);
  const float = Math.sin(f / 12) * 10;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ marginTop: 200 }}><Pill text="TRENDING NOW" delay={4} /></div>
      <div style={{ marginTop: 30, fontSize: 70, fontWeight: 800, color: WHITE, opacity: s, letterSpacing: -1 }}>{label}</div>
      <div style={{
        position: "relative", marginTop: 50, width: 900, height: 900,
        transform: `translateX(${(1 - s) * 1100 * dir}px) rotate(${(1 - s) * 12 * dir + Math.sin(f / 25) * 1.2}deg) translateY(${float}px)`,
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 48, overflow: "hidden", boxShadow: `0 30px 90px rgba(0,0,0,0.6), 0 0 0 4px ${TEAL}66` }}>
          <Img src={staticFile(`buyr/${img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{
          position: "absolute", right: -30, bottom: -40, padding: "22px 40px", borderRadius: 28,
          background: TEAL, color: DEEP, fontSize: 76, fontWeight: 800, letterSpacing: -1,
          transform: `scale(${p}) rotate(-6deg)`, boxShadow: `0 16px 40px ${TEAL}66`,
        }}>{price}</div>
      </div>
    </AbsoluteFill>
  );
};

const Icon: React.FC<{ kind: "truck" | "bolt" | "lock" }> = ({ kind }) => {
  const st = { fill: "none", stroke: DEEP, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="90" height="90" viewBox="0 0 100 100">
      {kind === "truck" && (<g {...st}><rect x="8" y="28" width="52" height="38" rx="4" /><path d="M60 40h18l12 14v12H60z" /><circle cx="28" cy="72" r="8" fill={TEAL} /><circle cx="74" cy="72" r="8" fill={TEAL} /></g>)}
      {kind === "bolt" && (<g {...st}><path d="M56 8 22 56h24l-6 36 36-50H52z" /></g>)}
      {kind === "lock" && (<g {...st}><rect x="20" y="44" width="60" height="44" rx="8" /><path d="M32 44V32a18 18 0 0 1 36 0v12" /><circle cx="50" cy="66" r="5" fill={DEEP} /></g>)}
    </svg>
  );
};

const Benefits: React.FC = () => {
  const rows: [React.ComponentProps<typeof Icon>["kind"], string, string][] = [
    ["truck", "Free tracked shipping", "On every US order"],
    ["bolt", "Ships in 1–2 days", "Delivered in 7–14 business days"],
    ["lock", "Secure checkout", "Apple Pay · PayPal · Cards"],
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ marginTop: 260, textAlign: "center" }}>
        <BigWord text="Why" delay={2} size={110} />
        <BigWord text="Buyr?" delay={8} size={170} color={TEAL} />
      </div>
      <div style={{ marginTop: 80, display: "flex", flexDirection: "column", gap: 44 }}>
        {rows.map(([icon, title, sub], i) => <BenefitRow key={i} icon={icon} title={title} sub={sub} delay={14 + i * 14} />)}
      </div>
    </AbsoluteFill>
  );
};

const BenefitRow: React.FC<{ icon: React.ComponentProps<typeof Icon>["kind"]; title: string; sub: string; delay: number }> = ({ icon, title, sub, delay }) => {
  const s = useSpring(delay, 14);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 36, width: 900, padding: "34px 40px", borderRadius: 36,
      background: "rgba(255,255,255,0.06)", border: `2px solid ${TEAL}55`,
      transform: `translateX(${(1 - s) * -1000}px)`, opacity: s,
    }}>
      <div style={{ width: 130, height: 130, borderRadius: 32, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon kind={icon} />
      </div>
      <div>
        <div style={{ fontSize: 56, fontWeight: 800, color: WHITE, letterSpacing: -1 }}>{title}</div>
        <div style={{ fontSize: 36, fontWeight: 500, color: SLATE, marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const logo = useSpring(3, 12);
  const pulse = 1 + Math.max(0, Math.sin((f - 40) / 6)) * 0.04;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{
        marginTop: 300, padding: "60px 90px", borderRadius: 60, background: WHITE,
        transform: `scale(${logo}) rotate(${(1 - logo) * -10}deg)`, boxShadow: `0 30px 100px ${TEAL}66`,
      }}>
        <Img src={staticFile("buyr/logo.png")} style={{ width: 560 }} />
      </div>
      <div style={{ marginTop: 90, textAlign: "center" }}>
        <BigWord text="Trending finds." delay={16} size={100} />
        <BigWord text="Shipped free." delay={24} size={100} color={TEAL} />
      </div>
      <div style={{ marginTop: 80, transform: `scale(${useSpring(40, 10) * pulse})` }}>
        <div style={{
          padding: "34px 80px", borderRadius: 999, background: TEAL, color: DEEP,
          fontSize: 72, fontWeight: 800, letterSpacing: -1, boxShadow: `0 20px 60px ${TEAL}77`,
        }}>buyrshop.com</div>
      </div>
      <div style={{ marginTop: 50, display: "flex", gap: 24 }}>
        <Pill text="TikTok @buyr.store" delay={56} solid={false} />
      </div>
      <div style={{ marginTop: 24 }}>
        <Pill text="Instagram @buyrr.store" delay={62} solid={false} />
      </div>
    </AbsoluteFill>
  );
};

/** Small logo badge in the top corner during the middle scenes. */
const CornerLogo: React.FC = () => (
  <div style={{ position: "absolute", top: 70, left: 70, padding: "14px 26px", borderRadius: 24, background: WHITE }}>
    <Img src={staticFile("buyr/logo.png")} style={{ width: 150, display: "block" }} />
  </div>
);

/* ---------- Timeline ---------- */
const SCENES: { from: number; to: number; el: React.ReactNode }[] = [
  { from: 0, to: 3.15, el: <Hook /> },
  { from: 3.15, to: 5.9, el: <Product img="lamp.png" label="Shadow Lamps" price="$29.99" dir={1} /> },
  { from: 5.9, to: 8.5, el: <Product img="slippers.png" label="Seal Plush Slippers" price="$39.99" dir={-1} /> },
  { from: 8.5, to: 11.27, el: <Product img="projector.png" label="Galaxy Projector" price="$39.99" dir={1} /> },
  { from: 11.27, to: 14.03, el: <Product img="switch.png" label="Fun Gifts" price="$22.99" dir={-1} /> },
  { from: 14.03, to: 18.93, el: <Benefits /> },
  { from: 18.93, to: 25.5, el: <CTA /> },
];

// Music: louder in the gaps, ducked under the voice.
const musicVolume = (f: number) => {
  const t = f / FPS;
  const speaking = LINES.some(([, st, d]) => t > st - 0.15 && t < st + d + 0.1);
  const base = speaking ? 0.16 : 0.32;
  const fadeOut = interpolate(f, [BUYR_DURATION - 30, BUYR_DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return base * fadeOut;
};

export const BuyrPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: DEEP }}>
      <Background />
      {SCENES.map(({ from, to, el }, i) => (
        <Sequence key={i} from={s2f(from)} durationInFrames={s2f(to) - s2f(from)}>
          {el}
          {i > 0 && i < SCENES.length - 1 && <CornerLogo />}
          {i > 0 && <Wipe />}
        </Sequence>
      ))}
      <Captions />
      <Audio src={staticFile("buyr/voice.wav")} />
      <Audio src={staticFile("buyr/music.wav")} volume={musicVolume} />
    </AbsoluteFill>
  );
};
