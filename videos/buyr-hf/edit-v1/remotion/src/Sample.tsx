import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

const C = (x: number) => ({ extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: theme.ease.out, ...{} });
const fontCss = `@font-face{font-family:IB;src:url(${staticFile("fonts/Inter-Black.otf")})}@font-face{font-family:IT;src:url(${staticFile("fonts/Inter-Thin.otf")})}`;

// ---- layer 1: background mesh ----
const BgMesh: React.FC = () => {
  const f = useCurrentFrame(); const d1 = Math.sin(f / 55) * 60, d2 = Math.cos(f / 70) * 50;
  return (<AbsoluteFill style={{ background: theme.colors.bg }}>
    <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", top: -500, left: -400 + d1, filter: "blur(60px)", background: `radial-gradient(circle, ${theme.colors.primary}55, transparent 62%)` }} />
    <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -450, right: -350 - d2, filter: "blur(80px)", background: `radial-gradient(circle, #3b5bff44, transparent 65%)` }} />
  </AbsoluteFill>);
};

// ---- layer 2: footage cards. Each clip enters with its own move; cut hidden mid-move ----
type Move = "whip" | "scale" | "wipe" | "drop";
const Shot: React.FC<{ src: string; dur: number; move: Move; i: number; card?: boolean }> = ({ src, dur, move, i, card }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: theme.spring.snappy });
  const exit = interpolate(f, [dur - 5, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  let tx = 0, ty = 0, sc = 1, rot = 0, blur = 0;
  if (move === "whip") { tx = interpolate(p, [0, 1], [1300, 0]); blur = interpolate(f, [0, 6], [26, 0], { extrapolateRight: "clamp" }); }
  if (move === "scale") { sc = interpolate(p, [0, 1], [0.7, 1]); blur = interpolate(f, [0, 5], [14, 0], { extrapolateRight: "clamp" }); }
  if (move === "drop") { ty = interpolate(p, [0, 1], [-1500, 0]); rot = interpolate(p, [0, 1], [-6, 0]); blur = interpolate(f, [0, 6], [20, 0], { extrapolateRight: "clamp" }); }
  // Ken Burns + idle breathing
  const kb = interpolate(f, [0, dur], [1.04, 1.1], { extrapolateRight: "clamp", easing: theme.ease.inOut });
  const breathe = Math.sin(f / 9) * 4;
  // exit: faster than entrance, pushes out the opposite way
  tx += exit * (move === "whip" ? -1300 : 0); sc *= 1 + exit * (move === "scale" ? 0.35 : 0);
  const wipe = move === "wipe" ? interpolate(f, [0, 9], [0, 100], { extrapolateRight: "clamp", easing: theme.ease.out }) : 100;
  const inset = card ? 70 : 0;
  return (<AbsoluteFill>
    <div style={{ position: "absolute", left: inset, right: inset, top: card ? 330 : 0, bottom: card ? 330 : 0, borderRadius: card ? 48 : 0, overflow: "hidden",
      transform: `translate(${tx}px,${ty + breathe}px) scale(${sc}) rotate(${rot}deg)`, filter: `blur(${blur}px)`,
      clipPath: `inset(0 ${100 - wipe}% 0 0 round ${card ? 48 : 0}px)`,
      boxShadow: card ? `0 50px 120px rgba(0,0,0,.6), 0 0 0 4px ${theme.colors.primary}55` : "none" }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})`, filter: "saturate(1.15) contrast(1.08)" }} />
    </div>
    {move === "wipe" && f < 12 && <div style={{ position: "absolute", top: -200, bottom: -200, width: 260, left: `${wipe * 10.8 - 130}px`, background: theme.colors.primary, transform: "skewX(-14deg)", boxShadow: `0 0 80px ${theme.colors.primary}` }} />}
  </AbsoluteFill>);
};

// ---- layer 3: type ----
const Words: React.FC<{ text: string; size: number; top: number; delay?: number; hero?: string; thin?: boolean; out?: number }> = ({ text, size, top, delay = 0, hero, thin, out = 999 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const ex = interpolate(f, [out, out + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  return (<div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: size * 0.24, opacity: 1 - ex, transform: `translateY(${-60 * ex}px)` }}>
    {text.split(" ").map((w, i) => {
      const p = spring({ frame: f - delay - i * 3, fps, config: theme.spring.snappy });
      const isHero = hero === w;
      return (<span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
        fontFamily: thin ? "IT" : "IB", fontSize: size, lineHeight: 1, letterSpacing: thin ? "0.02em" : "-0.03em",
        color: isHero ? theme.colors.primary : theme.colors.text,
        WebkitTextStroke: thin ? "2px #fff" : undefined, textShadow: thin ? "0 0 2px #000, 0 4px 0 rgba(0,0,0,.6), 0 6px 30px rgba(0,0,0,.95), 0 0 50px rgba(0,0,0,.8)" : `0 2px 0 ${isHero ? "#00a88b" : "#c9d3dd"},0 4px 0 ${isHero ? "#008f77" : "#9fb0c0"},0 6px 0 ${isHero ? "#007564" : "#7d8fa1"},0 8px 0 ${isHero ? "#005c4f" : "#5b6d80"},0 10px 0 #2b3a4a,0 24px 40px rgba(0,0,0,.65)${isHero ? `,0 0 60px ${theme.colors.primary}88` : ""}` }}>{w}</span>);
    })}
  </div>);
};
const Counter: React.FC<{ to: number; top: number }> = ({ to, top }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: theme.spring.smooth });
  const v = interpolate(f, [0, 14], [0, to], { extrapolateRight: "clamp", easing: theme.ease.out });
  return (<div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: "IB", fontSize: 230, letterSpacing: "-0.05em", color: theme.colors.primary,
    opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`, textShadow: `0 4px 0 #00a88b,0 8px 0 #007564,0 12px 0 #004f43,0 30px 50px rgba(0,0,0,.6),0 0 70px ${theme.colors.primary}66` }}>${v.toFixed(2)}</div>);
};
const Spark: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (<div style={{ position: "absolute", left: x, top: y }}>{Array.from({ length: 10 }).map((_, i) => {
    const p = spring({ frame: f - i * 1.2, fps, config: theme.spring.snappy }); const o = interpolate(f, [8, 18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return <div key={i} style={{ position: "absolute", width: 10, height: 90 * p, background: theme.colors.accent, borderRadius: 6, opacity: o, transformOrigin: "50% 0", transform: `rotate(${i * 36}deg) translateY(${40 + 60 * p}px)` }} />;
  })}</div>);
};

// ---- layers 4/5: grade, grain, vignette ----
const Grade = () => (<AbsoluteFill style={{ pointerEvents: "none" }}>
  <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: "soft-light", opacity: 0.2 }} />
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.45), transparent 30%, transparent 70%, rgba(0,0,0,.45))" }} /></AbsoluteFill>);
const Grain = () => { const f = useCurrentFrame(); const n = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ backgroundImage: n, backgroundSize: "220px", backgroundPosition: `${(f * 7) % 220}px ${(f * 13) % 220}px`, opacity: 0.09, mixBlendMode: "overlay" }} />; };
const Vignette = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.55) 100%)" }} />;
const Flash: React.FC = () => { const f = useCurrentFrame(); return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 6], [0.55, 0], { extrapolateRight: "clamp" }) }} />; };

