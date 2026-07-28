import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Sparkles, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const images = [
    { src: '/model_1.png', label: 'Blue Saree', outfit: 'Saree' },
    { src: '/model_4.png', label: 'Peach Kurti', outfit: 'Kurti Set' },
    { src: '/model_2.png', label: 'Fusion Highlight', outfit: 'Indo-Western Fusion' },
    { src: '/model_5.png', label: 'Pink Dress', outfit: 'Party Wear' },
    { src: '/model_3.png', label: 'Soft Tones', outfit: 'Traditional Wear' },
  ];

  const [activeIndex, setActiveIndex] = useState(2);

  // Auto-rotating carousel effect (3.5 seconds cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#FFFDF9] via-[#FFF6EE] to-[#FFF0F5] py-10 lg:py-14 select-none border-b border-rose-100/60">
      
      {/* Background 3D Curved Panels & Golden Halo Rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft 3D Curved Light Glow */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[450px] h-[450px] lg:w-[650px] lg:h-[650px] rounded-full bg-gradient-to-br from-[#F5E6BE]/40 via-[#D4AF37]/20 to-transparent blur-3xl" />
        
        {/* Golden Rings behind Center Model */}
        <div className="absolute top-1/2 right-[18%] -translate-y-1/2 w-[320px] h-[320px] lg:w-[480px] lg:h-[480px] rounded-full border-2 border-[#D4AF37]/30 border-dashed animate-[spin_45s_linear_infinite]" />
        <div className="absolute top-1/2 right-[18%] -translate-y-1/2 w-[240px] h-[240px] lg:w-[360px] lg:h-[360px] rounded-full border border-[#800000]/15" />

        {/* Decorative Gold Leaf accents */}
        <div className="absolute top-6 left-8 opacity-30 text-[#D4AF37] text-3xl font-serif">✦</div>
        <div className="absolute bottom-10 right-10 opacity-30 text-[#D4AF37] text-4xl font-serif">✦</div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[460px] lg:min-h-[520px]">

          {/* ════════ LEFT SIDE (Content Section) ════════ */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left space-y-6 pt-2 lg:pt-0">
            
            {/* Tag / Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] border border-rose-200 text-[#800000] text-xs font-black tracking-widest uppercase w-max shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Aanya Fashions Exclusive</span>
            </motion.div>

            {/* Bold Serif Heading + Gold Underline Accent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-3"
            >
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.08] tracking-tight">
                choose your <br />
                <span className="italic text-[#800000]">style</span> ✨
              </h1>
              
              {/* Thin Gold Underline Accent */}
              <div className="w-28 h-1 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-transparent rounded-full mt-2" />
            </motion.div>

            {/* Supporting Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-md font-normal"
            >
              Discover timeless sarees, kurtis & ethnic wear crafted for every celebration.
            </motion.p>

            {/* Gold Gradient "Shop Now" Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pt-2"
            >
              <Link to="/category/all">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 12px 25px rgba(212,175,55,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] text-gray-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-md hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer border border-[#D4AF37]/50"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* ════════ RIGHT SIDE (5-Model Auto-Rotating Carousel) ════════ */}
          <div className="lg:col-span-7 relative h-[360px] sm:h-[420px] lg:h-[480px] w-full flex items-end justify-center overflow-visible">
            
            {/* Carousel Container */}
            <div className="relative w-full h-full flex items-end justify-center overflow-visible pb-2">
              {images.map((model, idx) => {
                const half = Math.floor(images.length / 2);
                const offset = ((idx - activeIndex + half) % images.length + images.length) % images.length - half;
                const absOffset = Math.abs(offset);
                const isCenter = offset === 0;

                // Scale, Opacity, Z-Index & Translation per position in semi-circle
                const scale = isCenter ? 1.15 : absOffset === 1 ? 0.88 : 0.7;
                const opacity = isCenter ? 1 : absOffset === 1 ? 0.85 : 0.55;
                const zIndex = 30 - absOffset * 10;
                const blurPx = isCenter ? 0 : absOffset * 1.5;

                // Horizontal position spread
                const xVal = `calc(${offset * 18}vw - 50%)`;

                return (
                  <motion.div
                    key={idx}
                    style={{
                      zIndex,
                      left: '50%',
                      transformOrigin: 'bottom center',
                      cursor: 'pointer',
                    }}
                    animate={{
                      x: xVal,
                      scale,
                      opacity,
                      filter: `blur(${blurPx}px)`,
                    }}
                    transition={{
                      duration: 0.7,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    onClick={() => setActiveIndex(idx)}
                    className="absolute bottom-0 h-full w-[240px] sm:w-[280px] lg:w-[320px] flex items-end justify-center select-none"
                  >
                    {/* Floating Center Animation */}
                    <motion.div
                      animate={isCenter ? { y: [0, -8, 0] } : { y: 0 }}
                      transition={
                        isCenter
                          ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
                          : { duration: 0 }
                      }
                      className="w-full h-full flex items-end justify-center relative"
                    >
                      {/* Model Image */}
                      <img
                        src={model.src}
                        alt={model.label}
                        className={`w-auto max-h-[92%] object-contain object-bottom pointer-events-none transition-all ${
                          isCenter
                            ? 'drop-shadow-[0_20px_35px_rgba(128,0,0,0.22)]'
                            : 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]'
                        }`}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Indicators */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
              {images.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setActiveIndex(dotIdx)}
                  className={`transition-all rounded-full ${
                    activeIndex === dotIdx
                      ? 'w-6 h-2 bg-[#800000]'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
