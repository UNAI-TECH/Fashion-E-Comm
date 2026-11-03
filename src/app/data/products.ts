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
export function normalizeKey(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const STANDARD_APPAREL_CATEGORIES = new Set([
  'sarees',
  'kurtis',
  'lehengas',
  'salwar-sets',
  'salwar sets',
  'salwar',
  'western',
  'tradition',
  'maxi',
]);

export function isStandardApparelCategory(target?: string): boolean {
  if (!target) return false;
  const raw = target.toLowerCase().trim();
  const clean = raw.replace(/-/g, ' ');
  const norm = normalizeKey(target);
  return STANDARD_APPAREL_CATEGORIES.has(raw) || STANDARD_APPAREL_CATEGORIES.has(clean) || STANDARD_APPAREL_CATEGORIES.has(norm);
}

/**
 * Universal matcher for product materials and material types.
 * Matches by exact material_type, normalized aliases (e.g. kanchicotton <-> Kanchi Cotton),
 * Checks Pending Fancy Sarees, Viscose, and custom material names.
 */
export function matchProductByMaterial(product: Product | any, target: string): boolean {
  if (!target) return false;
  const rawTarget = target.trim().toLowerCase();
  const normTarget = normalizeKey(target);
  if (!normTarget) return false;

  const mat = (product.material || product.material_type || product.specifications?.material || '').trim();
  const rawMat = mat.toLowerCase();
  const normMat = normalizeKey(mat);
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const pattern = (product.specifications?.pattern || '').toLowerCase();
  const design = (product.specifications?.design || '').toLowerCase();
  const fullText = `${rawMat} ${name} ${pattern} ${design} ${desc}`.toLowerCase();

  // 1. Direct or normalized match on material_type / material
  if (rawMat && (rawMat === rawTarget || normMat === normTarget)) return true;

  // 2. Checks Pending Fancy Sarees / Checks Pedding Sarees / Checks Sarees
  if (normTarget.includes('check')) {
    if (normMat.includes('check') || normMat.includes('pedd') || normMat.includes('pend')) {
      return true;
    }
    if (name.includes('check') || name.includes('checked')) {
      return true;
    }
    return false;
  }

  // 3. Kanchi Cotton Sarees
  if (normTarget.includes('kanchi')) {
    const hasKanchi = normMat.includes('kanchi') || name.includes('kanchi') || fullText.includes('kanchi');
    if (!hasKanchi) return false;
    if (normTarget.includes('cotton')) {
      return normMat.includes('cotton') || name.includes('cotton') || fullText.includes('cotton');
    }
    return true;
  }

  // 4. Viscose Sarees
  if (normTarget.includes('viscose')) {
    return normMat.includes('viscose') || name.includes('viscose') || fullText.includes('viscose');
  }

  // 5. Fancy Sarees (when target is fancy and not checks)
  if (normTarget.includes('fancy') && !normTarget.includes('check')) {
    const isFancy = normMat.includes('fancy') || name.includes('fancy');
    const isChecks = normMat.includes('check') || name.includes('check');
    return isFancy && !isChecks;
  }

  // 6. Direct substring match on material_type
  if (normMat && normTarget.length >= 4 && (normMat.includes(normTarget) || normTarget.includes(normMat))) {
    return true;
  }

  // 7. General Token-based matching: for any custom material type (e.g. 'Pure Mulberry Silk', 'Banarasi Fashion silk sarees')
  const targetWords = rawTarget
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && w !== 'saree' && w !== 'sarees');

  if (targetWords.length > 0) {
    const allWordsMatch = targetWords.every(w => {
      return normMat.includes(w) || name.includes(w) || fullText.includes(w);
    });
    if (allWordsMatch) return true;
  }

  return false;
}

/**
 * Fetch products from Supabase database with material-level filtering support.
 * All products come exclusively from the database — no mock data, no fallback fixtures.
 */
export async function fetchProducts(category?: string): Promise<Product[]> {
  let dbProducts: Product[] = [];
  const cleanCat = (category || '').toLowerCase().trim();
  const isStdCategory = isStandardApparelCategory(category);
  const isSpecialFilter = cleanCat === 'all' || cleanCat === 'trending' || cleanCat === 'new-arrivals' || !cleanCat;

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    // Apply standard category filter at DB level ONLY if it is an actual apparel category
    if (category && isStdCategory) {
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
        const catParam = category && isStdCategory
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

  // Handle Material-specific filter: If not a standard apparel category or special filter, filter by material
  if (category && !isStdCategory && !isSpecialFilter) {
    const matched = dbProducts.filter(p => matchProductByMaterial(p, category));
    return matched.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return (b.rating ?? 0) - (a.rating ?? 0);
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
      material: productData.material || productData.material_type || productData.specifications?.material || undefined,
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
