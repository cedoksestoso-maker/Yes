import { useEffect, useMemo, useRef, useState } from 'react';
import { playSpikeChime } from '../utils/chiptune';

interface SpikyPurpleBouquetProps {
  spikeTrigger: number;
  onBouquetPop?: () => void;
}

interface PixelRun {
  x: number;
  y: number;
  w: number;
  fill: string;
}

interface FloatingSpark {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

function compileMatrix(
  rows: string[],
  palette: Record<string, string>,
  offsetX = 0,
  offsetY = 0
): PixelRun[] {
  const runs: PixelRun[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      const color = palette[ch];
      if (!color) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < row.length && row[end] === ch) {
        end++;
      }
      runs.push({
        x: offsetX + c,
        y: offsetY + r,
        w: end - c,
        fill: color,
      });
      c = end;
    }
  }
  return runs;
}

// Rich purple, orchid-pink & emerald stem pixel palette
const PALETTE: Record<string, string> = {
  // Outlines & deep shadows
  O: '#130624',
  // Deepest plum / violet spots & throat
  D: '#3b0764',
  // Dark royal purple
  P: '#581c87',
  // Core purple
  V: '#7e22ce',
  // Bright electric purple
  B: '#9333ea',
  // Vivid orchid
  M: '#a855f7',
  // Lavender highlight
  L: '#c084fc',
  // Pale lilac spike tip
  W: '#e9d5ff',
  // Crisp near-white petal tip
  H: '#faf5ff',
  // Orchid lip magenta-rose accent
  Q: '#db2777',
  A: '#f472b6',
  // Gold lily stamens & ribbon bow
  G: '#ca8a04',
  Y: '#facc15',
  K: '#fef08a',
  // Emerald stem & spiky leaf greens
  E: '#14532d',
  F: '#166534',
  N: '#16a34a',
  Z: '#4ade80',
  // Wrap indigo-violet tones
  U: '#2e1065',
  C: '#4c1d95',
  R: '#6d28d9',
  S: '#8b5cf6',
};

// 1. Center Hero Spiky Purple Lily + Long Stem & Leaves (23 x 54) at (29, 3)
const CENTER_LILY = [
  '...........H...........',
  '..........HWH..........',
  '..........LML..........',
  '.........WMVMW.........',
  '...H.....LBVBL.....H...',
  '..HWH....MVPVM....HWH..',
  '...LML..WMVPVMW..LML...',
  '...WMVM..LVPVL..MVBL...',
  '....BVPMWMPDPMWMPVB....',
  '....LMVPVPDPDPVPVML....',
  '.H...MVPDVKYKVDPMV...H.',
  'HWH..LVPVKYKYKVPVL..HWH',
  '.LMLWMBVDYKGYKDVBMWLML.',
  '..WMVVPVDDKKKDDVPVVMW..',
  '...LBVPMVPDYDPVMPVBL...',
  '....WMVPVPDPDPVPVMW....',
  '.....LBVPMVPVMPVBL.....',
  '......WMVPVPVPVMW......',
  '.......LBVPVPVBL.......',
  '........WMVPVMW........',
  '.........LBVBL.........',
  '..........WMW..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '.......Z..FNF..........',
  '......NZN.ENE..........',
  '......FNF.FNF..Z.......',
  '.......FNFENE.NZN......',
  '........EFNFN.FNF......',
  '.........EFNFENE.......',
  '..........EFNFN........',
  '..........ENEF.........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........FNF..........',
  '..........ENE..........',
  '..........EFE..........',
];

