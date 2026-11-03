import { Product } from '../app/data/products';

// --- SYNONYMS & NORMALIZATION ---
const SYNONYMS: Record<string, string[]> = {
  saree: ['sari', 'sarees', 'saris'],
  sari: ['saree', 'sarees', 'saris'],
  sarees: ['saree', 'sari', 'saris'],
  sare: ['saree', 'sari'],
  silk: ['silks', 'pattu', 'silky'],
  pattu: ['silk', 'saree'],
  kanchi: ['kanchipuram', 'kanchicotton', 'kanchi-cotton'],
  kanchipuram: ['kanchi', 'kanchi cotton'],
  cotton: ['cottons', 'cotten', 'kotton'],
  kanchicotton: ['kanchi cotton', 'kanchi', 'cotton'],
  banarasi: ['banaras', 'varanasi', 'benarasi', 'benaras', 'brocade'],
  viscose: ['viscose saree', 'viscose sarees', 'viscos'],
  fancy: ['fancysarees', 'fanci', 'designer'],
  checks: ['check', 'checked', 'checks pedding', 'checks pending'],
  pedding: ['pending', 'checks pending'],
  pending: ['pedding', 'checks pedding'],
  zari: ['jari', 'gold zari', 'antique zari'],
  crush: ['crushed', 'crush silk'],
  wedding: ['bridal', 'festive', 'traditional', 'marriage'],
  bridal: ['wedding', 'traditional', 'heavy'],
  kurta: ['kurti', 'kurtha', 'kurtas', 'kurtis'],
  kurti: ['kurta', 'kurtha', 'kurtas', 'kurtis'],
  lehenga: ['lahenga', 'choli', 'ghagra'],
  gown: ['dress', 'maxi', 'gowns'],
};

// Conversational stop words to remove
const STOP_WORDS = new Set([
  'show', 'me', 'i', 'need', 'want', 'looking', 'for', 'find', 'suggest',
  'something', 'similar', 'to', 'this', 'style', 'outfits', 'wear', 'a', 'an', 'the'
]);

// Normalize strings for uniform comparisons
function normalize(str: string | undefined | null): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(str: string | undefined | null): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Tokenize text into clean search tokens
function tokenize(text: string | undefined | null): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w));
}

// Levenshtein distance for typo tolerance
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

// --- REAL-TIME HYBRID SEARCH ENGINE ---
class RealtimeSearchEngine {
  private products: Product[] = [];
  private productMap: Map<string, Product> = new Map();

  public setProducts(products: Product[]) {
    this.products = products;
    this.productMap.clear();
    for (const p of products) {
      this.productMap.set(p.id, p);
    }
  }

  public addProducts(products: Product[]) {
    let hasNew = false;
    for (const p of products) {
      if (!this.productMap.has(p.id)) {
        this.productMap.set(p.id, p);
        this.products.push(p);
        hasNew = true;
      }
    }
    if (hasNew) {
      this.products = Array.from(this.productMap.values());
    }
  }

