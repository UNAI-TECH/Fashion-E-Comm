import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

interface BentoCategory {
  id: string;
  name: string;
  badge: string;
  description: string;
  path: string;
  image: string;
  colSpan: string;
  height: string;
  accentGlow: string;
  isTrending?: boolean;
}

const BENTO_CATEGORIES: BentoCategory[] = [
  {
    id: 'trending',
    name: 'Trending Now',
    badge: '🔥 Hot & Viral',
    description: 'Our most-loved pieces, festive drops & top-rated customer favorites.',
    path: '/category/trending',
    image: '/tradition_t3.jpg',
    colSpan: 'col-span-2 sm:col-span-12 lg:col-span-4',
    height: 'h-[210px] sm:h-[360px] lg:h-[400px]',
    accentGlow: 'from-orange-600/50 via-amber-500/30',
    isTrending: true,
  },
  {
    id: 'sarees',
    name: 'Imperial Sarees',
    badge: 'Heritage Silk',
    description: 'Kanchipuram, Banarasi & Georgette silk with shimmering zari borders.',
    path: '/category/sarees',
    image: '/saree_royal_maroon.jpg',
    colSpan: 'col-span-1 sm:col-span-6 lg:col-span-4',
    height: 'h-[190px] sm:h-[360px] lg:h-[400px]',
    accentGlow: 'from-[#698156]/40',
  },
  {
    id: 'lehengas',
    name: 'Grand Lehengas',
    badge: 'Royal Bridal',
    description: 'Luxurious velvets & intricate resham embroidery.',
    path: '/category/lehengas',
    image: '/lehenga_category_pink.jpg',
    colSpan: 'col-span-1 sm:col-span-6 lg:col-span-4',
    height: 'h-[190px] sm:h-[360px] lg:h-[400px]',
    accentGlow: 'from-[#BE185D]/40',
  },
  {
    id: 'kurtis',
    name: 'Designer Kurtis',
    badge: 'Everyday Grace',
    description: 'Anarkali, straight-cut & chanderi grace.',
    path: '/category/kurtis',
    image: '/kurti_category_green.jpg',
    colSpan: 'col-span-1 sm:col-span-6 lg:col-span-3',
    height: 'h-[190px] sm:h-[280px] lg:h-[300px]',
    accentGlow: 'from-[#047857]/40',
  },
  {
    id: 'western',
    name: 'Western Edit',
    badge: 'Modern Chic',
    description: 'Contemporary dresses & statement casuals.',
    path: '/category/western',
    image: '/western_category_casual.jpg',
    colSpan: 'col-span-1 sm:col-span-6 lg:col-span-3',
    height: 'h-[190px] sm:h-[280px] lg:h-[300px]',
    accentGlow: 'from-[#4338CA]/40',
  },
  {
    id: 'salwar-sets',
    name: 'Salwar Sets',
    badge: 'Festive Wear',
    description: 'Handcrafted 3-piece sets & flowy dupattas.',
    path: '/category/salwar-sets',
    image: '/salwar_ss1.jpg',
    colSpan: 'col-span-1 sm:col-span-6 lg:col-span-3',
    height: 'h-[190px] sm:h-[280px] lg:h-[300px]',
    accentGlow: 'from-[#B45309]/40',
  },
  {
    id: 'maxi',
    name: 'Maxi & Gowns',
    badge: 'Evening Flair',
    description: 'Floor-length silhouettes & organza flair.',
    path: '/category/maxi',
    image: '/maxi_mx1.jpg',
    colSpan: 'col-span-1 sm:col-span-6 lg:col-span-3',
    height: 'h-[190px] sm:h-[280px] lg:h-[300px]',
    accentGlow: 'from-[#0369A1]/40',
  },
];

export function FeaturedCategories() {
  return (
    <section className="w-full bg-[#FFFFFF] py-10 sm:py-16 border-b border-gray-100 select-none relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-orange-100/30 via-amber-100/30 to-rose-100/40 blur-3xl pointer-events-none -z-0" />

      <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-medium tracking-tight"
          >
            Explore by Category
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-xs sm:text-base max-w-2xl mx-auto mt-2 sm:mt-2.5"
          >
            From hot trending favorites to grand heritage silks and modern evening wear, discover handcrafted elegance.
          </motion.p>
        </div>

        {/* Bento Grid — 2 columns on mobile, 12 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-6">
          {BENTO_CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 25, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -6 }}
              className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.18)] transition-all duration-500 ${cat.colSpan} ${cat.height}`}
            >
              <Link to={cat.path} className="block w-full h-full relative cursor-pointer">
                {/* Background Image with Zoom Animation */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Ambient dynamic gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:from-black/95 group-hover:via-black/50 transition-colors duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.accentGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Mobile Bento Shimmer Animation */}
                <motion.div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none sm:hidden"
                  animate={{ translateX: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 4, delay: index * 0.6, ease: 'easeInOut' }}
                />

                {/* Floating Bento Tag Badge */}
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10">
                  <span className={`inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
                    cat.isTrending ? 'bg-gradient-to-r from-orange-500/80 to-amber-500/80 border-amber-300/40 text-white' : 'bg-black/40 border-white/20 text-white'
                  } backdrop-blur-md border text-[9px] sm:text-[11px] font-bold tracking-wider uppercase shadow-sm`}>
                    {cat.badge}
                  </span>
                </div>

                {/* Bottom Content Area */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6 z-10 flex items-end justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                    <h3 className={`font-serif text-sm sm:text-2xl lg:text-3xl font-bold text-white tracking-wide ${
                      cat.isTrending ? 'group-hover:text-amber-300' : 'group-hover:text-[#FDE68A]'
                    } transition-colors drop-shadow-sm leading-tight`}>
                      {cat.name}
                    </h3>
                    <p className="text-white/80 text-[10px] sm:text-sm mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2 font-light drop-shadow-sm max-w-md">
                      {cat.description}
                    </p>
                  </div>

                  {/* Floating Action Arrow Button */}
                  <div className={`w-7 h-7 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white ${
                    cat.isTrending
                      ? 'group-hover:bg-gradient-to-tr group-hover:from-orange-500 group-hover:to-amber-500 group-hover:border-amber-300'
                      : 'group-hover:bg-[#698156] group-hover:border-[#698156]'
                  } group-hover:scale-110 group-active:scale-95 transition-all duration-300 flex-shrink-0 shadow-lg`}>
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* Hover Border Ring Glow */}
                <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 ${
                  cat.isTrending ? 'group-hover:border-orange-400/80' : 'group-hover:border-[#698156]/60'
                } pointer-events-none transition-all duration-300`} />
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
