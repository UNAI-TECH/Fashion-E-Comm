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

// Strictly NO mock, default, or preset banners. Storefront shows only admin-uploaded banners.
export const DEFAULT_AD_BANNERS: AdBanner[] = [];

const LOCAL_STORAGE_KEY = 'aanya_ad_banners';
const LOCAL_STORAGE_INITIALIZED = 'aanya_ad_banners_customized';

// Demo banner signatures to purge if present in legacy browser storage
const DEMO_TITLES = [
  'mega blockbuster',
  'royal banarasi',
  'festive elegance 2026',
  'flat 50-70% off',
  'festival boutique sale'
];

function isDemoBanner(b: any): boolean {
  if (!b) return false;
  const title = (b.title || '').toLowerCase();
  return DEMO_TITLES.some(d => title.includes(d));
}

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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge legacy demo banners
        const filtered = parsed.filter(b => !isDemoBanner(b) && b.image_url);
        if (filtered.length !== parsed.length) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn('[Banners] Local storage parse error:', e);
  }
  return [];
}

export function setLocalBanners(banners: AdBanner[]) {
  try {
    // Filter out any accidental demo banners
    const cleanBanners = (banners || []).filter(b => !isDemoBanner(b));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanBanners));
    localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');

    // 1. Dispatch window event for current window
    window.dispatchEvent(new CustomEvent('ad-banners-updated', { detail: cleanBanners }));

    // 2. BroadcastChannel for instant cross-tab sync
    const ch = getBannersChannel();
    if (ch) {
      ch.postMessage({ type: 'BANNERS_UPDATED', banners: cleanBanners });
    }

    // 3. Supabase realtime channel broadcast
    try {
      const rt = getSupabaseBannersChannel();
      if (rt) {
        rt.send({
          type: 'broadcast',
          event: 'banners_updated',
          payload: { banners: cleanBanners },
        });
      }
    } catch {}
  } catch (e) {
    console.warn('[Banners] Local storage set error:', e);
  }
}

/**
 * Fetch all active banners for the storefront exclusively from Supabase
 */
export async function fetchActiveBanners(): Promise<AdBanner[]> {
  // 1. Query Supabase direct select
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'Active')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data)) {
      const valid = data.filter(b => !isDemoBanner(b) && b.image_url);
      const formatted: AdBanner[] = valid.map((b: any, index: number) => ({
        id: b.id,
        title: b.title || 'Special Collection',
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
  } catch (e) {}

  // 2. Try backend API endpoint
  try {
    const res = await fetch('/api/banners?active=true', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const valid = json.data.filter((b: any) => !isDemoBanner(b) && b.image_url);
        setLocalBanners(valid);
        return valid;
      }
    }
  } catch (apiErr) {}

  // Return clean local cache or empty array
  return getLocalBanners().filter(b => b.status === 'Active' && !isDemoBanner(b));
}

/**
 * Fetch all banners for Admin dashboard
 */
export async function fetchAllBannersAdmin(): Promise<AdBanner[]> {
  // 1. Try Supabase direct select
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data)) {
      const valid = data.filter(b => !isDemoBanner(b));
      const formatted: AdBanner[] = valid.map((b: any, index: number) => ({
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
    console.warn('[Banners Admin] Supabase query error:', e);
  }

  // 2. Try backend API endpoint
  try {
    const res = await fetch('/api/banners', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const valid = json.data.filter((b: any) => !isDemoBanner(b));
        setLocalBanners(valid);
        return valid;
      }
    }
  } catch (apiErr) {}

  return getLocalBanners().filter(b => !isDemoBanner(b));
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
      image_url: banner.image_url || '',
      link_url: banner.link_url || '/category/sarees',
      status: banner.status || 'Active',
      display_order: newOrder,
      created_at: new Date().toISOString(),
    };
    current.push(updated);
  }

  setLocalBanners(current);

  // 1. Direct Supabase save (primary)
  try {
    const payload: any = {
      title: updated.title,
      subtitle: updated.subtitle || '',
      badge: updated.badge || '',
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
    console.warn('[Banners] Direct Supabase save error:', err);
  }

  // 2. Persist via backend API fallback
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
      }
    }
  } catch (apiErr) {}

  return updated;
}

/**
 * Delete a banner permanently (local and backend)
 */
export async function deleteBanner(id: string, extra?: { image_url?: string; title?: string }): Promise<boolean> {
  // 1. Instant local removal and broadcast to storefront tab
  const current = getLocalBanners().filter(b => b.id !== id && (!extra?.image_url || b.image_url !== extra.image_url));
  setLocalBanners(current);

  // 2. Direct Supabase delete
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
  } else if (extra?.title) {
    try {
      await supabase.from('banners').delete().eq('title', extra.title);
    } catch (e) {}
  }

  // 3. Delete via backend API
  try {
    const params = new URLSearchParams({ id });
    if (extra?.image_url) params.set('image_url', extra.image_url);
    if (extra?.title) params.set('title', extra.title);

    await fetch(`/api/banners?${params.toString()}`, { method: 'DELETE' });
  } catch (apiErr) {}

  return true;
}

/**
 * Upload banner image directly to Supabase Storage products bucket
 */
export async function uploadBannerImage(file: File): Promise<string> {
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

  // High-performance Canvas Compression fallback
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
