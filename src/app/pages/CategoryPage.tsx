import { useParams, Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { fetchProducts, Product } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { SEOHead, getCategorySchema, getBreadcrumbSchema } from '../components/SEOHead';

// SEO-rich category descriptions for search engines
const CATEGORY_SEO: Record<string, { title: string; description: string; keywords: string }> = {
  sarees: {
    title: 'Buy Premium Sarees Online',
    description: 'Shop the finest collection of designer sarees at Aanya Fashions. Browse silk sarees, banarasi sarees, georgette sarees, cotton sarees & more. Free shipping across India. Premium quality, elegant designs, best prices.',
    keywords: 'sarees online, buy sarees, designer sarees, silk sarees, banarasi sarees, wedding sarees, party wear sarees, cotton sarees, georgette sarees, saree price, aanya fashions sarees, best sarees online india',
  },
  kurtis: {
    title: 'Buy Trendy Kurtis Online',
    description: 'Discover elegant kurtis at Aanya Fashions. Shop latest designer kurtis, cotton kurtis, anarkali kurtis, and kurti sets online. Perfect for casual & festive wear. Free delivery & easy returns.',
    keywords: 'kurtis online, buy kurtis, designer kurtis, cotton kurtis, anarkali kurti, kurti sets, women kurtis, latest kurtis design, aanya fashions kurtis, best kurtis online india',
  },
  lehengas: {
    title: 'Buy Designer Lehengas Online',
    description: 'Shop stunning lehengas at Aanya Fashions. Browse bridal lehengas, party wear lehengas, designer lehenga choli & more. Perfect for weddings & special occasions. Free shipping.',
    keywords: 'lehengas online, buy lehengas, bridal lehenga, designer lehenga, lehenga choli, party wear lehenga, wedding lehenga, aanya fashions lehengas, best lehengas online india',
  },
  'salwar-sets': {
    title: 'Buy Elegant Salwar Sets Online',
    description: 'Shop premium salwar sets at Aanya Fashions. Browse designer salwar kameez, churidar sets, palazzo suits & more. Elegant ethnic wear for every occasion. Free shipping across India.',
    keywords: 'salwar sets online, buy salwar kameez, designer salwar suits, churidar sets, palazzo suits, women salwar, aanya fashions salwar, best salwar sets online india',
  },
  western: {
    title: 'Buy Trendy Western Wear for Women',
    description: 'Shop stylish western wear for women at Aanya Fashions. Browse dresses, tops, co-ord sets & more. Contemporary fashion meets premium quality. Free delivery & easy returns.',
    keywords: 'western wear women, buy western dress, women tops online, co-ord sets, women fashion, trendy western wear, aanya fashions western, best western wear online india',
  },
  tradition: {
    title: 'Buy Traditional Indian Wear Online',
    description: 'Shop authentic traditional Indian wear at Aanya Fashions. Browse festive collections, heritage wear, traditional outfits & more. Celebrate culture with premium craftsmanship.',
    keywords: 'traditional clothes, indian traditional wear, festive wear, heritage fashion, traditional outfits women, aanya fashions traditional, ethnic traditional wear india',
  },
  maxi: {
    title: 'Buy Stylish Maxi Dresses Online',
    description: 'Shop elegant maxi dresses at Aanya Fashions. Browse printed maxis, solid maxis, floral maxi dresses & more. Perfect for casual, beach & party wear. Free shipping.',
    keywords: 'maxi dresses online, buy maxi dress, women maxi dress, floral maxi, printed maxi, long dress women, aanya fashions maxi, best maxi dresses online india',
  },
  'new-arrivals': {
    title: 'New Arrivals - Latest Fashion Collection',
    description: 'Discover the latest new arrivals at Aanya Fashions. Shop freshly launched sarees, kurtis, lehengas, western wear & more. Be the first to own trending styles. Free shipping.',
    keywords: 'new arrivals fashion, latest fashion, new collection, trending fashion, new sarees, new kurtis, latest lehengas, aanya fashions new arrivals',
  },
  kanchicotton: {
    title: 'Buy Authentic Kanchi Cotton Sarees Online',
    description: 'Shop pure handloom Kanchi cotton sarees with traditional temple borders and rich pallu at Aanya Fashions. Breathable, elegant, and festive. Free shipping across India.',
    keywords: 'kanchi cotton sarees, buy kanchi cotton saree, traditional south cotton saree, handloom kanchi cotton, aanya fashions kanchi cotton',
  },
  'kanchi-cotton': {
    title: 'Buy Authentic Kanchi Cotton Sarees Online',
    description: 'Shop pure handloom Kanchi cotton sarees with traditional temple borders and rich pallu at Aanya Fashions. Breathable, elegant, and festive. Free shipping across India.',
    keywords: 'kanchi cotton sarees, buy kanchi cotton saree, traditional south cotton saree, handloom kanchi cotton, aanya fashions kanchi cotton',
  },
  viscose: {
    title: 'Buy Elegant Viscose Sarees Online',
    description: 'Discover lustrous, smooth Viscose silk sarees at Aanya Fashions. Lightweight drape, vibrant festive colors, and modern borders with free delivery across India.',
    keywords: 'viscose sarees, buy viscose saree, viscose silk saree, festive viscose saree, aanya fashions viscose',
  },
  'viscose-sarees': {
    title: 'Buy Elegant Viscose Sarees Online',
    description: 'Discover lustrous, smooth Viscose silk sarees at Aanya Fashions. Lightweight drape, vibrant festive colors, and modern borders with free delivery across India.',
    keywords: 'viscose sarees, buy viscose saree, viscose silk saree, festive viscose saree, aanya fashions viscose',
  },
  'fancy-sarees': {
    title: 'Buy Designer Fancy Sarees Online',
    description: 'Shop contemporary fancy sarees, party wear georgette, chiffon, and shimmer designer sarees at Aanya Fashions. Glamorous ethnic wear with free shipping.',
    keywords: 'fancy sarees, buy fancy sarees, party wear fancy saree, designer fancy sarees online, aanya fashions fancy sarees',
  },
  fancy: {
    title: 'Buy Designer Fancy Sarees Online',
    description: 'Shop contemporary fancy sarees, party wear georgette, chiffon, and shimmer designer sarees at Aanya Fashions. Glamorous ethnic wear with free shipping.',
    keywords: 'fancy sarees, buy fancy sarees, party wear fancy saree, designer fancy sarees online, aanya fashions fancy sarees',
  },
  'checks-pedding': {
    title: 'Buy Checks Pedding Sarees Online',
    description: 'Shop traditional Checks Pedding sarees featuring classic checkered patterns and rich zari borders at Aanya Fashions. Authentic handloom quality with free delivery.',
    keywords: 'checks pedding sarees, check pedding saree, checks saree, handloom checks saree, aanya fashions checks pedding',
  },
  'checks-pedding-sarees': {
    title: 'Buy Checks Pedding Sarees Online',
    description: 'Shop traditional Checks Pedding sarees featuring classic checkered patterns and rich zari borders at Aanya Fashions. Authentic handloom quality with free delivery.',
    keywords: 'checks pedding sarees, check pedding saree, checks saree, handloom checks saree, aanya fashions checks pedding',
  },
};

export function CategoryPage() {
  const { category: rawCategoryParam } = useParams<{ category: string }>();
  const location = useLocation();
  const category = rawCategoryParam || location.pathname.replace(/^\/category\//, '').replace(/^\//, '').split('/')[0] || undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const getCategoryTitle = (cat?: string) => {
    if (!cat) return 'All Collections';
    const c = cat.toLowerCase().replace(/-/g, ' ').trim();
    if (c === 'kanchicotton' || c === 'kanchi cotton') return 'Kanchi Cotton Sarees';
    if (c === 'viscose' || c === 'viscose sarees') return 'Viscose Sarees';
    if (c === 'fancy' || c === 'fancy sarees') return 'Fancy Sarees';
    if (c === 'checks pedding' || c === 'checks pedding sarees' || c === 'check pedding') return 'Checks Pedding Sarees';
    return c.charAt(0).toUpperCase() + c.slice(1);
  };

  const categoryTitle = getCategoryTitle(category);

  const categorySlug = (category || 'all').toLowerCase().replace(/\s+/g, '-');
  const seo = CATEGORY_SEO[categorySlug] || {
    title: `${categoryTitle} Collection`,
    description: `Shop premium ${categoryTitle.toLowerCase()} at Aanya Fashions. Discover our curated collection of elegant women's fashion. Free shipping across India.`,
    keywords: `${categoryTitle.toLowerCase()}, buy ${categoryTitle.toLowerCase()} online, aanya fashions ${categoryTitle.toLowerCase()}, women ${categoryTitle.toLowerCase()} india`,
  };

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

    const handleUpdate = () => {
      loadProducts();
    };

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
        loadProducts();
      };
    } catch (e) {}

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);
    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
    };
  }, [category]);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalUrl={`/${categorySlug}`}
        keywords={seo.keywords}
        structuredData={[
          getCategorySchema({
            name: categoryTitle,
            description: seo.description,
            url: `/${categorySlug}`,
          }),
          getBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: categoryTitle, url: `/${categorySlug}` },
          ]),
        ]}
      />
      <AnnouncementBar />
      <Navigation />
      
      <main className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#698156]">Home</Link>
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
