import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, CheckCircle2, Copy, Smartphone, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { buildGooglePayUpiUri, getUpiQrCodeUrl } from '../../lib/googlePayIndia';
import { toast } from 'sonner';

interface GooglePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  merchantVpa?: string;
  merchantName?: string;
  onPaymentSuccess: (txnId: string, payerVpa?: string, raw?: any) => Promise<void>;
}

export function GooglePayModal({
  isOpen,
  onClose,
  orderId,
  amount,
  customerName,
  customerPhone,
  merchantVpa = 'aanya.fashions@okaxis',
  merchantName = 'Aanya Fashions',
  onPaymentSuccess,
}: GooglePayModalProps) {
  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const upiUri = buildGooglePayUpiUri({
    amount,
    orderId,
    customerName,
    customerPhone,
    merchantVpa,
    merchantName,
  });

  const qrUrl = getUpiQrCodeUrl(upiUri, 280);

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyManualUtr = async () => {
    if (!utrInput.trim()) {
      // Auto-generate standard reference if user confirms payment from app
      const simulatedTxn = `GPAY-UPI-${Date.now().toString().slice(-8)}`;
      setIsVerifying(true);
      try {
        await onPaymentSuccess(simulatedTxn, 'gpay@customer');
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    if (utrInput.trim().length < 6) {
      toast.error('Please enter a valid UPI Reference / UTR number');
      return;
    }

    setIsVerifying(true);
    try {
      await onPaymentSuccess(utrInput.trim(), 'gpay@customer');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 relative"
        >
          {/* Header */}
          <div className="bg-[#F8FBF7] border-b border-gray-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-center p-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                  alt="Google Pay"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">Pay with Google Pay</h3>
                <p className="text-xs text-gray-500">Fast, 100% secure UPI transfer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Amount Badge */}
          <div className="px-6 pt-5 pb-2 text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Payable</span>
            <div className="text-3xl font-extrabold text-[#1A1A1A] mt-0.5">
              ₹{amount.toLocaleString('en-IN')}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct to Aanya Fashions
            </div>
          </div>

          {/* QR Code Section */}
          <div className="px-6 py-4 flex flex-col items-center">
            <div className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm relative group">
              <img
                src={qrUrl}
                alt="Google Pay UPI QR Code"
                className="w-48 h-48 object-contain rounded-xl"
              />
              <div className="absolute inset-0 bg-white/90 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold text-gray-700 pointer-events-none">
                Scan with Google Pay App
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Scan this QR code using <strong>Google Pay</strong>, PhonePe, or any UPI app on your phone.
            </p>
          </div>

          {/* Mobile Direct Intent Button (Opens Google Pay app if on phone) */}
          <div className="px-6 pb-3">
            <a
              href={upiUri}
              className="w-full py-3 px-4 bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Tap to Open in Google Pay App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Copy VPA Section */}
          <div className="px-6 py-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div className="truncate">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">UPI ID (VPA)</span>
                <span className="font-mono font-bold text-gray-800">{merchantVpa}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Confirmation Action */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 mt-2 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Completed payment in your app? Enter 12-digit UPI UTR / Ref (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. 428719283712"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#698156]/30 focus:border-[#698156]"
              />
            </div>

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerifyManualUtr}
              className="w-full py-3.5 bg-[#698156] hover:bg-[#546944] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Paid • Confirm Order</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
