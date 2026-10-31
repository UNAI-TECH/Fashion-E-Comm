import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { HeroAdBanner } from '../components/HeroAdBanner';
import { MotionBanner } from '../components/MotionBanner';
import { ShopByCategory } from '../components/ShopByCategory';
import { TrendingCollection } from '../components/TrendingCollection';
import { Footer } from '../components/Footer';
import { fetchProducts, Product } from '../data/products';
import { SEOHead, getOrganizationSchema, getWebsiteSchema, getOnlineStoreSchema, getFAQSchema } from '../components/SEOHead';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const loadAllProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts();
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

  // Structured data for the homepage
  const homepageFAQs = getFAQSchema([
    {
      question: 'What is Aanya Fashions?',
      answer: 'Aanya Fashions is a premium online fashion store specializing in authentic Indian sarees. We offer an exclusive collection of silk sarees, banarasi sarees, kanchipuram sarees, and designer festive sarees with free shipping across India.',
    },
    {
      question: 'What types of clothing does Aanya Fashions offer?',
      answer: 'Aanya Fashions specializes in handcrafted sarees including pure silk sarees, banarasi zari sarees, kanchipuram wedding sarees, festive organza sarees, and designer ethnic wear drapes.',
    },
    {
      question: 'Does Aanya Fashions offer free shipping?',
      answer: 'Yes! Aanya Fashions offers free shipping on all saree orders across India. We ensure your beautiful sarees reach you safely and promptly.',
    },
    {
      question: 'What is the return policy at Aanya Fashions?',
      answer: 'Aanya Fashions offers a hassle-free 7-day easy return policy. If you are not satisfied with your purchase, you can easily request a return within 7 days of delivery with doorstep pickup.',
    },
    {
      question: 'Where can I buy authentic sarees online in India?',
      answer: 'You can buy premium authentic sarees online at Aanya Fashions. We offer a curated collection of silk sarees, banarasi sarees, and designer weaves with 100% secure Razorpay online payments and doorstep delivery.',
    },
  ]);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        canonicalUrl="/"
        description="Shop premium authentic sarees at Aanya Fashions. India's trusted online destination for pure silk, Banarasi, Kanchipuram and designer festive sarees. Free shipping across India, secure online payments & 7-day easy returns."
        keywords="aanya fashions, buy sarees online, pure silk sarees, banarasi sarees, kanchipuram sarees, designer sarees india, wedding sarees, festive saree sale"
        structuredData={[
          getOrganizationSchema(),
          getWebsiteSchema(),
          getOnlineStoreSchema(),
          homepageFAQs,
        ]}
      />
      <AnnouncementBar />
      <Navigation />
      
      {/* 1. Hero Section Banner Slider (as before) */}
      <HeroAdBanner />

      {/* 2. Sale Sarees Collection (Grand Saree Showcase with Material Filters) */}
      <TrendingCollection products={products} isLoading={isLoading} />

      {/* 3. New Season Collection Promotional Section in the bottom of Sale Sarees Collection */}
      <MotionBanner />

      {/* 4. Shop By Category Section (Kanchi Cotton, Viscose Sarees, Fancy Sarees, Checks Pedding) */}
      <ShopByCategory />

      {/* 5. Compact, Proportional Footer */}
      <Footer />

    </div>
  );
}