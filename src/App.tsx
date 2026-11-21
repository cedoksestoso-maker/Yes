import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Music, Sparkles, Flower2, VolumeX } from 'lucide-react';
import { PixelBalloons } from './components/PixelBalloons';
import {
  PixelConfettiCanvas,
  type PixelConfettiHandle,
} from './components/PixelConfettiCanvas';
import { SpikyPurpleBouquet } from './components/SpikyPurpleBouquet';
import {
  playConfettiPop,
  playSpikeChime,
  startBirthdayTune,
} from './utils/chiptune';

const BIRTHDAY_WISHES = [
  'happy birthday boi hehe, I hope you enjoy your day!',
  'Wishing u a stress-free year full of laughter!',
  'happy legality day Rianne!! hope u eat good food, have tons of fun, and enjoy every moment hehe',
];

export default function App() {
  const confettiRef = useRef<PixelConfettiHandle | null>(null);
  const stopTuneRef = useRef<(() => void) | null>(null);

  const [spikeTrigger, setSpikeTrigger] = useState(0);
  const [isPlayingTune, setIsPlayingTune] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [wishIndex, setWishIndex] = useState(0);

  useEffect(() => {
    return () => {
      stopTuneRef.current?.();
    };
  }, []);

  const handlePopBouquet = () => {
    setSpikeTrigger((prev) => prev + 1);
    playSpikeChime(0);
    confettiRef.current?.burst(0.5, 0.44, 52);
  };

  const handleBouquetStagePop = () => {
    confettiRef.current?.burst(0.5, 0.44, 34);
  };

  const handleConfettiBurst = () => {
    playConfettiPop();
    confettiRef.current?.burst(0.5, 0.48, 84);
  };

  const handleToggleTune = () => {
    if (isPlayingTune) {
      stopTuneRef.current?.();
      stopTuneRef.current = null;
      setIsPlayingTune(false);
      return;
    }

    setIsPlayingTune(true);
    confettiRef.current?.burst(0.5, 0.42, 40);
    stopTuneRef.current = startBirthdayTune(() => {
      setIsPlayingTune(false);
      stopTuneRef.current = null;
    });
  };

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback for restricted iframe clipboard permissions
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleNextWish = () => {
    playSpikeChime(4);
    setWishIndex((prev) => (prev + 1) % BIRTHDAY_WISHES.length);
  };

  const handleBalloonPop = (xRatio: number, yRatio: number) => {
    confettiRef.current?.burst(xRatio, yRatio, 28);
  };

  return (
    <div className="relative min-h-screen w-full pixel-bg-dither text-[#f3e8ff] flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 overflow-x-hidden">
      {/* Moving pixel confetti background */}
      <PixelConfettiCanvas ref={confettiRef} />

      {/* Floating pixel balloons */}
      <PixelBalloons onBalloonPop={handleBalloonPop} />

      {/* Subtle retro CRT scanlines */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-10 pointer-events-none pixel-scanlines opacity-55"
      />

      {/* Main Retro Pixel Window */}
      <main className="relative z-20 w-full max-w-3xl pixel-frame">
        {/* Classic 16-bit purple window title bar */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#3b0764] border-b-4 border-[#7e3af2]">
          <span className="font-pixel-body text-xs sm:text-sm tracking-wider text-[#e9d5ff] truncate">
            birthday_card.exe
          </span>
          <div className="flex items-center gap-2 shrink-0" aria-hidden="true">
            <span className="w-3.5 h-3.5 bg-[#a855f7] border-2 border-[#e9d5ff] inline-block" />
            <span className="w-3.5 h-3.5 bg-[#7e22ce] border-2 border-[#c084fc] inline-block" />
            <span className="w-3.5 h-3.5 bg-[#fde047] border-2 border-[#fef08a] inline-block" />
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-5 sm:p-8 md:p-10 flex flex-col items-center text-center gap-6 sm:gap-8">
          {/* Primary Heading */}
          <header className="w-full flex flex-col items-center gap-3">
            <h1
              className="font-pixel-display text-[1.5rem] sm:text-4xl md:text-[2.55rem] leading-[1.35] text-[#faf5ff] text-balance tracking-wide"
              style={{
                textShadow: '4px 4px 0px #581c87, 7px 7px 0px #120526',
              }}
            >
              happy birthday boi
            </h1>
            <p className="font-pixel-body text-sm sm:text-base text-[#d8b4fe] max-w-xl leading-relaxed">
              Happy legality day, Rianne — celebrate big and pop some balloons.
            </p>
          </header>

          {/* Centerpiece Stage */}
          <section
            aria-label="Birthday centerpiece"
            className="w-full pixel-inner-panel px-4 py-6 sm:py-8 flex flex-col items-center justify-center gap-4"
          >
            <SpikyPurpleBouquet
              spikeTrigger={spikeTrigger}
              onBouquetPop={handleBouquetStagePop}
            />
            <p className="font-pixel-body text-xs sm:text-sm text-[#c084fc]">
              Tap the centerpiece or floating balloons to pop
            </p>
          </section>

          {/* Interactive Retro Controls */}
          <div className="w-full flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handlePopBouquet}
              className="pixel-btn px-4 py-3 min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <Flower2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Party Pop</span>
            </button>

            <button
              type="button"
              onClick={handleConfettiBurst}
              className="pixel-btn px-4 py-3 min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Confetti Burst</span>
            </button>

            <button
              type="button"
              onClick={handleToggleTune}
              className="pixel-btn pixel-btn-secondary px-4 py-3 min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              {isPlayingTune ? (
                <>
                  <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Stop Tune</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Play Tune</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="pixel-btn pixel-btn-secondary px-4 py-3 min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-[#fde047] shrink-0" aria-hidden="true" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Retro RPG Dialog Birthday Wish Box */}
          <section
            aria-label="Birthday note"
            className="w-full pixel-inner-panel p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left"
          >
            <p className="font-pixel-body text-sm sm:text-base text-[#f3e8ff] leading-relaxed">
              {BIRTHDAY_WISHES[wishIndex]}
            </p>
            <button
              type="button"
              onClick={handleNextWish}
              className="pixel-btn pixel-btn-secondary px-4 py-2.5 min-h-[44px] text-xs whitespace-nowrap shrink-0 self-end sm:self-center"
            >
              Next Wish
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
