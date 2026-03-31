import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

const categories = [
  {
    id: 1,
    name: 'Sarees',
    path: '/category/sarees',
    image: 'https://images.unsplash.com/photo-1756483551860-2b312666ac53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHNhcmVlJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzQ0MTczMjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'Shop Collection',
  },
  {
    id: 2,
    name: 'Kurtis',
    path: '/category/kurtis',
    image: 'https://images.unsplash.com/photo-1768803968262-320d4752966f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMGt1cnRpJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzQ0MTczMjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'Shop Now',
  },
  {
    id: 3,
    name: 'Lehengas',
    path: '/category/lehengas',
    image: 'https://images.unsplash.com/photo-1767955694884-d4bf352c23c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBsZWhlbmdhJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzQ0MTczMjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'Explore Styles',
  },
  {
    id: 4,
    name: 'Western',
    path: '/category/western',
    image: 'https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHdlc3Rlcm4lMjBkcmVzc3xlbnwxfHx8fDE3NzQ0MTczMzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'View Trends',
  },
];

export function FeaturedCategories() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-6 py-2 bg-[#FFF0F5] text-[#D4AF37] rounded-full text-sm tracking-wider mb-4"
          >
            COLLECTIONS
          </motion.span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#1A1A1A]">
            Featured Categories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Explore our curated collections designed for the modern woman
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Link to={category.path}>
                <motion.div
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg"
                >
                  {/* Image */}
                  <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Glassmorphism Card */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    className="absolute inset-x-0 bottom-0 p-6 bg-white/10 backdrop-blur-md border-t border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-2xl text-white mb-1">
                          {category.name}
                        </h3>
                        <p className="text-white/80 text-sm font-medium tracking-wide">{category.cta}</p>
                      </div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                      >
                        <ArrowRight className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Static Info */}
                  <div className="absolute bottom-6 left-6 group-hover:opacity-0 transition-opacity">
                    <h3 className="font-serif text-2xl text-white mb-1">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm font-medium tracking-wide">{category.cta}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
