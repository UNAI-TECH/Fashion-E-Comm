import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, X, Copy, ExternalLink } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';

export function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: 'order',
    message: ''
  });

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('owner@aanyafashions.com');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Form direct mailto trigger so the user's mail client opens pre-filled
    const mailSubject = `[${formData.subject.toUpperCase()}] Inquiry from ${formData.firstName} ${formData.lastName}`;
    const mailBody = `Hello Aanya Fashions Owner,\n\nName: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nTopic: ${formData.subject}\n\nMessage:\n${formData.message}`;
    
    const mailtoUrl = `mailto:owner@aanyafashions.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = mailtoUrl;

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
              className="inline-block px-6 py-2 bg-[#FFF0F5] text-[#D4AF37] border border-[#F5E6BE] rounded-full text-xs font-black tracking-widest uppercase mb-4"
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
              Have a question about our collections or your order? Reach out directly via call, email, or message.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Phone Direct Call Card */}
              <a 
                href="tel:+918838226394"
                className="block bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md hover:border-[#D4AF37]/30 border border-gray-100 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#D4AF37] group-hover:text-white transition-all shadow-sm">
                  <Phone className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2 group-hover:text-[#D4AF37] transition-colors">Direct Call</h3>
                <p className="text-gray-600 mb-3">Mon-Sat from 9am to 6pm. Tap to call directly on mobile.</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-[#D4AF37]">+91 88382 26394</p>
                  <span className="text-xs font-bold text-[#D4AF37] bg-[#FFF0F5] px-3 py-1.5 rounded-full border border-[#F5E6BE] shadow-sm">
                    Tap to Call 📞
                  </span>
                </div>
              </a>

              {/* Direct Email Card */}
              <div 
                className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md hover:border-[#D4AF37]/30 border border-gray-100 transition-all group"
              >
                <div className="w-14 h-14 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#D4AF37] group-hover:text-white transition-all shadow-sm">
                  <Mail className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2 group-hover:text-[#D4AF37] transition-colors">Direct Email</h3>
                <p className="text-gray-600 mb-4">Instant email response from store owner & support team.</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base sm:text-lg font-bold text-[#D4AF37] truncate">owner@aanyafashions.com</p>
                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:owner@aanyafashions.com"
                      className="text-xs font-bold text-[#D4AF37] bg-[#FFF0F5] hover:bg-[#D4AF37] hover:text-white px-3.5 py-1.5 rounded-full border border-[#F5E6BE] transition-all flex items-center gap-1 shadow-sm"
                    >
                      Compose Email ✉️
                    </a>
                    <button
                      onClick={handleCopyEmail}
                      className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                    >
                      {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Store Address & Map Trigger Card */}
              <div 
                onClick={() => setIsMapOpen(true)}
                className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md hover:border-[#D4AF37]/30 border border-gray-100 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#D4AF37] group-hover:text-white transition-all shadow-sm">
                  <MapPin className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2 group-hover:text-[#D4AF37] transition-colors">Store Address</h3>
                <p className="text-gray-600 mb-1">123, Fashion Street, Bandra West</p>
                <p className="text-gray-600 mb-4">Mumbai, Maharashtra 400050</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMapOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] bg-[#FFF0F5] hover:bg-[#D4AF37] hover:text-white px-4 py-2 rounded-full border border-[#F5E6BE] transition-all shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" /> View Map Location 🗺️
                  </button>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Fashion+Street+Bandra+West+Mumbai"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#D4AF37] transition-colors"
                  >
                    Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
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
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all" 
                      placeholder="Jane" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all" 
                    placeholder="jane@example.com" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select 
                    required 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all"
                  >
                    <option value="order">Order Tracking</option>
                    <option value="returns">Returns & Exchanges</option>
                    <option value="wholesale">Wholesale Inquiry</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    required 
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all resize-none" 
                    placeholder="How can we help you?" 
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-[#D4AF37] text-white rounded-full font-medium hover:bg-black transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message ✉️
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Interactive Map Modal Overlay (Only opens when map icon/button is clicked) */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsMapOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">Aanya Fashions Store Map</h3>
                    <p className="text-xs text-gray-500">123, Fashion Street, Bandra West, Mumbai 400050</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMapOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 hover:text-gray-900" />
                </button>
              </div>

              <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                <iframe
                  title="Aanya Fashions Location Map Modal"
                  src="https://maps.google.com/maps?q=19.0556,72.8333&hl=en&z=15&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">Store Hours: Mon-Sat 9:00 AM - 6:00 PM</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Fashion+Street+Bandra+West+Mumbai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] text-white rounded-full text-xs font-bold hover:bg-black transition-colors shadow-sm"
                >
                  Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}