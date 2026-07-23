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
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 's1',
    name: 'Royal Maroon Silk Saree',
    price: 4999,
    compare_at_price: 6999,
    originalPrice: 6999,
    category: 'Sarees',
    image: '/saree_s1.jpg',
    images: ['/saree_s1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#800000']
  },
  {
    id: 's2',
    name: 'Emerald Zari Banarasi Saree',
    price: 8499,
    compare_at_price: 12999,
    originalPrice: 12999,
    category: 'Sarees',
    image: '/saree_s2.jpg',
    images: ['/saree_s2.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#004f30']
  },
  {
    id: 's3',
    name: 'Golden Kanchipuram Silk Saree',
    price: 12999,
    compare_at_price: 18999,
    originalPrice: 18999,
    category: 'Sarees',
    image: '/saree_s3.jpg',
    images: ['/saree_s3.jpg'],
    rating: 5.0,
    status: 'Published',
    colors: ['#D4AF37']
  },
  {
    id: 's4',
    name: 'Midnight Blue Georgette Saree',
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Sarees',
    image: '/saree_s4.jpg',
    images: ['/saree_s4.jpg'],
    rating: 4.5,
    status: 'Published',
    colors: ['#000080']
  },
  {
    id: 'k1',
    name: 'Chanderi White Kurta & Pink Dupatta Set',
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Kurtis',
    image: '/kurti_k1.jpg',
    images: ['/kurti_k1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#ffffff', '#FFC0CB']
  },
  {
    id: 'k2',
    name: 'Sunshine Yellow Floral Anarkali Kurti',
    price: 2999,
    compare_at_price: 3999,
    originalPrice: 3999,
    category: 'Kurtis',
    image: '/kurti_k2.jpg',
    images: ['/kurti_k2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#ffffff', '#FFD700']
  },
  {
    id: 'k3',
    name: 'Indigo Blue Floral Georgette Anarkali',
    price: 3299,
    compare_at_price: 4499,
    originalPrice: 4499,
    category: 'Kurtis',
    image: '/kurti_k3.jpg',
    images: ['/kurti_k3.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#000080', '#ADD8E6']
  },
  {
    id: 'l1',
    name: 'Royal Chocolate Embroidered Velvet Lehenga',
    price: 18999,
    compare_at_price: 24999,
    originalPrice: 24999,
    category: 'Lehengas',
    image: '/lehenga_l1.jpg',
    images: ['/lehenga_l1.jpg'],
    rating: 5.0,
    status: 'Published',
    colors: ['#4A2E1B', '#D4AF37']
  },
  {
    id: 'l2',
    name: 'Teal Blue Heritage Zardosi Lehenga',
    price: 15999,
    compare_at_price: 21999,
    originalPrice: 21999,
    category: 'Lehengas',
    image: '/lehenga_l2.jpg',
    images: ['/lehenga_l2.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#005F73', '#D4AF37']
  },
  {
    id: 'l3',
    name: 'Blush Peach Sequin Silk Lehenga',
    price: 12999,
    compare_at_price: 17999,
    originalPrice: 17999,
    category: 'Lehengas',
    image: '/lehenga_l3.jpg',
    images: ['/lehenga_l3.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FFD1DC', '#D4AF37']
  },
  {
    id: 'l4',
    name: 'Regal Purple Floral Banarasi Lehenga',
    price: 14999,
    compare_at_price: 19999,
    originalPrice: 19999,
    category: 'Lehengas',
    image: '/lehenga_l4.jpg',
    images: ['/lehenga_l4.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#4B0082', '#D4AF37']
  },
  {
    id: 'l5',
    name: 'Pastel Paradise Dual Tone Lehenga Set',
    price: 16999,
    compare_at_price: 22999,
    originalPrice: 22999,
    category: 'Lehengas',
    image: '/lehenga_l5.jpg',
    images: ['/lehenga_l5.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#ADD8E6', '#FFB6C1']
  },
  {
    id: 'ss1',
    name: 'Lavender Blossom Patiala Suit',
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Salwar Sets',
    image: '/salwar_ss1.jpg',
    images: ['/salwar_ss1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#E6E6FA', '#FFFFFF']
  },
  {
    id: 'ss2',
    name: 'Mustard Gold Silk Patiala Suit',
    price: 4299,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Salwar Sets',
    image: '/salwar_ss2.jpg',
    images: ['/salwar_ss2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#FFD700', '#D4AF37']
  },
  {
    id: 'ss3',
    name: 'Imperial Purple Patiala Suit',
    price: 4999,
    compare_at_price: 6999,
    originalPrice: 6999,
    category: 'Salwar Sets',
    image: '/salwar_ss3.jpg',
    images: ['/salwar_ss3.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#800080', '#FFFFFF']
  },
  {
    id: 'ss4',
    name: 'Wine Gold Silk Straight Suit',
    price: 3899,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Salwar Sets',
    image: '/salwar_ss4.jpg',
    images: ['/salwar_ss4.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#722F37', '#D4AF37']
  },
  {
    id: 'ss5',
    name: 'Fuchsia Pink Patiala Suit',
    price: 4599,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Salwar Sets',
    image: '/salwar_ss5.jpg',
    images: ['/salwar_ss5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FF00FF', '#FFFFFF']
  },
  {
    id: 'w1',
    name: 'White Pleated Blouse & Brown Culottes',
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Western',
    image: '/western_w1.jpg',
    images: ['/western_w1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#ffffff', '#8B4513']
  },
  {
    id: 'w2',
    name: 'Chocolate Silk Shirt & Beige Trousers',
    price: 3999,
    compare_at_price: 5499,
    originalPrice: 5499,
    category: 'Western',
    image: '/western_w2.jpg',
    images: ['/western_w2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#5C4033', '#F5F5DC']
  },
  {
    id: 'w3',
    name: 'Indigo Floral Peplum & Jeans Set',
    price: 2999,
    compare_at_price: 3999,
    originalPrice: 3999,
    category: 'Western',
    image: '/western_w3.jpg',
    images: ['/western_w3.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#000080', '#ADD8E6']
  },
  {
    id: 's5',
    name: 'Ruby Red Bridal Saree',
    price: 15999,
    compare_at_price: 21999,
    originalPrice: 21999,
    category: 'Sarees',
    image: '/saree_s5.jpg',
    images: ['/saree_s5.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#ff0000']
  },
  {
    id: 'k4',
    name: 'Heritage Crimson Embroidered Anarkali',
    price: 4299,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Kurtis',
    image: '/kurti_k4.jpg',
    images: ['/kurti_k4.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#800000', '#D4AF37']
  },
  {
    id: 'k5',
    name: 'Royal Lavender Sequin Georgette Kurta',
    price: 3899,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Kurtis',
    image: '/kurti_k5.jpg',
    images: ['/kurti_k5.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#E6E6FA', '#D4AF37']
  },
  {
    id: 'w4',
    name: 'Midnight Floral Double Layer Coord Set',
    price: 4599,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Western',
    image: '/western_w4.jpg',
    images: ['/western_w4.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#000000', '#FFFFFF']
  },
  {
    id: 'w5',
    name: 'Sky Striped Shirt & Classic Denim Set',
    price: 3299,
    compare_at_price: 4499,
    originalPrice: 4499,
    category: 'Western',
    image: '/western_w5.jpg',
    images: ['/western_w5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#87CEEB', '#ADD8E6']
  },
  {
    id: 't1',
    name: 'Festive Red & Cream Palazzo Set',
    price: 5499,
    compare_at_price: 7999,
    originalPrice: 7999,
    category: 'Tradition',
    image: '/tradition_t1.jpg',
    images: ['/tradition_t1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#800000', '#F5F5DC']
  },
  {
    id: 't2',
    name: 'Royal Purple Banarasi Gown Set',
    price: 4999,
    compare_at_price: 6999,
    originalPrice: 6999,
    category: 'Tradition',
    image: '/tradition_t2.jpg',
    images: ['/tradition_t2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#800080', '#D4AF37']
  },
  {
    id: 't3',
    name: 'Elegance Crimson Silk Lehenga Choli',
    price: 11999,
    compare_at_price: 15999,
    originalPrice: 15999,
    category: 'Tradition',
    image: '/tradition_t3.jpg',
    images: ['/tradition_t3.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#E60026', '#FFFDD0']
  },
  {
    id: 't4',
    name: 'Mint Grey Embroidered Kurta Set',
    price: 4599,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Tradition',
    image: '/tradition_t4.jpg',
    images: ['/tradition_t4.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#C0C0C0', '#D4AF37']
  },
  {
    id: 't5',
    name: 'Grace Olive Green & Plum Half Saree',
    price: 7999,
    compare_at_price: 9999,
    originalPrice: 9999,
    category: 'Tradition',
    image: '/tradition_t5.jpg',
    images: ['/tradition_t5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#556B2F', '#4B0082']
  },
  {
    id: 'mx1',
    name: 'Sunshine Yellow Chiffon Maxi',
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Maxi',
    image: '/maxi_mx1.jpg',
    images: ['/maxi_mx1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FFD700']
  },
  {
    id: 'mx2',
    name: 'Chocolate Brown Resort Cotton Maxi',
    price: 2899,
    compare_at_price: 3999,
    originalPrice: 3999,
    category: 'Maxi',
    image: '/maxi_mx2.jpg',
    images: ['/maxi_mx2.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#8B4513']
  },
  {
    id: 'mx3',
    name: 'Blossom Pink Ruffled Maxi',
    price: 3199,
    compare_at_price: 4499,
    originalPrice: 4499,
    category: 'Maxi',
    image: '/maxi_mx3.jpg',
    images: ['/maxi_mx3.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#FFC0CB']
  },
  {
    id: 'mx4',
    name: 'Royal Purple Smocked Maxi',
    price: 3999,
    compare_at_price: 5499,
    originalPrice: 5499,
    category: 'Maxi',
    image: '/maxi_mx4.jpg',
    images: ['/maxi_mx4.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#800080']
  },
  {
    id: 'mx5',
    name: 'Vintage Rose Organza Maxi',
    price: 4299,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Maxi',
    image: '/maxi_mx5.jpg',
    images: ['/maxi_mx5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FFF0F5']
  }
];

