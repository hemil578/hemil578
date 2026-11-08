// "Guess what it is" demo — renders exactly the cine-director plan (src/guess_plan.json).
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import plan from "./guess_plan.json";

const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const fontCss = `@font-face{font-family:IB;src:url(${staticFile("fonts/Inter-Black.otf")})}`;
type Shot = { t: number; dur: number; source_id: string; role: string; focus: number[]; text: string };

const BgMesh: React.FC = () => { const f = useCurrentFrame(); return (<AbsoluteFill style={{ background: theme.colors.bg }}>
  <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", top: -500, left: -400 + Math.sin(f / 55) * 60, filter: "blur(60px)", background: `radial-gradient(circle, ${theme.colors.primary}44, transparent 62%)` }} /></AbsoluteFill>); };

const Clip: React.FC<{ s: Shot; prevMystery: boolean }> = ({ s, prevMystery }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const dur = Math.round(s.dur * fps);
  const mystery = s.role === "mystery";
  const [fx, fy] = s.focus;
  // mystery: extreme close-up drifting slowly; reveal: whip zoom-out 2.6 -> 1 in 8 frames with motion blur
  const p = spring({ frame: f, fps, config: { damping: 18, stiffness: 140, mass: 0.7 } });
  const zm = (s as any).crop_zoom || 2.6;
  const zoom = mystery ? interpolate(f, [0, dur], [zm + 0.3, zm - 0.1], { ...cl, easing: theme.ease.inOut }) : interpolate(p, [0, 1], [zm, 1.0]);
  const blur = mystery ? 0 : interpolate(f, [0, 7], [22, 0], cl);
  const rate = 0.8 / s.dur;
  return (<AbsoluteFill style={{ overflow: "hidden" }}>
    <OffthreadVideo src={staticFile(`clips/${s.source_id}.mp4`)} muted playbackRate={Math.max(0.5, Math.min(1, rate))}
      style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${zoom})`,
        filter: `blur(${blur}px) ${mystery ? "saturate(.9) contrast(1.15) brightness(.9)" : "saturate(1.15) contrast(1.08)"}` }} />
    {mystery && <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, transparent 30%, rgba(0,0,0,.85) 75%)" }} />}
  </AbsoluteFill>);
};

const Question: React.FC<{ text: string; n: number }> = ({ text, n }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (<AbsoluteFill>
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center" }}>
      <span style={{ fontFamily: "IB", fontSize: 44, color: theme.colors.bg, background: theme.colors.primary, padding: "8px 22px", borderRadius: 999,
        opacity: spring({ frame: f, fps, config: theme.spring.snappy }) }}>GUESS #{n}</span></div>
    <div style={{ position: "absolute", top: 760, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 28 }}>
      {words.map((w, i) => { const p = spring({ frame: f - 2 - i * 3, fps, config: theme.spring.bouncy });
        return <span key={i} style={{ display: "inline-block", fontFamily: "IB", fontSize: 150, lineHeight: 1, color: "#fff", letterSpacing: "-0.03em", opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [0.6, 1])}) rotate(${Math.sin(f / 6 + i) * 2}deg)`,
          textShadow: "0 4px 0 #9fb0c0,0 8px 0 #5b6d80,0 12px 0 #2b3a4a,0 30px 50px rgba(0,0,0,.8)" }}>{w}</span>; })}
    </div>
    {[0, 1, 2, 3].map(i => { const t = f - 4 - i * 4; const o = interpolate(t, [0, 6, 30, 36], [0, 0.9, 0.9, 0], cl);
      return <div key={i} style={{ position: "absolute", fontFamily: "IB", fontSize: 120 + i * 30, color: theme.colors.primary, opacity: o,
        left: [120, 820, 180, 780][i], top: [520, 470, 1240, 1300][i] - t * 2, transform: `rotate(${[-18, 14, 10, -12][i] + Math.sin(f / 5 + i) * 6}deg)`, textShadow: `0 0 40px ${theme.colors.primary}` }}>?</div>; })}
  </AbsoluteFill>);
};

