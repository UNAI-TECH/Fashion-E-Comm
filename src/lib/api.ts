import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(message: string, code = 'API_ERROR', status = 500, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

// Generate unique request ID
const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// Core fetcher with auth, timeout, and error handling
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE_URL,
  retries = 1
): Promise<T> {
  const requestId = generateRequestId();
  const headers = new Headers(options.headers || {});

  headers.set('x-request-id', requestId);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Supabase access token if session exists
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  } catch {
    // Continue unauthenticated if session check fails
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Abort controller for 15-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMessage = data?.detail || data?.error?.message || data?.message || `Request failed with status ${res.status}`;
      const errorCode = data?.error?.code || (res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'HTTP_ERROR');
      throw new ApiError(errorMessage, errorCode, res.status, data?.requestId || requestId);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 'TIMEOUT', 408, requestId);
    }

    // Retry once on network failure
    if (retries > 0 && (err.name === 'TypeError' || err.status >= 500)) {
      return request<T>(endpoint, options, baseUrl, retries - 1);
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(err.message || 'Network request failed', 'NETWORK_ERROR', 500, requestId);
  }
}

export const api = {
  // ─── AUTH ───
  auth: {
    login: (credentials: { email: string; password?: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: { name: string; email: string; password?: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getProfile: () => request('/auth/profile'),
    updateProfile: (profile: any) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) })
  },

  // ─── PRODUCTS ───
  products: {
    getAll: (params: {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      category?: string;
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    } = {}) => {
      const query = new URLSearchParams();
      if (params.pageNumber) query.set('pageNumber', String(params.pageNumber));
      if (params.pageSize) query.set('pageSize', String(params.pageSize));
      if (params.keyword) query.set('keyword', params.keyword);
      if (params.category && params.category !== 'All') query.set('category', params.category);
      if (params.sort) query.set('sort', params.sort);
      if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
      if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
      if (params.inStock) query.set('inStock', 'true');

      const qs = query.toString();
      return request<{ products: any[]; page: number; pages: number; count: number }>(
        `/products${qs ? `?${qs}` : ''}`
      );
    },
    getById: (id: string) => request(`/products/${id}`),
    create: (productData: any) =>
      request('/products', { method: 'POST', body: JSON.stringify(productData) }),
    update: (id: string, productData: any) =>
      request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }),
    delete: (id: string) => request(`/products/${id}`, { method: 'DELETE' })
  },

  // ─── CART ───
  cart: {
    get: () => request('/cart'),
    add: (productId: string, quantity: number) =>
      request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
    remove: (productId: string) =>
      request(`/cart/${productId}`, { method: 'DELETE' })
  },

  // ─── WISHLIST ───
  wishlist: {
    get: () => request('/wishlist'),
    add: (productId: string) =>
      request('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
    remove: (productId: string) =>
      request(`/wishlist/${productId}`, { method: 'DELETE' })
  },

  // ─── ADDRESSES ───
  addresses: {
    getAll: () => request<any[]>('/addresses'),
    create: (addressData: {
      full_name: string;
      phone: string;
      address_line_1: string;
      address_line_2?: string;
      city: string;
      state: string;
      postal_code: string;
      country?: string;
      is_default?: boolean;
    }) => request<any>('/addresses', { method: 'POST', body: JSON.stringify(addressData) }),
    update: (id: string, addressData: any) =>
      request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(addressData) }),
    delete: (id: string) => request(`/addresses/${id}`, { method: 'DELETE' }),
    setDefault: (id: string) =>
      request(`/addresses/${id}/default`, { method: 'PUT' })
  },

  // ─── COUPONS ───
  coupons: {
    validate: (code: string, cartTotal: number) =>
      request<{ success: boolean; coupon: any }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartTotal })
      }),
    getAll: () => request('/coupons'),
    create: (data: any) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/coupons/${id}`, { method: 'DELETE' })
  },

  // ─── ORDERS ───
  orders: {
    create: (orderData: {
      orderItems: any[];
      address: any;
      paymentMethod: string;
      taxPrice?: number;
      shippingPrice?: number;
      discountAmount?: number;
      couponCode?: string;
      totalAmount: number;
    }) => request<{ success: boolean; order: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
    getMyOrders: () => request<any[]>('/orders/myorders'),
    getById: (id: string) => request(`/orders/${id}`),
    getAll: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);

      const qs = query.toString();
      return request<{ orders: any[]; count: number; page: number; pages: number }>(
        `/orders${qs ? `?${qs}` : ''}`
      );
    },
    updateStatus: (id: string, status: string, reason?: string) =>
      request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      })
  },

  // ─── PAYMENTS ───
  payments: {
    createRazorpayOrder: (amount: number, receipt?: string, notes?: any) =>
      request<{ success: boolean; id: string; amount: number; currency: string; keyId: string; isSimulated?: boolean }>(
        '/payments/create-order',
        { method: 'POST', body: JSON.stringify({ amount, receipt, notes }) }
      ),
    verifyPayment: (payload: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      order_id: string;
      isSimulated?: boolean;
    }) => request('/payments/verify', { method: 'POST', body: JSON.stringify(payload) })
  },

  // ─── UPLOADS ───
  uploads: {
    uploadImages: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      return request<{ success: boolean; urls: string[]; count: number }>('/uploads', {
        method: 'POST',
        body: formData
      });
    }
  },

  // ─── OTP VIA SUPABASE EDGE FUNCTIONS (SMTP) ───
  otp: {
    send: async (email: string, purpose = 'auth') => {
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: { email: email.trim().toLowerCase(), purpose }
      });
      if (error) {
        throw new Error(error.message || 'Failed to dispatch verification email via Edge Function');
      }
      return data as { success: boolean; message: string; verification_token: string; expires_in_seconds: number };
    },
    verify: async (email: string, code: string, verification_token: string, purpose = 'auth') => {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { email: email.trim().toLowerCase(), code: code.trim(), verification_token, purpose }
      });
      if (error) {
        throw new Error(error.message || 'Verification failed');
      }
      return data as { success: boolean; message: string; verified: boolean };
    }
  },

  // ─── HEALTH ───
  health: {
    check: () => request('/health'),
    ready: () => request('/health/ready')
  }
};

export default api;
