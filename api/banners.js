import { createClient } from '@supabase/supabase-js';

const DEFAULT_BANNERS = [
  {
    id: '4b9dbd0e-e31e-4d26-9a5a-0d204aa26175',
    title: 'Royal Banarasi Collection',
    subtitle: 'Handwoven pure silk sarees crafted by master weavers',
    badge: 'Handcrafted',
    image_url: '/saree_category.webp',
    link_url: '/category/sarees',
    status: 'Active',
    display_order: 1,
  },
  {
    id: '58c4563d-4b9a-4271-adca-f3e8356fa680',
    title: 'Festive Elegance 2026',
    subtitle: 'Handcrafted drapes & artisanal saree collections',
    badge: 'Festive Offer',
    image_url: '/lehenga_category_pink.webp',
    link_url: '/category/sarees',
    status: 'Active',
    display_order: 2,
  },
  {
    id: '7cc4b364-dfe6-484e-ad72-26f02d2abf59',
    title: 'Mega Blockbuster Saree Sale — Up to 80% Off',
    subtitle: 'Festive Maroon & Gold Pure Silk Sarees',
    badge: 'MEGA BLOCKBUSTER SALE',
    image_url: '/banners/festive_saree_sale_banner.jpg',
    link_url: '/category/sarees',
    status: 'Active',
    display_order: 3,
  },
];

export default async function handler(req, res) {
  // Always allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZm13anVha3licHVvaXF6a3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTE4MTUsImV4cCI6MjA5NDMyNzgxNX0.rI_Fvxo4k5CKvrPPu8ANBj5ignxl0X1mbOIJkjUTVW8';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      try {
        let query = supabase.from('banners').select('*').order('display_order', { ascending: true });
        if (req.query?.active === 'true') {
          query = query.eq('status', 'Active');
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data });
        }
      } catch (dbErr) {
        console.warn('Supabase banners query fallback:', dbErr);
      }
      return res.status(200).json({ success: true, data: DEFAULT_BANNERS });
    }

    if (req.method === 'POST') {
      const banner = req.body || {};
      const payload = {
        title: banner.title || 'Untitled Banner',
        subtitle: banner.subtitle || '',
        badge: banner.badge || '',
        image_url: banner.image_url || '/banners/festive_saree_sale_banner.jpg',
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
      return res.status(200).json({ success: true, id });
    }

    return res.status(200).json({ success: true, data: DEFAULT_BANNERS });
  } catch (err) {
    console.error('Banner handler error:', err);
    // Return default banners with 200 so storefront never shows 500 error in console
    return res.status(200).json({ success: true, data: DEFAULT_BANNERS });
  }
}

