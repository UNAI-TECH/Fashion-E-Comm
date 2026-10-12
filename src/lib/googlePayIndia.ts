/**
 * Google Pay India (Tez) Web API & UPI Integration
 * Documentation: https://developers.google.com/pay/india/api/web/
 * NPCI UPI Specifications: https://www.npci.org.in/what-we-do/upi/product-overview
 */

export interface GooglePayIndiaConfig {
  merchantVpa: string; // e.g. 'aanya.fashions@okaxis'
  merchantName: string; // 'Aanya Fashions'
  mcc: string; // '5691' (Women's Ready-to-Wear Apparel)
}

export const DEFAULT_GPAY_CONFIG: GooglePayIndiaConfig = {
  merchantVpa: (import.meta as any).env?.VITE_GOOGLE_PAY_VPA || 'aanya.fashions@okaxis',
  merchantName: 'Aanya Fashions',
  mcc: '5691',
};

export interface GooglePayOrderParams {
  amount: number;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  merchantVpa?: string;
  merchantName?: string;
}

export interface GooglePayPaymentResult {
  success: boolean;
  transactionId?: string;
  payerVpa?: string;
  method: 'Google Pay (Native Tez)' | 'Google Pay (UPI QR)' | 'Google Pay (Intent)';
  rawDetails?: any;
  error?: string;
}

/**
 * Checks if the client device/browser supports the official Google Pay India Web API
 * (Available on Android Chrome with Google Pay app installed)
 */
export async function isGooglePayIndiaSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).PaymentRequest) {
    return false;
  }

  try {
    const supportedInstruments = [
      {
        supportedMethods: ['https://tez.google.com/pay'],
        data: {
          pa: DEFAULT_GPAY_CONFIG.merchantVpa,
          pn: DEFAULT_GPAY_CONFIG.merchantName,
          tr: 'CHECK_CAPABILITY',
          mc: DEFAULT_GPAY_CONFIG.mcc,
        },
      },
    ];

    const details = {
      total: {
        label: 'Total',
        amount: { currency: 'INR', value: '1.00' },
      },
    };

    const request = new (window as any).PaymentRequest(supportedInstruments, details);
    return await request.canMakePayment();
  } catch (err) {
    console.warn('Google Pay Web API check warning:', err);
    return false;
  }
}

/**
 * Invokes the native Google Pay India Payment Request sheet
 */
export async function triggerGooglePayIndia(
  params: GooglePayOrderParams
): Promise<GooglePayPaymentResult> {
  if (typeof window === 'undefined' || !(window as any).PaymentRequest) {
    return {
      success: false,
      method: 'Google Pay (Native Tez)',
      error: 'PaymentRequest API not supported on this browser',
    };
  }

  const vpa = params.merchantVpa || DEFAULT_GPAY_CONFIG.merchantVpa;
  const name = params.merchantName || DEFAULT_GPAY_CONFIG.merchantName;
  const formattedAmount = params.amount.toFixed(2);

  try {
    const supportedInstruments = [
      {
        supportedMethods: ['https://tez.google.com/pay'],
        data: {
          pa: vpa,
          pn: name,
          tr: params.orderId,
          url: `https://www.aanyafashions.com/orders`,
          mc: DEFAULT_GPAY_CONFIG.mcc,
          tn: params.note || `Order ${params.orderId} at Aanya Fashions`,
        },
      },
    ];

    const details = {
      total: {
        label: 'Total Amount',
        amount: {
          currency: 'INR',
          value: formattedAmount,
        },
      },
    };

    const request = new (window as any).PaymentRequest(supportedInstruments, details);
    const paymentResponse = await request.show();

    // Complete the browser payment transaction UI
    await paymentResponse.complete('success');

    const detailsObj = paymentResponse.details || {};
    const txnId =
      detailsObj.transactionId ||
      detailsObj.googleTransactionId ||
      detailsObj.approvalRefNo ||
      `GPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionId: txnId,
      payerVpa: detailsObj.payerVpa || '',
      method: 'Google Pay (Native Tez)',
      rawDetails: detailsObj,
    };
  } catch (err: any) {
    console.error('Google Pay India transaction failed:', err);
    return {
      success: false,
      method: 'Google Pay (Native Tez)',
      error: err.message || 'Payment was cancelled or dismissed',
    };
  }
}

/**
 * Builds the standard NPCI UPI URI scheme for Google Pay intent / QR code
 * upi://pay?pa=...&pn=...&mc=5691&tr=...&tn=...&am=...&cu=INR
 */
export function buildGooglePayUpiUri(params: GooglePayOrderParams): string {
  const vpa = params.merchantVpa || DEFAULT_GPAY_CONFIG.merchantVpa;
  const name = params.merchantName || DEFAULT_GPAY_CONFIG.merchantName;
  const formattedAmount = params.amount.toFixed(2);

  const query = new URLSearchParams({
    pa: vpa,
    pn: name,
    mc: DEFAULT_GPAY_CONFIG.mcc,
    tr: params.orderId,
    tn: params.note || `Aanya Fashions Order ${params.orderId}`,
    am: formattedAmount,
    cu: 'INR',
  });

  return `upi://pay?${query.toString()}`;
}

/**
 * Generates dynamic QR code image URL for desktop checkout
 */
export function getUpiQrCodeUrl(upiUri: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(upiUri)}`;
}
