import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

export const DEFAULT_BANNERS = [
  {
    title: 'Mega Blockbuster Saree Sale — Up to 80% Off',
    subtitle: 'Festive Maroon & Gold Pure Silk Sarees',
    badge: 'MEGA BLOCKBUSTER SALE',
    image_url: '/banners/festive_saree_sale_banner.jpg',
    link_url: '/category/sarees',
    status: 'Active',
    display_order: 1,
  },
  {
    title: 'Flat 50-70% Off Handcrafted Heritage Silk',
    subtitle: 'Royal Emerald & Gold Zari Banarasi Weaves',
    badge: 'ROYAL WEDDING COLLECTION',
    image_url: '/banners/royal_banarasi_saree_banner.jpg',
    link_url: '/category/sarees',
    status: 'Active',
    display_order: 2,
  },
  {
    title: 'Festival Boutique Sale — Pure Silk & Organza Sarees',
    subtitle: 'Artisanal Drapes & Handwoven Border Collections',
    badge: 'LIMITED FESTIVAL OFFER',
    image_url: '/banners/organza_festive_saree_banner.jpg',
    link_url: '/category/sarees',
    status: 'Active',
    display_order: 3,
  },
];

// GET /api/banners
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('banners').select('*').order('display_order', { ascending: true });
    if (req.query.active === 'true') {
      query = query.eq('status', 'Active');
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/banners
router.post('/', async (req, res) => {
  try {
    const banner = req.body;
    let imageUrl = banner.image_url;

    // Handle base64 image upload to storage
    if (imageUrl && imageUrl.startsWith('data:image')) {
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = contentType.split('/')[1] || 'jpg';
        const storagePath = `banners/${Date.now()}_${(banner.title || 'banner').replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext}`;
        const { data: uploadData, error: upErr } = await supabase.storage.from('products').upload(storagePath, buffer, {
          upsert: true,
          contentType
        });
        if (!upErr && uploadData?.path) {
          const { data: pubData } = supabase.storage.from('products').getPublicUrl(uploadData.path);
          if (pubData?.publicUrl) imageUrl = pubData.publicUrl;
        }
      }
    }

    const payload = {
      title: banner.title || 'Untitled Banner',
      image_url: imageUrl,
      link_url: banner.link_url || '/category/sarees',
      status: banner.status || 'Active',
      display_order: typeof banner.display_order === 'number' ? banner.display_order : 1,
    };

    const isUuid = !!(banner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id));

    if (isUuid) {
      const { data, error } = await supabase.from('banners').update(payload).eq('id', banner.id).select().single();
      if (error) throw error;
      res.json({ success: true, data });
    } else {
      const { data, error } = await supabase.from('banners').insert(payload).select().single();
      if (error) throw error;
      res.json({ success: true, data });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/banners/:id or /api/banners?id=...
router.delete('/:id?', async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    const imageUrl = req.query.image_url || '';
    const title = req.query.title || '';

    if (!id && !imageUrl && !title) {
      return res.status(400).json({ success: false, error: 'Banner ID, image_url, or title required' });
    }

    const isUuid = !!(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    if (isUuid) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) return res.json({ success: true, id });
    }

    if (imageUrl) {
      await supabase.from('banners').delete().eq('image_url', imageUrl);
    }
    if (title) {
      await supabase.from('banners').delete().eq('title', title);
    }
    if (id === 'banner_mega_saree_sale') {
      await supabase.from('banners').delete().ilike('image_url', '%festive_saree_sale_banner%');
    } else if (id === 'banner_royal_banarasi') {
      await supabase.from('banners').delete().ilike('image_url', '%royal_banarasi_saree_banner%');
    } else if (id === 'banner_organza_boutique') {
      await supabase.from('banners').delete().ilike('image_url', '%organza_festive_saree_banner%');
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/banners/reset
router.post('/reset', async (req, res) => {
  try {
    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const rows = DEFAULT_BANNERS.map(b => ({
      title: b.title,
      image_url: b.image_url,
      link_url: b.link_url,
      status: b.status,
      display_order: b.display_order
    }));
    const { data, error } = await supabase.from('banners').insert(rows).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
