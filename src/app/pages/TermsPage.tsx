import { Link } from 'react-router';
import { ShieldAlert, BookOpen, Truck, Scale, RefreshCcw, X, CreditCard } from 'lucide-react';
import { Footer } from '../components/Footer';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      
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
          <h1 className="text-xl sm:text-2xl font-black font-serif text-gray-900 tracking-wide uppercase">Terms & Conditions</h1>
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
            Welcome to Aanya Fashions. By accessing or using our website, you agree to be bound by these Terms & Conditions and our Privacy Policy.
          </p>
          <p className="text-sm font-medium text-gray-400 mt-2">Last Updated: August 2, 2026</p>
        </div>

        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-a:text-[#698156] prose-p:text-gray-600">
          
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">1. General Overview</h2>
            </div>
            <p>
              This website is operated by Aanya Fashions. Throughout the site, the terms "we", "us" and "our" refer to Aanya Fashions. We offer this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
            </p>
            <p className="mt-4">
              We reserve the right to update, change, or replace any part of these Terms of Service by posting updates and/or changes to our website. It is your responsibility to check this page periodically for changes.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">2. Products & Pricing</h2>
            </div>
            <p>
              We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. However, we cannot guarantee that your computer monitor's display of any color will be completely accurate.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
              <li>Prices for our products are subject to change without notice.</li>
              <li>We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.</li>
              <li>All descriptions of products or product pricing are subject to change at anytime without notice, at the sole discretion of us.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">3. Shipping & Delivery</h2>
            </div>
            <p>
              We strive to deliver products purchased from Aanya Fashions in excellent condition and in the fastest time possible. 
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
              <li>Estimated delivery times are provided as guidelines only and do not take into account possible delays caused by payment authorization or courier issues.</li>
              <li>We are not responsible for delays outside our control, but we will contact you as soon as possible to let you know and will take steps to minimize the effect of the delay.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">4. Returns & Refunds</h2>
            </div>
            <p>
              Our refund and returns policy lasts 7 days from the date of delivery. If 7 days have passed since your purchase was delivered, we can’t offer you a full refund or exchange.
            </p>
            <p className="mt-4">
              To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging with all original tags attached. Custom-fitted garments or items marked "Final Sale" are not eligible for returns.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">5. User Accounts & Security</h2>
            </div>
            <p>
              If you create an account on our website, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account. You must immediately notify us of any unauthorized uses of your account or any other breaches of security.
            </p>
          </section>

          <section className="mb-12 border-t border-gray-100 pt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold m-0">6. Governing Law</h2>
            </div>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-xl mt-8 max-w-sm border border-gray-100">
              <p className="font-bold text-gray-900 mb-2">Legal Entity Contact</p>
              <p className="text-gray-600">Aanya Fashions</p>
              <p className="text-gray-600">Chennai, Tamil Nadu, India</p>
              <p className="text-gray-600 mt-4"><strong>Email:</strong> owner@aanyafashions.com</p>
              <p className="text-gray-600"><strong>Phone:</strong> +91 90430 88697</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
