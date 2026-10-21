import { Link } from 'react-router';
import { Truck, Clock, ShieldCheck, MapPin, Package, AlertCircle, X, HelpCircle, Phone, Mail } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEOHead, getBreadcrumbSchema } from '../components/SEOHead';

export function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <SEOHead
        title="Shipping & Delivery Policy - Aanya Fashions"
        description="Read Aanya Fashions Shipping and Delivery Policy. Pan-India shipping to 25,000+ pincodes, standard delivery within 3-7 business days, free shipping on prepaid orders, and live tracking."
        canonicalUrl="/shipping-policy"
        keywords="shipping policy, delivery time, courier partners, free shipping, pan india delivery, aanya fashions shipping"
        structuredData={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Shipping Policy', url: '/shipping-policy' }
        ])}
      />

      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100 h-16 flex items-center px-4 sm:px-6">
        <div className="flex-1 flex justify-start">
          <Link to="/" className="h-11 sm:h-12 overflow-visible flex items-center">
            <img
              src="/logo.png"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left mix-blend-multiply"
            />
          </Link>
        </div>
        <div className="flex-1 flex justify-center text-center">
          <h1 className="text-base sm:text-xl font-black font-serif text-gray-900 tracking-wider uppercase">
            Shipping & Delivery Policy
          </h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Link
            to="/"
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-gray-700 shadow-xs cursor-pointer active:scale-95"
            aria-label="Close and return to store"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6 sm:px-10 lg:px-20 max-w-5xl mx-auto">
        {/* Intro Banner */}
        <div className="mb-12 border-b border-gray-100 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#F4F6F2] text-[#698156] border border-[#698156]/20 rounded-full text-xs font-bold tracking-widest uppercase mb-3">
            <Truck className="w-3.5 h-3.5 text-[#698156]" />
            <span>Reliable Pan-India Fulfillment</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 font-bold mb-3 tracking-tight">
            Shipping & Delivery Policy
          </h2>

          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl">
            At <strong>Aanya Fashions</strong>, we are committed to delivering your handcrafted sarees, kurtis, lehengas, and western apparel in impeccable condition, right on time across all regions of India.
          </p>

          <p className="text-xs font-semibold text-gray-400 mt-3">
            Last Updated: October 2026 · Standard E-Commerce Compliance & Logistics Guidelines
          </p>
        </div>

        {/* Highlights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-5 bg-[#F9FAF7] rounded-2xl border border-gray-100 flex items-start gap-3.5">
            <div className="p-2.5 bg-white text-[#698156] rounded-xl shadow-xs border border-gray-100 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">24–48 Hours Dispatch</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Orders are thoroughly inspected, packed securely, and handed over to our courier partner within 1-2 business days.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#F9FAF7] rounded-2xl border border-gray-100 flex items-start gap-3.5">
            <div className="p-2.5 bg-white text-emerald-600 rounded-xl shadow-xs border border-gray-100 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">3–7 Days Delivery</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Metro cities usually arrive in 2–4 business days. Non-metro & rural pin codes arrive in 4–7 business days.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#F9FAF7] rounded-2xl border border-gray-100 flex items-start gap-3.5">
            <div className="p-2.5 bg-white text-blue-600 rounded-xl shadow-xs border border-gray-100 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">100% Insured Transit</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                All shipments are tamper-proof sealed and insured against loss or damage during transit until safe delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Shipping Locations & Serviceable Area
              </h3>
            </div>
            <p className="text-gray-600">
              We ship to over <strong>25,000+ PIN codes</strong> across India covering all states and union territories. If your location is temporarily unserviceable by our primary courier partners due to remote accessibility or local restrictions, our support team will reach out to arrange alternate postal delivery via India Post Speed Post.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Delivery Timelines & Estimation
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Estimated delivery times depend on your geographical location in India:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5 sm:p-4">Destination Region</th>
                    <th className="p-3.5 sm:p-4">Dispatch Window</th>
                    <th className="p-3.5 sm:p-4">Expected Delivery Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-medium text-gray-900">Tamil Nadu & South India</td>
                    <td className="p-3.5 sm:p-4">Within 24 Hours</td>
                    <td className="p-3.5 sm:p-4 text-[#698156] font-semibold">2 – 3 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-medium text-gray-900">Tier-1 Metros (Mumbai, Delhi-NCR, Bangalore, Hyderabad, Kolkata)</td>
                    <td className="p-3.5 sm:p-4">24 – 48 Hours</td>
                    <td className="p-3.5 sm:p-4 text-[#698156] font-semibold">3 – 4 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-medium text-gray-900">Rest of India (Tier 2 & Tier 3 Cities)</td>
                    <td className="p-3.5 sm:p-4">24 – 48 Hours</td>
                    <td className="p-3.5 sm:p-4 text-[#698156] font-semibold">4 – 6 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-medium text-gray-900">Remote / North-East / Island Regions</td>
                    <td className="p-3.5 sm:p-4">24 – 48 Hours</td>
                    <td className="p-3.5 sm:p-4 text-gray-700 font-semibold">5 – 8 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              * Note: National holidays, strikes, severe weather conditions, or local logistical delays may occasionally extend delivery times.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Shipping Charges & Free Delivery
              </h3>
            </div>
            <ul className="space-y-2.5 text-gray-600 list-disc pl-5">
              <li>
                <strong>Free Shipping:</strong> We provide <strong>100% Free Standard Delivery</strong> on all prepaid online orders (UPI, Credit/Debit Cards, Net Banking via Razorpay) across India.
              </li>
              <li>
                <strong>Instant Dispatch:</strong> All verified prepaid orders via Razorpay receive prioritized processing and expedited warehouse dispatch within 24 hours.
              </li>
              <li>
                <strong>No Hidden Charges:</strong> The price displayed at the final checkout screen is completely all-inclusive (inclusive of applicable GST and freight).
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Order Tracking & Notifications
              </h3>
            </div>
            <p className="text-gray-600 mb-3">
              As soon as your package is dispatched from our fulfillment center in Chennai, you will receive:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <Package className="w-5 h-5 text-[#698156] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900 text-sm">SMS & Email Tracking Link</strong>
                  <span className="text-xs text-gray-600">Direct courier tracking URL and AWB consignment number to track live movement.</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#698156] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900 text-sm">Account Order Dashboard</strong>
                  <span className="text-xs text-gray-600">Track status anytime directly from our website under <Link to="/orders" className="text-[#698156] underline font-semibold">Track Order</Link>.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                5
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Verified Courier Partners
              </h3>
            </div>
            <p className="text-gray-600 mb-3">
              We collaborate with premier national logistics providers to ensure timely and professional doorstep delivery:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {['BlueDart Express', 'Delhivery', 'DTDC Courier', 'XpressBees', 'India Post (Speed Post)'].map((partner) => (
                <span key={partner} className="px-3.5 py-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                  ✓ {partner}
                </span>
              ))}
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                6
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Damaged or Tampered Package on Delivery
              </h3>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm space-y-2">
              <p className="font-semibold flex items-center gap-2 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700" /> Important Delivery Inspection Notice
              </p>
              <p>
                If the outer packaging appears torn, tampered with, or unsealed upon delivery, <strong>please refuse to accept the delivery</strong> and write "Refused due to tampering" on the delivery sheet or acknowledge via OTP only after inspection.
              </p>
              <p>
                Immediately notify our support team at <a href="mailto:owner@aanyafashions.com" className="underline font-bold">owner@aanyafashions.com</a> or call <a href="tel:+919043088697" className="underline font-bold">+91 90430 88697</a> with a photograph of the parcel within 24 hours so we can promptly ship a replacement or process a refund.
              </p>
            </div>
          </section>

          {/* Section 7 - Contact Support */}
          <section className="bg-[#F8FBF7] p-6 rounded-2xl border border-[#698156]/20">
            <h4 className="font-serif text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#698156]" /> Need Help with an Existing Shipment?
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              Our fulfillment desk is active Monday through Saturday, 9:00 AM to 6:00 PM IST.
            </p>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
              <a href="tel:+919043088697" className="flex items-center gap-2 font-bold text-gray-900 hover:text-[#698156]">
                <Phone className="w-4 h-4 text-[#698156]" /> +91 90430 88697
              </a>
              <a href="mailto:owner@aanyafashions.com" className="flex items-center gap-2 font-bold text-gray-900 hover:text-[#698156]">
                <Mail className="w-4 h-4 text-[#698156]" /> owner@aanyafashions.com
              </a>
              <span className="text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> Chennai, Tamil Nadu, India
              </span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
