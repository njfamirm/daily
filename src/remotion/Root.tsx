import React from "react";
import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition.tsx";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TaskDropDemo"
        component={DemoComposition}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
