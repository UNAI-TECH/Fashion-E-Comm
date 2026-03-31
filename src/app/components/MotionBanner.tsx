import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function MotionBanner() {
  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* Video-like animated background */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.2 }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full"
        >
          <img
            src="https://images.unsplash.com/photo-1769981271695-bb3d766ee419?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZGVzaWduZXIlMjBjbG90aGluZyUyMHJhY2t8ZW58MXx8fHwxNzc0Mjc0NDg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Fashion Collection"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Animated content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            {/* Animated text reveals */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '100px' }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-1 bg-[#D4AF37] mb-8"
              />
              
              <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl text-white mb-6 leading-tight">
                New Season
                <br />
                <span style={{ color: '#D4AF37' }}>Collection</span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-gray-200 mb-8 leading-relaxed"
            >
              Discover the latest trends in women's fashion. Curated pieces that blend timeless elegance with contemporary style.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                onClick={() => window.location.href = '/category/all'}
                whileHover={{ scale: 1.05, x: 10 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-white text-black rounded-none flex items-center gap-3 text-lg transition-all hover:bg-[#D4AF37] hover:text-white"
              >
                Shop Collection
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>

              <motion.button
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-none text-lg hover:bg-white hover:text-black transition-all"
              >
                Learn More
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Animated scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1, duration: 1 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm tracking-widest"
      >
        <div className="flex flex-col items-center gap-2">
          <span>SCROLL</span>
          <div className="w-px h-12 bg-white/50" />
        </div>
      </motion.div>

      {/* Parallax elements */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl"
      />
    </section>
  );
}
