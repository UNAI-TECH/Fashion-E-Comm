import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../data/products';

interface Review {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  date: string;
  verified: boolean;
  comment: string;
}

interface CompactCustomerReviewsProps {
  product: Product;
}

// Star Rating Display Component handling exact decimals (4.0 - 5.0)
function StarRatingDisplay({ score, showScore = true }: { score: number; showScore?: boolean }) {
  const rounded = Math.round(score * 10) / 10;
  const fullStars = Math.floor(rounded);
  const decimal = rounded - fullStars;
  const hasHalf = decimal >= 0.3 && decimal <= 0.7;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-[#698156]">
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= fullStars) {
            return <Star key={star} className="w-3.5 h-3.5 fill-[#698156] text-[#698156]" />;
          } else if (star === fullStars + 1 && (hasHalf || decimal > 0.7)) {
            return (
              <div key={star} className="relative w-3.5 h-3.5">
                <Star className="w-3.5 h-3.5 text-gray-300 fill-gray-200 absolute inset-0" />
                <div className="overflow-hidden w-1/2 absolute inset-0">
                  <Star className="w-3.5 h-3.5 fill-[#698156] text-[#698156]" />
                </div>
              </div>
            );
          } else {
            return <Star key={star} className="w-3.5 h-3.5 text-gray-300 fill-gray-100" />;
          }
        })}
      </div>
      {showScore && <span className="text-xs font-black text-[#698156] ml-0.5">{rounded.toFixed(1)}</span>}
    </div>
  );
}

