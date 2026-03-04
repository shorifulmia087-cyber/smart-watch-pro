import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
  onOrderClick: () => void;
  images: { src: string; label: string }[];
  subtitle: string;
}

const HeroSlider = ({ onOrderClick, images, subtitle }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);

  return (
    <section className="bg-surface">
      <div className="text-center pt-16 pb-8 px-4">
        <motion.p
          key={subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.77, 0, 0.18, 1] }}
          className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto"
        >
          {subtitle}
          <br />
          <span className="text-foreground font-normal">প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন।</span>
        </motion.p>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pb-6">
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
          <AnimatePresence mode="wait">
            <motion.img
              key={`${images[current]?.src}-${current}`}
              src={images[current]?.src}
              alt={images[current]?.label}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: [0.77, 0, 0.18, 1] }}
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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-16 px-4">
        <button
          onClick={onOrderClick}
          className="gradient-gold text-surface font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          এখনই কিনুন
        </button>
        <button className="border border-border text-foreground font-medium px-8 py-3.5 rounded-xl text-base hover:bg-muted transition-colors w-full sm:w-auto">
          হাতে দেখুন 📸
        </button>
      </div>
    </section>
  );
};

export default HeroSlider;
