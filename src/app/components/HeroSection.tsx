import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function HeroSection() {
  const images = [
    { src: '/model_1.png', label: 'Blue Saree' },
    { src: '/model_4.png', label: 'Peach Kurti' },
    { src: '/model_2.png', label: 'Fusion Highlight' },
    { src: '/model_5.png', label: 'Pink Dress' },
    { src: '/model_3.png', label: 'Soft Tones' },
  ];

  const [activeIndex, setActiveIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section 
      className="relative w-full h-[50vh] min-h-[400px] max-h-[550px] overflow-hidden border-b border-rose-100/60 select-none flex items-end justify-center bg-[#F7F7F7]"
    >
      {/* Background Image - Full Screen */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ 
          backgroundImage: "url('/hero_bg_new.png')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
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
            ? (isCenter ? (isTablet ? 1.0 : 1.4) : 0.5)
            : (absOffset === 0 ? 1.0 : absOffset === 1 ? 0.82 : 0.67);

          const rotateY = (isMobile || isTablet)
            ? 0
            : (offset === 0 ? 0 : offset < 0 ? 25 : -25);

          const zIndex = 30 - absOffset * 10;

          const opacity = (isMobile || isTablet)
            ? (isCenter ? 1.0 : 0)
            : (absOffset === 0 ? 1.0 : absOffset === 1 ? 0.85 : 0.55);

          const blurPx = (isMobile || isTablet) ? 0 : absOffset * 1.5;

          const xVal = (isMobile || isTablet)
            ? (isCenter ? 'calc(0vw - 50%)' : `calc(${offset * 100}vw - 50%)`)
            : `calc(${offset * 18}vw - 50%)`;

          return (
            <motion.div
              key={idx}
              style={{
                zIndex,
                left: '50%',
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
                duration: (isMobile || isTablet) ? 0.4 : 0.7,
                ease: [0.25, 1, 0.5, 1],
              }}
              onClick={() => setActiveIndex(idx)}
              className={`absolute bottom-0 h-[85%] flex items-end justify-center select-none ${
                isMobile ? 'w-[75vw]' : isTablet ? 'w-[45vw]' : 'w-[25vw]'
              } ${(isMobile || isTablet) && !isCenter ? 'pointer-events-none' : ''}`}
            >
              <motion.div
                animate={isCenter ? { y: [0, -8, 0] } : { y: 0 }}
                transition={
                  isCenter
                    ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0 }
                }
                className="w-full h-full flex items-end justify-center relative"
                style={{ willChange: isCenter ? 'transform' : 'auto' }}
              >
                {/* Model Image */}
                <img
                  src={model.src}
                  alt={model.label}
                  loading="eager"
                  className={`w-auto h-full max-h-[100%] object-contain object-bottom pointer-events-none transition-all drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)]`}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
