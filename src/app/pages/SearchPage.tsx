import { useSearchParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { fetchProducts, Product } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { intelligentSearch, getRecommendedFallback } from '../../lib/aiSearchEngine';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    async function executeSearch() {
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const allProducts = await fetchProducts();
        
        let results = intelligentSearch(query, allProducts);
        
        if (results.length === 0) {
          results = getRecommendedFallback(allProducts);
          setIsFallback(true);
        } else {
          setIsFallback(false);
        }
        
        setProducts(results);
      } catch (error) {
        console.error('Error during search:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    executeSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navigation />
      
      <main className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#800000]">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Search Results</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] mb-4"
          >
            Search Results for "{query}"
          </motion.h1>
          {isFallback ? (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl inline-block">
              <p className="text-sm font-medium">No exact matches found for "{query}". Here are some popular recommendations instead:</p>
            </div>
          ) : (
            <p className="text-gray-600">Found {products.length} products matching your search.</p>
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
              <div className="col-span-full py-20 text-center text-gray-500">
                No products found.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
