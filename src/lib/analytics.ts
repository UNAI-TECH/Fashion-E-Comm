/**
 * Real-Time Website Analytics Service for Aanya Fashions
 * Tracks real users, sign-ins, pageviews, visitor sessions, and product clicks.
 * ZERO mock data - 100% driven by real events and Supabase database.
 */

import { supabase } from './supabase';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export type AnalyticsEventType =
  | 'signin'
  | 'visit'
  | 'pageview'
  | 'product_click'
  | 'cart_add'
  | 'checkout'
  | 'purchase';

export interface RealAnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string; // e.g. "13 Nov 2026, 12:30 pm"
  rawTime: number; // Date.now()
  user: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    isAuthenticated: boolean;
  };
  client: {
    device: 'Mobile' | 'Desktop' | 'Tablet';
    browser: string;
    trafficSource: 'Organic Search (Google)' | 'Social (Instagram / FB)' | 'Direct' | 'Referral';
    referrer: string;
    sessionId: string;
  };
  details: {
    path?: string;
    pageTitle?: string;
    productId?: string;
    productName?: string;
    productCategory?: string;
    productPrice?: number;
    productImage?: string;
    orderId?: string;
    amount?: number;
    method?: string;
    meta?: Record<string, any>;
  };
}

const STORAGE_KEY_EVENTS = 'aanya_real_analytics_log_v2';
const STORAGE_KEY_SESSION_ID = 'aanya_analytics_session_id';

// ─── Browser / Device / Source Detectors ───────────────────────────────────────

export function detectDevice(): 'Mobile' | 'Desktop' | 'Tablet' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|android|blackberry|iemobile|kindle/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  if (/chrome|crios/i.test(ua) && !/edge|edg|opr|opera/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return 'Safari';
  if (/edg/i.test(ua)) return 'Edge';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/opera|opr/i.test(ua)) return 'Opera';
  return 'Browser';
}

export function detectTrafficSource(): 'Organic Search (Google)' | 'Social (Instagram / FB)' | 'Direct' | 'Referral' {
  if (typeof window === 'undefined') return 'Direct';

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source')?.toLowerCase();
  if (utmSource?.includes('google')) return 'Organic Search (Google)';
  if (utmSource?.includes('instagram') || utmSource?.includes('facebook') || utmSource?.includes('meta')) {
    return 'Social (Instagram / FB)';
  }

  const ref = document.referrer?.toLowerCase() || '';
  if (ref.includes('google.com') || ref.includes('google.co.in') || ref.includes('bing.com')) {
    return 'Organic Search (Google)';
  }
  if (ref.includes('instagram.com') || ref.includes('facebook.com') || ref.includes('l.instagram.com')) {
    return 'Social (Instagram / FB)';
  }
  if (ref && !ref.includes(window.location.hostname)) {
    return 'Referral';
  }

  return 'Direct';
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'srv_sess';
  try {
    let sid = sessionStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (!sid) {
      sid = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem(STORAGE_KEY_SESSION_ID, sid);
    }
    return sid;
  } catch {
    return `sess_${Date.now()}`;
  }
}

// ─── Current User Snapshot Extraction ─────────────────────────────────────────

export function getCurrentUserSnapshot(): RealAnalyticsEvent['user'] {
  if (typeof window === 'undefined') {
    return { name: 'Visitor', isAuthenticated: false, role: 'guest' };
  }

  // 1. Try Customer Profile Cache
  try {
    const rawCustomer = localStorage.getItem('customer_profile_cache');
    if (rawCustomer) {
      const prof = JSON.parse(rawCustomer);
      if (prof?.id || prof?.email) {
        return {
          id: prof.id,
          name: prof.full_name?.trim() || prof.name?.trim() || 'Customer',
          email: prof.email,
          phone: prof.phone || undefined,
          role: prof.role || 'customer',
          isAuthenticated: true,
        };
      }
    }
  } catch {}

  // 2. Try User Profile Details
  try {
    const rawDetails = localStorage.getItem('user_profile_details');
    if (rawDetails) {
      const d = JSON.parse(rawDetails);
      if (d?.email || d?.name) {
        return {
          name: d.name || 'Customer',
          email: d.email,
          phone: d.phone,
          role: 'customer',
          isAuthenticated: true,
        };
      }
    }
  } catch {}

  // 3. Try Admin Info
  try {
    const rawAdmin = localStorage.getItem('admin_info');
    if (rawAdmin) {
      const a = JSON.parse(rawAdmin);
      if (a?.role === 'admin') {
        return {
          name: a.name || 'Admin',
          email: a.email || 'admin@aanyafashion.com',
          role: 'admin',
          isAuthenticated: true,
        };
      }
    }
  } catch {}

  // 4. Anonymous Guest Visitor
  const sid = getSessionId();
  const shortId = sid.slice(-4).toUpperCase();
  return {
    name: `Guest Visitor #${shortId}`,
    isAuthenticated: false,
    role: 'guest',
  };
}

