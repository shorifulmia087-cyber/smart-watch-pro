import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatBengaliPrice } from '@/lib/bengali';

interface ColorVariant {
  color: string;
  hex: string;
  image_url: string;
}

interface HeroSliderProps {
  onOrderClick: () => void;
  images: { src: string; label: string }[];
  subtitle: string;
  tagline?: string;
  price?: number;
  discountPercent?: number;
  colorVariants?: ColorVariant[];
}

const HeroSlider = ({ onOrderClick, images, subtitle, tagline = 'প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন।', price = 0, discountPercent = 0, colorVariants = [] }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const originalPrice = discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : price;

  // When a color is selected, show that color's image; otherwise show from images array
  const displayImages = selectedColorIdx !== null && colorVariants[selectedColorIdx]
    ? [{ src: colorVariants[selectedColorIdx].image_url, label: colorVariants[selectedColorIdx].color }]
    : images;

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (displayImages.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setDirection(1);
        setCurrent((c) => (c + 1) % displayImages.length);
      }, 3000);
    }
  }, [displayImages.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % displayImages.length);
    resetAutoSlide();
  }, [displayImages.length, resetAutoSlide]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + displayImages.length) % displayImages.length);
    resetAutoSlide();
  }, [displayImages.length, resetAutoSlide]);

  useEffect(() => {
    resetAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [resetAutoSlide]);

  // Reset slider index when color changes
  useEffect(() => {
    setCurrent(0);
  }, [selectedColorIdx]);

  const handleColorSelect = (idx: number) => {
    setSelectedColorIdx(prev => prev === idx ? null : idx);
  };

  return (
    <section className="bg-surface relative" style={{
      backgroundImage: `linear-gradient(hsl(var(--border) / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.18) 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
    }}>
      <div className="text-center pt-10 pb-6 px-4">
        <motion.p
          key={subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.77, 0, 0.18, 1] }}
          className="text-xl md:text-2xl text-foreground font-semibold leading-relaxed max-w-2xl mx-auto"
        >
          <span className="text-gold drop-shadow-[0_0_8px_hsl(var(--gold)/0.3)]">{subtitle}</span>
          <br />
          <span className="text-muted-foreground font-normal">{tagline}</span>
        </motion.p>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pb-6">
        <div className="relative aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-muted border border-border/40 shadow-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={`${displayImages[current]?.src}-${current}-${selectedColorIdx}`}
              src={displayImages[current]?.src}
              alt={displayImages[current]?.label}
              className="absolute inset-0 w-full h-full object-cover"
              loading={current === 0 ? 'eager' : 'lazy'}
              decoding="async"
              width={1200}
              height={675}
              initial={{ opacity: 0, x: direction > 0 ? '30%' : '-30%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? '-15%' : '15%' }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </AnimatePresence>

          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
            <motion.span
              key={`label-${current}-${selectedColorIdx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-block bg-ink/80 backdrop-blur-sm text-surface text-xs md:text-sm px-3 py-1.5 rounded-lg font-medium"
            >
              {displayImages[current]?.label}
            </motion.span>
          </div>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface transition-colors border border-border/30 shadow-md"
              >
                <ChevronLeft className="w-5 h-5 text-ink" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface transition-colors border border-border/30 shadow-md"
              >
                <ChevronRight className="w-5 h-5 text-ink" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {displayImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'bg-gold w-6' : 'bg-border w-2'
              }`}
            />
          ))}
        </div>

        {/* Color Swatches */}
        {colorVariants.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-xs text-muted-foreground font-medium">কালার:</span>
            <div className="flex items-center gap-2">
              {colorVariants.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={() => handleColorSelect(idx)}
                  title={variant.color}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 shadow-sm hover:scale-110 ${
                    selectedColorIdx === idx
                      ? 'border-gold ring-2 ring-gold/30 scale-110'
                      : 'border-border/60 hover:border-gold/40'
                  }`}
                  style={{ backgroundColor: variant.hex }}
                />
              ))}
            </div>
            {selectedColorIdx !== null && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-gold font-medium"
              >
                {colorVariants[selectedColorIdx].color}
              </motion.span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-10 px-4">
        <div className="relative w-full sm:w-auto">
            <motion.button
              onClick={onOrderClick}
              className="gradient-gold text-surface font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity w-full sm:w-auto"
              style={{ boxShadow: '0 4px 16px -4px hsl(var(--gold) / 0.4)' }}
              initial={{ scale: 1, rotateZ: 0 }}
              animate={{ 
                scale: [1, 1.08, 1.08, 1],
                rotateZ: [0, -2, 2, -2, 2, 0],
              }}
              transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.8 }}
            >
              এখনই কিনুন — ৳{formatBengaliPrice(price)}
            </motion.button>
        </div>
        {discountPercent > 0 ? (
          <motion.div
            className="relative flex flex-col items-center gap-2 px-8 py-4 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-accent/5 to-transparent shadow-md w-full sm:w-auto overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-sm">
              -{discountPercent}% ছাড়
            </div>
            <span className="line-through text-muted-foreground text-lg sm:text-xl">মূল্য: ৳{formatBengaliPrice(originalPrice)}</span>
            <span className="text-foreground font-extrabold text-xl tracking-tight">
              অফার মূল্য: <span className="text-gold">৳{formatBengaliPrice(price)}</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">সীমিত সময়ের জন্য</span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-muted border border-border/40 w-full sm:w-auto">
            <span className="text-foreground font-bold text-base">মূল্য: ৳{formatBengaliPrice(price)}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
