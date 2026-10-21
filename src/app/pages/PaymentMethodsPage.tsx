import { Link } from 'react-router';
import { CreditCard, Wallet, Smartphone, Banknote, ShieldCheck, X } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEOHead, getBreadcrumbSchema } from '../components/SEOHead';

export function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Payment Methods & Safe Checkout"
        description="Learn about the secure payment options accepted at Aanya Fashions, powered by Razorpay including UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking."
        canonicalUrl="/payment-methods"
        keywords="payment methods, razorpay, upi, credit cards, netbanking, secure checkout, aanya fashions payments"
        structuredData={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Payment Methods', url: '/payment-methods' }
        ])}
      />
      
      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-4 sm:px-6">
        <div className="flex-1 flex justify-start">
          <Link to="/" className="h-11 sm:h-12 overflow-visible flex items-center">
            <img
              src="/logo.png"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left"
            />
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl sm:text-2xl font-black font-serif text-gray-900 tracking-wide uppercase">Payment Methods</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Link to="/" className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-gray-700 shadow-sm">
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content Section (Full Screen, No Card) */}
      <main className="pt-28 pb-20 px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-3xl font-serif font-black text-gray-900 mb-4">100% Secure & Trusted Payments</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            At Aanya Fashions, we ensure a seamless, 100% secure checkout experience powered by <strong>Razorpay Payment Gateway</strong>, India's leading PCI-DSS Level 1 certified gateway. We support all major Indian and international payment options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-12">
          
          {/* UPI Apps */}
          <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 m-0">UPI & Wallets</h3>
            </div>
            <p className="text-gray-600 mb-6">Experience lightning-fast payments using your favorite UPI apps. Zero transaction fees and instant confirmation.</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-800 flex items-center gap-2 shadow-sm">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 object-contain" /> UPI
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-800 flex items-center gap-2 shadow-sm">
                <img src="https://cdn.simpleicons.org/googlepay" alt="GPay" className="h-4 object-contain" /> GPay
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-800 flex items-center gap-2 shadow-sm">
                <img src="https://cdn.simpleicons.org/phonepe/5F259F" alt="PhonePe" className="h-5 object-contain" /> PhonePe
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-800 flex items-center gap-2 shadow-sm">
                <img src="https://cdn.simpleicons.org/paytm/00B9F5" alt="Paytm" className="h-3 object-contain" /> Paytm
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-800 flex items-center gap-2 shadow-sm">
                <img src="https://cdn.simpleicons.org/amazon/FF9900" alt="Amazon Pay" className="h-4 object-contain" /> Amazon Pay
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-purple-50/50 border border-purple-100 p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 m-0">Credit & Debit Cards</h3>
            </div>
            <p className="text-gray-600 mb-6">We accept all major domestic and international credit and debit cards. Processed via 256-bit AES encryption.</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center min-w-[80px]">
                <img src="https://cdn.simpleicons.org/visa/1434CB" alt="Visa" className="h-4 object-contain" />
              </div>
              <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center min-w-[80px]">
                <img src="https://cdn.simpleicons.org/mastercard" alt="Mastercard" className="h-6 object-contain" />
              </div>
              <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center min-w-[80px]">
                <img src="/payment-logos/rupay.png" alt="RuPay" className="h-5 object-contain" />
              </div>
              <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center min-w-[80px]">
                <img src="https://cdn.simpleicons.org/americanexpress/227FBB" alt="Amex" className="h-5 object-contain" />
              </div>
            </div>
          </div>

          {/* Net Banking */}
          <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 m-0">Net Banking</h3>
            </div>
            <p className="text-gray-600 mb-6">Directly pay from your bank account. We support over 50+ major Indian banks for a seamless checkout.</p>
            <ul className="text-gray-600 space-y-2 font-medium">
              <li>• HDFC Bank</li>
              <li>• State Bank of India (SBI)</li>
              <li>• ICICI Bank</li>
              <li>• Axis Bank</li>
              <li>• Kotak Mahindra Bank</li>
              <li className="text-sm text-gray-400 italic">...and 45+ other banks</li>
            </ul>
          </div>

          {/* Razorpay 100% Secure Gateway */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 m-0">100% Secure Razorpay Checkout</h3>
            </div>
            <p className="text-gray-600 mb-4">All orders are safely processed through Razorpay's RBI-compliant, 256-bit encrypted payment infrastructure.</p>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 text-sm mb-2">Checkout Assurance:</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Instant order confirmation & payment receipt.</li>
                <li>• Multi-factor 3D Secure verification for card transactions.</li>
                <li>• Zero convenience fee on all UPI & online payment modes.</li>
              </ul>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
