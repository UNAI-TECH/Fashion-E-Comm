import { supabase } from '../../lib/supabase';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  compare_at_price?: number;
  category: string;
  images: string[];
  image: string;
  rating: number;
  stock_quantity?: number;
  status: string;
  colors: string[];
  created_at?: string;
  badge?: string;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop';

// ─── Multi-Image Gallery Generators (Myntra-style multi-angle showcase) ───
export function buildComplementaryAngles(primary: string, category: string = '', name: string = ''): string[] {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const prim = (primary || '').toLowerCase();

  // 1. Sarees
  if (cat.includes('saree') || n.includes('saree') || prim.includes('saree')) {
    if (prim.includes('s1') || n.includes('maroon')) {
      return [
        '/saree_royal_maroon.jpg',
        '/saree_model_editorial.png',
        '/saree_s1_cutout.png',
        '/saree_maroon_model_cutout.png',
        '/saree_model.jpg'
      ];
    }
    if (prim.includes('s2') || n.includes('emerald') || n.includes('banarasi')) {
      return [
        '/saree_emerald_model.jpg',
        '/saree_s2_cutout.png',
        '/saree_emerald_model_cutout.png',
        '/saree_category.jpg',
        '/saree_s1.jpg'
      ];
    }
    if (prim.includes('s3') || n.includes('kanchipuram') || n.includes('gold')) {
      return [
        '/saree_s3_cutout.png',
        '/model_1.png',
        '/model_1.jpg',
        '/saree_category_stacked.jpg',
        '/saree_s1.jpg'
      ];
    }
    if (prim.includes('s4') || n.includes('midnight') || n.includes('blue')) {
      return [
        '/saree_s4_cutout.png',
        '/model_2.png',
        '/model_2.jpg',
        '/saree_category.jpg',
        '/saree_s2.jpg'
      ];
    }
    if (prim.includes('s5') || n.includes('peach') || n.includes('pink')) {
      return [
        '/saree_s5_cutout.png',
        '/model_3.png',
        '/model_3.jpg',
        '/saree_category_stacked.jpg',
        '/saree_s3.jpg'
      ];
    }
    return [
      '/saree_royal_maroon.jpg',
      '/saree_emerald_model.jpg',
      '/saree_category.jpg',
      '/saree_model_editorial.png'
    ];
  }

  // 2. Kurtis
  if (cat.includes('kurti') || n.includes('kurti') || n.includes('kurta') || n.includes('anarkali') || prim.includes('kurti')) {
    const cutoutMatch = prim.match(/kurti_k(\d)/);
    const num = cutoutMatch ? cutoutMatch[1] : '1';
    return [
      `/kurti_k${num}_cutout.png`,
      '/kurti_category_green.jpg',
      '/kurti_category.jpg',
      `/kurti_k${num === '1' ? '2' : '1'}.jpg`
    ];
  }

  // 3. Lehengas
  if (cat.includes('lehenga') || n.includes('lehenga') || n.includes('choli') || prim.includes('lehenga')) {
    const match = prim.match(/lehenga_l(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/lehenga_l${num}_cutout.png`,
      '/lehenga_category_pink.jpg',
      `/lehenga_l${num === '1' ? '2' : '1'}.jpg`,
      `/lehenga_l${num === '1' ? '2' : '1'}_cutout.png`
    ];
  }

  // 4. Salwar Sets
  if (cat.includes('salwar') || n.includes('salwar') || n.includes('suit') || n.includes('patiala') || prim.includes('salwar')) {
    const match = prim.match(/salwar_ss(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/salwar_ss${num}_cutout.png`,
      `/salwar_ss${num === '1' ? '2' : '1'}.jpg`,
      `/salwar_ss${num === '1' ? '2' : '1'}_cutout.png`,
      `/salwar_ss${num === '3' ? '4' : '3'}.jpg`
    ];
  }

  // 5. Western
  if (cat.includes('western') || n.includes('western') || n.includes('blouse') || n.includes('trouser') || n.includes('culotte') || prim.includes('western')) {
    const match = prim.match(/western_w(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/western_w${num}_cutout.png`,
      '/western_category_casual.jpg',
      `/western_w${num === '1' ? '2' : '1'}.jpg`,
      `/western_w${num === '1' ? '2' : '1'}_cutout.png`
    ];
  }

  // 6. Maxi
  if (cat.includes('maxi') || n.includes('maxi') || n.includes('gown') || prim.includes('maxi')) {
    const match = prim.match(/maxi_mx(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/maxi_mx${num}_cutout.png`,
      `/maxi_mx${num === '1' ? '2' : '1'}.jpg`,
      `/maxi_mx${num === '1' ? '2' : '1'}_cutout.png`,
      `/maxi_mx${num === '3' ? '4' : '3'}.jpg`
    ];
  }

  // 7. Tradition
  if (cat.includes('tradition') || n.includes('tradition') || prim.includes('tradition')) {
    const match = prim.match(/tradition_t(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/tradition_t${num}_cutout.png`,
      `/tradition_t${num === '1' ? '2' : '1'}.jpg`,
      `/tradition_t${num === '1' ? '2' : '1'}_cutout.png`,
      `/tradition_t${num === '3' ? '4' : '3'}.jpg`
    ];
  }

  return [PLACEHOLDER_IMAGE];
}

export function ensureProductImages(prod: any): string[] {
  if (!prod) return [PLACEHOLDER_IMAGE];
  
  let list: string[] = [];
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    list = prod.images.filter((x: any) => typeof x === 'string' && x.trim().length > 0);
  } else if (typeof prod.images === 'string') {
    try {
      const parsed = JSON.parse(prod.images);
      if (Array.isArray(parsed)) list = parsed.filter(Boolean);
      else if (prod.images.trim()) list = [prod.images.trim()];
    } catch {
      if (prod.images.trim()) list = [prod.images.trim()];
    }
  }

  if (list.length === 0) {
    const single = prod.image_url || prod.image;
    if (single && typeof single === 'string' && single.trim()) {
      list = [single.trim()];
    }
  }

  // Return only actual uploaded images — no fake padding
  if (list.length > 0) {
    return Array.from(new Set(list));
  }

  return [PLACEHOLDER_IMAGE];
}

/**
 * Fetch products from Supabase database.
 * All products come exclusively from the database — no mock data, no localStorage fallbacks.
 * Admin uploads products via the admin dashboard → Supabase → they appear here.
 */
export async function fetchProducts(category?: string): Promise<Product[]> {
  let dbProducts: Product[] = [];

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    // Apply category filter at database level for efficiency
    if (category && category !== 'all' && category !== 'trending') {
      const rawTarget = category.toLowerCase().replace(/-/g, ' ').trim();
      query = query.ilike('category', `%${rawTarget}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    dbProducts = data.map((p: any) => {
      const imgs = ensureProductImages(p);

      return {
        id: String(p.id),
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : undefined,
        originalPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
        category: p.category || 'Sarees',
        images: imgs,
        image: imgs[0],
        rating: p.rating ? Number(p.rating) : 4.5,
        stock_quantity: p.stock_quantity != null ? Number(p.stock_quantity) : 0,
        status: p.status || 'Published',
        colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['#698156'],
        created_at: p.created_at,
        badge: undefined
      };
    });
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }

  // Sort by newest first, then by rating
  const sorted = dbProducts.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  // Handle trending filter
  if (category && category.toLowerCase().replace(/-/g, ' ').trim() === 'trending') {
    return sorted.filter(p => (p.rating || 0) >= 4.7);
  }

  return sorted;
}

/**
 * Fetch a single product by ID from Supabase.
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching product by ID:', error);
      return null;
    }

    const imgs = ensureProductImages(data);

    return {
      id: String(data.id),
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : undefined,
      originalPrice: data.compare_at_price ? Number(data.compare_at_price) : undefined,
      category: data.category || 'Sarees',
      images: imgs,
      image: imgs[0],
      rating: data.rating ? Number(data.rating) : 4.5,
      stock_quantity: data.stock_quantity != null ? Number(data.stock_quantity) : 0,
      status: data.status || 'Published',
      colors: Array.isArray(data.colors) && data.colors.length > 0 ? data.colors : ['#698156'],
      created_at: data.created_at,
      badge: undefined
    };
  } catch (err) {
    console.error('Failed to fetch product:', err);
    return null;
  }
}
