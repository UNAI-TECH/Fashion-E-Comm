import { useParams, useSearchParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { fetchProducts, Product } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { performAISearch } from '../utils/aiSearchEngine';
import { Sparkles, SearchX } from 'lucide-react';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // Determine Title
  const categoryTitle = searchQuery
    ? `Search Results for "${searchQuery}"`
    : category
    ? category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')
    : 'All Collections';

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setFallbackMessage(null);
      try {
        const allData = await fetchProducts();
        
        if (searchQuery && searchQuery.trim()) {
          // Perform Antigravity AI Semantic Search
          const aiResult = performAISearch(searchQuery, allData);
          setProducts(aiResult.products);
          if (aiResult.isFallback) {
            setFallbackMessage(aiResult.fallbackMessage || "No exact match found. Here are similar products you may like.");
          }
        } else if (category && category !== 'search' && category !== 'all') {
          const categoryData = await fetchProducts(category);
          setProducts(categoryData);
        } else {
          setProducts(allData);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [category, searchQuery]);

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
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1A1A1A] mb-3"
          >
            {categoryTitle}
          </motion.h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {searchQuery 
              ? `AI Semantic Search found ${products.length} relevant items` 
              : `Discover our curated selection of premium ${categoryTitle.toLowerCase()}.`}
          </p>

          {/* Fallback Notice Message */}
          {fallbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-sm"
            >
              <SearchX className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span>{fallbackMessage}</span>
            </motion.div>
          )}
        </div>

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
              <div className="col-span-full py-20 text-center text-gray-500 bg-gray-50 rounded-3xl border border-dashed p-8">
                <SearchX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-serif text-xl text-gray-800 mb-1">No products found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Try searching for terms like "black saree", "cotton kurti", "blue dress", or "wedding".
                </p>
                <Link to="/" className="inline-block px-6 py-2.5 bg-[#800000] text-white text-xs font-bold rounded-xl shadow-md">
                  Explore All Collections
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
