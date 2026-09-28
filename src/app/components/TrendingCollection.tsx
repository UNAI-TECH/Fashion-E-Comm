import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { Product } from '../data/products';
import { Flame } from 'lucide-react';

export function TrendingCollection({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  // Prioritize newly added products from admin, then top rated
  const displayProducts = [...products]
    .sort((a: any, b: any) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 16);

  return (
    <section className="py-20 px-4" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #FFF0F5)' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white text-[#D4AF37] rounded-full text-sm tracking-wider mb-4 shadow-md font-bold"
          >
            <Flame className="w-4 h-4 text-orange-500" />
            TRENDING NOW
          </motion.span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#1A1A1A]">
            Trending Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Discover what's hot this season — our highest rated, most loved styles.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {isLoading ? (
            [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
          ) : displayProducts.length > 0 ? (
            displayProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Flame className="w-10 h-10 mx-auto mb-3 text-orange-300" />
              <p className="text-lg font-medium">No trending products yet</p>
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/category/trending"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#800000] text-white rounded-full font-bold text-sm hover:bg-[#600000] transition-colors shadow-md"
          >
            View All Trending
            <Flame className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
