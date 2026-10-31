import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Always allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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
          // Never use default/mock fallback. Return genuine DB data.
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
        badge: banner.badge || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '/category/sarees',
        status: banner.status || 'Active',
        display_order: typeof banner.display_order === 'number' ? banner.display_order : 1,
      };

      const isUuid = !!(banner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id));
      if (isUuid) {
        const { data, error } = await supabase.from('banners').update(payload).eq('id', banner.id).select().single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
      } else {
        const { data, error } = await supabase.from('banners').insert(payload).select().single();
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
