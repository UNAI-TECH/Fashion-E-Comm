import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../data/products';
import { toast } from 'sonner';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, delta: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const cached = localStorage.getItem('aanya_cart_items');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync local state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aanya_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [cartItems]);

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('cart')
        .select(`
          quantity,
          product_id,
          products:product_id (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const enrichedItems: CartItem[] = (data || [])
        .filter(item => item.products)
        .map(item => {
          const product = item.products as any;
          return {
            ...product,
            image: product.images?.[0] || product.image_url || product.image || '',
            quantity: item.quantity
          };
        });

      if (enrichedItems.length > 0) {
        setCartItems(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          enrichedItems.forEach(p => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCart();
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!product || !product.id) return;

    // 1. Instantly update local state & localStorage
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    toast.success(`${product.name} added to Cart!`);

    // 2. Persist to Supabase in background if logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);
        if (isUUID) {
          const { data: existingItem } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .single();

          if (existingItem) {
            await supabase
              .from('cart')
              .update({ quantity: existingItem.quantity + quantity })
              .eq('user_id', user.id)
              .eq('product_id', product.id);
          } else {
            await supabase
              .from('cart')
              .insert({
                user_id: user.id,
                product_id: product.id,
                quantity: quantity
              });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing cart item to Supabase:', error);
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const currentItem = cartItems.find(item => item.id === productId);
        if (currentItem) {
          const newQty = Math.max(1, currentItem.quantity + delta);
          await supabase
            .from('cart')
            .update({ quantity: newQty })
            .eq('user_id', user.id)
            .eq('product_id', productId);
        }
      }
    } catch (error) {
      console.error('Error updating quantity in Supabase:', error);
    }
  };

  const removeItem = async (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    toast.success('Item removed from Cart');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      }
    } catch (error) {
      console.error('Error removing item from Supabase:', error);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    toast.success('Cart cleared');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error clearing cart in Supabase:', error);
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addToCart, updateQuantity, removeItem, clearCart, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
