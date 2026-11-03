import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { Product, matchProductByMaterial } from '../data/products';
import { Crown, PackageSearch, ArrowUpDown, Sparkles } from 'lucide-react';

interface TrendingCollectionProps {
  products: Product[];
  isLoading: boolean;
}

const PRESET_FILTERS = [
  { id: 'kanchicotton', label: 'Kanchi Cotton' },
  { id: 'viscose', label: 'Viscose Sarees' },
  { id: 'fancy', label: 'Fancy Sarees' },
  { id: 'checks', label: 'Checks Pending Fancy Sarees' },
  { id: 'banarasi', label: 'Banarasi Fashion silk sarees' },
];

export function TrendingCollection({ products, isLoading }: TrendingCollectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>(PRESET_FILTERS[0].id);
  const [sortBy, setSortBy] = useState<'featured' | 'priceLow' | 'priceHigh' | 'rating' | 'discount'>('featured');

  // Compute all available filter options in the requested exact order:
  // 1. Kanchi Cotton
  // 2. Viscose Sarees
  // 3. Fancy Sarees
  // 4. Checks Pending
  // 5. Banarasi Fashion silk sarees
  // 6. Dynamic custom materials from products (if any)
  // 7. At last: All Sarees
  const filterTabs = useMemo(() => {
    const presetLabelsLower = new Set(
      PRESET_FILTERS.map(f => f.label.toLowerCase())
    );

    const customMaterials: { id: string; label: string }[] = [];
    products.forEach(p => {
      const mat = (p.material || '').trim();
      if (!mat) return;
      const lower = mat.toLowerCase();
      if (
        lower.includes('kanchi') ||
        lower.includes('viscose') ||
        lower.includes('fancy') ||
        lower.includes('check') ||
        lower.includes('pedding') ||
        lower.includes('banarasi')
      ) {
        return;
      }
      if (!presetLabelsLower.has(lower) && !customMaterials.some(c => c.label.toLowerCase() === lower)) {
        customMaterials.push({ id: `mat_${lower.replace(/\s+/g, '_')}`, label: mat });
      }
    });

    return [
      ...PRESET_FILTERS,
      ...customMaterials,
      { id: 'all', label: 'All Sarees' },
    ];
  }, [products]);

  // Pre-calculate realtime counts for each material filter
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['all'] = products.length;
    counts['kanchicotton'] = products.filter(p => matchProductByMaterial(p, 'kanchicotton')).length;
    counts['viscose'] = products.filter(p => matchProductByMaterial(p, 'viscose')).length;
    counts['fancy'] = products.filter(p => matchProductByMaterial(p, 'fancy')).length;
    counts['checks'] = products.filter(p => matchProductByMaterial(p, 'Checks Pending Fancy Sarees')).length;
    counts['banarasi'] = products.filter(p => matchProductByMaterial(p, 'Banarasi Fashion silk sarees')).length;

    filterTabs.forEach(t => {
      if (t.id.startsWith('mat_')) {
        counts[t.id] = products.filter(p => matchProductByMaterial(p, t.label)).length;
      }
    });

    return counts;
  }, [products, filterTabs]);

  // Filter and sort the sarees in real-time
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeFilter === 'kanchicotton') {
      list = list.filter(p => matchProductByMaterial(p, 'kanchicotton'));
    } else if (activeFilter === 'viscose') {
      list = list.filter(p => matchProductByMaterial(p, 'viscose'));
    } else if (activeFilter === 'fancy') {
      list = list.filter(p => matchProductByMaterial(p, 'fancy'));
    } else if (activeFilter === 'checks') {
      list = list.filter(p => matchProductByMaterial(p, 'Checks Pending Fancy Sarees'));
    } else if (activeFilter === 'banarasi') {
      list = list.filter(p => matchProductByMaterial(p, 'Banarasi Fashion silk sarees'));
    } else if (activeFilter.startsWith('mat_')) {
      const targetLabel = filterTabs.find(t => t.id === activeFilter)?.label || '';
      list = list.filter(p => matchProductByMaterial(p, targetLabel));
    }

    // Real-time sorting
    if (sortBy === 'priceLow') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => {
        const discA = a.compare_at_price && a.compare_at_price > a.price ? (a.compare_at_price - a.price) / a.compare_at_price : 0;
        const discB = b.compare_at_price && b.compare_at_price > b.price ? (b.compare_at_price - b.price) / b.compare_at_price : 0;
        return discB - discA;
      });
    } else {
      // Featured / Newly added first
      list.sort((a: any, b: any) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    }

    return list;
  }, [products, activeFilter, sortBy, filterTabs]);

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

        {/* Enhanced Modern Filter & Sorting Bar */}
        <div className="mb-6 sm:mb-8 pb-4 border-b border-gray-200/80">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            
            {/* Material Filter Pills (Scrollable with no scrollbar on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1 px-0.5">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                const count = tabCounts[tab.id] ?? 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#698156] text-white shadow-md shadow-[#698156]/20 ring-2 ring-[#698156]/30'
                        : 'bg-white hover:bg-[#F4F6F2] text-gray-700 border border-gray-200/90 shadow-2xs hover:border-[#698156]/40'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Count & Realtime Sort Control */}
            <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-500">
                Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> sarees
              </span>

              {/* Styled Sort Dropdown */}
              <div className="relative inline-flex items-center">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-[#698156]/50 focus-within:border-[#698156] focus-within:ring-2 focus-within:ring-[#698156]/20 transition-all">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#698156] flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="featured">Featured / Newest</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="rating">Top Customer Rated</option>
                    <option value="discount">Biggest Discount (% Off)</option>
                  </select>
                </div>
              </div>
            </div>

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
