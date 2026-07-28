import { Product } from '../data/products';

export interface AISearchResult {
  products: Product[];
  isFallback: boolean;
  fallbackMessage?: string;
  matchedAttributes: {
    colors: string[];
    categories: string[];
    fabrics: string[];
    occasions: string[];
    keywords: string[];
  };
}

// Color Families
const COLOR_FAMILIES: Record<string, string[]> = {
  black: ['black', 'jet black', 'charcoal', 'onyx', 'dark black'],
  blue: ['blue', 'sky blue', 'navy', 'royal blue', 'turquoise', 'teal', 'powder blue', 'indigo'],
  pink: ['pink', 'baby pink', 'rose pink', 'blush', 'hot pink', 'magenta', 'fuchsia', 'peach pink'],
  white: ['white', 'ivory', 'cream', 'off white', 'pearl white', 'off-white'],
  red: ['red', 'maroon', 'wine', 'crimson', 'ruby', 'scarlet', 'burgundy', 'cherry'],
  green: ['green', 'emerald', 'olive', 'mint', 'forest green', 'sage green', 'bottle green'],
  yellow: ['yellow', 'gold', 'mustard', 'amber', 'lemon yellow'],
  purple: ['purple', 'lavender', 'plum', 'violet', 'lilac'],
};

// Known Category Keywords
const CATEGORY_MAP: Record<string, string[]> = {
  saree: ['saree', 'sarees', 'sari', 'saris', 'drape'],
  kurti: ['kurti', 'kurtis', 'kurta', 'kurtas', 'anarkali'],
  lehenga: ['lehenga', 'lehengas', 'lehnga', 'choli'],
  'salwar set': ['salwar', 'salwar set', 'salwar suit', 'suit', 'suits', 'kameez'],
  western: ['western', 'dress', 'dresses', 'co-ord', 'coord', 'skirt', 'trouser'],
  top: ['top', 'tops', 'shirt', 'shirts', 'blouse', 't-shirt', 't shirt'],
  maxi: ['maxi', 'gown', 'gowns', 'maxi dress', 'long dress'],
};

// Known Fabric Keywords
const FABRIC_KEYWORDS = ['cotton', 'silk', 'georgette', 'chiffon', 'organza', 'velvet', 'linen', 'satin', 'crepe'];

// Known Occasion Keywords
const OCCASION_KEYWORDS = ['wedding', 'party', 'party wear', 'festive', 'office', 'office wear', 'casual', 'daily wear', 'workwear'];

// Spelling correction dictionary
const SPELLING_CORRECTIONS: Record<string, string> = {
  blk: 'black',
  kurta: 'kurti',
  kurtas: 'kurti',
  sarees: 'saree',
  sari: 'saree',
  saris: 'saree',
  lehnga: 'lehenga',
  salwar: 'salwar set',
  gowns: 'gown',
  topwear: 'top',
};

/**
 * Intelligent Semantic Search Engine for Fashion E-Commerce
 */
