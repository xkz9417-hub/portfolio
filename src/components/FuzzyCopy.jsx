import React from 'react';
import FuzzyText from './FuzzyText';

export default function FuzzyCopy({ lines, className = '' }) {
  return (
    <div className={`fuzzy-copy ${className}`.trim()}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          <FuzzyText
            fontSize="inherit"
            color="currentColor"
            colorSplit={0}
            trigger="hover"
            direction="horizontal"
            baseIntensity={0.2}
            hoverIntensity={0.5}
            fuzzRange={30}
            sliceSize={1}
            fps={60}
            transitionDuration={0}
            intro
            introDuration={1400}
            letterSpacing={0}
            enableHover
            clickEffect={false}
            glitchMode={false}
            glitchInterval={2000}
            glitchDuration={200}
          >
            {line}
          </FuzzyText>
        </span>
      ))}
    </div>
  );
}
