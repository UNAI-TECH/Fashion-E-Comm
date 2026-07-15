import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { HeroSection } from '../components/HeroSection';
import { FeaturedCategories } from '../components/FeaturedCategories';
import { TrendingCollection } from '../components/TrendingCollection';
import { MotionBanner } from '../components/MotionBanner';
import { Testimonials } from '../components/Testimonials';
import { InstagramGallery } from '../components/InstagramGallery';
import { Footer } from '../components/Footer';
import { fetchProducts, Product } from '../data/products';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

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

  useEffect(() => {
    if (!isLoading && location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location, isLoading]);

  return (
    <div className="min-h-screen">
      <AnnouncementBar />
      <Navigation />
      <HeroSection />
      <FeaturedCategories />
      <MotionBanner />
      <TrendingCollection products={products} isLoading={isLoading} />
      <Testimonials />
      <InstagramGallery />
      <Footer />
    </div>
  );
}