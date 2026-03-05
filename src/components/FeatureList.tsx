import { motion } from 'framer-motion';
import type { WatchFeature } from '@/data/watchData';

interface FeatureListProps {
  features?: WatchFeature[];
  sectionTitle?: string;
}

const FeatureIcon = ({ icon }: { icon: string }) => {
  // Support image URLs (http/https or data URIs) from admin panel
  if (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/')) {
    return <img src={icon} alt="" className="w-6 h-6 object-contain" />;
  }
  // Support inline SVG strings
  if (icon.startsWith('<svg')) {
    return <span className="w-6 h-6 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: icon }} />;
  }
  // Default: emoji or text icon
  return <span className="text-xl leading-none">{icon}</span>;
};

const FeatureList = ({ features, sectionTitle = 'কেন Kronos বেছে নেবেন?' }: FeatureListProps) => {
  const items = features || [];

  return (
    <section
      className="py-12 px-4 relative"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--border) / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.18) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        backgroundColor: 'hsl(var(--surface))',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-10 text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.25)]"
        >
          {sectionTitle}
        </motion.h2>
        <div className="grid gap-4">
          {items.map((f, i) => (
            <motion.div
              key={`${f.title}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px -8px hsl(var(--gold) / 0.12)' }}
              whileTap={{ y: -1 }}
              className="flex items-start gap-4 p-5 bg-surface rounded-sm border border-border/60 shadow-sm cursor-default transition-colors"
            >
              <div className="w-11 h-11 rounded-sm bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <FeatureIcon icon={f.icon} />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">{f.title}</p>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureList;
