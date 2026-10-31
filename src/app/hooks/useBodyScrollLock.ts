import { useEffect } from 'react';

// Reference counter so multiple stacked modals don't prematurely unlock body scroll
let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';

/**
 * Custom hook to lock background scrolling across desktop and mobile
 * whenever any modal, popup, drawer, or lightbox is open.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    if (typeof document === 'undefined') return;

    lockCount++;

    if (lockCount === 1) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      // Compensate for disappearing scrollbar on desktop to prevent layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow || '';
        document.documentElement.style.overflow = originalHtmlOverflow || '';
        document.body.style.paddingRight = originalBodyPaddingRight || '';
      }
    };
  }, [isLocked]);
}
