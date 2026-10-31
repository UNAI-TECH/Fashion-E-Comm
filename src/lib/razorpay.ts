/**
 * Razorpay Standard Web Checkout Integration
 * Official Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

import api from './api';
import { getCanonicalUrl } from './urls';

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  orderId?: string;
  amount: number; // in Rupees or Paise (if already converted)
  amountInPaise?: number; // explicit amount in paise
  items?: Array<{ id: string; quantity: number }>;
  couponCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, any>;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void | Promise<void>;
  onError?: (error: Error | { description?: string; message?: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK script over HTTPS.
 * Returns true when window.Razorpay is available.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    // Already loaded
    if ((window as any).Razorpay) {
      console.log('[Razorpay] SDK already available on window.Razorpay');
      return resolve(true);
    }

    const SRC = 'https://checkout.razorpay.com/v1/checkout.js';
    const existingScript = document.querySelector(`script[src="${SRC}"]`) as HTMLScriptElement | null;

    if (existingScript) {
      console.log('[Razorpay] Script tag exists in DOM, polling for window.Razorpay...');
      // Poll for window.Razorpay (the script may already have loaded)
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if ((window as any).Razorpay) {
          clearInterval(poll);
          console.log('[Razorpay] SDK ready after', attempts * 100, 'ms polling');
          resolve(true);
        } else if (attempts >= 50) { // 5 seconds max
          clearInterval(poll);
          console.warn('[Razorpay] SDK did not become available after 5s polling');
          resolve(false);
        }
      }, 100);
      return;
    }

    // Inject script fresh
    console.log('[Razorpay] Injecting checkout.js script into DOM...');
    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      console.warn('[Razorpay] Script load timed out after 8s');
      resolve(typeof (window as any).Razorpay !== 'undefined');
    }, 8000);

    script.onload = () => {
      clearTimeout(timeout);
      console.log('[Razorpay] checkout.js loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timeout);
      console.error('[Razorpay] Failed to load checkout.js from CDN');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initiates Razorpay Standard Checkout workflow:
 * 1. Creates an order on backend via POST /api/create-order
 * 2. Launches the Razorpay Standard Checkout modal with order_id
 * 3. On success, receives razorpay_payment_id, razorpay_order_id, razorpay_signature
 * 4. Handles modal dismiss and payment.failed events with user feedback
 */
// Consistent currency conversion boundaries
export const toPaise = (rupees: number | string): number => Math.round(Number(rupees) * 100);
export const toRupees = (paise: number | string): number => Number(paise) / 100;

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const {
    orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amount,
    amountInPaise,
    items = [],
    couponCode,
    customerName = 'Customer',
    customerEmail = '',
    customerPhone = '',
    notes = {},
    onSuccess,
    onError,
    onDismiss
  } = options;

  const amountInRupees = typeof amount === 'number' && amount > 0 ? amount : (amountInPaise ? toRupees(amountInPaise) : 0);
  const payablePaise = amountInPaise || toPaise(amountInRupees);

  console.log('[Razorpay] openRazorpayCheckout called', { orderId, amountInRupees, payablePaise });
  console.log('[Razorpay] Order total (INR):', amountInRupees);
  console.log('[Razorpay] Expected amount (paise):', payablePaise);

  try {
    if (payablePaise < 100) {
      throw new Error('Payment amount must be at least 100 paise (₹1.00).');
    }

    // 2. Create order on backend (calls POST /api/create-order)
    console.log('[Razorpay] Calling backend /api/create-order...');
    let orderData: any;
    try {
      orderData = await api.payments.createRazorpayOrder({
        orderId,
        amount: amountInRupees,
        amountInRupees,
        amountInPaise: payablePaise,
        currency: 'INR',
        receipt: orderId.slice(0, 40),
        items,
        couponCode,
        customerName,
        customerEmail,
        customerPhone,
        notes
      });
      console.log('[Razorpay] Backend create-order response:', orderData);
    } catch (apiErr: any) {
      console.error('[Razorpay] Backend /api/create-order FAILED:', apiErr);
      throw new Error(
        apiErr?.message || 'Payment gateway is temporarily unavailable. Please try again in a moment.'
      );
    }

    if (!orderData || !orderData.success) {
      const errMsg = orderData?.message || orderData?.error?.message || 'Unable to initialize Razorpay payment session.';
      console.error('[Razorpay] create-order returned non-success:', errMsg);
      throw new Error(errMsg);
    }

    const razorpayOrderId = orderData.order_id || orderData.id;
    const keyId = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

    console.log('[Razorpay] Got Razorpay order_id:', razorpayOrderId, '| key_id:', keyId?.substring(0, 12) + '...');

    if (!keyId) {
      throw new Error('Razorpay Key ID is not configured. Please contact support.');
    }

    if (!razorpayOrderId) {
      throw new Error('Razorpay order ID was not returned by the server. Please try again.');
    }

    // 3. Ensure Razorpay client SDK is loaded
    console.log('[Razorpay] Loading Razorpay SDK script...');
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded || !(window as any).Razorpay) {
      throw new Error('Could not load Razorpay Checkout SDK. Please check your internet connection or disable any ad blocker and try again.');
    }
    console.log('[Razorpay] SDK loaded, preparing modal options...');

    // 4. Configure Razorpay Standard Modal per official documentation
    const cleanPhone = customerPhone ? customerPhone.replace(/[^\d+]/g, '') : '';

    const rzpOptions: any = {
      key: keyId,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: 'Aanya Fashions',
      description: `Payment for Order #${orderId}`,
      image: getCanonicalUrl('/logo.png'),
      order_id: razorpayOrderId,
      prefill: {
        name: customerName,
        email: customerEmail || 'customer@aanyafashions.com',
        contact: cleanPhone
      },
      theme: {
        color: '#698156' // Aanya Fashions Signature Heritage Green
      },
      modal: {
        ondismiss: () => {
          console.log('[Razorpay] Modal dismissed by user');
          if (onDismiss) onDismiss();
        },
        backdropclose: false,
        escape: true,
        handleback: true,
        confirm_close: true
      },
      handler: async (response: any) => {
        console.log('[Razorpay] Payment handler fired:', {
          payment_id: response.razorpay_payment_id,
          order_id: response.razorpay_order_id,
          has_signature: !!response.razorpay_signature
        });
        try {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            throw new Error('Razorpay returned incomplete payment response credentials.');
          }
          await onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        } catch (err: any) {
          console.error('[Razorpay] onSuccess callback error:', err);
          if (onError) onError(err);
        }
      }
    };

    console.log('[Razorpay] Creating Razorpay instance...');
    const rzpInstance = new (window as any).Razorpay(rzpOptions);

    rzpInstance.on('payment.failed', function (resp: any) {
      console.error('[Razorpay] payment.failed event:', resp.error);
      const desc = resp.error?.description || resp.error?.reason || 'Payment was unsuccessful or declined by bank';
      if (onError) {
        onError(new Error(desc));
      }
    });

    console.log('[Razorpay] Opening checkout modal NOW...');
    rzpInstance.open();
    console.log('[Razorpay] rzpInstance.open() called successfully');

  } catch (error: any) {
    console.error('[Razorpay] checkout initialization FAILED:', error);
    if (onError) onError(error);
    else throw error;
  }
}
