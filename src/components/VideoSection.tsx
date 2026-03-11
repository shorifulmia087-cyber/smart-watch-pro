import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VideoSectionProps {
  videoId?: string;
  sectionTitle?: string;
  onOrderClick?: () => void;
}

const VideoSection = ({ videoId, sectionTitle = 'Kronos — কাছ থেকে দেখুন', onOrderClick }: VideoSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const hasVideo = !!videoId?.trim();
  const thumbUrl = hasVideo ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!hasVideo) return null;

  return (
    <section
      className="py-12 px-4 relative"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--border) / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.18) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        backgroundColor: 'hsl(var(--surface))',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-10 text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.25)]"
        >
          {sectionTitle}
        </motion.h2>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative aspect-video rounded-xl overflow-hidden border border-border/40 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          style={{
            boxShadow: '0 0 40px -10px hsl(var(--gold) / 0.1)',
          }}
          onClick={() => !isLoaded && setIsLoaded(true)}
        >
          {!isLoaded ? (
            <>
              <img
                src={thumbUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border/30">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10 fill-gold ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1`}
              title="Product Video"
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
        </motion.div>

        {onOrderClick && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mt-8"
          >
            <motion.button
              onClick={onOrderClick}
              className="gradient-gold text-surface font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 4px 16px -4px hsl(var(--gold) / 0.4)' }}
              initial={{ scale: 1, rotateZ: 0 }}
              animate={{ 
                scale: [1, 1.08, 1.08, 1],
                rotateZ: [0, -2, 2, -2, 2, 0],
              }}
              transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.8 }}
            >
              এখনই কিনুন
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;