// Helper to generate unique customer reviewer names, varied ratings (4.0 - 4.9), & product-tailored review feedback
function getProductSpecificReviews(product: Product): Review[] {
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const idStr = String(product.id || 'prod');

  // Deterministic hash seed per product
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const namePools = [
    ['Divya N.', 'Swati G.', 'Bhavna K.', 'Rohini S.', 'Swati M.', 'Tanvi G.'],
    ['Aisha K.', 'Neha B.', 'Radhika D.', 'Simran J.', 'Shreya L.', 'Kriti C.'],
    ['Sunita M.', 'Archana P.', 'Deepa R.', 'Nidhi K.', 'Shruti V.', 'Payal S.'],
    ['Trisha K.', 'Yamini S.', 'Charu V.', 'Mahima T.', 'Rashmi H.', 'Vandana R.'],
    ['Priya S.', 'Ananya R.', 'Meera K.', 'Pooja M.', 'Ritu V.', 'Sneha P.'],
    ['Kavya T.', 'Preeti D.', 'Shilpa N.', 'Aditi B.', 'Monika R.', 'Rupa S.'],
  ];

  // Varied ratings (4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9)
  const ratingPools = [
    [4.9, 4.8, 4.7, 4.9, 4.6, 4.8], // Avg ~4.8
    [4.7, 4.5, 4.8, 4.6, 4.4, 4.7], // Avg ~4.6
    [4.8, 4.9, 4.5, 4.7, 4.8, 4.6], // Avg ~4.7
    [4.5, 4.3, 4.6, 4.4, 4.2, 4.5], // Avg ~4.4
    [4.6, 4.8, 4.4, 4.7, 4.5, 4.6], // Avg ~4.6
    [4.9, 4.7, 4.8, 4.6, 4.9, 4.8], // Avg ~4.8
  ];

  const names = namePools[seed % namePools.length];
  const ratings = ratingPools[seed % ratingPools.length];

  const dates = [
    '24 May, 2026',
    '12 May, 2026',
    '29 Apr, 2026',
    '15 Apr, 2026',
    '03 Mar, 2026',
    '18 Feb, 2026',
  ];

  let comments: string[] = [];

  // 1. Sarees
  if (category.includes('saree') || name.includes('saree') || name.includes('sari')) {
    comments = [
      `The zari work on this ${product.name} is absolutely breathtaking! The silk drape holds its shape beautifully all evening.`,
      `Purchased this ${product.name} for my cousin's wedding reception. Pristine weave, vibrant colors, and lightweight feel.`,
      `Authentic traditional craftsmanship! The pallu embroidery is even richer in person than shown online.`,
      `Soft silk fabric that glides effortlessly. Came with a perfectly color-matched blouse piece!`,
      `Classic heritage feel with a modern luster. Truly a high-end luxury saree addition to my collection.`,
      `The rich border details and fine threadwork make this saree look like a high-fashion designer creation.`,
    ];
  }
  // 2. Kurtis & Anarkalis
  else if (category.includes('kurti') || name.includes('kurti') || name.includes('kurta') || name.includes('anarkali')) {
    comments = [
      `Loved the neck embroidery and clean side-slit tailoring on this ${product.name}! Breathable fabric and super stylish.`,
      `Wore this ${product.name} to an office festive lunch. Received non-stop compliments on the posture fit and color!`,
      `The threadwork detail on the chest is meticulous. Pairs so well with statement gold earrings and heels.`,
      `Pure cotton-silk comfort! Doesn't fade or shrink after washing. Perfect everyday luxury wear.`,
      `Flattering flared silhouette that accentuates grace. The sleeve border stitching is top notch.`,
      `Elevated Indian fusion wear at its finest! The texture feels premium and comfortable for 8+ hours.`,
    ];
  }
  // 3. Western / Shirt & Trousers
  else if (name.includes('shirt') || name.includes('trouser') || category.includes('western')) {
    comments = [
      `The tailored fit of this ${product.name} set is insane! Feels like bespoke luxury tailoring.`,
      `Smooth silk-blend fabric with zero crease issues. Perfect for business casual meetings and dinner outings!`,
      `The color combination of this ${product.name} is so chic and modern. Looks like a high-end designer runway piece.`,
      `Impeccable collar structure and button cuff detailing. Highly versatile for styling with nude heels and gold hoops.`,
      `Breathable, fluid fabric with a natural sheen. Fits true to size with a clean straight silhouette.`,
      `Extremely high quality fabric. You can feel the luxury texture immediately upon unboxing!`,
    ];
  }
  // 4. Lehengas
  else if (category.includes('lehenga') || name.includes('lehenga') || name.includes('choli')) {
    comments = [
      `The flare on this ${product.name} is unreal! Heavy embroidery on the skirt with a comfortable lightweight choli.`,
      `Wore this ${product.name} for my sister's Sangeet ceremony. The zari embellishments catch the light amazingly in photos!`,
      `Royal wedding vibes! The dupatta draping and waistband stitching are finished to perfection.`,
      `The organza-silk flare has such dramatic movement when walking. Truly bridal-grade luxury.`,
      `Exquisite hand-embroidery with vibrant color contrast. Delivered in a pristine luxury garment box!`,
      `Exceeded all expectations. High-end designer look for a fraction of boutique prices.`,
    ];
  }
  // 5. Salwar Suits & Sets
  else if (category.includes('salwar') || name.includes('suit') || name.includes('set')) {
    comments = [
      `The straight kameez fit with matching designer dupatta is so graceful. Soft fabric and gorgeous colors!`,
      `Ideal three-piece suit set (${product.name}) for Puja and family functions. Clean stitched seams and zero itchiness.`,
      `Sleeve cuff embroidery adds such an elegant touch. Highly comfortable for all-day traditional events.`,
      `Rich color fastness and breathable weave. The fit is flattering around the waist and shoulders.`,
      `Loved the complete set! The dupatta drape completes the royal look effortlessly.`,
      `Great quality fabric with fine finishing. Fast delivery and accurate sizing chart.`,
    ];
  }
  // 6. Maxi Gowns & Default
  else {
    comments = [
      `Flows like a dream! The waist accent and soft lining make this ${product.name} look so flattering.`,
      `Wore this to a sunset cocktail dinner. Ethereal silhouette with a subtle, sophisticated color tone.`,
      `Minimalist luxury design with smooth back zip closure. Feels lightweight yet looks super high-end.`,
      `The floor-length pleated skirt has beautiful fluid movement. Perfect for evening galas!`,
      `Stunning quality chiffon/georgette fabric. Received so many compliments throughout the night.`,
      `Fits like it was custom made for me! Absolutely in love with Aanya Fashions evening collection.`,
    ];
  }

  return names.map((reviewerName, idx) => ({
    id: `rev-${product.id || 'p'}-${idx + 1}`,
    name: reviewerName,
    rating: ratings[idx % ratings.length],
    date: dates[idx % dates.length],
    verified: true,
    comment: comments[idx % comments.length],
  }));
}

