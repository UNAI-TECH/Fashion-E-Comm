import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { fetchProducts, Product } from '../data/products';

export function StylePicks({ products, isLoading }: { products: Product[], isLoading: boolean }) {


  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#D4AF37] font-medium tracking-[0.2em] uppercase text-sm mb-4 block">Curated For You</span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#1A1A1A] mb-6 italic">Style Picks</h2>
          <div className="w-24 h-px bg-[#D4AF37] mx-auto opacity-30"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 italic">
              No style picks available at the moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
