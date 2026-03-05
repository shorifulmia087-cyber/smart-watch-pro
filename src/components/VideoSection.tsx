import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VideoSectionProps {
  videoId?: string;
  sectionTitle?: string;
}

const VideoSection = ({ videoId = 'dQw4w9WgXcQ', sectionTitle = 'Kronos — কাছ থেকে দেখুন' }: VideoSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

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

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-10 text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.25)]"
        >
          {sectionTitle}
        </motion.h2>

        {/* Video Container */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative aspect-video rounded-lg overflow-hidden border border-border/60 shadow-sm cursor-pointer"
          style={{
            boxShadow: '0 0 40px -10px hsl(var(--gold) / 0.15)',
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
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
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
      </div>
    </section>
  );
};

export default VideoSection;
