import { supabase } from '../config/supabase.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    // In Supabase, if we created a `carts` and `cart_items` table, we fetch it here.
    // However, if we didn't explicitly create it in our SQL, we can just fetch it manually if it exists 
    // or represent it with a JSON object. Since Mongoose used a cart JSON model, let's assume
    // the user profile contains a `cart` JSON column, or we query a `carts` table.
    
    const { data: cart, error } = await supabase
      .from('carts')
      .select(`
        id,
        cart_items (
          quantity,
          product_id,
          products (name, price, images, stock_quantity)
        )
      `)
      .eq('user_id', req.user.id)
      .single();

    if (error || !cart) return res.json({ items: [] });

    // Format to match Mongoose response
    const formattedCart = {
      _id: cart.id,
      items: cart.cart_items.map(item => ({
        product: {
           _id: item.product_id,
           name: item.products.name,
           price: item.products.price,
           images: item.products.images,
           stock: item.products.stock_quantity,
        },
        quantity: item.quantity,
      }))
    };

    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // 1. Get or create cart for user
    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!cart) {
      const { data: newCart, error: errC } = await supabase
         .from('carts')
         .insert({ user_id: req.user.id })
         .select()
         .single();
      if(errC) throw errC;
      cart = newCart;
    }

    // 2. Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
       // Update quantity
       await supabase
         .from('cart_items')
         .update({ quantity: quantity })
         .eq('id', existingItem.id);
    } else {
       // Insert new item
       await supabase
         .from('cart_items')
         .insert({
           cart_id: cart.id,
           product_id: productId,
           quantity: quantity
         });
    }

    res.json({ message: 'Cart updated correctly' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (cart) {
      await supabase
         .from('cart_items')
         .delete()
         .eq('cart_id', cart.id)
         .eq('product_id', req.params.productId);
    }

    res.json({ message: 'Removed from cart' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
