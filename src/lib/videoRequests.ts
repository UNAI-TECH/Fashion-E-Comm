import { supabase } from './supabase';

export interface VideoRequest {
  id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  product_price?: number;
  customer_name: string;
  whatsapp_number: string;
  scheduled_date: string;
  scheduled_time: string;
  reason?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

const STORAGE_KEY = 'aanya_video_requests_cache_v1';

function getCachedRequests(): VideoRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any legacy mock/demo samples
        const realOnly = parsed.filter(
          (r: any) => r && r.id && !String(r.id).startsWith('vid_req_sample_')
        );
        return realOnly;
      }
    }
  } catch {}
  return [];
}

function saveCachedRequests(list: VideoRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Fetch all video call requests (Supabase + fallback cache)
 */
export async function fetchVideoRequests(): Promise<VideoRequest[]> {
  try {
    const { data, error } = await supabase
      .from('video_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      // Filter out any mock samples
      const realDbData = data.filter((r: any) => r && !String(r.id).startsWith('vid_req_sample_'));
      const cached = getCachedRequests();
      const dbMap = new Map<string, VideoRequest>();
      realDbData.forEach((r: any) => dbMap.set(r.id, r));
      cached.forEach(c => {
        if (!dbMap.has(c.id)) dbMap.set(c.id, c);
      });
      const merged = Array.from(dbMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      saveCachedRequests(merged);
      return merged;
    }
  } catch (e) {
    console.warn('[VideoRequests] Fetch notice:', e);
  }

  return getCachedRequests();
}

/**
 * Create a new video request from customer
 */
export async function createVideoRequest(req: Omit<VideoRequest, 'id' | 'created_at' | 'status'>): Promise<VideoRequest> {
  const newReq: VideoRequest = {
    ...req,
    id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    status: 'Pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save to local cache first
  const existing = getCachedRequests();
  const updated = [newReq, ...existing.filter(x => x.id !== newReq.id)];
  saveCachedRequests(updated);

  // 2. Dispatch local custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aanya:new_video_request', { detail: newReq }));
  }

  // 3. Insert into Supabase table
  try {
    await supabase.from('video_requests').insert([newReq]);
  } catch (err) {
    console.warn('[VideoRequests] Supabase insert notice:', err);
  }

  // 4. Broadcast across active browser tabs & admin panel
  try {
    const channel = supabase.channel('aanya-video-requests-stream', {
      config: { broadcast: { self: true } },
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'video_request_created',
          payload: newReq,
        }).catch(() => {});
      }
    });
  } catch {}

  return newReq;
}

/**
 * Update video request status (Accept / Reject)
 */
export async function updateVideoRequestStatus(
  id: string,
  status: 'Accepted' | 'Rejected',
  adminNotes?: string
): Promise<boolean> {
  const now = new Date().toISOString();

  // 1. Update cache
  const cached = getCachedRequests();
  const updated = cached.map(r => r.id === id ? { ...r, status, admin_notes: adminNotes, updated_at: now } : r);
  saveCachedRequests(updated);

  // 2. Local event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aanya:video_request_updated', { detail: { id, status, adminNotes } }));
  }

  // 3. Update Supabase
  try {
    await supabase
      .from('video_requests')
      .update({ status, admin_notes: adminNotes, updated_at: now })
      .eq('id', id);
  } catch (err) {
    console.warn('[VideoRequests] Supabase update notice:', err);
  }

  // 4. Broadcast
  try {
    const channel = supabase.channel('aanya-video-requests-stream', {
      config: { broadcast: { self: true } },
    });
    channel.subscribe((subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'video_request_status_changed',
          payload: { id, status, adminNotes, updated_at: now },
        }).catch(() => {});
      }
    });
  } catch {}

  return true;
}

/**
 * Helper to build prefilled WhatsApp URL with default template
 */
export function buildWhatsAppLink(req: VideoRequest, action: 'Accepted' | 'Rejected'): string {
  let cleanPhone = req.whatsapp_number.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const dateStr = req.scheduled_date;
  const timeStr = req.scheduled_time;
  const prodName = req.product_name;
  const custName = req.customer_name || 'Customer';

  let text = '';
  if (action === 'Accepted') {
    text = `Hello ${custName}, you are requesting a video call request from Aanya Fashions on ${dateStr} at ${timeStr} for ${prodName}. When you are available, we should proceed with the call. Thank you!`;
  } else {
    text = `Hello ${custName}, your video call request from Aanya Fashions for ${prodName} on ${dateStr} at ${timeStr} has been rejected / unavailable. Please feel free to reschedule another convenient time. Thank you!`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

