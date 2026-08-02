import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Instagram, Facebook, Youtube, Heart, Tag, Award, Headphones, Lock } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {

  const trustIndicators = [
    {
      icon: Tag,
      title: 'EXCLUSIVE OFFERS',
      desc: 'Get exciting discounts on your favorite styles'
    },
    {
      icon: Award,
      title: 'PREMIUM QUALITY',
      desc: 'Best quality products for you'
    },
    {
      icon: Lock,
      title: 'SECURE SHOPPING',
      desc: 'Safe & secure payments for a worry-free shopping'
    }
  ];

  const footerLinks = {
    quickLinks: [
      { name: 'Home', path: '/' },
      { name: 'About Us', path: '/about' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Track Order', path: '/orders' },
    ],
    helpSupport: [
      { name: 'Terms & Conditions', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Payment Methods', path: '/payment-methods' },
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'Youtube' }
  ];

  return (
    <footer className="w-full bg-white pt-6 md:pt-12">
      {/* 1. Trust Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 md:mb-12">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-8 py-4 md:py-8 border-y border-gray-100">
          {trustIndicators.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-1 md:gap-4">
              <div className="p-1.5 md:p-3 bg-[#FFF0F5] text-[#800000] rounded-xl md:rounded-2xl flex-shrink-0">
                <item.icon className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div>
                <h4 className="text-[8px] md:text-sm font-bold text-gray-900 tracking-wider mb-0.5 md:mb-1 uppercase">{item.title}</h4>
                <p className="hidden md:block text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Footer Card */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 md:pb-8">
        <div className="max-w-7xl mx-auto bg-[#FFF0F5] text-[#1A1A1A] rounded-[1.5rem] md:rounded-[3rem] border border-[#FFD6E8]/20 shadow-xl overflow-hidden relative">
          
          <div className="px-4 py-6 md:px-16 md:pt-12 md:pb-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
              {/* Brand/Socials Column */}
              <div className="col-span-2 md:col-span-2 flex flex-col items-start justify-start space-y-2 md:space-y-4">
                <div className="flex items-center h-28 sm:h-36 md:h-44 lg:h-56 mb-2 md:mb-4 mix-blend-multiply">
                  <img
                    src="/media__1785326482299.jpg"
                    alt="Aanya Fashions Logo"
                    className="h-full w-auto object-contain contrast-125 drop-shadow-xl"
                  />
                </div>
                <p className="text-sm text-gray-600 max-w-sm leading-relaxed hidden md:block">
                  Aanya Fashions is your one-stop destination for the latest women's clothing. Shop your style, your way.
                </p>
                {/* Social Links */}
                <div className="flex gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 md:w-10 md:h-10 border border-gray-900/10 rounded-full flex items-center justify-center hover:bg-[#800000] hover:text-white hover:border-[#800000] transition-colors text-gray-700"
                      aria-label={social.label}
                    >
                      <social.icon className="w-3.5 h-3.5 md:w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="col-span-1 space-y-2 md:space-y-4">
                <h4 className="text-[10px] md:text-sm font-extrabold text-gray-900 tracking-wider uppercase mb-2 md:mb-6">QUICK LINKS</h4>
                <ul className="space-y-1.5 md:space-y-3">
                  {footerLinks.quickLinks.map((link) => (
                    <li key={link.name}>
                      <Link to={link.path} className="text-[10px] md:text-sm text-gray-600 hover:text-[#800000] transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help & Support */}
              <div className="col-span-1 space-y-2 md:space-y-4">
                <h4 className="text-[10px] md:text-sm font-extrabold text-gray-900 tracking-wider uppercase mb-2 md:mb-6">HELP & SUPPORT</h4>
                <ul className="space-y-1.5 md:space-y-3">
                  {footerLinks.helpSupport.map((link) => (
                    <li key={link.name}>
                      <Link to={link.path} className="text-[10px] md:text-sm text-gray-600 hover:text-[#800000] transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Us */}
              <div className="col-span-1 space-y-3 md:space-y-6">
                <h4 className="text-[10px] md:text-sm font-extrabold text-gray-900 tracking-wider uppercase">CONTACT US</h4>
                <div className="space-y-2.5 md:space-y-4 text-left">
                  <a href="tel:+918838226394" className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors">
                    <div className="w-6 h-6 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37] group-hover:text-white transition-all">
                      <Phone className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold hidden md:block uppercase tracking-wider">PHONE (TAP TO CALL)</p>
                      <p className="text-[10px] md:text-sm text-gray-900 font-bold group-hover:text-[#D4AF37] transition-colors">+91 88382 26394</p>
                    </div>
                  </a>

                  <a href="mailto:owner@aanyafashions.com" className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors">
                    <div className="w-6 h-6 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37] group-hover:text-white transition-all">
                      <Mail className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold hidden md:block uppercase tracking-wider">EMAIL (TAP TO EMAIL)</p>
                      <p className="text-[10px] md:text-sm text-gray-900 font-bold group-hover:text-[#D4AF37] transition-colors">owner@aanyafashions.com</p>
                    </div>
                  </a>

                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Fashion+Street+Bandra+West+Mumbai" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-start gap-2 group hover:text-[#D4AF37] transition-colors"
                  >
                    <div className="w-6 h-6 bg-[#FFF0F5] text-[#D4AF37] rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 group-hover:bg-[#D4AF37] group-hover:text-white transition-all">
                      <MapPin className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold hidden md:block uppercase tracking-wider">ADDRESS (TAP FOR MAP)</p>
                      <p className="text-[10px] md:text-sm text-gray-900 font-bold leading-tight group-hover:text-[#D4AF37] transition-colors">
                        123, Fashion Street, Mumbai - 400050 🗺️
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Darker Pink Bar */}
          <div className="bg-[#FFE4EC] px-6 md:px-12 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[#FFD6E8]/30">
            {/* Copyright */}
            <p className="text-xs font-semibold text-gray-700 text-center md:text-left">
              © 2026 Aanya Fashions. All Rights Reserved.
            </p>
            
            {/* Payment Methods */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">100% Secure Payments</span>
              <div className="flex items-center gap-3 bg-white/50 px-3 py-1.5 rounded-lg border border-white/60">
                <img src="https://cdn.simpleicons.org/visa/1434CB" alt="Visa" className="h-3 md:h-4 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src="https://cdn.simpleicons.org/mastercard" alt="Mastercard" className="h-4 md:h-5 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-3 md:h-4 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src="/payment-logos/rupay.png" alt="RuPay" className="h-3 md:h-4 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-bold text-gray-600 border-l border-gray-300 pl-2 ml-1">COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
