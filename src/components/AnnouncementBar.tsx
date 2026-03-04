import { useState, useEffect } from 'react';
import { toBengaliNum } from '@/lib/bengali';

const AnnouncementBar = () => {
  const [time, setTime] = useState({ h: 1, m: 59, s: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        const totalSeconds = prev.h * 3600 + prev.m * 60 + prev.s - 1;
        if (totalSeconds <= 0) return { h: 0, m: 0, s: 0 };
        return {
          h: Math.floor(totalSeconds / 3600),
          m: Math.floor((totalSeconds % 3600) / 60),
          s: totalSeconds % 60,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => toBengaliNum(String(n).padStart(2, '0'));

  return (
    <div className="sticky top-0 z-50 bg-ink text-accent-foreground py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm md:text-base">
        <span className="text-gold font-semibold">🔥 ৩০% ছাড়</span>
        <span className="text-gold/60">|</span>
        <span className="text-gold/90 tabular-nums font-semibold tracking-wide">
          {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
        </span>
        <span className="hidden sm:inline text-gold/70 font-light">সময় বাকি আছে</span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
