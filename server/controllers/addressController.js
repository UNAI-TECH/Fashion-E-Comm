import { supabase } from '../config/supabase.js';

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(addresses || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
export const createAddress = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country = 'India',
      is_default = false
    } = req.body;

    // Server-side validation
    if (!full_name || !phone || !address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message: 'All required address fields (name, phone, street, city, state, postal code) must be provided.'
      });
    }

    // Validate 6-digit Indian PIN code
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(String(postal_code).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Indian postal code. Must be a 6-digit number.'
      });
    }

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be a valid 10-digit mobile number.'
      });
    }

    // If setting as default, unset other addresses
    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const { data: newAddress, error } = await supabase
      .from('addresses')
      .insert({
        user_id: req.user.id,
        full_name: full_name.trim(),
        phone: cleanPhone,
        address_line_1: address_line_1.trim(),
        address_line_2: address_line_2 ? address_line_2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postal_code: String(postal_code).trim(),
        country: country || 'India',
        is_default: Boolean(is_default)
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newAddress);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update existing address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      is_default
    } = req.body;

    // Check ownership
    const { data: existing, error: findErr } = await supabase
      .from('addresses')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (findErr || !existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const updates = { updated_at: new Date() };
    if (full_name) updates.full_name = full_name.trim();
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      updates.phone = cleanPhone;
    }
    if (address_line_1) updates.address_line_1 = address_line_1.trim();
    if (address_line_2 !== undefined) updates.address_line_2 = address_line_2 ? address_line_2.trim() : null;
    if (city) updates.city = city.trim();
    if (state) updates.state = state.trim();
    if (postal_code) updates.postal_code = String(postal_code).trim();
    if (country) updates.country = country;
    if (is_default !== undefined) updates.is_default = Boolean(is_default);

    const { data: updated, error } = await supabase
      .from('addresses')
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

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Address removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Reset others
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', req.user.id);

    // Set this one
    const { data: updated, error } = await supabase
      .from('addresses')
      .update({ is_default: true, updated_at: new Date() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
