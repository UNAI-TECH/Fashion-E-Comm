import { supabase } from '../config/supabase.js';

// @desc    Validate coupon code against cart total
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();

    // Query coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .single();

    if (error || !coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    // 1. Check active status
    if (coupon.is_active === false) {
      return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
    }

    // 2. Check expiration date
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ success: false, message: 'This coupon is not yet valid.' });
    }

    // 3. Check minimum purchase amount
    const subtotal = Number(cartTotal) || 0;
    if (coupon.min_purchase_amount && subtotal < Number(coupon.min_purchase_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.min_purchase_amount} required to use this coupon.`
      });
    }

    // 4. Check global usage limit
    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    // 5. Check per-user redemption limit if user is authenticated
    if (req.user?.id) {
      const { count: userRedemptions } = await supabase
        .from('coupon_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', req.user.id);

      const perUserLimit = coupon.per_user_limit || 1;
      if (userRedemptions && userRedemptions >= perUserLimit) {
        return res.status(400).json({ success: false, message: 'You have already redeemed this coupon.' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
        discountAmount = Number(coupon.max_discount_amount);
      }
    } else {
      // Fixed amount
      discountAmount = Number(coupon.discount_value);
    }

    // Discount cannot exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discountAmount: Math.round(discountAmount),
        description: coupon.description || `${coupon.discount_value}% OFF`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all coupons (Admin) or active public coupons (Customer)
// @route   GET /api/coupons
// @access  Public / Admin
export const getCoupons = async (req, res) => {
  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(coupons || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      valid_until,
      max_uses,
      is_active
    } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: 'Code and discount value are required' });
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.trim().toUpperCase(),
        discount_type: discount_type || 'percentage',
        discount_value: Number(discount_value),
        min_purchase_amount: min_purchase_amount ? Number(min_purchase_amount) : 0,
        max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
        valid_until: valid_until || null,
        max_uses: max_uses ? Number(max_uses) : null,
        is_active: is_active !== undefined ? Boolean(is_active) : true
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date() };

    const { data: updated, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