// 2. Upper-Left Spiky Purple Trumpet Lily + Sweeping Stem (23 x 46) at (11, 12)
const LEFT_LILY = [
  '........H..............',
  '.......HWH.............',
  '.......LML......H......',
  '..H....MVM.....HWH.....',
  '.HWH..WMVMW....LML.....',
  '..LML.LBVBL...WMVM.....',
  '..WMVMMPDPMW..LBVL.....',
  '...BVPVPDPVMWMMVM......',
  '...LMVPDKYKVPVPVL......',
  'H...MVPDYKYKDPMV...H...',
  'HWH.BVPVKKGKKVPVB.HWH..',
  '.LMLWMVPDYKYDVPVMWLML..',
  '..WMBVPMVPDPVMPVBMWW...',
  '...LMVPVPDPDPVPVML.....',
  '....WMVPMVPVMPVMW......',
  '.....LBVPVPVPVBL.......',
  '......WMVPVPVMW........',
  '.......LBVPVBL.........',
  '........WENMW..........',
  '.........FNF...........',
  '.....Z...ENEF..........',
  '....NZN...FNF..........',
  '....FNF...ENEF.........',
  '.....FNFZ..FNF.........',
  '......EFNF.ENEF........',
  '.......EFNF.FNF........',
  '........EFNFENEF.......',
  '.........EFN.FNF.......',
  '..........EFNENEF......',
  '...........EFNFNF......',
  '............EFNENEF....',
  '.............EFNFNF....',
  '..............EFNENE...',
  '...............EFNFNF..',
  '................EFNENE.',
  '.................EFNFNF',
  '..................EFNEN',
  '...................EFNF',
  '....................EFN',
  '.....................EF',
  '.....................EF',
  '.....................EF',
  '.....................EF',
  '.....................EF',
  '.....................EF',
];

// 3. Upper-Right Spiky Purple Trumpet Lily + Sweeping Stem (23 x 46) at (46, 12)
const RIGHT_LILY = [
  '..............H........',
  '.............HWH.......',
  '......H......LML.......',
  '.....HWH.....MVM....H..',
  '.....LML....WMVMW..HWH.',
  '.....MVVMW..LBVBL.LML..'.replace('MVVMW', 'MVMW.'),
  '.....LVBL..WMPDPMMVWM..',
  '......MVMMWMVPDPLVPVB..',
  '......LVPVPVKYKDPVMVL..',
  '...H...VMPDKYKYDPVM...H',
  '..HWH.BVPVKKGKKVPVB.HWH',
  '..LMLWMVPVDYKYDPVMWLML.',
  '...WWMBVPMVPDPVMPVBMW..',
  '.....LMVPVPDPDPVPVML...',
  '......WMVPMVPVMPVMW....',
  '.......LBVPVPVPVBL.....',
  '........WMVPVPVMW......',
  '.........LBVPVBL.......',
  '..........WMNEW........',
  '...........FNF.........',
  '..........FENE...Z.....',
  '..........FNF...NZN....',
  '.........FENEF..FNF....',
  '.........FNF..ZFNF.....',
  '........FENEF.FNFE.....',
  '........FNF.FNFE.......',
  '.......FENEFNFE........',
  '.......FNF.NFE.........',
  '......FENEFNFE.........',
  '......FNFNFNE..........',
  '....FENEFNFE...........',
  '....FNFNFNE............',
  '...ENEFNFE.............',
  '..FNFNFNE..............',
  '.ENEFNFE...............',
  'FNFNFNE................',
  'NENFE..................',
  'FNFE...................',
  'NFE....................',
  'FE.....................',
  'FE.....................',
  'FE.....................',
  'FE.....................',
  'FE.....................',
  'FE.....................',
];

// 4. Left Arching Purple Moth Orchid Spray + Bud + Stem (24 x 36) at (5, 24)
const LEFT_ORCHID_SPRAY = [
  '......H.................',
  '.....HWH................',
  '.....LML................',
  '....WMVMW...............',
  '.H..LBVBL..H............',
  'HWH.MVPVM.HWH...........',
  'LMLWMPDPMWLML...........',
  'WMVPVPDPVPVMW...........',
  '.BVPMQAKQMPVB...........',
  '.LMVPQKYQPVML...........',
  '..MVPDQQQDPMV...........',
  '.HMVPVPDPVPMVH..........',
  '.WLBVPMVMVPBVLW.........',
  '..WMVPV.VPVMW...........',
  '...LML...LML............',
  '....H....ENE............',
  '.........FNF............',
  '..........ENEF..........',
  '..........FNF...........',
  '......H....ENEF.........',
  '.....LML...FNF..........',
  '.....BVB....ENEF........',
  '.....MPM....FNF.........',
  '......VPV....ENEF.......',
  '......ENE....FNF........',
  '.......FNF....ENEF......',
  '........ENEF..FNF.......',
  '.........FNFE.ENEF......',
  '..........EFNFNFNF......',
  '...........EFNENEF......',
  '............EFNFNF......',
  '.............EFNENEF....',
  '..............EFNFNF....',
  '...............EFNENE...',
  '................EFNFN...',
  '.................EFNE...',
];

