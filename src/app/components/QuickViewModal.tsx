import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useState } from 'react';
import { Product } from '../data/products';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
              {/* Image */}
              <div className="relative aspect-square bg-white p-6 flex items-center justify-center border-r border-gray-100">
                <div className="border border-[#698156] p-2 w-full h-full flex items-center justify-center bg-white rounded-2xl shadow-sm">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-4">
                <div className="text-[#698156] uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="cursor-pointer hover:underline" onClick={onClose}>Home</span>
                  <span>/</span>
                  <span className="cursor-pointer hover:underline" onClick={onClose}>{product.category || 'Product'}</span>
                  <span>/</span>
                  <span className="truncate max-w-[150px]">{product.name}</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1A1A]">
                  {product.name}
                </h2>
                <div className="w-12 h-px bg-[#698156]"></div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-[#698156] text-[#698156]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 font-medium">({product.rating} customer rating)</span>
                </div>

                {/* Description removed for consistency with ProductPage */}

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-[#698156] font-serif">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Colors */}
                <div>
                  <h3 className="text-xs mb-2 text-gray-500 uppercase tracking-wider font-bold">Colors</h3>
                  <div className="flex gap-1.5">
                    {product.colors.map((color, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#698156]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    onClick={async () => {
                      if (isInWishlist(product.id)) {
                        await removeFromWishlist(product.id);
                      } else {
                        await addToWishlist(product);
                      }
                      onClose();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 h-11 bg-white text-[#698156] border border-[#698156] font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-[#698156] hover:text-white transition-all duration-300"
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    {isInWishlist(product.id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
                  </motion.button>
                </div>

                {/* View Full Details */}
                <motion.a
                  href={`/product/${product.id}`}
                  whileHover={{ x: 5 }}
                  className="block text-center text-xs font-bold text-[#698156] hover:underline uppercase tracking-wider pt-2"
                >
                  View Full Details →
                </motion.a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
