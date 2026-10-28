import type { SeasonalEffectConfig } from '@/lib/seasonal-effects';
import type { CSSProperties } from 'react';

const motifs = {
  christmas: ['✦', '❄', '❄'],
  tet: ['✿', '✦', '✿'],
  spring: ['✿', '❀', '✿'],
  summer: ['✦', '✳', '✦'],
  autumn: ['❧', '✦', '❧'],
  winter: ['❄', '✧', '❄'],
};

export function SeasonalEffects({ config }: { config: SeasonalEffectConfig }) {
  const count = config.intensity === 'normal' ? 18 : 9;
  const symbols = motifs[config.preset];

  return (
    <div className={`seasonal-effects seasonal-effects--${config.preset}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const left = (index * 37 + 13) % 94 + 3;
        const size = 13 + (index * 7) % 17;
        return (
          <span
            key={index}
            className="seasonal-effects__particle"
            style={{
              left: `${left}%`,
              fontSize: size,
              animationDuration: `${13 + index % 7 * 2}s`,
              animationDelay: `${-(index * 3.7)}s`,
              '--seasonal-drift': `${index % 2 ? 28 : -28}px`,
            } as CSSProperties}
          >
            {symbols[index % symbols.length]}
          </span>
        );
      })}
    </div>
  );
}