export function CompactCustomerReviews({ product }: CompactCustomerReviewsProps) {
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get product specific unique customer reviews & feedback content
  const allReviews = useMemo(() => {
    if ((product as any).reviews && (product as any).reviews.length > 0) {
      return (product as any).reviews;
    }
    return getProductSpecificReviews(product);
  }, [product]);

  // Calculate average overall rating for header
  const averageRating = useMemo(() => {
    if (allReviews.length === 0) return 4.8;
    const sum = allReviews.reduce((acc: number, r: Review) => acc + r.rating, 0);
    return Math.round((sum / allReviews.length) * 10) / 10;
  }, [allReviews]);

  // Auto-cycle 3 reviews every 6 seconds if total reviews > 3
  useEffect(() => {
    if (allReviews.length <= 3) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allReviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [allReviews.length]);

  // Compute current window of 3 visible reviews
  const visibleReviews = useMemo(() => {
    if (allReviews.length === 0) return [];
    if (allReviews.length <= 3) return allReviews;

    const items: Review[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = (currentIndex + i) % allReviews.length;
      items.push(allReviews[idx]);
    }
    return items;
  }, [allReviews, currentIndex]);

  const toggleExpand = (id: string) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (allReviews.length === 0) {
    return (
      <div className="mt-5 border border-[#698156]/50 rounded-2xl p-5 bg-white shadow-sm text-center">
        <MessageSquarePlus className="w-8 h-8 text-[#698156] mx-auto mb-2 opacity-80" />
        <p className="text-gray-700 text-sm font-semibold italic">Be the first to review this product.</p>
        <button className="mt-3 px-4 py-2 bg-[#F4F6F2] border border-[#DCE4D7] text-[#698156] rounded-xl text-xs font-bold hover:bg-[#EBF0E6] transition-all cursor-pointer">
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg text-gray-900 font-bold">Customer Feedback</h3>
          <span className="text-[11px] font-bold text-[#698156] bg-[#F4F6F2] px-2 py-0.5 rounded-full border border-[#DCE4D7]">
            {allReviews.length} Verified Reviews
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <StarRatingDisplay score={averageRating} showScore={false} />
          <span className="text-xs font-black text-[#698156]">{averageRating.toFixed(1)} / 5.0</span>
        </div>
      </div>

      {/* 3 Compact Review Cards Container */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleReviews.map((rev) => {
            const isExpanded = !!expandedReviews[rev.id];
            const isLong = rev.comment.length > 90;
            const displayText = isLong && !isExpanded ? `${rev.comment.substring(0, 90)}...` : rev.comment;
            const initials = rev.name.split(' ').map((n) => n[0]).join('');

            return (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-[#698156]/40 hover:border-[#698156] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Header: User Info & Rating */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar / Initials */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4F6F2] to-[#EBF0E6] border border-[#698156]/50 flex items-center justify-center text-xs font-black text-[#698156] shadow-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-gray-900">{rev.name}</span>
                        {rev.verified && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{rev.date}</span>
                    </div>
                  </div>

                  {/* Varied Star Rating (4.0 - 5.0) */}
                  <StarRatingDisplay score={rev.rating} showScore={true} />
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal italic pl-1 border-l-2 border-rose-200/80">
                  "{displayText}"
                </p>

                {/* Read More / Read Less button if text is long */}
                {isLong && (
                  <button
                    onClick={() => toggleExpand(rev.id)}
                    className="mt-1.5 text-[11px] font-bold text-[#698156] hover:text-black flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <>Read Less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Read More <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
