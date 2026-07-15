import { motion } from 'motion/react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <AnnouncementBar />
      <Navigation />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="px-4 max-w-7xl mx-auto mb-20">
          <div className="text-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-block px-6 py-2 bg-[#FFF0F5] text-[#D4AF37] rounded-full text-sm tracking-wider mb-4"
            >
              OUR JOURNEY
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-5xl sm:text-6xl md:text-7xl text-[#1A1A1A] mb-6"
            >
              About Aanya Fashions
            </motion.h1>
          </div>
        </section>

        {/* Story Section */}
        <section className="px-4 max-w-7xl mx-auto mb-24">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >

              <p className="text-gray-600 text-lg leading-relaxed">
                Aanya Fashions was born from a desire to celebrate the rich, diverse textile heritage of India. Every saree, kurti, and lehenga we create is a testament to the skill of master weavers and artisans who have kept these age-old techniques alive across generations. By blending these luxurious fabrics with clean, modern silhouettes and premium structures, we deliver pieces that empower the modern woman to feel elegant, confident, and rooted.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <h4 className="font-serif text-3xl text-[#D4AF37] font-bold">10k+</h4>
                  <p className="text-sm text-gray-500">Happy Customers</p>
                </div>
                <div>
                  <h4 className="font-serif text-3xl text-[#D4AF37] font-bold">150+</h4>
                  <p className="text-sm text-gray-500">Artisan Partners</p>
                </div>
                <div>
                  <h4 className="font-serif text-3xl text-[#D4AF37] font-bold">100%</h4>
                  <p className="text-sm text-gray-500">Handcrafted</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="bg-white py-20 px-4 mb-24 border-y border-gray-100">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ y: -8 }}
                className="p-8 bg-[#FDFBF7] rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-serif">1</div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-4">Ethical Sourcing</h3>
                <p className="text-gray-600">We work directly with traditional weavers, ensuring fair wages, healthy working conditions, and direct support to rural communities.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -8 }}
                className="p-8 bg-[#FDFBF7] rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-serif">2</div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-4">Uncompromising Quality</h3>
                <p className="text-gray-600">Every silk fiber, zari embroidery thread, and hand-painted design is rigorously inspected to deliver lasting premium quality.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -8 }}
                className="p-8 bg-[#FDFBF7] rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-serif">3</div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-4">Timeless Designs</h3>
                <p className="text-gray-600">We avoid fast fashion fads. Our curated collections are designed to be loved, treasured, and worn for a lifetime.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
