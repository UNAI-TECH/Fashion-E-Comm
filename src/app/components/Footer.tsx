import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Instagram, Facebook, Heart, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  const footerLinks = {
    quickLinks: [
      { name: 'Home', path: '/' },
      { name: 'Sarees Collection', path: '/category/sarees' },
      { name: 'About Us', path: '/about' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Track Order', path: '/orders' },
    ],
    helpSupport: [
      { name: 'Terms & Conditions', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Shipping & Delivery', path: '/shipping-policy' },
      { name: 'Cancellation & Refund', path: '/refund-policy' },
      { name: 'Payment Methods', path: '/payment-methods' },
    ]
  };

  const socialLinks = [
    {
      icon: Instagram,
      href: 'https://www.instagram.com/aanya.style',
      label: 'Instagram'
    },
    {
      icon: Facebook,
      href: 'https://www.facebook.com/profile.php?id=61574236752445',
      label: 'Facebook'
    }
  ];

  return (
    <footer className="w-full bg-[#FAFBF9] border-t border-gray-200/80 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
          
          {/* Brand & Socials Column */}
          <div className="col-span-2 md:col-span-2 flex flex-col items-start space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/logo.png"
                alt="Aanya Fashions Logo"
                className="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              Authentic Indian sarees crafted with pure silk, traditional weaves, and timeless craftsmanship. Delivered direct to your doorstep across India.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-[#698156] hover:text-white hover:border-[#698156] text-gray-600 transition-all duration-200 active:scale-95 shadow-2xs"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-2.5">
            <h4 className="text-[11px] font-bold text-gray-900 tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-1.5">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs text-gray-600 hover:text-[#698156] transition-colors inline-block hover:translate-x-0.5 duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Policies / Help */}
          <div className="col-span-1 space-y-2.5">
            <h4 className="text-[11px] font-bold text-gray-900 tracking-wider uppercase">
              Help & Support
            </h4>
            <ul className="space-y-1.5">
              {footerLinks.helpSupport.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs text-gray-600 hover:text-[#698156] transition-colors inline-block hover:translate-x-0.5 duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="col-span-2 sm:col-span-1 space-y-2.5">
            <h4 className="text-[11px] font-bold text-gray-900 tracking-wider uppercase">
              Contact Us
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="tel:+919043088697"
                className="flex items-center gap-2 text-gray-600 hover:text-[#698156] transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-[#698156] group-hover:bg-[#698156] group-hover:text-white transition-colors">
                  <Phone className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="font-semibold text-gray-800">+91 90430 88697</span>
              </a>

              <a
                href="mailto:owner@aanyafashions.com"
                className="flex items-center gap-2 text-gray-600 hover:text-[#698156] transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-[#698156] group-hover:bg-[#698156] group-hover:text-white transition-colors">
                  <Mail className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="truncate text-gray-700">owner@aanyafashions.com</span>
              </a>

              <div className="flex items-start gap-2 text-gray-600">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-[#698156] mt-0.5">
                  <MapPin className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="text-gray-600 leading-tight">Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Bottom Copyright Bar */}
      <div className="bg-[#F0F3ED] border-t border-gray-200/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p className="text-[11px] sm:text-xs font-medium text-center sm:text-left">
            © 2026 Aanya Fashions. All rights reserved.
          </p>

          {/* Crafted by UNAI TECH */}
          <a
            href="https://www.unaitech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 hover:text-black transition-colors group"
            title="Crafted by UNAI TECH - https://www.unaitech.com/"
          >
            <span>Crafted by</span>
            <span className="font-extrabold tracking-wider text-black">UNAI TECH</span>
            <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-black transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}