// 5. Right Arching Purple Moth Orchid Spray + Bud + Stem (24 x 36) at (51, 24)
const RIGHT_ORCHID_SPRAY = [
  '.................H......',
  '................HWH.....',
  '................LML.....',
  '...............WMVMW....',
  '............H..LBVBL..H.',
  '...........HWH.MVPVM.HWH',
  '...........LMLWMPDPMWLML',
  '...........WMVPVPDPVPVMW',
  '...........BVPMQAKQMPVB.',
  '...........LMVPQKYQPVML.',
  '...........MVPDQQQDPMV..',
  '..........HMVPVPDPVPMVH.',
  '.........WLBVPMVMVPBVLW.',
  '...........WMVPV.VPVMW..',
  '............LML...LML...',
  '............ENE....H....',
  '............FNF.........',
  '..........FENE..........',
  '...........FNF..........',
  '.........FENE....H......',
  '..........FNF...LML.....',
  '........FENE....BVB.....',
  '.........FNF....MPM.....',
  '.......FENE....VPV......',
  '........FNF....ENE......',
  '......FENE....FNF.......',
  '.......FNF..FENE........',
  '......FENE.EFNF.........',
  '......FNFNFNFE..........',
  '......FENENFE...........',
  '......FNFNFE............',
  '....FENENFE.............',
  '....FNFNFE..............',
  '...ENENFE...............',
  '...NFNFE................',
  '...ENFE.................',
];

// 6. Center-Left Foreground Purple Orchid + Stem (17 x 26) at (20, 33)
const LOWER_LEFT_ORCHID = [
  '.......H.........',
  '......HWH........',
  '......LML........',
  '..H..WMVMW..H....',
  '.HWH.LBVBL.HWH...',
  '.LMLWMPDPMWLML...',
  '..MVPVPDPVPVM....',
  '..BVPMQAKQMPVB...',
  '..LMVPQKYQPVML...',
  '...MVPDQQQDPMV...',
  '..HMVPVPDPVPMVH..',
  '..WLBVPMVMVPBVLW.',
  '...WMVPV.VPVMW...',
  '....LML...LML....',
  '.......ENE.......',
  '.......FNF.......',
  '........ENE......',
  '........FNF......',
  '.........ENE.....',
  '.........FNF.....',
  '..........ENE....',
  '..........FNF....',
  '..........ENE....',
  '..........FNF....',
  '..........ENE....',
  '..........EFE....',
];

// 7. Center-Right Foreground Purple Orchid + Stem (17 x 26) at (43, 33)
const LOWER_RIGHT_ORCHID = [
  '.........H.......',
  '........HWH......',
  '........LML......',
  '....H..WMVMW..H..',
  '...HWH.LBVBL.HWH.',
  '...LMLWMPDPMWLML.',
  '....MVPVPDPVPVM..',
  '...BVPMQAKQMPVB..',
  '...LMVPQKYQPVML..',
  '...MVPDQQQDPMV...',
  '..HMVPVPDPVPMVH..',
  '.WLBVPMVMVPBVLW..',
  '...WMVPV.VPVMW...',
  '....LML...LML....',
  '.......ENE.......',
  '.......FNF.......',
  '......ENE........',
  '......FNF........',
  '.....ENE.........',
  '.....FNF.........',
  '....ENE..........',
  '....FNF..........',
  '....ENE..........',
  '....FNF..........',
  '....ENE..........',
  '....EFE..........',
];