// ─── Supabase Realtime Broadcast & Presence Channel ───────────────────────────

export const analyticsChannel = supabase.channel('aanya-live-analytics-stream', {
  config: { broadcast: { self: true }, presence: { key: getSessionId() } },
});

analyticsChannel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    // Announce presence
    try {
      const user = getCurrentUserSnapshot();
      analyticsChannel.track({
        sessionId: getSessionId(),
        userName: user.name,
        userEmail: user.email,
        path: window.location.pathname,
        device: detectDevice(),
        onlineAt: new Date().toISOString(),
      });
    } catch {}
  }
});

// ─── Local Persistent Event Log (FIFO max 500 records) ─────────────────────────

export function getStoredEvents(): RealAnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvent(event: RealAnalyticsEvent) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredEvents();
    // Add to top, cap at 500 items
    const updated = [event, ...existing].slice(0, 500);
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not store analytics event:', e);
  }
}

function broadcastEvent(event: RealAnalyticsEvent) {
  // 1. Save locally
  saveEvent(event);

  // 2. Dispatch local event for same-tab / same-window components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aanya:real_analytics_event', { detail: event }));
  }

  // 3. Supabase Realtime broadcast across all tabs and admin panels
  try {
    analyticsChannel.send({
      type: 'broadcast',
      event: 'real_analytics_event',
      payload: event,
    }).catch(() => {});
  } catch {}
}

function createBaseEvent(type: AnalyticsEventType, customUser?: RealAnalyticsEvent['user']): RealAnalyticsEvent {
  const now = new Date();
  const user = customUser || getCurrentUserSnapshot();
  const sid = getSessionId();

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    timestamp: now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    rawTime: now.getTime(),
    user,
    client: {
      device: detectDevice(),
      browser: detectBrowser(),
      trafficSource: detectTrafficSource(),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      sessionId: sid,
    },
    details: {},
  };
}

// ─── Tracking API ─────────────────────────────────────────────────────────────

/**
 * 1. Track User Sign-In
 * Call when any customer or admin signs in or signs up
 */
export function trackUserSignIn(user: { id?: string; email?: string; name?: string; phone?: string; role?: string }) {
  const userSnapshot: RealAnalyticsEvent['user'] = {
    id: user.id,
    name: user.name?.trim() || (user.email ? user.email.split('@')[0] : 'Customer'),
    email: user.email,
    phone: user.phone,
    role: user.role || 'customer',
    isAuthenticated: true,
  };

  const event = createBaseEvent('signin', userSnapshot);
  event.details = {
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    pageTitle: typeof document !== 'undefined' ? document.title : 'Sign In',
    meta: { method: 'email_password' },
  };

  broadcastEvent(event);

  // Send to GA4
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'login', { method: 'email' });
  }
}

/**
 * 2. Track Site Visit (Session Open)
 * Call on initial app load / first page entry
 */
export function trackSiteVisit(customUser?: RealAnalyticsEvent['user']) {
  if (typeof window === 'undefined') return;

  const sessionRecordedKey = `aanya_visit_recorded_${getSessionId()}`;
  if (sessionStorage.getItem(sessionRecordedKey)) {
    return; // Already logged this session visit
  }
  sessionStorage.setItem(sessionRecordedKey, 'true');

  const event = createBaseEvent('visit', customUser);
  event.details = {
    path: window.location.pathname,
    pageTitle: document.title,
  };

  broadcastEvent(event);
}

/**
 * 3. Track Page Open
 * Call whenever the customer navigates to any page
 */
