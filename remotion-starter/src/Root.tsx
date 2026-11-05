import { Composition } from "remotion";
import { HelloClaude } from "./HelloClaude";

export const RemotionRoot: React.FC = () => (
  <Composition id="HelloClaude" component={HelloClaude}
    durationInFrames={240} fps={30} width={1080} height={1920} />
);
