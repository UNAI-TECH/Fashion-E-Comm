import { motion } from 'motion/react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { Product } from '../data/products';

const CATEGORY_ORDER = ['Sarees', 'Western', 'Tradition', 'Maxi', 'Lehengas', 'Salwar Sets', 'Kurtis'];

export function TrendingCollection({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  // Pick exactly one product per category in the defined order
  const displayProducts = CATEGORY_ORDER.reduce<Product[]>((acc, cat) => {
    const match = products.find(p => p.category === cat);
    if (match) acc.push(match);
    return acc;
  }, []);

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
            className="inline-block px-6 py-2 bg-white text-[#D4AF37] rounded-full text-sm tracking-wider mb-4 shadow-md"
          >
            TRENDING NOW
          </motion.span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#1A1A1A]">
            Trending Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Discover what's hot this season. Handpicked styles that everyone's loving.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {isLoading ? (
            [...Array(7)].map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            displayProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
