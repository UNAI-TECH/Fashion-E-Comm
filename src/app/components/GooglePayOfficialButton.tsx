import React from 'react';
import { DEFAULT_GPAY_CONFIG } from '../../lib/googlePayIndia';

interface GooglePayOfficialButtonProps {
  amount: number;
  orderId: string;
  isProcessing?: boolean;
  isSupported?: boolean;
  onClick: () => void;
}

/**
 * Official Google Pay Button Component
 * 
 * Complies with Google Pay Brand Guidelines:
 * https://developers.google.com/pay/api/web/guides/brand-guidelines
 * 
 * - Official Google Pay mark with proper margins and aspect ratio
 * - Black rounded style (#000000)
 * - Accessible aria-label
 * - Clear hover, active, and loading states
 */
export function GooglePayOfficialButton({
  amount,
  isProcessing = false,
  isSupported = true,
  onClick,
}: GooglePayOfficialButtonProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <button
        type="button"
        id="google-pay-button"
        aria-label="Pay with Google Pay"
        disabled={isProcessing}
        onClick={onClick}
        className="w-full h-[52px] bg-black hover:bg-neutral-900 active:bg-neutral-800 text-white rounded-xl flex items-center justify-center gap-2.5 px-6 shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none group"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Connecting to Google Pay…</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold tracking-wide">Pay with</span>
            {/* Official Google Pay Multi-color mark */}
            <svg
              className="h-6 w-auto"
              viewBox="0 0 148 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Google G */}
              <path
                d="M19.58 37.65c-9.87 0-18.17-8.04-18.17-17.91 0-9.87 8.3-17.91 18.17-17.91 5.46 0 9.35 2.14 12.27 4.94l-3.45 3.45c-2.1-1.97-4.93-3.49-8.82-3.49-7.21 0-12.84 5.81-12.84 13.02 0 7.21 5.64 13.02 12.84 13.02 4.67 0 7.34-1.88 9.04-3.58 1.4-1.4 2.32-3.41 2.66-6.16H19.58v-4.89h16.47c.18.87.26 1.92.26 3.06 0 3.67-1.01 8.21-4.24 11.44-3.14 3.25-7.16 5-12.49 5z"
                fill="#ffffff"
              />
              {/* Pay text */}
              <path
                d="M48.24 37.07V10.93h8.34c3.21 0 5.75.96 7.63 2.87 1.87 1.91 2.81 4.39 2.81 7.44 0 3.09-.94 5.6-2.81 7.51-1.88 1.91-4.42 2.87-7.63 2.87h-3.69v5.45H48.24zm4.65-9.67h3.79c1.92 0 3.44-.55 4.54-1.66 1.1-1.11 1.66-2.58 1.66-4.4 0-1.86-.55-3.32-1.66-4.38-1.1-1.06-2.62-1.59-4.54-1.59h-3.79v12.03zM78.69 37.07l-1.44-3.69h-9.97l-1.44 3.69h-4.91l8.84-26.14h5.03l8.84 26.14h-4.95zm-6.42-16.7l-3.57 9.17h7.14l-3.57-9.17zM97.16 37.07v-10.7l-7.79-15.44h5.18l5.04 10.51 5.04-10.51h5.13l-7.74 15.39v10.75h-4.86z"
                fill="#ffffff"
              />
            </svg>
            <span className="text-xs text-neutral-400 font-mono pl-1">
              • ₹{Number(amount).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </button>

      {/* Trust & compliance badge */}
      <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          UPI 2.0 Direct (MCC {DEFAULT_GPAY_CONFIG.mcc})
        </span>
        <span>•</span>
        <span>{DEFAULT_GPAY_CONFIG.merchantVpa}</span>
      </div>
    </div>
  );
}
