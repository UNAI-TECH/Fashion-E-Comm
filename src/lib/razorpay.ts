/**
 * Razorpay Standard Web Checkout Integration
 * Official Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

import api from './api';

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

let isPaymentSessionActive = false;

/**
 * Dynamically loads the official Razorpay Checkout SDK script over HTTPS if not already present in DOM
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    // If script already loaded and window.Razorpay is available
    if ((window as any).Razorpay) {
      return resolve(true);
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script from official CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay Standard Checkout workflow:
 * 1. Creates an order on backend via POST /api/create-order
 * 2. Launches the Razorpay Standard Checkout modal with order_id
 * 3. On success, receives razorpay_payment_id, razorpay_order_id, razorpay_signature and triggers onSuccess callback
 * 4. Handles modal dismiss and payment.failed events with user feedback
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  if (isPaymentSessionActive) {
    console.warn('A payment session is already active. Ignoring duplicate invocation.');
    return;
  }

  const {
    orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amount,
    amountInPaise,
    customerName = 'Customer',
    customerEmail = '',
    customerPhone = '',
    notes = {},
    onSuccess,
    onError,
    onDismiss
  } = options;

  isPaymentSessionActive = true;

  try {
    // 1. Calculate amount in paise (minimum 100 paise = ₹1.00)
    const payablePaise = amountInPaise || Math.round(amount * 100);

    if (payablePaise < 100) {
      throw new Error('Payment amount must be at least 100 paise (₹1.00).');
    }

    // 2. Create order on backend (calls POST /api/create-order)
    const orderData = await api.payments.createRazorpayOrder({
      amount: payablePaise,
      currency: 'INR',
      orderId,
      receipt: orderId.slice(0, 40),
      customerName,
      customerEmail,
      customerPhone,
      notes
    });

    if (!orderData || !orderData.success) {
      throw new Error(orderData?.message || 'Unable to initialize Razorpay payment session. Please try again.');
    }

    const razorpayOrderId = orderData.order_id || orderData.id;
    const keyId = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!keyId) {
      throw new Error('Razorpay Key ID is not configured.');
    }

    // 3. Ensure Razorpay client SDK is loaded
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded || !(window as any).Razorpay) {
      throw new Error('Could not load Razorpay Checkout SDK. Please check your internet connection or ad blocker and try again.');
    }

    // 4. Configure Razorpay Standard Modal per official documentation
    const cleanPhone = customerPhone ? customerPhone.replace(/[^\d+]/g, '') : '';

    const rzpOptions = {
      key: keyId,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: 'Aanya Fashions',
      description: `Payment for Order #${orderId}`,
      image: 'https://www.aanyafashions.com/logo.png',
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
          isPaymentSessionActive = false;
          if (onDismiss) onDismiss();
        },
        backdropclose: false,
        escape: true,
        handleback: true,
        confirm_close: true
      },
      handler: async (response: any) => {
        isPaymentSessionActive = false;
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
          if (onError) onError(err);
        }
      }
    };

    const rzpInstance = new (window as any).Razorpay(rzpOptions);

    rzpInstance.on('payment.failed', function (resp: any) {
      isPaymentSessionActive = false;
      console.error('Razorpay payment failed:', resp.error);
      const desc = resp.error?.description || resp.error?.reason || 'Payment was unsuccessful or declined by bank';
      if (onError) {
        onError(new Error(desc));
      }
    });

    rzpInstance.open();
  } catch (error: any) {
    isPaymentSessionActive = false;
    console.error('Razorpay checkout initialization failed:', error);
    if (onError) onError(error);
    else throw error;
  }
}
