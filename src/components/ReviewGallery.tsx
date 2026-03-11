import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { useReviewImages } from '@/hooks/useSupabaseData';

interface ReviewGalleryProps {
  productId?: string | null;
}

const ReviewGallery = ({ productId }: ReviewGalleryProps) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { data: images, isLoading } = useReviewImages(productId);

  if (isLoading || !images?.length) return null;

  return (
    <section
      className="py-12 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--border) / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.18) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        backgroundColor: 'hsl(var(--surface))',
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, hsl(var(--gold)), transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 mb-4"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-gold text-gold" />
            ))}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.25)]"
          >
            গ্রাহকদের মতামত
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm mt-2"
          >
            আমাদের সন্তুষ্ট গ্রাহকদের অভিজ্ঞতা দেখুন
          </motion.p>
        </div>

        {/* Horizontal scroll gallery */}
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: '0 8px 24px -8px hsl(var(--gold) / 0.12)' }}
              onClick={() => setLightboxIdx(i)}
              className="group relative min-w-[200px] md:min-w-[240px] aspect-[9/16] rounded-xl overflow-hidden cursor-pointer snap-center border border-border/40 shadow-sm hover:shadow-lg transition-shadow"
            >
              <img
                src={img.image_url}
                alt={`রিভিউ ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur-sm flex items-center justify-center">
                  <Quote className="w-3.5 h-3.5 text-gold" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mt-4 gap-1"
        >
          <span className="text-xs text-muted-foreground tracking-wide">← সোয়াইপ করুন →</span>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-ink/85 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm aspect-[9/16] rounded-xl overflow-hidden relative border border-gold/15"
              style={{
                boxShadow: '0 25px 60px -12px hsl(var(--ink) / 0.5)',
              }}
            >
              <img
                src={images[lightboxIdx].image_url}
                alt={`রিভিউ ${lightboxIdx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-ink/50 to-transparent" />
              <button
                onClick={() => setLightboxIdx(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
              <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-surface/90 backdrop-blur-sm text-xs font-medium text-foreground shadow-sm">
                {lightboxIdx + 1} / {images.length}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ink/60 to-transparent" />
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
                  className="w-10 h-10 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-surface transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
                  className="w-10 h-10 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-surface transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ReviewGallery;
