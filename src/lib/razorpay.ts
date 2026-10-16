/**
 * Razorpay Payment Gateway Web Integration
 * Official Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

import api from './api';

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  isSimulated?: boolean;
}

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  items?: Array<{ id: string; quantity: number }>;
  couponCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, any>;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void | Promise<void>;
  onError?: (error: Error | { description: string }) => void;
  onDismiss?: () => void;
}

let isPaymentSessionActive = false;

/**
 * Dynamically loads the official Razorpay Checkout SDK script over HTTPS
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
 * Initiates Razorpay checkout workflow:
 * 1. Creates an order on backend via Razorpay Orders API with trusted server-side price & stock check
 * 2. Launches the Razorpay Standard Checkout modal with explicit UPI and card blocks
 * 3. Handles payment success, cancellation, or failure
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  if (isPaymentSessionActive) {
    console.warn('A payment session is already active. Ignoring duplicate invocation.');
    return;
  }

  const {
    orderId,
    amount,
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

  isPaymentSessionActive = true;

  try {
    // 1. Create order on backend (Edge function / API verifies prices, stock & creates Razorpay order)
    const orderData = await api.payments.createRazorpayOrder({
      amount,
      orderId,
      receipt: orderId,
      items,
      couponCode,
      customerName,
      customerEmail,
      customerPhone,
      notes
    });

    if (!orderData || !orderData.success) {
      throw new Error(orderData?.message || 'Unable to initialize payment session. Please try again.');
    }

    // 2. Load Razorpay client SDK over HTTPS
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded && !orderData.isSimulated && !orderData.keyId?.includes('placeholder')) {
      throw new Error('Could not load Razorpay Checkout SDK. Please check your internet connection or ad blocker and try again.');
    }

    // Local / development placeholder simulation mode
    if (!isScriptLoaded || orderData.isSimulated || orderData.keyId?.includes('placeholder')) {
      console.info('Using simulated payment flow for sandbox development with test keys.');
      setTimeout(async () => {
        try {
          const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const simOrderId = orderData.id || `order_sim_${Date.now()}`;
          await onSuccess({
            razorpay_payment_id: simPaymentId,
            razorpay_order_id: simOrderId,
            razorpay_signature: `sig_sim_${Date.now()}`,
            isSimulated: true
          });
        } finally {
          isPaymentSessionActive = false;
        }
      }, 700);
      return;
    }

    // 3. Configure Razorpay Standard Modal per official documentation
    // Logo strictly over HTTPS to avoid mixed-content warnings
    const logoUrl = 'https://www.aanyafashions.com/logo.png';
    const cleanPhone = customerPhone ? customerPhone.replace(/[^\d+]/g, '') : '';

    const rzpOptions = {
      key: orderData.keyId,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: 'Aanya Fashions',
      description: `Payment for Order #${orderId}`,
      image: logoUrl,
      order_id: orderData.id,
      prefill: {
        name: customerName,
        email: customerEmail || 'customer@aanyafashions.com',
        contact: cleanPhone,
        method: 'upi' // Prefills and hints preferred UPI payment method
      },
      // Explicit configuration displaying UPI prominently
      config: {
        display: {
          blocks: {
            upi: {
              name: 'Pay using UPI (Google Pay, PhonePe, Paytm, QR)',
              instruments: [
                {
                  method: 'upi'
                }
              ]
            },
            other: {
              name: 'Credit / Debit Cards & Net Banking',
              instruments: [
                {
                  method: 'card'
                },
                {
                  method: 'netbanking'
                },
                {
                  method: 'wallet'
                }
              ]
            }
          },
          sequence: ['block.upi', 'block.other'],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      notes: {
        orderId,
        ...notes
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
            razorpay_signature: response.razorpay_signature,
            isSimulated: false
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
      const desc = resp.error?.description || resp.error?.reason || 'Payment was unsuccessful or declined';
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