const Reveal: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f - 5, fps, config: theme.spring.bouncy }); const ck = spring({ frame: f - 3, fps, config: theme.spring.snappy });
  const [name, price] = text.split(" · ");
  return (<AbsoluteFill>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
      opacity: p, transform: `translateY(${interpolate(p, [0, 1], [80, 0])}px) scale(${interpolate(p, [0, 1], [0.8, 1])})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, background: "rgba(10,15,28,.9)", border: `4px solid ${theme.colors.primary}`, borderRadius: 30, padding: "22px 34px",
        boxShadow: `0 30px 60px rgba(0,0,0,.6), 0 0 50px ${theme.colors.primary}55` }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: theme.colors.primary, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${ck})` }}>
          <div style={{ width: 18, height: 34, border: `solid ${theme.colors.bg}`, borderWidth: "0 8px 8px 0", transform: "rotate(45deg) translate(-3px,-3px)" }} /></div>
        <span style={{ fontFamily: "IB", fontSize: 62, color: "#fff", letterSpacing: "-0.02em" }}>{name}</span></div>
      {price && <span style={{ fontFamily: "IB", fontSize: 130, color: theme.colors.primary, letterSpacing: "-0.04em", textShadow: `0 4px 0 #00a88b,0 8px 0 #007564,0 24px 40px rgba(0,0,0,.7),0 0 50px ${theme.colors.primary}66` }}>{price}</span>}
    </div></AbsoluteFill>);
};

const Grade = () => (<AbsoluteFill style={{ pointerEvents: "none" }}><AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: "soft-light", opacity: 0.15 }} />
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.4), transparent 28%, transparent 70%, rgba(0,0,0,.5))" }} /></AbsoluteFill>);
const Grain = () => { const f = useCurrentFrame(); const n = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ backgroundImage: n, backgroundSize: "220px", backgroundPosition: `${(f * 7) % 220}px ${(f * 13) % 220}px`, opacity: 0.08, mixBlendMode: "overlay" }} />; };
const Flash: React.FC = () => { const f = useCurrentFrame(); return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 5], [0.7, 0], cl) }} />; };

export const Guess: React.FC = () => {
  const { fps } = useVideoConfig(); const tl = (plan as any).timeline as Shot[]; const F = (s: number) => Math.round(s * fps);
  let n = 0;
  return (<AbsoluteFill><style>{fontCss}</style><BgMesh />
    {tl.map((s, i) => <Sequence key={"c" + i} from={F(s.t)} durationInFrames={F(s.dur) + 1}><Clip s={s} prevMystery={i > 0 && tl[i - 1].role === "mystery"} /></Sequence>)}
    <Grade />
    {tl.map((s, i) => { if (s.role === "mystery") n++; return <Sequence key={"t" + i} from={F(s.t)} durationInFrames={F(s.dur)}>
      {s.role === "mystery" ? <Question text={s.text} n={n} /> : <><Flash /><Reveal text={s.text} /></>}</Sequence>; })}
    <Grain />
    <Audio src={staticFile("bgm.mp3")} volume={0.9} endAt={185} />
    {tl.map((s, i) => s.role === "mystery"
      ? <Sequence key={"a" + i} from={Math.max(0, F(s.t) - 2)} durationInFrames={40}><Audio src={staticFile("sfx/pop.wav")} volume={0.7} /></Sequence>
      : <React.Fragment key={"a" + i}><Sequence from={F(s.t) - 3} durationInFrames={25}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.6} /></Sequence>
        <Sequence from={F(s.t) + 3} durationInFrames={30}><Audio src={staticFile("sfx/sparkle.wav")} volume={0.7} /></Sequence></React.Fragment>)}
  </AbsoluteFill>);
};
