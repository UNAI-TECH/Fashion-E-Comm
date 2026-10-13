import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadGooglePayScript,
  isGooglePayWebReady,
  createGooglePayButton,
  loadGooglePayPaymentData,
  type GooglePayWebResult,
} from '../../lib/googlePayWebApi';
import { Shield } from 'lucide-react';

interface GooglePayWebButtonProps {
  amount: number;
  orderId: string;
  onPaymentSuccess: (result: GooglePayWebResult) => Promise<void>;
  onPaymentError?: (error: string) => void;
  onPaymentCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Official Google Pay Web Button Component
 * 
 * Uses the official Google Pay JavaScript library (pay.js) to render
 * a properly branded Google Pay button via the API's createButton method.
 * 
 * This button handles card payments through Google Pay's saved cards.
 * For UPI payments in India, use the GooglePayOfficialButton component instead.
 */
export function GooglePayWebButton({
  amount,
  orderId,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  disabled = false,
  className = '',
}: GooglePayWebButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);

  const handleClick = useCallback(async () => {
    if (isProcessing || disabled) return;
    
    setIsProcessing(true);
    try {
      const result = await loadGooglePayPaymentData(amount, orderId);
      
      if (result.success) {
        await onPaymentSuccess(result);
      } else if (result.cancelled) {
        onPaymentCancel?.();
      } else {
        onPaymentError?.(result.error || 'Payment failed');
      }
    } catch (err: any) {
      onPaymentError?.(err.message || 'Unexpected error during payment');
    } finally {
      setIsProcessing(false);
    }
  }, [amount, orderId, isProcessing, disabled, onPaymentSuccess, onPaymentError, onPaymentCancel]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadGooglePayScript();
        const ready = await isGooglePayWebReady();
        if (mounted) {
          setIsReady(ready);
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setIsReady(false);
          setIsLoading(false);
        }
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  // Render the official Google Pay button when ready
  useEffect(() => {
    if (!isReady || !buttonContainerRef.current || buttonRendered.current) return;

    try {
      const button = createGooglePayButton(handleClick);
      // Style the button container
      button.style.width = '100%';
      button.style.minHeight = '48px';
      buttonContainerRef.current.innerHTML = '';
      buttonContainerRef.current.appendChild(button);
      buttonRendered.current = true;
    } catch (err) {
      console.warn('[GooglePayWebButton] Failed to create button:', err);
    }
  }, [isReady, handleClick]);

  if (isLoading) {
    return (
      <div className={`w-full flex items-center justify-center py-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Checking Google Pay availability…
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={`w-full text-center py-3 text-xs text-gray-400 ${className}`}>
        Google Pay card payments not available in this browser.
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {isProcessing ? (
        <div className="w-full h-[48px] bg-black rounded-lg flex items-center justify-center gap-2 text-white text-sm">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing via Google Pay…
        </div>
      ) : (
        <div ref={buttonContainerRef} className="w-full" style={{ minHeight: '48px' }} />
      )}
      <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-gray-400">
        <Shield className="w-3 h-3 text-green-500" />
        <span>Card payments via Google Pay • Secured by your bank</span>
      </div>
    </div>
  );
}
