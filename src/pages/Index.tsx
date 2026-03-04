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
import { useSettings } from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';

const Index = () => {
  const [orderOpen, setOrderOpen] = useState(false);
  const [currentWatch, setCurrentWatch] = useState<WatchProduct>(watchCollection[0]);
  const [swapLoading, setSwapLoading] = useState(false);
  const { data: settings } = useSettings();

  const handleSelectWatch = useCallback((watch: WatchProduct) => {
    setSwapLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setCurrentWatch(watch);
      setSwapLoading(false);
    }, 800);
  }, []);

  const brandName = settings?.brand_name || 'Kronos Premium Watch';

  return (
    <div className="min-h-screen bg-surface">
      <LoadingOverlay visible={swapLoading} />
      <AnnouncementBar
        discountPercent={settings?.discount_percent}
        countdownHours={settings?.countdown_hours}
        announcementText={settings?.announcement_text}
        timerEnabled={settings?.timer_enabled}
      />

      <motion.div
        key={currentWatch.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
      >
        <HeroSlider
          onOrderClick={() => setOrderOpen(true)}
          images={currentWatch.images}
          subtitle={settings?.hero_subtitle || currentWatch.subtitle}
        />
        <FeatureList
          features={currentWatch.features}
          sectionTitle={settings?.features_section_title}
        />
        <VideoSection
          videoId={currentWatch.videoUrl}
          sectionTitle={settings?.video_section_title}
        />
      </motion.div>

      <ReviewGallery />
      <DeliveryChecker />
      <CollectionGrid
        currentWatchId={currentWatch.id}
        onSelectWatch={handleSelectWatch}
        sectionTitle={settings?.collection_section_title}
      />

      <section className="bg-ink py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-surface mb-3">
            {settings?.footer_cta_title || `আজই আপনার ${currentWatch.name} অর্ডার করুন`}
          </h2>
          <p className="text-surface/60 mb-8">
            {settings?.footer_cta_subtitle || 'সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই অর্ডার করুন।'}
          </p>
          <button
            onClick={() => setOrderOpen(true)}
            className="gradient-gold text-surface font-semibold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
          >
            এখনই অর্ডার করুন — ৳{formatBengaliPrice(currentWatch.price)}
          </button>
        </motion.div>
      </section>

      <footer className="bg-ink border-t border-surface/10 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-surface/40 text-sm">
            {settings?.footer_text || `© ২০২৬ ${brandName}। সর্বস্বত্ব সংরক্ষিত।`}
          </p>
        </div>
      </footer>

      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        unitPrice={currentWatch.price}
        watchName={currentWatch.name}
        deliveryChargeInside={settings?.delivery_charge_inside}
        deliveryChargeOutside={settings?.delivery_charge_outside}
        onlinePaymentEnabled={settings?.online_payment_enabled}
      />
      <FloatingNotification />
    </div>
  );
};

export default Index;
