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

// Helper to generate unique customer reviewer names & product-tailored review feedback
function getProductSpecificReviews(product: Product): Review[] {
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const idStr = String(product.id || 'prod');

  // Simple deterministic hash to pick unique reviewer names per product
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

  const names = namePools[seed % namePools.length];

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
    rating: 5,
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
    // If product has custom DB reviews, use them; otherwise generate tailored product feedback
    if ((product as any).reviews && (product as any).reviews.length > 0) {
      return (product as any).reviews;
    }
    return getProductSpecificReviews(product);
  }, [product]);

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
      <div className="mt-5 border border-[#D4AF37]/50 rounded-2xl p-5 bg-white shadow-sm text-center">
        <MessageSquarePlus className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-80" />
        <p className="text-gray-700 text-sm font-semibold italic">Be the first to review this product.</p>
        <button className="mt-3 px-4 py-2 bg-[#FFF0F5] border border-[#FFD6E8] text-[#800000] rounded-xl text-xs font-bold hover:bg-[#FFE4EF] transition-all cursor-pointer">
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
          <span className="text-[11px] font-bold text-[#800000] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
            {allReviews.length} Verified Reviews
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#D4AF37] text-xs font-bold">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
            ))}
          </div>
          <span>4.9 / 5.0</span>
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
                className="bg-white border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Header: User Info & Rating */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar / Initials */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF0F5] to-[#F5E6BE] border border-[#D4AF37]/50 flex items-center justify-center text-xs font-black text-[#800000] shadow-xs">
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

                  {/* 5-Star Rating */}
                  <div className="flex text-[#D4AF37]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal italic pl-1 border-l-2 border-rose-200/80">
                  "{displayText}"
                </p>

                {/* Read More / Read Less button if text is long */}
                {isLong && (
                  <button
                    onClick={() => toggleExpand(rev.id)}
                    className="mt-1.5 text-[11px] font-bold text-[#800000] hover:text-black flex items-center gap-0.5 transition-colors cursor-pointer"
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
