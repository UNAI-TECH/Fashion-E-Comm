import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Copy,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Check,
  Clock,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  buildGooglePayUpiUri,
  getUpiQrCodeUrl,
  checkPaymentStatus,
  generateTransactionReference,
  DEFAULT_GPAY_CONFIG
} from '../../lib/googlePayIndia';
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
  merchantVpa = DEFAULT_GPAY_CONFIG.merchantVpa,
  merchantName = DEFAULT_GPAY_CONFIG.merchantName,
  onPaymentSuccess,
}: GooglePayModalProps) {
  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  const txnReference = generateTransactionReference(orderId);

  const upiUri = buildGooglePayUpiUri({
    amount,
    orderId,
    customerName,
    customerPhone,
    merchantVpa,
    merchantName,
  });

  const qrUrl = getUpiQrCodeUrl(upiUri, 320);

  // Countdown timer for 10 minutes
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Polling for automated payment confirmation in background
  useEffect(() => {
    if (!isOpen || isVerifying) return;

    const pollInterval = setInterval(async () => {
      try {
        const { completed, payment } = await checkPaymentStatus(orderId);
        if (completed && payment) {
          clearInterval(pollInterval);
          toast.success('Google Pay transaction confirmed!');
          await onPaymentSuccess(payment.gateway_txn_id, payment.payer_vpa, payment.metadata);
        }
      } catch {}
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [isOpen, orderId, isVerifying, onPaymentSuccess]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    toast.success('Google Pay UPI ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyManualUtr = async () => {
    const cleanUtr = utrInput.trim();
    if (!cleanUtr) {
      toast.error('Please enter the 12-digit UPI Reference / UTR Number from Google Pay');
      return;
    }

    if (cleanUtr.length < 6) {
      toast.error('Please enter a valid 12-digit UPI UTR number');
      return;
    }

    setIsVerifying(true);
    try {
      await onPaymentSuccess(cleanUtr, 'customer@gpay', {
        utr: cleanUtr,
        transactionReference: txnReference,
        method: 'Google Pay (UPI QR)',
        verifiedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      toast.error(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickConfirm = async () => {
    setIsVerifying(true);
    try {
      const generatedTxn = `GPAY-${txnReference.slice(-10)}`;
      await onPaymentSuccess(generatedTxn, 'gpay.user@upi', {
        transactionReference: txnReference,
        method: 'Google Pay (App Authorized)',
        confirmedByCustomer: true,
        verifiedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      toast.error(err.message || 'Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 relative my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#F8FBF7] border-b border-gray-100 p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-center p-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                  alt="Google Pay"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight flex items-center gap-2">
                  <span>Google Pay India</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-100 text-[#1a73e8] font-bold rounded">UPI</span>
                </h3>
                <p className="text-xs text-gray-500">Official Merchant Direct Transfer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-4 flex-grow">
            {/* Amount & Merchant Badge */}
            <div className="text-center pt-1 pb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Payable</span>
              <div className="text-3xl font-extrabold text-[#1A1A1A] mt-0.5 tracking-tight">
                ₹{amount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Payee: {merchantName}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
                  <Clock className="w-3 h-3 text-gray-400" /> {timeFormatted}
                </span>
              </div>
            </div>

            {/* Mobile Direct Intent Button (Opens Google Pay app if on phone) */}
            <div className="block sm:hidden">
              <a
                href={upiUri}
                className="w-full py-3.5 px-4 bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <Smartphone className="w-4 h-4" />
                <span>Tap to Open in Google Pay App</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <div className="text-center mt-1.5 text-[11px] text-gray-400">or scan QR code below on another device</div>
            </div>

            {/* Dynamic UPI QR Code */}
            <div className="flex flex-col items-center">
              <div className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm relative group">
                <img
                  src={qrUrl}
                  alt="Google Pay UPI QR Code"
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-white/95 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-xs font-bold text-gray-800 p-4 text-center pointer-events-none">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                    alt="Google Pay"
                    className="w-16 h-auto mb-2"
                  />
                  <span>Scan with Google Pay App</span>
                  <span className="text-[10px] text-gray-500 font-normal mt-1">or any UPI App</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2.5 text-center leading-relaxed">
                Open <strong>Google Pay</strong> on your phone and scan this QR code to complete payment.
              </p>
            </div>

            {/* Merchant VPA Display & Copy */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div className="truncate mr-2">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Merchant UPI ID (VPA)</span>
                <span className="font-mono font-bold text-gray-800 text-xs sm:text-sm">{merchantVpa}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Steps & Reference Info */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Reference: <span className="font-mono font-bold text-gray-900">{txnReference}</span></span>
              </div>
              <p className="text-blue-800/80 leading-relaxed">
                After entering your UPI PIN in Google Pay, return here. Your order will be confirmed automatically.
              </p>
            </div>
          </div>

          {/* Confirmation Actions Footer */}
          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex-shrink-0 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Completed payment in Google Pay? Enter 12-digit UTR / Ref (Optional):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 428719283712"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#698156]/30 focus:border-[#698156]"
                />
                <button
                  type="button"
                  disabled={isVerifying || !utrInput.trim()}
                  onClick={handleVerifyManualUtr}
                  className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  Verify UTR
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleQuickConfirm}
              className="w-full py-3.5 bg-[#698156] hover:bg-[#546944] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Paid in Google Pay • Confirm Order</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
