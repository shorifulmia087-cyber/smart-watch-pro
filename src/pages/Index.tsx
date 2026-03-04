import { useState } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import HeroSlider from '@/components/HeroSlider';
import FeatureList from '@/components/FeatureList';
import VideoSection from '@/components/VideoSection';
import ReviewGallery from '@/components/ReviewGallery';
import DeliveryChecker from '@/components/DeliveryChecker';
import OrderModal from '@/components/OrderModal';
import FloatingNotification from '@/components/FloatingNotification';
import { motion } from 'framer-motion';

const Index = () => {
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <AnnouncementBar />
      <HeroSlider onOrderClick={() => setOrderOpen(true)} />
      <FeatureList />
      <VideoSection />
      <ReviewGallery />
      <DeliveryChecker />

      {/* Footer CTA */}
      <section className="bg-ink py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-surface mb-3">
            আজই আপনার Kronos অর্ডার করুন
          </h2>
          <p className="text-surface/60 mb-8">সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই অর্ডার করুন।</p>
          <button
            onClick={() => setOrderOpen(true)}
            className="gradient-gold text-surface font-semibold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
          >
            এখনই অর্ডার করুন — ৳২,৯৯০
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-surface/10 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-surface/40 text-sm">© ২০২৬ Kronos Premium Watch। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>

      <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} />
      <FloatingNotification />
    </div>
  );
};

export default Index;