export async function fetchProducts(category?: string) {
  let fetched: Product[] = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      fetched = data.map(p => {
        const itemImages = (p.images && p.images.length > 0) 
          ? p.images 
          : (p.image_url ? [p.image_url] : (p.image ? [p.image] : [PLACEHOLDER_IMAGE]));
        return {
          ...p,
          image: itemImages[0],
          images: itemImages,
          price: p.price,
          originalPrice: p.compare_at_price || p.original_price || p.price,
          colors: p.colors || ['#D4AF37'],
          rating: p.rating || 4.8,
          status: p.status || 'Published'
        };
      });
    }
  } catch (err) {
    console.error('Supabase fetch failed:', err);
  }

  if (fetched.length === 0) {
    fetched = MOCK_PRODUCTS;
  }

  if (category && category !== 'all') {
    const rawTarget = category.toLowerCase().replace(/-/g, ' ');
    let targetStem = rawTarget;
    if (targetStem.endsWith('es')) targetStem = targetStem.slice(0, -2);
    else if (targetStem.endsWith('s') && targetStem.length > 3) targetStem = targetStem.slice(0, -1);

    const synonymTerms = [rawTarget, targetStem];
    if (rawTarget.includes('kurt') || rawTarget.includes('kurtah') || rawTarget.includes('anarkali')) {
      synonymTerms.push('kurti', 'kurta', 'kurtis', 'kurtas', 'kurtha', 'kurthas', 'anarkali');
    }
    if (rawTarget.includes('sare') || rawTarget.includes('sari')) {
      synonymTerms.push('saree', 'sari', 'sarees', 'saris');
    }
    if (rawTarget.includes('leheng') || rawTarget.includes('lehang') || rawTarget.includes('choli')) {
      synonymTerms.push('lehenga', 'lehanga', 'lehengas', 'lehangas', 'choli');
    }
    if (rawTarget.includes('salwar') || rawTarget.includes('suit') || rawTarget.includes('patiala')) {
      synonymTerms.push('salwar', 'suit', 'suits', 'set', 'sets', 'patiala');
    }
    if (rawTarget.includes('maxi') || rawTarget.includes('gown')) {
      synonymTerms.push('maxi', 'gown', 'gowns');
    }

    return fetched.filter(p => {
      const pCat = (p.category || '').toLowerCase().replace(/-/g, ' ');
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();

      return synonymTerms.some(term => 
        pCat.includes(term) || pName.includes(term) || pDesc.includes(term)
      );
    });
  }

  return fetched;
}
