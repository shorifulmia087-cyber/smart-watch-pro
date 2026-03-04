import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Generate placeholder review screenshots
const reviews = [
  { id: 1, name: 'সোহেল আহমেদ', text: 'অসাধারণ কোয়ালিটি! বাংলাদেশে এরকম ঘড়ি আগে পাইনি। পরিবারের সবাইকে গিফট করেছি। ⭐⭐⭐⭐⭐', color: 'bg-emerald-50' },
  { id: 2, name: 'নাফিসা ইসলাম', text: 'আমার স্বামীকে বার্থডে গিফট দিয়েছি। উনি অনেক খুশি হয়েছেন। প্যাকেজিংও প্রিমিয়াম ছিল। 💕', color: 'bg-blue-50' },
  { id: 3, name: 'তানভীর হাসান', text: 'ডেলিভারি খুবই দ্রুত পেয়েছি। ঘড়িটা দেখতে ছবির চেয়ে আরও সুন্দর। ধন্যবাদ Kronos! 🔥', color: 'bg-amber-50' },
  { id: 4, name: 'রুমানা আক্তার', text: 'তৃতীয়বার অর্ডার করলাম। প্রতিটাই একদম পারফেক্ট। কাস্টমার সার্ভিসও অসাধারণ। 👏', color: 'bg-purple-50' },
  { id: 5, name: 'আরিফুল ইসলাম', text: 'অফিসে সবাই জিজ্ঞেস করে ঘড়িটা কোথায় থেকে কিনেছি। ব্র্যান্ড ভ্যালু অনেক বেশি। 💼', color: 'bg-rose-50' },
];

const ReviewGallery = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <section className="bg-surface py-20 px-4">
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
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setLightboxIdx(i)}
              className={`${r.color} min-w-[220px] md:min-w-[260px] aspect-[9/16] rounded-2xl p-5 flex flex-col justify-between cursor-pointer snap-center hover:scale-[1.02] transition-transform`}
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center text-sm font-bold mb-3">
                  {r.name.charAt(0)}
                </div>
                <p className="text-sm font-semibold mb-2">{r.name}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{r.text}</p>
              </div>
              <p className="text-xs text-muted-foreground">যাচাইকৃত ক্রেতা ✓</p>
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
              className={`${reviews[lightboxIdx].color} w-full max-w-xs aspect-[9/16] rounded-3xl p-6 flex flex-col justify-between relative`}
            >
              <button
                onClick={() => setLightboxIdx(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <div className="w-14 h-14 rounded-full bg-surface/80 flex items-center justify-center text-lg font-bold mb-4">
                  {reviews[lightboxIdx].name.charAt(0)}
                </div>
                <p className="font-bold text-lg mb-3">{reviews[lightboxIdx].name}</p>
                <p className="text-base leading-relaxed">{reviews[lightboxIdx].text}</p>
              </div>
              <p className="text-sm text-muted-foreground">যাচাইকৃত ক্রেতা ✓</p>

              {/* Nav */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + reviews.length) % reviews.length); }}
                  className="w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % reviews.length); }}
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