  public search(query: string): Product[] {
    const rawQuery = (query || '').trim();
    if (!rawQuery) return [];

    const queryLower = rawQuery.toLowerCase();
    const queryNorm = normalize(rawQuery);
    const queryKey = normalizeKey(rawQuery);
    const queryTokens = tokenize(rawQuery);

    if (queryTokens.length === 0 && queryKey.length === 0) return [];

    const scored: { product: Product; score: number }[] = [];

    // Is the user simply searching for "saree" / "sarees"?
    const isGenericSareeQuery = queryKey === 'saree' || queryKey === 'sarees' || queryKey === 'sari';

    for (const p of this.products) {
      let score = 0;

      const name = normalize(p.name);
      const nameKey = normalizeKey(p.name);

      const material = normalize(p.material_type || p.material || p.specifications?.material);
      const materialKey = normalizeKey(p.material_type || p.material || p.specifications?.material);

      const category = normalize(p.category);
      const categoryKey = normalizeKey(p.category);

      const desc = normalize(p.description);

      const colorList = Array.isArray(p.colors) ? p.colors.join(' ') : (p.color || '');
      const colorSpec = p.specifications?.color || '';
      const allColors = normalize(`${colorList} ${colorSpec}`);

      const pattern = normalize(p.pattern || p.specifications?.pattern || p.specifications?.design);
      const occasion = normalize(p.occasion || p.specifications?.occasion);
      const priceStr = String(Math.round(p.price || 0));

      // ── Special Universal Case: "saree" / "sarees" ──
      if (isGenericSareeQuery) {
        if (categoryKey.includes('saree') || nameKey.includes('saree') || materialKey.includes('saree')) {
          score += 50;
        }
      } else {
        // ── 1. Full Phrase Exact & Substring Matches ──
        if (nameKey === queryKey) score += 60;
        else if (name.includes(queryNorm)) score += 35;
        else if (nameKey.includes(queryKey)) score += 25;

        if (materialKey === queryKey) score += 55;
        else if (material.includes(queryNorm)) score += 30;
        else if (materialKey.includes(queryKey)) score += 22;

        if (category.includes(queryNorm)) score += 15;
        if (allColors.includes(queryNorm)) score += 15;
        if (pattern.includes(queryNorm)) score += 12;
        if (occasion.includes(queryNorm)) score += 10;
        if (desc.includes(queryNorm)) score += 8;

        // ── 2. Token-by-Token Matching (Prefixes, Synonyms, Typos) ──
        let matchedTokensCount = 0;

        for (const token of queryTokens) {
          let tokenMatched = false;
          let tokenScore = 0;

          // Expand token synonyms
          const syns = SYNONYMS[token] || [];
          const tokenVariants = [token, ...syns];

          for (const variant of tokenVariants) {
            const vKey = normalizeKey(variant);

            // Match in Name
            if (name.split(/\s+/).includes(variant)) {
              tokenScore = Math.max(tokenScore, 18);
              tokenMatched = true;
            } else if (nameKey.includes(vKey)) {
              tokenScore = Math.max(tokenScore, 10);
              tokenMatched = true;
            }

            // Match in Material
            if (material.split(/\s+/).includes(variant)) {
              tokenScore = Math.max(tokenScore, 16);
              tokenMatched = true;
            } else if (materialKey.includes(vKey)) {
              tokenScore = Math.max(tokenScore, 11);
              tokenMatched = true;
            }

            // Match in Category
            if (category.includes(variant) || categoryKey.includes(vKey)) {
              tokenScore = Math.max(tokenScore, 8);
              tokenMatched = true;
            }

            // Match in Color
            if (allColors.includes(variant)) {
              tokenScore = Math.max(tokenScore, 8);
              tokenMatched = true;
            }

            // Match in Pattern / Design / Occasion
            if (pattern.includes(variant) || occasion.includes(variant)) {
              tokenScore = Math.max(tokenScore, 6);
              tokenMatched = true;
            }

            // Match in Description
            if (desc.includes(variant)) {
              tokenScore = Math.max(tokenScore, 3);
              tokenMatched = true;
            }

            // Match in Price (e.g. searching "699", "949")
            if (priceStr === variant || priceStr.startsWith(variant)) {
              tokenScore = Math.max(tokenScore, 10);
              tokenMatched = true;
            }
          }

          // ── Typo tolerance (Levenshtein) if no exact match ──
          if (!tokenMatched && token.length >= 4) {
            const wordsToCompare = [...name.split(/\s+/), ...material.split(/\s+/)];
            for (const word of wordsToCompare) {
              if (word.length >= 4 && Math.abs(word.length - token.length) <= 2) {
                const dist = levenshtein(token, word);
                if ((token.length <= 5 && dist === 1) || (token.length > 5 && dist <= 2)) {
                  tokenScore = Math.max(tokenScore, 7);
                  tokenMatched = true;
                  break;
                }
              }
            }
          }

          if (tokenMatched) {
            matchedTokensCount++;
            score += tokenScore;
          }
        }

        // Complete query coverage bonus: all tokens matched
        if (queryTokens.length > 1 && matchedTokensCount === queryTokens.length) {
          score += 25;
        }
      }

      if (score > 0) {
        scored.push({ product: p, score });
      }
    }

    // Sort by relevance score descending, then rating and recency
    scored.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.1) {
        return (b.product.rating || 0) - (a.product.rating || 0);
      }
      return b.score - a.score;
    });

    return scored.map(item => item.product);
  }
}

// Global Singleton Engine
let searchEngineInstance: RealtimeSearchEngine | null = null;

export function initializeSearchEngine(products: Product[]) {
  if (!searchEngineInstance) {
    searchEngineInstance = new RealtimeSearchEngine();
  }
  searchEngineInstance.setProducts(products);
}

export function intelligentSearch(query: string, allProducts: Product[]): Product[] {
  if (!searchEngineInstance) {
    searchEngineInstance = new RealtimeSearchEngine();
  }
  // Keep engine products up-to-date
  searchEngineInstance.setProducts(allProducts);
  return searchEngineInstance.search(query);
}

// Fallback recommendations if zero results found
export function getRecommendedFallback(allProducts: Product[], limit: number = 4): Product[] {
  const sorted = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return sorted.slice(0, limit);
}

// Generate intelligent search suggestions (autocomplete)
export function getSearchSuggestions(query: string, allProducts: Product[]): string[] {
  if (!query || query.trim().length < 2) return [];
  const results = intelligentSearch(query, allProducts);
  if (results.length === 0) return [];

  const suggestions = new Set<string>();
  const queryLower = query.toLowerCase().trim();

  // Curated popular categories / material aliases
  const POPULAR_THEMES = [
    'Kanchi Cotton Sarees',
    'Checks Pending Fancy Sarees',
    'Fancy Sarees',
    'Viscose Sarees',
    'Banarasi Silk Sarees',
    'Crush Silk Sarees',
    'Gold Zari Sarees',
    'Wedding Sarees'
  ];

  for (const theme of POPULAR_THEMES) {
    if (theme.toLowerCase().includes(queryLower)) {
      suggestions.add(theme);
    }
  }

  // Extract combinations from the top 12 results
  for (const product of results.slice(0, 12)) {
    const category = (product.category || 'Sarees').trim();
    const material = (product.material_type || product.material || '').trim();
    const name = product.name.trim();

    if (material && !suggestions.has(material)) {
      suggestions.add(material);
      if (!material.toLowerCase().includes('saree')) {
        suggestions.add(`${material} Sarees`);
      }
    }

    if (name.toLowerCase().includes(queryLower) && name.length <= 40) {
      suggestions.add(name);
    }
  }

  return Array.from(suggestions).slice(0, 5);
}
