import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { Product } from '../data/products';
import { Crown, ArrowUpDown, Filter, Check, PackageSearch } from 'lucide-react';

interface TrendingCollectionProps {
  products: Product[];
  isLoading: boolean;
}

export function TrendingCollection({ products, isLoading }: TrendingCollectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'kanchicotton' | 'viscose' | 'fancy' | 'checks' | 'silk'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'priceLow' | 'priceHigh'>('featured');

  // Filter and sort the sarees
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by material
    if (activeFilter === 'kanchicotton') {
      list = list.filter(p => {
        const str = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
        return str.includes('kanchi') || str.includes('cotton');
      });
    } else if (activeFilter === 'viscose') {
      list = list.filter(p => {
        const str = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
        return str.includes('viscose');
      });
    } else if (activeFilter === 'fancy') {
      list = list.filter(p => {
        const str = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
        return str.includes('fancy') || str.includes('georgette') || str.includes('chiffon') || str.includes('net') || str.includes('designer') || str.includes('party');
      });
    } else if (activeFilter === 'checks') {
      list = list.filter(p => {
        const str = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
        return str.includes('check') || str.includes('pedding') || str.includes('jamdani');
      });
    } else if (activeFilter === 'silk') {
      list = list.filter(p => {
        const str = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
        return str.includes('silk') || str.includes('banarasi') || str.includes('kanchipuram') || str.includes('zari');
      });
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
    <section id="grand-saree-showcase" className="py-10 sm:py-14 md:py-16 bg-gradient-to-b from-[#FAF8F5] via-white to-[#F4F6F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#698156]/10 text-[#698156] text-xs font-bold uppercase tracking-wider mb-2.5">
            <Crown className="w-3.5 h-3.5" />
            <span>Grand Saree Showcase</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-bold tracking-tight">
            Sale Sarees Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-xs sm:text-sm md:text-base mt-2 leading-relaxed">
            Filter by authentic saree material • Direct artisan prices with free delivery across India.
          </p>
        </motion.div>

        {/* Filter & Sorting Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-200/80">
          {/* Material Filter Pills */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Sarees ({products.length})
            </button>
            <button
              onClick={() => setActiveFilter('kanchicotton')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer ${
                activeFilter === 'kanchicotton'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Kanchi Cotton
            </button>
            <button
              onClick={() => setActiveFilter('viscose')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer ${
                activeFilter === 'viscose'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Viscose Sarees
            </button>
            <button
              onClick={() => setActiveFilter('fancy')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer ${
                activeFilter === 'fancy'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Fancy Sarees
            </button>
            <button
              onClick={() => setActiveFilter('checks')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer ${
                activeFilter === 'checks'
                  ? 'bg-[#698156] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Checks Pedding
            </button>
            <button
              onClick={() => setActiveFilter('silk')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer ${
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
              className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-[#698156] shadow-2xs cursor-pointer active:scale-95 transition-all"
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
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xs">
              <PackageSearch className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-base font-bold text-gray-800">No sarees match this material filter</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-3 px-4 py-2 bg-[#698156] hover:bg-[#546944] text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
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
