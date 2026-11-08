import React from "react";
import { Composition } from "remotion";
import { Sample } from "./Sample";
import { Guess } from "./Guess";
export const Root: React.FC = () => (
  <>
  <Composition id="Guess" component={Guess} durationInFrames={185} fps={30} width={1080} height={1920} />
  <Composition id="Sample" component={Sample} durationInFrames={185} fps={30} width={1080} height={1920} />
  </>
);
