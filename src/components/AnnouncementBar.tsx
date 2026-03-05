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
    <div className="sticky top-0 z-50 bg-ink text-accent-foreground py-4 px-4 leading-relaxed">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 text-base md:text-lg">
        <span className="text-gold font-bold text-lg md:text-xl drop-shadow-[0_0_8px_hsl(var(--gold)/0.4)] animate-pulse">
          {announcementText || `🔥 ${toBengaliNum(discountPercent)}% ছাড়`}
        </span>
        {timerEnabled && (
          <>
            <span className="text-gold/60 text-xl">|</span>
            <span className="text-gold tabular-nums font-extrabold tracking-wide text-lg md:text-xl drop-shadow-[0_0_10px_hsl(var(--gold)/0.5)]">
              {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
            </span>
            <span className="text-gold/80 font-semibold">{timerLabel}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
