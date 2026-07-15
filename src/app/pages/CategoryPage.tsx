import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { fetchProducts, Product } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const categoryTitle = category 
    ? category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ') 
    : 'All Collections';

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const data = await fetchProducts(category);
        console.log(`Category [${category}] Products Fetched:`, data);
        setProducts(data);
      } catch (error) {
        console.error('Error loading category products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [category]);

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navigation />
      
      <main className="pt-44 sm:pt-48 lg:pt-52 pb-20 px-4 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{categoryTitle}</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mb-4"
          >
            {categoryTitle}
          </motion.h1>
          <p className="text-gray-600">Discover our curated selection of premium {categoryTitle.toLowerCase()}.</p>
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
                No products found in this category.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
