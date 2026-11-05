import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig } from "remotion";

const BG = "#0E1621", ACCENT = "#D97757", INK = "#F2EFEA";
const font = "'DejaVu Sans', sans-serif";

// One kinetic word: springs up from below, then holds.
const Word: React.FC<{ text: string; delay: number; color?: string; size?: number }> = ({ text, delay, color = INK, size = 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });
  return (
    <div style={{ transform: `translateY(${(1 - s) * 80}px)`, opacity: s, color,
      fontSize: size, fontWeight: 800, lineHeight: 1.05, fontFamily: font }}>
      {text}
    </div>
  );
};

const Blob: React.FC = () => {
  const frame = useCurrentFrame();
  const r = 520 + Math.sin(frame / 18) * 40;
  return (
    <div style={{ position: "absolute", width: r, height: r, borderRadius: "50%",
      background: `radial-gradient(circle, ${ACCENT}55, transparent 70%)`,
      left: 540 - r / 2 + Math.cos(frame / 40) * 120, top: 760 - r / 2 + Math.sin(frame / 50) * 160 }} />
  );
};

export const HelloClaude: React.FC = () => {
  const frame = useCurrentFrame();
  const barW = interpolate(frame, [0, 230], [0, 1080], { extrapolateRight: "clamp" });
  const outro = interpolate(frame, [215, 240], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: BG, opacity: outro }}>
      <Blob />
      <AbsoluteFill style={{ justifyContent: "center", padding: 110 }}>
        <Word text="Made" delay={6} />
        <Word text="with" delay={14} />
        <Word text="code." delay={22} color={ACCENT} />
        <Sequence from={95} layout="none">
          <div style={{ marginTop: 70 }}>
            <Word size={115} text="Free." delay={0} />
            <Word size={115} text="Offline." delay={10} />
            <Word size={115} text="In the cloud." delay={20} color={ACCENT} />
          </div>
        </Sequence>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 14, width: barW, background: ACCENT }} />
      <Audio src={staticFile("voice.wav")} />
    </AbsoluteFill>
  );
};
