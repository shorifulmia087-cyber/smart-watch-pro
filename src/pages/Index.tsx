import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import HeroSlider from '@/components/HeroSlider';
import LoadingOverlay from '@/components/LoadingOverlay';
import WhatsAppButton from '@/components/WhatsAppButton';
import Navbar from '@/components/Navbar';
import { formatBengaliPrice } from '@/lib/bengali';
import { useSettings, useFeaturedProduct, useProducts } from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';
import { useAntiScraping } from '@/hooks/useAntiScraping';
import { addSecurityHeaders } from '@/lib/security';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import type { Database } from '@/integrations/supabase/types';

// Lazy load below-fold components
const FeatureList = lazy(() => import('@/components/FeatureList'));
const VideoSection = lazy(() => import('@/components/VideoSection'));
const ReviewGallery = lazy(() => import('@/components/ReviewGallery'));
const CollectionGrid = lazy(() => import('@/components/CollectionGrid'));
const OrderModal = lazy(() => import('@/components/OrderModal'));

type Product = Database['public']['Tables']['products']['Row'];

const Index = () => {
  useAntiScraping();
  const { trackEvent } = useFacebookPixel();
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

  const brandName = settings?.brand_name || '';
  const offerStartAt = (settings as any)?.offer_start_at ?? null;
  const offerEndAt = (settings as any)?.offer_end_at ?? null;
  const offerStartMs = offerStartAt ? new Date(offerStartAt).getTime() : NaN;
  const offerEndMs = offerEndAt ? new Date(offerEndAt).getTime() : NaN;
  const shouldShowAnnouncement = Boolean(
    settings?.timer_enabled &&
    Number.isFinite(offerStartMs) &&
    Number.isFinite(offerEndMs) &&
    offerEndMs > offerStartMs &&
    Date.now() <= offerEndMs
  );

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

  const { isLoading: featuredLoading } = useFeaturedProduct();
  const { isLoading: productsLoading } = useProducts();

  if (!currentProduct) {
    // Still loading
    if (featuredLoading || productsLoading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-5 h-5 rounded-full bg-accent"
              animate={{ x: [0, 24, 0], scale: [1, 0.85, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="w-5 h-5 rounded-full bg-accent/25"
              animate={{ x: [0, -24, 0], scale: [0.85, 1, 0.85] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      );
    }
    
    // Data loaded but no products found
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⌚</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">শীঘ্রই আসছে!</h1>
          <p className="text-muted-foreground text-sm">
            আমাদের কালেকশন প্রস্তুত হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার ভিজিট করুন।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <LoadingOverlay visible={swapLoading} />
      {shouldShowAnnouncement && (
        <AnnouncementBar
          discountPercent={settings?.discount_percent}
          countdownHours={settings?.countdown_hours}
          announcementText={settings?.announcement_text}
          timerEnabled={settings?.timer_enabled}
          offerStartAt={offerStartAt}
          offerEndAt={offerEndAt}
        />
      )}
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
          colorVariants={Array.isArray((currentProduct as any).color_variants) ? (currentProduct as any).color_variants : []}
        />
        <Suspense fallback={null}>
          <FeatureList
            features={features}
            sectionTitle={settings?.features_section_title}
          />
        </Suspense>
        <Suspense fallback={null}>
          <VideoSection
            videoId={currentProduct.video_url || undefined}
            sectionTitle={settings?.video_section_title}
            onOrderClick={() => setOrderOpen(true)}
          />
        </Suspense>
      </motion.div>

      <Suspense fallback={null}>
        <ReviewGallery productId={currentProduct.id} />
      </Suspense>
      <Suspense fallback={null}>
        <CollectionGrid
          currentProductId={currentProduct.id}
          onSelectProduct={handleSelectProduct}
          sectionTitle={settings?.collection_section_title}
        />
      </Suspense>

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
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-surface/40 text-sm">
            {settings?.footer_text || `© ২০২৬ ${brandName}। সর্বস্বত্ব সংরক্ষিত।`}
          </p>
          {(settings as any)?.developer_name && (
            <p className="text-surface/25 text-xs">
              Developed by{' '}
              {(settings as any)?.developer_url ? (
                <a
                  href={(() => {
                    const url = (settings as any).developer_url;
                    // If it looks like a phone number, convert to WhatsApp link
                    const cleanNum = url.replace(/[\s\-\+]/g, '');
                    if (/^\d{10,15}$/.test(cleanNum) || /^88\d{11}$/.test(cleanNum)) {
                      const waNum = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
                      return `https://wa.me/${waNum}`;
                    }
                    return url.startsWith('http') ? url : `https://${url}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold/60 hover:text-gold transition-colors duration-200 underline underline-offset-2"
                >
                  {(settings as any).developer_name}
                </a>
              ) : (
                <span className="text-gold/60">{(settings as any).developer_name}</span>
              )}
            </p>
          )}
        </div>
      </footer>

      <Suspense fallback={null}>
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
          availableColors={(currentProduct as any).available_colors || []}
          colorVariants={Array.isArray((currentProduct as any).color_variants) ? (currentProduct as any).color_variants : []}
          onOrderSuccess={() => trackEvent('Purchase', { value: currentProduct.price, currency: 'BDT', content_name: currentProduct.name })}
          onOrderOpen={() => trackEvent('AddToCart', { value: currentProduct.price, currency: 'BDT', content_name: currentProduct.name })}
        />
      </Suspense>
      
      <WhatsAppButton />
    </div>
  );
};

export default Index;
