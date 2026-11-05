import { Composition } from "remotion";
import { HelloClaude } from "./HelloClaude";
import { BuyrPromo, BUYR_DURATION } from "./BuyrPromo";
import { BuyrBeatEdit, BEAT_EDIT_DURATION } from "./BuyrBeatEdit";
import { BuyrStory, STORY_DURATION } from "./BuyrStory";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HelloClaude" component={HelloClaude}
      durationInFrames={240} fps={30} width={1080} height={1920} />
    <Composition id="BuyrPromo" component={BuyrPromo}
      durationInFrames={BUYR_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="BuyrBeatEdit" component={BuyrBeatEdit}
      durationInFrames={BEAT_EDIT_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="BuyrStory" component={BuyrStory}
      durationInFrames={STORY_DURATION} fps={30} width={1080} height={1920} />
  </>
);
