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
    id: '7cc4b364-dfe6-484e-ad72-26f02d2abf59',
    title: "Mega Blockbuster Saree Sale — Up to 80% Off",
    subtitle: "Festive Maroon & Gold Pure Silk Sarees",
    badge: "MEGA BLOCKBUSTER SALE",
    image_url: "/banners/festive_saree_sale_banner.jpg",
    link_url: "/category/sarees",
    status: 'Active',
    display_order: 1,
  },
  {
    id: 'd1f7e0ca-16c7-4c52-b078-dd85213e3dca',
    title: "Flat 50-70% Off Handcrafted Heritage Silk",
    subtitle: "Royal Emerald & Gold Zari Banarasi Weaves",
    badge: "ROYAL WEDDING COLLECTION",
    image_url: "/banners/royal_banarasi_saree_banner.jpg",
    link_url: "/category/sarees",
    status: 'Active',
    display_order: 2,
  },
  {
    id: '4a5a4295-2cb3-49ba-b7d4-21a6a362723f',
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
const LOCAL_STORAGE_INITIALIZED = 'aanya_ad_banners_customized';

// Persistent cross-tab BroadcastChannel singleton
let globalBroadcastChannel: BroadcastChannel | null = null;
export function getBannersChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!globalBroadcastChannel) {
    try {
      globalBroadcastChannel = new BroadcastChannel('aanya_banners_realtime_bus');
    } catch (e) {
      console.warn('[Banners] BroadcastChannel not supported:', e);
    }
  }
  return globalBroadcastChannel;
}

// Persistent Supabase Realtime channel singleton
let realtimeChannel: any = null;
export function getSupabaseBannersChannel() {
  if (!realtimeChannel) {
    try {
      realtimeChannel = supabase.channel('aanya_banners_realtime_broadcast');
      realtimeChannel.subscribe();
    } catch (e) {
      console.warn('[Banners] Realtime channel error:', e);
    }
  }
  return realtimeChannel;
}

export function getLocalBanners(): AdBanner[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const hasCustomized = localStorage.getItem(LOCAL_STORAGE_INITIALIZED) === 'true';

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // If user customized (or deleted all banners), respect the stored array
        if (hasCustomized) {
          return parsed;
        }
        if (parsed.length > 0) {
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
    localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');

    // 1. Dispatch window event for current window
    window.dispatchEvent(new CustomEvent('ad-banners-updated', { detail: banners }));

    // 2. BroadcastChannel for instant cross-tab sync
    const ch = getBannersChannel();
    if (ch) {
      ch.postMessage({ type: 'BANNERS_UPDATED', banners });
    }

    // 3. Supabase realtime channel broadcast
    try {
      const rt = getSupabaseBannersChannel();
      if (rt) {
        rt.send({
          type: 'broadcast',
          event: 'banners_updated',
          payload: { banners },
        });
      }
    } catch {}
  } catch (e) {
    console.warn('[Banners] Local storage set error:', e);
  }
}

/**
 * Fetch all active banners for the storefront
 */
export async function fetchActiveBanners(): Promise<AdBanner[]> {
  // 1. First try backend API endpoint (bypasses RLS with service role)
  try {
    const res = await fetch('/api/banners?active=true', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list: AdBanner[] = json.data;
        setLocalBanners(list);
        return list;
      }
    }
  } catch (apiErr) {
    // API not responding
  }

  // 2. Fallback to Supabase direct select (public anon read)
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'Active')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data)) {
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
  // 1. Try backend API endpoint
  try {
    const res = await fetch('/api/banners', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list: AdBanner[] = json.data;
        setLocalBanners(list);
        return list;
      }
    }
  } catch (apiErr) {}

  // 2. Fallback to Supabase direct select
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data)) {
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
  const newOrder = banner.display_order ?? (current.length + 1);

  // Optimistic update locally
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

  // 1. Persist via backend API (bypasses RLS with service role)
  try {
    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.id) {
        updated.id = json.data.id;
        if (json.data.image_url) updated.image_url = json.data.image_url;
        const freshList = current.map(b => b === updated ? { ...b, id: json.data.id, image_url: json.data.image_url || b.image_url } : b);
        setLocalBanners(freshList);
        return updated;
      }
    }
  } catch (apiErr) {
    console.warn('[Banners] API save failed, attempting direct Supabase:', apiErr);
  }

  // 2. Direct Supabase save fallback
  try {
    const payload: any = {
      title: updated.title,
      image_url: updated.image_url,
      link_url: updated.link_url || '/category/sarees',
      status: updated.status,
      display_order: updated.display_order,
    };
    const isUuid = !!(banner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id));
    if (isUuid) {
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
    console.warn('[Banners] Direct Supabase error:', err);
  }

  return updated;
}

/**
 * Delete a banner permanently (local and backend)
 */
export async function deleteBanner(id: string, extra?: { image_url?: string; title?: string }): Promise<boolean> {
  // 1. Instant local removal and broadcast to storefront tab
  const current = getLocalBanners().filter(b => b.id !== id && (!extra?.image_url || b.image_url !== extra.image_url));
  setLocalBanners(current);

  // 2. Delete permanently from backend / Supabase
  try {
    const params = new URLSearchParams({ id });
    if (extra?.image_url) params.set('image_url', extra.image_url);
    if (extra?.title) params.set('title', extra.title);

    const res = await fetch(`/api/banners?${params.toString()}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return true;
      }
    }
  } catch (apiErr) {
    console.warn('[Banners] API delete failed, attempting direct:', apiErr);
  }

  // 3. Direct Supabase delete fallback (if valid UUID)
  const isUuid = !!(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  if (isUuid) {
    try {
      await supabase.from('banners').delete().eq('id', id);
    } catch (e) {
      console.warn('[Banners] Supabase delete error:', e);
    }
  } else if (extra?.image_url) {
    try {
      await supabase.from('banners').delete().eq('image_url', extra.image_url);
    } catch (e) {}
  }

  return true;
}

/**
 * Reset / Seed default ad banners
 */
export async function resetBannersToDefault(): Promise<AdBanner[]> {
  setLocalBanners(DEFAULT_AD_BANNERS);

  try {
    const res = await fetch('/api/banners/reset', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        setLocalBanners(json.data);
        return json.data;
      }
    }
  } catch (e) {}

  return DEFAULT_AD_BANNERS;
}

/**
 * Upload banner image directly to Supabase Storage products bucket
 * Returns permanent public URL, with optimized local canvas fallback.
 */
export async function uploadBannerImage(file: File): Promise<string> {
  // 1. Upload to Supabase Storage products bucket
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `banners/${Date.now()}_${cleanName}`;

    const { data, error } = await supabase.storage
      .from('products')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);
      if (publicUrl) return publicUrl;
    }
  } catch (err) {
    console.warn('[Banners] Direct Supabase storage upload failed, falling back:', err);
  }

  // 2. High-performance Canvas Compression fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
