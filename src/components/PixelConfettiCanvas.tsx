import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

export interface PixelConfettiHandle {
  burst: (originXRatio?: number, originYRatio?: number, count?: number) => void;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'square' | 'rect' | 'plus';
  phase: number;
  flipSpeed: number;
  isBurst: boolean;
  alpha: number;
}

interface StarDot {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
  color: string;
}

const CONFETTI_COLORS = [
  '#a855f7', // vivid purple
  '#c084fc', // soft orchid
  '#e9d5ff', // pale lilac
  '#7e22ce', // royal plum
  '#f472b6', // berry pink
  '#fde047', // pixel gold
  '#d8b4fe', // lavender
  '#9333ea', // electric violet
];

const STAR_COLORS = ['#6b21a8', '#9333ea', '#c084fc', '#fde047'];

const PIXEL_GRID = 4;

function snapToGrid(val: number): number {
  return Math.round(val / PIXEL_GRID) * PIXEL_GRID;
}

export const PixelConfettiCanvas = forwardRef<PixelConfettiHandle>(
  function PixelConfettiCanvas(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const confettiRef = useRef<ConfettiPiece[]>([]);
    const starsRef = useRef<StarDot[]>([]);

    const createFallingPiece = (width: number, height: number, randomY: boolean): ConfettiPiece => {
      const shapes: Array<'square' | 'rect' | 'plus'> = ['square', 'rect', 'rect', 'plus'];
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -16 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 42,
        vy: 55 + Math.random() * 75,
        size: Math.random() > 0.4 ? 8 : 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        phase: Math.random() * Math.PI * 2,
        flipSpeed: 3 + Math.random() * 4,
        isBurst: false,
        alpha: 0.9,
      };
    };

    useImperativeHandle(ref, () => ({
      burst(originXRatio = 0.5, originYRatio = 0.48, count = 64) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ox = w * originXRatio;
        const oy = h * originYRatio;

        for (let i = 0; i < count; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.45;
          const speed = 150 + Math.random() * 340;
          confettiRef.current.push({
            x: ox + (Math.random() - 0.5) * 40,
            y: oy + (Math.random() - 0.5) * 24,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 60,
            size: Math.random() > 0.35 ? 8 : 4,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            shape: Math.random() > 0.25 ? 'rect' : 'plus',
            phase: Math.random() * Math.PI * 2,
            flipSpeed: 6 + Math.random() * 6,
            isBurst: true,
            alpha: 1,
          });
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let width = window.innerWidth;
      let height = window.innerHeight;

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = false;
      };

      resize();
      window.addEventListener('resize', resize);

      const baseCount = Math.min(115, Math.max(55, Math.floor((width * height) / 14000)));
      confettiRef.current = Array.from({ length: baseCount }, () =>
        createFallingPiece(width, height, true)
      );

      starsRef.current = Array.from({ length: 42 }, () => ({
        x: snapToGrid(Math.random() * width),
        y: snapToGrid(Math.random() * height),
        size: Math.random() > 0.7 ? 4 : 2,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2.5,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      }));

      const drawPiece = (p: ConfettiPiece, timeSec: number) => {
        const px = snapToGrid(p.x);
        const py = snapToGrid(p.y);
        const flip = Math.cos(timeSec * p.flipSpeed + p.phase);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'plus') {
          const s = p.size === 8 ? 4 : 2;
          ctx.fillRect(px, py - s, s, s * 3);
          ctx.fillRect(px - s, py, s * 3, s);
        } else if (p.shape === 'rect') {
          const h = Math.abs(flip) > 0.45 ? p.size : PIXEL_GRID;
          ctx.fillRect(px, py, p.size, h);
        } else {
          ctx.fillRect(px, py, p.size, p.size);
        }
      };

      if (prefersReducedMotion) {
        ctx.clearRect(0, 0, width, height);
        starsRef.current.forEach((s) => {
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = s.color;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        confettiRef.current.forEach((p) => drawPiece(p, 0));
        return () => {
          window.removeEventListener('resize', resize);
        };
      }

      let animId = 0;
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        const timeSec = now / 1000;

        ctx.clearRect(0, 0, width, height);

        // Twinkling retro pixel stars in the deep purple backdrop
        starsRef.current.forEach((s) => {
          const twinkle = (Math.sin(timeSec * s.speed + s.phase) + 1) * 0.5;
          ctx.globalAlpha = 0.2 + twinkle * 0.65;
          ctx.fillStyle = s.color;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Update and draw pixel confetti
        const nextPieces: ConfettiPiece[] = [];
        for (let i = 0; i < confettiRef.current.length; i++) {
          const p = confettiRef.current[i];

          if (p.isBurst) {
            p.vy += 420 * dt; // gravity
            p.vx *= 1 - 0.8 * dt; // air drag
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.y > height + 30) {
              continue; // prune finished burst pieces
            }
            if (p.y > height * 0.78 && p.vy > 0) {
              p.alpha = Math.max(0, p.alpha - dt * 1.4);
            }
            if (p.alpha <= 0.05) continue;
            nextPieces.push(p);
          } else {
            const sway = Math.sin(timeSec * 2.2 + p.phase) * 38;
            p.x += (p.vx + sway) * dt;
            p.y += p.vy * dt;

            if (p.y > height + 20) {
              const recycled = createFallingPiece(width, height, false);
              nextPieces.push(recycled);
            } else {
              if (p.x < -20) p.x = width + 12;
              if (p.x > width + 20) p.x = -12;
              nextPieces.push(p);
            }
          }

          drawPiece(p, timeSec);
        }

        ctx.globalAlpha = 1;
        confettiRef.current = nextPieces;
        animId = requestAnimationFrame(tick);
      };

      animId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none w-full h-full"
      />
    );
  }
);
