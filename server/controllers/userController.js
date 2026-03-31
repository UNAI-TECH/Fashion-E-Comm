import { supabase } from '../config/supabase.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Usually Supabase handles creating the profile with triggers if you set one up.
    // If you used the provided supabase_schema.sql, you might need to insert it manually
    // or rely on a trigger. Here we'll do an upsert just to be safe.
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: name,
          role: 'customer',
          status: 'Active'
        });

      if (profileError) {
        console.error("Profile creation error: ", profileError);
      }
    }

    res.status(201).json({
      _id: data.user.id,
      name,
      email,
      role: 'customer',
      token: data.session?.access_token || 'check-email-for-confirmation',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid email or password' });
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

    // Update password in Auth if provided
    if (req.body.password) {
      const { error: authError } = await supabase.auth.updateUser({
        password: req.body.password
      });
      if (authError) {
        return res.status(400).json({ message: authError.message });
      }
    }

    // Update profile table
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
      // Frontend expects token (won't change from profile update alone usually, but mock it)
      token: req.headers.authorization.split(' ')[1],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
