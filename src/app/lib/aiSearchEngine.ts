import { Product } from '../data/products';

export interface AISearchResult {
  products: Product[];
  isFallback: boolean;
  message?: string;
  queryIntent: {
    colors: string[];
    categories: string[];
    fabrics: string[];
    occasions: string[];
    keywords: string[];
  };
}

// 1. Recognized Color Families
const COLOR_FAMILIES: Record<string, string[]> = {
  black: ['black', 'jet black', 'charcoal', 'onyx', 'midnight', 'dark', 'ebony'],
  blue: ['blue', 'sky blue', 'navy', 'navy blue', 'royal blue', 'turquoise', 'teal', 'cyan', 'indigo', 'azure'],
  pink: ['pink', 'baby pink', 'rose pink', 'blush', 'hot pink', 'magenta', 'coral', 'fuchsia', 'peach'],
  white: ['white', 'ivory', 'cream', 'off white', 'off-white', 'pearl', 'pearl white', 'snow'],
  red: ['red', 'maroon', 'wine', 'crimson', 'ruby', 'burgundy', 'scarlet'],
  gold: ['gold', 'golden', 'yellow', 'mustard', 'honey', 'amber'],
  green: ['green', 'emerald', 'emerald green', 'mint', 'olive', 'sage', 'bottle green'],
  purple: ['purple', 'violet', 'lavender', 'plum', 'mauve', 'lilac'],
  brown: ['brown', 'chocolate', 'tan', 'beige', 'khaki', 'nude', 'camel'],
};

// 2. Synonyms Mapping
const SYNONYMS: Record<string, string[]> = {
  kurta: ['kurti', 'kurtis', 'kurtas', 'anarkali', 'tunic'],
  kurti: ['kurta', 'kurtis', 'kurtas', 'anarkali', 'tunic'],
  gown: ['maxi', 'maxi dress', 'gown', 'gowns', 'dress'],
  dress: ['western', 'western wear', 'maxi', 'dress', 'dresses', 'tunic', 'top'],
  top: ['top', 'tops', 'shirt', 'blouse', 'tunic', 'kurti', 'dress'],
  saree: ['saree', 'sari', 'sarees', 'saris'],
  sari: ['saree', 'sari', 'sarees', 'saris'],
  ethnic: ['saree', 'kurti', 'salwar set', 'lehenga', 'anarkali'],
  traditional: ['saree', 'kurti', 'salwar set', 'lehenga', 'anarkali', 'ethnic'],
  party: ['party', 'party wear', 'evening', 'cocktail', 'celebration'],
  casual: ['casual', 'daily wear', 'everyday', 'office wear'],
  festive: ['festive', 'festival', 'wedding', 'celebration'],
  wedding: ['wedding', 'bridal', 'lehenga', 'saree', 'gowns', 'festive'],
};

// 3. Typo & Abbreviation Tolerance
const TYPO_MAP: Record<string, string> = {
  blk: 'black',
  wht: 'white',
  pnk: 'pink',
  blu: 'blue',
  kurta: 'kurti',
  kurthas: 'kurti',
  kurtis: 'kurti',
  sarees: 'saree',
  saris: 'saree',
  sari: 'saree',
  sare: 'saree',
  lehnga: 'lehenga',
  lehanga: 'lehenga',
  salwar: 'salwar set',
  patiala: 'salwar set',
};

// Known Fabrics
const KNOWN_FABRICS = ['cotton', 'silk', 'georgette', 'chiffon', 'velvet', 'organza', 'rayon', 'linen', 'satin'];

// Known Occasions
const KNOWN_OCCASIONS = ['wedding', 'party', 'office', 'casual', 'festive', 'brunch', 'bridal', 'business'];

/**
 * Intelligent AI Search Engine for Fashion E-Commerce
 */
