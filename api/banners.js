import { createClient } from '@supabase/supabase-js';

// The authoritative active Supabase URL and Service Role Key for zofmwjuakybpuoiqzktm
const ACTIVE_SUPABASE_URL = 'https://zofmwjuakybpuoiqzktm.supabase.co';
const ACTIVE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZm13anVha3licHVvaXF6a3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc1MTgxNSwiZXhwIjoyMDk0MzI3ODE1fQ.B5LM0c9NoVypcJCUFzMlF2dlRh21bmb5FefDTn7zYko';

export default async function handler(req, res) {
  // Always allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure we NEVER connect to the old cvhofhdwedszsqcngxbt Supabase instance
  let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ACTIVE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('cvhofhdwedszsqcngxbt')) {
    supabaseUrl = ACTIVE_SUPABASE_URL;
  }

  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ACTIVE_SERVICE_ROLE_KEY;
  if (!supabaseKey || supabaseKey.includes('cvhofhdwedszsqcngxbt') || supabaseKey === process.env.VITE_SUPABASE_ANON_KEY) {
    supabaseKey = ACTIVE_SERVICE_ROLE_KEY;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      try {
        let query = supabase.from('banners').select('*').order('display_order', { ascending: true });
        if (req.query?.active === 'true') {
          query = query.eq('status', 'Active');
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return res.status(200).json({ success: true, data });
        }
      } catch (dbErr) {
        console.warn('Supabase banners query warning:', dbErr);
      }
      return res.status(200).json({ success: true, data: [] });
    }

    if (req.method === 'POST') {
      const banner = req.body || {};
      const payload = {
        title: banner.title || 'Untitled Banner',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '/category/sarees',
        status: banner.status || 'Active',
        display_order: typeof banner.display_order === 'number' ? banner.display_order : 1,
      };

      if (banner.badge) {
        payload.badge = banner.badge;
      }

      const isUuid = !!(banner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id));

      if (isUuid) {
        let { data, error } = await supabase.from('banners').update(payload).eq('id', banner.id).select().single();
        if (error && error.message && error.message.toLowerCase().includes('badge')) {
          delete payload.badge;
          const retry = await supabase.from('banners').update(payload).eq('id', banner.id).select().single();
          data = retry.data;
          error = retry.error;
        }
        if (error) throw error;
        return res.status(200).json({ success: true, data });
      } else {
        let { data, error } = await supabase.from('banners').insert(payload).select().single();
        if (error && error.message && error.message.toLowerCase().includes('badge')) {
          delete payload.badge;
          const retry = await supabase.from('banners').insert(payload).select().single();
          data = retry.data;
          error = retry.error;
        }
        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (id) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('banners').delete().eq('id', id);
        } else {
          await supabase.from('banners').delete().eq('title', id);
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/banners error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
