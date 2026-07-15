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
      { name: 'Clothing', path: '/#collections' },
      { name: 'About Us', path: '/about' },
      { name: 'Contact Us', path: '/contact' }
    ],
    helpSupport: [
      { name: 'Track Order', path: '/orders' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms & Conditions', path: '/terms' },
      { name: 'Payment Methods', path: '/payment-methods' },
      { name: 'Careers', path: '/careers' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'Youtube' }
  ];

  return (
    <footer className="w-full bg-white pt-12">
      {/* 1. Trust Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-gray-100">
          {trustIndicators.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="p-3 bg-[#FFF0F5] text-[#800000] rounded-2xl flex-shrink-0">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 tracking-wider mb-1 uppercase">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Footer Card */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto bg-[#FFF0F5] text-[#1A1A1A] rounded-[3rem] border border-[#FFD6E8]/20 shadow-xl overflow-hidden relative">
          
          <div className="px-8 pt-12 pb-12 sm:px-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {/* Brand Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center h-24 sm:h-28 lg:h-36 mb-4">
                  <img
                    src="/logo_aanya.png"
                    alt="Aanya Fashions Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                  Aanya Fashions is your one-stop destination for the latest women's clothing. Shop your style, your way.
                </p>
                {/* Social Links */}
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border border-gray-900/10 rounded-full flex items-center justify-center hover:bg-[#800000] hover:text-white hover:border-[#800000] transition-colors text-gray-700"
                      aria-label={social.label}
                    >
                      <social.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-extrabold text-gray-900 tracking-wider uppercase mb-6">QUICK LINKS</h4>
                <ul className="space-y-3">
                  {footerLinks.quickLinks.map((link) => (
                    <li key={link.name}>
                      <Link to={link.path} className="text-sm text-gray-600 hover:text-[#800000] transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>



              {/* Contact Us */}
              <div className="space-y-6">
                <h4 className="text-sm font-extrabold text-gray-900 tracking-wider uppercase">CONTACT US</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold">PHONE</p>
                      <p className="text-sm text-gray-800 font-medium">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold">EMAIL</p>
                      <p className="text-sm text-gray-800 font-medium">support@aanyafashions.in</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold">ADDRESS</p>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                        123, Fashion Street,<br />Mumbai, Maharashtra - 400001
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Darker Pink Bar */}
          <div className="bg-[#FFE4EC] px-8 py-4 sm:px-16 flex justify-center items-center border-t border-[#FFD6E8]/30">
            {/* Copyright */}
            <p className="text-xs font-semibold text-gray-700 text-center">
              © 2024 Aanya Fashions. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
