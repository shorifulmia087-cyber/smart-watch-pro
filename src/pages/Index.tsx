import { useState, useCallback } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import HeroSlider from '@/components/HeroSlider';
import FeatureList from '@/components/FeatureList';
import VideoSection from '@/components/VideoSection';
import ReviewGallery from '@/components/ReviewGallery';
import DeliveryChecker from '@/components/DeliveryChecker';
import OrderModal from '@/components/OrderModal';
import FloatingNotification from '@/components/FloatingNotification';
import CollectionGrid from '@/components/CollectionGrid';
import LoadingOverlay from '@/components/LoadingOverlay';
import { watchCollection, WatchProduct } from '@/data/watchData';
import { formatBengaliPrice } from '@/lib/bengali';
import { motion } from 'framer-motion';

const Index = () => {
  const [orderOpen, setOrderOpen] = useState(false);
  const [currentWatch, setCurrentWatch] = useState<WatchProduct>(watchCollection[0]);
  const [swapLoading, setSwapLoading] = useState(false);

  const handleSelectWatch = useCallback((watch: WatchProduct) => {
    setSwapLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setCurrentWatch(watch);
      setSwapLoading(false);
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <LoadingOverlay visible={swapLoading} />
      <AnnouncementBar />

      <motion.div
        key={currentWatch.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
      >
        <HeroSlider
          onOrderClick={() => setOrderOpen(true)}
          images={currentWatch.images}
          subtitle={currentWatch.subtitle}
        />
        <FeatureList features={currentWatch.features} />
        <VideoSection videoId={currentWatch.videoUrl} />
      </motion.div>

      <ReviewGallery />
      <DeliveryChecker />
      <CollectionGrid currentWatchId={currentWatch.id} onSelectWatch={handleSelectWatch} />

      {/* Footer CTA */}
      <section className="bg-ink py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-surface mb-3">
            আজই আপনার {currentWatch.name} অর্ডার করুন
          </h2>
          <p className="text-surface/60 mb-8">সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই অর্ডার করুন।</p>
          <button
            onClick={() => setOrderOpen(true)}
            className="gradient-gold text-surface font-semibold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
          >
            এখনই অর্ডার করুন — ৳{formatBengaliPrice(currentWatch.price)}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-surface/10 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-surface/40 text-sm">© ২০২৬ Kronos Premium Watch। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>

      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        unitPrice={currentWatch.price}
        watchName={currentWatch.name}
      />
      <FloatingNotification />
    </div>
  );
};

export default Index;
