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
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, any>;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void | Promise<void>;
  onError?: (error: Error | { description: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    // If script already loaded
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
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay checkout workflow:
 * 1. Creates an order on backend via Razorpay Orders API
 * 2. Launches the Razorpay checkout modal
 * 3. Handles payment success, cancellation, or error
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const {
    orderId,
    amount,
    customerName = 'Customer',
    customerEmail = '',
    customerPhone = '',
    notes = {},
    onSuccess,
    onError,
    onDismiss
  } = options;

  try {
    // 1. Create order on backend
    const orderData = await api.payments.createRazorpayOrder({
      amount,
      orderId,
      receipt: orderId,
      customerName,
      customerEmail,
      customerPhone,
      notes
    });

    if (!orderData || !orderData.success) {
      throw new Error('Unable to initialize payment session. Please try again.');
    }

    // 2. Load Razorpay client SDK
    const isScriptLoaded = await loadRazorpayScript();

    // If real keys are present but SDK couldn't load (e.g., ad blocker blocking checkout.razorpay.com)
    if (!isScriptLoaded && !orderData.isSimulated && !orderData.keyId?.includes('placeholder')) {
      throw new Error('Could not load Razorpay Checkout SDK. Please check your network or disable ad blockers and try again.');
    }

    // Only use simulated fallback if placeholder keys are active
    if (!isScriptLoaded || orderData.isSimulated || orderData.keyId?.includes('placeholder')) {
      console.info('Using simulated payment flow for development / test mode with placeholder keys.');
      
      // Auto-simulate successful checkout after brief confirmation
      setTimeout(async () => {
        const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const simOrderId = orderData.id || `order_sim_${Date.now()}`;
        
        await onSuccess({
          razorpay_payment_id: simPaymentId,
          razorpay_order_id: simOrderId,
          razorpay_signature: `sig_sim_${Date.now()}`,
          isSimulated: true
        });
      }, 700);
      return;
    }

    // 3. Configure Razorpay Standard Modal per official docs
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://aanyafashions.com/logo.png';
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
        contact: cleanPhone
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
          if (onDismiss) onDismiss();
        },
        backdropclose: false,
        escape: true,
        handleback: true,
        confirm_close: true
      },
      handler: async (response: any) => {
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
      console.error('Razorpay payment failed:', resp.error);
      const desc = resp.error?.description || resp.error?.reason || 'Payment was unsuccessful or cancelled';
      if (onError) {
        onError(new Error(desc));
      }
    });

    rzpInstance.open();
  } catch (error: any) {
    console.error('Razorpay checkout initialization failed:', error);
    if (onError) onError(error);
    else throw error;
  }
}
