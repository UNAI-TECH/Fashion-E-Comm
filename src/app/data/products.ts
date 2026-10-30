import { supabase } from '../../lib/supabase';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  compare_at_price?: number;
  category: string;
  material?: string;
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
        '/saree_royal_maroon.webp',
        '/saree_model_editorial.webp',
        '/saree_s1_cutout.webp',
        '/saree_maroon_model_cutout.webp',
        '/saree_model.webp'
      ];
    }
    if (prim.includes('s2') || n.includes('emerald') || n.includes('banarasi')) {
      return [
        '/saree_emerald_model.webp',
        '/saree_s2_cutout.webp',
        '/saree_emerald_model_cutout.webp',
        '/saree_category.webp',
        '/saree_s1.webp'
      ];
    }
    if (prim.includes('s3') || n.includes('kanchipuram') || n.includes('gold')) {
      return [
        '/saree_s3_cutout.webp',
        '/model_1.webp',
        '/saree_category_stacked.webp',
        '/saree_s1.webp'
      ];
    }
    if (prim.includes('s4') || n.includes('midnight') || n.includes('blue')) {
      return [
        '/saree_s4_cutout.webp',
        '/model_2.webp',
        '/saree_category.webp',
        '/saree_s2.webp'
      ];
    }
    if (prim.includes('s5') || n.includes('peach') || n.includes('pink')) {
      return [
        '/saree_s5_cutout.webp',
        '/model_3.webp',
        '/saree_category_stacked.webp',
        '/saree_s3.webp'
      ];
    }
    return [
      '/saree_royal_maroon.webp',
      '/saree_emerald_model.webp',
      '/saree_category.webp',
      '/saree_model_editorial.webp'
    ];
  }

  // 2. Kurtis
  if (cat.includes('kurti') || n.includes('kurti') || n.includes('kurta') || n.includes('anarkali') || prim.includes('kurti')) {
    const cutoutMatch = prim.match(/kurti_k(\d)/);
    const num = cutoutMatch ? cutoutMatch[1] : '1';
    return [
      `/kurti_k${num}_cutout.webp`,
      '/kurti_category_green.webp',
      '/kurti_category.webp',
      `/kurti_k${num === '1' ? '2' : '1'}.webp`
    ];
  }

  // 3. Lehengas
  if (cat.includes('lehenga') || n.includes('lehenga') || n.includes('choli') || prim.includes('lehenga')) {
    const match = prim.match(/lehenga_l(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/lehenga_l${num}_cutout.webp`,
      '/lehenga_category_pink.webp',
      `/lehenga_l${num === '1' ? '2' : '1'}.webp`,
      `/lehenga_l${num === '1' ? '2' : '1'}_cutout.webp`
    ];
  }

  // 4. Salwar Sets
  if (cat.includes('salwar') || n.includes('salwar') || n.includes('suit') || n.includes('patiala') || prim.includes('salwar')) {
    const match = prim.match(/salwar_ss(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/salwar_ss${num}_cutout.webp`,
      `/salwar_ss${num === '1' ? '2' : '1'}.webp`,
      `/salwar_ss${num === '1' ? '2' : '1'}_cutout.webp`,
      `/salwar_ss${num === '3' ? '4' : '3'}.webp`
    ];
  }

  // 5. Western
  if (cat.includes('western') || n.includes('western') || n.includes('blouse') || n.includes('trouser') || n.includes('culotte') || prim.includes('western')) {
    const match = prim.match(/western_w(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/western_w${num}_cutout.webp`,
      '/western_category_casual.webp',
      `/western_w${num === '1' ? '2' : '1'}.webp`,
      `/western_w${num === '1' ? '2' : '1'}_cutout.webp`
    ];
  }

  // 6. Maxi
  if (cat.includes('maxi') || n.includes('maxi') || n.includes('gown') || prim.includes('maxi')) {
    const match = prim.match(/maxi_mx(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/maxi_mx${num}_cutout.webp`,
      `/maxi_mx${num === '1' ? '2' : '1'}.webp`,
      `/maxi_mx${num === '1' ? '2' : '1'}_cutout.webp`,
      `/maxi_mx${num === '3' ? '4' : '3'}.webp`
    ];
  }

  // 7. Tradition
  if (cat.includes('tradition') || n.includes('tradition') || prim.includes('tradition')) {
    const match = prim.match(/tradition_t(\d)/);
    const num = match ? match[1] : '1';
    return [
      `/tradition_t${num}_cutout.webp`,
      `/tradition_t${num === '1' ? '2' : '1'}.webp`,
      `/tradition_t${num === '1' ? '2' : '1'}_cutout.webp`,
      `/tradition_t${num === '3' ? '4' : '3'}.webp`
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
const MATERIAL_KEYWORDS: Record<string, string[]> = {
  kanchicotton: ['kanchi', 'cotton'],
  'kanchi-cotton': ['kanchi', 'cotton'],
  viscose: ['viscose'],
  'viscose-sarees': ['viscose'],
  'fancy-sarees': ['fancy', 'georgette', 'chiffon', 'net', 'designer', 'party'],
  fancy: ['fancy', 'georgette', 'chiffon', 'net', 'designer', 'party'],
  'checks-pedding': ['check', 'pedding', 'checks', 'jamdani'],
  'checks-pedding-sarees': ['check', 'pedding', 'checks', 'jamdani'],
  'check-pedding': ['check', 'pedding', 'checks', 'jamdani'],
};

/**
 * Fetch products from Supabase database with material-level filtering support.
 * All products come exclusively from the database — no mock data, no fallback fixtures.
 */
export async function fetchProducts(category?: string): Promise<Product[]> {
  let dbProducts: Product[] = [];
  const cleanCat = (category || '').toLowerCase().trim();
  const isMaterialQuery = !!MATERIAL_KEYWORDS[cleanCat];

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    // Apply standard category filter if not a material-specific sub-route
    if (category && category !== 'all' && category !== 'trending' && !isMaterialQuery) {
      const rawTarget = category.toLowerCase().replace(/-/g, ' ').trim();
      query = query.ilike('category', `%${rawTarget}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products from Supabase:', error);
    } else if (data && data.length > 0) {
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
          material: (p.material_type || p.specifications?.material || p.material || undefined),
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
    }

    // Resilient Fallback: If Supabase returned error or 0 items (e.g. egress quota 402), query backend API
    if (dbProducts.length === 0) {
      try {
        const catParam = category && category !== 'all' && category !== 'trending' && !isMaterialQuery
          ? `&category=${encodeURIComponent(category.replace(/-/g, ' '))}`
          : '';
        const res = await fetch(`/api/products?pageSize=200${catParam}`);
        if (res.ok) {
          const json = await res.json();
          const items = json.products || json.data || [];
          if (Array.isArray(items) && items.length > 0) {
            dbProducts = items.map((p: any) => {
              const imgs = ensureProductImages(p);
              return {
                id: String(p.id),
                name: p.name,
                description: p.description || '',
                price: Number(p.price) || 0,
                compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : undefined,
                originalPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
                category: p.category || 'Sarees',
                material: (p.material_type || p.specifications?.material || p.material || undefined),
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
          }
        }
      } catch (apiErr) {
        console.warn('API fallback fetch error:', apiErr);
      }
    }
  } catch (err) {
    console.error('Failed to fetch products:', err);
  }

  // Handle Material-specific filter exclusively from real database products
  if (isMaterialQuery) {
    const terms = MATERIAL_KEYWORDS[cleanCat] || [];
    return dbProducts.filter(p => {
      const text = `${p.name} ${p.category} ${p.material || ''} ${p.description || ''}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });
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
 * Fetch a single product by ID from Supabase or Backend API.
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    let productData: any = null;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      productData = data;
    } else {
      // Fallback to backend API
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          productData = await res.json();
        }
      } catch (e) {}
    }

    if (!productData) {
      return null;
    }

    const imgs = ensureProductImages(productData);

    return {
      id: String(productData.id),
      name: productData.name,
      description: productData.description || '',
      price: Number(productData.price) || 0,
      compare_at_price: productData.compare_at_price ? Number(productData.compare_at_price) : undefined,
      originalPrice: productData.compare_at_price ? Number(productData.compare_at_price) : undefined,
      category: productData.category || 'Sarees',
      material: productData.material || productData.material_type || undefined,
      images: imgs,
      image: imgs[0],
      rating: productData.rating ? Number(productData.rating) : 4.5,
      stock_quantity: productData.stock_quantity != null ? Number(productData.stock_quantity) : 0,
      status: productData.status || 'Published',
      colors: Array.isArray(productData.colors) && productData.colors.length > 0 ? productData.colors : ['#698156'],
      created_at: productData.created_at,
      badge: undefined
    };
  } catch (err) {
    console.error('Failed to fetch product:', err);
    return null;
  }
}
