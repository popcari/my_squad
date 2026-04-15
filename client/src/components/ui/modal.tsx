'use client';

import { useAnimatedMount } from '@/hooks/use-animated-mount';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes for the white panel (size, padding, etc.). */
  panelClassName?: string;
  /** ARIA label for the dialog. */
  ariaLabel?: string;
  /** Stack above other modals when nested. Default 50. */
  zIndex?: number;
}

/**
 * Bottom-sheet style modal: slides up from the bottom on open and down on
 * close. On md+ screens the panel is centred but still uses the same
 * vertical-slide animation. Backdrop fades in/out.
 *
 * Body scroll is locked while open and Escape closes the dialog.
 */
export function Modal({
  open,
  onClose,
  children,
  panelClassName = '',
  ariaLabel,
  zIndex = 50,
}: ModalProps) {
  const { mounted, visible } = useAnimatedMount(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{ zIndex }}
      className="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-card border border-border shadow-2xl w-full md:max-w-lg rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto transition-transform duration-200 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        } ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
