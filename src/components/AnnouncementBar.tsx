import { useState, useEffect } from 'react';
import { toBengaliNum } from '@/lib/bengali';

interface AnnouncementBarProps {
  discountPercent?: number;
  countdownHours?: number;
  announcementText?: string;
  timerEnabled?: boolean;
  offerStartAt?: string | null;
  offerEndAt?: string | null;
}

const toTimeParts = (totalSeconds: number) => {
  if (totalSeconds <= 0) return { h: 0, m: 0, s: 0 };
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
};

const AnnouncementBar = ({
  discountPercent = 30,
  countdownHours = 2,
  announcementText,
  timerEnabled = true,
  offerStartAt,
  offerEndAt,
}: AnnouncementBarProps) => {
  const [time, setTime] = useState({ h: countdownHours, m: 0, s: 0 });
  const [timerLabel, setTimerLabel] = useState('সময় বাকি আছে');

  useEffect(() => {
    if (!offerStartAt || !offerEndAt) {
      setTime({ h: countdownHours, m: 0, s: 0 });
      setTimerLabel('সময় বাকি আছে');
    }
  }, [countdownHours, offerStartAt, offerEndAt]);

  useEffect(() => {
    if (!timerEnabled) return;

    const start = offerStartAt ? new Date(offerStartAt).getTime() : NaN;
    const end = offerEndAt ? new Date(offerEndAt).getTime() : NaN;
    const hasSchedule = Number.isFinite(start) && Number.isFinite(end) && end > start;

    const tick = () => {
      if (hasSchedule) {
        const now = Date.now();

        if (now < start) {
          setTimerLabel('অফার শুরু হতে বাকি');
          setTime(toTimeParts(Math.floor((start - now) / 1000)));
          return;
        }

        if (now <= end) {
          setTimerLabel('সময় বাকি আছে');
          setTime(toTimeParts(Math.floor((end - now) / 1000)));
          return;
        }

        setTimerLabel('অফার শেষ');
        setTime({ h: 0, m: 0, s: 0 });
        return;
      }

      setTimerLabel('সময় বাকি আছে');
      setTime((prev) => {
        const totalSeconds = prev.h * 3600 + prev.m * 60 + prev.s - 1;
        return toTimeParts(totalSeconds);
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timerEnabled, offerStartAt, offerEndAt]);

  const pad = (n: number) => toBengaliNum(String(n).padStart(2, '0'));

  const isExpired = time.h === 0 && time.m === 0 && time.s === 0 && timerLabel === 'অফার শেষ';

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-ink via-ink/95 to-ink text-accent-foreground py-3.5 px-4 leading-relaxed overflow-hidden">
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
      
      <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5">
        {/* Discount text with glow */}
        <span className="text-gold font-bold text-lg md:text-xl drop-shadow-[0_0_12px_hsl(var(--gold)/0.5)] animate-pulse">
          {announcementText || `🔥 ${toBengaliNum(discountPercent)}% ছাড়`}
        </span>

        {timerEnabled && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-gold/40 text-xl">|</span>
            
            {/* Timer digits */}
            <div className="flex items-center gap-1.5">
              {[
                { value: pad(time.h), label: 'ঘণ্টা' },
                { value: pad(time.m), label: 'মিনিট' },
                { value: pad(time.s), label: 'সেকেন্ড' },
              ].map((unit, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-gold/60 font-bold text-lg animate-pulse">:</span>
                  )}
                  <div className="flex flex-col items-center">
                    <span className={`
                      tabular-nums font-extrabold text-lg md:text-xl px-2.5 py-1 rounded-lg
                      bg-gold/15 border border-gold/25 text-gold
                      drop-shadow-[0_0_8px_hsl(var(--gold)/0.4)]
                      ${isExpired ? 'opacity-50' : ''}
                    `}>
                      {unit.value}
                    </span>
                    <span className="text-gold/50 text-[10px] font-medium mt-0.5">{unit.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timer label badge */}
            <span className={`
              text-xs sm:text-sm font-semibold px-3 py-1 rounded-full ml-1
              ${isExpired 
                ? 'bg-destructive/20 text-destructive border border-destructive/30' 
                : 'bg-gold/15 text-gold border border-gold/25 drop-shadow-[0_0_6px_hsl(var(--gold)/0.3)]'
              }
            `}>
              {timerLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