// Back spiky green leaves framing the stems (54 x 22) at (13, 33)
const FOLIAGE_BACK = [
  '..............Z........................Z..............',
  '.............NZN......................NZN.............',
  '.............FNF......................FNF.............',
  '.....Z.......EFE......................EFE.......Z.....',
  '....NZN........................................NZN....',
  '....FNFZ......................................ZFNF....',
  '.....EFNZN..................................NZNFE.....',
  '......EFNF..................................FNFE......',
  'Z......EFE.........Z..............Z.........EFE......Z',
  'NZ................NZN............NZN................ZN',
  'FNF...............FNF............FNF...............FNF',
  '.FNFZ.............EFE............EFE.............ZFNF.',
  '..FNZN..........................................NZNF..',
  '...EFNFZ......................................ZFNF....',
  '....EFNZN....................................NZNFE....',
  '.....EFNF....................................FNFE.....',
  '......EFN....................................NFE......',
];

// Bouquet purple paper wrap + golden ribbon bow (34 x 33) at (23, 54)
const BOUQUET_WRAP = [
  '..OOOO......................OOOO..',
  '.OSSSSO....................OSSSSO.',
  'OSSRSSSO..OOOO......OOOO..OSSSRSSO',
  'OSRRRRSSOORRRRO....ORRRROOSSRRRRSO',
  'ORRRRRRSSRRRRRROOORRRRRRRSSRRRRRRO',
  '.ORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRO.',
  '.OCCRRRRRCCCCRRRRRRRRCCCCRRRRRCCO.',
  '..OCCCCCUCUUUCCCCCCCCUUUCCCCCCCO..',
  '..OCCCCCCCCCCCCCCCCCCCCCCCCCCCCO..',
  '...OCCCRRRRRCCCCCCCCCCCRRRRRCCO...',
  '...OCCCCRRRRCCCCCCCCCCCRRRRCCCO...',
  '....OCCCCCRCCCCCCCCCCCCCRCCCCO....',
  '....OCCCCCCCCCCCCCCCCCCCCCCCCO....',
  '.....OUUCCCCCCCCCCCCCCCCCCUUO.....',
  '.....OCCCCCRCCCCCCCCCCCRCCCCO.....',
  '......OCCCCCRCCCCCCCCCRCCCCO......',
  '......OOGGGGGGGGGGGGGGGGGGOO......',
  '.....OGGYYYYYYYYYYYYYYYYYYGGO.....',
  '....OGYYKKYYYYGYYYYGYYYYKKYYGO....',
  '....OGYKKKKYYGYKYYKYGYYKKKKYGO....',
  '.....OGYYYYYGYKKKKKKYGYYYYYGO.....',
  '......OOGGGGYGKKKKKKGYGGGGOO......',
  '........OCCCCGYKYYKYGCCCCO........',
  '........OCCUOGYYGGYYGOUCCO........',
  '.........OCCOGYO..OYGOCCO.........',
  '.........OUCOGYO..OYGOCUO.........',
  '..........OCOYYO..OYYOCO..........',
  '..........OCOGYO..OYGOCO..........',
  '...........OOOO....OOOO...........',
  '...........OCCO....OCCO...........',
  '............OCO....OCO............',
  '............OUO....OUO............',
  '.............O......O.............',
];

// Cut green flower stem ends peeking out from the bottom of the wrap (12 x 10) at (34, 83)
const BOTTOM_STEMS = [
  '..E.F..N.E..',
  '..F.N..F.N..',
  '..E.F..E.F..',
  '...F.N.F.E..',
  '...E.F.N.E..',
  '...F.E.F....',
  '....E..E....',
  '....F.......',
];

interface FlowerSpriteConfig {
  id: string;
  label: string;
  runs: PixelRun[];
  spikeDx: number;
  spikeDy: number;
  pitchOffset: number;
  sparkX: number;
  sparkY: number;
}