export function performAISearch(query: string, allProducts: Product[]): AISearchResult {
  const rawQuery = (query || '').trim().toLowerCase();
  if (!rawQuery) {
    return {
      products: allProducts,
      isFallback: false,
      queryIntent: { colors: [], categories: [], fabrics: [], occasions: [], keywords: [] },
    };
  }

  // Tokenize & Normalize
  const rawTokens = rawQuery.split(/\s+/).filter(Boolean);
  const normalizedTokens = rawTokens.map(t => TYPO_MAP[t] || t);

  const colorsDetected: string[] = [];
  const categoriesDetected: string[] = [];
  const fabricsDetected: string[] = [];
  const occasionsDetected: string[] = [];
  const genericKeywords: string[] = [];

  // Parse Query Intent
  normalizedTokens.forEach(token => {
    // Check Color
    let foundColor = false;
    for (const [family, members] of Object.entries(COLOR_FAMILIES)) {
      if (members.includes(token) || family === token) {
        colorsDetected.push(family);
        foundColor = true;
        break;
      }
    }

    // Check Category / Synonyms
    let foundCategory = false;
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (key === token || syns.includes(token)) {
        categoriesDetected.push(key);
        foundCategory = true;
        break;
      }
    }

    // Check Fabric
    let foundFabric = false;
    if (KNOWN_FABRICS.includes(token)) {
      fabricsDetected.push(token);
      foundFabric = true;
    }

    // Check Occasion
    let foundOccasion = false;
    if (KNOWN_OCCASIONS.includes(token)) {
      occasionsDetected.push(token);
      foundOccasion = true;
    }

    if (!foundColor && !foundCategory && !foundFabric && !foundOccasion) {
      genericKeywords.push(token);
    }
  });

  const queryIntent = {
    colors: Array.from(new Set(colorsDetected)),
    categories: Array.from(new Set(categoriesDetected)),
    fabrics: Array.from(new Set(fabricsDetected)),
    occasions: Array.from(new Set(occasionsDetected)),
    keywords: genericKeywords,
  };

  // Score each product
  const scoredProducts = allProducts.map(product => {
    let score = 0;
    const nameLower = (product.name || '').toLowerCase();
    const categoryLower = (product.category || '').toLowerCase();
    const descLower = (product.description || '').toLowerCase();
    const fabricLower = (product.fabric || '').toLowerCase();
    const occasionLower = (product.occasion || '').toLowerCase();

    // 1. Color Scoring (Crucial Rule: If user searches "black top", ALL black products must be matched!)
    if (queryIntent.colors.length > 0) {
      const colorMatch = queryIntent.colors.some(colorFamily => {
        const familyMembers = COLOR_FAMILIES[colorFamily] || [colorFamily];
        return familyMembers.some(member =>
          nameLower.includes(member) ||
          categoryLower.includes(member) ||
          descLower.includes(member)
        );
      });

      if (colorMatch) {
        score += 50;
      } else {
        // If color was explicitly searched (e.g. "black"), penalize non-black products unless query was ambiguous
        score -= 40;
      }
    }

    // 2. Category Scoring
    if (queryIntent.categories.length > 0) {
      const catMatch = queryIntent.categories.some(cat => {
        const syns = SYNONYMS[cat] || [cat];
        return syns.some(syn => nameLower.includes(syn) || categoryLower.includes(syn));
      });

      if (catMatch) {
        score += 40;
      }
    }

    // 3. Fabric Scoring
    if (queryIntent.fabrics.length > 0) {
      const fabMatch = queryIntent.fabrics.some(fab =>
        nameLower.includes(fab) || descLower.includes(fab) || fabricLower.includes(fab)
      );
      if (fabMatch) {
        score += 35;
      }
    }

    // 4. Occasion Scoring
    if (queryIntent.occasions.length > 0) {
      const occMatch = queryIntent.occasions.some(occ =>
        nameLower.includes(occ) || descLower.includes(occ) || occasionLower.includes(occ)
      );
      if (occMatch) {
        score += 30;
      }
    }

    // 5. Keyword Matching across Name and Description
    normalizedTokens.forEach(token => {
      if (nameLower.includes(token)) score += 15;
      if (categoryLower.includes(token)) score += 10;
      if (descLower.includes(token)) score += 5;
    });

    return { product, score };
  });

  // Filter products with score > 0
  const matched = scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);

  // Exact / Relevant Matches Found
  if (matched.length > 0) {
    return {
      products: matched,
      isFallback: false,
      queryIntent,
    };
  }

  // Fallback: If no exact matches exist, return closest alternatives
  const fallbackProducts = [...allProducts].slice(0, 8);
  return {
    products: fallbackProducts,
    isFallback: true,
    message: 'No exact match found. Here are similar products you may like.',
    queryIntent,
  };
}
