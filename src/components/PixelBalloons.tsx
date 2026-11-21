import { useEffect, useRef, useState } from 'react';
import { playConfettiPop } from '../utils/chiptune';

interface PixelBalloonsProps {
  onBalloonPop?: (xRatio: number, yRatio: number) => void;
}

interface BalloonPalette {
  body: string;
  shade: string;
  highlight: string;
  outline: string;
}

interface BalloonConfig {
  id: number;
  xPercent: number;
  startYPercent: number;
  speed: number;
  swayAmp: number;
  swaySpeed: number;
  phase: number;
  scale: number;
  palette: BalloonPalette;
  zLayer: 'front' | 'back';
}

const BALLOON_PALETTES: BalloonPalette[] = [
  {
    body: '#9333ea',
    shade: '#6b21a8',
    highlight: '#e9d5ff',
    outline: '#1e093d',
  },
  {
    body: '#a855f7',
    shade: '#7e22ce',
    highlight: '#faf5ff',
    outline: '#1e093d',
  },
  {
    body: '#c084fc',
    shade: '#9333ea',
    highlight: '#ffffff',
    outline: '#270e4f',
  },
  {
    body: '#7e22ce',
    shade: '#581c87',
    highlight: '#d8b4fe',
    outline: '#15062b',
  },
  {
    body: '#db2777',
    shade: '#9d174d',
    highlight: '#fbcfe8',
    outline: '#2a0826',
  },
];

// Crisp 12x16 pixel balloon + string matrix
const BALLOON_ROWS = [
  '....OOOO....',
  '..OOBBBBOO..',
  '.OBBHHBBBBO.',
  '.OBHHBBBBBO.',
  'OBBHBBBBBBBO',
  'OBBBBBBBBSSO',
  'OBBBBBBBSSSO',
  'OBBBBBBBSSSO',
  '.OBBBBBSSSO.',
  '.OBBBBSSSO..',
  '..OOBBSSO...',
  '....OOOO....',
  '....OBBO....',
  '.....OO.....',
  '......S.....',
  '.....S......',
  '......S.....',
  '.......S....',
  '......S.....',
];

const INITIAL_BALLOONS: BalloonConfig[] = [
  {
    id: 1,
    xPercent: 0.08,
    startYPercent: 0.72,
    speed: 26,
    swayAmp: 12,
    swaySpeed: 1.1,
    phase: 0.2,
    scale: 1,
    palette: BALLOON_PALETTES[0],
    zLayer: 'front',
  },
  {
    id: 2,
    xPercent: 0.16,
    startYPercent: 0.28,
    speed: 22,
    swayAmp: 10,
    swaySpeed: 0.9,
    phase: 1.8,
    scale: 0.85,
    palette: BALLOON_PALETTES[2],
    zLayer: 'front',
  },
  {
    id: 3,
    xPercent: 0.86,
    startYPercent: 0.22,
    speed: 24,
    swayAmp: 11,
    swaySpeed: 1.0,
    phase: 2.9,
    scale: 0.95,
    palette: BALLOON_PALETTES[1],
    zLayer: 'front',
  },
  {
    id: 4,
    xPercent: 0.91,
    startYPercent: 0.68,
    speed: 28,
    swayAmp: 13,
    swaySpeed: 1.2,
    phase: 4.1,
    scale: 1.05,
    palette: BALLOON_PALETTES[3],
    zLayer: 'front',
  },
  {
    id: 5,
    xPercent: 0.26,
    startYPercent: 0.88,
    speed: 19,
    swayAmp: 9,
    swaySpeed: 0.85,
    phase: 0.9,
    scale: 0.8,
    palette: BALLOON_PALETTES[4],
    zLayer: 'back',
  },
  {
    id: 6,
    xPercent: 0.74,
    startYPercent: 0.82,
    speed: 21,
    swayAmp: 10,
    swaySpeed: 0.95,
    phase: 3.4,
    scale: 0.85,
    palette: BALLOON_PALETTES[2],
    zLayer: 'back',
  },
  {
    id: 7,
    xPercent: 0.5,
    startYPercent: 0.15,
    speed: 18,
    swayAmp: 14,
    swaySpeed: 0.8,
    phase: 5.0,
    scale: 0.8,
    palette: BALLOON_PALETTES[1],
    zLayer: 'back',
  },
  {
    id: 8,
    xPercent: 0.05,
    startYPercent: 0.44,
    speed: 20,
    swayAmp: 8,
    swaySpeed: 1.05,
    phase: 2.2,
    scale: 0.78,
    palette: BALLOON_PALETTES[4],
    zLayer: 'back',
  },
];

