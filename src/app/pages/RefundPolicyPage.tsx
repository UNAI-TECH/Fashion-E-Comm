import { Link } from 'react-router';
import { RefreshCcw, CheckCircle2, Clock, AlertTriangle, ShieldCheck, X, Phone, Mail, HelpCircle, ArrowRight } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEOHead, getBreadcrumbSchema } from '../components/SEOHead';

export function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <SEOHead
        title="Cancellation & Refund Policy - Aanya Fashions"
        description="Review Aanya Fashions Cancellation & Refund Policy. 7-day hassle-free return window, easy order cancellation prior to dispatch, and 5-7 business days refund directly to your original payment method via Razorpay."
        canonicalUrl="/refund-policy"
        keywords="refund policy, cancellation policy, return policy, return window, refund timeline, razorpay refunds, aanya fashions"
        structuredData={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Cancellation & Refund Policy', url: '/refund-policy' }
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
            Cancellation & Refund Policy
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
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#F4F6F2] text-[#698156] border border-[#698156]/20 rounded-full text-xs font-bold tracking-widest uppercase mb-3">
            <RefreshCcw className="w-3.5 h-3.5 text-[#698156]" />
            <span>Customer-First Return & Refund Commitment</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 font-bold mb-3 tracking-tight">
            Cancellation & Refund Policy
          </h2>

          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl">
            At <strong>Aanya Fashions</strong>, we want you to love everything you order. If a piece does not fit or match your expectation, we make cancellations and returns straightforward, transparent, and fair.
          </p>

          <p className="text-xs font-semibold text-gray-400 mt-3">
            Last Updated: October 2026 · Compliant with Indian Consumer Protection (E-Commerce) Rules & RBI Gateway Guidelines
          </p>
        </div>

        {/* Key Guarantees Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-5 bg-[#F9FAF7] rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white text-[#698156] rounded-xl flex items-center justify-center shadow-xs mb-3 border border-gray-100">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Instant Cancellation</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Cancel anytime before your order is dispatched with 100% full refund credited immediately.
            </p>
          </div>

          <div className="p-5 bg-[#F9FAF7] rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-xs mb-3 border border-gray-100">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">7 Days Return Window</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Initiate a return within 7 calendar days of delivery with free doorstep reverse pickup.
            </p>
          </div>

          <div className="p-5 bg-[#F9FAF7] rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-xs mb-3 border border-gray-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">5–7 Days Razorpay Refund</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Refunds are transferred directly to your original source account (UPI / Card / NetBanking) within 5–7 banking days.
            </p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Order Cancellation Policy
              </h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>Cancellation Prior to Dispatch:</strong> Customers can cancel any order free of charge at any time before it has been dispatched from our fulfillment warehouse. You can cancel directly from your <Link to="/orders" className="text-[#698156] font-semibold underline">Orders Page</Link> or by contacting our support team at <a href="mailto:owner@aanyafashions.com" className="text-[#698156] font-semibold underline">owner@aanyafashions.com</a> / <a href="tel:+919043088697" className="text-[#698156] font-semibold underline">+91 90430 88697</a>.
              </p>
              <p>
                Upon cancellation before dispatch, 100% of your paid amount will be refunded immediately without any cancellation fee or deduction.
              </p>
              <p>
                <strong>Cancellation After Dispatch:</strong> Once an order is dispatched and handed over to the courier partner, it cannot be intercepted in transit. In this case, please refuse the package when the courier agent arrives, or receive the package and initiate a return within 7 days under our standard return policy.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                7-Day Return Eligibility & Conditions
              </h3>
            </div>
            <p className="text-gray-600 mb-3">
              To be eligible for a return or replacement, the item must satisfy the following criteria:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5">
                <p className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Eligible for Return
                </p>
                <ul className="text-xs text-emerald-900 space-y-1 pl-4 list-disc">
                  <li>Returned within 7 days of delivery timestamp</li>
                  <li>Unused, unworn, unwashed, and unstained</li>
                  <li>All original brand tags, barcodes & ribbons intact</li>
                  <li>Original fabric packaging & hanger included</li>
                  <li>Defective or wrong item received</li>
                </ul>
              </div>

              <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl space-y-1.5">
                <p className="font-bold text-rose-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Non-Returnable Items
                </p>
                <ul className="text-xs text-rose-900 space-y-1 pl-4 list-disc">
                  <li>Custom stitched blouses or tailored sarees</li>
                  <li>Items damaged due to customer misuse or ironing</li>
                  <li>Items returned with missing tags or altered seams</li>
                  <li>Items marked as "Final Sale" or clearance samples</li>
                  <li>Requests submitted after the 7-day window</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Step-by-Step Return Process
              </h3>
            </div>
            <ol className="space-y-3 text-gray-600 list-decimal pl-5">
              <li>
                <strong>Submit Return Request:</strong> Email us at <a href="mailto:owner@aanyafashions.com" className="text-[#698156] font-semibold underline">owner@aanyafashions.com</a> or message on WhatsApp at <a href="tel:+919043088697" className="text-[#698156] font-semibold underline">+91 90430 88697</a> with your Order ID, reason for return, and 2-3 clear photographs of the product with tags.
              </li>
              <li>
                <strong>Reverse Pickup Arranged:</strong> Once approved, we schedule a free doorstep reverse pickup with our logistics partner (Delhivery/BlueDart) within 24 to 48 hours.
              </li>
              <li>
                <strong>Quality Inspection:</strong> The product arrives at our Chennai central warehouse within 3 to 5 business days, where our quality control team inspects tags and fabric condition.
              </li>
              <li>
                <strong>Instant Refund Initiation:</strong> Upon successful quality check approval, your refund is triggered immediately.
              </li>
            </ol>
          </section>

          {/* Section 4 - Crucial for Razorpay Verification */}
          <section className="p-6 bg-[#F8FBF7] border-2 border-[#698156]/30 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 m-0">
                Refund Method & Processing Timeline
              </h3>
            </div>

            <div className="space-y-4 text-gray-700 text-sm">
              <p>
                In strict compliance with <strong>Reserve Bank of India (RBI)</strong> and <strong>Razorpay Payment Gateway</strong> merchant regulations, all refunds are routed back directly to the original payment instrument used during checkout:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3 sm:p-4">Payment Method Used</th>
                      <th className="p-3 sm:p-4">Refund Destination</th>
                      <th className="p-3 sm:p-4">Settlement Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td className="p-3 sm:p-4 font-semibold text-gray-900">UPI (Google Pay, PhonePe, Paytm, BHIM)</td>
                      <td className="p-3 sm:p-4">Same Linked Bank Account via UPI VPA</td>
                      <td className="p-3 sm:p-4 font-bold text-[#698156]">24 to 48 Hours</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-semibold text-gray-900">Credit / Debit Cards (Visa, Mastercard, RuPay)</td>
                      <td className="p-3 sm:p-4">Original Issuing Card Account</td>
                      <td className="p-3 sm:p-4 font-bold text-[#698156]">5 to 7 Business Days</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-semibold text-gray-900">Net Banking (50+ Indian Banks)</td>
                      <td className="p-3 sm:p-4">Originating Bank Account via Razorpay</td>
                      <td className="p-3 sm:p-4 font-bold text-[#698156]">3 to 5 Business Days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1.5">
                <p className="font-bold text-gray-900">Bank Working Days Notice:</p>
                <p>
                  Saturdays, Sundays, and public bank holidays are not counted as business days. If you do not see the refund credit within 7 business days, please contact our support team along with your Razorpay ARN/RRN number for instant bank tracing.
                </p>
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
                Damaged or Defective Items Guarantee
              </h3>
            </div>
            <p className="text-gray-600">
              Every single outfit at Aanya Fashions goes through a meticulous 3-point quality check before dispatch. However, if you receive an item with a manufacturing defect, missing embellishment, or damage in transit, please notify us within <strong>48 hours of delivery</strong>. We will arrange a complimentary immediate replacement or a 100% full refund including all shipping costs.
            </p>
          </section>

          {/* Customer Care Contact */}
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h4 className="font-serif text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#698156]" /> Questions or Return Requests?
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              Our dedicated customer care desk will resolve your request promptly:
            </p>
            <div className="flex flex-wrap gap-5 text-xs sm:text-sm">
              <a href="tel:+919043088697" className="flex items-center gap-2 font-bold text-gray-900 hover:text-[#698156]">
                <Phone className="w-4 h-4 text-[#698156]" /> +91 90430 88697
              </a>
              <a href="mailto:owner@aanyafashions.com" className="flex items-center gap-2 font-bold text-gray-900 hover:text-[#698156]">
                <Mail className="w-4 h-4 text-[#698156]" /> owner@aanyafashions.com
              </a>
              <span className="text-gray-500 font-medium">
                Operating Hours: Mon – Sat: 9:00 AM – 6:00 PM IST
              </span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
