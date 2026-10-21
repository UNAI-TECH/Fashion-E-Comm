import { supabase } from '../../lib/supabase';

export interface OfferNotification {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  material_category?: string;
  time_ago?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export const DEFAULT_OFFER_NOTIFICATIONS: OfferNotification[] = [
  {
    id: 'notif-1',
    title: 'Big Fashion Festival is LIVE 🔥',
    image_url: '/cat_kanchi_cotton.jpg',
    link_url: '/kanchicotton',
    material_category: 'Kanchi Cotton',
    time_ago: 'Just now',
    status: 'Active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hrs ago
  },
  {
    id: 'notif-2',
    title: 'Big Brands Bash is LIVE 💥',
    image_url: '/cat_viscose.jpg',
    link_url: '/viscose',
    material_category: 'Viscose Sarees',
    time_ago: '24 hrs ago',
    status: 'Active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hrs ago
  },
  {
    id: 'notif-3',
    title: 'Best brands, best deals! 👑',
    image_url: '/cat_fancy.jpg',
    link_url: '/fancy-sarees',
    material_category: 'Fancy Sarees',
    time_ago: '3 days ago',
    status: 'Active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Checks Pedding Handloom Special 🥻',
    image_url: '/cat_checks_pedding.jpg',
    link_url: '/checks-pedding',
    material_category: 'Checks Pedding',
    time_ago: '1 week ago',
    status: 'Active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
  },
];

const STORAGE_KEY = 'aanya_offer_notifications';
let bc: BroadcastChannel | null = null;

function getChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!bc) {
    try {
      bc = new BroadcastChannel('aanya_notifications_bus');
    } catch (e) {}
  }
  return bc;
}

export function getLocalNotifications(): OfferNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return DEFAULT_OFFER_NOTIFICATIONS;
}

export function saveLocalNotifications(list: OfferNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('offer-notifications-updated', { detail: list }));
    getChannel()?.postMessage({ type: 'NOTIFICATIONS_UPDATED', list });
  } catch (e) {}
}

const SUPABASE_TABLE_KEY = 'aanya_notifications_missing';

function isSupabaseTableMissing(): boolean {
  try {
    return localStorage.getItem(SUPABASE_TABLE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function resetNotificationsTableCache() {
  try {
    localStorage.removeItem(SUPABASE_TABLE_KEY);
  } catch {}
}

export async function fetchOfferNotifications(): Promise<OfferNotification[]> {
  // If we already detected the table is absent in Supabase, use local notifications immediately without sending network requests
  if (isSupabaseTableMissing()) {
    return getLocalNotifications();
  }

  try {
    const { data, error, status } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (status === 404 || (error as any)?.code === 'PGRST205' || String(error.message).includes('relation "public.notifications" does not exist')) {
        try {
          localStorage.setItem(SUPABASE_TABLE_KEY, 'true');
        } catch {}
      }
      return getLocalNotifications();
    }

    if (Array.isArray(data)) {
      try {
        localStorage.removeItem(SUPABASE_TABLE_KEY);
      } catch {}

      if (data.length > 0) {
        const formatted: OfferNotification[] = data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          image_url: item.image_url || '/cat_kanchi_cotton.jpg',
          link_url: item.link_url || '/kanchicotton',
          material_category: item.material_category,
          time_ago: item.time_ago || 'Recently',
          status: item.status || 'Active',
          created_at: item.created_at,
        }));
        saveLocalNotifications(formatted);
        return formatted;
      }
    }
  } catch {
    try {
      localStorage.setItem(SUPABASE_TABLE_KEY, 'true');
    } catch {}
  }

  return getLocalNotifications();
}

export async function saveOfferNotification(notif: Partial<OfferNotification>): Promise<OfferNotification> {
  const current = getLocalNotifications();
  const id = notif.id || `notif-${Date.now()}`;
  const now = new Date().toISOString();

  const fullNotif: OfferNotification = {
    id,
    title: notif.title || 'Special Saree Festive Offer 🔥',
    image_url: notif.image_url || '/cat_kanchi_cotton.jpg',
    link_url: notif.link_url || '/kanchicotton',
    material_category: notif.material_category || 'Kanchi Cotton',
    time_ago: notif.time_ago || 'Just now',
    status: notif.status || 'Active',
    created_at: notif.created_at || now,
  };

  const existingIdx = current.findIndex(n => n.id === id);
  let updatedList: OfferNotification[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = fullNotif;
  } else {
    updatedList = [fullNotif, ...current];
  }

  saveLocalNotifications(updatedList);

  // Try saving to Supabase if table is not marked missing
  if (!isSupabaseTableMissing()) {
    try {
      await supabase.from('notifications').upsert([fullNotif]);
    } catch (e) {}
  }

  return fullNotif;
}

export async function deleteOfferNotification(id: string): Promise<boolean> {
  const current = getLocalNotifications();
  const updated = current.filter(n => n.id !== id);
  saveLocalNotifications(updated);

  if (!isSupabaseTableMissing()) {
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (e) {}
  }

  return true;
}
