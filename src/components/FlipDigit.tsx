import { useState, useEffect, useRef } from 'react';

interface FlipDigitProps {
  value: string;
}

const FlipDigit = ({ value }: FlipDigitProps) => {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setCurrent(value);
      setPrevious(value);
      return;
    }
    if (value !== current) {
      setPrevious(current);
      setFlipping(true);
      setTimeout(() => {
        setCurrent(value);
        setFlipping(false);
      }, 400);
    }
  }, [value]);

  return (
    <div className="relative w-[28px] h-[40px] sm:w-[36px] sm:h-[50px] md:w-[44px] md:h-[58px] text-center" style={{ perspective: '200px' }}>
      {/* Static bottom half — shows NEW value */}
      <div className="absolute inset-0 rounded-md sm:rounded-lg overflow-hidden bg-gradient-to-b from-[#2a2a2e] to-[#1a1a1e] border border-white/[0.06]">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
          <span className="absolute bottom-0 left-0 right-0 h-[200%] flex items-center justify-center font-extrabold text-white text-xl sm:text-2xl md:text-3xl tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {flipping ? value : current}
          </span>
        </div>
      </div>

      {/* Static top half — shows CURRENT value */}
      <div className="absolute inset-0 rounded-md sm:rounded-lg overflow-hidden bg-gradient-to-b from-[#3a3a3e] to-[#2a2a2e] border border-white/[0.06]">
        <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden">
          <span className="absolute top-0 left-0 right-0 h-[200%] flex items-center justify-center font-extrabold text-white text-xl sm:text-2xl md:text-3xl tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {current}
          </span>
        </div>
      </div>

      {/* Center divider line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-px h-[1.5px] bg-black/60 z-20" />

      {/* Flipping top half (folds down) — shows PREVIOUS value on front */}
      {flipping && (
        <div
          className="absolute inset-0 rounded-md sm:rounded-lg overflow-hidden z-30"
          style={{
            transformOrigin: 'bottom center',
            animation: 'flipTop 0.4s ease-in forwards',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden bg-gradient-to-b from-[#3a3a3e] to-[#2a2a2e] rounded-t-md sm:rounded-t-lg">
            <span className="absolute top-0 left-0 right-0 h-[200%] flex items-center justify-center font-extrabold text-white text-xl sm:text-2xl md:text-3xl tabular-nums">
              {previous}
            </span>
          </div>
        </div>
      )}

      {/* Flipping bottom half (unfolds from top) — shows NEW value */}
      {flipping && (
        <div
          className="absolute inset-0 rounded-md sm:rounded-lg overflow-hidden z-30"
          style={{
            transformOrigin: 'top center',
            animation: 'flipBottom 0.4s 0.2s ease-out forwards',
            backfaceVisibility: 'hidden',
            transform: 'rotateX(90deg)',
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden bg-gradient-to-b from-[#2a2a2e] to-[#1a1a1e] rounded-b-md sm:rounded-b-lg">
            <span className="absolute bottom-0 left-0 right-0 h-[200%] flex items-center justify-center font-extrabold text-white text-xl sm:text-2xl md:text-3xl tabular-nums">
              {value}
            </span>
          </div>
        </div>
      )}

      {/* Subtle shine on top half */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-md sm:rounded-t-lg z-10 pointer-events-none" />
    </div>
  );
};

export default FlipDigit;
