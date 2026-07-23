import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function HeroSection() {
  const images = [
    '/model_1.png',
    '/model_4.png',
    '/model_2.png',
    '/model_5.png',
    '/model_3.png',
  ];

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeIndex, setActiveIndex] = useState(2);

  // Responsive breakpoint check
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

  // Autoplay cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const models = [
    { src: images[0], name: 'Model 1', height: '84%' },
    { src: images[1], name: 'Model 4', height: '84%', className: '-translate-x-[14%]' },
    { src: images[2], name: 'Model 2' },
    { src: images[3], name: 'Model 5' },
    { src: images[4], name: 'Model 3' },
  ];

  return (
    <div
      className="relative w-full h-screen min-h-[600px] flex items-end justify-center overflow-hidden bg-white select-none"
      style={{ contain: 'layout style paint' }}
    >
      {/* Static background — no JS, no state */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero_bg.png')" }}
      />

      {/* Soft golden spotlight — static CSS, no animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        <div
          className={`rounded-full bg-[#D4A62A]/15 ${isMobile ? 'w-[75vw] h-[75vw]' : 'w-[35vw] h-[35vw]'}`}
          style={{ filter: 'blur(70px)' }}
        />
      </div>

      {/* 3D Coverflow Carousel */}
      <div
        className="relative z-10 w-full h-[95vh] flex items-end justify-center overflow-hidden pb-4"
        style={{ perspective: 1200 }}
      >
        {models.map((model, idx) => {
          const half = Math.floor(models.length / 2);
          const offset = ((idx - activeIndex + half) % models.length + models.length) % models.length - half;
          const absOffset = Math.abs(offset);
          const isCenter = offset === 0;

          const scale = (isMobile || isTablet)
            ? (isCenter ? (isTablet ? 1.0 : 1.25) : 0.5)
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
              className={`absolute bottom-0 h-full flex items-end justify-center select-none ${
                isMobile ? 'w-[70vw]' : isTablet ? 'w-[45vw]' : 'w-[25vw]'
              } ${(isMobile || isTablet) && !isCenter ? 'pointer-events-none' : ''}`}
            >
              {/* Gentle float — only center model, single axis */}
              <motion.div
                animate={isCenter ? { y: [0, -8, 0] } : { y: 0 }}
                transition={
                  isCenter
                    ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0 }
                }
                className="w-full h-full flex items-end justify-center"
                style={{ willChange: isCenter ? 'transform' : 'auto' }}
              >
                <img
                  src={model.src}
                  alt={model.name}
                  loading="eager"
                  decoding="async"
                  style={{
                    height: isMobile ? '75%' : isTablet ? '55%' : (model.height || '96%'),
                  }}
                  className={`w-auto object-contain object-bottom pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.08)] ${model.className || ''}`}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
