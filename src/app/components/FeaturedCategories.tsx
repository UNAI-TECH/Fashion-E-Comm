import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface BentoCategory {
  id: string;
  name: string;
  tag: string;
  description: string;
  path: string;
  image: string;
  colSpan: string;
  height: string;
  accentGlow: string;
  badgeBg: string;
}

const BENTO_CATEGORIES: BentoCategory[] = [
  {
    id: 'sarees',
    name: 'Imperial Sarees',
    tag: 'Pure Silk & Heritage',
    description: 'Kanchipuram, Banarasi & Georgette silk with shimmering zari borders.',
    path: '/category/sarees',
    image: '/saree_royal_maroon.jpg',
    colSpan: 'sm:col-span-12 lg:col-span-7',
    height: 'h-[320px] sm:h-[360px] lg:h-[400px]',
    accentGlow: 'from-[#800000]/40',
    badgeBg: 'bg-[#800000]/70 text-rose-100 border-rose-300/30',
  },
  {
    id: 'lehengas',
    name: 'Grand Lehengas',
    tag: 'Bridal & Festive Couture',
    description: 'Luxurious velvets, intricate resham embroidery & regal silhouettes.',
    path: '/category/lehengas',
    image: '/lehenga_category_pink.jpg',
    colSpan: 'sm:col-span-12 lg:col-span-5',
    height: 'h-[320px] sm:h-[360px] lg:h-[400px]',
    accentGlow: 'from-[#BE185D]/40',
    badgeBg: 'bg-[#BE185D]/70 text-pink-100 border-pink-300/30',
  },
  {
    id: 'kurtis',
    name: 'Designer Kurtis',
    tag: 'Everyday & Festive Chic',
    description: 'Anarkali, straight-cut & chanderi grace.',
    path: '/category/kurtis',
    image: '/kurti_category_green.jpg',
    colSpan: 'sm:col-span-6 lg:col-span-3',
    height: 'h-[280px] sm:h-[310px]',
    accentGlow: 'from-[#047857]/40',
    badgeBg: 'bg-[#047857]/70 text-emerald-100 border-emerald-300/30',
  },
  {
    id: 'western',
    name: 'Western Edit',
    tag: 'Modern Chic',
    description: 'Contemporary dresses & statement casuals.',
    path: '/category/western',
    image: '/western_category_casual.jpg',
    colSpan: 'sm:col-span-6 lg:col-span-3',
    height: 'h-[280px] sm:h-[310px]',
    accentGlow: 'from-[#4338CA]/40',
    badgeBg: 'bg-[#4338CA]/70 text-indigo-100 border-indigo-300/30',
  },
  {
    id: 'salwar-sets',
    name: 'Salwar Sets',
    tag: 'Timeless Grace',
    description: 'Handcrafted 3-piece sets & flowy dupattas.',
    path: '/category/salwar-sets',
    image: '/salwar_ss1.jpg',
    colSpan: 'sm:col-span-6 lg:col-span-3',
    height: 'h-[280px] sm:h-[310px]',
    accentGlow: 'from-[#B45309]/40',
    badgeBg: 'bg-[#B45309]/70 text-amber-100 border-amber-300/30',
  },
  {
    id: 'maxi',
    name: 'Maxi & Gowns',
    tag: 'Evening Glamour',
    description: 'Floor-length silhouettes & organza flair.',
    path: '/category/maxi',
    image: '/maxi_mx1.jpg',
    colSpan: 'sm:col-span-6 lg:col-span-3',
    height: 'h-[280px] sm:h-[310px]',
    accentGlow: 'from-[#0369A1]/40',
    badgeBg: 'bg-[#0369A1]/70 text-sky-100 border-sky-300/30',
  },
];

export function FeaturedCategories() {
  return (
    <section className="w-full bg-[#FCFBF8] py-14 sm:py-20 border-b border-gray-100 select-none relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-rose-100/40 via-amber-100/30 to-rose-100/40 blur-3xl pointer-events-none -z-0" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-[#800000] text-xs font-bold uppercase tracking-widest mb-3 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Signature Collections
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-medium tracking-tight"
          >
            Explore by Category
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto mt-2.5"
          >
            From grand heritage silks to contemporary evening wear, discover handcrafted excellence in every thread.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
          {BENTO_CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
              className={`group relative rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.18)] transition-all duration-500 ${cat.colSpan} ${cat.height}`}
            >
              <Link to={cat.path} className="block w-full h-full relative cursor-pointer">
                {/* Background Image with Zoom Animation */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Ambient dynamic gradient scrim */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:from-black/95 group-hover:via-black/50 transition-colors duration-500`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.accentGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Top Glass Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-bold tracking-wide shadow-sm ${cat.badgeBg}`}>
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    {cat.tag}
                  </span>
                </div>

                {/* Bottom Content Area */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10 flex items-end justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide group-hover:text-[#FDE68A] transition-colors drop-shadow-sm truncate">
                      {cat.name}
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2 font-light drop-shadow-sm max-w-md">
                      {cat.description}
                    </p>
                  </div>

                  {/* Floating Action Arrow Button */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:bg-[#800000] group-hover:border-[#800000] group-hover:scale-110 transition-all duration-300 flex-shrink-0 shadow-lg">
                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* Hover Border Ring Glow */}
                <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-[#D4AF37]/60 pointer-events-none transition-colors duration-300" />
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
