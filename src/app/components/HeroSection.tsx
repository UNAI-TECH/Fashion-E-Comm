import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, Award } from 'lucide-react';

export function HeroSection() {
  const womenModels = [
    {
      id: 1,
      image: '/model_1.png',
      title: 'Royal Silk Sarees',
      subtitle: 'Handcrafted Heritage Wears',
    },
    {
      id: 2,
      image: '/model_2.png',
      title: 'Designer Lehengas',
      subtitle: 'Opulent Bridal & Festive Elegance',
    },
    {
      id: 3,
      image: '/model_3.png',
      title: 'Embroidered Kurtis',
      subtitle: 'Everyday Grace & Comfort',
    },
    {
      id: 4,
      image: '/model_4.png',
      title: 'Western Coordinates',
      subtitle: 'Modern Silk Shirts & Tailored Trousers',
    },
    {
      id: 5,
      image: '/model_5.png',
      title: 'Chic Fusion Sets',
      subtitle: 'Timeless Contemporary Style',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate women fashion models on the right side every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % womenModels.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [womenModels.length]);

  return (
    <section className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] bg-gradient-to-r from-[#FFF0F5] via-white to-[#FFF9F0] overflow-hidden select-none flex items-center py-6 sm:py-8">
      {/* Subtle luxury background elements */}
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] bg-gradient-to-bl from-rose-200/30 via-amber-100/20 to-transparent rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full filter blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ════════ LEFT SIDE: WORDS, HEADLINE & FLOW ════════ */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left pt-2 sm:pt-4">
            
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/40 shadow-sm text-xs font-black tracking-widest uppercase text-[#800000]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>NEW COLLECTION 2026 • AANYA FASHIONS</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#1A1A1A] leading-[1.15] tracking-tight font-normal"
            >
              Elevate Your Style With <br className="hidden sm:inline" />
              <span className="text-[#800000] italic font-serif font-bold">Royal Indian Heritage</span>
            </motion.h1>

            {/* Subtitle / Words */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
            >
              Discover handcrafted Sarees, designer Kurtis, luxury Lehengas, and chic Western coordinates. Curated with pristine craftsmanship and rich heritage drapes for every occasion.
            </motion.p>

            {/* Action Buttons Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2"
            >
              <a
                href="#trending"
                className="px-7 py-3.5 bg-[#800000] hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="/category/sarees"
                className="px-7 py-3.5 bg-white hover:bg-rose-50 text-[#800000] border-2 border-[#D4AF37]/60 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow transition-all cursor-pointer"
              >
                Shop Sarees
              </a>
            </motion.div>

            {/* Feature Highlights Flow Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-gray-200/80 max-w-lg mx-auto lg:mx-0 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-900 leading-tight">100% Authentic</span>
                  <span className="text-[9px] text-gray-500 font-medium">Pure Silk & Weaves</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#800000] flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-900 leading-tight">Express Shipping</span>
                  <span className="text-[9px] text-gray-500 font-medium">Fast Doorstep Delivery</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-900 leading-tight">Trusted Brand</span>
                  <span className="text-[9px] text-gray-500 font-medium">Easy Returns</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ════════ RIGHT SIDE: WOMEN FASHION MODELS AUTO-ROTATE ════════ */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] lg:min-h-[480px]">
            
            {/* Golden Circle Backdrop Spotlight */}
            <div className="absolute w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[400px] lg:h-[400px] rounded-full bg-gradient-to-tr from-[#D4AF37]/30 via-rose-100/40 to-amber-200/20 border-2 border-[#D4AF37]/40 shadow-inner flex items-center justify-center" />

            {/* Auto-Rotating Women Model Image */}
            <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] flex items-end justify-center z-10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={womenModels[currentIndex].id}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                  className="w-full h-full flex flex-col items-center justify-end"
                >
                  <img
                    src={womenModels[currentIndex].image}
                    alt={womenModels[currentIndex].title}
                    className="h-full w-auto object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] select-none pointer-events-none"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Model Tag Overlay Badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-100 shadow-md text-center z-20 min-w-[200px]">
                <p className="text-xs font-black text-gray-900 tracking-tight">
                  {womenModels[currentIndex].title}
                </p>
                <p className="text-[10px] font-semibold text-[#800000]">
                  {womenModels[currentIndex].subtitle}
                </p>
              </div>
            </div>

            {/* Auto-rotate Indicator Dots */}
            <div className="flex items-center gap-2 mt-4 z-20">
              {womenModels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'w-7 bg-[#800000]'
                      : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
