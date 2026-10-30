import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { fullName, phone, gender, email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (fullName || cleanEmail.split('@')[0]).trim();
  const cleanPhone = (phone || '').toString().trim();
  const cleanGender = (gender || 'Female').toString().trim();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZm13anVha3licHVvaXF6a3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc1MTgxNSwiZXhwIjoyMDk0MzI3ODE1fQ.B5LM0c9NoVypcJCUFzMlF2dlRh21bmb5FefDTn7zYko';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Try to create the user directly with auto-confirmed email (bypasses rate limits)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        phone: cleanPhone,
        gender: cleanGender,
      }
    });

    let userId = createData?.user?.id;

    if (createError) {
      const msg = createError.message.toLowerCase();
      // If user already exists, update and auto-confirm them
      if (msg.includes('already') || msg.includes('exists') || createError.status === 422) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        
        if (existingUser) {
          userId = existingUser.id;
          // Auto-confirm the user and update password so they can log in smoothly
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirm: true,
            password,
            user_metadata: {
              full_name: cleanName,
              phone: cleanPhone,
              gender: cleanGender,
            }
          });
        } else {
          return res.status(400).json({ success: false, error: createError.message });
        }
      } else {
        return res.status(400).json({ success: false, error: createError.message });
      }
    }

    // 2. Ensure profile exists in profiles table
    if (userId) {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        role: 'customer',
        status: 'Active',
        updated_at: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account created and confirmed successfully',
      userId
    });
  } catch (err) {
    console.error('Registration handler error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
}