function PixelBalloonSprite({ palette }: { palette: BalloonPalette }) {
  const colorMap: Record<string, string> = {
    O: palette.outline,
    B: palette.body,
    S: palette.shade,
    H: palette.highlight,
  };

  return (
    <svg
      viewBox="0 0 12 19"
      shapeRendering="crispEdges"
      className="w-12 h-[76px] sm:w-14 sm:h-[88px] drop-shadow-[3px_3px_0px_#0c031c]"
      aria-hidden="true"
    >
      {BALLOON_ROWS.map((row, rIdx) =>
        Array.from(row).map((ch, cIdx) => {
          if (ch === '.') return null;
          const fill = ch === 'S' && rIdx >= 14 ? '#d8b4fe' : colorMap[ch];
          return (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width={1}
              height={1}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}

export function PixelBalloons({ onBalloonPop }: PixelBalloonsProps) {
  const elRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const stateRef = useRef<
    Record<number, { y: number; poppedUntil: number }>
  >({});
  const [poppedIds, setPoppedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const h = window.innerHeight;
    INITIAL_BALLOONS.forEach((b) => {
      stateRef.current[b.id] = {
        y: b.startYPercent * h,
        poppedUntil: 0,
      };
    });

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const positionReduced = () => {
      const w = window.innerWidth;
      const vh = window.innerHeight;
      INITIAL_BALLOONS.forEach((b) => {
        const el = elRefs.current[b.id];
        if (!el) return;
        const x = b.xPercent * w - 28;
        const y = b.startYPercent * vh;
        el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scale(${b.scale})`;
      });
    };

    if (prefersReducedMotion) {
      positionReduced();
      window.addEventListener('resize', positionReduced);
      return () => window.removeEventListener('resize', positionReduced);
    }

    let animId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const timeSec = now / 1000;
      const w = window.innerWidth;
      const vh = window.innerHeight;

      INITIAL_BALLOONS.forEach((b) => {
        const el = elRefs.current[b.id];
        const st = stateRef.current[b.id];
        if (!el || !st) return;

        if (st.poppedUntil > 0 && now >= st.poppedUntil) {
          st.poppedUntil = 0;
          st.y = vh + 40;
          setPoppedIds((prev) => ({ ...prev, [b.id]: false }));
        }

        if (st.poppedUntil === 0) {
          st.y -= b.speed * dt;
          if (st.y < -120) {
            st.y = vh + 30;
          }
          const sway = Math.sin(timeSec * b.swaySpeed + b.phase) * b.swayAmp;
          const x = Math.max(4, Math.min(w - 60, b.xPercent * w - 28 + sway));
          const snappedX = Math.round(x / 2) * 2;
          const snappedY = Math.round(st.y / 2) * 2;
          el.style.transform = `translate3d(${snappedX}px, ${snappedY}px, 0) scale(${b.scale})`;
        }
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePop = (b: BalloonConfig, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (rect.left + rect.width / 2) / window.innerWidth;
    const yRatio = (rect.top + rect.height / 2) / window.innerHeight;

    playConfettiPop();
    onBalloonPop?.(xRatio, yRatio);

    const st = stateRef.current[b.id];
    if (st) {
      st.poppedUntil = performance.now() + 1800;
    }
    setPoppedIds((prev) => ({ ...prev, [b.id]: true }));
  };

  return (
    <>
      {/* Background layer balloons (behind card) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-10 pointer-events-none overflow-hidden"
      >
        {INITIAL_BALLOONS.filter((b) => b.zLayer === 'back').map((b) => (
          <button
            key={b.id}
            ref={(el) => {
              elRefs.current[b.id] = el;
            }}
            type="button"
            tabIndex={-1}
            onClick={(e) => handlePop(b, e)}
            className={`absolute top-0 left-0 pointer-events-auto cursor-pointer opacity-75 hover:opacity-100 transition-opacity focus:outline-none ${
              poppedIds[b.id] ? 'invisible' : 'visible'
            }`}
            aria-label="Pop floating purple pixel balloon"
          >
            <PixelBalloonSprite palette={b.palette} />
          </button>
        ))}
      </div>

      {/* Foreground flank balloons (clickable on sides) */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        {INITIAL_BALLOONS.filter((b) => b.zLayer === 'front').map((b) => (
          <button
            key={b.id}
            ref={(el) => {
              elRefs.current[b.id] = el;
            }}
            type="button"
            onClick={(e) => handlePop(b, e)}
            className={`absolute top-0 left-0 pointer-events-auto cursor-pointer hover:brightness-110 transition-opacity focus-visible:outline-2 focus-visible:outline-[#fde047] ${
              poppedIds[b.id] ? 'opacity-0 pointer-events-none' : 'opacity-95'
            }`}
            aria-label="Pop floating purple pixel balloon"
          >
            <PixelBalloonSprite palette={b.palette} />
          </button>
        ))}
      </div>
    </>
  );
}