export function SpikyPurpleBouquet({
  spikeTrigger,
  onBouquetPop,
}: SpikyPurpleBouquetProps) {
  const [activeSpikes, setActiveSpikes] = useState<Record<string, boolean>>({});
  const [wholePop, setWholePop] = useState(false);
  const [sparks, setSparks] = useState<FloatingSpark[]>([]);
  const sparkIdRef = useRef(0);
  const isFirstMount = useRef(true);

  const foliageRuns = useMemo(() => compileMatrix(FOLIAGE_BACK, PALETTE, 13, 33), []);
  const wrapRuns = useMemo(() => compileMatrix(BOUQUET_WRAP, PALETTE, 23, 54), []);
  const bottomStemRuns = useMemo(() => compileMatrix(BOTTOM_STEMS, PALETTE, 34, 83), []);

  const flowerSprites: FlowerSpriteConfig[] = useMemo(
    () => [
      {
        id: 'center-lily',
        label: 'Center Spiky Purple Lily',
        runs: compileMatrix(CENTER_LILY, PALETTE, 29, 3),
        spikeDx: 0,
        spikeDy: -5,
        pitchOffset: 7,
        sparkX: 40,
        sparkY: 14,
      },
      {
        id: 'left-lily',
        label: 'Left Purple Trumpet Lily',
        runs: compileMatrix(LEFT_LILY, PALETTE, 11, 12),
        spikeDx: -4,
        spikeDy: -4,
        pitchOffset: 4,
        sparkX: 20,
        sparkY: 22,
      },
      {
        id: 'right-lily',
        label: 'Right Purple Trumpet Lily',
        runs: compileMatrix(RIGHT_LILY, PALETTE, 46, 12),
        spikeDx: 4,
        spikeDy: -4,
        pitchOffset: 5,
        sparkX: 60,
        sparkY: 22,
      },
      {
        id: 'left-orchid-spray',
        label: 'Left Purple Orchid Spray',
        runs: compileMatrix(LEFT_ORCHID_SPRAY, PALETTE, 5, 24),
        spikeDx: -5,
        spikeDy: -2,
        pitchOffset: 2,
        sparkX: 12,
        sparkY: 32,
      },
      {
        id: 'right-orchid-spray',
        label: 'Right Purple Orchid Spray',
        runs: compileMatrix(RIGHT_ORCHID_SPRAY, PALETTE, 51, 24),
        spikeDx: 5,
        spikeDy: -2,
        pitchOffset: 3,
        sparkX: 68,
        sparkY: 32,
      },
      {
        id: 'lower-left-orchid',
        label: 'Foreground Left Purple Orchid',
        runs: compileMatrix(LOWER_LEFT_ORCHID, PALETTE, 20, 33),
        spikeDx: -2,
        spikeDy: -3,
        pitchOffset: -2,
        sparkX: 27,
        sparkY: 41,
      },
      {
        id: 'lower-right-orchid',
        label: 'Foreground Right Purple Orchid',
        runs: compileMatrix(LOWER_RIGHT_ORCHID, PALETTE, 43, 33),
        spikeDx: 2,
        spikeDy: -3,
        pitchOffset: -1,
        sparkX: 52,
        sparkY: 41,
      },
    ],
    []
  );

  const spawnSparks = (cx: number, cy: number, count = 6) => {
    const colors = ['#e9d5ff', '#c084fc', '#a855f7', '#fde047', '#f472b6'];
    const created: FloatingSpark[] = Array.from({ length: count }, (_, idx) => {
      const angle = (Math.PI * 2 * idx) / count + (Math.random() - 0.5) * 0.6;
      const dist = 6 + Math.random() * 7;
      return {
        id: ++sparkIdRef.current,
        x: cx,
        y: cy,
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist) - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setSparks((prev) => [...prev.slice(-24), ...created]);
    window.setTimeout(() => {
      const ids = new Set(created.map((s) => s.id));
      setSparks((prev) => prev.filter((s) => !ids.has(s.id)));
    }, 500);
  };

  const triggerAllSpike = () => {
    setWholePop(true);
    const allActive: Record<string, boolean> = {};
    flowerSprites.forEach((f) => {
      allActive[f.id] = true;
    });
    setActiveSpikes(allActive);
    spawnSparks(40, 24, 10);

    window.setTimeout(() => {
      setWholePop(false);
      setActiveSpikes({});
    }, 340);
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    triggerAllSpike();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spikeTrigger]);

  const handleFlowerClick = (sprite: FlowerSpriteConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    playSpikeChime(sprite.pitchOffset);
    setActiveSpikes((prev) => ({ ...prev, [sprite.id]: true }));
    spawnSparks(sprite.sparkX, sprite.sparkY, 7);
    window.setTimeout(() => {
      setActiveSpikes((prev) => ({ ...prev, [sprite.id]: false }));
    }, 320);
    onBouquetPop?.();
  };

  const handleBouquetClick = () => {
    playSpikeChime(0);
    triggerAllSpike();
    onBouquetPop?.();
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Subtle radial purple backlight glow behind the bouquet */}
      <div
        aria-hidden="true"
        className="absolute inset-0 m-auto w-64 h-64 sm:w-80 sm:h-80 pointer-events-none opacity-65"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.34) 0%, rgba(126,34,206,0.12) 52%, transparent 72%)',
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Interactive spiky bouquet of purple lilies and orchids with green stems. Click to pop flowers and launch confetti."
        onClick={handleBouquetClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBouquetClick();
          }
        }}
        className={`relative cursor-pointer focus-visible:outline-3 focus-visible:outline-[#fde047] focus-visible:outline-offset-4 transition-transform ${
          wholePop ? 'animate-spike-pop' : 'animate-pixel-float'
        }`}
      >
        <svg
          viewBox="0 0 80 94"
          shapeRendering="crispEdges"
          className="w-[270px] h-[318px] sm:w-[330px] sm:h-[388px] md:w-[360px] md:h-[423px] drop-shadow-[6px_6px_0px_#0c031c]"
        >
          {/* Back spiky green leaves */}
          <g aria-hidden="true">
            {foliageRuns.map((run, idx) => (
              <rect
                key={`foliage-${idx}`}
                x={run.x}
                y={run.y}
                width={run.w}
                height={1}
                fill={run.fill}
              />
            ))}
          </g>

          {/* Bottom cut green stems peeking below the wrap */}
          <g aria-hidden="true">
            {bottomStemRuns.map((run, idx) => (
              <rect
                key={`bottom-stem-${idx}`}
                x={run.x}
                y={run.y}
                width={run.w}
                height={1}
                fill={run.fill}
              />
            ))}
          </g>

          {/* Individual stemmed purple lilies and orchids (tucked into wrap) */}
          {flowerSprites.map((sprite) => {
            const isSpiking = Boolean(activeSpikes[sprite.id]);
            return (
              <g
                key={sprite.id}
                role="button"
                aria-label={sprite.label}
                onClick={(e) => handleFlowerClick(sprite, e)}
                style={{
                  transform: isSpiking
                    ? `translate(${sprite.spikeDx}px, ${sprite.spikeDy}px) scale(1.05)`
                    : 'translate(0px, 0px) scale(1)',
                  transformOrigin: `${sprite.sparkX}px ${sprite.sparkY}px`,
                  transition: 'transform 210ms cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                }}
              >
                {sprite.runs.map((run, idx) => (
                  <rect
                    key={`${sprite.id}-${idx}`}
                    x={run.x}
                    y={run.y}
                    width={run.w}
                    height={1}
                    fill={run.fill}
                  />
                ))}
              </g>
            );
          })}

          {/* Purple paper wrap & golden bow placed in front of lower stem bases */}
          <g aria-hidden="true">
            {wrapRuns.map((run, idx) => (
              <rect
                key={`wrap-${idx}`}
                x={run.x}
                y={run.y}
                width={run.w}
                height={1}
                fill={run.fill}
              />
            ))}
          </g>

          {/* Floating pixel sparkles on pop */}
          {sparks.map((spark) => (
            <rect
              key={spark.id}
              x={spark.x + spark.dx}
              y={spark.y + spark.dy}
              width={2}
              height={2}
              fill={spark.color}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
