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
                <div className="flex items-center h-12 md:h-24 sm:h-28 lg:h-36 mb-2 md:mb-4">
                  <img
                    src="/logo_aanya.png"
                    alt="Aanya Fashions Logo"
                    className="h-full w-auto object-contain"
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

              {/* Contact Us */}
              <div className="col-span-1 space-y-3 md:space-y-6">
                <h4 className="text-[10px] md:text-sm font-extrabold text-gray-900 tracking-wider uppercase">CONTACT US</h4>
                <div className="space-y-2 md:space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold hidden md:block">PHONE</p>
                      <p className="text-[10px] md:text-sm text-gray-800 font-medium">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold hidden md:block">EMAIL</p>
                      <p className="text-[10px] md:text-sm text-gray-800 font-medium">support@aanyafashions.in</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold hidden md:block">ADDRESS</p>
                      <p className="text-[10px] md:text-sm text-gray-800 font-medium leading-tight">
                        123, Fashion Street, Mumbai - 400001
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Darker Pink Bar */}
          <div className="bg-[#FFE4EC] px-8 py-3 md:py-4 flex justify-center items-center border-t border-[#FFD6E8]/30">
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
