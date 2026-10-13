/**
 * Google Pay Web API Integration (Official pay.js)
 * 
 * Implements the Google Pay Web Payments API for card-based payments.
 * Reference: https://developers.google.com/pay/api/web/guides/tutorial
 * 
 * This module handles:
 * - Loading the official Google Pay JavaScript library
 * - isReadyToPay check
 * - Creating the official Google Pay button
 * - loadPaymentData for processing card payments
 * 
 * IMPORTANT: This uses PAYMENT_GATEWAY tokenization. For production,
 * you must configure a real payment gateway (e.g., Razorpay, Paytm, 
 * Juspay, etc.) and their merchant parameters.
 * 
 * The Google Pay Web API (pay.js) is SEPARATE from the Google Pay India
 * Tez/UPI W3C Payment Request API. Both can coexist.
 */

// === Configuration ===

const GPAY_ENVIRONMENT: 'TEST' | 'PRODUCTION' = 
  ((import.meta as any).env?.VITE_GPAY_ENVIRONMENT || 'TEST') as 'TEST' | 'PRODUCTION';

const GPAY_MERCHANT_ID = (import.meta as any).env?.VITE_GPAY_MERCHANT_ID || '';
const GPAY_MERCHANT_NAME = (import.meta as any).env?.VITE_MERCHANT_NAME || 'Aanya Fashions';

// Payment gateway configuration
// For production, replace with your actual payment processor credentials
const GATEWAY_NAME = (import.meta as any).env?.VITE_GPAY_GATEWAY || 'example';
const GATEWAY_MERCHANT_ID = (import.meta as any).env?.VITE_GPAY_GATEWAY_MERCHANT_ID || 'exampleGatewayMerchantId';

// === Types ===

interface GooglePayConfig {
  environment: 'TEST' | 'PRODUCTION';
  merchantId: string;
  merchantName: string;
  gateway: string;
  gatewayMerchantId: string;
}

export interface GooglePayWebResult {
  success: boolean;
  paymentToken?: string;
  cardNetwork?: string;
  cardDetails?: string;
  payerEmail?: string;
  payerName?: string;
  rawPaymentData?: any;
  error?: string;
  cancelled?: boolean;
}

// === Google Pay API base objects ===

const baseCardPaymentMethod = {
  type: 'CARD' as const,
  parameters: {
    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'] as string[],
    allowedCardNetworks: ['MASTERCARD', 'VISA'] as string[],
  },
};

function getTokenizationSpecification(config: GooglePayConfig) {
  return {
    type: 'PAYMENT_GATEWAY' as const,
    parameters: {
      gateway: config.gateway,
      gatewayMerchantId: config.gatewayMerchantId,
    },
  };
}

function getGooglePayConfig(): GooglePayConfig {
  return {
    environment: GPAY_ENVIRONMENT,
    merchantId: GPAY_MERCHANT_ID,
    merchantName: GPAY_MERCHANT_NAME,
    gateway: GATEWAY_NAME,
    gatewayMerchantId: GATEWAY_MERCHANT_ID,
  };
}

// === Script Loading ===

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads the official Google Pay JavaScript library from pay.google.com
 */
export function loadGooglePayScript(): Promise<void> {
  if (scriptLoaded && (window as any).google?.payments?.api?.PaymentsClient) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google?.payments?.api?.PaymentsClient) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Google Pay JavaScript library'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// === PaymentsClient singleton ===

let paymentsClient: any = null;

function getPaymentsClient(): any {
  const config = getGooglePayConfig();
  if (!paymentsClient) {
    paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: config.environment,
      merchantInfo: {
        merchantName: config.merchantName,
        ...(config.merchantId ? { merchantId: config.merchantId } : {}),
      },
    });
  }
  return paymentsClient;
}

// === isReadyToPay ===

/**
 * Checks if the user's browser and device support Google Pay Web API
 * for card payments (VISA, Mastercard).
 */
