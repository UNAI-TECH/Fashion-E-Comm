import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { Product } from '../data/products';
import { Sparkles, ArrowUpDown, Filter, Check } from 'lucide-react';

interface TrendingCollectionProps {
  products: Product[];
  isLoading: boolean;
}

export function TrendingCollection({ products, isLoading }: TrendingCollectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'under2k' | 'under4k' | 'silk'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'priceLow' | 'priceHigh'>('featured');

  // Filter and sort the sarees
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter
    if (activeFilter === 'under2k') {
      list = list.filter(p => p.price <= 2000);
    } else if (activeFilter === 'under4k') {
      list = list.filter(p => p.price <= 4000);
    } else if (activeFilter === 'silk') {
      list = list.filter(p => p.name.toLowerCase().includes('silk') || p.category?.toLowerCase().includes('silk'));
    }

    // Sort
    if (sortBy === 'priceLow') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
      list.sort((a, b) => b.price - a.price);
    } else {
      // Featured / Newly added first
      list.sort((a: any, b: any) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    }

    return list;
  }, [products, activeFilter, sortBy]);

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-[#FAF8F5] via-white to-[#F4F6F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#698156]/10 text-[#698156] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grand Saree Showcase</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-bold tracking-tight">
            Sale Sarees Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base mt-2.5 leading-relaxed">
            Pure Silk, Banarasi, Kanchipuram & Festive Drapes • Direct artisan prices with free delivery across India.
          </p>
        </motion.div>

        {/* Filter & Sorting Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200/80">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Sarees ({products.length})
            </button>
            <button
              onClick={() => setActiveFilter('under2k')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'under2k'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Under ₹2,000
            </button>
            <button
              onClick={() => setActiveFilter('under4k')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'under4k'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Under ₹4,000
            </button>
            <button
              onClick={() => setActiveFilter('silk')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'silk'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pure Silk
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-[#698156] shadow-2xs"
            >
              <option value="featured">Featured / Newest</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Responsive Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {isLoading ? (
            [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xs">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-amber-400" />
              <p className="text-base font-bold text-gray-800">No sarees match this filter</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-3 px-4 py-2 bg-[#698156] text-white text-xs font-bold rounded-xl"
              >
                Show All Sarees
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
