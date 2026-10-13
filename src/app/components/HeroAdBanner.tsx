import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw, Sparkles, Tag, ArrowRight } from 'lucide-react';
import {
  AdBanner,
  fetchActiveBanners,
  getLocalBanners,
  getBannersChannel,
  getSupabaseBannersChannel,
  DEFAULT_AD_BANNERS,
} from '../data/banners';
import { supabase } from '../../lib/supabase';

export function HeroAdBanner() {
  const [banners, setBanners] = useState<AdBanner[]>(() => {
    const local = getLocalBanners();
    return local.filter(b => b.status === 'Active');
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Sync banners from Supabase / localStorage / BroadcastChannel in real-time
  useEffect(() => {
    let mounted = true;

    const applyBanners = (list: AdBanner[]) => {
      if (!mounted) return;
      const active = (list || []).filter(b => b.status === 'Active');
      setBanners(active);
      setCurrentIndex(prev => (active.length > 0 && prev >= active.length ? 0 : prev));
    };

    // 1. Initial quick load from local cache
    const cached = getLocalBanners();
    applyBanners(cached);

    // 2. Immediate fresh fetch from backend / Supabase
    fetchActiveBanners().then(data => {
      if (mounted && Array.isArray(data)) {
        applyBanners(data);
      }
    });

    // 3. Listen for local window events (fired on same tab)
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        applyBanners(e.detail);
      } else {
        applyBanners(getLocalBanners());
      }
    };

    // 4. Listen for storage events (fired on other tabs in same browser)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'aanya_ad_banners') {
        applyBanners(getLocalBanners());
      }
    };

    // 5. Cross-tab instant sync via persistent BroadcastChannel (0ms latency)
    const bc = getBannersChannel();
    const handleChannelMsg = (event: MessageEvent) => {
      if (event.data?.type === 'BANNERS_UPDATED' && Array.isArray(event.data?.banners)) {
        applyBanners(event.data.banners);
      }
    };
    bc?.addEventListener('message', handleChannelMsg);

    // 6. Supabase Realtime broadcast listener (instant multi-device sync)
    const rt = getSupabaseBannersChannel();
    let rtSub: any = null;
    try {
      rtSub = rt?.on('broadcast', { event: 'banners_updated' }, (payload: any) => {
        if (payload?.payload?.banners && Array.isArray(payload.payload.banners)) {
          applyBanners(payload.payload.banners);
        }
      });
    } catch {}

    // 7. Supabase table postgres_changes fallback
    const dbChannel = supabase
      .channel('banners_postgres_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        fetchActiveBanners().then(data => {
          if (mounted && Array.isArray(data)) applyBanners(data);
        });
      })
      .subscribe();

    // 8. Re-sync whenever user focuses or switches back to storefront tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchActiveBanners().then(data => {
          if (mounted && Array.isArray(data)) applyBanners(data);
        });
      }
    };

    // 9. Periodic background sync every 12 seconds
    const intervalId = setInterval(() => {
      fetchActiveBanners().then(data => {
        if (mounted && Array.isArray(data)) applyBanners(data);
      });
    }, 12000);

    window.addEventListener('ad-banners-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener('ad-banners-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      bc?.removeEventListener('message', handleChannelMsg);
      supabase.removeChannel(dbChannel);
    };
  }, []);

  const activeBanners = banners;

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
      {/* ─── Main Hero Ad Banner (Meesho & Myntra Style) ─── */}
      {activeBanners.length === 0 ? (
        /* Sleek fallback state when all banners are deleted / none active */
        <section className="relative w-full py-16 sm:py-24 bg-gradient-to-r from-[#2A0815] via-[#4A0E2E] to-[#1E0510] text-white flex items-center justify-center px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-gray-900 tracking-wider uppercase">
              Exclusive Saree Collection
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-100">
              Handcrafted Heritage Sarees
            </h2>
            <p className="text-xs sm:text-sm text-pink-100/80 max-w-lg mx-auto">
              Explore authentic Banarasi, Kanchipuram, and organza silk sarees woven with pure zari artistry.
            </p>
            <div className="pt-2">
              <Link
                to="/category/sarees"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all"
              >
                <span>Shop Sarees Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section
          className="relative w-full overflow-hidden bg-gray-950 group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Banner Aspect Ratio Container: 16:9 on mobile, adaptive on desktop to prevent cropping */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] lg:aspect-[16/6.5] max-h-[580px] min-h-[230px] sm:min-h-[320px] md:min-h-[420px] lg:min-h-[480px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner.id || currentIndex}
                initial={{ opacity: 0, scale: 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full cursor-pointer"
              >
                <Link
                  to={currentBanner.link_url || '/category/sarees'}
                  className="block w-full h-full relative"
                >
                  <img
                    src={currentBanner.image_url}
                    alt={currentBanner.title || 'Festive Saree Sale Banner'}
                    className="w-full h-full object-cover object-top select-none"
                    loading="eager"
                    draggable={false}
                  />

                  {/* Subtle vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Left Arrow Navigation Button */}
            {activeBanners.length > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Previous Banner"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Right Arrow Navigation Button */}
            {activeBanners.length > 1 && (
              <button
                onClick={handleNext}
                aria-label="Next Banner"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Carousel Pagination Dots */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
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
      )}

      {/* ─── Meesho-Style Trust & Value Proposition Bar (Desktop & Tablet only) ─── */}
      <div className="hidden md:block w-full bg-white border-b border-gray-100 shadow-xs">
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
