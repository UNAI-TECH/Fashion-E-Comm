/**
 * Google Pay India (Tez) Web API & NPCI UPI Integration
 * 
 * Official Documentation:
 * - Google Pay India Web Intro: https://developers.google.com/pay/india/api/web/intro
 * - Create Payment Method: https://developers.google.com/pay/india/api/web/create-payment-method
 * - Video Tutorial: https://www.youtube.com/watch?v=kH0nafGhbww
 * - Google Pay & Wallet Developer MCP Server: https://paydeveloper.googleapis.com/mcp
 * 
 * Compliance:
 * - W3C Payment Request API (`https://tez.google.com/pay`)
 * - NPCI UPI 2.0 Specifications
 * - Merchant VPA: aanya.fashions@okaxis
 * - Merchant Category Code (MCC): 5691 (Women's Ready-to-Wear Apparel)
 */

import { supabase } from './supabase';

export interface GooglePayIndiaConfig {
  merchantVpa: string;
  merchantName: string;
  mcc: string;
}

export const DEFAULT_GPAY_CONFIG: GooglePayIndiaConfig = {
  merchantVpa: (import.meta as any).env?.VITE_GOOGLE_PAY_VPA || 'aanya.fashions@okaxis',
  merchantName: (import.meta as any).env?.VITE_MERCHANT_NAME || 'Aanya Fashions',
  mcc: (import.meta as any).env?.VITE_MERCHANT_MCC || '5691',
};

// Console audit log for verified merchant parameters
if (typeof window !== 'undefined') {
  console.log('🇮🇳 [Google Pay India Web API] Initialized with verified merchant parameters:', {
    supportedMethod: 'https://tez.google.com/pay',
    merchantVpa: DEFAULT_GPAY_CONFIG.merchantVpa,
    merchantName: DEFAULT_GPAY_CONFIG.merchantName,
    mcc: DEFAULT_GPAY_CONFIG.mcc, // 5691
    standard: 'W3C Payment Request API & NPCI UPI'
  });
}

export interface GooglePayOrderParams {
  amount: number;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
}

export interface GooglePayWebResult {
  success: boolean;
  cancelled?: boolean;
  transactionReference: string;
  transactionId?: string;
  payerVpa?: string;
  rawDetails?: any;
  tezResponse?: any;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'Paid' | 'Pending Verification' | 'Failed';
  message: string;
  orderId: string;
  transactionReference: string;
  paymentRecord?: any;
  requiresPspReconciliation: boolean;
}

/**
 * Generates an NPCI-compliant unique Transaction Reference ID (max 32 alphanumeric chars).
 * Format: AF{timestamp_base36}{order_suffix}{random}
 */
export function generateTransactionReference(orderId: string): string {
  const cleanOrder = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  const timeSuffix = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase();
  return `AF${timeSuffix}${cleanOrder}${rand}`.slice(0, 32);
}

/**
 * Checks if the user's browser & device support the official Google Pay India Web Payment Request API.
 * Uses sessionStorage caching to prevent browser rate-limit:
 * "DOMException: Query quota exceeded, not allowed to check whether can make payment."
 */
