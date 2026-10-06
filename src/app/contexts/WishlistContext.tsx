import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../data/products';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlistCount: number;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWishlistItems([]);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          product_id,
          products:product_id (*)
        `)
        .eq('user_id', user.id);

      if (error || !data) {
        setWishlistItems([]);
        return;
      }

      const enrichedItems: Product[] = data
        .filter(item => item.products)
        .map(item => {
          const product = item.products as any;
          return {
            ...product,
            image: (product.images && product.images.length > 0) ? product.images[0] : (product.image_url || product.image || ''),
          };
        });

      setWishlistItems(enrichedItems);
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchWishlist();
    });
    return () => subscription.unsubscribe();
  }, []);

  const addToWishlist = async (product: Product) => {
    if (!product || !product.id) return;

    // 1. Instantly update local state & localStorage
    setWishlistItems(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      const normalizedProduct = {
        ...product,
        image: product.image || (product.images && product.images.length > 0 ? product.images[0] : '')
      };
      return [normalizedProduct, ...prev];
    });

    toast.success(`${product.name} saved to Wishlist!`);

    // 2. Sync to Supabase in background if logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);
        if (isUUID) {
          await supabase.from('wishlist').insert({
            user_id: user.id,
            product_id: product.id
          });
        }
      }
    } catch (e) {
      console.warn('Background Supabase sync notice:', e);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
    toast.info('Item removed from Wishlist');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      }
    } catch (e) {}
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
