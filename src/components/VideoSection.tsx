import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const VideoSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-surface py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-10"
        >
          Kronos — কাছ থেকে দেখুন
        </motion.h2>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative aspect-video rounded-3xl overflow-hidden bg-muted shadow-lg"
        >
          <iframe
            src={`https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=${isVisible ? 1 : 0}&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=1&modestbranding=1`}
            title="Kronos Watch Video"
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
