import { supabase } from '../config/supabase.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const { data: wishlist, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        product_id,
        created_at,
        products (
          id,
          name,
          price,
          compare_at_price,
          images,
          category,
          stock_quantity,
          rating
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(wishlist || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Verify product exists
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (pErr || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Upsert or insert ignoring duplicate
    const { data, error } = await supabase
      .from('wishlist')
      .upsert(
        { user_id: req.user.id, product_id: productId },
        { onConflict: 'user_id,product_id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: 'Added to wishlist', item: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', productId);

    if (error) throw error;
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