export async function isGooglePayWebReady(): Promise<boolean> {
  try {
    await loadGooglePayScript();

    const client = getPaymentsClient();
    const isReadyToPayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [baseCardPaymentMethod],
    };

    const response = await client.isReadyToPay(isReadyToPayRequest);
    return response.result === true;
  } catch (err) {
    console.warn('[Google Pay Web API] isReadyToPay check failed:', err);
    return false;
  }
}

// === Create Official Google Pay Button ===

/**
 * Creates the official Google Pay button element using the API.
 * This button follows Google's branding guidelines automatically.
 * 
 * @param onClick - Callback when the button is clicked
 * @returns HTMLElement - The Google Pay button element
 */
export function createGooglePayButton(onClick: () => void): HTMLElement {
  const client = getPaymentsClient();
  const button = client.createButton({
    onClick,
    buttonColor: 'black',
    buttonType: 'pay',
    buttonLocale: 'en',
    buttonSizeMode: 'fill',
  });
  return button;
}

// === loadPaymentData ===

/**
 * Initiates the Google Pay payment sheet for card payments.
 * 
 * @param amount - Total amount in INR
 * @param orderId - Unique order identifier
 * @returns GooglePayWebResult with payment token or error
 */
export async function loadGooglePayPaymentData(
  amount: number,
  orderId: string
): Promise<GooglePayWebResult> {
  try {
    await loadGooglePayScript();

    const config = getGooglePayConfig();
    const client = getPaymentsClient();

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          ...baseCardPaymentMethod,
          tokenizationSpecification: getTokenizationSpecification(config),
        },
      ],
      transactionInfo: {
        totalPriceStatus: 'FINAL' as const,
        totalPrice: Number(amount).toFixed(2),
        currencyCode: 'INR',
        countryCode: 'IN',
        transactionId: orderId,
      },
      merchantInfo: {
        merchantName: config.merchantName,
        ...(config.merchantId ? { merchantId: config.merchantId } : {}),
      },
    };

    console.log('🚀 [Google Pay Web API] Launching payment sheet:', {
      environment: config.environment,
      gateway: config.gateway,
      amount: amount,
      currency: 'INR',
      orderId,
    });

    const paymentData = await client.loadPaymentData(paymentDataRequest);

    // Extract payment token and card details
    const paymentMethodData = paymentData?.paymentMethodData;
    const token = paymentMethodData?.tokenizationData?.token;
    const cardNetwork = paymentMethodData?.info?.cardNetwork;
    const cardDetails = paymentMethodData?.info?.cardDetails;
    const email = paymentData?.email;
    const payerName = paymentData?.payerName || 
      paymentMethodData?.info?.billingAddress?.name;

    return {
      success: true,
      paymentToken: token,
      cardNetwork,
      cardDetails,
      payerEmail: email,
      payerName,
      rawPaymentData: paymentData,
    };
  } catch (err: any) {
    const isCancelled = err.statusCode === 'CANCELED' || 
      err.statusCode === 'DEVELOPER_ERROR' ||
      err.message?.includes('canceled') ||
      err.message?.includes('closed');

    if (isCancelled) {
      return {
        success: false,
        cancelled: true,
        error: 'Payment cancelled by user',
      };
    }

    console.error('[Google Pay Web API] Payment failed:', err);
    return {
      success: false,
      error: err.statusMessage || err.message || 'Google Pay payment failed',
    };
  }
}

/**
 * Returns configuration status for the Google Pay Web API.
 * Useful for admin/debugging panels.
 */
export function getGooglePayWebConfig() {
  const config = getGooglePayConfig();
  return {
    environment: config.environment,
    merchantId: config.merchantId || '(not set — required for PRODUCTION)',
    merchantName: config.merchantName,
    gateway: config.gateway,
    gatewayMerchantId: config.gatewayMerchantId,
    isProductionReady: config.environment === 'PRODUCTION' && 
      !!config.merchantId && 
      config.gateway !== 'example',
    warnings: [
      ...(config.gateway === 'example' ? ['Using example gateway — configure a real payment processor for production'] : []),
      ...(config.environment === 'TEST' ? ['Running in TEST environment — switch to PRODUCTION for live payments'] : []),
      ...(!config.merchantId ? ['Google Pay Merchant ID not set — required for PRODUCTION'] : []),
    ],
  };
}
