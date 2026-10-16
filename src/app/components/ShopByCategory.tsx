import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

interface CategoryCardItem {
  id: string;
  name: string;
  discount: string;
  image: string;
  link: string;
}

const SAREE_CATEGORIES: CategoryCardItem[] = [
  {
    id: 'kanchi-cotton',
    name: 'Kanchi Cotton',
    discount: '50-80% OFF',
    image: '/cat_kanchi_cotton.jpg',
    link: '/kanchicotton',
  },
  {
    id: 'viscose',
    name: 'Viscose Sarees',
    discount: '40-80% OFF',
    image: '/cat_viscose.jpg',
    link: '/viscose',
  },
  {
    id: 'fancy',
    name: 'Fancy Sarees',
    discount: '30-70% OFF',
    image: '/cat_fancy.jpg',
    link: '/fancy-sarees',
  },
  {
    id: 'checks-pedding',
    name: 'Checks Pedding',
    discount: '40-80% OFF',
    image: '/cat_checks_pedding.jpg',
    link: '/checks-pedding',
  },
];

export function ShopByCategory() {
  return (
    <section className="relative w-full py-10 sm:py-14 bg-gradient-to-b from-[#FFF5EC] via-[#FFFBF7] to-white overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title — Matching UI in User Reference Image 1 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-wider uppercase text-[#B3541E] drop-shadow-xs">
            SHOP BY CATEGORY
          </h2>
          <div className="mt-2.5 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[#B3541E]/50 to-transparent" />
        </motion.div>

        {/* Categories Grid (2 cols mobile, 4 cols desktop) — Card style from Image 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-7">
          {SAREE_CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Link
                to={cat.link}
                className="group block relative rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-[#FDB06C] via-[#FED39F] to-[#FA9C42] border border-[#F59E3F] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer overflow-hidden"
              >
                {/* Image Box */}
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#FAF6F0]">
                  <img
                    src={cat.image}
                    alt={`${cat.name} Collection`}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>

                {/* Bottom Details Card Area (Matching Image 1 gradient peach tone) */}
                <div className="pt-2.5 pb-2 px-1 text-center">
                  <h3 className="font-sans text-xs sm:text-sm md:text-base font-bold text-gray-900 leading-tight truncate">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base font-black text-[#B02A05] tracking-wide mt-0.5">
                    {cat.discount}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-gray-800 underline underline-offset-2 hover:text-[#9A2202] transition-colors mt-0.5 inline-flex items-center gap-1">
                    <span>Shop Now</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
