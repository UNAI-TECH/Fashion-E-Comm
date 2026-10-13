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
 * Follows Google Pay Brand Guidelines:
 * https://developers.google.com/pay/api/web/guides/brand-guidelines
 * 
 * Requirements:
 * - Black (#000000) button with white Google Pay mark
 * - Minimum height 48px, full width
 * - Rounded corners (pill or rounded-lg)
 * - Uses the official "G Pay" mark SVG
 * - Clear loading, disabled, and active states
 * - Accessible aria-label
 */
export function GooglePayOfficialButton({
  amount,
  isProcessing = false,
  isSupported = true,
  onClick,
}: GooglePayOfficialButtonProps) {
  return (
    <div className="w-full flex flex-col items-center gap-1.5">
      <button
        type="button"
        id="google-pay-button"
        aria-label={`Pay ₹${Number(amount).toLocaleString('en-IN')} with Google Pay`}
        disabled={isProcessing}
        onClick={onClick}
        className="w-full h-[52px] bg-black hover:bg-[#1a1a1a] active:bg-[#333] text-white rounded-[26px] flex items-center justify-center gap-3 px-8 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none relative overflow-hidden group"
        style={{ minWidth: '240px' }}
      >
        {/* Subtle hover shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

        {isProcessing ? (
          <div className="flex items-center gap-2.5 text-sm font-medium relative z-10">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Opening Google Pay…</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 relative z-10">
            {/* Official Google Pay mark — white version on dark background */}
            {/* Based on: https://developers.google.com/pay/api/web/guides/brand-guidelines */}
            <svg
              width="62"
              height="28"
              viewBox="0 0 62 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Google "G" multicolor mark */}
              <path d="M29.76 14.28c0-.72-.06-1.41-.18-2.08H16.12v3.93h7.64c-.33 1.76-1.33 3.25-2.84 4.25v3.53h4.6c2.69-2.48 4.24-6.12 4.24-9.63z" fill="#4285F4"/>
              <path d="M16.12 24.5c3.84 0 7.07-1.27 9.43-3.45l-4.6-3.53c-1.28.86-2.92 1.37-4.83 1.37-3.71 0-6.86-2.51-7.98-5.88H3.4v3.65c2.35 4.65 7.15 7.84 12.72 7.84z" fill="#34A853"/>
              <path d="M8.14 13.01a8.22 8.22 0 010-5.24V4.12H3.4a13.83 13.83 0 000 12.54l4.74-3.65z" fill="#FBBC04"/>
              <path d="M16.12 3.89c2.09 0 3.97.72 5.45 2.13l4.08-4.08C23.18.76 19.96-.5 16.12-.5 10.55-.5 5.75 2.69 3.4 7.34l4.74 3.65c1.12-3.37 4.27-5.88 7.98-5.88v-1.22z" fill="#EA4335"/>
              {/* "Pay" text */}
              <path d="M40.15 14.12V7.64h3.43c.91 0 1.68.3 2.29.89.63.6.94 1.33.94 2.2 0 .86-.31 1.59-.94 2.18-.61.59-1.38.88-2.29.88h-2.01v.33h-1.42zm1.42-2.75h1.96c.51 0 .93-.16 1.24-.48.32-.32.47-.72.47-1.18 0-.47-.16-.86-.47-1.17-.31-.32-.73-.48-1.24-.48h-1.96v3.31z" fill="white"/>
              <path d="M51.69 14.12l-.62-1.6h-4.33l-.62 1.6H44.7l3.84-6.48h.97l3.62 6.48h-1.44zm-2.79-5.04l-1.55 2.36h3.1l-1.55-2.36z" fill="white"/>
              <path d="M56.71 14.34c-.78 0-1.39-.28-1.85-.85l.49-.39c.34.43.8.64 1.38.64.35 0 .63-.08.86-.25.22-.17.34-.39.34-.66 0-.27-.1-.47-.3-.61-.2-.14-.52-.27-.96-.4-.54-.15-.94-.35-1.2-.58-.27-.23-.4-.55-.4-.96 0-.45.17-.82.51-1.11.34-.29.76-.43 1.26-.43.74 0 1.3.26 1.68.77l-.48.38c-.28-.38-.68-.57-1.2-.57-.3 0-.55.08-.76.23-.2.15-.31.35-.31.59 0 .22.09.4.28.53.18.13.48.26.89.39.55.17.97.37 1.24.62.28.24.42.57.42.99 0 .48-.18.87-.54 1.17-.36.3-.81.45-1.35.45z" fill="white"/>
            </svg>
            <span className="text-white/60 text-sm font-medium ml-1">
              ₹{Number(amount).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </button>

      {/* Compact trust indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        <span>UPI Direct • {DEFAULT_GPAY_CONFIG.merchantVpa}</span>
      </div>
    </div>
  );
}
