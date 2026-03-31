import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sophia Martinez',
    role: 'Fashion Blogger',
    image: 'https://images.unsplash.com/photo-1590905775253-a4f0f3c426ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRlc3RpbW9uaWFsJTIwcG9ydHJhaXQlMjBzbWlsZXxlbnwxfHx8fDE3NzQyNzQ0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    review: 'LUXE has completely transformed my wardrobe. The quality is exceptional and the designs are absolutely stunning!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Emma Johnson',
    role: 'Marketing Director',
    image: 'https://images.unsplash.com/photo-1590905775253-a4f0f3c426ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRlc3RpbW9uaWFsJTIwcG9ydHJhaXQlMjBzbWlsZXxlbnwxfHx8fDE3NzQyNzQ0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    review: 'I love how every piece makes me feel confident and beautiful. The attention to detail is remarkable.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Isabella Chen',
    role: 'Entrepreneur',
    image: 'https://images.unsplash.com/photo-1590905775253-a4f0f3c426ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRlc3RpbW9uaWFsJTIwcG9ydHJhaXQlMjBzbWlsZXxlbnwxfHx8fDE3NzQyNzQ0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    review: 'Finally found a brand that understands modern women. Elegant, trendy, and comfortable all at once!',
    rating: 5,
  },
];

export function Testimonials() {
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
            TESTIMONIALS
          </motion.span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#1A1A1A]">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Join thousands of satisfied customers who love their LUXE experience
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="relative"
            >
              {/* Card */}
              <div className="bg-gradient-to-br from-[#FFF0F5] to-white p-8 rounded-3xl shadow-lg border border-[#FFD6E8]/30 relative overflow-hidden">
                {/* Quote Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="absolute top-6 right-6 opacity-10"
                >
                  <Quote className="w-20 h-20 text-[#D4AF37]" />
                </motion.div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                    >
                      <Star className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
                    </motion.div>
                  ))}
                </div>

                {/* Review */}
                <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                  "{testimonial.review}"
                </p>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-[#FFD6E8] to-transparent mb-6" />

                {/* Author */}
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#FFD6E8] ring-offset-2">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                  <div>
                    <h4 className="text-[#1A1A1A] mb-1">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>

                {/* Decorative Circle */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#FFD6E8] to-[#E6E6FA] rounded-full opacity-20 blur-2xl" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: '50K+', label: 'Happy Customers' },
            { number: '98%', label: 'Satisfaction Rate' },
            { number: '1000+', label: 'Products' },
            { number: '24/7', label: 'Support' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="font-serif text-3xl sm:text-4xl text-[#D4AF37] mb-2">
                {stat.number}
              </div>
              <div className="text-sm sm:text-base text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
