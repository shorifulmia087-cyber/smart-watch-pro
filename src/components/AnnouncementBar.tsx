import { useState, useEffect } from 'react';
import FlipDigit from './FlipDigit';

interface AnnouncementBarProps {
  discountPercent?: number;
  countdownHours?: number;
  announcementText?: string;
  timerEnabled?: boolean;
  offerStartAt?: string | null;
  offerEndAt?: string | null;
}

const toTimeParts = (totalSeconds: number) => {
  if (totalSeconds <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
};

const pad = (n: number) => String(n).padStart(2, '0');

const AnnouncementBar = ({
  discountPercent = 30,
  countdownHours = 2,
  announcementText,
  timerEnabled = true,
  offerStartAt,
  offerEndAt,
}: AnnouncementBarProps) => {
  const [time, setTime] = useState({ d: 0, h: countdownHours, m: 0, s: 0 });
  const [timerLabel, setTimerLabel] = useState('অফার শেষ হতে বাকি:');

  useEffect(() => {
    if (!offerStartAt || !offerEndAt) {
      setTime({ d: 0, h: countdownHours, m: 0, s: 0 });
      setTimerLabel('অফার শেষ হতে বাকি:');
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
          setTimerLabel('অফার শুরু হতে বাকি:');
          setTime(toTimeParts(Math.floor((start - now) / 1000)));
          return;
        }
        if (now <= end) {
          setTimerLabel('অফার শেষ হতে বাকি:');
          setTime(toTimeParts(Math.floor((end - now) / 1000)));
          return;
        }
        setTimerLabel('অফার শেষ');
        setTime({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimerLabel('অফার শেষ হতে বাকি:');
      setTime((prev) => {
        const totalSeconds = prev.d * 86400 + prev.h * 3600 + prev.m * 60 + prev.s - 1;
        return toTimeParts(totalSeconds);
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timerEnabled, offerStartAt, offerEndAt]);

  const units = [
    { value: pad(time.d), label: 'দিন' },
    { value: pad(time.h), label: 'ঘণ্টা' },
    { value: pad(time.m), label: 'মিনিট' },
    { value: pad(time.s), label: 'সেকেন্ড' },
  ];

  return (
    <div className="sticky top-0 z-50 bg-[#0a0a0f] py-2.5 sm:py-3 px-3 sm:px-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        {/* Left text */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          {announcementText ? (
            <span className="text-[#D4AF37] font-bold text-sm sm:text-base md:text-lg">
              {announcementText}
            </span>
          ) : (
            <span className="text-[#D4AF37] font-bold text-sm sm:text-base md:text-lg">
              🔥 {timerLabel}
            </span>
          )}
        </div>

        {/* Flip timer */}
        {timerEnabled && (
          <div className="flex items-end gap-1.5 sm:gap-2.5 md:gap-3">
            {units.map((unit, i) => (
              <div key={i} className="flex items-end gap-1.5 sm:gap-2.5">
                {i > 0 && (
                  <span className="text-[#D4AF37] font-bold text-lg sm:text-xl md:text-2xl pb-5 sm:pb-6">:</span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-[3px] sm:gap-1">
                    <FlipDigit value={unit.value[0]} />
                    <FlipDigit value={unit.value[1]} />
                  </div>
                  <span className="text-[#D4AF37] text-[8px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                    {unit.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
