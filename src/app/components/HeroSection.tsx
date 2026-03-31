import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

export function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #FFD6E8 0%, #E6E6FA 50%, #FFF0F5 100%)',
        }}
      />

      {/* Animated gradient overlay */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 z-0 opacity-30"
        style={{
          background: 'linear-gradient(45deg, #D4AF37, #FFD6E8, #E6E6FA, #F5F5DC)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Container Array - Desktop Row / Mobile Column */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
        
        {/* Left Image - Desktop Only or Above Text */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, -20, 0],
            rotateY: [-5, 5, -5]
          }}
          transition={{ 
            opacity: { duration: 1 },
            x: { duration: 1 },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            rotateY: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
          className="hidden lg:block w-full lg:w-1/4 h-[500px] rounded-3xl overflow-hidden shadow-2xl relative border border-white/40"
        >
          <img
            src="https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzaWxrJTIwc2FyZWV8ZW58MXx8fHwxNzc0NDE3MzU3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Elegant Saree"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/30 to-transparent" />
        </motion.div>

        {/* Center Content - Text and Buttons */}
        <div className="w-full lg:w-2/4 text-center order-first lg:order-none z-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto" />
            </motion.div>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl mb-6 text-gray-900 leading-tight drop-shadow-sm">
              Redefine Your Style
            </h1>
            <p className="text-lg sm:text-xl text-gray-800 mb-8 max-w-xl mx-auto font-medium px-4">
              Affordable fashion products for customers. Discover the perfect blend of elegance and trend.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/category/sarees">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-[#D4AF37] text-white rounded-full flex items-center gap-3 text-lg transition-all shadow-lg"
              >
                Shop Now
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </Link>

            <Link to="/category/lehengas">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/50 backdrop-blur-md text-[#1A1A1A] rounded-full text-lg border border-white/80 transition-all shadow-sm"
              >
                Explore Collection
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Right Image - Desktop Only */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, 20, 0],
            rotateY: [5, -5, 5]
          }}
          transition={{ 
            opacity: { duration: 1, delay: 0.2 },
            x: { duration: 1, delay: 0.2 },
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            rotateY: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
          }}
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
          className="hidden lg:block w-full lg:w-1/4 h-[500px] rounded-3xl overflow-hidden shadow-2xl relative border border-white/40"
        >
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1080"
            alt="Designer Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFD6E8]/30 to-transparent" />
        </motion.div>

        {/* Mobile Output: Images stacked below text */}
        <div className="w-full flex lg:hidden gap-4 h-[300px] sm:h-[400px]">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: 1, 
              y: [0, -10, 0],
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.6 },
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="flex-1 rounded-3xl overflow-hidden shadow-lg relative border border-white/40"
          >
            <img
              src="https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzaWxrJTIwc2FyZWV8ZW58MXx8fHwxNzc0NDE3MzU3fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Elegant Saree"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: 1, 
              y: [0, 10, 0]
            }}
            transition={{ 
               opacity: { duration: 0.8, delay: 0.8 },
               y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
            }}
            className="flex-1 rounded-3xl overflow-hidden shadow-lg relative border border-white/40"
          >
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1080"
              alt="Designer Collection"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
            }}
            animate={{
              y: [null, -100],
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? '#D4AF37' : '#FFD6E8',
            }}
          />
        ))}
      </div>
    </div>
  );
}
