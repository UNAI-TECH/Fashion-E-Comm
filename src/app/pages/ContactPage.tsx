import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';

export function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <AnnouncementBar />
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-block px-6 py-2 bg-[#FFF0F5] text-[#D4AF37] rounded-full text-sm tracking-wider mb-4"
            >
              GET IN TOUCH
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] mb-4"
            >
              We'd love to hear from you
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 max-w-2xl mx-auto text-lg"
            >
              Have a question about our collections or your order? Fill out the form below or reach us directly.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#FFF0F5] rounded-full flex items-center justify-center mb-6 text-[#D4AF37]">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2">Phone</h3>
                <p className="text-gray-600 mb-2">Mon-Sat from 9am to 6pm.</p>
                <p className="text-lg font-medium text-[#D4AF37]">+91 98765 43210</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#FFF0F5] rounded-full flex items-center justify-center mb-6 text-[#D4AF37]">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2">Email</h3>
                <p className="text-gray-600 mb-2">We'll respond within 24 hours.</p>
                <p className="text-lg font-medium text-[#D4AF37]">support@aanyafashions.in</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#FFF0F5] rounded-full flex items-center justify-center mb-6 text-[#D4AF37]">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2">Store Address</h3>
                <p className="text-gray-600 mb-1">123, Fashion Street, Bandra West</p>
                <p className="text-gray-600">Mumbai, Maharashtra 400050</p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 sm:p-10 rounded-3xl shadow-lg relative overflow-hidden"
            >
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 right-0 bg-green-500 text-white p-4 flex items-center justify-center gap-2 z-10"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Message sent successfully! We'll get back to you soon.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <h2 className="font-serif text-3xl text-[#1A1A1A] mb-8">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all" 
                      placeholder="Jane" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all" 
                      placeholder="Doe" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all" 
                    placeholder="jane@example.com" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order Tracking</option>
                    <option value="returns">Returns & Exchanges</option>
                    <option value="wholesale">Wholesale Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    required 
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all resize-none" 
                    placeholder="How can we help you?" 
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-full font-medium hover:bg-black transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}