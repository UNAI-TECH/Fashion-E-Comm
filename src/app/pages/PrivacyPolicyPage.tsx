import { Link } from 'react-router';
import { Eye, FileText, Lock, X } from 'lucide-react';
import { Footer } from '../components/Footer';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-4 sm:px-6">
        <div className="flex-1 flex justify-start">
          <Link to="/" className="h-16 sm:h-20 overflow-visible flex items-center">
            <img
              src="/media__1785326482299.jpg"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left mix-blend-multiply contrast-125 drop-shadow-md scale-125 origin-left"
            />
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl sm:text-2xl font-black font-serif text-gray-900 tracking-wide uppercase">Privacy Policy</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Link to="/" className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-gray-700 shadow-sm">
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content Section (Full Screen, No Card) */}
      <main className="pt-28 pb-20 px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
            At Aanya Fashions, we are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner.
          </p>
          <p className="text-sm font-medium text-gray-400 mt-2">Last Updated: August 2, 2026</p>
        </div>

        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-a:text-[#800000] prose-p:text-gray-600">
          
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">1. Information We Collect</h2>
            </div>
            <p>
              When you visit our website, register an account, or place an order, we may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
              <li><strong>Personal Identification Information:</strong> Name, email address, phone number, and shipping/billing address.</li>
              <li><strong>Payment Information:</strong> Credit card details, UPI IDs, or other payment data (processed securely via our encrypted payment gateways).</li>
              <li><strong>Browsing Data:</strong> IP addresses, browser types, and interaction data via cookies to improve your shopping experience.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">2. How We Use Your Information</h2>
            </div>
            <p>
              The information we collect is primarily used to provide, maintain, and improve our services. Specifically, we use your data to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
              <li>Process and fulfill your orders, including sending order confirmations and tracking updates.</li>
              <li>Respond to your customer service requests and support needs.</li>
              <li>Personalize your shopping experience and recommend products that match your style.</li>
              <li>Send promotional emails and exclusive offers (you can opt-out at any time).</li>
              <li>Prevent fraudulent transactions and secure our platform.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">3. Data Protection & Security</h2>
            </div>
            <p>
              We implement a variety of premium security measures to maintain the safety of your personal information. All sensitive payment information is transmitted via Secure Socket Layer (SSL) technology and encrypted into our payment gateway providers' database. Aanya Fashions does not store your direct credit card information on our servers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Sharing Your Information</h2>
            <p>
              We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you (such as courier partners like Delhivery or BlueDart), so long as those parties agree to keep this information confidential.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Cookies Policy</h2>
            <p>
              Cookies are small files that a site or its service provider transfers to your computer's hard drive through your Web browser (if you allow) that enables the site's or service provider's systems to recognize your browser and capture and remember certain information. We use cookies to help us remember and process the items in your shopping cart and understand and save your preferences for future visits.
            </p>
          </section>

          <section className="mb-12 border-t border-gray-100 pt-12">
            <h2 className="text-2xl font-bold mb-4">Contacting Us</h2>
            <p>
              If there are any questions regarding this privacy policy, you may contact us using the information below:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl mt-6 max-w-sm border border-gray-100">
              <p className="font-bold text-gray-900 mb-1">Aanya Fashions</p>
              <p className="text-gray-600">123, Fashion Street</p>
              <p className="text-gray-600">Mumbai - 400050, India</p>
              <p className="text-gray-600 mt-4"><strong>Email:</strong> owner@aanyafashions.com</p>
              <p className="text-gray-600"><strong>Phone:</strong> +91 88382 26394</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
