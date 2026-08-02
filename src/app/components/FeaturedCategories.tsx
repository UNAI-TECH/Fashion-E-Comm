import { motion } from 'motion/react';
import { Link } from 'react-router';

const featuredCategories = [
  {
    id: 'kurti',
    name: 'Kurtis',
    path: '/category/kurtis',
    image: '/cat_kurti_circle.jpg',
    bgColor: '#FCE7F3', // Light Soft Rose Pink
    textColor: '#9D174D',
    borderColor: '#FBCFE8',
  },
  {
    id: 'saree',
    name: 'Sarees',
    path: '/category/sarees',
    image: '/cat_saree_circle.jpg',
    bgColor: '#FEF3C7', // Light Warm Gold
    textColor: '#92400E',
    borderColor: '#FDE68A',
  },
  {
    id: 'lehenga',
    name: 'Lehengas',
    path: '/category/lehengas',
    image: '/cat_lehenga_circle.jpg',
    bgColor: '#F3E8FF', // Light Soft Lavender
    textColor: '#6B21A8',
    borderColor: '#E9D5FF',
  },
  {
    id: 'western',
    name: 'Western',
    path: '/category/western',
    image: '/cat_western_circle.jpg',
    bgColor: '#FFE4E6', // Light Soft Peach
    textColor: '#9F1239',
    borderColor: '#FECDD3',
  },
  {
    id: 'maxi',
    name: 'Maxi',
    path: '/category/maxi',
    image: '/cat_maxi_circle.jpg',
    bgColor: '#E0F2FE', // Light Sky Blue
    textColor: '#075985',
    borderColor: '#BAE6FD',
  },
  {
    id: 'salwar',
    name: 'Salwar Set',
    path: '/category/salwar-sets',
    image: '/cat_salwar_circle.jpg',
    bgColor: '#DCFCE7', // Light Soft Mint Green
    textColor: '#166534',
    borderColor: '#BBF7D0',
  },
];

export function FeaturedCategories() {
  return (
    <section className="w-full bg-white py-8 sm:py-12 border-b border-gray-100 select-none">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        
        {/* Horizontal Category Cards Bar — Clean Circles with Different Light Colors & Generous Spacing */}
        <div className="flex items-center justify-start md:justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20 overflow-x-auto scrollbar-hide py-4 px-4">
          {featuredCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex-shrink-0 flex flex-col items-center group cursor-pointer"
            >
              <Link to={cat.path} className="flex flex-col items-center">
                {/* Image Circle or Pure Circle Shape */}
                <motion.div
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center border-2 transition-all shadow-sm group-hover:shadow-md cursor-pointer overflow-hidden"
                  style={{
                    backgroundColor: cat.bgColor,
                    borderColor: cat.borderColor,
                  }}
                >
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl md:text-4xl font-serif font-black" style={{ color: cat.textColor }}>
                      {cat.name.charAt(0)}
                    </span>
                  )}
                </motion.div>

                {/* Category Label */}
                <span className="mt-3 text-xs sm:text-sm font-extrabold text-gray-800 group-hover:text-[#800000] transition-colors text-center tracking-wide">
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
