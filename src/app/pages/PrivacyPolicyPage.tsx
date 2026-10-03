import { Link } from 'react-router';
import { Eye, FileText, Lock, X, Phone, Mail, MapPin, ShieldCheck, CheckCircle2, Instagram } from 'lucide-react';
import { Footer } from '../components/Footer';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
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
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg sm:text-xl font-black font-serif text-gray-900 tracking-wider uppercase">
            Privacy Policy
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
        {/* Intro */}
        <div className="mb-12 border-b border-gray-100 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F6F2] text-[#698156] border border-[#698156]/15 rounded-full text-xs font-bold tracking-widest uppercase mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#698156]" />
            <span>Aanya Fashions Privacy Commitment</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 font-bold mb-3 tracking-tight">
            Your Privacy Matters to Us
          </h2>

          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl">
            Welcome to <strong>Aanya Fashions</strong> (Chennai, Tamil Nadu). We cherish the trust you place in us when shopping for our sarees, kurtis, lehengas, and festive wear collections. This Privacy Policy describes how we collect, use, and safeguard your personal details across our platform.
          </p>

          <p className="text-xs font-semibold text-gray-400 mt-3">
            Last Updated: September 2026 · Compliant with Indian Information Technology Act & SPDI Rules
          </p>
        </div>

        <div className="space-y-12 text-gray-700 leading-relaxed text-sm sm:text-base">
          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900 m-0">
                1. Information We Collect
              </h3>
            </div>
            <p>
              When you browse our storefront, create an account, purchase products, or interact with our customer care, we may collect the following information:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 mt-4 list-none p-0">
              <li className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block text-sm mb-1 font-serif">Customer Identification</strong>
                <span className="text-xs text-gray-600">Your full name, email address, contact telephone number, and delivery/billing address.</span>
              </li>
              <li className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block text-sm mb-1 font-serif">Payment & Billing</strong>
                <span className="text-xs text-gray-600">Encrypted payment verification data. All transactions are handled via RBI-authorized, PCI-DSS compliant Indian payment gateways (UPI, Cards, NetBanking, COD).</span>
              </li>
              <li className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block text-sm mb-1 font-serif">Order Details</strong>
                <span className="text-xs text-gray-600">Product choices, sizing selections, delivery status, order history, and saved wishlist items.</span>
              </li>
              <li className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block text-sm mb-1 font-serif">Device & Analytics</strong>
                <span className="text-xs text-gray-600">IP address, browser type, interaction preferences, and session data to optimize loading speed and user experience.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900 m-0">
                2. How We Use Your Information
              </h3>
            </div>
            <p>
              We use the collected information exclusively to provide a seamless, personalized luxury shopping experience:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-gray-600">
              <li>Process, package, and dispatch your orders from our fulfillment center in Chennai, Tamil Nadu.</li>
              <li>Send real-time order confirmations, shipment tracking links, and delivery notifications via SMS and email.</li>
              <li>Provide responsive customer support for inquiries, customized stitching requests, and order assistance.</li>
              <li>Recommend festive new arrivals, trending sarees, and special collections tailored to your fashion preferences.</li>
              <li>Detect and prevent suspicious activities, duplicate transactions, and platform security threats.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900 m-0">
                3. Data Security & Storage
              </h3>
            </div>
            <p>
              At Aanya Fashions, protecting your personal data is a top priority. We implement robust physical, administrative, and technological security safeguards:
            </p>
            <div className="mt-4 p-5 bg-[#F4F6F2]/50 border border-[#698156]/10 rounded-2xl space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#698156] flex-shrink-0 mt-0.5" />
                <span><strong>SSL Encryption:</strong> All data transmitted between your browser and our servers is secured using modern 256-bit SSL encryption.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#698156] flex-shrink-0 mt-0.5" />
                <span><strong>Zero Sensitive Card Retention:</strong> We never store CVVs, credit/debit card numbers, or UPI PINs on our servers.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#698156] flex-shrink-0 mt-0.5" />
                <span><strong>Secure Cloud Database:</strong> Customer accounts and records are stored within protected, authenticated Supabase cloud infrastructure.</span>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-3">
              4. Sharing With Third Parties
            </h3>
            <p>
              We do not sell, rent, or trade your personal information to marketing brokers or unauthorized third parties. Information is only shared with trusted service providers essential to running our business:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-gray-600">
              <li><strong>Logistics & Courier Partners:</strong> Leading logistics providers (e.g., Delhivery, Blue Dart, DTDC, India Post) to ensure safe doorstep delivery across India.</li>
              <li><strong>Payment Processors:</strong> Certified payment gateways to authenticate transactions and prevent fraud.</li>
              <li><strong>Legal Authorities:</strong> When required by applicable Indian law, court order, or to protect the rights and safety of our customers and business.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-3">
              5. Cookies & Tracking
            </h3>
            <p>
              We use functional cookies to remember items in your shopping cart, preserve your login session, and understand how visitors interact with our site. You can choose to disable cookies through your browser settings; however, certain features (like maintaining items in your cart) may not function as smoothly.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-3">
              6. Your Privacy Rights & Choices
            </h3>
            <p>
              You have the right to access, review, modify, or request deletion of your personal account information. If you wish to unsubscribe from our newsletter, update your delivery address, or delete your account, you can reach out directly to our support team using the details below.
            </p>
          </section>

          {/* Section 7 - Contact & Grievance Redressal */}
          <section className="pt-8 border-t border-gray-200">
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              7. Contact Us & Grievance Redressal
            </h3>
            <p className="text-gray-600 mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our team:
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {/* Phone */}
              <a
                href="tel:+919043088697"
                className="p-5 bg-gradient-to-br from-[#FFFDFC] to-[#FFF9F9] rounded-2xl border border-gray-200/80 shadow-xs hover:border-[#698156]/30 hover:shadow-md transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4F6F2] text-[#698156] flex items-center justify-center mb-3 group-hover:bg-[#698156] group-hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                <p className="text-base font-bold text-gray-900 mt-0.5 group-hover:text-[#698156] transition-colors">
                  +91 90430 88697
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Mon – Sat, 9:00 AM – 7:00 PM</p>
              </a>

              {/* Email */}
              <a
                href="mailto:owner@aanyafashions.com"
                className="p-5 bg-gradient-to-br from-[#FFFDFC] to-[#FFF9F9] rounded-2xl border border-gray-200/80 shadow-xs hover:border-[#698156]/30 hover:shadow-md transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4F6F2] text-[#698156] flex items-center justify-center mb-3 group-hover:bg-[#698156] group-hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-base font-bold text-gray-900 mt-0.5 group-hover:text-[#698156] transition-colors truncate">
                  owner@aanyafashions.com
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Direct Owner & Support Team</p>
              </a>

              {/* Address */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Chennai+Tamil+Nadu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 bg-gradient-to-br from-[#FFFDFC] to-[#FFF9F9] rounded-2xl border border-gray-200/80 shadow-xs hover:border-[#698156]/30 hover:shadow-md transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4F6F2] text-[#698156] flex items-center justify-center mb-3 group-hover:bg-[#698156] group-hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Headquarters</p>
                <p className="text-base font-bold text-gray-900 mt-0.5 group-hover:text-[#698156] transition-colors">
                  Chennai, Tamil Nadu
                </p>
                <p className="text-[11px] text-gray-500 mt-1">India · Click to view on map</p>
              </a>
            </div>

            {/* Legal Entity Note */}
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-600">
              <span><strong>Brand:</strong> Aanya Fashions · Chennai, Tamil Nadu, India</span>
              <a
                href="https://www.instagram.com/aanya.style?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#698156] hover:underline"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>@aanya.style</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
