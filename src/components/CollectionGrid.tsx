import { motion } from 'framer-motion';
import { formatBengaliPrice } from '@/lib/bengali';
import { useProducts } from '@/hooks/useSupabaseData';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface CollectionGridProps {
  currentProductId?: string;
  onSelectProduct: (product: Product) => void;
  sectionTitle?: string;
}

const CollectionGrid = ({ currentProductId, onSelectProduct, sectionTitle = 'আমাদের আরও কালেকশন' }: CollectionGridProps) => {
  const { data: products } = useProducts();
  const otherProducts = (products || []).filter(p => p.id !== currentProductId && p.stock_status === 'in_stock');

  if (!otherProducts.length) return null;

  return (
    <section
      className="py-12 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--border) / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.18) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        backgroundColor: 'hsl(var(--surface))',
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, hsl(var(--gold)), transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.25)]"
          >
            {sectionTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm mt-2"
          >
            আপনার পছন্দের স্টাইল খুঁজে নিন
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {otherProducts.map((product, i) => (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              onClick={() => onSelectProduct(product)}
              className="group text-left rounded-sm overflow-hidden bg-surface border border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] transition-shadow duration-200"
            >
              <div className="aspect-square overflow-hidden bg-muted relative rounded-sm">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    ছবি নেই
                  </div>
                )}
                {product.discount_percent > 0 && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm text-[10px] sm:text-xs font-bold gradient-gold text-surface shadow-sm">
                    -{product.discount_percent}%
                  </div>
                )}
              </div>
              <div className="p-2.5 sm:p-4">
                <h3 className="font-semibold text-foreground text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-gold transition-colors duration-200">{product.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-1.5 sm:mt-2">
                  <span className="text-gold font-bold text-sm sm:text-base font-inter">৳{formatBengaliPrice(product.price)}</span>
                  {product.discount_percent > 0 && (
                    <span className="text-muted-foreground text-[10px] sm:text-xs line-through">
                      ৳{formatBengaliPrice(Math.round(product.price / (1 - product.discount_percent / 100)))}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionGrid;
