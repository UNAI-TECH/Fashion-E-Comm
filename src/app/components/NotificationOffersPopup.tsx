import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  OfferNotification,
  fetchOfferNotifications,
  getLocalNotifications,
} from '../data/notifications';
import { toast } from 'sonner';

export function NotificationOffersPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<OfferNotification[]>(getLocalNotifications);
  const [isHovered, setIsHovered] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState(() => {
    return localStorage.getItem('aanya_notif_subscribed') === 'true';
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOfferNotifications().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setNotifications(e.detail);
      } else {
        setNotifications(getLocalNotifications());
      }
    };

    window.addEventListener('offer-notifications-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('offer-notifications-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeNotifs = notifications.filter(n => n.status === 'Active');

  const handleSubscribe = () => {
    localStorage.setItem('aanya_notif_subscribed', 'true');
    setHasSubscribed(true);
    toast.success('🎉 Successfully subscribed to Latest Offer alerts!');
  };

  const handleNotificationClick = (notif: OfferNotification) => {
    setIsOpen(false);
    if (notif.link_url) {
      if (notif.link_url.startsWith('http')) {
        window.open(notif.link_url, '_blank');
      } else {
        navigate(notif.link_url);
      }
    }
  };

  return (
    <>
      {/* ─── Floating Bell Button & Tooltip (Matching Image 3) ─── */}
      <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 select-none">
        
        {/* Tooltip Pill: "Latest Offers" */}
        <AnimatePresence>
          {(!isOpen || isHovered) && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl cursor-pointer hover:bg-gray-900 transition-colors whitespace-nowrap hidden sm:block"
            >
              Latest Offers
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Blue Floating Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0873F7] hover:bg-[#0060D5] text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer relative focus:outline-none"
          aria-label="View Latest Offers"
        >
          <Bell className="w-6 h-6 text-white stroke-[2.2]" />

          {/* Unread Badge Count */}
          {activeNotifs.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {activeNotifs.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* ─── Latest Offers Popup Modal (Matching Image 4) ─── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-5 z-[90] flex items-end sm:items-start justify-center p-3 sm:p-0 pointer-events-none">
            
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden pointer-events-auto"
            />

            {/* Popup Card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-[360px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[82vh] pointer-events-auto"
            >
              {/* Blue Header Bar (Matching Image 4) */}
              <div className="bg-[#0873F7] text-white px-5 py-4 flex items-center justify-between">
                <h3 className="font-sans text-lg sm:text-xl font-bold tracking-tight">
                  Latest Offers
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                  aria-label="Close offers popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Offer List Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 sm:p-3 space-y-1">
                {activeNotifs.length > 0 ? (
                  activeNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="group p-2.5 rounded-xl hover:bg-blue-50/60 transition-all cursor-pointer flex items-center gap-3.5"
                    >
                      {/* Banner Thumbnail (Image 4) */}
                      <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 shadow-2xs">
                        <img
                          src={notif.image_url}
                          alt={notif.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#0873F7] transition-colors leading-snug line-clamp-2">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-1">
                          {notif.time_ago || 'Recently'}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0873F7] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    No active offers at the moment.
                  </div>
                )}
              </div>

              {/* Popup Bottom CTA (Matching Image 4) */}
              <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={hasSubscribed}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                    hasSubscribed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0873F7] hover:bg-[#0060D5] text-white hover:shadow-lg'
                  }`}
                >
                  {hasSubscribed ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>SUBSCRIBED TO OFFERS</span>
                    </>
                  ) : (
                    <span>SUBSCRIBE TO NOTIFICATIONS</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
