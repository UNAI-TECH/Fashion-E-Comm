import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to load .env in Node scripts / Vite plugin
function getEnv(key) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match) return match[1].trim();
    }
  } catch (e) {}
  return process.env[key] || '';
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_KEY');

export const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

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

/**
 * Upload base64 or file buffer to Supabase Storage products bucket
 */
export async function uploadBannerToStorage(base64Data, filename) {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let contentType = 'image/jpeg';
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      ext = contentType.split('/')[1] || 'jpg';
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const cleanName = (filename || 'banner').replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `banners/${Date.now()}_${cleanName}.${ext}`;

    const { data, error } = await adminClient.storage
      .from('products')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType,
      });

    if (!error && data?.path) {
      const { data: pubData } = adminClient.storage.from('products').getPublicUrl(data.path);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (err) {
    console.error('[bannersApi] Storage upload failed:', err);
  }

  // Fallback: save to public/banners/ locally if local filesystem available
  try {
    const publicBannersDir = path.resolve(process.cwd(), 'public', 'banners');
    if (!fs.existsSync(publicBannersDir)) {
      fs.mkdirSync(publicBannersDir, { recursive: true });
    }
    const cleanName = (filename || `banner_${Date.now()}`).replace(/[^a-zA-Z0-9.-]/g, '_');
    const localFileName = `${Date.now()}_${cleanName}.jpg`;
    const localFilePath = path.join(publicBannersDir, localFileName);
    
    const base64Pure = base64Data.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(localFilePath, Buffer.from(base64Pure, 'base64'));
    return `/banners/${localFileName}`;
  } catch (e) {
    console.error('[bannersApi] Local public save error:', e);
  }

  return base64Data; // Return data URL as last resort
}

/**
 * Fetch all banners
 */
export async function getBanners(activeOnly = false) {
  let query = adminClient
    .from('banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('status', 'Active');
  }

  const { data, error } = await query;
  if (error) {
    console.error('[bannersApi] getBanners error:', error);
    return [];
  }
  return data || [];
}

/**
 * Save or update banner
 */
export async function saveBannerRecord(banner) {
  let imageUrl = banner.image_url;

  // If user provided a base64 data URL, upload it to storage first
  if (imageUrl && imageUrl.startsWith('data:image')) {
    imageUrl = await uploadBannerToStorage(imageUrl, banner.title);
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
    const { data, error } = await adminClient
      .from('banners')
      .update(payload)
      .eq('id', banner.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await adminClient
      .from('banners')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Delete a banner permanently (handles UUIDs, titles, image URLs, and default IDs)
 */
export async function deleteBannerRecord(id, extra = {}) {
  const isUuid = !!(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

  if (isUuid) {
    const { error } = await adminClient
      .from('banners')
      .delete()
      .eq('id', id);
    if (!error) return true;
  }

  // Handle default banner IDs or match by image_url / title
  if (id === 'banner_mega_saree_sale') {
    await adminClient.from('banners').delete().ilike('image_url', '%festive_saree_sale_banner%');
    return true;
  }
  if (id === 'banner_royal_banarasi') {
    await adminClient.from('banners').delete().ilike('image_url', '%royal_banarasi_saree_banner%');
    return true;
  }
  if (id === 'banner_organza_boutique') {
    await adminClient.from('banners').delete().ilike('image_url', '%organza_festive_saree_banner%');
    return true;
  }

  if (extra.image_url) {
    await adminClient.from('banners').delete().eq('image_url', extra.image_url);
    return true;
  }

  if (extra.title) {
    await adminClient.from('banners').delete().eq('title', extra.title);
    return true;
  }

  return true;
}

/**
 * Reset / Seed default banners
 */
export async function resetBanners() {
  await adminClient.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const rows = DEFAULT_BANNERS.map((b) => ({
    title: b.title,
    image_url: b.image_url,
    link_url: b.link_url,
    status: b.status,
    display_order: b.display_order,
  }));
  const { data, error } = await adminClient.from('banners').insert(rows).select();
  if (error) throw error;
  return data;
}
