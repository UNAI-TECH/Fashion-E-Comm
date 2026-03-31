import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { HeroSection } from '../components/HeroSection';
import { FeaturedCategories } from '../components/FeaturedCategories';
import { TrendingCollection } from '../components/TrendingCollection';
import { StylePicks } from '../components/StylePicks';
import { FlashSale } from '../components/FlashSale';
import { MotionBanner } from '../components/MotionBanner';
import { Testimonials } from '../components/Testimonials';
import { InstagramGallery } from '../components/InstagramGallery';
import { Footer } from '../components/Footer';
import { fetchProducts, Product } from '../data/products';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllProducts() {
      setIsLoading(true);
      try {
        const data = await fetchProducts();
        console.log('Home Products Fetched:', data);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching home products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllProducts();
  }, []);

  return (
    <div className="min-h-screen">
      <AnnouncementBar />
      <Navigation />
      <HeroSection />
      <FeaturedCategories />
      <MotionBanner />
      <TrendingCollection products={products.slice(0, 8)} isLoading={isLoading} />
      <StylePicks products={products.slice(8, 12)} isLoading={isLoading} />
      <FlashSale products={products.slice(12, 16)} isLoading={isLoading} />
      <Testimonials />
      <InstagramGallery />
      <Footer />
    </div>
  );
}