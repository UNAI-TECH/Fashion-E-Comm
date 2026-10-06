import { supabase } from '../../lib/supabase';

export interface HeroModel {
  id: string;
  src: string;          // Model image URL (wearing the dress)
  label: string;        // Outfit title / dress name
  subtitle?: string;    // Secondary tagline
  color: string;        // Theme accent color (hex)
  productId?: string;   // Optional linked product ID
  productName?: string; // Optional linked product title
  price?: number;       // Optional selling price
  link?: string;        // Storefront URL
  status?: 'Active' | 'Inactive';
  display_order: number;
}

export const MODEL_PRESETS = [
  { id: 'preset_1', name: 'Blue Silk Saree', src: '/model_1.png', defaultColor: '#1E3A8A' },
  { id: 'preset_4', name: 'Peach Festive Kurti', src: '/model_4.png', defaultColor: '#EA580C' },
  { id: 'preset_2', name: 'Fusion Floral Dress', src: '/model_2.png', defaultColor: '#D4AF37' },
  { id: 'preset_5', name: 'Pink Anarkali Suit', src: '/model_5.png', defaultColor: '#BE185D' },
  { id: 'preset_3', name: 'Soft Lilac Gown', src: '/model_3.png', defaultColor: '#8B5CF6' },
  { id: 'preset_6', name: 'Royal Maroon Silk Saree', src: '/saree_maroon_model_cutout.png', defaultColor: '#831843' },
  { id: 'preset_7', name: 'Emerald Zari Banarasi Saree', src: '/saree_emerald_model_cutout.png', defaultColor: '#047857' },
  { id: 'preset_8', name: 'Royal Chocolate Velvet Lehenga', src: '/lehenga_l1_cutout.png', defaultColor: '#78350F' },
  { id: 'preset_9', name: 'Blush Peach Sequin Lehenga', src: '/lehenga_l3_cutout.png', defaultColor: '#BE185D' },
  { id: 'preset_10', name: 'Chanderi White Kurta Set', src: '/kurti_k1_cutout.png', defaultColor: '#EA580C' },
];

// Helper to automatically map any catalog product or dress photo to its transparent model cutout
export function resolveTransparentCutoutUrl(src: string): string {
  if (!src) return src;
  if (src.includes('_cutout.png')) return src;

  // Extract base filename without extension
  const fileName = src.split('/').pop()?.split('?')[0] || '';
  const baseName = fileName.replace(/\.[^.]+$/, '');

  const cutoutMap: Record<string, string> = {
    'saree_model_editorial': '/saree_maroon_model_cutout.png',
    'saree_emerald_model': '/saree_emerald_model_cutout.png',
    'saree_maroon_model': '/saree_maroon_model_cutout.png',
    'kurti_k1': '/kurti_k1_cutout.png',
    'kurti_k2': '/kurti_k2_cutout.png',
    'kurti_k3': '/kurti_k3_cutout.png',
    'kurti_k4': '/kurti_k4_cutout.png',
    'kurti_k5': '/kurti_k5_cutout.png',
    'lehenga_l1': '/lehenga_l1_cutout.png',
    'lehenga_l2': '/lehenga_l2_cutout.png',
    'lehenga_l3': '/lehenga_l3_cutout.png',
    'lehenga_l4': '/lehenga_l4_cutout.png',
    'lehenga_l5': '/lehenga_l5_cutout.png',
    'salwar_ss1': '/salwar_ss1_cutout.png',
    'salwar_ss2': '/salwar_ss2_cutout.png',
    'salwar_ss3': '/salwar_ss3_cutout.png',
    'salwar_ss4': '/salwar_ss4_cutout.png',
    'salwar_ss5': '/salwar_ss5_cutout.png',
    'tradition_t1': '/tradition_t1_cutout.png',
    'tradition_t2': '/tradition_t2_cutout.png',
    'tradition_t3': '/tradition_t3_cutout.png',
    'tradition_t4': '/tradition_t4_cutout.png',
    'tradition_t5': '/tradition_t5_cutout.png',
  };

  if (cutoutMap[baseName]) {
    return cutoutMap[baseName];
  }

  if (
    baseName.startsWith('kurti_') ||
    baseName.startsWith('lehenga_') ||
    baseName.startsWith('salwar_') ||
    baseName.startsWith('tradition_') ||
    baseName.startsWith('saree_') ||
    baseName.startsWith('western_') ||
    baseName.startsWith('maxi_')
  ) {
    return `/${baseName}_cutout.png`;
  }

  return src;
}

