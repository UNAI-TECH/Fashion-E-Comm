import { supabase } from '../../lib/supabase';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number; // Mapped from compare_at_price
  compare_at_price?: number;
  category: string;
  images: string[];
  image: string; // Compatibility field for UI components using single image
  rating: number;
  stock_quantity?: number;
  status: string;
  colors: string[];
}


const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop';

export async function fetchProducts(category?: string) {
  let query = supabase.from('products').select('*').eq('status', 'Published');
  
  if (category && category !== 'all') {
    // Normalize: 'salwar-sets' -> 'salwar sets'
    const normalized = category.toLowerCase().replace(/-/g, ' ');
    // Title case: 'salwar sets' -> 'Salwar Sets'
    const titleCase = normalized.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    // Match against both the slug-like and Title Case versions
    query = query.or(`category.eq."${titleCase}",category.eq."${normalized}",category.eq."${category}"`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return (data || []).map(p => {
    // Standardize Image Handling: 
    // 1. Prioritize Supabase images array
    // 2. Fallback to image_url field
    // 3. Final fallback to high-quality placeholder
    const itemImages = (p.images && p.images.length > 0) 
      ? p.images 
      : (p.image_url ? [p.image_url] : [PLACEHOLDER_IMAGE]);
      
    const primaryImage = itemImages[0];
    
    return {
      ...p,
      image: primaryImage,
      images: itemImages,
      originalPrice: p.compare_at_price, // Map for UI compatibility
      colors: p.colors || ['#D4AF37'],
      rating: p.rating || 4.5,
      status: p.status || 'Published'
    };
  }) as Product[];
}
