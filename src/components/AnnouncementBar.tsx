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

  return (
    <div className="sticky top-0 z-50 bg-ink text-accent-foreground py-3 px-4 leading-relaxed">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 text-base md:text-lg">
        <span className="text-gold font-bold text-lg md:text-xl">
          {announcementText || `🔥 ${toBengaliNum(discountPercent)}% ছাড়`}
        </span>
        {timerEnabled && (
          <>
            <span className="text-gold/40 text-xl hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { value: pad(time.h), label: 'ঘণ্টা' },
                { value: pad(time.m), label: 'মিনিট' },
                { value: pad(time.s), label: 'সেকেন্ড' },
              ].map((unit, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                  {i > 0 && (
                    <span className="text-surface/30 font-bold text-xl">:</span>
                  )}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="relative bg-gradient-to-b from-[hsl(220,15%,18%)] to-[hsl(220,15%,12%)] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-surface/10 shadow-[inset_0_1px_0_hsl(0,0%,100%,0.08),0_4px_12px_hsl(0,0%,0%,0.4)] min-w-[36px] sm:min-w-[44px]">
                      {/* Flip card divider line */}
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-surface/5" />
                      <span className="relative tabular-nums font-extrabold text-xl sm:text-2xl text-surface tracking-wider block text-center">
                        {unit.value}
                      </span>
                    </div>
                    <span className="text-gold/60 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">
                      {unit.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <span className="text-gold/70 font-medium text-sm hidden sm:inline">{timerLabel}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
