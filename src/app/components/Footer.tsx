import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Instagram, Heart, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {

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
    ]
  };

  const socialLinks = [
    {
      icon: Instagram,
      href: 'https://www.instagram.com/aanya.style?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==',
      label: 'Instagram'
    }
  ];

  return (
    <footer className="w-full bg-white pt-2 pb-4 md:pt-4 md:pb-8">

      {/* 2. Main Footer Card */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 md:pb-8">
        <div className="max-w-7xl mx-auto bg-[#F4F6F2] text-[#1A1A1A] rounded-[1.5rem] md:rounded-[3rem] border border-[#DCE4D7]/20 shadow-xl overflow-hidden relative">

          <div className="px-4 py-6 md:px-16 md:pt-12 md:pb-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
              {/* Brand/Socials Column */}
              <div className="col-span-2 md:col-span-2 flex flex-col items-start justify-start space-y-2 md:space-y-4">
                <div className="flex items-center h-28 sm:h-36 md:h-44 lg:h-52 mb-2 md:mb-4 mix-blend-multiply">
                  <img
                    src="/logo.png"
                    alt="Aanya Fashions Logo"
                    className="h-full w-auto object-contain drop-shadow-md"
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
                      className="w-7 h-7 md:w-10 md:h-10 border border-gray-900/10 rounded-full flex items-center justify-center hover:bg-[#698156] hover:text-white hover:border-[#698156] transition-colors text-gray-700"
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
                      <Link to={link.path} className="text-[10px] md:text-sm text-gray-600 hover:text-[#698156] transition-colors">
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
                      <Link to={link.path} className="text-[10px] md:text-sm text-gray-600 hover:text-[#698156] transition-colors">
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
                  <a href="tel:+919043088697" className="flex items-center gap-2 group hover:text-[#698156] transition-colors">
                    <div className="w-6 h-6 bg-[#F4F6F2] text-[#698156] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#698156] group-hover:text-white transition-all">
                      <Phone className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold hidden md:block uppercase tracking-wider">PHONE</p>
                      <p className="text-[10px] md:text-sm text-gray-900 font-bold group-hover:text-[#698156] transition-colors">+91 90430 88697</p>
                    </div>
                  </a>

                  <a href="mailto:owner@aanyafashions.com" className="flex items-center gap-2 group hover:text-[#698156] transition-colors">
                    <div className="w-6 h-6 bg-[#F4F6F2] text-[#698156] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#698156] group-hover:text-white transition-all">
                      <Mail className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold hidden md:block uppercase tracking-wider">EMAIL </p>
                      <p className="text-[10px] md:text-sm text-gray-900 font-bold group-hover:text-[#698156] transition-colors">owner@aanyafashions.com</p>
                    </div>
                  </a>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Chennai+Tamil+Nadu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 group hover:text-[#698156] transition-colors"
                  >
                    <div className="w-6 h-6 bg-[#F4F6F2] text-[#698156] rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 group-hover:bg-[#698156] group-hover:text-white transition-all">
                      <MapPin className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold hidden md:block uppercase tracking-wider">ADDRESS</p>
                      <p className="text-[10px] md:text-sm text-gray-900 font-bold leading-tight group-hover:text-[#698156] transition-colors">
                        Chennai,Tamil Nadu
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar */}
          <div className="bg-[#EBF0E6] px-6 md:px-12 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[#DCE4D7]/30">
            {/* Copyright */}
            <p className="text-xs font-semibold text-gray-700 text-center md:text-left">
              © 2026 Aanya Fashions. All Rights Reserved.
            </p>

            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
              {/* Crafted by UNAI TECH Badge — Transparent background, Black & White typography */}
              <a
                href="https://www.unaitech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-2 bg-transparent hover:bg-black/5 border border-black/20 hover:border-black/50 rounded-2xl transition-all duration-300 cursor-pointer active:scale-95"
                title="Crafted by UNAI TECH - https://www.unaitech.com/"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-bold tracking-widest text-black/60 uppercase leading-none">
                    CRAFTED BY
                  </span>
                  <div className="flex items-center gap-1 leading-none mt-1">
                    <span className="font-extrabold tracking-tight text-xs text-black">UNAI</span>
                    <span className="font-extrabold tracking-tight text-xs text-black">TECH</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-xl bg-black/5 border border-black/15 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all flex-shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