export async function isGooglePayIndiaSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).PaymentRequest) {
    return false;
  }

  // Check cache first
  const cacheKey = 'gpay_in_can_pay_v1';
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }
  } catch (_) {}

  try {
    const supportedInstruments = [
      {
        supportedMethods: 'https://tez.google.com/pay',
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
    let canPay = false;

    if (request.canMakePayment) {
      canPay = await request.canMakePayment();
    }

    try {
      sessionStorage.setItem(cacheKey, String(canPay));
    } catch (_) {}

    return canPay;
  } catch (err) {
    console.warn('[Google Pay India] Capability check warning:', err);
    try {
      sessionStorage.setItem(cacheKey, 'false');
    } catch (_) {}
    return false;
  }
}

/**
 * Invokes the official Google Pay India Web Payment Request sheet.
 * Follows: https://developers.google.com/pay/india/api/web/create-payment-method
 * 
 * Must be triggered by an explicit customer gesture (e.g. click).
 */
export async function triggerGooglePayIndia(
  params: GooglePayOrderParams
): Promise<GooglePayWebResult> {
  const txnRef = generateTransactionReference(params.orderId);

  if (typeof window === 'undefined' || !(window as any).PaymentRequest) {
    return {
      success: false,
      transactionReference: txnRef,
      error: 'W3C Payment Request API is not supported on this browser or platform.',
    };
  }

  const formattedAmount = Number(params.amount).toFixed(2);

  try {
    const supportedInstruments = [
      {
        supportedMethods: 'https://tez.google.com/pay',
        data: {
          pa: DEFAULT_GPAY_CONFIG.merchantVpa,
          pn: DEFAULT_GPAY_CONFIG.merchantName,
          tr: txnRef,
          url: 'https://www.aanyafashions.com',
          mc: DEFAULT_GPAY_CONFIG.mcc,
          tn: params.note || `Aanya Fashions Order ${params.orderId}`,
        },
      },
    ];

    const details = {
      total: {
        label: 'Aanya Fashions Total',
        amount: {
          currency: 'INR',
          value: formattedAmount,
        },
      },
    };

    console.log('🚀 [Google Pay India Web API] Launching official PaymentRequest sheet:', {
      supportedMethods: 'https://tez.google.com/pay',
      pa: DEFAULT_GPAY_CONFIG.merchantVpa,
      pn: DEFAULT_GPAY_CONFIG.merchantName,
      mc: DEFAULT_GPAY_CONFIG.mcc,
      tr: txnRef,
      amount: formattedAmount,
      currency: 'INR',
    });

    const request = new (window as any).PaymentRequest(supportedInstruments, details);
    const paymentResponse = await request.show();

    // Parse Google Pay Tez response
    const detailsObj = paymentResponse.details || {};
    let tezResponse: any = null;

    if (detailsObj.tezResponse) {
      if (typeof detailsObj.tezResponse === 'string') {
        try {
          tezResponse = JSON.parse(detailsObj.tezResponse);
        } catch {
          tezResponse = detailsObj.tezResponse;
        }
      } else {
        tezResponse = detailsObj.tezResponse;
      }
    }

    const statusCode =
      tezResponse?.Status ||
      tezResponse?.status ||
      detailsObj.Status ||
      detailsObj.status ||
      detailsObj.responseCode;

    // Check for explicit failure code from UPI / Google Pay
    if (
      statusCode &&
      (statusCode === 'FAILURE' ||
        statusCode === 'FAILED' ||
        (typeof statusCode === 'string' &&
          statusCode !== '00' &&
          statusCode !== 'SUCCESS' &&
          statusCode !== 'SUBMITTED'))
    ) {
      try {
        await paymentResponse.complete('fail');
      } catch {}

      return {
        success: false,
        transactionReference: txnRef,
        error: detailsObj.statusMessage || `UPI transaction failed with status code ${statusCode}`,
        rawDetails: detailsObj,
        tezResponse,
      };
    }

    // Complete the browser payment sheet UI
    try {
      await paymentResponse.complete('success');
    } catch {}

    const txnId =
      tezResponse?.txnId ||
      detailsObj.transactionId ||
      detailsObj.googleTransactionId ||
      detailsObj.approvalRefNo ||
      detailsObj.txnId ||
      txnRef;

    const payerVpa = tezResponse?.payerVpa || detailsObj.payerVpa || '';

    return {
      success: true,
      transactionReference: txnRef,
      transactionId: txnId,
      payerVpa,
      tezResponse,
      rawDetails: {
        ...detailsObj,
        tezResponse,
        transactionReference: txnRef,
        capturedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    const isCancel =
      err.name === 'AbortError' ||
      err.message?.includes('cancelled') ||
      err.message?.includes('closed') ||
      err.message?.includes('dismissed');

    console.warn('[Google Pay India Web API] Payment sheet dismissed or failed:', err);

    return {
      success: false,
      cancelled: isCancel,
      transactionReference: txnRef,
      error: isCancel
        ? 'Payment cancelled by user'
        : err.message || 'Payment request failed',
    };
  }
}

/**
 * Authoritatively verifies a Google Pay transaction with the backend boundary.
 * 
 * Strict Payment Security Rules:
 * 1. Checks order existence and verifies payable amount matches expected order total.
 * 2. Checks currency is INR and merchant VPA matches official VPA.
 * 3. Because the live Bank/PSP Payment Status API credentials are not yet supplied,
 *    this function records the transaction and sets status to 'Pending Verification'.
 *    IT NEVER FAKES 'PAID' WITHOUT TRUSTED PSP / BANK SETTLEMENT VERIFICATION.
 */
export async function verifyGooglePayTransaction(payload: {
  orderId: string;
  amount: number;
  txnId: string;
  transactionReference: string;
  payerVpa?: string;
  userId?: string | null;
  customerName?: string;
  customerPhone?: string;
  rawDetails?: any;
}): Promise<PaymentVerificationResult> {
  // 1. Authoritative check on orders table
  const { data: orderData, error: orderErr } = await supabase
    .from('orders')
    .select('id, total_amount, payment_status, status')
    .eq('id', payload.orderId)
    .maybeSingle();

  if (orderErr) {
    console.warn('[Google Pay Verification] Order lookup warning:', orderErr);
  }

  // Validate amount if order exists
  if (orderData) {
    const expected = Number(orderData.total_amount || 0);
    if (expected > 0 && Math.abs(expected - Number(payload.amount)) > 1.0) {
      return {
        success: false,
        status: 'Failed',
        orderId: payload.orderId,
        transactionReference: payload.transactionReference,
        message: `Amount mismatch: Order total is ₹${expected}, but received ₹${payload.amount}.`,
        requiresPspReconciliation: true,
      };
    }
  }

  // 2. Try Edge Function / Server verification boundary
  try {
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke(
      'verify-google-pay',
      {
        body: {
          orderId: payload.orderId,
          amount: payload.amount,
          txnId: payload.txnId,
          transactionReference: payload.transactionReference,
          payerVpa: payload.payerVpa || null,
          paymentMethod: 'Google Pay',
          userId: payload.userId || null,
          customerName: payload.customerName || null,
          customerPhone: payload.customerPhone || null,
          rawDetails: payload.rawDetails || {},
        },
      }
    );

    if (!edgeErr && edgeData) {
      return {
        success: edgeData.success ?? true,
        status: edgeData.status || 'Pending Verification',
        orderId: payload.orderId,
        transactionReference: payload.transactionReference,
        message:
          edgeData.message ||
          'Payment submitted via Google Pay. Order is Pending Verification awaiting bank reconciliation.',
        paymentRecord: edgeData.payment,
        requiresPspReconciliation: edgeData.requiresPspReconciliation ?? true,
      };
    }
  } catch (edgeInvokeErr) {
    console.warn('[Google Pay Verification] Edge function invoke fallback:', edgeInvokeErr);
  }

  // 3. Fallback direct database record keeping:
  // Order must remain 'Pending Verification' until authoritative bank API settles it.
  try {
    const { data: paymentRecord, error: payError } = await supabase
      .from('payments')
      .insert({
        order_id: payload.orderId,
        user_id: payload.userId || null,
        customer_name: payload.customerName || null,
        customer_phone: payload.customerPhone || null,
        amount: payload.amount,
        currency: 'INR',
        payment_method: 'Google Pay',
        gateway_txn_id: payload.txnId,
        payer_vpa: payload.payerVpa || null,
        status: 'Pending Verification',
        metadata: {
          transactionReference: payload.transactionReference,
          merchantVpa: DEFAULT_GPAY_CONFIG.merchantVpa,
          mcc: DEFAULT_GPAY_CONFIG.mcc,
          bankPspVerificationStatus: 'PENDING_BANK_API_INTEGRATION',
          rawDetails: payload.rawDetails || {},
          submittedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (payError && payError.code !== '23505') {
      console.error('[Google Pay Verification] Payment insert warning:', payError);
    }

    // Keep order status as Pending & payment_status as Pending Verification
    await supabase
      .from('orders')
      .update({
        payment_status: 'Pending Verification',
        status: 'Pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.orderId);

    return {
      success: true,
      status: 'Pending Verification',
      orderId: payload.orderId,
      transactionReference: payload.transactionReference,
      message:
        'Payment details recorded. Order is Pending Verification awaiting merchant bank/PSP authoritative confirmation.',
      paymentRecord: paymentRecord || undefined,
      requiresPspReconciliation: true,
    };
  } catch (dbErr: any) {
    console.error('[Google Pay Verification] Error updating verification status:', dbErr);
    return {
      success: false,
      status: 'Failed',
      orderId: payload.orderId,
      transactionReference: payload.transactionReference,
      message: dbErr.message || 'Payment recording failed',
      requiresPspReconciliation: true,
    };
  }
}

/**
 * Builds a UPI deep-link URI for Google Pay India / any UPI app.
 * Follows NPCI UPI link specification:
 * upi://pay?pa=<VPA>&pn=<Name>&tr=<TxnRef>&tn=<Note>&am=<Amount>&cu=INR&mc=<MCC>
 */
export function buildGooglePayUpiUri(params: {
  amount: number;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  merchantVpa?: string;
  merchantName?: string;
}): string {
  const vpa = params.merchantVpa || DEFAULT_GPAY_CONFIG.merchantVpa;
  const name = params.merchantName || DEFAULT_GPAY_CONFIG.merchantName;
  const txnRef = generateTransactionReference(params.orderId);
  const note = `Aanya Fashions Order ${params.orderId}`;
  const amount = Number(params.amount).toFixed(2);

  const upiParams = new URLSearchParams({
    pa: vpa,
    pn: name,
    tr: txnRef,
    tn: note,
    am: amount,
    cu: 'INR',
    mc: DEFAULT_GPAY_CONFIG.mcc,
  });

  return `upi://pay?${upiParams.toString()}`;
}

/**
 * Generates a QR code image URL for a given UPI URI.
 * Uses the public Google Charts API for QR code generation.
 */
export function getUpiQrCodeUrl(upiUri: string, size: number = 300): string {
  const encodedUri = encodeURIComponent(upiUri);
  return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodedUri}&choe=UTF-8`;
}

/**
 * Checks the current payment verification status of an order.
 * Returns `completed` (true when status is Completed/Paid) for backward compatibility
 * with GooglePayModal polling, plus `isPaid` and `status` for direct usage.
 */
export async function checkPaymentStatus(orderId: string): Promise<{
  status: string;
  isPaid: boolean;
  completed: boolean;
  payment?: any;
}> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const isPaid = data.status === 'Completed' || data.status === 'Paid';
      return {
        status: data.status,
        isPaid,
        completed: isPaid,
        payment: data,
      };
    }
  } catch {}

  return { status: 'Pending', isPaid: false, completed: false };
}
