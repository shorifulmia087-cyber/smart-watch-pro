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
      setCurrent(value);
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 500);
      return () => clearTimeout(t);
    }
  }, [value]);

  const digitStyle = "font-extrabold text-white text-xl sm:text-2xl md:text-3xl tabular-nums";

  return (
    <div
      className="relative w-[28px] h-[40px] sm:w-[36px] sm:h-[50px] md:w-[44px] md:h-[58px]"
      style={{ perspective: '300px' }}
    >
      {/* ── STATIC LAYERS (always visible) ── */}

      {/* Top half — shows CURRENT */}
      <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden rounded-t-md sm:rounded-t-lg bg-[#2e2e32] z-[1]">
        <span className={`absolute top-0 left-0 right-0 h-[200%] flex items-center justify-center ${digitStyle}`}>
          {current}
        </span>
      </div>

      {/* Bottom half — shows CURRENT */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden rounded-b-md sm:rounded-b-lg bg-[#242428] z-[1]">
        <span className={`absolute bottom-0 left-0 right-0 h-[200%] flex items-center justify-center ${digitStyle}`}>
          {current}
        </span>
      </div>

      {/* ── FLIP LAYERS (only during animation) ── */}

      {flipping && (
        <>
          {/* Upper flap — falls DOWN, shows PREVIOUS number */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden rounded-t-md sm:rounded-t-lg bg-[#2e2e32] z-[3]"
            style={{
              transformOrigin: 'bottom center',
              animation: 'flipTopDown 0.5s ease-in forwards',
              backfaceVisibility: 'hidden',
            }}
          >
            <span className={`absolute top-0 left-0 right-0 h-[200%] flex items-center justify-center ${digitStyle}`}>
              {previous}
            </span>
          </div>

          {/* Lower flap — unfolds from TOP, shows CURRENT number */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden rounded-b-md sm:rounded-b-lg bg-[#242428] z-[3]"
            style={{
              transformOrigin: 'top center',
              animation: 'flipBottomDown 0.5s 0.25s ease-out forwards',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(90deg)',
            }}
          >
            <span className={`absolute bottom-0 left-0 right-0 h-[200%] flex items-center justify-center ${digitStyle}`}>
              {current}
            </span>
          </div>
        </>
      )}

      {/* ── CENTER HAIRLINE ── */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-black/50 z-[5]" />

      {/* ── TOP SHINE ── */}
      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-md sm:rounded-t-lg bg-gradient-to-b from-white/[0.07] to-transparent z-[4] pointer-events-none" />
    </div>
  );
};

export default FlipDigit;
