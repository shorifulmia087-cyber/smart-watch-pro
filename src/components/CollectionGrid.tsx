import { motion } from 'framer-motion';
import { watchCollection, WatchProduct } from '@/data/watchData';
import { formatBengaliPrice } from '@/lib/bengali';

interface CollectionGridProps {
  currentWatchId: string;
  onSelectWatch: (watch: WatchProduct) => void;
  sectionTitle?: string;
}

const CollectionGrid = ({ currentWatchId, onSelectWatch, sectionTitle = 'আমাদের আরও কালেকশন' }: CollectionGridProps) => {
  const otherWatches = watchCollection.filter((w) => w.id !== currentWatchId);

  return (
    <section className="bg-ash py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-12"
        >
          {sectionTitle}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherWatches.map((watch, i) => (
            <motion.button
              key={watch.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectWatch(watch)}
              className="group bg-surface rounded-2xl overflow-hidden border border-border hover:border-gold/40 transition-all duration-300 text-left"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={watch.thumbnail}
                  alt={watch.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-foreground text-lg">{watch.name}</h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{watch.subtitle}</p>
                <p className="text-gold font-bold text-xl mt-3">৳{formatBengaliPrice(watch.price)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionGrid;
