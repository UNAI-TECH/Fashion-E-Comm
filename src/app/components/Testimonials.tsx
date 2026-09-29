import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Quote, MapPin } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  city: string;
  review: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Pooja Hegde',
    city: 'Bangalore · Karnataka',
    review:
      'Ordered the Golden Kanchipuram silk saree for my sister’s wedding reception. The real gold zari border has such an authentic, rich luster and the pure silk drape stayed flawless throughout the evening. Truly boutique-level craftsmanship!',
  },
  {
    id: 2,
    name: 'Dr. Radhika Sen',
    city: 'Mumbai · Maharashtra',
    review:
      'The fabric quality exceeded every expectation. The Banarasi weave possesses genuine heritage weight without feeling rigid. Delivered in an opulent hard-bound gift box in just 3 days to Mumbai. Absolutely worth every rupee.',
  },
  {
    id: 3,
    name: 'Ananya Deshmukh',
    city: 'Pune · Maharashtra',
    review:
      'Wore this velvet lehenga for my sangeet function and received endless compliments! The zardosi detailing is immaculate, the can-can flare is spectacular, and the fit was bespoke perfection. Felt like modern royalty.',
  },
  {
    id: 4,
    name: 'Meera Krishnan',
    city: 'Chennai · Tamil Nadu',
    review:
      'Buying heirloom sarees online can be tricky, but Aanya Fashions is 100% trustworthy. The color matches the catalog imagery precisely, and the soft georgette falls with such effortless grace. My trusted ethnic store now.',
  },
  {
    id: 5,
    name: 'Sneha Agarwal',
    city: 'Delhi NCR · New Delhi',
    review:
      'Superb tailoring! The neckline embroidery on the Chanderi kurti is exquisitely sharp and comfortable for day-long festive celebrations. The scallop-finished organza dupatta completed the ensemble divinely.',
  },
  {
    id: 6,
    name: 'Rituja Patel',
    city: 'Ahmedabad · Gujarat',
    review:
      'The purple tone is breathtakingly regal in natural sunlight. Crafted with breathable pure cotton-silk, and the flare on the patiala trousers is generous and graceful for dancing. Top-tier customer support too.',
  },
  {
    id: 7,
    name: 'Kavita Reddy',
    city: 'Hyderabad · Telangana',
    review:
      'This marks my third couture order from Aanya Fashions. Their bridal silk collection stands out because the sarees resist wrinkling and photograph with a divine, luminous sheen. Simply peerless in luxury!',
  },
];

export function Testimonials() {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate list to achieve continuous, seamless infinite loop
  const infiniteCards = [...testimonials, ...testimonials];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-[#FCFAF8] to-white relative overflow-hidden">
      {/* Hardware-accelerated continuous infinite auto-glide */}
      <style>{`
        @keyframes autoMarquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .auto-carousel-track {
          display: flex;
          width: max-content;
          animation: autoMarquee 42s linear infinite;
          will-change: transform;
        }
        .auto-carousel-track.paused {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-14"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-3 text-[#1A1A1A] font-bold tracking-tight">
            Loved By Women Across India
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Real customer statements on our weaves, embroidery, and royal wedding collections.
          </p>
        </motion.div>
      </div>

      {/* Auto Carousel Marquee Stage */}
      <div
        className="relative w-full overflow-hidden py-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Soft edge blur vignettes */}
        <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />

        {/* The Running Track */}
        <div className={`auto-carousel-track ${isPaused ? 'paused' : ''}`}>
          {infiniteCards.map((testimonial, idx) => (
            <div
              key={`${testimonial.id}-${idx}`}
              className="relative w-[320px] sm:w-[370px] md:w-[410px] flex-shrink-0 mx-3 sm:mx-4 flex flex-col justify-between bg-gradient-to-b from-[#FFFDFB] via-white to-[#FFF9F6] p-7 sm:p-8 rounded-[2.5rem] rounded-tr-[4.75rem] rounded-bl-[1.5rem] border border-[#D4AF37]/35 shadow-[0_12px_35px_-8px_rgba(128,0,0,0.06)] hover:shadow-[0_22px_50px_-6px_rgba(128,0,0,0.14)] hover:border-[#D4AF37] transition-all duration-500 group select-none overflow-hidden"
            >
              {/* Asymmetric Royal Corner Accent */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-[#D4AF37]/15 via-[#FFF0F5]/40 to-transparent rounded-tr-[4.75rem] pointer-events-none" />
              <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

              {/* Review Statement */}
              <div className="relative my-2 flex-1">
                <Quote className="w-8 h-8 text-[#D4AF37]/35 mb-3 rotate-180" />
                <p className="text-gray-700 text-sm sm:text-[15px] leading-relaxed font-serif italic relative z-10">
                  "{testimonial.review}"
                </p>
              </div>

              {/* Bottom Author Section */}
              <div className="pt-4 border-t border-[#D4AF37]/20 flex flex-col justify-end mt-4">
                <h4 className="font-serif font-bold text-gray-900 text-base leading-tight">
                  {testimonial.name}
                </h4>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#800000]/70 flex-shrink-0" />
                  <span>{testimonial.city}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
