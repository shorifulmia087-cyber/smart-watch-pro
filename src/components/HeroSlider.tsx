import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const originalPrice = discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : price;

  // All images: product gallery + color variant images
  const allImages = [
    ...images,
    ...colorVariants.map(v => ({ src: v.image_url, label: v.color })),
  ];
  const displayImages = allImages.length > 0 ? allImages : images;

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (displayImages.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % displayImages.length);
      }, 4000);
    }
  }, [displayImages.length]);

  useEffect(() => {
    resetAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [resetAutoSlide]);

  const handleColorSelect = (idx: number) => {
    const imageIndex = images.length + idx;
    if (selectedColorIdx === idx) {
      setSelectedColorIdx(null);
      setCurrent(0);
    } else {
      setSelectedColorIdx(idx);
      setCurrent(imageIndex);
    }
    resetAutoSlide();
  };

  const handleThumbnailClick = (idx: number) => {
    setCurrent(idx);
    if (idx >= images.length) {
      setSelectedColorIdx(idx - images.length);
    } else {
      setSelectedColorIdx(null);
    }
    resetAutoSlide();
  };

  return (
    <section className="bg-surface relative" style={{
      backgroundImage: `linear-gradient(hsl(var(--border) / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.18) 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
    }}>
      {/* Title */}
      <div className="text-center pt-8 pb-4 px-4">
        <motion.p
          key={subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.77, 0, 0.18, 1] }}
          className="text-xl md:text-2xl text-foreground font-semibold leading-relaxed max-w-2xl mx-auto"
        >
          <span className="text-gold drop-shadow-[0_0_8px_hsl(var(--gold)/0.3)]">{subtitle}</span>
          <br />
          <span className="text-muted-foreground font-normal text-base">{tagline}</span>
        </motion.p>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pb-4">
        {/* Main Image */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-muted border border-border/40 shadow-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={`${displayImages[current]?.src}-${current}`}
              src={displayImages[current]?.src}
              alt={displayImages[current]?.label}
              className="absolute inset-0 w-full h-full object-cover"
              loading={current === 0 ? 'eager' : 'lazy'}
              decoding="async"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </AnimatePresence>
          <div className="absolute bottom-3 left-3">
            <motion.span
              key={`label-${current}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block bg-ink/75 backdrop-blur-sm text-surface text-[10px] md:text-xs px-2.5 py-1 rounded-lg font-medium"
            >
              {displayImages[current]?.label}
            </motion.span>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {displayImages.length > 1 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {displayImages.map((img, i) => {
              const isColorVariant = i >= images.length;
              const colorIdx = isColorVariant ? i - images.length : null;
              return (
                <button
                  key={i}
                  onClick={() => handleThumbnailClick(i)}
                  className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    i === current
                      ? 'border-gold shadow-md ring-1 ring-gold/30'
                      : 'border-border/40 hover:border-gold/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                  {isColorVariant && colorIdx !== null && colorVariants[colorIdx] && (
                    <div
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-surface/80 shadow-sm"
                      style={{ backgroundColor: colorVariants[colorIdx].hex }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Color Swatches — below thumbnails */}
        {colorVariants.length > 0 && (
          <div className="flex items-center gap-3 mt-3 justify-center">
            <span className="text-[11px] text-muted-foreground font-medium">কালার:</span>
            <div className="flex items-center gap-2">
              {colorVariants.map((variant, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleColorSelect(idx)}
                  title={variant.color}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all duration-200 shadow-sm relative ${
                    selectedColorIdx === idx
                      ? 'border-gold ring-2 ring-gold/40 scale-110'
                      : 'border-border/50 hover:border-gold/50'
                  }`}
                  style={{ backgroundColor: variant.hex }}
                >
                  {selectedColorIdx === idx && (
                    <motion.div layoutId="color-check" className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-surface drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            {selectedColorIdx !== null && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-gold font-semibold"
              >
                {colorVariants[selectedColorIdx].color}
              </motion.span>
            )}
          </div>
        )}
      </div>

      {/* Price & CTA */}
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
