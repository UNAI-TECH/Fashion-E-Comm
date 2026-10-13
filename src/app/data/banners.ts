import { supabase } from '../../lib/supabase';

export interface AdBanner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  image_url: string;
  link_url?: string;
  status: 'Active' | 'Inactive';
  display_order: number;
  created_at?: string;
}

export const DEFAULT_AD_BANNERS: AdBanner[] = [
  {
    id: 'banner_mega_saree_sale',
    title: "Mega Blockbuster Saree Sale — Up to 80% Off",
    subtitle: "Festive Maroon & Gold Pure Silk Sarees",
    badge: "MEGA BLOCKBUSTER SALE",
    image_url: "/banners/festive_saree_sale_banner.jpg",
    link_url: "/category/sarees",
    status: 'Active',
    display_order: 1,
  },
  {
    id: 'banner_royal_banarasi',
    title: "Flat 50-70% Off Handcrafted Heritage Silk",
    subtitle: "Royal Emerald & Gold Zari Banarasi Weaves",
    badge: "ROYAL WEDDING COLLECTION",
    image_url: "/banners/royal_banarasi_saree_banner.jpg",
    link_url: "/category/sarees",
    status: 'Active',
    display_order: 2,
  },
  {
    id: 'banner_organza_boutique',
    title: "Festival Boutique Sale — Pure Silk & Organza Sarees",
    subtitle: "Artisanal Drapes & Handwoven Border Collections",
    badge: "LIMITED FESTIVAL OFFER",
    image_url: "/banners/organza_festive_saree_banner.jpg",
    link_url: "/category/sarees",
    status: 'Active',
    display_order: 3,
  },
];

const LOCAL_STORAGE_KEY = 'aanya_ad_banners';

export function getLocalBanners(): AdBanner[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure not old cutout models
        const hasOldCutout = parsed.some((b: any) => 
          typeof b?.image_url === 'string' && (b.image_url.includes('_cutout.png') || b.image_url.includes('/model_'))
        );
        if (!hasOldCutout) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[Banners] Local storage parse error:', e);
  }
  return DEFAULT_AD_BANNERS;
}

export function setLocalBanners(banners: AdBanner[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(banners));
    window.dispatchEvent(new CustomEvent('ad-banners-updated', { detail: banners }));
    try {
      const bc = new BroadcastChannel('banners_broadcast_channel');
      bc.postMessage({ type: 'BANNERS_UPDATED', banners });
      bc.close();
    } catch {}
  } catch (e) {
    console.warn('[Banners] Local storage set error:', e);
  }
}

function isOldCutoutBanner(row: any): boolean {
  if (!row) return false;
  const img = row.image_url || row.image || '';
  return img.includes('_cutout.png') || img.includes('/model_') || img.includes('model_1');
}

/**
 * Fetch all active banners for storefront
 */
export async function fetchActiveBanners(): Promise<AdBanner[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'Active')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const hasOldCutouts = data.some(isOldCutoutBanner);
      if (!hasOldCutouts) {
        const formatted: AdBanner[] = data.map((b: any, index: number) => ({
          id: b.id,
          title: b.title || 'Festive Saree Sale',
          subtitle: b.subtitle || '',
          badge: b.badge || '',
          image_url: b.image_url || b.image || '',
          link_url: b.link_url || b.link || '/category/sarees',
          status: (b.status as 'Active' | 'Inactive') || 'Active',
          display_order: typeof b.display_order === 'number' ? b.display_order : index + 1,
          created_at: b.created_at,
        }));
        setLocalBanners(formatted);
        return formatted;
      } else {
        // Migrate old cutouts in database to ad banners
        await resetBannersToDefault();
        return DEFAULT_AD_BANNERS;
      }
    }
  } catch (e) {
    console.warn('[Banners] Fetch active error:', e);
  }

  return getLocalBanners().filter(b => b.status === 'Active');
}

/**
 * Fetch all banners for Admin dashboard
 */
