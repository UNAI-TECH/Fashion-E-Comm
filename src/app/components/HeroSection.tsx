import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

// Custom hook to dynamically remove solid black backgrounds from JPEGs and darken model hair on both JPEGs & PNGs
function useProcessedImages(sources: string[]) {
  const [processed, setProcessed] = useState<string[]>(sources);

  useEffect(() => {
    let active = true;

    const processImage = (src: string): Promise<string> => {
      return new Promise((resolve) => {
        const isJpeg = src.endsWith('.jpg') || src.endsWith('.jpeg');
        const isPng = src.endsWith('.png');
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
          if (!active) return;
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          const width = canvas.width;
          const height = canvas.height;

          // Process pixels using spatial logic to separate the hair region from the background
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx+1];
              const b = data[idx+2];
              const maxVal = Math.max(r, g, b);

              // Spatial check: The head/hair region is in the top-center of the image
              const isHairRegion = (y < 0.25 * height) && (x > 0.28 * width) && (x < 0.72 * width);

              if (isHairRegion) {
                // If it is in the head region and has a near-zero black value (maxVal < 8), it is background!
                // We clear it to transparent and continue to prevent creating a black box behind the head.
                if (isJpeg && maxVal < 8) {
                  data[idx+3] = 0;
                  continue;
                }

                // If it is in the head region, and it is a dark color (between 8 and 85), it's hair!
                // We keep it fully opaque (data[idx+3] = 255) and color it solid dark black
                const shouldColorHair = src.includes('model_1.jpg');
                if (shouldColorHair && maxVal < 85 && data[idx+3] > 50) {
                  data[idx] = 6;     // Red
                  data[idx+1] = 6;   // Green
                  data[idx+2] = 6;   // Blue
                  data[idx+3] = 255; // Force solid opacity
                  continue;
                }
              }

              // Background keying for JPEGs (outside hair region, we use a higher threshold to clear halos)
              if (isJpeg && maxVal < 26) {
                if (maxVal < 8) {
                  data[idx+3] = 0; // completely transparent background
                } else {
                  // smooth feathering transition for clean edges
                  const ratio = (maxVal - 8) / (26 - 8);
                  data[idx+3] = Math.round(ratio * 255);
                }
              }

              // Background keying for PNGs (pure/near white background)
              if (isPng && r > 250 && g > 250 && b > 250) {
                data[idx+3] = 0;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          resolve(src);
        };
      });
    };

    Promise.all(sources.map(processImage)).then((results) => {
      if (active) {
        setProcessed(results);
      }
    });

    return () => {
      active = false;
    };
  }, [sources]);

  return processed;
}

