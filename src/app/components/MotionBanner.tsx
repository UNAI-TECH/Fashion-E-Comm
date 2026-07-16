import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function MotionBanner() {
  return (
    <section className="relative w-full min-h-[320px] md:min-h-0 md:aspect-[19/8] flex flex-col md:flex-row items-center overflow-hidden bg-[#F1CBD3] py-16 md:py-0">
      {/* Background Image - hidden on mobile, right-aligned on desktop */}
      <div className="hidden md:block absolute bottom-0 right-0 w-full h-[45%] md:h-full md:w-[60%] pointer-events-none z-0">
        <img
          src="/hero_new.png"
          alt="Fashion Collection"
          className="w-full h-full object-contain object-bottom md:object-right transform scale-120 origin-bottom-right"
        />
      </div>

      {/* Transparent spacer overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-none" />

      {/* Content wrapper - centered on mobile, left-aligned on desktop */}
      <div className="relative z-10 w-full px-6 sm:px-12 md:px-16 lg:px-24 flex items-center h-full">
        <div className="max-w-md mx-auto md:mx-0 md:max-w-lg lg:max-w-xl text-center md:text-left">
          {/* Animated text decoration line */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-4 flex justify-center md:justify-start"
          >
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '80px' }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-1 bg-[#D4AF37]"
            />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-4"
          >
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] leading-tight">
              New Season
              <br />
              <span className="text-[#800000]">Collection</span>
            </h2>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xs sm:text-sm md:text-base text-gray-700 mb-6 leading-relaxed max-w-sm sm:max-w-md md:max-w-none mx-auto md:mx-0"
          >
            Discover the latest trends in women's fashion. Curated pieces that blend timeless elegance with contemporary style.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap justify-center md:justify-start gap-3"
          >
            <motion.button
              onClick={() => window.location.href = '/category/all'}
              whileHover={{ scale: 1.03, x: 5 }}
              whileTap={{ scale: 0.97 }}
              className="group px-5 py-3 bg-[#1A1A1A] text-white rounded-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-[#800000]"
            >
              Shop Collection
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>

            <motion.button
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 bg-transparent border border-[#1A1A1A] text-[#1A1A1A] rounded-none text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