export const DEFAULT_HERO_MODELS: HeroModel[] = [
  {
    id: 'hero_1',
    src: '/saree_maroon_model_cutout.png',
    label: 'Royal Maroon Silk Saree',
    subtitle: 'Discover Trending Sarees',
    color: '#1E3A8A',
    productId: 'ebd3b2df-4aa8-4ee4-9d5c-31a03a247ee3',
    productName: 'Royal Maroon Silk Saree',
    price: 4999,
    link: '/product/ebd3b2df-4aa8-4ee4-9d5c-31a03a247ee3',
    status: 'Active',
    display_order: 1
  },
  {
    id: 'hero_2',
    src: '/kurti_k1_cutout.png',
    label: 'Chanderi White Kurta Set',
    subtitle: 'Artisanal Weaves & Cuts',
    color: '#EA580C',
    productId: 'a2fae647-9ddc-4d4c-8ce8-cc9a91e49375',
    productName: 'Chanderi White Kurta & Pink Dupatta Set',
    price: 3499,
    link: '/product/a2fae647-9ddc-4d4c-8ce8-cc9a91e49375',
    status: 'Active',
    display_order: 2
  },
  {
    id: 'hero_3',
    src: '/lehenga_l1_cutout.png',
    label: 'Royal Chocolate Velvet Lehenga',
    subtitle: 'Bridal & Festive Grandeur',
    color: '#D4AF37',
    productId: 'e87ded83-2ea8-4a16-8470-0fadfee42fd1',
    productName: 'Royal Chocolate Embroidered Velvet Lehenga',
    price: 18999,
    link: '/product/e87ded83-2ea8-4a16-8470-0fadfee42fd1',
    status: 'Active',
    display_order: 3
  },
  {
    id: 'hero_4',
    src: '/lehenga_l3_cutout.png',
    label: 'Blush Peach Sequin Lehenga',
    subtitle: 'Soft Festive Elegance',
    color: '#BE185D',
    productId: '251122ad-af7a-4ef4-9293-e9ca068e286e',
    productName: 'Blush Peach Sequin Silk Lehenga',
    price: 12999,
    link: '/product/251122ad-af7a-4ef4-9293-e9ca068e286e',
    status: 'Active',
    display_order: 4
  },
  {
    id: 'hero_5',
    src: '/saree_emerald_model_cutout.png',
    label: 'Emerald Zari Banarasi Saree',
    subtitle: 'Evening Royal Grace',
    color: '#047857',
    productId: '33f4bdd2-9866-41e8-91ae-0390ab0e8e9f',
    productName: 'Emerald Zari Banarasi Saree',
    price: 8499,
    link: '/product/33f4bdd2-9866-41e8-91ae-0390ab0e8e9f',
    status: 'Active',
    display_order: 5
  },
];

export const STORAGE_KEY = 'aanya_hero_models_v5';

let persistentBroadcastChannel: BroadcastChannel | null = null;
function getPersistentBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!persistentBroadcastChannel) {
    persistentBroadcastChannel = new BroadcastChannel('hero_models_channel');
  }
  return persistentBroadcastChannel;
}

export function getLocalHeroModels(): HeroModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: HeroModel) => ({
          ...m,
          src: resolveTransparentCutoutUrl(m.src),
        }));
      }
    }
  } catch (e) {
    console.warn('[HeroModels] Error reading local storage:', e);
  }
  return DEFAULT_HERO_MODELS;
}

