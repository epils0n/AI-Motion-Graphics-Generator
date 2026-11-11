import React from 'react';
import { Composition } from 'remotion';
import './engine/fonts';
import { STUDIO } from './studio.config';
import { EPISODES } from './episodes';
import { CastSheet } from './CastSheet';
import { ShrinkStyle, SHRINK_STYLE_FRAMES } from './episodes/shrink/StyleTest';
import { CharacterDesigns, DESIGN_FRAMES } from './designs/CharacterDesigns';

// Every episode gets two compositions: <Id> (the film) and <Id>Board (one frame per shot, at its key frame, for the
// storyboard). Cast renders the cast sheet.
//   npx remotion studio src/index.ts --port 3430

export const Root: React.FC = () => {
  const common = { width: STUDIO.width, height: STUDIO.height, fps: STUDIO.fps };
  return (
    <>
      {EPISODES.map((e) => (
        <React.Fragment key={e.id}>
          <Composition id={e.id} component={e.Main} durationInFrames={Math.max(1, e.total)} {...common} width={e.width ?? common.width} height={e.height ?? common.height} />
          <Composition id={`${e.id}Board`} component={e.Board} durationInFrames={Math.max(1, e.shotCount)} {...common} width={e.width ?? common.width} height={e.height ?? common.height} />
        </React.Fragment>
      ))}
      <Composition id="Cast" component={CastSheet} durationInFrames={1} {...common} />
      <Composition id="ShrinkStyle" component={ShrinkStyle} durationInFrames={SHRINK_STYLE_FRAMES} {...common} />
      <Composition id="Designs" component={CharacterDesigns} durationInFrames={DESIGN_FRAMES} {...common} />
    </>
  );
};
