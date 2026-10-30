import { supabase } from '../config/supabase.js';

export const registerUser = async (req, res) => {
  try {
    const { name, fullName, phone, gender, email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || fullName || cleanEmail.split('@')[0]).trim();
    const cleanPhone = (phone || '').toString().trim();
    const cleanGender = (gender || 'Female').toString().trim();

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let userId;
    const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        phone: cleanPhone,
        gender: cleanGender,
      }
    });

    if (adminErr) {
      const msg = adminErr.message.toLowerCase();
      if (msg.includes('already') || msg.includes('exists') || adminErr.status === 422) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(userId, {
            email_confirm: true,
            password,
            user_metadata: { full_name: cleanName, phone: cleanPhone, gender: cleanGender }
          });
        } else {
          return res.status(400).json({ message: adminErr.message });
        }
      } else {
        return res.status(400).json({ message: adminErr.message });
      }
    } else {
      userId = adminData?.user?.id;
    }

    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        role: 'customer',
        status: 'Active',
        updated_at: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      _id: userId,
      name: cleanName,
      email: cleanEmail,
      role: 'customer',
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    // Auto-confirm unconfirmed user if needed so signin never fails due to email unconfirmed
    try {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (existingUser && !existingUser.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
      }
    } catch (e) {
      // Non-fatal
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({ message: error?.message || 'Invalid email or password' });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.status === 'Blocked') {
      return res.status(403).json({ message: 'User is blocked by admin' });
    }

    res.json({
      _id: data.user.id,
      name: profile?.full_name || data.user.user_metadata?.full_name,
      email: data.user.email,
      role: profile?.role || 'customer',
      token: data.session.access_token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = {
      full_name: req.body.name || req.user.full_name,
      email: req.body.email || req.user.email,
      updated_at: new Date(),
    };

    if (req.body.password) {
      const { error: authError } = await supabase.auth.updateUser({
        password: req.body.password
      });
      if (authError) {
        return res.status(400).json({ message: authError.message });
      }
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      _id: updatedProfile.id,
      name: updatedProfile.full_name,
      email: updatedProfile.email,
      role: updatedProfile.role,
      token: req.headers.authorization?.split(' ')[1] || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
