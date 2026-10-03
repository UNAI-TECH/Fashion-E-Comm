import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router';

// Module-level flag so it only shows on first page load / reload, not during in-app navigation
let hasShownWelcomeInSession = false;

export function WelcomeSplashScreen() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(() => {
    // Show on initial load if not already shown in this session
    return !hasShownWelcomeInSession && (location.pathname === '/' || location.pathname === '');
  });

  const handleDismiss = () => {
    hasShownWelcomeInSession = true;
    setIsVisible(false);
  };

  // Automatically dismiss after 2.8 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[350] bg-[#FDFBF7] flex flex-col items-center justify-center px-6 select-none cursor-pointer overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Aanya Fashions"
        >
          {/* Subtle luxury ambient glow in background */}
          <div className="absolute w-96 h-96 rounded-full bg-[#698156]/10 blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-sm flex flex-col items-center justify-center text-center">
            {/* Big Transparent Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              <img
                src="/logo.png"
                alt="Aanya Fashions Logo"
                className="h-44 sm:h-56 w-auto object-contain mix-blend-multiply drop-shadow-2xl"
              />
            </motion.div>

            {/* Welcome Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
              className="text-3xl sm:text-4xl font-serif font-black text-gray-900 tracking-tight text-center leading-tight"
            >
              Welcome to Aanya Fashions
            </motion.h1>

            {/* Luxury Subtitle */}
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.38, duration: 0.45, ease: 'easeOut' }}
              className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-widest mt-3 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#698156]" />
              <span>Handcrafted Elegance & Designer Wear</span>
              <Sparkles className="w-3.5 h-3.5 text-[#698156]" />
            </motion.p>

            {/* Enter Store CTA Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              className="mt-8 w-full max-w-xs"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="w-full py-4 bg-[#698156] hover:bg-black text-white font-black rounded-full text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#698156]"
              >
                <span>Enter Store</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </motion.button>
              <p className="text-[11px] text-gray-400 font-medium mt-3">
                Tap anywhere to explore collection
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