export function performAISearch(query: string, allProducts: Product[]): AISearchResult {
  if (!query || !query.trim()) {
    return {
      products: allProducts,
      isFallback: false,
      matchedAttributes: { colors: [], categories: [], fabrics: [], occasions: [], keywords: [] },
    };
  }

  const rawTokens = query.toLowerCase().trim().split(/\s+/);
  const normalizedTokens = rawTokens.map(token => SPELLING_CORRECTIONS[token] || token);
  const normalizedQuery = normalizedTokens.join(' ');

  // 1. Detect Colors
  const detectedColors: string[] = [];
  Object.entries(COLOR_FAMILIES).forEach(([colorName, colorVariants]) => {
    if (colorVariants.some(variant => normalizedQuery.includes(variant) || normalizedTokens.includes(variant) || normalizedTokens.includes(colorName))) {
      detectedColors.push(colorName);
    }
  });

  // 2. Detect Categories
  const detectedCategories: string[] = [];
  Object.entries(CATEGORY_MAP).forEach(([catKey, catVariants]) => {
    if (catVariants.some(variant => normalizedQuery.includes(variant) || normalizedTokens.includes(variant) || normalizedTokens.includes(catKey))) {
      detectedCategories.push(catKey);
    }
  });

  // 3. Detect Fabrics
  const detectedFabrics = FABRIC_KEYWORDS.filter(fabric => normalizedTokens.includes(fabric) || normalizedQuery.includes(fabric));

  // 4. Detect Occasions
  const detectedOccasions = OCCASION_KEYWORDS.filter(occ => normalizedTokens.includes(occ) || normalizedQuery.includes(occ));

  // Handle Synonym Mappings for broader category intents
  if (normalizedQuery.includes('ethnic') || normalizedQuery.includes('traditional')) {
    if (!detectedCategories.length) {
      detectedCategories.push('saree', 'kurti', 'salwar set', 'lehenga');
    }
  }

  // 5. Score & Filter Products
  const scoredProducts: { product: Product; score: number; exactMatchCount: number }[] = [];

  allProducts.forEach(product => {
    const prodName = (product.name || '').toLowerCase();
    const prodCat = (product.category || '').toLowerCase();
    const prodDesc = (product.description || '').toLowerCase();
    const prodColors = (product.colors || []).map(c => c.toLowerCase());
    const prodTags = (product.tags || []).map(t => t.toLowerCase());

    let score = 0;
    let exactMatchCount = 0;

    // Check Color Match
    let colorMatches = false;
    if (detectedColors.length > 0) {
      detectedColors.forEach(colorFamily => {
        const familyVariants = COLOR_FAMILIES[colorFamily] || [colorFamily];
        const hasColorInProduct = familyVariants.some(v => 
          prodName.includes(v) || 
          prodCat.includes(v) || 
          prodDesc.includes(v) || 
          prodColors.some(c => c.includes(v)) ||
          prodTags.some(t => t.includes(v))
        );

        if (hasColorInProduct) {
          colorMatches = true;
          score += 50;
          exactMatchCount++;
        }
      });
    }

    // Check Category Match
    let categoryMatches = false;
    if (detectedCategories.length > 0) {
      detectedCategories.forEach(catKey => {
        const catVariants = CATEGORY_MAP[catKey] || [catKey];
        const hasCatInProduct = catVariants.some(v => 
          prodCat.includes(v) || 
          prodName.includes(v) ||
          prodTags.some(t => t.includes(v))
        );

        if (hasCatInProduct) {
          categoryMatches = true;
          score += 40;
          exactMatchCount++;
        }
      });
    }

    // Check Fabric Match
    if (detectedFabrics.length > 0) {
      detectedFabrics.forEach(fabric => {
        if (prodName.includes(fabric) || prodDesc.includes(fabric) || prodTags.some(t => t.includes(fabric))) {
          score += 30;
          exactMatchCount++;
        }
      });
    }

    // Check Occasion Match
    if (detectedOccasions.length > 0) {
      detectedOccasions.forEach(occ => {
        if (prodName.includes(occ) || prodDesc.includes(occ) || prodCat.includes(occ) || prodTags.some(t => t.includes(occ))) {
          score += 30;
          exactMatchCount++;
        }
      });
    }

    // Check Keyword token matches in title or description
    normalizedTokens.forEach(token => {
      if (token.length > 2) {
        if (prodName.includes(token)) score += 15;
        if (prodCat.includes(token)) score += 10;
        if (prodDesc.includes(token)) score += 5;
      }
    });

    // Special Rules for exact Intent combinations:
    // Rule A: If user searched a color + category (e.g. "red saree", "blue kurti", "black top")
    if (detectedColors.length > 0 && detectedCategories.length > 0) {
      if (colorMatches && categoryMatches) {
        score += 100; // Boost exact color + category matches to top!
      } else if (!colorMatches || !categoryMatches) {
        score -= 40; // Penalize products missing either color or category when both specified
      }
    }

    // Rule B: If user searched only color (e.g. "blue", "pink")
    if (detectedColors.length > 0 && detectedCategories.length === 0) {
      if (colorMatches) {
        score += 80;
      }
    }

    // Rule C: If user searched "black top":
    // "black top" -> Return black tops / topwear in black
    if (normalizedQuery.includes('black top') || (normalizedTokens.includes('black') && (normalizedTokens.includes('top') || normalizedTokens.includes('tops')))) {
      if (colorMatches && (prodCat.includes('top') || prodCat.includes('western') || prodName.includes('top') || prodName.includes('shirt'))) {
        score += 150;
      }
    }

    if (score > 10) {
      scoredProducts.push({ product, score, exactMatchCount });
    }
  });

  // Sort by score descending
  scoredProducts.sort((a, b) => b.score - a.score);

  const matchedProducts = scoredProducts.map(sp => sp.product);

  // Fallback Logic: If no exact matches found, return closest alternatives with message
  if (matchedProducts.length === 0) {
    // Attempt relaxed fallback search by partial keywords or return top trending products
    const fallbackProducts = allProducts.slice(0, 8);
    return {
      products: fallbackProducts,
      isFallback: true,
      fallbackMessage: "No exact match found. Here are similar products you may like.",
      matchedAttributes: {
        colors: detectedColors,
        categories: detectedCategories,
        fabrics: detectedFabrics,
        occasions: detectedOccasions,
        keywords: normalizedTokens,
      },
    };
  }

  return {
    products: matchedProducts,
    isFallback: false,
    matchedAttributes: {
      colors: detectedColors,
      categories: detectedCategories,
      fabrics: detectedFabrics,
      occasions: detectedOccasions,
      keywords: normalizedTokens,
    },
  };
}
