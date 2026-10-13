import { Link } from 'react-router';
import { ShieldAlert, BookOpen, Truck, Scale, RefreshCcw, X, CreditCard, ShieldCheck } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEOHead, getBreadcrumbSchema } from '../components/SEOHead';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Terms & Conditions - Aanya Fashions"
        description="Review the terms and conditions for shopping at Aanya Fashions. Understand our policies on ordering, pricing, shipping, cancellations, refunds, and secure payments via Razorpay."
        canonicalUrl="/terms"
        keywords="terms and conditions, user agreement, store policy, aanya fashions terms, razorpay terms"
        structuredData={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Terms & Conditions', url: '/terms' }
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
          <h1 className="text-lg sm:text-2xl font-black font-serif text-gray-900 tracking-wide uppercase">Terms & Conditions</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Link to="/" className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-gray-700 shadow-sm" aria-label="Close">
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content Section */}
      <main className="pt-28 pb-20 px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
            Welcome to Aanya Fashions. By accessing or using our website, placing an order, or utilizing our services, you agree to be bound by these Terms & Conditions, our <Link to="/privacy" className="text-[#698156] underline font-semibold">Privacy Policy</Link>, <Link to="/shipping-policy" className="text-[#698156] underline font-semibold">Shipping Policy</Link>, and <Link to="/refund-policy" className="text-[#698156] underline font-semibold">Cancellation & Refund Policy</Link>.
          </p>
          <p className="text-sm font-medium text-gray-400 mt-2">Last Updated: October 2026 · Governing Entity: Aanya Fashions, Chennai, Tamil Nadu</p>
        </div>

        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-a:text-[#698156] prose-p:text-gray-600">
          
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">1. General Overview & Agreement</h2>
            </div>
            <p>
              This website is operated by <strong>Aanya Fashions</strong>. Throughout the site, the terms "we", "us" and "our" refer to Aanya Fashions. We offer this website, including all information, tools, and e-commerce services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
            </p>
            <p className="mt-4">
              By visiting our site and/or purchasing an item, you engage in our "Service" and agree to be bound by the following terms and conditions. These terms apply to all users of the site, including browsers, customers, and merchants.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">2. Products, Pricing & Accuracy of Information</h2>
            </div>
            <p>
              All products listed on our platform are described as accurately as possible. The prices displayed on our website are quoted in <strong>Indian Rupees (INR)</strong> and are inclusive of all applicable Goods and Services Tax (GST).
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
              <li>Prices for our products are subject to change without prior notice.</li>
              <li>We reserve the right to limit the sales of our products to any person, geographic region, or jurisdiction.</li>
              <li>While we strive to display fabric colors as accurately as possible, slight variations may occur due to screen calibration and studio lighting.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">3. Payment Processing via Razorpay</h2>
            </div>
            <p>
              We provide safe, encrypted online payment processing through <strong>Razorpay Payment Gateway</strong> (Razorpay Software Private Limited), an RBI-authorized and PCI-DSS Level 1 compliant gateway provider.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
              <li><strong>Accepted Payment Modes:</strong> Unified Payments Interface (UPI - Google Pay, PhonePe, Paytm, BHIM, Cred), Credit and Debit Cards (Visa, MasterCard, RuPay, Maestro), Net Banking (50+ Indian banks), and Cash on Delivery (COD).</li>
              <li><strong>Data Security:</strong> Aanya Fashions does not capture or store card details, CVVs, or online banking passwords on our servers. All sensitive financial transactions are directly processed via Razorpay's 256-bit encrypted secure servers.</li>
              <li><strong>Transaction Failures:</strong> In case an amount is debited from your bank account but an order confirmation is not generated due to network disruption, Razorpay's auto-reversal system refunds the sum within 24 to 48 banking hours.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">4. Shipping & Delivery</h2>
            </div>
            <p>
              We deliver across 25,000+ PIN codes in India through top logistics partners like Delhivery, BlueDart, DTDC, and India Post. Orders are dispatched within 24–48 hours and typically delivered within 3–7 business days. For detailed timelines, tracking procedures, and delivery guidelines, please refer to our full <Link to="/shipping-policy" className="text-[#698156] font-semibold underline">Shipping & Delivery Policy</Link>.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">5. Cancellations, Returns & Refunds</h2>
            </div>
            <p>
              We offer a straightforward <strong>7-day return policy</strong> from the date of delivery for unworn, unused apparel with original tags and packaging intact. You may also cancel your order anytime before dispatch for a 100% full immediate refund. Approved refunds are credited directly to your original payment source via Razorpay within <strong>5 to 7 business days</strong>. For detailed conditions and step-by-step procedures, please review our <Link to="/refund-policy" className="text-[#698156] font-semibold underline">Cancellation & Refund Policy</Link>.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">6. User Accounts & Responsibilities</h2>
            </div>
            <p>
              When creating an account on our platform, you are responsible for maintaining the confidentiality of your account credentials and for restricting access to your computer or mobile device. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-12 border-t border-gray-100 pt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">7. Governing Law & Jurisdiction</h2>
            </div>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the <strong>laws of India</strong>. Any dispute, claim, or controversy arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Chennai, Tamil Nadu, India</strong>.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-2xl mt-8 max-w-md border border-gray-200">
              <p className="font-bold text-gray-900 mb-2">Merchant Entity & Customer Grievance</p>
              <p className="text-gray-700 font-semibold">Aanya Fashions</p>
              <p className="text-gray-600 text-sm">Chennai, Tamil Nadu, India</p>
              <p className="text-gray-600 text-sm mt-3"><strong>Email:</strong> owner@aanyafashions.com</p>
              <p className="text-gray-600 text-sm"><strong>Telephone:</strong> +91 90430 88697</p>
              <p className="text-gray-500 text-xs mt-2">Operational Hours: Monday to Saturday, 9:00 AM – 6:00 PM IST</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
