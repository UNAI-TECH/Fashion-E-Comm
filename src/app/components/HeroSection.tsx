import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { fetchHeroModels, DEFAULT_HERO_MODELS, HeroModel, getLocalHeroModels, resolveTransparentCutoutUrl } from '../data/heroModels';
import { supabase } from '../../lib/supabase';

export function HeroSection() {
  const [images, setImages] = useState<HeroModel[]>(DEFAULT_HERO_MODELS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Load models from Supabase / localStorage & listen for real-time admin updates
  useEffect(() => {
    let mounted = true;

    const applyModels = (data: HeroModel[], targetIndex?: number) => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        const withCutouts = data.map((m: HeroModel) => ({
          ...m,
          src: resolveTransparentCutoutUrl(m.src),
        }));
        const activeOnly = withCutouts.filter((m: HeroModel) => m.status !== 'Inactive');
        const finalModels = activeOnly.length > 0 ? activeOnly : withCutouts;
        setImages(finalModels);

        if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < finalModels.length) {
          setActiveIndex(targetIndex);
        } else {
          const savedActive = localStorage.getItem('aanya_hero_active_index');
          if (savedActive !== null) {
            const idx = parseInt(savedActive, 10);
            if (!isNaN(idx) && idx >= 0 && idx < finalModels.length) {
              setActiveIndex(idx);
            }
          }
        }
      }
    };

    // 1. Initial quick load from local storage cache
    const cached = getLocalHeroModels();
    if (cached && cached.length > 0) {
      applyModels(cached);
    }

    // 2. Fetch fresh data from Supabase
    fetchHeroModels().then(data => {
      if (mounted && data && data.length > 0) {
        applyModels(data);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail) {
        const models = Array.isArray(e.detail) ? e.detail : e.detail.models;
        const activeIdx = typeof e.detail.activeIndex === 'number' ? e.detail.activeIndex : undefined;
        if (models) applyModels(models, activeIdx);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('aanya_hero_models')) {
        const local = getLocalHeroModels();
        const savedActive = localStorage.getItem('aanya_hero_active_index');
        const activeIdx = savedActive ? parseInt(savedActive, 10) : undefined;
        if (local && local.length > 0) applyModels(local, activeIdx);
      }
    };

    // Instant update when user switches back to storefront tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const local = getLocalHeroModels();
        const savedActive = localStorage.getItem('aanya_hero_active_index');
        const activeIdx = savedActive ? parseInt(savedActive, 10) : undefined;
        if (local && local.length > 0) applyModels(local, activeIdx);
        fetchHeroModels().then(data => {
          if (mounted && data && data.length > 0) applyModels(data);
        });
      }
    };

    // Cross-tab real-time sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('hero_models_channel');
      bc.onmessage = (event) => {
        if (event.data?.models) {
          applyModels(event.data.models, event.data.activeIndex);
        }
      };
    } catch {}

    // Supabase Realtime subscription (broadcast + postgres_changes)
    const realtimeSub = supabase
      .channel('banners_sync')
      .on('broadcast', { event: 'hero_update' }, (payload: any) => {
        if (payload?.payload?.models) {
          applyModels(payload.payload.models, payload.payload.activeIndex);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        fetchHeroModels().then(data => {
          if (mounted && data) applyModels(data);
        });
      })
      .subscribe();

    window.addEventListener('hero-models-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      mounted = false;
      window.removeEventListener('hero-models-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      if (bc) bc.close();
      supabase.removeChannel(realtimeSub);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotating carousel effect (4.5 seconds cycle)
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  const activeModel = images[activeIndex] || images[0] || DEFAULT_HERO_MODELS[0];

  return (
    <section 
      className="relative w-full h-[50vh] min-h-[420px] max-h-[560px] overflow-hidden border-b border-rose-100/60 select-none flex items-end justify-center bg-white"
    >
      {/* Wave Background Image */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-100">
        <img 
          src="/hero_bg_floral_white.png" 
          alt="Floral White Background" 
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Left Side Promotional Text */}
      <div className="absolute hidden sm:flex left-[5%] md:left-[8%] top-[50%] -translate-y-1/2 z-20 flex-col max-w-md lg:max-w-xl pointer-events-auto">
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, color: activeModel?.color || '#1E3A8A' }}
          transition={{ duration: 0.8, delay: 0.1, color: { duration: 0.8, ease: "easeInOut" } }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl font-black italic tracking-tight leading-[1.1] drop-shadow-sm"
        >
          The New Aesthetic.
        </motion.span>

        <motion.span 
          key={`sub-${activeModel?.id || activeIndex}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-gray-900 font-sans text-lg md:text-xl lg:text-2xl font-bold tracking-widest uppercase mt-3 drop-shadow-sm"
        >
          {activeModel?.subtitle || 'Discover Trending Styles'}
        </motion.span>

        {/* Shop This Look CTA Pill */}
        {activeModel?.link && (
          <motion.div
            key={`btn-${activeModel?.id || activeIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex items-center"
          >
            <Link
              to={activeModel.link}
              className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-white font-sans text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: activeModel?.color || '#EC4899' }}
            >
              <span>Shop This Look</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}
      </div>
      
      {/* 3D Coverflow Carousel */}
      <div
        className="relative z-10 w-full h-full flex items-end justify-center overflow-visible pb-12"
        style={{ perspective: 1200 }}
      >
        {images.map((model, idx) => {
          const half = Math.floor(images.length / 2);
          const offset = ((idx - activeIndex + half) % images.length + images.length) % images.length - half;
          const absOffset = Math.abs(offset);
          const isCenter = offset === 0;

          const scale = (isMobile || isTablet)
            ? (isCenter ? 1.0 : 0.5)
            : (absOffset === 0 ? 1.0 : absOffset === 1 ? 0.82 : 0.6);

          const rotateY = (isMobile || isTablet)
            ? 0
            : (offset === 0 ? 0 : offset < 0 ? 22 : -22);

          const zIndex = 30 - absOffset * 10;

          // Only 3 models show up on desktop: center + 1 on left + 1 on right. All other models are hidden (opacity: 0)
          const opacity = (isMobile || isTablet)
            ? (isCenter ? 1.0 : 0)
            : (absOffset === 0 ? 1.0 : absOffset === 1 ? 0.88 : 0);

          const blurPx = (isMobile || isTablet) ? 0 : absOffset === 0 ? 0 : 0.5;

          const xVal = (isMobile || isTablet)
            ? (isCenter ? 'calc(0vw - 50%)' : `calc(${offset * 100}vw - 50%)`)
            : `calc(${offset * 18}vw - 50%)`;

          return (
            <motion.div
              key={`${model.id}-${idx}`}
              style={{
                zIndex,
                left: isMobile ? '50%' : '75%',
                transformOrigin: 'bottom center',
                cursor: 'pointer',
                willChange: 'transform, opacity',
              }}
              animate={{
                x: xVal,
                scale,
                rotateY,
                opacity,
                filter: `blur(${blurPx}px)`,
              }}
              transition={{
                duration: (isMobile || isTablet) ? 0.4 : 0.6,
                ease: [0.25, 1, 0.5, 1],
              }}
              onClick={() => setActiveIndex(idx)}
              className={`absolute bottom-0 h-[85%] flex items-end justify-center select-none ${
                isMobile ? 'w-[75vw]' : isTablet ? 'w-[45vw]' : 'w-[25vw]'
              } ${((isMobile || isTablet) && !isCenter) || absOffset > 1 ? 'pointer-events-none' : ''}`}
            >
              <motion.div
                animate={isCenter ? { y: [0, -8, 0] } : { y: 0 }}
                transition={
                  isCenter
                    ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0 }
                }
                className="w-full h-full flex items-end justify-center relative group"
                style={{ willChange: isCenter ? 'transform' : 'auto' }}
              >
                {/* Pure Standing Model Cutout - Free-standing on floral canvas without rectangular box or background */}
                <div className="h-full w-full flex items-end justify-center relative pointer-events-none">
                  {/* Floor contact shadow under feet */}
                  <div
                    className="absolute bottom-1 w-32 sm:w-44 h-4 rounded-full blur-md opacity-25"
                    style={{ backgroundColor: model.color || '#000000' }}
                  />
                  <img
                    key={`${model.id}-${model.src}`}
                    src={model.src}
                    alt={model.label}
                    loading="eager"
                    className="h-full w-auto max-h-[100%] max-w-[95%] object-contain object-bottom pointer-events-none transition-all duration-500 drop-shadow-[0_20px_35px_rgba(0,0,0,0.22)]"
                  />
                </div>


              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Coverflow Slot Dots / Direct Jump Controls */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {images.map((m, i) => (
          <button
            key={m.id || i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex
                ? 'w-7 bg-[#EC4899] shadow-sm'
                : 'w-2 bg-gray-400/50 hover:bg-gray-500'
            }`}
            title={`Slot #${i + 1}: ${m.label}`}
          />
        ))}
      </div>
    </section>
  );
}