export function trackPageView(path = window.location.pathname, title = document.title, customUser?: RealAnalyticsEvent['user']) {
  if (typeof window === 'undefined') return;

  const event = createBaseEvent('pageview', customUser);
  event.details = {
    path,
    pageTitle: title,
  };

  broadcastEvent(event);

  // GA4 Event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
    });
  }

  // Update presence path
  try {
    const user = customUser || getCurrentUserSnapshot();
    analyticsChannel.track({
      sessionId: getSessionId(),
      userName: user.name,
      userEmail: user.email,
      path,
      device: detectDevice(),
      onlineAt: new Date().toISOString(),
    });
  } catch {}
}

/**
 * 4. Track Product Click
 * Call when customer clicks a product card, link, or view button
 */
export function trackProductClick(product: {
  id: string;
  name: string;
  price?: number;
  category?: string;
  image?: string;
}, customUser?: RealAnalyticsEvent['user']) {
  if (typeof window === 'undefined') return;

  const event = createBaseEvent('product_click', customUser);
  event.details = {
    productId: String(product.id),
    productName: product.name,
    productCategory: product.category || 'Apparel',
    productPrice: Number(product.price || 0),
    productImage: product.image,
    path: window.location.pathname,
  };

  broadcastEvent(event);

  // GA4 Event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'select_item', {
      item_list_name: 'Product Catalog',
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  }
}

/**
 * 5. Track Product View
 */
export function trackProductView(product: {
  id: string;
  name: string;
  price?: number;
  category?: string;
  image?: string;
}, customUser?: RealAnalyticsEvent['user']) {
  // Re-use product click logging for complete audit trail
  trackProductClick(product, customUser);

  // GA4 Event
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'view_item', {
      currency: 'INR',
      value: product.price,
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  }
}

/**
 * 6. Track Add To Cart
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price?: number;
  category?: string;
  image?: string;
  quantity?: number;
}, customUser?: RealAnalyticsEvent['user']) {
  if (typeof window === 'undefined') return;

  const event = createBaseEvent('cart_add', customUser);
  event.details = {
    productId: String(product.id),
    productName: product.name,
    productCategory: product.category || 'Apparel',
    productPrice: Number(product.price || 0),
    productImage: product.image,
    path: window.location.pathname,
    meta: { quantity: product.quantity || 1 },
  };

  broadcastEvent(event);

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: (product.price || 0) * (product.quantity || 1),
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
        },
      ],
    });
  }
}

/**
 * 7. Track Begin Checkout
 */
export function trackBeginCheckout(amount: number, itemsCount: number, customUser?: RealAnalyticsEvent['user']) {
  if (typeof window === 'undefined') return;

  const event = createBaseEvent('checkout', customUser);
  event.details = {
    amount,
    meta: { itemsCount },
    path: window.location.pathname,
  };

  broadcastEvent(event);

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: amount,
    });
  }
}

/**
 * 8. Track Purchase
 */
export function trackPurchase(order: {
  id: string;
  amount: number;
  items?: any[];
  paymentMethod?: string;
}, customUser?: RealAnalyticsEvent['user']) {
  if (typeof window === 'undefined') return;

  const event = createBaseEvent('purchase', customUser);
  event.details = {
    orderId: order.id,
    amount: order.amount,
    method: order.paymentMethod,
    path: window.location.pathname,
    meta: { items: order.items || [] },
  };

  broadcastEvent(event);

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.amount,
      currency: 'INR',
      payment_type: order.paymentMethod,
    });
  }
}

// ─── Fetch Pure Real Analytics Data (Zero Mock Data) ──────────────────────────

export async function fetchPureRealAnalytics() {
  const events = getStoredEvents();

  // Fetch real registered profiles from Supabase
  let profiles: any[] = [];
  try {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, status, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (profData) profiles = profData;
  } catch {}

  // Fetch real payment records
  let payments: any[] = [];
  try {
    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (payData) payments = payData;
  } catch {}

  // Fetch real orders
  let orders: any[] = [];
  try {
    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (ordData) orders = ordData;
  } catch {}

  return {
    events,
    profiles,
    payments,
    orders,
  };
}

/**
 * Clear local analytics audit log
 */
export function clearAnalyticsLog(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_EVENTS);
  window.dispatchEvent(new CustomEvent('aanya:real_analytics_event', { detail: null }));
}
