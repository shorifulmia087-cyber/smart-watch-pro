import { useState, useCallback, useEffect } from 'react';
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
import StickyOrderForm from '@/components/StickyOrderForm';
import WhatsAppButton from '@/components/WhatsAppButton';
import Navbar from '@/components/Navbar';
import { formatBengaliPrice } from '@/lib/bengali';
import { useSettings, useFeaturedProduct, useProducts } from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';
import { useAntiScraping } from '@/hooks/useAntiScraping';
import { addSecurityHeaders } from '@/lib/security';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

const Index = () => {
  useAntiScraping();
  useEffect(() => { addSecurityHeaders(); }, []);
  const [orderOpen, setOrderOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const { data: settings } = useSettings();
  const { data: featuredProduct } = useFeaturedProduct();
  const { data: allProducts } = useProducts();

  // Set current product to featured or first available, and sync with DB updates
  useEffect(() => {
    if (featuredProduct) {
      setCurrentProduct(prev => {
        if (!prev || prev.id === featuredProduct.id) return featuredProduct;
        return prev;
      });
    } else if (allProducts?.length) {
      setCurrentProduct(prev => {
        if (!prev) return allProducts[0];
        const updated = allProducts.find(p => p.id === prev.id);
        return updated || allProducts[0];
      });
    }
  }, [featuredProduct, allProducts]);

  const handleSelectProduct = useCallback((product: Product) => {
    setSwapLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setCurrentProduct(product);
      setSwapLoading(false);
    }, 800);
  }, []);

  const brandName = settings?.brand_name || 'Kronos Premium Watch';

  const heroImages = (currentProduct?.image_urls || []).map((url, i) => ({
    src: url,
    label: `${currentProduct?.name || ''} — ছবি ${i + 1}`,
  }));

  const features = Array.isArray(currentProduct?.features)
    ? (currentProduct.features as any[]).map((f: any) => ({
        icon: f.icon || '⭐',
        title: f.title || '',
        desc: f.desc || '',
      }))
    : [];

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse text-lg mb-2">লোড হচ্ছে...</div>
          <p className="text-sm">প্রোডাক্ট লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <LoadingOverlay visible={swapLoading} />
      <AnnouncementBar
        discountPercent={settings?.discount_percent}
        countdownHours={settings?.countdown_hours}
        announcementText={settings?.announcement_text}
        timerEnabled={settings?.timer_enabled}
        offerStartAt={(settings as any)?.offer_start_at}
        offerEndAt={(settings as any)?.offer_end_at}
      />
      <Navbar />

      <motion.div
        key={currentProduct.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
      >
        <HeroSlider
          onOrderClick={() => setOrderOpen(true)}
          images={heroImages}
          subtitle={settings?.hero_subtitle || currentProduct.subtitle || ''}
          tagline={settings?.brand_tagline || 'প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন।'}
          price={currentProduct.price}
          discountPercent={currentProduct.discount_percent}
        />
        <FeatureList
          features={features}
          sectionTitle={settings?.features_section_title}
        />
        <VideoSection
          videoId={currentProduct.video_url || undefined}
          sectionTitle={settings?.video_section_title}
        />
      </motion.div>

      <ReviewGallery />
      <CollectionGrid
        currentProductId={currentProduct.id}
        onSelectProduct={handleSelectProduct}
        sectionTitle={settings?.collection_section_title}
      />

      <section className="bg-ink py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gold drop-shadow-[0_0_12px_hsl(var(--gold)/0.4)] mb-3">
            {settings?.footer_cta_title || `আজই আপনার ${currentProduct.name} অর্ডার করুন`}
          </h2>
          <p className="text-surface/70 mb-8 text-lg">
            {settings?.footer_cta_subtitle || 'সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই অর্ডার করুন।'}
          </p>
          <motion.button
            onClick={() => setOrderOpen(true)}
            className="gradient-gold text-surface font-semibold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
            animate={{ 
              scale: [1, 1.08, 1.08, 1],
              rotateZ: [0, -2, 2, -2, 2, 0],
            }}
            transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.8 }}
          >
            এখনই অর্ডার করুন — ৳{formatBengaliPrice(currentProduct.price)}
          </motion.button>
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
        unitPrice={currentProduct.price}
        watchName={currentProduct.name}
        deliveryChargeInside={settings?.delivery_charge_inside}
        deliveryChargeOutside={settings?.delivery_charge_outside}
        onlinePaymentEnabled={settings?.online_payment_enabled}
        bkashNumber={settings?.bkash_number}
        nagadNumber={settings?.nagad_number}
        rocketNumber={settings?.rocket_number}
      />
      <FloatingNotification />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
