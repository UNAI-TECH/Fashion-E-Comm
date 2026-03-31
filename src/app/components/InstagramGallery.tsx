import { motion } from 'motion/react';
import { Instagram, Heart } from 'lucide-react';

const galleryImages = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1720005398225-4ea01c9d2b8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tYW4lMjBlbGVnYW50JTIwZHJlc3N8ZW58MXx8fHwxNzc0MjY2NjE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    likes: 1234,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1768033976309-b236cbd34509?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0eWxpc2glMjBwaW5rJTIwb3V0Zml0fGVufDF8fHx8MTc3NDI3NDQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    likes: 2341,
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1728476397002-99cc5e75e42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjB3aGl0ZSUyMGRyZXNzfGVufDF8fHx8MTc3NDI3NDQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    likes: 1876,
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1634047113039-9be12d268cab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVuZHklMjB3b21hbiUyMGxhdmVuZGVyJTIwY2xvdGhpbmd8ZW58MXx8fHwxNzc0Mjc0NDgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    likes: 3210,
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1773439877855-cd193d949717?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldGhuaWMlMjB3ZWFyJTIwdHJhZGl0aW9uYWwlMjBkcmVzc3xlbnwxfHx8fDE3NzQyNzQ0ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    likes: 2987,
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1756483510841-1549847136f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tYW4lMjBiZWlnZSUyMHRvcHxlbnwxfHx8fDE3NzQyNzQ0ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    likes: 1543,
  },
];

export function InstagramGallery() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-[#FFF0F5]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <Instagram className="w-12 h-12 text-[#D4AF37]" />
          </motion.div>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#1A1A1A]">
            Follow Our Style
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-6">
            Join our community and get daily inspiration
          </p>
          <motion.a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD6E8] text-white rounded-full shadow-lg"
          >
            @luxe_fashion
          </motion.a>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {galleryImages.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
            >
              {/* Image */}
              <img
                src={item.image}
                alt={`Instagram post ${item.id}`}
                className="w-full h-full object-cover"
              />

              {/* Hover Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-white"
                >
                  <Heart className="w-6 h-6 fill-white" />
                  <span className="text-lg">{item.likes.toLocaleString()}</span>
                </motion.div>
              </motion.div>

              {/* Decorative Corner */}
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            Tag us in your photos for a chance to be featured!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-white border-2 border-[#D4AF37] text-[#D4AF37] rounded-full hover:bg-[#D4AF37] hover:text-white transition-colors shadow-md"
          >
            View on Instagram
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
