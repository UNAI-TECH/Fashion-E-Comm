import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/banners
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('banners').select('*').order('display_order', { ascending: true });
    if (req.query.active === 'true') {
      query = query.eq('status', 'Active');
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Supabase banners query warning:', error.message);
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.warn('Banner route caught error, returning empty list:', err.message);
    res.json({ success: true, data: [] });
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
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
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

// DELETE /api/banners/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await supabase.from('banners').delete().eq('id', id);
    } else {
      await supabase.from('banners').delete().eq('title', id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
