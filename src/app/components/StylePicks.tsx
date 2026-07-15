import { motion } from 'motion/react';

const brands = [
  { name: 'Zara', src: '/brand_zara.jpg' },
  { name: 'H&M', src: '/brand_hm.jpg' },
  { name: 'Biba', src: '/brand_biba.jpg' },
  { name: 'Fabindia', src: '/brand_fabindia.jpg' },
  { name: 'Marks & Spencer', src: '/brand_marks.jpg' }
];

export function StylePicks({ products, isLoading }: { products?: any, isLoading?: boolean }) {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#D4AF37] font-medium tracking-[0.2em] uppercase text-sm mb-4 block">Style Partners</span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#1A1A1A] mb-6 italic">Featured Brands</h2>
          <div className="w-24 h-px bg-[#D4AF37] mx-auto opacity-30"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {brands.map((brand, idx) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className="aspect-square bg-white rounded-[2rem] border border-gray-100 shadow-md flex items-center justify-center p-6 cursor-pointer overflow-hidden group"
            >
              <img
                src={brand.src}
                alt={`${brand.name} logo`}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
