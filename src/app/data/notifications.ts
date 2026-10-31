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

// Mock notifications permanently removed
export const DEFAULT_OFFER_NOTIFICATIONS: OfferNotification[] = [];

const STORAGE_KEY = 'aanya_offer_notifications';
const MOCK_IDS = ['notif-1', 'notif-2', 'notif-3', 'notif-4'];
const MOCK_TITLES = [
  'big fashion festival',
  'big brands bash',
  'best brands, best deals',
  'checks pedding handloom special',
];

export function isRealNotification(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const id = String(item.id || '').trim();
  const title = String(item.title || '').trim().toLowerCase();

  if (MOCK_IDS.includes(id)) return false;
  if (MOCK_TITLES.some(mockTitle => title.includes(mockTitle))) return false;

  return true;
}

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
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(isRealNotification);
        // If dirty mock entries were found, sanitize stored state immediately
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {}
  return [];
}

export function saveLocalNotifications(list: OfferNotification[]) {
  try {
    const cleaned = (list || []).filter(isRealNotification);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('offer-notifications-updated', { detail: cleaned }));
    getChannel()?.postMessage({ type: 'NOTIFICATIONS_UPDATED', list: cleaned });
  } catch (e) {}
}

export async function fetchOfferNotifications(): Promise<OfferNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const formatted: OfferNotification[] = data
        .filter(isRealNotification)
        .map((item: any) => ({
          id: String(item.id),
          title: item.title,
          image_url: item.image_url || '/logo.png',
          link_url: item.link_url || '/category/sarees',
          material_category: item.material_category,
          time_ago: item.time_ago || 'Recently',
          status: item.status || 'Active',
          created_at: item.created_at,
        }));

      saveLocalNotifications(formatted);
      return formatted;
    }
  } catch (e) {
    console.warn('Supabase notifications fetch note:', e);
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
    image_url: notif.image_url || '/logo.png',
    link_url: notif.link_url || '/category/sarees',
    material_category: notif.material_category || 'Sarees',
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

  try {
    await supabase.from('notifications').upsert([fullNotif]);
  } catch (e) {
    console.warn('Supabase notifications upsert note:', e);
  }

  return fullNotif;
}

export async function deleteOfferNotification(id: string): Promise<boolean> {
  const current = getLocalNotifications();
  const updated = current.filter(n => n.id !== id);
  saveLocalNotifications(updated);

  try {
    await supabase.from('notifications').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase notifications delete note:', e);
  }

  return true;
}
