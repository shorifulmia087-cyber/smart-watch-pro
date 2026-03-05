import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatBengaliPrice } from '@/lib/bengali';

interface HeroSliderProps {
  onOrderClick: () => void;
  images: { src: string; label: string }[];
  subtitle: string;
  tagline?: string;
  price?: number;
  discountPercent?: number;
}

const HeroSlider = ({ onOrderClick, images, subtitle, tagline = 'প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন।', price = 0, discountPercent = 0 }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = right-to-left, -1 = left-to-right
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const originalPrice = discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : price;

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (images.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setDirection(1);
        setCurrent((c) => (c + 1) % images.length);
      }, 3000);
    }
  }, [images.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % images.length);
    resetAutoSlide();
  }, [images.length, resetAutoSlide]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + images.length) % images.length);
    resetAutoSlide();
  }, [images.length, resetAutoSlide]);

  // Start auto-slide
  useEffect(() => {
    resetAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [resetAutoSlide]);

  return (
    <section className="bg-surface">
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
        <div className="relative aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
          <AnimatePresence mode="wait">
            <motion.img
              key={`${images[current]?.src}-${current}`}
              src={images[current]?.src}
              alt={images[current]?.label}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </AnimatePresence>

          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
            <motion.span
              key={`label-${current}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-block bg-ink/80 backdrop-blur-sm text-surface text-xs md:text-sm px-3 py-1.5 rounded-lg font-medium"
            >
              {images[current]?.label}
            </motion.span>
          </div>

          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-ink" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-ink" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-gold w-6' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-10 px-4">
        <div className="relative w-full sm:w-auto">
            <motion.button
              onClick={onOrderClick}
              className="gradient-gold text-surface font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity w-full sm:w-auto"
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
            className="relative flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-accent/5 to-transparent shadow-lg w-full sm:w-auto overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-md">
              -{discountPercent}% ছাড়
            </div>
            <span className="line-through text-muted-foreground text-lg sm:text-xl">মূল্য: ৳{formatBengaliPrice(originalPrice)}</span>
            <span className="text-foreground font-extrabold text-xl tracking-tight">
              অফার মূল্য: <span className="text-gold">৳{formatBengaliPrice(price)}</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">সীমিত সময়ের জন্য</span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-muted w-full sm:w-auto">
            <span className="text-foreground font-bold text-base">মূল্য: ৳{formatBengaliPrice(price)}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
