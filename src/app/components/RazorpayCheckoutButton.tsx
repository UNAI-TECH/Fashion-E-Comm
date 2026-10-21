import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { openRazorpayCheckout, RazorpayPaymentSuccessResponse } from '../../lib/razorpay';
import api from '../../lib/api';
import { toast } from 'sonner';

export interface RazorpayCheckoutButtonProps {
  amount: number; // in Rupees
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  buttonText?: string;
  className?: string;
  onPaymentSuccess?: (response: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => void;
  onPaymentError?: (error: Error) => void;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  buttonText,
  className = '',
  onPaymentSuccess,
  onPaymentError
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const generatedOrderId = orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await openRazorpayCheckout({
        orderId: generatedOrderId,
        amount, // in Rupees; openRazorpayCheckout converts to paise
        customerName,
        customerEmail,
        customerPhone,
        onSuccess: async (rzpResponse: RazorpayPaymentSuccessResponse) => {
          try {
            // Verify payment signature on backend
            const verifyRes = await api.payments.verifyPayment({
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_signature: rzpResponse.razorpay_signature,
              order_id: generatedOrderId,
              amount
            });

            if (verifyRes.success) {
              toast.success('Payment verified successfully!');
              if (onPaymentSuccess) {
                onPaymentSuccess({
                  paymentId: rzpResponse.razorpay_payment_id,
                  orderId: rzpResponse.razorpay_order_id,
                  signature: rzpResponse.razorpay_signature
                });
              }
            } else {
              toast.error(verifyRes.message || 'Payment signature verification failed.');
            }
          } catch (verifyErr: any) {
            toast.error(verifyErr.message || 'Verification failed');
            if (onPaymentError) onPaymentError(verifyErr);
          } finally {
            setLoading(false);
          }
        },
        onError: (err: any) => {
          setLoading(false);
          const msg = err.message || 'Payment failed or was cancelled.';
          toast.error(msg);
          if (onPaymentError) onPaymentError(err);
        },
        onDismiss: () => {
          setLoading(false);
          toast.info('Checkout cancelled');
        }
      });
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Could not initiate checkout');
      if (onPaymentError) onPaymentError(err);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#698156] hover:bg-[#546944] active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>{buttonText || `Pay ₹${amount.toLocaleString('en-IN')} with Razorpay`}</span>
        </>
      )}
    </button>
  );
};
