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
    <section className="bg-ash py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-12 text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.25)]"
        >
          {sectionTitle}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherProducts.map((product, i) => (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectProduct(product)}
              className="group bg-surface rounded-2xl overflow-hidden border border-border hover:border-gold/40 transition-all duration-300 text-left"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    ছবি নেই
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{product.subtitle}</p>
                <p className="text-gold font-bold text-xl mt-3">৳{formatBengaliPrice(product.price)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionGrid;
