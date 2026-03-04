import { motion } from 'framer-motion';
import type { WatchFeature } from '@/data/watchData';

interface FeatureListProps {
  features?: WatchFeature[];
}

const FeatureList = ({ features }: FeatureListProps) => {
  const items = features || [];

  return (
    <section className="bg-ash py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-12"
        >
          কেন Kronos বেছে নেবেন?
        </motion.h2>
        <div className="space-y-0">
          {items.map((f, i) => (
            <motion.div
              key={`${f.title}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-4 py-5 ${i < items.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0 mt-0.5 text-lg">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureList;