export async function fetchAllBannersAdmin(): Promise<AdBanner[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const hasOldCutouts = data.some(isOldCutoutBanner);
      if (!hasOldCutouts) {
        const formatted: AdBanner[] = data.map((b: any, index: number) => ({
          id: b.id,
          title: b.title || 'Untitled Banner',
          subtitle: b.subtitle || '',
          badge: b.badge || '',
          image_url: b.image_url || b.image || '',
          link_url: b.link_url || b.link || '/category/sarees',
          status: (b.status as 'Active' | 'Inactive') || 'Active',
          display_order: typeof b.display_order === 'number' ? b.display_order : index + 1,
          created_at: b.created_at,
        }));
        setLocalBanners(formatted);
        return formatted;
      } else {
        // Upgrade db to modern ad banners
        await resetBannersToDefault();
        return DEFAULT_AD_BANNERS;
      }
    }

    if (!error && (!data || data.length === 0)) {
      await resetBannersToDefault();
      return DEFAULT_AD_BANNERS;
    }
  } catch (e) {
    console.warn('[Banners Admin] Fetch error:', e);
  }

  return getLocalBanners();
}

/**
 * Save / Update a banner
 */
export async function saveBanner(banner: Partial<AdBanner>): Promise<AdBanner> {
  const current = getLocalBanners();
  const isUuid = !!(banner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id));
  const newOrder = banner.display_order ?? (current.length + 1);

  let updated: AdBanner;
  const existingIdx = current.findIndex(b => b.id === banner.id);

  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...banner,
      id: banner.id!,
      title: banner.title || current[existingIdx].title,
      image_url: banner.image_url || current[existingIdx].image_url,
      display_order: newOrder,
      status: banner.status || current[existingIdx].status || 'Active',
    };
    current[existingIdx] = updated;
  } else {
    updated = {
      id: banner.id || `banner_${Date.now()}`,
      title: banner.title || 'New Ad Banner',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      image_url: banner.image_url || '/banners/festive_saree_sale_banner.jpg',
      link_url: banner.link_url || '/category/sarees',
      status: banner.status || 'Active',
      display_order: newOrder,
      created_at: new Date().toISOString(),
    };
    current.push(updated);
  }

  setLocalBanners(current);

  // Persist to Supabase
  try {
    const payload: any = {
      title: updated.title,
      image_url: updated.image_url,
      link_url: updated.link_url || '/category/sarees',
      status: updated.status,
      display_order: updated.display_order,
    };

    if (isUuid && banner.id) {
      await supabase.from('banners').update(payload).eq('id', banner.id);
    } else {
      const { data: inserted } = await supabase.from('banners').insert(payload).select().single();
      if (inserted?.id) {
        updated.id = inserted.id;
        const freshList = current.map(b => b === updated ? { ...b, id: inserted.id } : b);
        setLocalBanners(freshList);
      }
    }
  } catch (err) {
    console.warn('[Banners] Supabase persist error:', err);
  }

  return updated;
}

/**
 * Delete a banner
 */
export async function deleteBanner(id: string): Promise<boolean> {
  const current = getLocalBanners().filter(b => b.id !== id);
  setLocalBanners(current);

  try {
    await supabase.from('banners').delete().eq('id', id);
  } catch (e) {
    console.warn('[Banners] Delete Supabase error:', e);
  }
  return true;
}

/**
 * Reset / Seed default ad banners into Supabase
 */
export async function resetBannersToDefault(): Promise<AdBanner[]> {
  setLocalBanners(DEFAULT_AD_BANNERS);

  try {
    // Delete existing rows
    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Insert new defaults
    const rows = DEFAULT_AD_BANNERS.map((b) => ({
      title: b.title,
      image_url: b.image_url,
      link_url: b.link_url,
      status: b.status,
      display_order: b.display_order,
    }));
    await supabase.from('banners').insert(rows);
  } catch (e) {
    console.warn('[Banners] Seed defaults error:', e);
  }

  return DEFAULT_AD_BANNERS;
}

/**
 * Upload banner image to Supabase Storage products bucket
 */
export async function uploadBannerImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `banners/${Date.now()}_${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from('products')
      .upload(path, file, {
        upsert: true,
        contentType: file.type || `image/${ext}`,
      });

    if (!error && data?.path) {
      const { data: pubData } = supabase.storage.from('products').getPublicUrl(data.path);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (e) {
    console.warn('[Banners] Storage upload error, using local Data URL fallback:', e);
  }

  // Fallback: base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
