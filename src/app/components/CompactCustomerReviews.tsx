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

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Priya S.',
    rating: 5,
    date: '14 May, 2026',
    verified: true,
    comment: 'This dress is so soft and comfortable. Perfect for all-day wear!',
  },
  {
    id: 'rev-2',
    name: 'Ananya R.',
    rating: 5,
    date: '28 Apr, 2026',
    verified: true,
    comment: 'Beautiful quality and exactly as shown in the pictures. The stitching details are flawless.',
  },
  {
    id: 'rev-3',
    name: 'Meera K.',
    rating: 5,
    date: '10 Apr, 2026',
    verified: true,
    comment: 'Elegant design with premium fabric. Highly recommended for weddings and festive wear!',
  },
  {
    id: 'rev-4',
    name: 'Pooja M.',
    rating: 5,
    date: '02 Mar, 2026',
    verified: true,
    comment: 'Stunning craftsmanship and gorgeous drape! Received endless compliments at the family event.',
  },
  {
    id: 'rev-5',
    name: 'Ritu V.',
    rating: 5,
    date: '18 Feb, 2026',
    verified: true,
    comment: 'Fabric feels so luxurious against the skin. Super fast delivery and immaculate packaging!',
  },
  {
    id: 'rev-6',
    name: 'Sneha P.',
    rating: 5,
    date: '05 Jan, 2026',
    verified: true,
    comment: 'Impeccable fitting and rich vibrant colors. Aanya Fashions never disappoints in luxury quality!',
  },
];

export function CompactCustomerReviews({ product }: CompactCustomerReviewsProps) {
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get product specific or fallback reviews
  const allReviews = useMemo(() => {
    // If product has custom reviews array, use it; otherwise use DEFAULT_REVIEWS
    const list = (product as any).reviews && (product as any).reviews.length > 0
      ? (product as any).reviews
      : DEFAULT_REVIEWS;
    return list;
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
        <button className="mt-3 px-4 py-2 bg-[#FFF0F5] border border-[#FFD6E8] text-[#800000] rounded-xl text-xs font-bold hover:bg-[#FFE4EF] transition-all">
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
          <h3 className="font-serif text-lg text-gray-900 font-bold">Customer Reviews</h3>
          <span className="text-[11px] font-bold text-[#800000] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
            {allReviews.length} Verified
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
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
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
