import { Product } from '../app/data/products';

// --- SYNONYMS & NORMALIZATION ---
const SYNONYMS: Record<string, string[]> = {
  gown: ['dress', 'maxi', 'gowns'],
  kurta: ['kurti', 'kurtha', 'kurtas', 'kurtis'],
  kurti: ['kurta', 'kurtha', 'kurtas', 'kurtis'],
  kurtha: ['kurta', 'kurti'],
  ethnic: ['traditional', 'desi'],
  traditional: ['ethnic', 'desi'],
  party: ['evening', 'wedding', 'festive'],
  tshirt: ['tee', 't-shirt'],
  tee: ['tshirt', 't-shirt'],
  lehenga: ['lahenga', 'choli', 'ghagra'],
  lahenga: ['lehenga', 'choli', 'ghagra'],
  saree: ['sari', 'sarees', 'saris'],
  sari: ['saree', 'sarees'],
  sare: ['saree', 'sari'],
  suit: ['salwar', 'set'],
};

// Conversational stop words to remove
const STOP_WORDS = new Set(['show', 'me', 'i', 'need', 'want', 'looking', 'for', 'find', 'suggest', 'something', 'similar', 'to', 'this', 'style', 'outfits', 'wear', 'a', 'an', 'the']);

// --- LEVENSHTEIN DISTANCE ---
function levenshtein(a: string, b: string): number {
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

// --- TOKENIZER ---
function tokenize(text: string | undefined | null): string[] {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // ignore punctuation
    .split(/\s+/) // ignore extra spaces
    .filter(w => w.length > 0 && !STOP_WORDS.has(w));
}

// --- BM25 ENGINE ---
class BM25Engine {
  private invertedIndex: Map<string, Map<string, number>> = new Map(); // term -> productId -> weighted frequency
  private documentLengths: Map<string, number> = new Map(); // productId -> length
  private productMap: Map<string, Product> = new Map(); // productId -> Product
  private docCount = 0;
  private avgDocLength = 0;

  // BM25 Tuning Parameters
  private k1 = 1.2;
  private b = 0.75;

  private getFieldTokens(product: Product) {
    // Ranking Priority Field Weights
    const fields = [
      { text: product.name, weight: 10 },
      { text: product.category, weight: 5 },
      { text: product.color, weight: 3 },
      { text: product.material || '', weight: 3 },
      { text: product.pattern || '', weight: 3 },
      { text: (product.tags || []).join(' '), weight: 2 },
      { text: product.description, weight: 1 },
    ];
    return fields;
  }

  public addProducts(products: Product[]) {
    let totalLength = 0;

    for (const p of products) {
      if (this.productMap.has(p.id)) continue;
      this.productMap.set(p.id, p);
      this.docCount++;

      let docLength = 0;
      const termFreqs = new Map<string, number>();

      const fields = this.getFieldTokens(p);
      for (const field of fields) {
        if (!field.text) continue;
        const tokens = tokenize(field.text);
        
        // Expand synonyms during indexing
        const expandedTokens: string[] = [];
        for (const t of tokens) {
          expandedTokens.push(t);
          if (SYNONYMS[t]) {
            expandedTokens.push(...SYNONYMS[t]);
          }
        }

        for (const t of expandedTokens) {
          termFreqs.set(t, (termFreqs.get(t) || 0) + field.weight);
          docLength += field.weight; // weight acts as frequency multiplier for length
        }
      }

      this.documentLengths.set(p.id, docLength);
      totalLength += docLength;

      for (const [term, freq] of termFreqs.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Map());
        }
        this.invertedIndex.get(term)!.set(p.id, freq);
      }
    }

    if (this.docCount > 0) {
      this.avgDocLength = totalLength / this.docCount;
    }
  }

  private calculateIDF(term: string): number {
    const docFreq = this.invertedIndex.get(term)?.size || 0;
    if (docFreq === 0) return 0;
    // Standard Okapi BM25 IDF
    return Math.log(1 + (this.docCount - docFreq + 0.5) / (docFreq + 0.5));
  }

  private findMatchingTerms(queryToken: string): string[] {
    const matches = new Set<string>();
    
    // 1. Exact match
    if (this.invertedIndex.has(queryToken)) {
      matches.add(queryToken);
    }
    
    // 2. Synonym match
    if (SYNONYMS[queryToken]) {
      for (const syn of SYNONYMS[queryToken]) {
        if (this.invertedIndex.has(syn)) matches.add(syn);
      }
    }

    // 3. Partial / Prefix matching & Fuzzy matching
    for (const indexedTerm of this.invertedIndex.keys()) {
      if (indexedTerm === queryToken) continue;
      
      // Prefix match (typing "dre" matches "dress")
      if (indexedTerm.startsWith(queryToken)) {
        matches.add(indexedTerm);
        continue;
      }
      
      // Fuzzy match (typo tolerance) - only if word is long enough
      if (queryToken.length > 3) {
        const dist = levenshtein(queryToken, indexedTerm);
        // Allow 1 typo for words 4-5 chars, 2 typos for 6+ chars
        if ((queryToken.length <= 5 && dist === 1) || (queryToken.length > 5 && dist <= 2)) {
          matches.add(indexedTerm);
        }
      }
    }

    return Array.from(matches);
  }

  public search(query: string): Product[] {
    if (!query.trim()) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = new Map<string, number>();

    // For each token in query
    for (const qToken of queryTokens) {
      // Find all vocabulary terms that match (exact, fuzzy, prefix, synonym)
      const matchedTerms = this.findMatchingTerms(qToken);
      
      for (const term of matchedTerms) {
        const idf = this.calculateIDF(term);
        const docs = this.invertedIndex.get(term);
        if (!docs) continue;

        for (const [docId, freq] of docs.entries()) {
          const docLength = this.documentLengths.get(docId) || this.avgDocLength;
          const tf = freq;
          
          // BM25 calculation
          const numerator = tf * (this.k1 + 1);
          const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
          const bm25Score = idf * (numerator / denominator);
          
          // Add to total score for this document
          scores.set(docId, (scores.get(docId) || 0) + bm25Score);
        }
      }
    }

    // Sort by score, tie-break by popularity/rating
    const results = Array.from(scores.entries())
      .map(([id, score]) => ({
        product: this.productMap.get(id)!,
        score
      }))
      .filter(item => item.score > 0.05) // Minimum relevance threshold
      .sort((a, b) => {
        // If scores are virtually identical, tie-break
        if (Math.abs(a.score - b.score) < 0.1) {
          return (b.product.rating || 0) - (a.product.rating || 0);
        }
        // Otherwise sort strictly by BM25 relevance score
        return b.score - a.score;
      });

    return results.map(r => r.product);
  }
}

// Global Singleton Engine
let searchEngineInstance: BM25Engine | null = null;

export function initializeSearchEngine(products: Product[]) {
  if (!searchEngineInstance) {
    searchEngineInstance = new BM25Engine();
  }
  // This will incrementally add any new products
  searchEngineInstance.addProducts(products);
}

export function intelligentSearch(query: string, allProducts: Product[]): Product[] {
  // Ensure engine is initialized and has latest products
  initializeSearchEngine(allProducts);
  return searchEngineInstance!.search(query);
}

// Fallback recommendations if zero results found
export function getRecommendedFallback(allProducts: Product[], limit: number = 4): Product[] {
  const sorted = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return sorted.slice(0, limit);
}
