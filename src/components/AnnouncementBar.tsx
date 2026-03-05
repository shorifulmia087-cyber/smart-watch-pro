import { useState, useEffect, useRef, useCallback, memo } from 'react';
import FlipDigit from './FlipDigit';

interface AnnouncementBarProps {
  discountPercent?: number;
  countdownHours?: number;
  announcementText?: string;
  timerEnabled?: boolean;
  offerStartAt?: string | null;
  offerEndAt?: string | null;
}

interface TimeParts { d: number; h: number; m: number; s: number }

const toTimeParts = (totalSeconds: number): TimeParts => {
  if (totalSeconds <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
};

const pad = (n: number) => String(n).padStart(2, '0');

const FlipUnit = memo(({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex gap-[3px] sm:gap-1">
      <FlipDigit value={value[0]} />
      <FlipDigit value={value[1]} />
    </div>
    <span className="text-[#D4AF37] text-[8px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider">
      {label}
    </span>
  </div>
));
FlipUnit.displayName = 'FlipUnit';

const AnnouncementBar = ({
  discountPercent = 30,
  countdownHours = 2,
  announcementText,
  timerEnabled = true,
  offerStartAt,
  offerEndAt,
}: AnnouncementBarProps) => {
  // For non-scheduled mode, store the absolute target time
  const fallbackTarget = useRef(Date.now() + countdownHours * 3600_000);
  const [time, setTime] = useState<TimeParts>({ d: 0, h: countdownHours, m: 0, s: 0 });
  const [timerLabel, setTimerLabel] = useState('অফার শেষ হতে বাকি:');
  const rafId = useRef(0);

  // Reset fallback target when countdownHours changes and no schedule
  useEffect(() => {
    if (!offerStartAt || !offerEndAt) {
      fallbackTarget.current = Date.now() + countdownHours * 3600_000;
    }
  }, [countdownHours, offerStartAt, offerEndAt]);

  const tick = useCallback(() => {
    const start = offerStartAt ? new Date(offerStartAt).getTime() : NaN;
    const end = offerEndAt ? new Date(offerEndAt).getTime() : NaN;
    const hasSchedule = Number.isFinite(start) && Number.isFinite(end) && end > start;
    const now = Date.now();

    if (hasSchedule) {
      if (now < start) {
        setTimerLabel('অফার শুরু হতে বাকি:');
        setTime(toTimeParts(Math.floor((start - now) / 1000)));
      } else if (now <= end) {
        setTimerLabel('অফার শেষ হতে বাকি:');
        setTime(toTimeParts(Math.floor((end - now) / 1000)));
      } else {
        setTimerLabel('অফার শেষ');
        setTime({ d: 0, h: 0, m: 0, s: 0 });
      }
    } else {
      setTimerLabel('অফার শেষ হতে বাকি:');
      const remaining = Math.max(0, Math.floor((fallbackTarget.current - now) / 1000));
      setTime(toTimeParts(remaining));
    }
  }, [offerStartAt, offerEndAt]);

  useEffect(() => {
    if (!timerEnabled) return;

    let lastSecond = -1;

    const loop = () => {
      const nowSecond = Math.floor(Date.now() / 1000);
      if (nowSecond !== lastSecond) {
        lastSecond = nowSecond;
        tick();
      }
      rafId.current = requestAnimationFrame(loop);
    };

    // Re-sync on visibility change (background tab)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastSecond = -1; // force immediate update
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    tick();
    rafId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [timerEnabled, tick]);

  const units = [
    { value: pad(time.d), label: 'দিন' },
    { value: pad(time.h), label: 'ঘণ্টা' },
    { value: pad(time.m), label: 'মিনিট' },
    { value: pad(time.s), label: 'সেকেন্ড' },
  ];

  return (
    <div className="sticky top-0 z-50 bg-[#0a0a0f] py-2.5 sm:py-3 px-3 sm:px-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        <div className="flex items-center gap-2 text-center sm:text-left">
          {announcementText ? (
            <span className="text-[#D4AF37] font-bold text-sm sm:text-base md:text-lg">{announcementText}</span>
          ) : (
            <span className="text-[#D4AF37] font-bold text-sm sm:text-base md:text-lg">🔥 {timerLabel}</span>
          )}
        </div>

        {timerEnabled && (
          <div className="flex items-end gap-1.5 sm:gap-2.5 md:gap-3">
            {units.map((unit, i) => (
              <div key={i} className="flex items-end gap-1.5 sm:gap-2.5">
                {i > 0 && (
                  <span className="text-[#D4AF37] font-bold text-lg sm:text-xl md:text-2xl pb-5 sm:pb-6">:</span>
                )}
                <FlipUnit value={unit.value} label={unit.label} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