export function setLocalHeroModels(models: HeroModel[], activeIndex?: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
    localStorage.setItem('aanya_hero_models_ts', Date.now().toString());
    if (typeof activeIndex === 'number' && activeIndex >= 0) {
      localStorage.setItem('aanya_hero_active_index', activeIndex.toString());
    }
  } catch (e) {
    console.warn('[HeroModels] Error writing local storage:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hero-models-updated', { detail: { models, activeIndex } }));
  }

  try {
    const bc = getPersistentBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'HERO_MODELS_UPDATED', models, activeIndex });
    }
  } catch (e) {
    console.warn('[HeroModels] BroadcastChannel postMessage error:', e);
  }

  // Also broadcast via Supabase Realtime channel so any tab/window receives it instantly
  try {
    const channel = supabase.channel('banners_sync');
    if (typeof (channel as any).httpSend === 'function') {
      (channel as any).httpSend({
        type: 'broadcast',
        event: 'hero_update',
        payload: { models, activeIndex },
      });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'hero_update',
        payload: { models, activeIndex },
      });
    }
  } catch (e) {}
}

// Convert a Supabase banners record to a HeroModel
function bannerToHeroModel(row: any, index: number): HeroModel {
  let meta: any = {};
  if (row.link_url) {
    try {
      meta = JSON.parse(row.link_url);
    } catch {
      meta = { link: row.link_url };
    }
  }

  return {
    id: row.id || `hero_${index + 1}`,
    src: resolveTransparentCutoutUrl(row.image_url || '/model_1.png'),
    label: row.title || 'Trending Outfit',
    subtitle: meta.subtitle || 'Discover Trending Styles',
    color: meta.color || '#1E3A8A',
    productId: meta.productId,
    productName: meta.productName,
    price: meta.price,
    link: meta.link || (meta.productId ? `/product/${meta.productId}` : '/products'),
    status: row.status === 'Inactive' ? 'Inactive' : 'Active',
    display_order: row.display_order ?? (index + 1),
  };
}

// Convert HeroModel to Supabase banners record
function heroModelToBanner(model: HeroModel) {
  const meta = {
    color: model.color,
    subtitle: model.subtitle || '',
    productId: model.productId || '',
    productName: model.productName || '',
    price: model.price,
    link: model.link || (model.productId ? `/product/${model.productId}` : ''),
  };

  return {
    title: model.label,
    image_url: model.src,
    link_url: JSON.stringify(meta),
    status: model.status || 'Active',
    display_order: model.display_order,
  };
}

/**
 * Fetch all active hero models for the storefront hero coverflow
 */
export async function fetchHeroModels(): Promise<HeroModel[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'Active')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const parsed = data.map(bannerToHeroModel);
      setLocalHeroModels(parsed);
      return parsed;
    }
  } catch (e) {
    console.warn('[HeroModels] Error fetching from Supabase, using local:', e);
  }

  return getLocalHeroModels().filter(m => m.status !== 'Inactive');
}

/**
 * Fetch all hero models for the Admin panel (both Active and Inactive)
 */
export async function fetchAllHeroModelsAdmin(): Promise<HeroModel[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const parsed = data.map(bannerToHeroModel);
      setLocalHeroModels(parsed);
      return parsed;
    }

    // If Supabase is empty, seed with defaults
    if (!error && (!data || data.length === 0)) {
      await seedDefaultHeroModels();
      return DEFAULT_HERO_MODELS;
    }
  } catch (e) {
    console.warn('[HeroModels Admin] Error fetching from Supabase:', e);
  }

  return getLocalHeroModels();
}

/**
 * Save or update a hero model (Admin) - Instant local application + atomic Supabase persist
 */
