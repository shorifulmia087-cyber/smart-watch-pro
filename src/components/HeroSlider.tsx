import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, Star, Award, Clock } from 'lucide-react';
import { formatBengaliPrice } from '@/lib/bengali';

const BentoGridBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden pointer-events-auto"
      style={{ zIndex: 0 }}
    >
      {/* Base grid pattern with thin lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsla(215, 20%, 25%, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, hsla(215, 20%, 25%, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Slightly larger overlay grid */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsla(215, 20%, 30%, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, hsla(215, 20%, 30%, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '128px 128px',
        }}
      />
      {/* Mouse-following spotlight */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          left: mousePos.x - 150,
          top: mousePos.y - 150,
          width: 300,
          height: 300,
          background: `radial-gradient(circle, hsla(41, 52%, 48%, 0.06) 0%, transparent 70%)`,
          borderRadius: '50%',
        }}
      />
    </div>
  );
};
interface HeroSliderProps {
  onOrderClick: () => void;
  images: { src: string; label: string }[];
  subtitle: string;
  tagline?: string;
  price?: number;
  discountPercent?: number;
}

const tileVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

const HeroSlider = ({
  onOrderClick,
  images,
  subtitle,
  tagline = 'প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন।',
  price = 0,
  discountPercent = 0,
}: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
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

  useEffect(() => {
    resetAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [resetAutoSlide]);

  // Secondary image for the close-up tile (next image in queue)
  const closeUpIdx = (current + 1) % images.length;

  return (
    <section className="relative bg-[hsl(220,20%,4%)] py-6 md:py-10 overflow-hidden">
      <BentoGridBackground />
      <div className="relative max-w-6xl mx-auto px-4" style={{ zIndex: 1 }}>
        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[minmax(80px,auto)]">

          {/* === Tile 1: Main Image Slider — Large, spans 2 cols & 3 rows on desktop === */}
          <motion.div
            custom={0}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="relative col-span-2 row-span-2 md:row-span-3 rounded-md overflow-hidden border border-surface/10 bg-surface/5 backdrop-blur-sm group cursor-pointer"
            style={{ minHeight: '280px' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={`${images[current]?.src}-${current}`}
                src={images[current]?.src}
                alt={images[current]?.label}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, x: direction > 0 ? '20%' : '-20%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? '-10%' : '10%' }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </AnimatePresence>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

            {/* Label */}
            <div className="absolute bottom-3 left-3 z-10">
              <motion.span
                key={`label-${current}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-block bg-ink/80 backdrop-blur-sm text-surface text-xs px-3 py-1.5 rounded-md font-medium"
              >
                {images[current]?.label}
              </motion.span>
            </div>

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-surface/70 backdrop-blur-sm flex items-center justify-center hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronLeft className="w-4 h-4 text-ink" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-surface/70 backdrop-blur-sm flex items-center justify-center hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronRight className="w-4 h-4 text-ink" />
                </button>
              </>
            )}

            {/* Dots */}
            <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); resetAutoSlide(); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-gold w-4' : 'bg-surface/50'}`}
                />
              ))}
            </div>

            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-md shadow-[inset_0_0_30px_hsl(var(--gold)/0.08)]" />
          </motion.div>

          {/* === Tile 2: Headline + CTA — spans 2 cols on desktop === */}
          <motion.div
            custom={1}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="col-span-2 row-span-2 rounded-md border border-surface/10 bg-surface/5 backdrop-blur-sm p-5 md:p-6 flex flex-col justify-center items-center text-center group hover:bg-surface/[0.08] hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-surface font-semibold leading-relaxed mb-1"
            >
              <span className="text-gold drop-shadow-[0_0_8px_hsl(var(--gold)/0.3)]">{subtitle}</span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-surface/60 text-sm md:text-base mb-4"
            >
              {tagline}
            </motion.p>

            {/* Price */}
            <div className="mb-4">
              {discountPercent > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-surface/40 text-sm">৳{formatBengaliPrice(originalPrice)}</span>
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">-{discountPercent}%</span>
                  </div>
                  <span className="text-gold font-extrabold text-xl">৳{formatBengaliPrice(price)}</span>
                </div>
              ) : (
                <span className="text-gold font-bold text-lg">৳{formatBengaliPrice(price)}</span>
              )}
            </div>

            <motion.button
              onClick={onOrderClick}
              className="gradient-gold text-surface font-semibold px-7 py-3 rounded-md text-sm hover:opacity-90 transition-opacity"
              initial={{ scale: 1, rotateZ: 0 }}
              animate={{
                scale: [1, 1.08, 1.08, 1],
                rotateZ: [0, -2, 2, -2, 2, 0],
              }}
              transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.8 }}
            >
              এখনই কিনুন — ৳{formatBengaliPrice(price)}
            </motion.button>
          </motion.div>

          {/* === Tile 3: Close-up Image === */}
          <motion.div
            custom={2}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="col-span-1 row-span-1 rounded-md overflow-hidden border border-surface/10 bg-surface/5 backdrop-blur-sm group hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300 relative"
            style={{ minHeight: '120px' }}
          >
            {images.length > 1 ? (
              <img
                src={images[closeUpIdx]?.src}
                alt="Close-up"
                className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500"
              />
            ) : (
              <img
                src={images[0]?.src}
                alt="Close-up"
                className="absolute inset-0 w-full h-full object-cover scale-125 object-right-bottom group-hover:scale-110 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-ink/30" />
            <div className="absolute bottom-2 left-2 z-10">
              <span className="text-surface/80 text-[10px] font-medium bg-ink/60 backdrop-blur-sm px-2 py-1 rounded-md">ক্লোজ-আপ ভিউ</span>
            </div>
          </motion.div>

          {/* === Tile 4: Rating === */}
          <motion.div
            custom={3}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="col-span-1 row-span-1 rounded-md border border-surface/10 bg-surface/5 backdrop-blur-sm p-4 flex flex-col items-center justify-center gap-1.5 group hover:bg-surface/[0.08] hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />
              ))}
            </div>
            <span className="text-surface font-bold text-lg leading-none">৪.৯/৫</span>
            <span className="text-surface/50 text-[10px]">কাস্টমার রেটিং</span>
          </motion.div>

          {/* === Tile 5: Free Delivery === */}
          <motion.div
            custom={4}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="col-span-1 row-span-1 rounded-md border border-surface/10 bg-surface/5 backdrop-blur-sm p-4 flex flex-col items-center justify-center gap-1.5 group hover:bg-surface/[0.08] hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Truck className="w-6 h-6 text-gold" />
            <span className="text-surface font-semibold text-xs">ফ্রি ডেলিভারি</span>
            <span className="text-surface/50 text-[10px]">সারা বাংলাদেশে</span>
          </motion.div>

          {/* === Tile 6: 7 Days Warranty === */}
          <motion.div
            custom={5}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="col-span-1 row-span-1 rounded-md border border-surface/10 bg-surface/5 backdrop-blur-sm p-4 flex flex-col items-center justify-center gap-1.5 group hover:bg-surface/[0.08] hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <ShieldCheck className="w-6 h-6 text-gold" />
            <span className="text-surface font-semibold text-xs">৭ দিন ওয়ারেন্টি</span>
            <span className="text-surface/50 text-[10px]">রিপ্লেসমেন্ট গ্যারান্টি</span>
          </motion.div>

          {/* === Tile 7: Premium Quality — hidden on mobile === */}
          <motion.div
            custom={6}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="hidden md:flex col-span-1 row-span-1 rounded-md border border-surface/10 bg-surface/5 backdrop-blur-sm p-4 flex-col items-center justify-center gap-1.5 group hover:bg-surface/[0.08] hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Award className="w-6 h-6 text-gold" />
            <span className="text-surface font-semibold text-xs">প্রিমিয়াম কোয়ালিটি</span>
            <span className="text-surface/50 text-[10px]">আমদানিকৃত মেটেরিয়াল</span>
          </motion.div>

          {/* === Tile 8: Limited Offer — hidden on mobile === */}
          <motion.div
            custom={7}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
            className="hidden md:flex col-span-1 row-span-1 rounded-md border border-surface/10 bg-surface/5 backdrop-blur-sm p-4 flex-col items-center justify-center gap-1.5 group hover:bg-surface/[0.08] hover:shadow-[0_0_20px_hsl(var(--gold)/0.06)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Clock className="w-6 h-6 text-gold" />
            <span className="text-surface font-semibold text-xs">সীমিত অফার</span>
            <span className="text-surface/50 text-[10px]">স্টক শেষ হওয়ার আগেই</span>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
