import { useParams, useSearchParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { fetchProducts, Product } from '../data/products';
import { performAISearch, AISearchResult } from '../lib/aiSearchEngine';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Sparkles, Search } from 'lucide-react';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const searchQueryParam = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResultInfo, setSearchResultInfo] = useState<AISearchResult | null>(null);

  const isSearchMode = Boolean(searchQueryParam || category === 'search');
  const activeQuery = searchQueryParam || category || '';
  
  const categoryTitle = isSearchMode
    ? `Search Results for "${activeQuery}"`
    : category
    ? category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ') 
    : 'All Collections';

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const allData = await fetchProducts();
        
        if (isSearchMode || activeQuery) {
          const aiResult = performAISearch(activeQuery, allData);
          setProducts(aiResult.products);
          setSearchResultInfo(aiResult);
        } else {
          setProducts(allData);
          setSearchResultInfo(null);
        }
      } catch (error) {
        console.error('Error loading category/search products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [category, searchQueryParam]);

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navigation />
      
      <main className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{categoryTitle}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1A1A1A] mb-3 flex items-center gap-3"
          >
            {isSearchMode && <Search className="w-8 h-8 text-[#800000]" />}
            {categoryTitle}
          </motion.h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {isSearchMode 
              ? `AI Semantic Search found ${products.length} relevant items.` 
              : `Discover our curated selection of premium ${categoryTitle.toLowerCase()}.`}
          </p>
        </div>

        {/* AI Search Fallback Notice Banner */}
        {searchResultInfo?.isFallback && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">
              {searchResultInfo.message || 'No exact match found. Here are similar products you may like.'}
            </p>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-gray-500">
                No products found matching your search.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