const fr = (s: number) => Math.round(s * 30);
export const Sample: React.FC = () => {
  const B = theme.beats.map(fr); // frame of each beat
  const shots: [string, Move, boolean][] = [["clips/c01.mp4", "scale", false], ["clips/c02.mp4", "whip", false], ["clips/c03.mp4", "wipe", false], ["clips/c04.mp4", "drop", false],
    ["clips/c05.mp4", "scale", true], ["clips/c09.mp4", "whip", true], ["clips/c09b.mp4", "wipe", true], ["clips/c06.mp4", "drop", false], ["clips/c06b.mp4", "whip", false], ["clips/c07b.mp4", "scale", false]];
  const starts = [0, B[1], B[2], B[3], B[4], B[5], B[6], B[7], B[8], B[9]];
  return (<AbsoluteFill style={{ background: theme.colors.bg }}>
    <style>{fontCss}</style>
    <BgMesh />
    {shots.map(([s, m, card], i) => { const st = starts[i], en = i < shots.length - 1 ? starts[i + 1] + 4 : 185;
      return <Sequence key={i} from={st} durationInFrames={en - st}><Shot src={s} dur={en - st} move={m} i={i} card={card} /></Sequence>; })}
    <Grade />
    {/* hook */}
    <Sequence from={0} durationInFrames={B[4]}><Words text="you don't" size={110} top={290} thin out={B[4] - 8} /><Words text="NEED THIS." size={150} top={420} delay={6} out={B[4] - 8} /></Sequence>
    {/* turn */}
    <Sequence from={B[4]} durationInFrames={B[7] - B[4]}><Words text="…you" size={120} top={150} thin /><Words text="WANT IT." size={170} top={1620} hero="WANT" delay={4} out={B[7] - B[4] - 8} /></Sequence>
    {/* product with counter + spark */}
    <Sequence from={B[7]} durationInFrames={185 - B[7]}><Words text="Butter Squishy" size={96} top={290} thin /><Counter to={19.99} top={1450} /></Sequence>
    <Sequence from={B[7] + 10} durationInFrames={20}><Spark x={540} y={1560} /></Sequence>
    {[B[4], B[7]].map((b, i) => <Sequence key={i} from={b} durationInFrames={8}><Flash /></Sequence>)}
    <Grain /><Vignette />
    <Audio src={staticFile("bgm.mp3")} volume={0.9} endAt={185} />
    {starts.slice(1).map((s, i) => <Sequence key={"w" + i} from={s - 3} durationInFrames={20}><Audio src={staticFile(i % 2 ? "sfx/whoosh.wav" : "sfx/pop.wav")} volume={0.45} /></Sequence>)}
    {[0, B[4], B[7]].map((b, i) => <Sequence key={"t" + i} from={Math.max(0, b - 2)} durationInFrames={20}><Audio src={staticFile("sfx/thud.wav")} volume={0.8} /></Sequence>)}
    <Sequence from={B[7] + 8} durationInFrames={30}><Audio src={staticFile("sfx/sparkle.wav")} volume={0.5} /></Sequence>
  </AbsoluteFill>);
};
