import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cleanReviewComment } from '../../lib/reviews';

interface Testimonial {
  id: string | number;
  name: string;
  city: string;
  review: string;
}

export function Testimonials() {
  const [isPaused, setIsPaused] = useState(false);
  const [activeTestimonials, setActiveTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    async function loadReviews() {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('id, user_name, comment, rating, created_at, user_id')
          .eq('status', 'Approved')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          const mapped: Testimonial[] = data
            .filter((r: any) => r.comment && r.comment.trim().length > 0)
            .map((r: any, idx: number) => ({
              id: r.id || idx + 1,
              name: r.user_name || 'Verified Buyer',
              city: 'Verified Purchase · India',
              review: cleanReviewComment(r.comment),
            }));
          setActiveTestimonials(mapped);
        }
      } catch (err) {
        console.warn('Reviews notice:', err);
      }
    }
    loadReviews();
  }, []);

  if (activeTestimonials.length === 0) {
    return null;
  }

  // Duplicate list to achieve continuous, seamless infinite loop
  const infiniteCards = [...activeTestimonials, ...activeTestimonials];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-[#FCFAF8] to-white relative overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <span className="text-xs font-bold tracking-widest text-[#698156] uppercase">
          Real Customer Feedback
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
          What Our Patrons Say
        </h2>
      </div>

      <div
        className="flex gap-6 overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          className="flex gap-6 shrink-0"
          animate={{ x: isPaused ? 0 : ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: Math.max(30, activeTestimonials.length * 8),
            ease: 'linear',
          }}
        >
          {infiniteCards.map((t, idx) => (
            <div
              key={`${t.id}-${idx}`}
              className="w-80 sm:w-96 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between shrink-0"
            >
              <div>
                <Quote className="w-8 h-8 text-[#698156]/20 mb-3" />
                <p className="text-sm text-gray-700 leading-relaxed italic line-clamp-4">
                  "{t.review}"
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{t.name}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#698156]" />
                    <span>{t.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
