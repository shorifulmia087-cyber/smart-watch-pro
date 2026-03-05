import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReviewImages } from '@/hooks/useSupabaseData';

const ReviewGallery = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { data: images, isLoading } = useReviewImages();

  if (isLoading || !images?.length) return null;

  return (
    <section className="bg-surface py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-10"
        >
          গ্রাহকদের মতামত
        </motion.h2>

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setLightboxIdx(i)}
              className="min-w-[220px] md:min-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer snap-center hover:scale-[1.02] transition-transform bg-muted"
            >
              <img
                src={img.image_url}
                alt={`রিভিউ ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-ink/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs aspect-[9/16] rounded-3xl overflow-hidden relative bg-muted"
            >
              <img
                src={images[lightboxIdx].image_url}
                alt={`রিভিউ ${lightboxIdx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setLightboxIdx(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Nav */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
                  className="w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
                  className="w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
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
