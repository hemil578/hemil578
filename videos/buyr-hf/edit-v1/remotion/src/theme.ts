// theme.ts — single source of truth (remotion-motion-graphics rule 9). Buyr brand.
import { Easing } from "remotion";
export const theme = {
  colors: { bg: "#070B14", bgAlt: "#0F172A", primary: "#00C9A7", accent: "#7CFFE4", text: "#F4F7FA", dim: "#A7B4C4" },
  ease: { out: Easing.bezier(0.16, 1, 0.3, 1), inOut: Easing.bezier(0.83, 0, 0.17, 1), in: Easing.bezier(0.7, 0, 0.84, 0) },
  spring: { snappy: { damping: 14, stiffness: 160, mass: 0.6 }, smooth: { damping: 20, stiffness: 90, mass: 1 }, bouncy: { damping: 11, stiffness: 170, mass: 0.7 } },
  // measured beats (audiomap.json, 99.4 BPM)
  beats: [0.116, 0.743, 1.347, 1.95, 2.554, 3.135, 3.738, 4.342, 4.946, 5.55, 6.153],
} as const;
