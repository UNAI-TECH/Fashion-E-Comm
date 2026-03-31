import { useState } from 'react';
import { motion } from 'motion/react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { fetchProducts, Product } from '../data/products';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

export function TrendingCollection({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Sarees', 'Kurtis', 'Lehengas', 'Salwar Sets', 'Western'];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

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
          <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-12">
            Discover what's hot this season. Handpicked styles that everyone's loving.
          </p>

          <Tabs defaultValue="All" className="w-full" onValueChange={setSelectedCategory}>
            <div className="flex justify-center mb-12">
              <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-100 shadow-sm">
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    className="px-8 py-2.5 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {isLoading ? (
                [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-gray-500 italic text-lg mb-4">No {selectedCategory !== 'All' ? selectedCategory : 'products'} available at the moment.</p>
                  <button 
                    onClick={() => setSelectedCategory('All')}
                    className="text-[#D4AF37] font-bold hover:underline"
                  >
                    View All Products
                  </button>
                </div>
              )}
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
