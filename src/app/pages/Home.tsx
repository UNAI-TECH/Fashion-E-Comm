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
import { SEOHead, getOrganizationSchema, getWebsiteSchema, getOnlineStoreSchema, getFAQSchema } from '../components/SEOHead';

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

  // Structured data for the homepage
  const homepageFAQs = getFAQSchema([
    {
      question: 'What is Aanya Fashions?',
      answer: 'Aanya Fashions is a premium online fashion store specializing in women\'s ethnic and western wear. We offer an exclusive collection of sarees, kurtis, lehengas, salwar sets, maxi dresses, and trendy western outfits with free shipping across India.',
    },
    {
      question: 'What types of clothing does Aanya Fashions offer?',
      answer: 'Aanya Fashions offers a wide range of women\'s clothing including designer sarees, trendy kurtis, bridal and party wear lehengas, elegant salwar sets, stylish maxi dresses, and contemporary western wear. Our collections blend traditional Indian craftsmanship with modern fashion trends.',
    },
    {
      question: 'Does Aanya Fashions offer free shipping?',
      answer: 'Yes! Aanya Fashions offers free shipping on orders across India. We ensure your beautiful outfits reach you safely and promptly.',
    },
    {
      question: 'What is the return policy at Aanya Fashions?',
      answer: 'Aanya Fashions offers a hassle-free 7-day return policy. If you\'re not satisfied with your purchase, you can easily return it within 7 days of delivery.',
    },
    {
      question: 'Where can I buy sarees online in India?',
      answer: 'You can buy premium sarees online at Aanya Fashions (www.aanyafashions.com). We offer a curated collection of silk sarees, banarasi sarees, designer sarees, and more at the best prices with doorstep delivery.',
    },
  ]);

  return (
    <div className="min-h-screen">
      <SEOHead
        canonicalUrl="/"
        description="Shop premium sarees, kurtis, lehengas, salwar sets, maxi dresses & western wear at Aanya Fashions. India's trusted online destination for elegant women's ethnic and contemporary fashion. Free shipping, easy returns & exclusive collections."
        keywords="aanya fashions, aanya, aanya fashion, women fashion online india, ethnic wear, traditional clothes, womens wear, fashion world, buy sarees online, designer kurtis, bridal lehenga, salwar kameez, maxi dress online, western wear women india"
        structuredData={[
          getOrganizationSchema(),
          getWebsiteSchema(),
          getOnlineStoreSchema(),
          homepageFAQs,
        ]}
      />
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