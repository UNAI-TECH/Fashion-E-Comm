import { motion } from 'motion/react';
import { Link } from 'react-router';

const featuredCategories = [
  {
    id: 'kurti',
    name: 'Kurtis',
    path: '/category/kurtis',
    bgColor: '#FCE7F3', // Light Soft Rose Pink
    textColor: '#9D174D',
    strokeColor: '#F472B6',
  },
  {
    id: 'saree',
    name: 'Sarees',
    path: '/category/sarees',
    bgColor: '#FEF3C7', // Light Warm Gold
    textColor: '#92400E',
    strokeColor: '#FBBF24',
  },
  {
    id: 'lehenga',
    name: 'Lehengas',
    path: '/category/lehengas',
    bgColor: '#F3E8FF', // Light Soft Lavender
    textColor: '#6B21A8',
    strokeColor: '#C084FC',
  },
  {
    id: 'western',
    name: 'Western',
    path: '/category/western',
    bgColor: '#FFE4E6', // Light Soft Peach
    textColor: '#9F1239',
    strokeColor: '#FB7185',
  },
  {
    id: 'maxi',
    name: 'Maxi',
    path: '/category/maxi',
    bgColor: '#E0F2FE', // Light Sky Blue
    textColor: '#075985',
    strokeColor: '#38BDF8',
  },
  {
    id: 'salwar',
    name: 'Salwar Set',
    path: '/category/salwar-sets',
    bgColor: '#DCFCE7', // Light Soft Mint Green
    textColor: '#166534',
    strokeColor: '#4ADE80',
  },
];

// 8-Pointed Scalloped Flower / Rosette Starburst Badge SVG Path
const SCALLOPED_STARBURST_PATH = 
  "M 50,3 C 57,3 61,10 67,8 C 73,6 78,12 82,18 C 86,24 93,27 94,34 C 95,40 91,46 91,50 C 91,54 95,60 94,66 C 93,73 86,76 82,82 C 78,88 73,94 67,92 C 61,90 57,97 50,97 C 43,97 39,90 33,92 C 27,94 22,88 18,82 C 14,76 7,73 6,66 C 5,60 9,54 9,50 C 9,46 5,40 6,34 C 7,27 14,24 18,18 C 22,12 27,6 33,8 C 39,10 43,3 50,3 Z";

export function FeaturedCategories() {
  return (
    <section className="w-full bg-white py-8 sm:py-12 border-b border-gray-100 select-none">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        
        {/* Horizontal Category Cards Bar — 8-Pointed Scalloped Starburst Rosette Badges */}
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
                {/* 8-Pointed Scalloped Starburst Rosette Badge */}
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 4, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center cursor-pointer"
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_6px_12px_rgba(0,0,0,0.12)] transition-all"
                  >
                    <path
                      d={SCALLOPED_STARBURST_PATH}
                      fill={cat.bgColor}
                      stroke={cat.strokeColor}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {/* Category Initial in matching elegant text color */}
                  <span
                    className="absolute text-2xl sm:text-3xl md:text-4xl font-serif font-black"
                    style={{ color: cat.textColor }}
                  >
                    {cat.name.charAt(0)}
                  </span>
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
