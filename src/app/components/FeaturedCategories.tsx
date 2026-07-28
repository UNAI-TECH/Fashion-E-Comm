import { motion } from 'motion/react';
import { Link } from 'react-router';

const featuredCategories = [
  {
    id: 'kurti',
    name: 'Kurtis',
    path: '/category/kurtis',
    image: '/kurti_k1.jpg',
    bgColor: '#FCE7F3', // Light Rose Pink
    accentColor: '#9D174D',
  },
  {
    id: 'saree',
    name: 'Sarees',
    path: '/category/sarees',
    image: '/saree_s1.jpg',
    bgColor: '#FEF3C7', // Light Warm Gold
    accentColor: '#92400E',
  },
  {
    id: 'lehenga',
    name: 'Lehengas',
    path: '/category/lehengas',
    image: '/lehenga_l1.jpg',
    bgColor: '#F3E8FF', // Light Soft Lavender
    accentColor: '#6B21A8',
  },
  {
    id: 'western',
    name: 'Western',
    path: '/category/western',
    image: '/western_w1.jpg',
    bgColor: '#FFE4E6', // Light Soft Peach
    accentColor: '#9F1239',
  },
  {
    id: 'maxi',
    name: 'Maxi',
    path: '/category/maxi',
    image: '/maxi_mx1.jpg',
    bgColor: '#E0F2FE', // Light Sky Blue
    accentColor: '#075985',
  },
  {
    id: 'salwar',
    name: 'Salwar Set',
    path: '/category/salwar-sets',
    image: '/salwar_ss1.jpg',
    bgColor: '#DCFCE7', // Light Soft Mint
    accentColor: '#166534',
  },
];

export function FeaturedCategories() {
  return (
    <section className="w-full bg-white py-6 border-b border-gray-100 select-none">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* Horizontal Category Cards Bar — Meesho Style Arch Domes */}
        <div className="flex items-center justify-start md:justify-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide py-2 px-2">
          {featuredCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex-shrink-0 flex flex-col items-center group cursor-pointer"
            >
              <Link to={cat.path} className="flex flex-col items-center">
                {/* Arch Dome Image Container */}
                <motion.div
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-24 h-28 sm:w-28 sm:h-32 md:w-32 md:h-36 rounded-t-[4rem] rounded-b-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all relative flex items-end justify-center p-1"
                  style={{ backgroundColor: cat.bgColor }}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-[92%] object-cover object-top rounded-t-[3.8rem] rounded-b-xl drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                  />
                </motion.div>

                {/* Category Label */}
                <span className="mt-2.5 text-xs sm:text-sm font-extrabold text-gray-800 group-hover:text-[#800000] transition-colors text-center tracking-wide">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
