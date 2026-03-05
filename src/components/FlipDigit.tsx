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
      const t = setTimeout(() => setFlipping(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);

  const digit = "font-extrabold text-white text-xl sm:text-2xl md:text-3xl tabular-nums";

  return (
    <div
      className="relative w-[28px] h-[40px] sm:w-[36px] sm:h-[50px] md:w-[44px] md:h-[58px]"
      style={{ perspective: '400px' }}
    >
      {/* Static top half — CURRENT */}
      <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden rounded-t-[4px] bg-[#2c2c30]">
        <span className={`absolute top-0 left-0 right-0 h-[200%] flex items-center justify-center ${digit}`}>
          {current}
        </span>
      </div>

      {/* Static bottom half — CURRENT */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden rounded-b-[4px] bg-[#232327]">
        <span className={`absolute bottom-0 left-0 right-0 h-[200%] flex items-center justify-center ${digit}`}>
          {current}
        </span>
      </div>

      {/* Flip: upper flap falls down showing PREVIOUS */}
      {flipping && (
        <div
          className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden rounded-t-[4px] bg-[#2c2c30] z-[3]"
          style={{
            transformOrigin: 'bottom center',
            animation: 'flipTopDown 0.2s cubic-bezier(0.32, 0, 0.67, 0) forwards',
            backfaceVisibility: 'hidden',
          }}
        >
          <span className={`absolute top-0 left-0 right-0 h-[200%] flex items-center justify-center ${digit}`}>
            {previous}
          </span>
        </div>
      )}

      {/* Flip: lower flap unfolds showing CURRENT */}
      {flipping && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden rounded-b-[4px] bg-[#232327] z-[3]"
          style={{
            transformOrigin: 'top center',
            animation: 'flipBottomDown 0.3s 0.15s ease-out forwards',
            backfaceVisibility: 'hidden',
            transform: 'rotateX(90deg)',
          }}
        >
          <span className={`absolute bottom-0 left-0 right-0 h-[200%] flex items-center justify-center ${digit}`}>
            {current}
          </span>
        </div>
      )}

      {/* Subtle hairline split */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-black/20 z-[5]" />

      {/* Top shine */}
      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[4px] bg-gradient-to-b from-white/[0.05] to-transparent z-[4] pointer-events-none" />
    </div>
  );
};

export default FlipDigit;