export async function saveHeroModel(model: Partial<HeroModel>): Promise<HeroModel> {
  const current = getLocalHeroModels();
  const isUuid = !!(model.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(model.id));
  const newDisplayOrder = model.display_order ?? (current.length + 1);

  // Find existing slot either by UUID, matching ID, or by display_order
  const existingIndex = current.findIndex(m => {
    if (model.id && m.id === model.id) return true;
    if (m.display_order === newDisplayOrder) return true;
    return false;
  });

  const existingModel = existingIndex >= 0 ? current[existingIndex] : null;
  const resolvedSrc = resolveTransparentCutoutUrl(model.src || existingModel?.src || '/model_1.png');

  let updatedModel: HeroModel;
  if (existingModel) {
    updatedModel = {
      ...existingModel,
      ...model,
      src: resolvedSrc,
      display_order: newDisplayOrder,
    };
  } else {
    updatedModel = {
      id: model.id || `model_${Date.now()}`,
      src: resolvedSrc,
      label: model.label || 'New Model Outfit',
      subtitle: model.subtitle || 'Trending Style',
      color: model.color || '#698156',
      productId: model.productId,
      productName: model.productName,
      price: model.price,
      link: model.link || (model.productId ? `/product/${model.productId}` : ''),
      status: model.status || 'Active',
      display_order: newDisplayOrder,
    };
  }

  // 1. Immediately update list in place & broadcast so storefront reflects change in real time
  let nextList: HeroModel[];
  if (existingIndex >= 0) {
    nextList = [...current];
    nextList[existingIndex] = updatedModel;
  } else {
    nextList = [...current, updatedModel];
  }
  nextList.sort((a, b) => a.display_order - b.display_order);
  setLocalHeroModels(nextList, newDisplayOrder - 1);

  // 2. Persist to Supabase banners table
  try {
    const payload = heroModelToBanner(updatedModel);
    let bannerIdToUpdate = isUuid ? model.id : (existingModel && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingModel.id)) ? existingModel.id : null;

    if (!bannerIdToUpdate) {
      const { data: matchedBanner } = await supabase
        .from('banners')
        .select('id')
        .eq('display_order', newDisplayOrder)
        .maybeSingle();

      if (matchedBanner?.id) {
        bannerIdToUpdate = matchedBanner.id;
      }
    }

    if (bannerIdToUpdate) {
      updatedModel.id = bannerIdToUpdate;
      await supabase.from('banners').update(payload).eq('id', bannerIdToUpdate);
    } else {
      const { data: inserted } = await supabase.from('banners').insert(payload).select().single();
      if (inserted?.id) {
        updatedModel.id = inserted.id;
        const idx = nextList.findIndex(m => m.display_order === newDisplayOrder);
        if (idx >= 0) {
          nextList[idx].id = inserted.id;
          setLocalHeroModels(nextList, newDisplayOrder - 1);
        }
      }
    }
  } catch (e) {
    console.warn('[HeroModels] Supabase save error, persisting locally:', e);
  }

  return updatedModel;
}

/**
 * Delete a hero model (Admin)
 */
export async function deleteHeroModel(id: string): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await supabase.from('banners').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('[HeroModels] Supabase delete error:', e);
  }

  const current = getLocalHeroModels();
  const next = current.filter(m => m.id !== id);
  setLocalHeroModels(next);
  return true;
}

/**
 * Reset hero models back to original defaults
 */
export async function resetHeroModelsToDefault(): Promise<HeroModel[]> {
  try {
    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.warn('[HeroModels] Clear error:', e);
  }

  await seedDefaultHeroModels();
  setLocalHeroModels(DEFAULT_HERO_MODELS);
  return DEFAULT_HERO_MODELS;
}

/**
 * Seed initial default models into Supabase
 */
async function seedDefaultHeroModels(): Promise<void> {
  try {
    const rows = DEFAULT_HERO_MODELS.map(heroModelToBanner);
    await supabase.from('banners').insert(rows);
  } catch (e) {
    console.warn('[HeroModels] Seed error:', e);
  }
}

/**
 * Upload a model photo / cutout to Supabase Storage
 */
export async function uploadModelImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `hero-models/${Date.now()}_${cleanName}`;

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
    console.warn('[HeroModels] Storage upload error, using local Data URL fallback:', e);
  }

  // Fallback: convert to base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
