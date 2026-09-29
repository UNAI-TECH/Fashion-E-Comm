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

  const loadAllProducts = async () => {
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
  };

  useEffect(() => {
    loadAllProducts();

    const handleUpdate = () => {
      loadAllProducts();
    };

    // Instant real-time cross-tab auto-deletion
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('products_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCT_DELETED') {
          const { id, name } = event.data;
          // Instantly remove from main page view with zero delay
          setProducts(prev => prev.filter(p => 
            String(p.id).toLowerCase() !== String(id).toLowerCase() && 
            (!name || p.name.trim().toLowerCase() !== name.trim().toLowerCase())
          ));
        }
        loadAllProducts();
      };
    } catch (e) {}

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
    };
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