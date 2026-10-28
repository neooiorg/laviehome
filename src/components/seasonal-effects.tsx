'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { SeasonalEffectConfig } from '@/lib/seasonal-effects';

const motifs = {
  christmas: ['✦', '❄', '❄'],
  tet: ['✿', '✦', '✿'],
  spring: ['✿', '❀', '✿'],
  summer: ['✦', '✳', '✦'],
  autumn: ['❧', '✦', '❧'],
  winter: ['❄', '✧', '❄'],
};

export function SeasonalEffects({ config }: { config: SeasonalEffectConfig }) {
  const reducedMotion = useReducedMotion();
  const count = config.intensity === 'normal' ? 18 : 9;
  const symbols = motifs[config.preset];

  return (
    <div className={`seasonal-effects seasonal-effects--${config.preset}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const left = (index * 37 + 13) % 94 + 3;
        const size = 13 + (index * 7) % 17;
        return (
          <motion.span
            key={index}
            className="seasonal-effects__particle"
            style={{ left: `${left}%`, fontSize: size }}
            initial={false}
            animate={reducedMotion ? { opacity: 0.35 } : {
              y: ['-10vh', '110vh'],
              x: [0, index % 2 ? 28 : -28, 0],
              rotate: [0, index % 2 ? 90 : -90],
              opacity: [0, 0.55, 0.55, 0],
            }}
            transition={reducedMotion ? undefined : {
              duration: 13 + index % 7 * 2,
              delay: -(index * 3.7),
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {symbols[index % symbols.length]}
          </motion.span>
        );
      })}
    </div>
  );
}