export function HeroSection() {
  const originalImages = [
    '/model_1.png',
    '/model_4.png',
    '/model_2.png',
    '/model_5.png',
    '/model_3.png',
  ];
  
  const processedImages = useProcessedImages(originalImages);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Active center index of the 3D coverflow carousel (starts at center index 2)
  const [activeIndex, setActiveIndex] = useState(2);

  // Responsive breakpoint check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Autoplay interval to cycle slides (essential for clean presentation, especially on mobile)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Determine when all images are loaded and processed
  useEffect(() => {
    const allProcessed = processedImages.every(
      (img) => !img.endsWith('.jpg') && !img.endsWith('.jpeg')
    );
    if (allProcessed) {
      setIsReady(true);
    }
  }, [processedImages]);

  // Mouse parallax state for background movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (clientY - innerHeight / 2) / (innerHeight / 2);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate background floating gold particles
  const particleCount = 25;
  const [particles] = useState(() => 
    Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      size: Math.random() * 5 + 3 + 'px',
      duration: Math.random() * 10 + 9, // rise duration (9s to 19s)
      delay: Math.random() * -15, // scattered starting offset
    }))
  );

  // Model Configs
  const models = [
    { src: processedImages[0], name: "Model 1", animDelay: 0.4, height: '84%' },
    { src: processedImages[1], name: "Model 4", animDelay: 0.2, height: '84%', className: '-translate-x-[14%]' },
    { src: processedImages[2], name: "Model 2", animDelay: 0.0 }, // Royal Lehenga
    { src: processedImages[3], name: "Model 5", animDelay: 0.2 },
    { src: processedImages[4], name: "Model 3", animDelay: 0.4 },
  ];

  return (
    <div className="relative w-full h-screen min-h-[600px] flex items-end justify-center overflow-hidden bg-white select-none">
      
      {/* Background System */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-700 ease-out pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
        }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero_bg.png')",
            opacity: 1.0,
          }}
        />
      </div>

      {/* Floating Particles in Background */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-[#D4A62A]/25 filter blur-[0.5px]"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              bottom: '-20px',
            }}
            animate={{
              y: ['0vh', '-105vh'],
              x: [0, Math.random() * 40 - 20, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Soft Golden Spotlight behind the active center model */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        <div className={`rounded-full bg-[#D4A62A]/15 filter blur-[70px] ${
          isMobile ? 'w-[75vw] h-[75vw]' : 'w-[35vw] h-[35vw]'
        }`} />
      </div>

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-25 bg-white/50 backdrop-blur-sm transition-opacity duration-500">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#8B5E52]/20 border-t-[#8B5E52] rounded-full animate-spin mb-4" />
            <p className="font-hero tracking-widest text-[#8B5E52] text-sm uppercase">Loading Collection</p>
          </div>
        </div>
      )}

      {/* 3D Coverflow Container */}
      {isReady && (
        <div 
          className="relative z-10 w-full h-[95vh] flex items-end justify-center overflow-hidden pb-4"
          style={{
            perspective: 1200,
            transformStyle: 'preserve-3d',
          }}
        >
          {models.map((model, idx) => {
            // Cyclic offset logic to make the carousel circular and infinite
            const half = Math.floor(models.length / 2);
            const offset = ((idx - activeIndex + half) % models.length + models.length) % models.length - half;
            const absOffset = Math.abs(offset);
            const isCenter = offset === 0;

            // 3D parameters based on horizontal offset from active center
            const scale = isMobile 
              ? (isCenter ? 1.4 : 0.5) 
              : (absOffset === 0 ? 1.0 : absOffset === 1 ? 0.82 : 0.67);
            const rotateY = isMobile
              ? 0
              : (offset === 0 ? 0 : offset < 0 ? 25 : -25);
            const zIndex = 30 - absOffset * 10;
            const opacity = isMobile
              ? (isCenter ? 1.0 : 0)
              : (absOffset === 0 ? 1.0 : absOffset === 1 ? 0.85 : 0.55);
            const filter = isMobile
              ? 'blur(0px)'
              : (absOffset === 0 ? 'blur(0px)' : `blur(${absOffset * 1.5}px)`);

            const xVal = isMobile
              ? (isCenter ? 'calc(0vw - 50%)' : `calc(${offset * 100}vw - 50%)`)
              : `calc(${offset * 18}vw - 50%)`;

            return (
              <motion.div
                key={idx}
                style={{
                  zIndex: zIndex,
                  left: '50%',
                  transformOrigin: 'bottom center',
                  cursor: 'pointer',
                }}
                animate={{
                  x: xVal,
                  scale: scale,
                  rotateY: rotateY,
                  opacity: opacity,
                  filter: filter,
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.25, 1, 0.5, 1],
                }}
                onClick={() => setActiveIndex(idx)}
                className={`absolute bottom-0 h-full flex items-end justify-center select-none ${
                  isMobile ? 'w-[70vw]' : 'w-[25vw]'
                } ${isMobile && !isCenter ? 'pointer-events-none' : ''}`}
              >
                {/* Inner loop animation: independent float & sway (breathing) */}
                <motion.div
                  animate={{
                    y: isCenter ? [0, -8, 0] : [0, -3, 0],
                    rotate: isCenter ? [0, 0.3, 0, -0.3, 0] : [0, 0.6, 0, -0.6, 0],
                  }}
                  transition={{
                    duration: isCenter ? 5.5 : 7.0 + idx * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-full h-full flex items-end justify-center"
                >
                  <img
                    src={model.src}
                    alt={model.name}
                    style={{
                      height: isMobile ? '82%' : (model.height || '96%')
                    }}
                    className={`w-auto object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.08)] pointer-events-none ${model.className || ''}`}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
