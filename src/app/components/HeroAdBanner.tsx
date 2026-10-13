import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw, Sparkles, Tag } from 'lucide-react';
import { AdBanner, fetchActiveBanners, getLocalBanners, DEFAULT_AD_BANNERS } from '../data/banners';
import { supabase } from '../../lib/supabase';

export function HeroAdBanner() {
  const [banners, setBanners] = useState<AdBanner[]>(() => getLocalBanners().filter(b => b.status === 'Active'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Sync banners from Supabase / localStorage / BroadcastChannel
  useEffect(() => {
    let mounted = true;

    const applyBanners = (list: AdBanner[]) => {
      if (!mounted) return;
      const active = list.filter(b => b.status === 'Active');
      if (active.length > 0) {
        setBanners(active);
        setCurrentIndex(prev => (prev >= active.length ? 0 : prev));
      }
    };

    // 1. Initial quick load
    const cached = getLocalBanners();
    applyBanners(cached);

    // 2. Fresh fetch from Supabase
    fetchActiveBanners().then(data => {
      if (mounted && data && data.length > 0) {
        applyBanners(data);
      }
    });

    // 3. Listen for local events & storage
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        applyBanners(e.detail);
      } else {
        applyBanners(getLocalBanners());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'aanya_ad_banners') {
        applyBanners(getLocalBanners());
      }
    };

    // 4. Cross-tab sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('banners_broadcast_channel');
      bc.onmessage = (event) => {
        if (event.data?.banners) {
          applyBanners(event.data.banners);
        }
      };
    } catch {}

    // 5. Supabase Realtime subscription
    const channel = supabase
      .channel('banners_storefront_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        fetchActiveBanners().then(data => {
          if (mounted && data) applyBanners(data);
        });
      })
      .subscribe();

    window.addEventListener('ad-banners-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener('ad-banners-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      supabase.removeChannel(channel);
    };
  }, []);

  // Safe fallback if banners empty
  const activeBanners = banners.length > 0 ? banners : DEFAULT_AD_BANNERS;

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, activeBanners.length]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  return (
    <div className="w-full bg-[#FCFAF8] select-none">
      {/* ─── Top Festive Promo Offer Strip (Myntra style) ─── */}
      <div className="w-full bg-gradient-to-r from-[#831843] via-[#9F1239] to-[#831843] text-white py-2 px-3 overflow-hidden shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[11px] sm:text-xs font-semibold tracking-wide">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              FESTIVE OFFER
            </span>
            <span>FLAT ₹300 OFF ON 1ST ORDER • USE CODE: <strong>FIRST300</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-white/90">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-300" /> Free Shipping Across India
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-300" /> Authentic Saree Weaves
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Hero Ad Banner (Meesho & Myntra Style) ─── */}
      <section
        className="relative w-full overflow-hidden bg-gray-950 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Banner Aspect Ratio Container */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[24/8] max-h-[580px] min-h-[220px] sm:min-h-[300px] md:min-h-[380px] lg:min-h-[440px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id || currentIndex}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full cursor-pointer"
            >
              <Link
                to={currentBanner.link_url || '/category/sarees'}
                className="block w-full h-full relative"
              >
                <img
                  src={currentBanner.image_url}
                  alt={currentBanner.title || 'Festive Saree Sale Banner'}
                  className="w-full h-full object-cover object-center select-none"
                  loading="eager"
                  draggable={false}
                />

                {/* Subtle gradient vignette to blend into high-end theme */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Left Arrow Navigation Button */}
          {activeBanners.length > 1 && (
            <button
              onClick={handlePrev}
              aria-label="Previous Banner"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Right Arrow Navigation Button */}
          {activeBanners.length > 1 && (
            <button
              onClick={handleNext}
              aria-label="Next Banner"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Carousel Pagination Dots (Myntra & Meesho style) */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md">
              {activeBanners.map((banner, idx) => (
                <button
                  key={banner.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full h-1.5 sm:h-2 ${
                    currentIndex === idx
                      ? 'w-6 sm:w-8 bg-white shadow-xs'
                      : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Meesho-Style Trust & Value Proposition Bar ─── */}
      <div className="w-full bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:divide-x md:divide-gray-100">
            {/* 1. Free Delivery */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="text-xs sm:text-sm font-bold text-gray-900">Free Delivery</p>
                <p className="text-[10px] sm:text-xs text-gray-500">All India shipping on sarees</p>
              </div>
            </div>

            {/* 2. Cash on Delivery */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="text-xs sm:text-sm font-bold text-gray-900">Cash on Delivery</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Pay securely at your doorstep</p>
              </div>
            </div>

            {/* 3. 7 Days Easy Return */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="text-xs sm:text-sm font-bold text-gray-900">7 Days Easy Return</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Hassle-free doorstep pickup</p>
              </div>
            </div>

            {/* 4. Lowest Price & Authentic Saree */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="text-xs sm:text-sm font-bold text-gray-900">Lowest Prices</p>
                <p className="text-[10px] sm:text-xs text-gray-500">100% Pure silk & zari weaves</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
