import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './Skeleton';
import { fetchProducts, Product } from '../data/products';

export function FlashSale({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 34,
    seconds: 56,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Render skeletons inside the actual section for better context
  const renderSkeletons = (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {[...Array(4)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#FFD6E8] via-[#FFF0F5] to-[#E6E6FA] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            className="absolute w-32 h-32 rounded-full bg-white/30 blur-xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Zap className="w-16 h-16 text-[#D4AF37] fill-[#D4AF37]" />
          </motion.div>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#1A1A1A]">
            Flash Sale
          </h2>
          <div className="flex justify-center gap-4 sm:gap-6 mt-8">
            {[
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((item, index) => (
              <div key={item.label} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-lg min-w-[80px]">
                <div className="text-3xl font-serif text-[#D4AF37]">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 mt-2 uppercase tracking-widest">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 italic">
              No flash sale items available at the moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
